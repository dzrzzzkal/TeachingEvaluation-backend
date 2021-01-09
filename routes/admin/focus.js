/**导航图的增加修改删除 */

const router = require('koa-router')()

router.get('/', async (ctx) => {
  ctx.body = '管理首页'
})

router.get('/add', async (ctx) => {
  ctx.body = '增加'
})

router.get('/edit', async (ctx) => {
  ctx.body = '修改'
})

router.get('/delete', async (ctx) => {
  ctx.body = '删除'
})


module.exports = router.routes()