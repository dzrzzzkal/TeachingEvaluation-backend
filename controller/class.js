const {Class, Course, Teacher} = require('@/models/index')
const {Op} = require('sequelize')
const Sequelize = require('sequelize')
const $or = Op.or
const $like = Op.like

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
 * @param {array} fuzzySearchName 包含需要进行模糊搜索的对象的名称的数组，数组元素均为字符串string类型
 */
exports.classQuery = async (query, filter, fuzzySearchName) => {
  // let {teacher_name} = query
  // // 如果输入的查询条件包含teacher_name，则设置为模糊查询，因为teacher_name以字符串形式xxx,yyy存储数组
  // if(teacher_name) {  
  //   teacher_name = {
  //     [Op.like]: `%${teacher_name}%`  // 模糊查询
  //   }
  // }
  if(fuzzySearchName && fuzzySearchName.length) {
    for(let i in fuzzySearchName) {
      let attrName = fuzzySearchName[i]
      let attrContent = query[attrName]
      query[attrName] = {
        [Op.like]: `%${attrContent}%`
      }
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
// 这里的where参考网址： https://www.javaroad.cn/questions/72608
// 微信api中输入 班号/课程编号/教师名/课程名/课程开设单位，返回搜索到的对应的class和course的部分信息。
exports.classQueryWithCourse = async (query) => {
  let {teacher_id, keyword, schoolYear, semester} = query
  let q = keyword
  let t_id = []
  if(teacher_id.length) {
    for(let i of teacher_id) {
      let tItem = {
        [$like]: `%${i},%`
      }
      t_id.push(tItem)
    }
  }
  return await Class.findAll({
    attributes: [Sequelize.col('Course.name'), Sequelize.col('Course.classification'), 'id', 'course_id', 'teacher_name', 'time', 'classroom'],
    include: [
      {
        model: Course,
        attributes: ['name', 'classification']
      }
    ],
    where: {
      [$or]: [
        {
          id: {[$like]: `%${q}%`}
        },
        {
          course_id: {[$like]: `%${q}%`}
        },
        {
          teacher_id: {[$or]: t_id}
        },
        {
          '$course.name$': {[$like]: `%${q}%`}
        },
        {
          '$course.setupUnit$': {[$like]: `%${q}%`}
        }
      ],
      schoolYear,
      semester
    },
    // raw: true
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