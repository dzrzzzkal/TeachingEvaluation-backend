const {Teacher} = require('@/models/index')
const { User } = require('../models')
const Sequelize = require('sequelize')
const {Op} = require('sequelize')
const $or = Op.or
const $and = Op.and
const $like = Op.like

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

/**
 * 最基本的教师查询。输入查询条件（若无可不输入/{}），分页查询条件（若无可不输入/[]），过滤条件（若无可不输入/{}），模糊查询的条件名（选填）
 * @param {Object} query 查询条件
 * @param {Array} pagination 分页查询条件。pagination[0]: currentPage, pagination[1]: pageSize。数组元素均为integer类型
 * @param {Array or Object} filter 过滤(返回)出来的条件，若参数为空或为{} 则返回全部列对应的元素
 * @param {Array} fuzzySearchName 包含需要进行模糊搜索的对象的名称的数组，数组元素均为字符串string类型
 * @param {array} selfORName 包含某个属性自身需要OR的属性名（例如:jobid为xx or yy）的数组。数组元素均为字符串string类型。
 * （↑ PS:该属性的值在query中要为数组类型。）
 * @param {Array} orQueryName 包含需要OR的某些属性的属性名（例如:jobid:xx or name:yy）的数组。数组元素均为字符串string类型。
 */
exports.teacherQuery = async (query, pagination, filter, fuzzySearchName, selfORName, orQueryName) => {
  if(query && query.setQuery === 'searchEvaluationProgressIncludeSearchRange&input') { // 用于设置在searchRange的情况下存在输入input搜索的query
    let jobidQuery = query.query  // searchRange输入的jobids数组。由于searchRange时会设置selfORName=['jobid']，因此这个jobidQuery这里不需要修改$or，后面if(selfORName)中会修改成jobid: {[$or]: ['xxx','yyy']}
    let orQuery = query.or
    query = {
      jobid: jobidQuery.jobid,
      [$or]: [
        {jobid: {[$like]: `%${orQuery.jobid}%`}},
        {name: {[$like]: `%${orQuery.name}%`}},
        {role: {[$like]: `%${orQuery.role}%`}},
      ]
    }
  }

  let offset = undefined
  let limit = undefined
  if(pagination && pagination.length) {
    let currentPage = pagination[0]
    let pageSize = pagination[1]
    if(currentPage) {  // 一定会有
      offset = (currentPage - 1) * pageSize
    }
    if(pageSize) {
      limit = pageSize
    }
  }
  if(fuzzySearchName && fuzzySearchName.length) {
    for(let i in fuzzySearchName) {
      let attrName = fuzzySearchName[i]
      let attrContent = query[attrName]
      query[attrName] = {
        [Op.like]: `%${attrContent}%`
      }
    }
  }
  if(selfORName && selfORName.length) {
    for(let i in selfORName) {
      let attrName = selfORName[i]
      let attrContent = query[attrName]
      query[attrName] = {
        [Op.or]: attrContent
      }
    }
  }
  if(orQueryName && orQueryName.length) {
    let orArray = []
    for(let i in orQueryName) {
      let attrName = orQueryName[i]
      let attrContent = query[attrName]
      orArray.push({[attrName]: attrContent})
      delete query[attrName]
    }
    query[$or] = orArray
  }
  console.log('teacherQuery —— query:')
  console.log(query)
  // return await Teacher.findAll({
  return await Teacher.findAndCountAll({
    attributes: filter,
    where: query,
    offset,
    limit,
  })
}

// 根据工号jobid查询teacher的所有数据
exports.teacherQueryByJobid = async (jobid) => {
  return await Teacher.findOne({
    where: {
      jobid
    }
  })
}

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