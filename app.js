const Koa = require('koa')
const app = new Koa()
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const render = require('koa-art-template')
const path = require('path')
const staticCache = require('koa-static-cache')
// const session = require('koa-session')
const session = require('koa-session-minimal')
const MysqlStore = require('koa-mysql-session')
const cors = require('koa2-cors')
const multer = require('@koa/multer') // wx '/api/uploadAnnualReport'中用到
require('module-alias/register')


const config = require('./config/config')
const localFilter = require('./middlewares/localFilter')
const {setSchoolYearAndSemester, setSchoolWeek} = require('@/middlewares/setSchoolYear&Semester&Week')

const index = require('./routes/index')
const api = require('./routes/api')
const adminAccount = require('./routes/account')

// error handler
onerror(app)

// middlewares
// 使用koa-bodyparser来解析提交的表单信息
app.use(bodyparser({
  enableTypes:['json', 'form', 'text'],
  // formLimit: '1mb'
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

// 设置当前学年、学期、学周等
// ↓要每学期都来修改，目前两个地方都用到了
let semesterStartDate = '2021-2-24' // // 正常的该学期开学日期，这里不用改month
global.schoolTime = {
  schoolYearAndSemester: setSchoolYearAndSemester(),
  nowSchoolWeek: setSchoolWeek(semesterStartDate),
}

// 配置koa2-cors中间件，跨域
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


// token拦截，验证
app.use(async (ctx, next) => {
  /**
   * res: token有效时返回'token valid'，
   * 过期时返回refreshToken(包括更新checkToken()结果，添加addToken()结果)，
   * 无token时直接return
   */
  console.log('-----this is a token拦截中间件：')
  let res = await localFilter(ctx)
  ctx = res
  console.log('拦截后的ctx.response.body:')
  console.log(ctx.response.body)
  await next()
})

// 向微信请求、存储和定期更新access_token
const storeAccessToken = require('./middlewares/storeAccessToken')
storeAccessToken()

// 404中间件
app.use(async (ctx, next) => {
  await next()

  if(ctx.status == 404) {
    ctx.status = 404
    ctx.body = '这是一个404页面'
  }else {
    console.log(ctx.url)
  }
})


// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(api.routes(), api.allowedMethods()) // 小程序
app.use(adminAccount.routes(), adminAccount.allowedMethods()) // 网页管理

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
