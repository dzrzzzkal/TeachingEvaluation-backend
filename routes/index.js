const router = require('koa-router')()

const common = require('../module/common')
const userService = require('../controller/mysql')

router.get('/', async (ctx, next) => {
  // await ctx.render('index', {
  //   title: 'Hello Koa 2!'
  // })

  // koa中无法直接设置中文的cookie
  var userInfo = new Buffer('张三').toString('base64')

  ctx.cookies.set('userInfo', userInfo, {
    maxAge: 1000*60*60,
    httpOnly: false,  // true表示这个cookie只有服务器端可以访问，false表示客户端（js）、服务器端都可以访问
    signed: false,
    // secure: true, // 默认false，true表示只有https可以访问
    // path: '/shop',  // 配置可以访问的界面
    // domain: '', // 正常情况不要设置 默认就是当前域下面的所有页面都可以访问 eg: .baidu.com
  })

  // 获取session
  // console.log('session:)
  // console.log(ctx.session.user);

  let list = {
    name: '张三'
  }
  await ctx.render('index', {
    list: list
  })
})

router.get('/userlogin', async (ctx) => {
  // 设置session
  // ctx.session.user='李四'
  // ctx.body = 'login success'

  ctx.body = await userService.findUserData(ctx.session.user)
  console.log(ctx.body)
})

router.get('/string', async (ctx, next) => {
  // ctx.body = 'koa2 string'
  ctx.body = {"code": 20000, "message": "sss", "data": {"status": "UP22"}}
})

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json'
  }
})

// 接受post提交的数据
router.get('/news', async (ctx) => {
  var userInfo64 = ctx.cookies.get('userInfo')
  var userInfo = new Buffer(userInfo64, 'base64').toString()
  console.log(userInfo)
  let app = {
    name: '张三111'
  }
  await ctx.render('news', {
    list: app
  })
})

router.get('/shop', async (ctx) => {
  var userInfo = ctx.cookies.get('userInfo')
  console.log(userInfo)
  ctx.body = 'shop界面 ' + userInfo
})


router.post('/doAdd', async (ctx) => {

  // // 原生nodejs 在koa中获取表单提交的数据
  // var data = await common.getPostData(ctx)
  // console.log(data)
  // ctx.body = data

  ctx.body = ctx.request.body //获取表单提交的数据
})

module.exports = router
