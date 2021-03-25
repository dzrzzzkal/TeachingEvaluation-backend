const jwt = require('jsonwebtoken')
const serectKey = require('@/config/tokenSecretKey')

// 待实现token过期处理

module.exports = (userinfo) => {  // 创建token并导出
  const secret = serectKey()  // 获取密钥
  // const token = jwt.sign({
  //   user: userinfo.user,
  //   id: userinfo.id
  // }, secret, {expiresIn: '1h'})
  const token = jwt.sign({
    user: userinfo.user,
    jobid: userinfo.jobid,
    time: new Date().getTime(),
    timeout: 1000*60*60*24*7,  //60mins*24*7
  }, secret)
  return token
}