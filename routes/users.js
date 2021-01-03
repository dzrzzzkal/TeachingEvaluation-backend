const router = require('koa-router')()
const userService = require('@/controller/mysql')

router.prefix('/users')


/**
 * 目前参考的是：
 * https://www.jianshu.com/p/b4e36739d85a
 * 应该后面要改，模仿：
 * https://blog.csdn.net/wclimb/article/details/77890793?utm_medium=distribute.pc_relevant.none-task-blog-BlogCommendFromMachineLearnPai2-1.control&depth_1-utm_source=distribute.pc_relevant.none-task-blog-BlogCommendFromMachineLearnPai2-1.control
 */


// 获取所有用户（GET请求）
router.get('/', async function (ctx, next) {
  // ctx.body = await userService.findAllUser()
  ctx.body = await userService.findUserData('aaaaa')
})

// 增加用户（POST请求）
router.get('/add', async function (ctx, next) {
  let arr = []
  // arr.push(ctx.request.body['iduser'])
  // arr.push(ctx.request.body['username'])
  // arr.push(ctx.request.body['password'])
  arr.push('4')
  arr.push('username')
  arr.push('password')

  // console.log(arr)
  
  await userService.addUserData(arr)
    .then((data) => {
      let r = ''
      if(data.affectedRows != 0) {
        r = 'ok'
      }
      ctx.body = {
        data: r
      }
    }).catch((error) => {
      ctx.body = {
        error
      }
    })
})

module.exports = router
