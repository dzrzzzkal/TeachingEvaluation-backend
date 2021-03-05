const Sequelize = require('sequelize')
const sequelize = require('@/controller/mysql') // 导入实例化sequelize
const UserModel = require(__dirname + '/User.js')
const WxUserModel = require(__dirname + '/WxUser.js')
const WxTokenModel = require(__dirname + '/WxToken.js')
const TeacherModel = require(__dirname + '/Teacher.js')
const CourseModel = require(__dirname + '/Course.js')
const ClassModel = require(__dirname + '/Class.js')
/**
 * 本来想每个类型的评估表都做一个数据库，但是发现要查询时分页不知道怎么做，
 * 每个表拥有的数量不一致，后续翻页不知道怎么处理，就先改成统一一个表了
 */
// const TheorySheetModel = require(__dirname + '/evaluationSheet/TheorySheet.js')
// const StudentReportSheetModel = require(__dirname + '/evaluationSheet/StudentReportSheet.js')
// const ExperimentSheetModel = require(__dirname + '/evaluationSheet/experimentSheet.js')
// const PESheetModel = require(__dirname + '/evaluationSheet/PESheet.js')
// const TheoryOfPublicWelfareSheetModel = require(__dirname + '/evaluationSheet/TheoryOfPublicWelfareSheet.js')
// const PracticeOfPublicWelfareSheetModel = require(__dirname + '/evaluationSheet/PracticeOfPublicWelfareSheet.js')
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
// const TheorySheet = TheorySheetModel(sequelize, Sequelize)
// const StudentReportSheet = StudentReportSheetModel(sequelize, Sequelize)
// const ExperimentSheet = ExperimentSheetModel(sequelize, Sequelize)
// const PESheet = PESheetModel(sequelize, Sequelize)
// const TheoryOfPublicWelfareSheet = TheoryOfPublicWelfareSheetModel(sequelize, Sequelize)
// const PracticeOfPublicWelfareSheet = PracticeOfPublicWelfareSheetModel(sequelize, Sequelize)
const EvaluationSheet = evaluationSheetModel(sequelize, Sequelize)
const Role_TaskCount = Role_TaskCountModel(sequelize, Sequelize)
const AnnualReport = AnnualReportModel(sequelize, Sequelize)

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

// // 外键添加到源 Class 上
// Class.belongsTo(Teacher, {
//  foreignKey: 'teacher_id',
// //  targetKey: 'jobid'
// })

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
  // TheorySheet,
  // StudentReportSheet,
  // ExperimentSheet,
  // PESheet,
  // TheoryOfPublicWelfareSheet,
  // PracticeOfPublicWelfareSheet,
  EvaluationSheet,
  Role_TaskCount,
  AnnualReport
}

// 创建表，默认false，true则是删除原有表，再创建
sequelize.sync({
  force: false,
})