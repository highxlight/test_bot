module.exports = {
    env: {
        browser: true,
        commonjs: true,
        // es2022: true,
    },
    extends: ["standard", "prettier"],
    parserOptions: {
        ecmaVersion: "latest",
    },
    rules: {
        "no-unused-vars": "off",
        camelcase: 'off'
    },
};
