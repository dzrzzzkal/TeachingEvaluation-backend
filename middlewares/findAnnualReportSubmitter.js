// 查找本学年已提交/未提交年度总结报告的教师
const {annualReportQuery, notSubmitAnnualReportDean} = require('@/controller/annualReport')

exports.submittedAnnualReport = async (schoolYear, teacherinfo, aRPagination) => {
  let aRJobidQueryContent = []
  let deanTeacherinfo = []
  for(let i of teacherinfo.rows) {
    let item = i.dataValues
    let {jobid, dean} = item
    if(dean == 'false') {
      continue
    }else {
      aRJobidQueryContent.push(jobid)
      deanTeacherinfo.push(item)
    }
  }
  let rangeSymbol = '>='
  let aRQueryItem = {
    submitter_id: aRJobidQueryContent,
    submit_time: schoolYear
  }
  let aRFilter = {}
  let aRFuzzySearchName = ['submit_time']
  let aRSelfORName = ['submitter_id']
  let aRGroupQuery = {
    total: 1,
    attr: 'submitter_id',
    rangeSymbol
  }
  let arQueryRes = await annualReportQuery(aRQueryItem, aRPagination, aRFilter, aRFuzzySearchName, aRSelfORName, [], aRGroupQuery)
  let ep = arQueryRes
  ep.count = ep.rows.length
  for(let q of ep.rows) {
    let qItem = q.dataValues
    for(let t of deanTeacherinfo) {
      let tItem = t
      if(qItem.submitter_id === tItem.jobid) {
        for(let attr in tItem) {
          let attrContent = tItem[attr]
          qItem[attr] = attrContent
        }
      }
    }
  }
  return ep
}

exports.notSubmitAnnualReport = async (schoolYear, teacherinfo, aRPagination) => {
  let jobids = []
  for(let i of teacherinfo.rows) {
    let item = i.dataValues
    let {jobid, dean} = item
    if(dean == 'false') {
      continue
    }else {
      jobids.push(jobid)
    }
  }
  let t = await notSubmitAnnualReportDean(schoolYear, jobids, aRPagination)
  t = t.map((item, index) => {
    item.aRSubmittedNum = 0
    return item
  })
  let ep = {
    count: t.length,
    rows: t
  }
  return ep
}

// // 很蠢的办法，但是目前想不到用查数据库的方法，多表查询不太会
// exports.notSubmitAnnualReport = async (schoolYear, teacherinfo, aRPagination) => {
//   let aRJobidQueryContent = []
//   let deanTeacherinfo = []
//   for(let i of teacherinfo.rows) {
//     let item = i.dataValues
//     let {jobid, dean} = item
//     if(dean == 'false') {
//       continue
//     }else {
//       aRJobidQueryContent.push(jobid)
//       deanTeacherinfo.push(item)
//     }
//   }
//   let submittedEP = await this.submittedAnnualReport(schoolYear, teacherinfo, aRPagination)
//   let submittedJobid = []
//   for(let i of submittedEP.rows) {
//     let item = i.dataValues
//     let {jobid} = item
//     submittedJobid.push(jobid)
//   }
//   let currentPage = parseInt(aRPagination[0])
//   let pageSize = parseInt(aRPagination[1])

//   // searchRange不能超过deanTeacherinfo.length
//   let searchRange = currentPage * pageSize >= deanTeacherinfo.length ? deanTeacherinfo.length : currentPage * pageSize
//   let notSubmittedJobid = []
//   let ep = {
//     count: deanTeacherinfo.length - submittedEP.count,
//     rows: []
//   }
//   for(let i = 0; i < searchRange; i++) {
//     for(let j = 0; j < submittedJobid.length; j++) {
//       if(i > deanTeacherinfo.length - 1) {
//         break
//       }else if(submittedJobid[j] == deanTeacherinfo[i].jobid) { // 此教师已提交年度报告的教师
//         searchRange++ // 已提交，不符合要求，范围要+1继续查找
//         break
//       }else if(j == submittedJobid.length - 1) {  // 未提交
//         notSubmittedJobid.push(deanTeacherinfo[i].jobid)
//       }
//     }
//   }
//   notSubmittedJobid.splice(0, (currentPage - 1) * pageSize)
//   for(let i of notSubmittedJobid) {
//     for(let j of deanTeacherinfo) {
//       if(i == j.jobid) {
//         ep.rows.push(j)
//         continue
//       }
//     }
//   }
//   return ep
// }