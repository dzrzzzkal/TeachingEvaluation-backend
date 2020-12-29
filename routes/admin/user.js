/**用户的增加修改删除 */

const router = require('koa-router')()

router.get('/', async (ctx) => {
  ctx.body = '用户管理首页'
})

router.get('/add', async (ctx) => {
  ctx.body = '增加用户'
})

router.get('/edit', async (ctx) => {
  ctx.body = '修改用户'
})

router.get('/delete', async (ctx) => {
  ctx.body = '删除用户'
})


module.exports = router.routes()