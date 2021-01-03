const router = require('koa-router')()
// const checkNotLogin = require('@/middlewares/check').checkNotLogin
// const checkLogin = require('@/middlewares/check').checkLogin
const md5 = require('md5')

const { userCreate, usernameQuery, userQuery } = require('@/controller/user')
const addToken = require('@/token/addToken')
const checkToken = require('@/middlewares/checkToken')
const localFilter = require('../../middlewares/localFilter')

// 目前登录注册主要参考网址：
// https://blog.csdn.net/where_slr/article/details/100580730

// 注册
/**
 * 还有很多bug，
 * 例如:密码加密，判断当前是否处于登录状态，判断是否用户名密码等都输入了，用户名长度密码限制，等
 * 还有注册后的跳转界面，返回什么result
 * 还有模型关系参考：https://segmentfault.com/a/1190000017430752
 */
router.post('/register', async (ctx, next) => {
  let registerUser = ctx.request.body.user
  // console.log(ctx.request.body)
  // 查询用户名是否存在
  let query = await usernameQuery(registerUser)
  if(!query) {
    await userCreate(registerUser)
      .then(result => {
        ctx.body = {
          code: 200,
          msg: '注册成功。',
          message: result
        }
      }).catch(err => {
        console.log(err)
        ctx.body = {
          code: 500,
          msg: '注册失败。',
          message: err
        }
      })
  } else {
      ctx.body = {
        code: 500,
        message: '该用户名已注册。'
      }
  }
})

// 登录
router.post('/dologin', async (ctx, next) => {
  let loginUser = ctx.request.body
  let query = await userQuery(loginUser)
  if(!query) {  // 数据库中没有匹配到用户
    ctx.body = {
      code: 500,
      msg: '登录失败。',
    }
  } else {  // 匹配到用户
    let token = await addToken({   //token中要携带的信息，自己定义
      user: loginUser.user,
      id: query.id
    })
    ctx.body = {
      code: 200,
      tokenCode: 200, // token返回码
      token,  // 返回给前端
      user: loginUser.user,
      msg: '登录成功。',
      status: true, // 登录状态，目前还没用上，不知道要不要弄到数据库去
      /**
       * PS: 前端拿到后台的token，可以
       * 1.存到localStorage。在src/components/login.vue中将token和user存进localStorage中
       * 2.存到vuex中
       */
    }
  }
})

// 测试，checkToken
// 到时候应该要做一个后端的请求拦截器
/**
 * 不对
 * 当token失效时，现在的网站一般会做两种处理，
 * 一种是跳转到登陆页面让用户重新登陆获取新的token，
 * 另外一种就是当检测到请求失效时，网站自动去请求新的token，第二种方式在app保持登陆状态上面用得比较多。
 * 到时候要区分小程序和网页端进行处理TAT
 */
router.post('/checkToken', async (ctx, next) => {
  console.log('-----this is checkToken URL: ')
  // ↓返回的是一个请求，只是根据不同情况可能修改了里面的ctx.response.body
  let returnCtx = await localFilter(ctx)
  ctx.body = returnCtx.response.body
})

router.get('/test', async (ctx, next) =>{
  ctx.body = {status: true}
})

// 测试 。响应时间好久
// router.post('/test', async (ctx, next) => {
//   let result = await checkToken(ctx)
//   // let query = await userQuery()
//   ctx.body = result
//   // let token = ctx.request.header.authorization
//   // console.log(ctx.request)
//   // if(token) {
//   //   let res = proving(token)
//   //   console.log('token-res:' + res)
//   //   let { time, timeout } = res
//   //   let data = new Date().getTime()
//   //   // addtoken.js 中用 {expiresIn: '1h'} 时，↓
//   //   // if(res && res.exp <= new Date()/1000) {
//   //   //   ctx.body = {
//   //   //     message: 'token过期',
//   //   //     code: 500
//   //   //   }
//   //   // }else {
//   //   //   ctx.body = {
//   //   //     message: 'token success',
//   //   //     code: 200
//   //   //   }
//   //   // }
//   //   if(res && data - time <= timeout) {
//   //     ctx.body = {
//   //       code: 200,
//   //       message: 'token 解析成功'
//   //     }
//   //   }else {
//   //     ctx.body = {
//   //       code: 500,
//   //       message: 'token 已过期'
//   //     }
//   //   }
//   // }else {
//   //   ctx.body = {
//   //     message: 'no token',
//   //     code: 500
//   //   }
//   // }
// })



/**
 * 以下是尝试用jsonwebtoken，尝试中
 */
// const addtoken = require('../../../token/addtoken')
// router.post('/token', async (ctx) => {
//   let name = ctx.request.body.name
//   let pass = ctx.request.body.pass
//   // 将接收到的前台数据和数据库中的数据匹配
//   // 如果匹配成功，返回status 200 code 1
//   // 不成功返回status 1000 code 0
//   await userModel.query('select * from users where name=? and pass=?;', [name, pass])
//     .then(res => {
//       if(res.length === 0) {  // 数据库中没有匹配到用户
//         ctx.body = {
//           code: 0,
//           status: 1000,
//           msg: 'error'
//         }
//       } else {  //匹配到用户
//         let tk = addtoken({name:res[0].name,id:res[0].id})  //token中要携带的信息，自己定义
//         ctx.body = {
//           tk,  //返回给前端
//           name: res[0].name,
//           code: 1,
//           status: 200
//         }
//       }
//     })
// })




/**
 * 以下是用session登录，已经可以登录的
 */

// router.get('/login', async (ctx, next) => {
//   await checkNotLogin(ctx)
//   await ctx.render('login', {
//     session: ctx.session
//   })
// })

// 较复杂的方法以后可以封装出去？
// router.post('/login', async (ctx, next) => {
//   console.log(ctx.request.body)
//   let name = ctx.request.body.name
//   let pass = ctx.request.body.password

//   await userModel.findDataByName(name)
//         .then(result => {
//             let res = result
//             if (name === res[0]['name'] && md5(pass) === res[0]['pass']) {
//                 ctx.body = true
//                 ctx.session.user = res[0]['name']
//                 ctx.session.id = res[0]['id']
//                 console.log('ctx.session.id', ctx.session.id)
//                 console.log('session', ctx.session)
//                 console.log('登录成功')
//             }else{
//                 ctx.body = false
//                 console.log('用户名或密码错误!')
//             }
//         }).catch(err => {
//             console.log(err)
//         })
// })

module.exports = router