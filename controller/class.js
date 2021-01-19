const {Class, Course} = require('@/models/index')
const {Op} = require('sequelize')
const Sequelize = require('sequelize')

exports.classCreate = async (classinfo) => {
  let {id, 
    course, 
    schoolYear, semester, week, time, teacher, 
    classroom, note, selectedRule, teachingMaterial
  } = classinfo

  return await Class.create({
    id, 
    course_id: course,
    schoolYear, semester, week, time, teacher, 
    classroom, note, selectedRule, teachingMaterial
  })
}

exports.classesQuery = async (teacher) => {
  return await Class.findAll({
    where: {
      teacher: {
        // 模糊查询
        [Op.like]: `%${teacher}%`
      }
    }
  })
}

exports.classQuery = async (name) => {
  return await Class.findAll({
    // attributes: [Sequelize.col('Course.name'), 'id', 'course_id'],
    include: [{
      model: Course,
      // attributes: [],
      'where': {
        'name': {
          [Op.like]: `%${name}%`
        },
      }
    }],
    // raw: true,
  })
}

// 根据用户名user查询，返回用户名user 和 表teacher 中对应的具体信息
// exports.teacherInfoQuery = async (user) => {
//   return await Teacher.findOne({
//     attributes: [Sequelize.col('User.user'), 'jobid', 'name', 'college', 'dept', 'role', 'dean'],
//     include: [{
//       model: User,
//       // as: 'u',
//       attributes: [],
//       'where': {
//         'user': user,
//       }
//     }],
//     raw: true,
//   })
// }