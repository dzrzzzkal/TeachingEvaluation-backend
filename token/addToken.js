const jwt = require('jsonwebtoken')
const serectKey = require('@/config/tokenSecretKey')
// const serect = 'evaluation'  //密钥

/**
 * 
 * token过期怎么办，已过期的token怎么处理？
 */

module.exports = (userinfo) => {  // 创建token并导出
  const secret = serectKey()  // 获取密钥
  // const token = jwt.sign({
  //   user: userinfo.user,
  //   id: userinfo.id
  // }, secret, {expiresIn: '1h'})
  const token = jwt.sign({
    user: userinfo.user,
    id: userinfo.id,
    time: new Date().getTime(),
    // timeout: 1000*60*60*2
    timeout: 1000*6
  }, secret)
  return token
}