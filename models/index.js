const Sequelize = require('sequelize')
const sequelize = require('@/controller/mysql') // 导入实例化sequelize
const UserModel = require(__dirname + '/User.js')
const WxUserModel = require(__dirname + '/WxUser.js')
const WxTokenModel = require(__dirname + '/WxToken.js')
const TeacherModel = require(__dirname + '/Teacher.js')
const CourseModel = require(__dirname + '/Course.js')
const ClassModel = require(__dirname + '/Class.js')

// 导入模型统一管理
const User = UserModel(sequelize, Sequelize)
const WxUser = WxUserModel(sequelize, Sequelize)
const WxToken = WxTokenModel(sequelize, Sequelize)
const Teacher = TeacherModel(sequelize, Sequelize)
const Course = CourseModel(sequelize, Sequelize)
const Class = ClassModel(sequelize, Sequelize)

// wxUser.hasOne(User, {
//   foreignKey: 'uid',
//   targetKey: 'id'
// })
// 应该wxUser中包含User的id?不对，应该包含User中的用户名user
// 外键要改成用户名user，不能用uid，因为到时是请求学校的账户等数据，不是用数据库！

// ！！！！！！！！！！！！！！！！！！待改！！！！！！！！！！！！！!
// WxUser.belongsTo(User, {
//   foreignKey: 'uid',
//   targetKey: 'id'
// })
WxUser.belongsTo(User, {  // 外键添加到源 WxUser 上
  foreignKey: 'username',
  // targetKey: 'user',
})

// 要先创建Teacher，才能创建user
Teacher.hasOne(User, { // 外键添加到目标 User 上
  foreignKey: 'jobid',
  // targetKey: 'jobid',
})

// 外键添加到源 Class 上
Class.belongsTo(Course, {
  foreignKey: 'course_id',
  // targetKey: 'id',
})



// 导出模型
module.exports = {
  User,
  WxUser,
  WxToken,
  Teacher,
  Course,
  Class,
}

// 创建表，默认false，true则是删除原有表，再创建
sequelize.sync({
  force: false,
})