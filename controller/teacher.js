const {Teacher} = require('@/models/index')
const { User } = require('../models')
const Sequelize = require('sequelize')

exports.teacherCreate = async (userinfo) => {
  let {jobid, name, college, dept, role, dean, deansoffice} = userinfo
  return await Teacher.create({
    jobid,
    name,
    college,
    dept,
    role,
    dean,
    deansoffice // 教务处
  })
}

// 根据工号jobid查询teacher的所有数据
exports.teacherQuery = async (jobid) => {
  return await Teacher.findOne({
    where: {
      jobid
    }
  })
}

// https://www.cnblogs.com/hss-blog/articles/10220267.html
// 根据用户名user查询，返回用户名user 和 表teacher 中对应的具体信息
exports.teacherInfoQuery = async (user) => {
  return await Teacher.findOne({
    attributes: [Sequelize.col('User.user'), 'jobid', 'name', 'college', 'dept', 'role', 'dean', 'deansoffice'],
    include: [{
      model: User,
      // as: 'u',
      attributes: [],
      'where': {
        'user': user,
      }
    }],
    raw: true,
  })
}