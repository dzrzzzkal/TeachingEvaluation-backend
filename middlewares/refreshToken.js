const addToken = require('@/token/addToken')

/**
 * token失效后如何处理，可能有几种情况：
 * 1.token失效要重新登录获取新的token（网页端居多）
 * 2.只要token失效就更新并发送新的token（一般用于APP保持登录状态）
 * 3.token失效一段时间内更新并发送新的token
 * （如何判断失效时间：①checkToken()中return时间 ②再设置一个刚过期没多久的tokenCode（PS：没看到有人这样做）
 */

// 目前这里refreshToken()采用第3种处理方法，
// 但是目前'./localFilter.js'采用的是第1种，vue管理也是
/**
 * 使用方法：
 * let checkResult = await checkToken(ctx) //外部函数先调用checkToken()
 * let refreshResult = await refreshToken(checkResult)
 * vue管理那里增加了响应拦截，返回值有token的话会自动存入token
 */
const refreshToken = async (result) => { // res：checkToken()的返回值
  let { tokenCode, id, user } = result
  if(tokenCode == 20001) {
    let token = await addToken({user, id})

    // ↓好不优雅，考虑怎么改一下
    result.tokenCode = 200
    result.message = 'token 解析成功'
    result.status = true
    result.token = token  // 把token加入result中
  }
  return result
}

module.exports = refreshToken