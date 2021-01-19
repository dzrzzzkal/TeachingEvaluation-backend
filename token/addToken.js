const jwt = require('jsonwebtoken')
const serectKey = require('@/config/tokenSecretKey')
// const serect = 'evaluation'  //密钥

/**
 * 
 * token过期怎么办，已过期一段时间的token怎么处理？
 */

//  ！！！！！！！！！！！！！！！！！！！！！↓
// id改成了jobid，有些用到addToken的地方应该还没改，后面可能还要改，加上随机生成数nonce?

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
    // timeout: 1000*60*60*2
    timeout: 1000*60*60*2,  //60mins*2
  }, secret)
  return token
}