const axios = require("axios");

class AxiosExt {
    // eslint-disable-next-line no-useless-constructor
    constructor(baseUrl, timeoutSeconds = 20) {
        const v = this;
        const service = this.service = axios.create({
            baseURL: baseUrl, // api的base_url  process.env.BASE_API,,注意局域网访问时，不能使用localhost
            timeout: timeoutSeconds * 1000 // 请求超时时间
        })
        // request拦截器,拦截每一个请求加上请求头
        service.interceptors.request.use(config => {
            // config.headers.post['Content-Type'] = 'application/x-www-fromurlencodeed';
            const t = v.tokens;
            if (t) {
                config.headers.Authorization = 'bearer ' + t
            }
            return config
        }, error => {
            console.log(error) // for debug
            Promise.reject(error)
        })

        service.interceptors.response.use(
            response => {
                const res = response.data
                if (res.success) {
                    return response.data
                } else {
                    return Promise.reject(res)
                }
            }, error => {
                return Promise.reject(error)
            })
    }

    setToken(token) {
        this.token = token
    }

    post(url, data) {
        return this.service({
            method: 'post',
            url,
            data
        })
    }

    get(url, params) {
        return this.service({
            method: 'get',
            url,
            params
        })
    }
}

module.exports = AxiosExt;
