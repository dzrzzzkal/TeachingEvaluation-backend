// 根据当前日期，返回当前学年、学期、周数。
const schoolYearList = ['2018-2019年', '2019-2020年', '2020-2021年', '2021-2022年', '2022-2023年', '2023-2024年', '2024-2025年']
const semesterList = ['春季学期', '夏季学期', '秋季学期']
const weekList = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16']

const setSchoolYearAndSemester = () => {
  // 根据当前日期设置学年和学期
  let thisYear = new Date().getFullYear()
  let thisMonth = new Date().getMonth() + 1
  for(let i in schoolYearList) {
    let year = parseInt(schoolYearList[i].substring(0, 4))
    if(thisYear === year) {
      // 设置学期 semesterList: ['春季学期', '夏季学期', '秋季学期'],
      let semesterIndex
      if(thisMonth <= 2 || thisMonth >= 9) {  // 秋季学期
        semesterIndex = 2
      }else if(thisMonth >= 3 && thisMonth <= 6) {  // 春季学期
        semesterIndex = 0
      }else if(thisMonth >= 7 && thisMonth <= 8) {  // 夏季学期
        semesterIndex = 1
      }
      // 本校学年学期。以本人课表为例(2021.02-2021.06，属于2020-2021春季学期，2020.09-2021.01属于2020-2021秋季学期，2018.07属于2018-2019夏季学期)
      return{
        schoolYearIndex: semesterIndex !== 0 ? i : i - 1,
        schoolYear: semesterIndex !== 0 ? schoolYearList[i] : schoolYearList[i - 1],
        semesterIndex: semesterIndex,
        semester: semesterList[semesterIndex],
      }
    }
  }
}

// 输入当前学期的起始日期。再转成year, month, day，判断当日是该学期的第几周
const setSchoolWeek = (date) => { // '2021-2-24'
  let year = parseInt(date.split('-')[0])
  let month = parseInt(date.split('-')[1]) - 1  // setFullYear的month: 0-11，但是输入的month是正常日期的month，因此month-1
  let day = parseInt(date.split('-')[2])
  var d = new Date()
  d.setFullYear(year, month, day)
  var weekday = d.getDay()  // 定义day为当年1月1日的星期数(0为星期天,1为星期1,6为星期6)
  // 定义fistweekleft为第一周剩余的天数,此处认为星期一是一周的第一天，如果将星期天定义为一周的第一天，请写成fistweekleft = (6-day)%6
  var firstweekleft = (7-weekday)%7;
  // 将d赋值为第二周的第一天,1+fistweekleft号为第一周最后天，1+fistweekleft+1为第二周第一天
  d.setFullYear(year, month, day + firstweekleft + 1)
  // 定义变量d1为当天
  var d1 = new Date()
  // 当前时间与当年第二周第一天的毫秒数之差除以一周的毫秒数并取整即为当前日期距本的第二周已过的周数
  // 结果加上2即为当天为本年的第几周（如果在一周的第一天的0点运行此程序，结果会比实际值大1，此种情况请自行处理）
  let nowWeek = 2+parseInt((d1.getTime()-d.getTime())/1000/60/60/24/7)
  if(nowWeek > 16) {
    nowWeek = 16
  }
  return nowWeek
}

const getSchoolYearAndSemester = () =>{
  return global.schoolTime.schoolYearAndSemester
}

const getSchoolWeek = (ctx) => {
  return global.schoolTime.nowSchoolWeek
}

module.exports = {schoolYearList, semesterList, weekList, setSchoolYearAndSemester, setSchoolWeek, getSchoolYearAndSemester, getSchoolWeek}