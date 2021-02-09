const {PracticeOfPublicWelfareSheet} = require('@/models/index')
const {Op} = require('sequelize')

exports.practiceOfPublicWelfareSheetCreate = async (practiceOfPublicWelfareSheetinfo) => {
  let {submitter_id, submitter, course_setupUnit, course_name, class_id, teacher_id, teacher_name, class_time, place, attend_num, actual_num, role, 
    environment, 
    evaluationList, appreciateMethod, concreteSuggestion, familiarity, extension, followUp, otherSuggestion, participant, submit_time, 
    followUpDegree, followUpParticipant, followUpParticipantSuggestion, followUpParticipantTime, 
    followUpCollege, followUpCollegeSuggestion, followUpCollegeTime,
    lecturer, lecturerRectification, lecturerTime,
    followUpUnit, followUpUnitSuggestion, followUpUnitTime
  } = practiceOfPublicWelfareSheetinfo

  return await PracticeOfPublicWelfareSheet.create({
    submitter_id, submitter, course_setupUnit, course_name, class_id, teacher_id, teacher_name, class_time, place, attend_num, actual_num, role, 
    environment, 
    evaluationList, appreciateMethod, concreteSuggestion, familiarity, extension, followUp, otherSuggestion, participant, submit_time, 
    followUpDegree, followUpParticipant, followUpParticipantSuggestion, followUpParticipantTime, 
    followUpCollege, followUpCollegeSuggestion, followUpCollegeTime,
    lecturer, lecturerRectification, lecturerTime,
    followUpUnit, followUpUnitSuggestion, followUpUnitTime
  })
}

exports.practiceOfPublicWelfareSheetQuery = async (submitter_id) => {
  return await PracticeOfPublicWelfare.findAll({
    where: {
      submitter_id: {
        [Op.like]: `%${submitter_id}%`
      }
    }
  })
}