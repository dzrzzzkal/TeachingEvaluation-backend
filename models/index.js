const Sequelize = require('sequelize')
const sequelize = require('@/controller/mysql') // 导入实例化sequelize
const UserModel = require(__dirname + '/User.js')
const WxUserModel = require(__dirname + '/WxUser.js')
const WxTokenModel = require(__dirname + '/WxToken.js')

// 导入模型统一管理
const User = UserModel(sequelize, Sequelize)
const WxUser = WxUserModel(sequelize, Sequelize)
const WxToken = WxTokenModel(sequelize, Sequelize)

// wxUser.hasOne(User, {
//   foreignKey: 'uid',
//   targetKey: 'id'
// })
// 应该wxUser中包含User的id?不对，应该包含User中的用户名user
WxUser.belongsTo(User, {
  foreignKey: 'uid',
  targetKey: 'id'
})

// 导出模型
module.exports = {
  User,
  WxUser,
  WxToken,
}

// 创建表，默认false，true则是删除原有表，再创建
sequelize.sync({
  force: false,
})