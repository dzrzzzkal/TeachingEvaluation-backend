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

const config = require('./config/default')

const index = require('./routes/index')
const users = require('./routes/users')
const admin = require('./routes/admin')
const adminLogin = require('./routes/admin/account/login')
const adminLogout = require('./routes/admin/account/logout')
const register = require('./routes/admin/account/register')

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
app.use(cors())


// 写一个中间件配置公共的信息
app.use(async (ctx, next) => {
  ctx.state.userInfo = 'aaa'
  await next()  // 继续向下匹配路由
})

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
app.use(users.routes(), users.allowedMethods())
app.use(admin.routes(), admin.allowedMethods())
app.use(adminLogin.routes(), adminLogin.allowedMethods())
// app.use(adminLogout.routes(), adminLogout.allowedMethods())
app.use(register.routes(), register.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
