const {User} = require('@/models/index')

exports.userCreate = async (userinfo) => {
  let {user, pass, jobid} = userinfo
  return await User.create({
    user,
    pass,
    jobid,
  })
}

// 查询用户名是否存在，用于注册验证   // 考虑要不要像上面一样，user(原本是data)=>userinfo
exports.usernameQuery = async (user) => {
  return await User.findOne({
    where: {
      user,
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

// 根据user查询jobid
exports.userJobidQuery = async (user) => {
  return await User.findOne({
    attributes: ['jobid'],
    // where: {
    //   user
    // }
  })
}

