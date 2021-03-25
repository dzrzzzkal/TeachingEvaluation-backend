const checkToken = require('./checkToken')
const refreshToken = require('./refreshToken')

// 定义允许直接访问的url
const allowPage = require('@/config/allowPage')

// 拦截器
const localFilter = async (ctx) => {
  let url = ctx.originalUrl
  if(allowPage.indexOf(url) > -1) {
    console.log('当前地址可直接访问')
  }else {
    let checkResult = await checkToken(ctx)
    ctx.response.body = checkResult
    let tokenCode = checkResult.tokenCode  // 暂定监测tokenCode
    if(tokenCode == 200) {  // tokenCode==200 表示token有效
      // if(url === '/') { // https://www.cnblogs.com/beileixinqing/p/9273243.html
      //   ctx.redirect('/string') // 待定
      // }
      console.log('login status validate success. token 有效')
    }

    else if(tokenCode == 20001) { // token过期
      console.log('token 已过期')
      let refreshResult = await refreshToken(checkResult)
      console.log('token 已更新')
      ctx.response.body = refreshResult
    }
    else {  // 无token
      console.log('无token')
      ctx.redirect('/404')
    }
  }
  return ctx
}

module.exports = localFilter