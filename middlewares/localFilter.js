/**
 * 参考网址
 * https://www.cnblogs.com/beileixinqing/p/9273243.html
 * 待按↓修改一下：
 * https://blog.csdn.net/wb_001/article/details/79026038
 */

/**
 * 设置中间件，监控在该拦截器后面的所有请求
 * || arr[1] === 'stylesheets' || arr[1] === 'javascripts' || arr[1] === 'images' || arr[1] === 'upload'
 * 将公共目录的文件放在拦截器之前，防止拦截public中的文件，以至于无法加载白名单中的public中的文件，js、css、image
 */

const checkToken = require('./checkToken')
const refreshToken = require('./refreshToken')

// 定义允许直接访问的url
// const allowPage = ['/login', '/api/login'] // 考虑要不要设置api，以后再说吧
// const allowPage = ['/', '/dologin', '/onLogin', '/wxdologin', '/json', '/test']  // 待定，因为目前后端的/login都是POST
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
      // if(url === '/') { // 不知道干嘛的，暂时用来直接访问后端测试的，https://www.cnblogs.com/beileixinqing/p/9273243.html有
      //   ctx.redirect('/string') // 待定
      // }
      console.log('login status validate success. token 有效')
    }

    /**
     * refreshToken()中的result目前修改地很不优雅
     */
    else if(tokenCode == 20001) { // token过期
      console.log('token 已过期')
      let refreshResult = await refreshToken(checkResult)
      console.log('token 已更新')
      /**
       * 如果token过期，为了更新token并next()，先响应一次
       * (即外面调用此方法的app.use()中的参数ctx,像设置ctx.body一样,
       * 我只是设置了ctx.body=,没有写什么返回函数,但是能返回到结果,且结果就是我设置的ctx.body)，
       * 此次响应设置返回值为新的token，并在此次的请求头加上token，以next()
       * PS: 
       * 1.目前感觉累赘了，首先refreshToken()中只返回token就可以了，待修改
       * 2.其次，这里的请求头应该不需要了，因为后续都response了，我是请求了之后，
       * 才来到这里的，此时再修改请求头好像没用
       * 3.login的时候本身要发送的token怎么办，这里会拦截login，然后自动发送有效的token，
       * 那login就没意义了，目前看把login放在最上面试试？
       */
      // let {token, tokenCode} = refreshResult.
      // ctx.response.body = {token, tokenCode}
      ctx.response.body = refreshResult
      // ctx.response.body.status = true
      // ctx.request.header.authorization = 'Bearer ' + refreshResult.token
    }
    else {  // 无token
      console.log('无token')
      // 无token这里，app.use()拦截后的ctx.response.body = undefined，不知道为什么
      // 也不知道会不会有bug，等看补不补充后端的'/login'再说吧
      ctx.redirect('/json')
    }
    /**
     * ！！！！！！！！！！！不能删！！！！！！！
     * ↓以下是后台内部自己判断有无token或过期，因为前台根本进不来，
     * 这里后台直接重定向，后台'/login'待写
     * 考虑要不直接除跨域设定的服务器以外拒绝访问？好像不太好？
     */
    // else { // token无效或无token
    //   console.log('login status validate fail')
    //   // console.log(ctx.request.url)
    //   console.log('ctx')
    //   console.log(ctx)
    //   ctx.redirect('/') // 待定,PS:这里要在上面的allowPage上有，不然会死循环
    // }
  }
  return ctx
}

module.exports = localFilter