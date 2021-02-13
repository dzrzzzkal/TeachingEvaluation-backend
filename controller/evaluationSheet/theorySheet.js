const {TheorySheet} = require('@/models/index')
const {Op} = require('sequelize')

exports.theorySheetCreate = async (theorySheetinfo) => {
  let {submitter_id, submitter, course_setupUnit, course_name, class_id, teacher_id, teacher_name, class_time, place, attend_num, actual_num, role, 
    environment, 
    evaluationList, appreciateMethod, concreteSuggestion, familiarity, extension, followUp, otherSuggestion, participant, submit_time, 
    followUpDegree, followUpParticipant, followUpParticipantSuggestion, followUpParticipantTime, 
    followUpCollege, followUpCollegeSuggestion, followUpCollegeTime,
    lecturer, lecturerRectification, lecturerTime,
    followUpUnit, followUpUnitSuggestion, followUpUnitTime
  } = theorySheetinfo

  return await TheorySheet.create({
    submitter_id, submitter, course_setupUnit, course_name, class_id, teacher_id, teacher_name, class_time, place, attend_num, actual_num, role, 
    environment, 
    evaluationList, appreciateMethod, concreteSuggestion, familiarity, extension, followUp, otherSuggestion, participant, submit_time, 
    followUpDegree, followUpParticipant, followUpParticipantSuggestion, followUpParticipantTime, 
    followUpCollege, followUpCollegeSuggestion, followUpCollegeTime,
    lecturer, lecturerRectification, lecturerTime,
    followUpUnit, followUpUnitSuggestion, followUpUnitTime
  })
}

exports.theorySheetQuery = async (submitter_id) => {
  return await TheorySheet.findAll({
    where: {
      // submitter_id: {
      //   [Op.like]: `%${submitter_id}%`
      // }
      submitter_id
    }
  })
}

exports.theorySheetQueryByYear = async (submitter_id, year) => {
  return await TheorySheet.findAll({
    where: {
      submitter_id,
      submit_time: {
        [Op.like]: `%${year}%`
      }
    }
  })
}

// findAndCountAll

// 分页查询
exports.theorySheetPaginationQuery = async (submitter_id, currentPage, pageSize) => {
  return await TheorySheet.findAll({
    where: {
      submitter_id
    },
    offset: (currentPage - 1) * pageSize,
    limit: pageSize
  })
}