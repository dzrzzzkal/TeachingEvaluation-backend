const router = require('koa-router')()
const { wxUserCreate, openidQuery, uidQuery, deleteData } = require('@/controller/wxUser')
const addToken = require('@/token/addToken')

const wxAPI = require('@/API/wxAPI')

router.prefix('/api')

// 微信小程序端获取微信用户登录凭证code
/**
 * 参考的是这个：目前有地方没搞懂
 * 另，可能返回格式要改成JSON
 * https://blog.csdn.net/weixin_43419774/article/details/90545458
 */
router.post('/doLogin', async (ctx, next) => {

  // 下面的待封装出去

  var result  // 先将返回内容赋值给result，最后再赋值给ctx.response.body

  let {code, user, pass} = ctx.request.body
  let loginUser = {
    user: user,
    pass: pass
  }
  let res = await wxAPI.getCode2Session(code) // 返回JSON数据包，包括openid、session_key等
  let {openid, session_key} = res
  if(openid) {
    let openidRes = await openidQuery(openid)
      if(!openidRes) {  // 数据库中没有该openid，则先通过表user判断是否存在该用户user
        let userRes = await userQuery(loginUser)  // 通过表user查询该用户
        if(!userRes) {  // 该用户user不存在
          result = {
            code: 500,
            msg: '用户名或密码错误。'
          }
        } else {  // 该用户user存在，则创建微信用户wxuser，并返回token
          let uid = parseInt(userRes.id)  // 用户id，即user表中的id
          let user = userRes.user
          console.log('userRes.id ' + typeof(userRes.id))
          let wxUserinfo = {
            uid: uid,
            openid: openid,
            session_key: session_key,
          }
          await wxUserCreate(wxUserinfo)  // 创建wxuser
          let token = await addToken({   // 创建token
            user: user,
            id: uid
          })
          result = {
            code: 200,
            tokenCode: 200, // token返回码
            token,  // 返回给前端
            user: user,
            msg: '用户创建成功，返回token。',
            status: true,
          }
        }
      } else {  // 该openid存在，先查询其对应的uid，从而生成并返回token
        let uid = openidRes.uid // openidRes.uid: 从查询openid返回的wxuser表中的结果获取uid
        let token = await addToken({
          user: user,
          id: uid
        })
        result = {
          code: 200,
          tokenCode: 200, // token返回码
          token,  // 返回给前端
          user: user,
          msg: '该用户已存在，返回token',
          status: true,
        }
       
      }
  } else {  // 没有返回openid
    result = res // 返回errMsg
  }

  ctx.response.body = result
})

router.post('/doLogout', async (ctx, next) => {
  // 目前是决定先请求一次openid，再根据 openid 删除 wxUser中的整列数据 和 本地的token，待定吧，可能后面根据uid删除
  // let url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${js_code}&grant_type=authorization_code`

})

module.exports = router