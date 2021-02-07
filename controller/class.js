const {Class, Course, Teacher} = require('@/models/index')
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

exports.classesQuery = async (teacher_name) => {
  return await Class.findAll({
    where: {
      teacher_name: {
        // 模糊查询
        [Op.like]: `%${teacher_name}%`
      }
    }
  })
}

// attributes待改，不返回那么多数据
exports.classQueryByName = async (name) => {
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

exports.classQueryByClassid = async (classid) =>{
  return await Class.findOne({
    // attributes: [Sequelize.col('Course.name'), 'id', 'course_id'],
    include: [{
      model: Course,
      // attributes: [],
    },
    // {
    //   model: Teacher,
    // }
    ],
    where: {
      id: classid,
    },
    // raw: true,
  })
}