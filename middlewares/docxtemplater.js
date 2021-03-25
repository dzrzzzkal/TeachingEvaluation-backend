// http://www.voidcn.com/article/p-zatcentv-bxn.html
// https://www.jianshu.com/p/5bd594805fb3

const fs = require('fs')
const path = require('path')
const JSZip = require('jszip')
const Docxtemplater = require('docxtemplater')
const ImageModule = require('open-docxtemplater-image-module')

function setWordData(formData) {
  let {
    submitter_id,
    course_setupUnit, course_name, class_id, teacher_name, class_time, place, attend_num, actual_num, role,
    environment,
    evaluationList,
    appreciateMethod, concreteSuggestion, familiarity, extension, followUp, otherSuggestion, submitter, submit_time,
    followUpDegree, 
      followUpParticipantSuggestion, followUpParticipant, followUpParticipantTime, 
      followUpCollegeSuggestion, followUpCollege, followUpCollegeTime, 
      lecturerRectification, lecturer, lecturerTime, 
      followUpUnitSuggestion, followUpUnit, followUpUnitTime
  } = formData
  let date = class_time.split(' ')[0]
  let time = class_time.split(' ')[1]
  let class_time_year = date.split('-')[0]
  let class_time_month = date.split('-')[1]
  let class_time_day = date.split('-')[2]
  let class_time_startTime = time.split('-')[0]
  let class_time_endTime = time.split('-')[1]
  let roleType 
  switch (role) {
    case '教师':
      roleType = '听课类型：■教师听课  □领导听课  □督导听课'
      break;
    case '领导':
      roleType = '听课类型：□教师听课  ■领导听课  □督导听课'
      break
    case '督导':
      roleType = '听课类型：□教师听课  □领导听课  ■督导听课'
      break
  }
  let familiarityText, extensionText, followUpText
  switch (familiarity) {
    case '非常熟悉':
      familiarityText = '■非常熟悉    □熟悉    □不太熟悉     □完全不熟悉'
      break;
    case '熟悉':
      familiarityText = '□非常熟悉    ■熟悉    □不太熟悉     □完全不熟悉'
      break;
    case '不太熟悉':
      familiarityText = '□非常熟悉    □熟悉    ■不太熟悉     □完全不熟悉'
      break;
    case '完全不熟悉':
      familiarityText = '□非常熟悉    □熟悉    □不太熟悉     ■完全不熟悉'
      break;
    default:
      break;
  }
  switch (extension) {
    case 'true':
      extensionText = '■ 是  □ 否 '
      break;
    case 'false':
      extensionText = '□ 是  ■ 否 '
      break;
    default:
      break;
  }
  switch (followUp) {
    case 'true':
      followUpText = '■  需要跟进   □ 不需要跟进'
      break;
    case 'false':
      followUpText = '□  需要跟进   ■ 不需要跟进'
      break
    default:
      break;
  }
  role = roleType
  familiarity = familiarityText
  extension = extensionText
  followUp = followUpText
  if(followUp === 'true') {
    let followUpDegreeText
    switch (followUpDegree) {
      case '教研室/系/院/组织了交流讨论':
        followUpDegreeText = '■ 教研室/系/院/组织了交流讨论；□ 与被听课教师/教学单位负责人/教学管理服务中心交流、反馈了意见；□ 建议修订课程目标'
        break;
      case '与被听课教师/教学单位负责人/教学管理服务中心交流、反馈了意见':
        followUpDegreeText = '□ 教研室/系/院/组织了交流讨论；■ 与被听课教师/教学单位负责人/教学管理服务中心交流、反馈了意见；□ 建议修订课程目标'
        break;
      case '建议修订课程目标':
        followUpDegreeText = '□ 教研室/系/院/组织了交流讨论；□ 与被听课教师/教学单位负责人/教学管理服务中心交流、反馈了意见；■ 建议修订课程目标'
        break;
      default:
        break;
    }
    followUpDegree = followUpDegreeText
  }else {
    followUpDegree = '□ 教研室/系/院/组织了交流讨论；□ 与被听课教师/教学单位负责人/教学管理服务中心交流、反馈了意见；□ 建议修订课程目标'
    followUpParticipantSuggestion = followUpParticipant = followUpParticipantTime = 
      followUpCollegeSuggestion = followUpCollege = followUpCollegeTime = 
      lecturerRectification = lecturer = lecturerTime = 
      followUpUnitSuggestion = followUpUnit = followUpUnitTime = ''
  }
  
  let wordData = {
    submitter_id,
    course_setupUnit, course_name, class_id, teacher_name, class_time_year, class_time_month, class_time_day, class_time_startTime, class_time_endTime, place, attend_num, actual_num, role,
    environment,
    // evaluationList,
    appreciateMethod, concreteSuggestion, familiarity, extension, followUp, otherSuggestion, submitter, submit_time,
    followUpDegree, 
      followUpParticipantSuggestion, followUpParticipant, followUpParticipantTime, 
      followUpCollegeSuggestion, followUpCollege, followUpCollegeTime, 
      lecturerRectification, lecturer, lecturerTime, 
      followUpUnitSuggestion, followUpUnit, followUpUnitTime
  }
  let el = evaluationList.split(',')
  for(let i in el) {
    // eval("var grade" + i + "=" + el[i])
    wordData[`grade${i}`] = el[i]
  }
  return wordData
}

const exportEvaluationSheet = (formData, fileName) => {
  let sheetName
  switch (formData.classification) {
    case 'theory':
      sheetName = 'TheorySheet'
      break;
    case 'student report':
      sheetName = 'StudentReportSheet'
      break;
    case 'experiment':
      sheetName = 'ExperimentSheet'
      break;
    case 'PE':
      sheetName = 'PESheet'
      break;
    case 'theory of public welfare':
      sheetName = 'TheoryOfPublicWelfareSheet'
      break;
    case 'practice of public welfare':
      sheetName = 'PracticeOfPublicWelfareSheet'
      break;
    default:
      break;
  }
  // 读取模板文件
  let content = fs.readFileSync(path.join(__dirname, '../file/evaluationSheetTemplate/' + sheetName + '.docx'), 'binary')
  let zip = new JSZip(content)
  let docx = new Docxtemplater()
  let opts = {
    centered: false,
    getImage: function(tagValue, tagName) {
      console.log(__dirname)
      return fs.readFileSync(path.join(__dirname, '../file/' + tagValue))
    },
    getSize: function(img, tagValue, tagName) {
      // if(tagName== "a57"){
      //   return[350, 370];
      // }
      // else if(tagName == "a58"){
      //   return[240, 180];
      // }
      // else if(tagName == "a59"){
      //   return[240, 160];
      // }
      // else{
      //   return[100, 100];
      // }
      return [150, 150]
    }
  }
  docx.attachModule(new ImageModule(opts))
  docx.loadZip(zip)
  let wordData = setWordData(formData)
  docx.setData({
    ...wordData
  })
  try {
    /*
      render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
    */
    docx.render()
  }catch (error) {
    let err = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      properties: error.properties
    }
    console.log(JSON.stringify(err))
    /* 
      The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
    */
    throw error;
  }
  let buf = docx.getZip().generate({type: 'nodebuffer'})
  /* buf is a nodejs buffer, you can either write it to a file or do anything else with it.*/
  fs.writeFileSync(path.join(__dirname, '../file/evaluationSheet/' + fileName), buf)  // fileName包含了.docx
  }

module.exports = exportEvaluationSheet