const {AnnualReport, Teacher} = require('@/models/index')
const {QueryTypes} = require('sequelize')
const Sequelize = require('sequelize')
const sequelize = require('@/controller/mysql') // 导入实例化sequelize
const {Op} = require('sequelize')
const $or = Op.or
const $like = Op.like

exports.annualReportCreate = async (data) => {
  let {submitter_id, submitter, college, dept, report_name, submit_time} = data

  return await AnnualReport.create({
    submitter_id, submitter, college, dept, report_name, submit_time
  })
}

/**
 * 年度报告查询。输入查询条件（若无可不输入/{}），分页查询条件（若无可不输入/[]），过滤条件（若无可不输入/{}），模糊查询的条件名（选填）
 * @param {Object} query 查询条件
 * @param {Array} pagination 分页查询条件。pagination[0]: currentPage, pagination[1]: pageSize。数组元素均为integer类型
 * @param {Array or Object} filter 过滤(返回)出来的条件，若参数为空或为{} 则返回全部列对应的元素 。一般格式：[] / {include:[], exclude:[]}
 * @param {Array} fuzzySearchName 包含需要进行模糊搜索的对象的名称的数组，数组元素均为字符串string类型
 * @param {Array} selfORName 包含某个属性自身需要OR的属性名（例如:submitter_id为xx or yy）的数组。数组元素均为字符串string类型。
 * （↑ PS:该属性的值在query中要为数组类型。）
 * @param {Array} order 排序
 * @param {Object} groupQuery 分组查询。这里的分组查询用于判断 已提交/未提交年度总结报告。其包含三个属性total(分组判断>=或<的数量，>=即完成，<即未完成), attr(分组判断的属性), rangeSymbol(>=或<等)。
 */
exports.annualReportQuery = async (query, pagination, filter, fuzzySearchName, selfORName, order, groupQuery) => {
  // 用于网页端请求annualReportList时，要同时满足submitter_id:xxx和submitter_id:{[$or]:[yyy,zzz]}条件
  if(query && query.setQuery === 'searchAnnualReportIncludeSearchRange&input') { // 用于设置在searchRange的情况下存在输入input搜索的query
    let q = query.query  // searchRange输入的jobids数组。由于searchRange时会设置selfORName=['jobid']，因此这个jobidQuery这里不需要修改$or，后面if(selfORName)中会修改成jobid: {[$or]: ['xxx','yyy']}
    let orQuery = query.or
    let submit_time = q.submit_time
    query = {
      submitter_id: q.submitter_id,
      [$or]: [
        {submitter_id: {[$like]: `%${orQuery.submitter_id}%`}},
        {submitter: {[$like]: `%${orQuery.submitter}%`}},
      ]
    }
    if(submit_time) {
      query.submit_time = submit_time
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
  let group= '', having = []
  if(groupQuery && groupQuery.total && groupQuery.attr && groupQuery.rangeSymbol) {
    let {total,   // integer
      attr,   // string
      rangeSymbol // '>'、'>='、'<'……
    } = groupQuery
    let attrName = attr  // string
    filter = [attrName, [sequelize.fn('COUNT', sequelize.col(attrName)), 'aRSubmittedNum']],
    group = attrName
    having = Sequelize.literal(`count(${attrName}) ${rangeSymbol} ${total}`)
  }
  console.log('annualReportQuery——query:')
  console.log(query)
  return await AnnualReport.findAndCountAll({
    attributes: filter,
    where: query,
    offset,
    limit,
    order,  // [['id', 'DESC'/'ASC']] 、"id DESC"
    group,
    having,
  })
}

// 查询该学年未提交年度总结报告的领导
exports.notSubmitAnnualReportDean = async (schoolYear, jobids, aRPagination) =>{
  let sql = 
  "SELECT jobid, name, college, dept, role, dean FROM `teacher` WHERE dean = 'true' "
  if(jobids && jobids.length) {
    sql = sql + ' AND ('
    for(let i in jobids) {
      sql = sql + `jobid = '${jobids[i]}'`
      if(i != jobids.length - 1) {
        sql = sql + ' OR '
      }else {
        sql = sql + ')'
      }
    }
  }
  sql = sql + " AND jobid NOT IN (SELECT submitter_id FROM `annual-report` WHERE submit_time like" 
  + `'%${schoolYear}%')`
  if(aRPagination[0] && aRPagination[1]) {
    let currentPage = aRPagination[0]
    let pageSize = aRPagination[1]
    let limit = (currentPage - 1) * pageSize
    sql = sql + ` LIMIT ${limit}, ${pageSize}`
  }
  let t = await sequelize.query(sql, { type: QueryTypes.SELECT })
  return t
}