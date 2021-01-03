const proving = require('@/token/proving')

  // 检查token状态
  /**
   * 还有token的很多状态，可以通过返回码来判断
   * 目前不确定是只有一个状态码code，还是再分出tokenCode
   * 
   * 
   * 另：access token、refresh token、多请求时token均失效的问题以后待解决
   * 参考：https://segmentfault.com/a/1190000016946316
   */

// let isRefreshing = true
const checkToken = (ctx) => {
  let token = ctx.request.header.authorization
  console.log('---checkToken-ctx.request: ')
  console.log('ctx.request.method: ' + ctx.request.method)
  console.log('ctx.request.url: ' + ctx.request.url)
  if(token) {
    let res = proving(token)
    let { id, user, time, timeout } = res
    let data = new Date().getTime()

    // addtoken.js 中用 {expiresIn: '1h'} 时，↓
    // if(res && res.exp <= new Date()/1000) {
    //   ctx.body = {
    //     message: 'token过期',
    //     code: 500
    //   }
    // }else {
    //   ctx.body = {
    //     message: 'token success',
    //     code: 200
    //   }
    // }
    if(res && data - time <= timeout) {
      return {
        code: 200,
        tokenCode: 200,
        // 这里考虑要不要返回id和user，现在返回是因为方便addToken()
        // 应该也可以不要，到时addToken直接用请求时传来的数据
        // 好像还是要，因为如果get的话没办法发送数据，
        // 或者改成checkToken()之后如果要addToken()，直接调用proving()？
        // 为了方便，暂定返回id，后台返回给前端时筛选出来
        id: id,
        user: user,
        message: 'token 解析成功',
        status: true,  // 登录状态，目前还没用上，不知道要不要弄到数据库去
      }
    }else {
      return {
        code: 200,  // 暂定200，因为是请求成功了，只是结果是token过期，所以无法访问而已
        tokenCode: 20001,
        id: id,
        user: user,
        message: 'token 已过期',
        status: false,
      }
    }
  }else { // 这里no token好像可以去掉，因为前端进行了筛选，需要权限的，如果!token，不会发送请求，会跳转到登录页面
    return {
      code: 500,
      user: '', // 待定，不确定要不要返回
      message: 'no token',
      status: false
    }
  }
}
// 已经登录了
// checkNotLogin: (ctx) => {
//   if (ctx.session && ctx.session.user) {     
//     ctx.redirect('/userlogin');
//     // console.log(ctx.session.user)
//     return false;
//   }
//   return true;
// },
// //没有登录
// checkLogin: (ctx) => {
//   if (!ctx.session || !ctx.session.user) {     
//     ctx.redirect('/register');
//     return false;
//   }
//   return true;
// }

module.exports = checkToken