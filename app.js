const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const render = require('koa-art-template')
const path = require('path')
// const static = require('koa-static') 这个koa-static是自己写的，下面的app.use(require('koa-static')(__dirname + '/public'))是系统自带的
const staticCache = require('koa-static-cache')
// const session = require('koa-session')
const session = require('koa-session-minimal')
const MysqlStore = require('koa-mysql-session')
const cors = require('koa2-cors')
require('module-alias/register')


const config = require('./config/config')
const localFilter = require('./middlewares/localFilter')

const index = require('./routes/index')
// const users = require('./routes/users')
const admin = require('./routes/admin')
const api = require('./routes/api')
const adminAccount = require('./routes/admin/account')
// const register = require('./routes/admin/account/register')

// error handler
onerror(app)

// middlewares
// 使用koa-bodyparser来解析提交的表单信息
app.use(bodyparser({
  enableTypes:['json', 'form', 'text'],
  formLimit: '1mb'  //不知道是什么东西，看要不要删除！！！！！！
}))
app.use(json())
app.use(logger())
// 使用koa-static配置静态资源，目录为public
app.use(require('koa-static')(__dirname + '/public'))

// 使用koa-static-cache来缓存文件
app.use(staticCache(path.join(__dirname, './public'), {dynamic: true}, {
  maxAge: 365*24*60*60
}))
app.use(staticCache(path.join(__dirname, './images'), {dynamic: true}, {
  maxAge: 365*24*60*60
}))

// app.use(views(__dirname + '/views', {
//   extension: 'pug'
// }))

// 配置 koa-art-template模板引擎
render(app, {
  root: path.join(__dirname, 'views'), //视图的位置
  extname: '.html',  //默认 .art后缀名
  debug: process.env.NODE_ENV !== 'production'  //是否开启调试模式
})

/**
  // 配置koa-session的中间件
  app.keys = ['some secret burr'] // cookie的签名
  const CONFIG = {
    key: 'koa:sess',  // cookie key (default koa:sess)
    maxAge: 5000,  // cookie的过期时间 【需要修改】
    overwrite: true,  // can overwrite or not (default true)
    httpOnly: true, // cookie是否只有服务器端可以获取cookie (default true)
    signed: true, // 签名 默认 true
    rolling: true, // 在每次请求时强行设置cookie，这将重置cookie过期时间 (default false) 【这两个改一个】
    renew: false, // renew session when session is nearly expired (default false) 【这两个改一个】
    autoCommit: true,  // (boolean) automatically commit headers (default true)
    secure: false, // (boolean) secure cookie true的话http不能访问
    sameSite: null, // (string) session cookie sameSite options (default null, don't set it)
  }
  app.use(session(CONFIG, app))
  */

/**
 * MySQL
 * 使用koa-session-minimal``koa-mysql-session来进行数据库的操作
 */
// session存储配置
const sessionMysqlConfig = ({
  database: config.database.DATABASE,
  user: config.database.USERNAME,
  password: config.database.PASSWORD,
  host: config.database.HOST
})
//配置session(koa-session-minimal)中间件
app.use(session({
  key: 'USER_SID',
  store: new MysqlStore(sessionMysqlConfig),
  // cookie: {               // 与cookie相关的配置
  //   domain: 'lcoalhost',  // 写cookie所在的域名
  //   path: '/',            // 写cookie所在的路径
  //   maxAge: 1000*300,     // cookie有效时长
  //   httpOnly: true,       // 是否只用于http请求中获取
  //   overwrite: false      //是否允许重写
  // }
}))


// 配置koa2-cors中间件，跨域
// 待详细配置，参考一下别人的：https://segmentfault.com/q/1010000019446949
// https://blog.csdn.net/qq_34995576/article/details/85005668?utm_medium=distribute.pc_relevant.none-task-blog-BlogCommendFromBaidu-3.control&depth_1-utm_source=distribute.pc_relevant.none-task-blog-BlogCommendFromBaidu-3.control
app.use(cors({
  origin: function (ctx) {
    // 待改
    if (ctx.url === '/doLogin') {
      return "*"; // 允许来自所有域名请求
    }
    return 'http://localhost:8080'
    // return 'http://localhost:8080'
  },
  exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 5,
  credentials: true,
  allowMethods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
}))

// 写一个中间件配置公共的信息
// app.use(async (ctx, next) => {
//   ctx.state.userInfo = 'aaa'
//   await next()  // 继续向下匹配路由
// })

// token拦截，验证
/**
 * 根据localFilter有两种，
 * 第一种是token过期，只要有token(前台logout才会删除token)，直接更新token，无token的话就导向'/json'，
 * 第二种是token过期的话，都不能获取，要重新登录获取token（目前只有前台有登录功能）
 * 目前采用的是第一种，第二种不能删！！！
 * 
 * ————————————更新：
 * 发现问题，
 * 重复了，前端每次都要先对后端进行一次请求，判断token是否过期，
 * 而只要有路由请求，后端每次都会在这里先拦截，判断token是否过期，因此有时前后台都进行判断，影响性能。
 * -----但是暂时先保持这样，后面再看对哪个改进↑-----
 * （目前前端：会有auth的判断，然后看有无token，需要auth且有token则每次发送请求前会请求'/checkToken'这个URL，否则前端要先登录。
 * 目前后端：目前'/checkToken'中，思路和下面这个拦截器一模一样，因此采用的也是第一种，
 * 如果想改成第二种，可以修改 'localFilter.js'
 * 而即使目前此拦截器和'/checkToken'都会触发localFilter()，但是只会返回一个新的token，因为还没过期）
 */
app.use(async (ctx, next) => {
  /**
   * res: token有效时返回'token valid'，
   * 过期时返回refreshToken(包括更新checkToken()结果，添加addToken()结果)，
   * 无token时直接return
   */
  // 以下的代码包括localFIlter()全都写的好丑陋。。。好sb的逻辑TAT
  console.log('-----this is a token拦截中间件：')
  let res = await localFilter(ctx)
  ctx = res
  console.log('拦截后的ctx.response.body:')
  console.log(ctx.response.body)
  await next()
  /**
   * 第二种 ！！！不能删！！！！
   */
  // await localFilter(ctx)
  // await next()
})

// 向微信请求access_token
const storeAccessToken = require('./API/storeAccessToken')
storeAccessToken()



// 404中间件（貌似可删）
// app.use(async (ctx, next) => {
//   // console.log('这是一个中间件')
//   await next()

//   if(ctx.status == 404) {
//     ctx.status = 404
//     ctx.body = '这是一个404页面'
//   }else {
//     console.log(ctx.url)
//   }
// })


// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
// app.use(users.routes(), users.allowedMethods()) // 不要的
app.use(admin.routes(), admin.allowedMethods())
app.use(api.routes(), api.allowedMethods())
app.use(adminAccount.routes(), adminAccount.allowedMethods())
// app.use(register.routes(), register.allowedMethods()) // 不要的

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
