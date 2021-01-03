// 验证token
const jwt = require('jsonwebtoken')
const serectKey = require('@/config/tokenSecretKey')

/**
 * https://segmentfault.com/a/1190000017379244
 */
module.exports = (tokens) => {
  const secret = serectKey()  // 获取密钥
  if(tokens) {
    let token = tokens.split(' ')[1]
    // 解析
    // let decoded = jwt.decode(token, secret)
    // return decoded
    let verify = jwt.verify(token, secret)
    return verify
  }
}