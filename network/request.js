const axios = require('axios')

// 用于请求微信相关api
exports.request = (config) => {
  const instance = axios.create({
    baseURL: 'https://api.weixin.qq.com',
    method: 'GET',
    // timeout: ,
  })

  instance.interceptors.request.use(config => {

    return config
  }, err => {
    console.log(err)
  })

  instance.interceptors.response.use(res => {
    return res.data   // 为了方便，返回res.data而不是res
  }, err => {
    console.log(err)
  })

  return instance(config)
}