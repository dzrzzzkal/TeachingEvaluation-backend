const {Course} = require('@/models/index')

exports.courseCreate = async (courseinfo) => {
  let {id, oldid, name, onlineCourse, en_name, 
    credit, 
    setupUnit, 
    classHours, 
    generalCourse, classification, 
    briefIntro, 
    syllabus, 
    ap, fp} = courseinfo

  return await Course.create({
    id, oldid, name, onlineCourse, en_name, 
    credit: parseFloat(credit), 
    setupUnit, 
    classHours: parseInt(classHours), 
    generalCourse, classification, 
    briefIntro, 
    syllabus, 
    ap, fp
  })
}