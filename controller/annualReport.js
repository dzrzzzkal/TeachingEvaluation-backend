const {AnnualReport} = require('@/models/index')
const {Op} = require('sequelize')
const $or = Op.or
const $like = Op.like

exports.annualReportCreate = async (data) => {
  let {submitter_id, submitter, college, dept, report_name, submit_time} = data

  return await AnnualReport.create({
    submitter_id, submitter, college, dept, report_name, submit_time
  })
}


exports.annualReportQuery = async (query, pagination,filter, fuzzySearchName, selfORName) => {
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
  console.log('annualReportQuery——query:')
  console.log(query)
  return await AnnualReport.findAndCountAll({
    attributes: filter,
    where: query,
    offset,
    limit
  })
}