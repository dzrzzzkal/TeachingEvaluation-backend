const router = require('koa-router')()

const common = require('../module/common')
const userService = require('../controller/mysql')

router.get('/', async (ctx, next) => {
  ctx.body = {
    "message": 'Teaching Evaluation Index Page.'
  }
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

module.exports = router
