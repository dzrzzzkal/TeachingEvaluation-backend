// 验证token
const jwt = require('jsonwebtoken')
const serectKey = require('@/config/tokenSecretKey')

module.exports = (tokens) => {
  const secret = serectKey()  // 获取密钥
  if(tokens) {
    let token = tokens.split(' ')[1]
    let verify = jwt.verify(token, secret)
    return verify
  }
}