// const model = require('@/controller/model')
// let User = model.User //获取User模型
const {User} = require('@/models/index')

/**
 * 这里的封装参考：
 * https://www.cnblogs.com/pzxnm/p/10500083.html
 */

exports.userCreate = async (userinfo) => {
  return await User.create({
    user: userinfo.user,
    pass: userinfo.pass
  })
}


// 查询用户名是否存在，用于注册验证   // 考虑要不要像上面一样，user(原本是data)=>userinfo
exports.usernameQuery = async (user) => {
  return await User.findOne({
    where: {
      user: user
    }
  })
} 

// 查询账号密码是否正确 即该用户是否存在，用于登录验证
exports.userQuery = async (userinfo) => {
  return await User.findOne({
    where: {
      user: userinfo.user,
      pass: userinfo.pass
    }
  })
}