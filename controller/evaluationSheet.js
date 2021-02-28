const {EvaluationSheet} = require('@/models/index')
const {Op} = require('sequelize')

// 关联对象 保存 实例
// 待看：https://blog.csdn.net/yaodong379/article/details/97621301

exports.evaluationSheetCreate = async (evaluationSheetinfo) => {
  let {classification, 
    submitter_id, submitter, course_setupUnit, course_name, class_id, teacher_id, teacher_name, class_time, place, attend_num, actual_num, role, 
    environment, 
    evaluationList, appreciateMethod, concreteSuggestion, familiarity, extension, followUp, otherSuggestion, participant, submit_time, 
    followUpDegree, followUpParticipant, followUpParticipantSuggestion, followUpParticipantTime, 
    followUpCollege, followUpCollegeSuggestion, followUpCollegeTime,
    lecturer, lecturerRectification, lecturerTime,
    followUpUnit, followUpUnitSuggestion, followUpUnitTime
  } = evaluationSheetinfo

  return await EvaluationSheet.create({
    classification, 
    submitter_id, submitter, course_setupUnit, course_name, class_id, teacher_id, teacher_name, class_time, place, attend_num, actual_num, role, 
    environment, 
    evaluationList, appreciateMethod, concreteSuggestion, familiarity, extension, followUp, otherSuggestion, participant, submit_time, 
    followUpDegree, followUpParticipant, followUpParticipantSuggestion, followUpParticipantTime, 
    followUpCollege, followUpCollegeSuggestion, followUpCollegeTime,
    lecturer, lecturerRectification, lecturerTime,
    followUpUnit, followUpUnitSuggestion, followUpUnitTime
  })
}

/**
 * 最基本的理论表查询。输入查询条件（若无可不输入/{}），分页查询条件（若无可不输入/[]），过滤条件（若无可不输入/{}），模糊查询的条件名（选填）
 * @param {Object} query 查询条件
 * @param {Array} pagination 分页查询条件。pagination[0]: currentPage, pagination[1]: pageSize。数组元素均为integer类型
 * @param {Array or Object} filter 过滤(返回)出来的条件，若参数为空或为{} 则返回全部列对应的元素 。一般格式：[] / {include:[], exclude:[]}
 * @param {array} fuzzySearchName 包含需要进行模糊搜索的对象的名称的数组，数组元素均为字符串string类型
 * @param {array} selfORName 包含某个属性自身需要OR的属性名（例如:submitter_id为xx or yy）的数组。数组元素均为字符串string类型。
 * （↑ PS:该属性的值在query中要为数组类型。）
 * @param {Object} groupQuery 分组查询。这里的分组查询用于判断 完成/未完成评估任务等。其包含三个属性total(分组判断>=或<的数量，>=即完成，<即未完成), attr(分组判断的属性), rangeSymbol(>=或<等)。
 */
// exports.evaluationSheetQuery = async (query, pagination, filter, fuzzySearchName, selfORName) => {
//   let offset = undefined
//   let limit = undefined
//   if(pagination && pagination.length) {
//     let currentPage = pagination[0]
//     let pageSize = pagination[1]
//     if(currentPage) {  // 一定会有
//       offset = (currentPage - 1) * pageSize
//     }
//     if(pageSize) {
//       limit = pageSize
//     }
//   }
//   if(fuzzySearchName && fuzzySearchName.length) {
//     for(let i in fuzzySearchName) {
//       let attrName = fuzzySearchName[i]
//       let attrContent = query[attrName]
//       query[attrName] = {
//         [Op.like]: `%${attrContent}%`
//       }
//     }
//   }
//   if(selfORName && selfORName.length) {
//     for(let i in selfORName) {
//       let attrName = selfORName[i]
//       let attrContent = query[attrName]
//       query[attrName] = {
//         [Op.or]: attrContent
//       }
//     }
//   }
//   // return await EvaluationSheet.findAll({
//   return await EvaluationSheet.findAndCountAll({
//     attributes: filter,
//     where: query,
//     offset, // offset: (currentPage - 1) * pageSize, / undefined
//     limit,  // limit: pageSize  / undefined
//   })
// }
exports.evaluationSheetQuery = async (query, pagination, filter, fuzzySearchName, selfORName, groupQuery) => {
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
  // // 目前来说没起作用！！！！！！！因为这个total是固定的，但是实际判断每个teacher的taskCount不一致！！！
  // // 分组查询。这里的分组查询用于判断 完成/未完成评估任务等。
  // // 输入(submitter_id:/teacher_id:)jobid, total, havingGroupAttr。
  // // 在满足jobid的情况下，以havingGroupAttr(例如为submitter_id)分组，若查询到的以havingGroupAttr分组后得的数量>=(或<)total，则输出。
  // // 例如：query: {submitter_id: xxx/yyy/zzz}, total=2, '>=', havingGroupAttr='submitter_id'。
  // // 即查询query条件下获得的数据中，筛选出某个submitter_id的数量>=2的对应数据（对应数据的submitter_id一致，且数据总数>=2）。
  // let group= '', having = []
  // if(groupQuery && groupQuery.total && groupQuery.attr && groupQuery.rangeSymbol) {
  //   let {total,   // integer
  //     attr,   // string
  //     rangeSymbol // '>'、'>='、'<'……
  //   } = groupQuery
  //   let attrName = attr  // string
  //   filter = [attrName]
  //   group = attrName
  //   having = Sequelize.literal(`count(${attrName}) ${rangeSymbol} ${total}`)
  // }
  return await EvaluationSheet.findAndCountAll({
    attributes: filter,
    where: query,
    offset, // offset: (currentPage - 1) * pageSize, / undefined
    limit,  // limit: pageSize  / undefined
    // group,
    // having,
  })
}




// 查看submit_time为某个年份的某人的evaluationSheet
exports.evaluationSheetQueryByYear = async (submitter_id, year) => {
  return await EvaluationSheet.findAll({
    where: {
      submitter_id,
      submit_time: {
        [Op.like]: `%${year}%`
      }
    }
  })
}

// findAndCountAll

/**
 * 分页查询
 * @param {string} submitter_id 即工号jobid
 * @param {integer} currentPage 
 * @param {integer} pageSize 
 * @param {array or object} filter 查询条件，若为空则返回全部列对应的元素
 */
exports.evaluationSheetPaginationQuery = async (submitter_id, currentPage, pageSize, filter) => {
  return await EvaluationSheet.findAll({
    attributes: filter,
    where: {
      submitter_id
    },
    offset: (currentPage - 1) * pageSize,
    limit: pageSize
  })
}

/**
 * 查询完成/未完成评估任务（查询taskCount是否满足条件，以及若为'教师'还要包括查询有无被听课），及其评估次数。
 * @param {Array} query 需要查询的submitter_id及其对应的taskCount。(例如：query = [{submitter_id: 'dzrzzzkal', taskCount: 4}, {submitter_id: '32f2gc', taskCount: 1, teacher_id: '32f2gc'}])
 * @param {String} schoolYear 要查询的evaluationSheet的submit_time的年份
 * @param {String} rangeSymbol 查询范围的符号。('>' '>=' '<'等)
 * @param {Integer} currentPage 当前页
 * @param {Integer} pageSize 每页数据条数
 */
exports.evaluationSheetQueryIfFinishedProgress = async (query, schoolYear, rangeSymbol, currentPage, pageSize) => {
  let submitter_idStr = ''  // 用于 若查询的是'未完成'。选出在schoolYear当年没有提交过evaluationSheet的teacher，且submitter_id在query中的
  let whereStr = ""
  if(rangeSymbol.indexOf('>') === -1) { // 没有'>'，即有'<'(输入时参数不输入'=')。查询'未完成评估任务'
    for(let i in query) {
      // 加上了年份 where submit_time like '%schoolYear%' AND 
      if(!query[i].teacher_id) {
        whereStr = whereStr + 
      "submitter_id IN (SELECT distinct submitter_id FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%'` + " AND submitter_id=" + `'${query[i].submitter_id}' ` + 
      "GROUP BY submitter_id HAVING COUNT(submitter_id)"+ rangeSymbol + query[i].taskCount + ")"
      }else {
        whereStr = whereStr 
        + "submitter_id IN (SELECT distinct submitter_id FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%' AND ` 
        + "submitter_id IN (SELECT distinct submitter_id FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%'` + " AND submitter_id=" + `'${query[i].submitter_id}' ` + "GROUP BY submitter_id HAVING COUNT(submitter_id)" + rangeSymbol + query[i].taskCount + ")"
        + " OR " 
        + "submitter_id IN (SELECT distinct submitter_id FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%'` + " AND submitter_id IN (SELECT DISTINCT " + `'${query[i].submitter_id}'` + " as t_id FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%'` + " AND teacher_id like " + `'%${query[i].teacher_id},%'` + "HAVING COUNT(teacher_id) = 0))) "
      }
      submitter_idStr = submitter_idStr + `'${query[i].submitter_id}'`
      if(parseInt(i) !== query.length - 1) {
        whereStr = whereStr + " OR "
        submitter_idStr = submitter_idStr + ','
      }
    }
  }else { // 查询'已完成评估任务'
    for(let i in query) {
      // 加上了年份 where submit_time like '%schoolYear%' AND 
      if(!query[i].teacher_id) {
        whereStr = whereStr + 
        "submitter_id IN (SELECT distinct submitter_id FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%'` + " AND submitter_id=" + `'${query[i].submitter_id}' ` + 
        "GROUP BY submitter_id HAVING COUNT(submitter_id)"+ rangeSymbol + query[i].taskCount + ")"
      }else {
        whereStr = whereStr 
        + "submitter_id IN (SELECT distinct submitter_id FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%' AND `
        + "submitter_id IN (SELECT distinct submitter_id FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%'` + " AND submitter_id=" + `'${query[i].submitter_id}' ` + "GROUP BY submitter_id HAVING COUNT(submitter_id)" + rangeSymbol + query[i].taskCount + ")"
        + " AND " 
        + "submitter_id IN (SELECT distinct submitter_id FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%'` + " AND submitter_id IN (SELECT " + `'${query[i].submitter_id}'` + " as t_id FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%'` + " AND teacher_id like " + `'%${query[i].teacher_id},%'))) `
      }
      if(parseInt(i) !== query.length - 1) {
        whereStr = whereStr + ' OR '
      }
    }
  }
  let limit = (currentPage - 1) * pageSize

  // let mysqlQuery = 
  // "SELECT submitter_id as jobid, COUNT(*) as submittedNum, COUNT(1) OVER() as total FROM `evaluation-sheet` WHERE " + whereStr + ' GROUP BY submitter_id ' + `LIMIT ${limit}, ${pageSize}`
  // 原本是使用上面这个mysqlQuery，但是发现即使whereStr中全加入'WHERE submit_time like'，并且尝试改成了 'WHERE submit_like AND' + whereStr，实际效果是有包含schoolYear筛选的，即分类'已完成''未完成'正确，但是count(*)并没有进行schoolYear筛选。
  // 因此最后采用下面的mysqlQuery，相当于把上面的mysqlQuery作为条件塞进另一条包含筛选schoolYear的语句中。这个mq和上面的mysqlQuery差不多的。
  let mq = "SELECT submitter_id FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%' AND ` + whereStr
  let mysqlQuery = 
  "SELECT submitter_id as jobid, COUNT(*) as submittedNum, COUNT(1) OVER() as total FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%' ` + " AND submitter_id in (" + mq + ") " 
  if(rangeSymbol.indexOf('>') === -1) {
    mysqlQuery = mysqlQuery
    // 若查询的是'未完成'。↓选出在schoolYear当年没有提交过evaluationSheet的teacher，但是从这里返回的submittedNum和beEvaluatedNum是总数据的查询结果。而实际上由于该submitter_id在schoolYear没提交过，因此必定submittedNum=0
    + "OR submitter_id IN (SELECT distinct submitter_id FROM `evaluation-sheet` WHERE submitter_id IN" + ` (${submitter_idStr}) AND` + " submitter_id NOT IN (SELECT submitter_id FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%')) `
  }
  mysqlQuery = mysqlQuery + "GROUP BY submitter_id" + ` LIMIT ${limit}, ${pageSize}`
  let r = await sequelize.query(mysqlQuery, { type: QueryTypes.SELECT })

  let notInTeacherMysql = "SELECT submitter_id FROM `evaluation-sheet` WHERE submitter_id NOT IN (SELECT submitter_id FROM `evaluation-sheet` WHERE submit_time like '%2021%')"
  let notInTeacher = await sequelize.query(notInTeacherMysql, { type: QueryTypes.SELECT })

  let count = 0
  if(r) {
    count = r[0].total
  }
  // 修改一下输出的数据格式。写入taskCount，写入"教师"的被听课次数。因为上面完整查询语句mysqlQuery无法写入次数
  for(let i of r) {
    delete i.total
    for(let k of notInTeacher) {
      if(i.jobid === k.submitter_id) {  // 是schoolYear没有提交过评估表的teacher，这里设置submittedNum=0
        let submittedNum = 0
        i.submittedNum = submittedNum
      }
    }
    for(let j of query) {
      if(i.jobid === j.submitter_id) {
        i.taskCount = j.taskCount
        if(j.teacher_id) {
          let beEvaluatedNumQuery = "SELECT COUNT(*) as beEvaluatedNum FROM `evaluation-sheet` WHERE submit_time like " + `'%${schoolYear}%'` + " AND teacher_id like " + `'%${j.teacher_id},%'`
          let beEvaluatedNumRes = await sequelize.query(beEvaluatedNumQuery, {type: QueryTypes.SELECT})
          i.beEvaluatedNum = beEvaluatedNumRes[0].beEvaluatedNum
        }
      }
    }
  }
  
  let res = {
    count,
    rows: r // rows返回格式例如[{jobid, submitterNum}, {jobid, submitterNum, beEvaluatedNum}(教师)]。(不需要.dataValues)
  }
  return res
}

// ————————————↓这部分是做已/未完成评估时弄出来的，实际上没有被用到。先放着，可能后续会参考————————————————————————

const {QueryTypes} = require('sequelize')
const sequelize = require('@/controller/mysql') // 导入实例化sequelize
// exports.evaluationSheetRawQuery = async (taskCount) => {
//   let mysqlQuery = "SELECT COUNT(*) FROM `evaluation-sheet` WHERE submitter_id IN (SELECT submitter_id FROM `evaluation-sheet` GROUP BY submitter_id HAVING COUNT(submitter_id) >= " + taskCount + ")"
//   return await sequelize.query(mysqlQuery, { type: QueryTypes.SELECT })
// }
/**
 * 查询完成/未完成评估任务（查询taskCount是否满足条件，以及若为'教师'还要包括查询有无被听课），及其评估次数。
 * @param {Array} query 需要查询的submitter_id及其对应的taskCount。(例如：query = [{submitter_id: 'dzrzzzkal', taskCount: 4}, {submitter_id: '32f2gc', taskCount: 2}])
 * @param {String} rangeSymbol 查询范围的符号。('>' '>=' '<'等)
 * @param {Integer} currentPage 当前页
 * @param {Integer} pageSize 每页数据条数
 */
exports.evaluationSheetRawQuery = async (query, rangeSymbol, currentPage, pageSize) => {
  // let mysqlQuery1 = 
  // "SELECT * FROM `evaluation-sheet` WHERE submitter_id IN" +
  // "(SELECT submitter_id FROM `evaluation-sheet` WHERE submitter_id='dzrzzzkal' GROUP BY submitter_id HAVING COUNT(submitter_id) >= 3)" +
  // "OR submitter_id IN" + 
  // "(SELECT submitter_id FROM `evaluation-sheet` WHERE submitter_id='32f2gc' GROUP BY submitter_id HAVING COUNT(submitter_id) >= 2)"

  let whereStr = ""
  for(let i in query) {
    whereStr = whereStr + 
    "submitter_id IN (SELECT submitter_id FROM `evaluation-sheet` WHERE submitter_id=" + `'${query[i].submitter_id}' ` + 
    "GROUP BY submitter_id HAVING COUNT(submitter_id)"+ rangeSymbol + query[i].taskCount + ")"
    if(parseInt(i) !== query.length - 1) {
      whereStr = whereStr + ' OR '
    }
  }
  let limit = (currentPage - 1) * pageSize
  let mysqlQuery = 
  "SELECT submitter_id, COUNT(*) as submittedNum FROM `evaluation-sheet` WHERE " + whereStr + ' GROUP BY submitter_id ' + `LIMIT ${limit}, ${pageSize}`
  return await sequelize.query(mysqlQuery, { type: QueryTypes.SELECT })
}
/**
 * 查询被评估的教师，及其被评估次数。
 * （与evaluationSheetRawQuery()相比，这里的查询的是teacher_id，而teacher_id以 'xxx,'、'xxx,yyy,'的形式存储，因此要模糊搜索。
 * 且由于查询的是被评估次数，因此不设置taskCount(也可以认为taskCount均>=1，而实际上只要查询到就一定>=1)。）
 * @param {Array} query 需要查询的teacher_id。(例如：query = ['dzrzzzkal', '32f2gc'])
 * @param {String} rangeSymbol 查询范围的符号。('>' '>=' '<'等)
 * @param {Integer} currentPage 当前页
 * @param {Integer} pageSize 每页数据条数
 */
// 有问题的！！！！！！！！！！！体现在分组那里
exports.evaluationSheetRoleRawQuery = async (query, rangeSymbol, currentPage, pageSize) => {
  query = ['dzrzzzkal', 'gesd236a']
  let whereStr = ""
  for(let i in query) {
    whereStr = whereStr + 
    "teacher_id IN (SELECT teacher_id FROM `evaluation-sheet` WHERE teacher_id like " + `'%${query[i]},%' GROUP BY teacher_id like '%${query[i]},%')`
    if(parseInt(i) !== query.length - 1) {
      whereStr = whereStr + ' OR '
    }
  }
  let limit = (currentPage - 1) * pageSize
  let mysqlQuery = 
  "SELECT teacher_id, COUNT(*) as beEvaluatedNum FROM `evaluation-sheet` WHERE " + whereStr 
  + " GROUP BY teacher_id " // // 这里不好分组，说不定出现同一条数据中包含多个要查询的teacher_id
  // + `LIMIT ${limit}, ${pageSize}`

  for(let i in query) {
    mysqlQuery = mysqlQuery + `like '%${query[i]},%'`
  }

  // ONLY_FULL_GROUP_BY: https://blog.csdn.net/sofeware333/article/details/108286880
  // set @@sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
  let mysqlQuery1 = 
  // "SELECT teacher_id, COUNT(*) as beEvaluatedNum FROM `evaluation-sheet` WHERE teacher_id like '%dzrzzzkal,%' GROUP BY teacher_id like '%dzrzzzkal,%'"
  "SELECT teacher_id, COUNT(*) as beEvaluatedNum FROM `evaluation-sheet` WHERE teacher_id IN (SELECT teacher_id FROM `evaluation-sheet` WHERE teacher_id like '%dzrzzzkal,%' GROUP BY teacher_id like '%dzrzzzkal,%')"
  + " OR " + "teacher_id IN (SELECT teacher_id FROM `evaluation-sheet` WHERE teacher_id like '%gesd236a,%' GROUP BY teacher_id like '%gesd236a,%')" 
  // + "GROUP BY teacher_id" // 这里不好分组，说不定出现同一条数据中包含多个要查询的teacher_id
  // + "GROUP BY teacher_id like '%gesd236a,%'"
  + "GROUP BY (teacher_id like '%dzrzzzkal,%' OR teacher_id like '%gesd236a,%')"
  return await sequelize.query(mysqlQuery1, { type: QueryTypes.SELECT })
}

// 分组查询
// https://www.jb51.net/article/99691.htm
// https://github.com/sequelize/sequelize/issues/7975
const Sequelize = require('sequelize')
// exports.evaluationSheetGroupQuery = async (taskCount) => {
//   return await EvaluationSheet.findAll({  // .count
//     attributes: ['submitter_id', [sequelize.fn('COUNT', sequelize.col('submitter_id')), 'submittedNum']],
//     group: ['submitter_id'],
//     // having: ['COUNT(?) >= ?', 'submitter_id', taskCount],
//     having: Sequelize.literal(`count(submitter_id) >= ${taskCount}`), // 暂时改了<
//     where: {classification: 'theory'},
//     raw: true
//   })
// }
// exports.evaluationSheetGroupQuery = async (taskCount, queryAttr) => {
//   let attrName = queryAttr  // string
//   return await EvaluationSheet.findAll({  // .count
//     attributes: [attrName, [sequelize.fn('COUNT', sequelize.col(attrName)), attrName]],
//     group: [attrName],
//     // having: ['COUNT(?) >= ?', 'submitter_id', taskCount],
//     having: Sequelize.literal(`count(${attrName}) >= ${taskCount}`),
//     where: {classification: 'practice of public welfare'},
//     raw: true
//   })
// }

// ——————————↑这部分是做已/未完成评估时弄出来的，实际上没有被用到。先放着，可能后续会参考————————————————————————