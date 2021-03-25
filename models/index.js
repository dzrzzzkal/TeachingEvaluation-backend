const Sequelize = require('sequelize')
const sequelize = require('@/controller/mysql') // 导入实例化sequelize
const UserModel = require(__dirname + '/User.js')
const WxUserModel = require(__dirname + '/WxUser.js')
const WxTokenModel = require(__dirname + '/WxToken.js')
const TeacherModel = require(__dirname + '/Teacher.js')
const CourseModel = require(__dirname + '/Course.js')
const ClassModel = require(__dirname + '/Class.js')
const evaluationSheetModel = require(__dirname + '/EvaluationSheet.js')
const Role_TaskCountModel = require(__dirname + '/Role-TaskCount.js')
const AnnualReportModel = require(__dirname + '/AnnualReport.js')


// 导入模型统一管理
const User = UserModel(sequelize, Sequelize)
const WxUser = WxUserModel(sequelize, Sequelize)
const WxToken = WxTokenModel(sequelize, Sequelize)
const Teacher = TeacherModel(sequelize, Sequelize)
const Course = CourseModel(sequelize, Sequelize)
const Class = ClassModel(sequelize, Sequelize)
const EvaluationSheet = evaluationSheetModel(sequelize, Sequelize)
const Role_TaskCount = Role_TaskCountModel(sequelize, Sequelize)
const AnnualReport = AnnualReportModel(sequelize, Sequelize)

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

// // 外键添加到源 Class 上
// Class.belongsTo(Teacher, {
//  foreignKey: 'teacher_id',
// //  targetKey: 'jobid'
// })

EvaluationSheet.belongsTo(Teacher, {
  foreignKey: 'submitter_id'
})

AnnualReport.belongsTo(Teacher, {
  foreignKey: 'submitter_id'
})

// 导出模型
module.exports = {
  User,
  WxUser,
  WxToken,
  Teacher,
  Course,
  Class,
  EvaluationSheet,
  Role_TaskCount,
  AnnualReport
}

// 创建表，默认false，true则是删除原有表，再创建
sequelize.sync({
  force: false,
})