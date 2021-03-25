const router = require('koa-router')()
const send = require('koa-send')
const fs = require('fs')

const {userQuery, usernameQuery, userJobidQuery} = require('@/controller/user')
const { wxUserCreate, openidQuery, uidQuery, deleteData } = require('@/controller/wxUser')
const {teacherQuery, teacherQueryByJobid, teacherInfoQuery} = require('@/controller/teacher')
const {classQuery, classQueryByTeacherName, classQueryWithCourse, classQueryByClassid} = require('@/controller/class')
const {evaluationSheetCreate, evaluationSheetQuery, evaluationSheetQueryByYear, evaluationSheetPaginationQuery} = require('@/controller/evaluationSheet')
const {role_taskCountQuery} = require('@/controller/role-taskCount')
const {annualReportCreate, annualReportQuery} = require('@/controller/annualReport')

const addToken = require('@/token/addToken')
const checkToken = require('@/middlewares/checkToken')
const {decrypt} = require('@/middlewares/bcrypt')
const {exportDocx} = require('@/middlewares/officegen')
const exportEvaluationSheet = require('@/middlewares/docxtemplater')
const {schoolYearList, semesterList, weekList, getSchoolYearAndSemester, getSchoolWeek} = require('@/middlewares/setSchoolYear&Semester&Week')

const wxAPI = require('@/API/wxAPI')

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
        // let userRes = await userQuery(loginUser)  // 通过表user查询该用户
        let userRes = await usernameQuery(user)
        if(!userRes) {  // 该用户名user不存在
          result = {
            code: 500,
            msg: '用户名或密码错误。'
          }
        } else {  // 该用户名user存在，再判断密码是否正确
          let passCheck = await decrypt(pass, userRes.pass) // return true/false
          if(!passCheck) {  // 密码错误
            result = {
              code: 500,
              msg: '用户名或密码错误。'
            }
          }else { // 用户名密码正确，则创建微信用户wxuser，并返回表teacher的信息和token
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
        // let userRes = await userQuery(loginUser)  // 通过表user查询该用户
        let userRes = await usernameQuery(user)
        if(!userRes) {
          result = {
            msg: '用户名或密码错误。'
          }
        }else {
          let passCheck = await decrypt(pass, userRes.pass)
          if(!passCheck) {  // 密码错误
            result = {
              code: 500,
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
  let query = {teacher_name: user, schoolYear, semester}
  let filter = {}
  let fuzzySearchName = ['teacher_name']
  let classRes = await classQuery(query, filter, fuzzySearchName)

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
  let {keyword, schoolYear, semester} = ctx.request.query
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
  ctx.body = res ? res : {fail: '没有查询到对应的课程信息。'}
})

router.post('/submitForm', async (ctx, next) => {
  let {jobid, user} = ctx.response.body
  let formData = ctx.request.body
  formData.submitter_id = jobid
  formData.submitter = user
  await evaluationSheetCreate(formData)
  ctx.body = 'Submit evaluation-sheet success.'
})

// 用于小程序首页查看听课评估进度
router.get('/getEvaluationProgress', async (ctx, next) => {
  let {jobid} = ctx.response.body
  let year = new Date().getFullYear()

  let eS = await evaluationSheetQueryByYear(jobid, year)
  let length = eS.length

  // 获取该教师身份，匹配对应的role_taskCount
  let {role, dean} = await teacherQueryByJobid(jobid)
  let beEvaluatedNum
  if(role === '教师') { // 若role为'教师'，需要加上被听课次数
    let query = {
      teacher_id: `${jobid},`,
      submit_time: year
    }
    let sheet = await evaluationSheetQuery(query, [], {}, ['teacher_id', 'submit_time'])
    beEvaluatedNum = sheet.count
  }
  let ec_submittedReportNum
  if(dean === 'true') { // 是系主任，则要加上年度报告提交情况
    let query = {
      submitter_id: jobid,
      submit_time: year
    }
    let filter = {}
    let fuzzySearchName = ['submit_time']
    let annualReport = await annualReportQuery(query, [], filter, fuzzySearchName)
    ec_submittedReportNum = annualReport.count
  }
  let {count} = await role_taskCountQuery(role)

  let schoolYearAndSemester = getSchoolYearAndSemester()
  let nowWeek = getSchoolWeek()

  ctx.body = {
    submittedSheetNum: length,
    taskCount: count,
    schoolYearAndSemester,
    nowWeek
  }
  if(beEvaluatedNum) {
    ctx.body.beEvaluatedNum = beEvaluatedNum
  }
  if(ec_submittedReportNum) {
    ctx.body.submittedReportNum = ec_submittedReportNum
  }
})

// 下载年度总结报告模板
router.get('/downloadAnnualReportTemplate', async (ctx, next) => {
  let fileName = 'annualReportTemplate.docx'
  // Set Content-Disposition to "attachment" to signal the client to prompt for download.
  // Optionally specify the filename of the download.
  // 设置实体头（表示消息体的附加信息的头字段）,提示浏览器以文件下载的方式打开
  // 也可以直接设置 ctx.set("Content-disposition", "attachment; filename=" + fileName);
  ctx.attachment(fileName)
  await send(ctx, fileName, { root: 'public/file'})
})

// 小程序页面“我的”中，点击“已评估”，查看评估记录列表（只含部分表内容）
// 待改，目前页码和数量是固定的，小程序端处也还没做下拉加页码
router.get('/getSubmittedSheetList', async (ctx, next) =>{
  let {jobid} = ctx.response.body
  let {keyword, page, size} = ctx.request.query
  let classidRes = await classQuery({course_id: keyword}, ['id'], ['course_id'])  // keyword查询包括课程编号
  classidRes.push(keyword)

  let currentPage = parseInt(page) || 1
  let pageSize = parseInt(size) || 8
  let query = {
    submitter_id: jobid,
    class_id: keyword,  // Array
    course_name: keyword,
    classification: keyword,
    teacher_name: keyword,
    submit_time: keyword
  }
  let pagination = [currentPage, pageSize]
  let filter = ['id', 'class_id', 'course_name', 'classification', 'teacher_name', 'submit_time']
  let fuzzySearchName = ['class_id', 'course_name', 'classification', 'teacher_name', 'submit_time']
  let selfORName = ['class_id']
  let orQueryName = ['class_id', 'course_name', 'classification', 'teacher_name', 'submit_time']
  let order = [['createdAt', 'DESC']]
  let eS = await evaluationSheetQuery(query, pagination, filter, fuzzySearchName, selfORName, orQueryName, order)
  ctx.body = eS
})

router.get('/getSubmittedAnnualReport', async (ctx, next) =>{
  let {jobid} = ctx.response.body
  let {keyword, page, size} = ctx.request.query

  let currentPage = parseInt(page) || 1
  let pageSize = parseInt(size) || 8
  let query = {
    submitter_id: jobid,
  }
  if(keyword) {
    query.submit_time = keyword
  }
  let pagination = [currentPage, pageSize]
  let filter = ['id', 'report_name', 'submit_time']
  let fuzzySearchName = keyword ? ['submit_time'] : []
  let selfORName = []
  let order = [['createdAt', 'DESC']]
  let aR = await annualReportQuery(query, pagination, filter, fuzzySearchName, selfORName, order)

  ctx.body = aR
})

router.get('/evaluationSheet/:sheet_id', async (ctx, next) => {
  let sheet_id = ctx.params.sheet_id
  let {jobid} = ctx.response.body

  let query = {submitter_id: jobid, id: sheet_id}
  let sheet = await evaluationSheetQuery(query)
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
  // let t = time.replace(/\//g, '-')
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
      submit_time: time
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

router.get('/downloadEvaluationSheet/:sheet_id', async (ctx, next) => {
  let {jobid} = ctx.response.body
  let sheet_id = ctx.params.sheet_id

  let query = {submitter_id: jobid, id: sheet_id}
  let eS = await evaluationSheetQuery(query)
  let eSContent = eS.rows[0]
  let {submitter, course_name, classification, submit_time} = eSContent
  switch (classification) {
    case 'theory':
      classification = '理论课'
      break;
    case 'student report':
      classification = '学生汇报课'
      break;
    case 'experiment':
      classification = '实验课'
      break;
    case 'PE':
      classification = '体育课'
      break;
    case 'theory of public welfare':
      classification = '公益课程理论讲授'
      break;
    case 'practice of public welfare':
      classification = '公益课程服务实践'
      break;
    default:
      classification = 'error'
      break;
  }
  submit_time = submit_time.replace(/\//g, '')
  let fileName = `${submitter}_${course_name}_${classification}_${submit_time}.docx`

  // await exportDocx(eSContent, fileName)
  await exportEvaluationSheet(eSContent, fileName)
  ctx.attachment(fileName)
  await send(ctx, fileName, { root: 'file/evaluationSheet'})
  fs.unlink('file/evaluationSheet/' + fileName, function(err) {
    if(err) {
      throw err
    }
    console.log('文件：file/evaluationSheet/' + fileName + '删除成功。')
  })
})


router.get('/annualReport/:report_id', async (ctx, next) => {
  let {jobid} = ctx.response.body
  let report_id = ctx.params.report_id

  let report = ''
  let query = {submitter_id: jobid, id: report_id}
  let filter = ['report_name']
  let ar = await annualReportQuery(query, [], filter)

  if(ar.rows && ar.rows.length) {
    report = ar.rows[0]
    let {report_name} = report
    let fileName = report_name
    ctx.attachment(fileName)
    await send(ctx, fileName, {root: 'file/annualReport'})
  }else {
    report = ar
    let fail = '该年度总结报告不存在或没有查询权限哦'
    ctx.body = {fail}
  }
})

router.get('/getSchoolTime', async (ctx, next) => {
  let schoolYearAndSemester = getSchoolYearAndSemester()
  let nowWeek = getSchoolWeek()

  ctx.body = {
    schoolYearList,
    semesterList,
    weekList,
    schoolYearAndSemester,
    nowWeek
  }
})

module.exports = router