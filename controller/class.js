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

/**
 * 最基本的课程查询。输入查询条件和过滤条件
 * @param {Object} query 查询条件
 * @param {Array or Object} filter 过滤(返回)出来的条件，若为空则返回全部列对应的元素
 */
exports.classQuery = async (query, filter) => {
  let {teacher_name} = query
  // 如果输入的查询条件包含teacher_name，则设置为模糊查询，因为teacher_name以字符串形式xxx,yyy存储数组
  if(teacher_name) {  
    teacher_name = {
      [Op.like]: `%${teacher_name}%`  // 模糊查询
    }
  }
  return await Class.findAll({
    include: [{
      model: Course,
      // attributes: [],
    }],
    attributes: filter,
    where: query
  })
}

exports.classQueryByTeacherName = async (teacher_name) => {
  return await Class.findAll({
    include: [{
      model: Course,
      // attributes: [],
    }],
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