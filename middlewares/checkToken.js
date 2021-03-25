const proving = require('@/token/proving')

const checkToken = (ctx) => {
  let token = ctx.request.header.authorization
  console.log('---checkToken-ctx.request: ')
  console.log('ctx.request.method: ' + ctx.request.method)
  console.log('ctx.request.url: ' + ctx.request.url)
  if(token) {
    let res = proving(token)
    let { jobid, user, time, timeout } = res
    let data = new Date().getTime()

    if(res && data - time <= timeout) {
      return {
        code: 200,
        tokenCode: 200,
        jobid: jobid,
        user: user,
        message: 'token 解析成功',
        status: true,  // 登录状态，目前还没用上
      }
    }else {
      return {
        code: 200,  // 暂定200，因为是请求成功了，只是结果是token过期，所以无法访问而已
        tokenCode: 20001,
        jobid: jobid,
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
module.exports = checkToken