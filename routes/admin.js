const router = require('koa-router')()
const user = require('./admin/user')
const focus = require('./admin/focus')

router.prefix('/admin')

// 配置admin的子路由 层级路由
router.get('/', async (ctx) => {
  ctx.body = '后台管理系统首页'
})

router.use('/user', user)
router.use('/focus', focus)


module.exports = router