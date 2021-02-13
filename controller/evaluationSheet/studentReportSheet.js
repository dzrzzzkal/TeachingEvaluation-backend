const {StudentReportSheet} = require('@/models/index')
const {Op} = require('sequelize')

exports.studentReportSheetCreate = async (studentReportSheetinfo) => {
  let {submitter_id, submitter, course_setupUnit, course_name, class_id, teacher_id, teacher_name, class_time, place, attend_num, actual_num, role, 
    environment, 
    evaluationList, appreciateMethod, concreteSuggestion, familiarity, extension, followUp, otherSuggestion, participant, submit_time, 
    followUpDegree, followUpParticipant, followUpParticipantSuggestion, followUpParticipantTime, 
    followUpCollege, followUpCollegeSuggestion, followUpCollegeTime,
    lecturer, lecturerRectification, lecturerTime,
    followUpUnit, followUpUnitSuggestion, followUpUnitTime
  } = studentReportSheetinfo

  return await StudentReportSheet.create({
    submitter_id, submitter, course_setupUnit, course_name, class_id, teacher_id, teacher_name, class_time, place, attend_num, actual_num, role, 
    environment, 
    evaluationList, appreciateMethod, concreteSuggestion, familiarity, extension, followUp, otherSuggestion, participant, submit_time, 
    followUpDegree, followUpParticipant, followUpParticipantSuggestion, followUpParticipantTime, 
    followUpCollege, followUpCollegeSuggestion, followUpCollegeTime,
    lecturer, lecturerRectification, lecturerTime,
    followUpUnit, followUpUnitSuggestion, followUpUnitTime
  })
}

exports.studentReportSheetQuery = async (submitter_id) => {
  return await StudentReportSheet.findAll({
    where: {
      // submitter_id: {
      //   [Op.like]: `%${submitter_id}%`
      // }
      submitter_id
    }
  })
}

exports.studentReportSheetQueryByYear = async (submitter_id, year) => {
  return await StudentReportSheet.findAll({
    where: {
      submitter_id,
      submit_time: {
        [Op.like]: `%${year}%`
      }
    }
  })
}

// 分页查询
exports.studentReportSheetPaginationQuery = async (submitter_id, currentPage, pageSize) => {
  return await StudentReportSheet.findAll({
    where: {
      submitter_id
    },
    offset: (currentPage - 1) * pageSize,
    limit: pageSize
  })
}