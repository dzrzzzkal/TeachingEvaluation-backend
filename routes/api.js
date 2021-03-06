const router = require('koa-router')()
const {userQuery, userJobidQuery} = require('@/controller/user')
const { wxUserCreate, openidQuery, uidQuery, deleteData } = require('@/controller/wxUser')
const {teacherQueryByJobid, teacherInfoQuery} = require('@/controller/teacher')
const {classQuery, classQueryByTeacherName, classQueryWithCourse, classQueryByClassid} = require('@/controller/class')
// const {theorySheetCreate, theorySheetQuery, theorySheetQueryByYear, theorySheetPaginationQuery} = require('@/controller/evaluationSheet/theorySheet')
// const {studentReportSheetCreate, studentReportSheetQuery, studentReportSheetQueryByYear, studentReportSheetPaginationQuery} = require('@/controller/evaluationSheet/studentReportSheet')
// const {experimentSheetCreate, experimentSheetQuery, experimentSheetQueryByYear, experimentSheetPaginationQuery} = require('@/controller/evaluationSheet/experimentSheet')
// const {peSheetCreate, peSheetQuery, peSheetQueryByYear, peSheetPaginationQuery} = require('@/controller/evaluationSheet/peSheet')
// const {theoryOfPublicWelfareSheetCreate, theoryOfPublicWelfareSheetQuery, theoryOfPublicWelfareSheetQueryByYear, theoryOfPublicWelfareSheetPaginationQuery} = require('@/controller/evaluationSheet/theoryOfPublicWelfareSheet')
// const {practiceOfPublicWelfareSheetCreate, practiceOfPublicWelfareSheetQuery, practiceOfPublicWelfareSheetQueryByYear, practiceOfPublicWelfareSheetPaginationQuery} = require('@/controller/evaluationSheet/practiceOfPublicWelfareSheet')
const {evaluationSheetCreate, evaluationSheetQuery, evaluationSheetQueryByYear, evaluationSheetPaginationQuery} = require('@/controller/evaluationSheet')
const {role_taskCountQuery} = require('@/controller/role-taskCount')
const {annualReportCreate, annualReportQuery} = require('@/controller/annualReport')

const addToken = require('@/token/addToken')
const checkToken = require('@/middlewares/checkToken')
const {exportDocx} = require('@/middlewares/officegen')

const wxAPI = require('@/API/wxAPI')
const { teacherQuery } = require('../controller/teacher')

router.prefix('/api')

router.post('/checkToken', async (ctx, next) => {
  let res = await checkToken(ctx)
  ctx.body = res
})

// 微信小程序端获取微信用户登录凭证code
/**
 * 参考的是这个：目前有地方没搞懂
 * 另，可能返回格式要改成JSON
 * https://blog.csdn.net/weixin_43419774/article/details/90545458
 */
router.post('/doLogin', async (ctx, next) => {

  // 下面的待封装出去

  var result  // 先将返回内容赋值给result，最后再赋值给ctx.response.body

  let {code, user, pass} = ctx.request.body
  let loginUser = {
    user: user,
    pass: pass
  }
  let res = await wxAPI.getCode2Session(code) // 返回JSON数据包，包括openid、session_key等
  let {openid, session_key} = res
  if(openid) {
    let openidRes = await openidQuery(openid)
      if(!openidRes) {  // 数据库中没有该openid，则先通过表user判断是否存在该用户user
        let userRes = await userQuery(loginUser)  // 通过表user查询该用户
        if(!userRes) {  // 该用户user不存在
          result = {
            code: 500,
            msg: '用户名或密码错误。'
          }
        } else {  // 该用户user存在，则创建微信用户wxuser，并返回表teacher的信息和token
          let {jobid, user} = userRes
          let wxUserinfo = {
            user,
            openid,
            session_key,
          }
          await wxUserCreate(wxUserinfo)  // 创建wxuser
          let userinfo = await teacherInfoQuery(user)  // 查询teacher的信息
          let token = await addToken({   // 创建token
            user,
            jobid,
          })
          result = {
            code: 200,
            tokenCode: 200, // token返回码
            token,  // 返回给前端
            // user: user,
            userinfo: userinfo,
            msg: '用户创建成功，返回token。',
            status: true,
          }
        }
      }
      /**
       * 目前是有问题的，因为是一个微信用户对应一个openid，即如果我在小程序端登出了，然后登陆另一个账号，
       * 这时两个账号的openid是一致的，就会出现一个openid对应多个账户的情况，感觉是不应该的。
       * 而由于出现一对多这个情况，目前下面的user暂时不通过openidRes.username来获取，
       * 而是暂时将重复代码let userRes = await userQuery(loginUser)放在这里提醒自己，目的是获取user
       * 看后续怎么处理吧
       *  */ 
      else {  // 该openid存在。先通过user查询其对应的jobid，从而生成token，再查询和返回teacher的信息和返回token
        // let user = openidRes.username // openidRes.jobid: 从查询openid返回的wxuser表中的结果获取jobid
        let userRes = await userQuery(loginUser)  // 通过表user查询该用户
        if(!userRes) {
          result = {
            msg: '用户名或密码错误。'
          }
        }else {
          let user = userRes.user // 其实这里暂时也能获取jobid，看后续会不会筛选返回数据的属性

          let userinfo = await teacherInfoQuery(user)
          let {jobid} = userinfo
          let token = await addToken({
            user: user,
            jobid: jobid
          })
          result = {
            code: 200,
            tokenCode: 200, // token返回码
            token,  // 返回给前端
            // user: user,
            userinfo: userinfo,
            msg: '该用户已存在，返回token',
            status: true,
          }
        }
        
      }
  } else {  // 没有返回openid
    result = res // 返回errMsg
  }

  ctx.response.body = result
})

router.post('/doLogout', async (ctx, next) => {
  // 目前是决定先请求一次openid，再根据 openid 删除 wxUser中的整列数据 和 本地的token，待定吧，可能后面根据uid删除
  // let url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${js_code}&grant_type=authorization_code`

})

// 格式/getCourses?xx=aaa&yy=bbb
// 通过后端本身进来就时的路由拦截，localFIlter()中的checkToken()的返回值中包含user
router.get('/getCourses', async (ctx, next) => {
  let {user, jobid} = ctx.body  // 获取用户名user、工号jobid
  let {schoolYear, semester} = ctx.request.query
  // let teacher = user + jobid
  // let classRes = await classQueryByTeacherName(teacher)
  // let classRes = await classQueryByTeacherName(user)
  let query = {teacher_name: user, schoolYear, semester}
  let classRes = await classQuery(query)

  if(classRes.length) {
    // 这里手动将数据库里面time例如(time: 'Fri345,')中和classroom(classroom:'D101,')的最后的逗号去掉，以后再修改vue前端和数据库
    for(let i of classRes) {
      i.time = i.time.substr(0, i.time.length - 1)
      i.classroom = i.classroom.substr(0, i.classroom.length - 1)
      i.teacher_id = i.teacher_id.substr(0, i.teacher_id.length - 1)
    }
  }
  
  ctx.body = classRes
})

// 格式/class?xx=aaa&yy=bbb
router.get('/class', async (ctx, next) => {
  // console.log(ctx.request.query)
  let {keyword, schoolYear, semester} = ctx.request.query
  console.log(schoolYear)
  console.log(semester)
  if(keyword) {
    // 查询输入的可能是教师姓名
    let teacherJobid = await teacherQuery({name: keyword}, [], ['jobid'], ['name'])
    let teacher_idArray = []
    if(teacherJobid.rows) {
      for(let i of teacherJobid.rows) {
        let item = i.dataValues.jobid
        teacher_idArray.push(item)
      }
    }
    let query = {
      teacher_id: teacher_idArray,
      keyword,
      schoolYear,
      semester
    }
    let res = await classQueryWithCourse(query)
    ctx.body = res
  } else {
    ctx.body = '没有输入搜索关键字。'
  }
})

router.get('/classid/:classid', async (ctx, next) => {
  let classid = ctx.params.classid
  let res = await classQueryByClassid(classid)

  // let teacherid = res['teacher_id'].split(',')
  // let teacherinfo = []
  // // 由于最后一个字符一定是',' 因此最后一个item一定为空，因此不用查询，设为length-1
  // for(let i = 0; i < teacherid.length-1; i++) {
  //   console.log('teacherid[i]: ' + teacherid[i])
  //   let t = await teacherQueryByJobid(teacherid[i])
  //   teacherinfo.push(t.name)
  // }
  // ctx.body = {
  //   res,nodemon
  //   teacherinfo
  // }
  
  ctx.body = res ? res : {fail: '没有查询到对应的课程信息。'}
})

router.post('/submitForm', async (ctx, next) => {
  let {jobid, user} = ctx.response.body
  let formData = ctx.request.body
  // 根据classid查询对应的teacher的id
  let classinfo = await classQueryByClassid(formData.class_id)
  formData.submitter_id = jobid
  formData.submitter = user
  formData.teacher_id = classinfo.teacher_id
  formData.teacher_name = classinfo.teacher_name

  // 根据classification写入不同的数据库
  let classification = formData.classification
  let submitter_id = formData.submitter_id
  // switch (classification) {
  //   case 'theory':
  //     await theorySheetCreate(formData)
  //     ctx.body = await theorySheetQuery(submitter_id)
  //     break;
  //   case 'student report':
  //     await studentReportSheetCreate(formData)
  //     ctx.body = await studentReportSheetQuery(submitter_id)
  //     break
  //   case 'experiment':
  //     await experimentSheetCreate(formData)
  //     ctx.body = await experimentSheetQuery(submitter_id)
  //     break
  //   case 'PE':
  //     await peSheetCreate(formData)
  //     ctx.body = await peSheetQuery(submitter_id)
  //     break
  //   case 'theory of public welfare':
  //     await theoryOfPublicWelfareSheetCreate(formData)
  //     ctx.body = await theoryOfPublicWelfareSheetQuery(submitter_id)
  //     break
  //   case 'practice of public welfare':
  //     await practiceOfPublicWelfareSheetCreate(formData)
  //     ctx.body = await practiceOfPublicWelfareSheetQuery(submitter_id)
  //     break
  //   default:
  //     break;
  // }
  await evaluationSheetCreate(formData)
  ctx.body = await evaluationSheetQuery({submitter_id})

})

// 用于小程序首页查看听课评估进度
router.get('/getEvaluationProgress', async (ctx, next) => {
  let {jobid} = ctx.response.body
  let year = new Date().getFullYear()

  // 这里待改，其实不需要evaluationSHeetQueryByYear,到时参考下面这个evaluationSheetQuery即可
  let eS = await evaluationSheetQueryByYear(jobid, year)
  let length = eS.length


  // 获取该教师身份，匹配对应的role_taskCount
  let {role} = await teacherQueryByJobid(jobid)
  if(role === '教师') { // 若role为'教师'，需要加上被听课次数
    let query = {
      teacher_id: `${jobid},`,
      submit_time: year
    }
    // let sheet = await evaluationSheetQuery(query)
    let sheet = await evaluationSheetQuery(query, [], {}, ['teacher_id', 'submit_time'])
    // var beEvaluatedNum = sheet.length
    var beEvaluatedNum = sheet.count
  }
  let {count} = await role_taskCountQuery(role)

  // test
  // await exportDocx(eS[1])

  if(beEvaluatedNum) {
    ctx.body = {
      submittedNum: length,
      beEvaluatedNum,
      taskCount: count,
    }
  }else {
    ctx.body = {
      submittedNum: length,
      taskCount: count,
    }
  }
})

const send = require('koa-send')
// 下载年度评估报告模板
router.get('/downloadAnnualReport', async (ctx, next) => {
  console.log('这里是downloadAnnualReport')

  let fileName = 'annualReportTemplate.docx'
  // Set Content-Disposition to "attachment" to signal the client to prompt for download.
  // Optionally specify the filename of the download.
  // 设置实体头（表示消息体的附加信息的头字段）,提示浏览器以文件下载的方式打开
  // 也可以直接设置 ctx.set("Content-disposition", "attachment; filename=" + fileName);
  ctx.attachment(fileName)
  await send(ctx, fileName, { root: 'public/file'})

  // ctx.response.body='es'
})

// 小程序页面“我的”中，点击“已评估”，查看评估记录列表（只含部分表内容）
// 待改，目前页码和数量是固定的，小程序端处也还没做下拉加页码
router.get('/getSubmittedSheetList', async (ctx, next) =>{
  let {jobid} = ctx.response.body

  let currentPage = parseInt(1) || 1
  let pageSize = parseInt(4) || 2
  let terms = ['id', 'course_name', 'classification', 'teacher_id', 'createdAt']
  let eS = await evaluationSheetPaginationQuery(jobid, currentPage, pageSize, terms)

  ctx.body = {
    eS
  }
})

router.get('/getSubmittedAnnualReport', async (ctx, next) =>{
  let {jobid} = ctx.response.body

  let currentPage = parseInt(1) || 1
  let pageSize = parseInt(4) || 2

  let query = {submitter_id: jobid}
  let pagination = [currentPage, pageSize]
  let filter = {}
  let fuzzySearchName
  let aR = await annualReportQuery(query, pagination, filter, fuzzySearchName)

  ctx.body = {
    aR
  }
})

router.get('/evaluationSheet/:sheet_id', async (ctx, next) => {
  let sheet_id = ctx.params.sheet_id
  let {jobid} = ctx.response.body

  let query = {submitter_id: jobid, id: sheet_id}
  let sheet = await evaluationSheetQuery(query)
  console.log(sheet.rows[0].dataValues)
  if(sheet.rows) {
    sheet = sheet.rows[0].dataValues  // evaluationSheetQuery()中是findAll，但是这里实际上最多只会返回1个对象
  }else {
    sheet = {fail: '该课表不存在或无法查询。'}
  }
  ctx.body = sheet
})


router.post('/uploadAnnualReport', async (ctx,next)=>{
  let {jobid} = ctx.response.body
  let teacherinfo = await teacherQuery({jobid})
  let {name, college, dept, dean} = teacherinfo.rows[0]
  const {formatTime} = require('@/config/formatTime.js')
  let time = formatTime(new Date())
  let t = time.replace(/\//g, '-')
  let rTime = time.replace(/\//g, '').replace(/:/g, '').replace(/ /g, '')
  let fileName = `年度总结报告_${jobid}_${name}_${college}${dept}_${rTime}`

  const path = require('path')
  const multer = require('@koa/multer')
  const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, path.join('file/annualReport'))
    },
    filename: function(req, file, cb) {
      let type = file.originalname.split('.')[1]
      // cb(null, `${file.fieldname}-${Date.now().toString(16)}.${type}`)
      // cb(null, `${file.fieldname}-${Date.now().getFullYear()}${Date.now().getMonth()+1}${Date.now().getDate()}.${type}`)
      fileName = `${fileName}.${type}`
      cb(null, fileName)
    }
  })
  //文件上传限制
  const limits = {
    fields: 10,//非文件字段的数量
    fileSize: 500 * 1024,//文件大小 单位 b
    files: 1//文件数量
  }
  const upload = multer({storage,limits})

  let err = await upload.single('annualReport')(ctx, next)  //single('file')
    .then(res=>res)
    .catch(err=>err)
  if(err){
    ctx.body = {
      code:0,
      msg : err.message
    }
  }else{
    let annualReportData = {
      submitter_id: jobid,
      submitter: name,
      college,
      dept,
      report_name: fileName,
      submit_time: t
    }
    await annualReportCreate(annualReportData)
    console.log('ctx.file:')
    console.log(ctx.file)
    // var path = ctx.file.path.split('/')
    var filePath = ctx.file.path.split('\\')
    filePath = filePath[0] +'/' + filePath[1] + '/' + filePath[2];
    var port = ctx.req.headers.host.split(':')[1]
    ctx.body = {
      code:1,
      // data:ctx.file,
      filename:ctx.file.filename,//返回文件名
      url:'http://' + ctx.req.headers.host+ '/' + filePath // 返回访问路径
    }
  }
})
// // router.post('/uploadAnnualReport', upload.single('file'), async (ctx,next)=>{
// router.post('/uploadAnnualReport', upload.single('es'), async (ctx,next)=>{
//   ctx.body = {
//       code: 1,
//       data: ctx.file
//   }
// })

router.get('/getSchoolTime', async (ctx, next) => {
  const {schoolYearList, semesterList, getSchoolYearAndSemester, getSchoolWeek} = require('@/middlewares/setSchoolYear&Semester&Week')
  let schoolYearAndSemester = getSchoolYearAndSemester()
  let nowWeek = getSchoolWeek(2021, 2, 24)

  ctx.body = {
    schoolYearList,
    semesterList,
    schoolYearAndSemester,
    nowWeek
  }
})

module.exports = router


/**
   * 理论课程表   实践指导课程表(学生数)
   * 
   * 课程信息：
   * 班号、课程名称、学分、教师、课室、起止周、周几、节次、基本信息
   *  基本信息：课程代码、旧课程号、开课单位、英文名称、总学时、通识课程、课程分类、课程简介、课程关系
   *   课程关系：ap（先修课程）、fp（同修课程）
   * 
   * 开课班信息：
   * 班号：班号、课程编号、课程名
   * 时间：学年、学期、周、周几(xx节)
   * 教师：教师名
   * 教室：教室名
   * 备注：
   * 选课规则：
   * 教材：
   * 上课学生：学生数、学号、姓名、性别、专业、优先数
   */
  // let cs = [
  //   {
  //     c_id: 115966,
  //     c_name: '女士形象设计',
  //     c_credit: 2.0,
  //     c_teacher: ['LKX'],
  //     c_classroom: ['E305', '弘毅书院舞蹈房105'],
  //     c_weeks: '1-16',
  //     c_time: ['Mon12'],
  //     // c_day: ['Mon'],
  //     // c_section: ['67'],
  //     c_info: {
  //       c_code: 'ADE6019A',
  //       c_oldcode: 'ADE6019A',
  //       c_unit: '艺术设计系',
  //       c_en_name: "Ladies'Image Design",
  //       c_hours: 32,
  //       c_generalCourse: true,
  //       c_classification: '理论讲授',
  //       c_brief: {
  //         intro: '形象设计的重要性源自第一印象的重要性。在竞争日益激烈的今天，形象力与体力、智力并列为人生的三大资本，对个人前途和事业的发展有着不可忽视的重要作用，良好的形象是成功人生的开端。一个人的整体形象可以彰显个人、企业甚至国家的文化。好的形象对己可以增强自信，并通过美的外表及行为来塑造美的内心；对外可以赢得他人信任和好感，吸引他人的帮助和支持，从而促进自己事业的成功与人生的顺达。',
  //         file: '下载课程大纲文件 .doc文件'
  //       },
  //       c_relationship: {
  //         c_ap: '',
  //         c_fp: ''
  //       }
  //     }
  //   },
  //   {
  //     c_id: 117553,
  //     c_name: '并行程序设计',
  //     c_credit: 2.0,
  //     c_teacher: ['XZ'],
  //     c_classroom: ['E207'],
  //     c_weeks: '1-16',
  //     c_time: ['Mon89'],
  //     // c_day: ['Mon'],
  //     // c_section: ['89'],
  //     c_info: {
  //       c_code: 'CST3256A',
  //       c_oldcode: 'CST9043',
  //       c_unit: '计算机系',
  //       c_en_name: "Parallel Programming",
  //       c_hours: 32,
  //       c_generalCourse: false,
  //       c_classification: '理论讲授',
  //       c_brief: {
  //         intro: '',
  //         file: '下载课程大纲文件 .doc文件'
  //       },
  //       c_relationship: {
  //         c_ap: '',
  //         c_fp: ''
  //       }
  //     }
  //   },
  //   {
  //     c_id: 117547,
  //     c_name: '计算机网络',
  //     c_credit: 4.0,
  //     c_teacher: ['蔡伟鸿', '林泽铭(实验)'],
  //     c_classroom: ['讲堂六'],
  //     c_weeks: '1-16',
  //     c_time: ['Mon345', 'Thur67'],
  //     // c_day: ['Mon', 'Thur'],
  //     // c_section: ['34', '67'],
  //     c_info: {
  //       c_code: 'CST3402A',
  //       c_oldcode: 'CST3402A',
  //       c_unit: '计算机系',
  //       c_en_name: "Computer Networks",
  //       c_hours: 64,
  //       c_generalCourse: false,
  //       c_classification: '理论讲授',
  //       c_brief: {
  //         intro: '',
  //         file: '下载课程大纲文件 .doc文件'
  //       },
  //       c_relationship: {
  //         c_ap: '',
  //         c_fp: ''
  //       }
  //     }
  //   },
  //   {
  //     c_id: 116151,
  //     c_name: '生物多样性与人类福祉',
  //     c_credit: 2.0,
  //     c_teacher: ['ZHP'],
  //     c_classroom: ['D座302'],
  //     c_weeks: '1-16',
  //     c_time: ['Thur34'],
  //     // c_day: ['Thur'],
  //     // c_section: ['34'],
  //     c_info: {
  //       c_code: 'MBI6250A',
  //       c_oldcode: 'MBI6250A',
  //       c_unit: '海洋生物研究所',
  //       c_en_name: "The biodiversity and Human Welfare",
  //       c_hours: 32,
  //       c_generalCourse: true,
  //       c_classification: '理论讲授',
  //       c_brief: {
  //         intro: '',
  //         file: '下载课程大纲文件 .doc文件'
  //       },
  //       c_relationship: {
  //         c_ap: '',
  //         c_fp: ''
  //       }
  //     }
  //   },
  //   {
  //     c_id: 119411,
  //     c_name: '突发性疫情认知、防护与思考（网络课程）',
  //     c_credit: 1.0,
  //     c_teacher: ['江松琦(助教)'],
  //     c_classroom: ['*'],
  //     c_weeks: '1-16',
  //     c_time: [],
  //     // c_day: [],
  //     // c_section: [],
  //     c_info: {
  //       c_code: 'OLC1028A',
  //       c_oldcode: 'OLC1028A',
  //       c_unit: '汕头大学',
  //       c_en_name: "Cognition,Prevention and Thought of Emergency Epidemic(Online Course)",
  //       c_hours: 16,
  //       c_generalCourse: true,
  //       c_classification: '理论讲授',
  //       c_brief: {
  //         intro: '',
  //         file: '下载课程大纲文件 .doc文件'
  //       },
  //       c_relationship: {
  //         c_ap: '',
  //         c_fp: ''
  //       }
  //     }
  //   },
  //   {
  //     c_id: 119863,
  //     c_code: 'CST3855A',
  //     c_oldcode: 'CST8105',
  //     c_name: '[CST3855A]ACM程序设计竞赛[CST8105]',
  //     c_subject_name: 'ACM程序设计竞赛',
  //     c_teacher: ['陈夏铭', '陈银冬', '许建龙'],
  //     c_weeks: '1-16',
  //   },
  // ]