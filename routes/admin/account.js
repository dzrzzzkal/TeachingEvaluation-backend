const router = require('koa-router')()
// const checkNotLogin = require('@/middlewares/check').checkNotLogin
// const checkLogin = require('@/middlewares/check').checkLogin
const md5 = require('md5')

const { userCreate, usernameQuery, userQuery } = require('@/controller/user')
const {teacherCreate} = require('@/controller/teacher')
const {classCreate} = require('@/controller/class')
const {courseCreate} = require('@/controller/course')
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
router.post('/doregister', async (ctx, next) => {
  console.log(ctx.request)
  let {user, pass, jobid, name, college, dept, role, dean} = ctx.request.body
  let registerUser = {user, pass, jobid}
  let registerTeacher = {jobid, name, college, dept, role, dean}
  // 查询用户名是否存在
  let query = await usernameQuery(user)
  if(!query) {
    await teacherCreate(registerTeacher)
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

// 网页端登录
router.post('/doLogin', async (ctx, next) => {
  console.log(ctx)
  let loginUser = ctx.request.body
  let query = await userQuery(loginUser)
  if(!query) {  // 数据库中没有匹配到用户
    ctx.body = {
      code: 500,
      msg: '用户名或密码错误。',
    }
  } else {  // 匹配到用户
    let token = await addToken({   // token中要携带的信息，自己定义
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

router.post('/test', async (ctx, next) =>{
  
  ctx.body = {status: true}
})

router.post('/create-course', async (ctx, next) => {
  let courseinfo = ctx.request.body
  await courseCreate(courseinfo)
  console.log(ctx.request.body)
  ctx.body = 'create course success'
})

router.post('/create-class', async (ctx, next) => {
  let classinfo = ctx.request.body
  let time = ''
  let teacher = ''
  let classroom = ''
  console.log(ctx.request.body)
  if(classinfo.time) {
    classinfo.time.forEach((timeItem, index, array) => {
      let t = ''
      timeItem.forEach((item) => {
        t += item
      })
      time += t + ',' 
    })
  }
  classinfo.teacher.forEach(item => {
    teacher += item + ','
  })
  classinfo.classroom.forEach(item => {
    classroom += item + ','
  })
  classinfo.time = time
  classinfo.teacher = teacher
  console.log(typeof(classinfo.teacher))
  classinfo.classroom = classroom
  console.log('classroom: ' + classroom)
  await classCreate(classinfo)
  ctx.body = 'create class success'
})




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