const {EvaluationSheet} = require('@/models/index')
const {Op} = require('sequelize')

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
 * 最基本的理论表查询。输入查询条件和过滤条件
 * @param {Object} query 查询条件
 * @param {Array or Object} filter 过滤(返回)出来的条件，若为空则返回全部列对应的元素
 */
exports.evaluationSheetQuery = async (query, filter, fuzzySearchObj) => {
  if(fuzzySearchObj) {
    let objContent = query[fuzzySearchObj]
    query[fuzzySearchObj] = {
      [Op.like]: `%${objContent}%`
    }
  }
  return await EvaluationSheet.findAll({
    attributes: filter,
    where: query
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