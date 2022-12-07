const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const cors = require("@koa/cors");
const path = require("path");
const staticFile = require('koa-static');

const app = new Koa();
app.use(staticFile(
    // eslint-disable-next-line node/no-path-concat
    path.join(__dirname, 'public')
))
const config = require("./config.js");
const botsend = require("./botsend.js");
const {initAll} = require("./system");
const router = new Router();

process.on("uncaughtException", (err) => {
    botsend(`uncaughtException: ${err.message} ${err.stack}`);
    console.error(`uncaughtException: ${err.message} ${err.stack}`);
    process.exit(process.exitCode);
});

const startServer = async () => {
    app.config = config;
    app.context.config = config;
    app.use(cors());
    app.use(bodyParser());
    initAll(app)
    app.use(async (ctx, next) => {
        try {
            await next();
        } catch (e) {
            ctx.body = {
                success: false,
                data: {
                    code: e.code ?? 500,
                    message: e.message,
                    ...(e.extra ? {data: e.extra} : {}),
                },
            };
        }
    });

    router.post("/:service/:logic/:func", async (ctx) => {

        const {service, logic, func} = ctx.params;
        const reqBody = ctx.request.body;

        if (
            !(
                typeof reqBody.data === "object" &&
                reqBody.constructor === Object &&
                /^\w+$/.test(service) &&
                /^\w+$/.test(logic) &&
                /^\w+$/.test(func)
            )
        ) {
            throw new Error("Invalid request body");
        }
        const logicModule = require(path.join(
            __dirname,
            `services/${service}/${logic}.js`
        ));

        const result = await logicModule[func]({
            token: reqBody.token ?? null,
            data: reqBody.data ?? {},
            from: "api",
            ctx,
            makePrivate: () => {
                throw new Error("Cannot call private function");
            },
        });

        ctx.body = {
            success: true,
            data: result ?? {},
        };
    });

    app.use(router.routes()).use(router.allowedMethods());
    app.listen(config.port);

    console.log(`Server is listening on port ${config.port}`);
    return app;
};

startServer();

module.exports = app;
