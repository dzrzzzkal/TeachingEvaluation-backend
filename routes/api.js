const router = require('koa-router')()
const {userQuery, userJobidQuery} = require('@/controller/user')
const { wxUserCreate, openidQuery, uidQuery, deleteData } = require('@/controller/wxUser')
const {teacherQuery, teacherInfoQuery} = require('@/controller/teacher')
const {classesQuery, classQueryByName, classQueryByClassid} = require('@/controller/class')
// const {theorySheetCreate, theorySheetQuery, theorySheetQueryByYear, theorySheetPaginationQuery} = require('@/controller/evaluationSheet/theorySheet')
// const {studentReportSheetCreate, studentReportSheetQuery, studentReportSheetQueryByYear, studentReportSheetPaginationQuery} = require('@/controller/evaluationSheet/studentReportSheet')
// const {experimentSheetCreate, experimentSheetQuery, experimentSheetQueryByYear, experimentSheetPaginationQuery} = require('@/controller/evaluationSheet/experimentSheet')
// const {peSheetCreate, peSheetQuery, peSheetQueryByYear, peSheetPaginationQuery} = require('@/controller/evaluationSheet/peSheet')
// const {theoryOfPublicWelfareSheetCreate, theoryOfPublicWelfareSheetQuery, theoryOfPublicWelfareSheetQueryByYear, theoryOfPublicWelfareSheetPaginationQuery} = require('@/controller/evaluationSheet/theoryOfPublicWelfareSheet')
// const {practiceOfPublicWelfareSheetCreate, practiceOfPublicWelfareSheetQuery, practiceOfPublicWelfareSheetQueryByYear, practiceOfPublicWelfareSheetPaginationQuery} = require('@/controller/evaluationSheet/practiceOfPublicWelfareSheet')
const {evaluationSheetCreate, evaluationSheetQuery, evaluationSheetQueryByYear, evaluationSheetPaginationQuery} = require('@/controller/evaluationSheet')
const {role_taskCountQuery} = require('@/controller/role-taskCount')

const addToken = require('@/token/addToken')
const checkToken = require('@/middlewares/checkToken')
const {exportDocx} = require('@/middlewares/officegen')

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
  } else {  // 没有返回openid
    result = res // 返回errMsg
  }

  ctx.response.body = result
})

router.post('/doLogout', async (ctx, next) => {
  // 目前是决定先请求一次openid，再根据 openid 删除 wxUser中的整列数据 和 本地的token，待定吧，可能后面根据uid删除
  // let url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${js_code}&grant_type=authorization_code`

})

// 考虑用get还是post。
// get的话，通过后端本身进来就时的路由拦截，localFIlter()中的checkToken()的返回值中包含user
// post的话直接传入请求参数user
router.get('/getCourses', async (ctx, next) => {
  let {user, jobid} = ctx.body  // 获取用户名user、工号jobid
  // let teacher = user + jobid
  // let classRes = await classesQuery(teacher)
  let classRes = await classesQuery(user)
  ctx.body = classRes
})

// 格式/class?xx=aaa?yy=bbb
router.get('/class', async (ctx, next) => {
  // console.log(ctx.request.query)
  // console.log(ctx.request.querystring)
  let name = ctx.request.query.name
  if(name) {
    let res = await classQueryByName(name)
    console.log(res)
    ctx.body = res
  } else {
    ctx.body = '没有参数name'
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
  //   let t = await teacherQuery(teacherid[i])
  //   teacherinfo.push(t.name)
  // }
  // ctx.body = {
  //   res,nodemon
  //   teacherinfo
  // }
  
  ctx.body = res
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

  // await exportDocx(res)
})

// 用于小程序首页查看听课评估进度
router.get('/getEvaluationProgress', async (ctx, next) => {
  let {jobid} = ctx.response.body
  let year = new Date().getFullYear()

  // let tS = await theorySheetQueryByYear(jobid, y)
  // let srS = await studentReportSheetQueryByYear(jobid, y)
  // let eS = await experimentSheetQueryByYear(jobid, y)
  // let peS = await peSheetQueryByYear(jobid, y)
  // let topwS = await theoryOfPublicWelfareSheetQueryByYear(jobid, y)
  // let popwS = await practiceOfPublicWelfareSheetQueryByYear(jobid, y)
  // let length = tS.length + srS.length + eS.length + peS.length + topwS.length + popwS.length

  let eS = await evaluationSheetQueryByYear(jobid, year)
  let length = eS.length


  // 获取该教师身份，匹配对应的role_taskCount
  // 每位教师每学年的听课任务是：被听课1次，听课1次；
  // 每位督导员的听课任务是：每学年听课32次；
  // 主管教学校领导、教务处领导听课任务是：每学年16次；
  // 其他校领导与各学院领导听课任务是：每学年4次；
  let role = '主管教学校领导'
  let {count} = await role_taskCountQuery(role)

  ctx.body = {
    length,
    taskCount: count,
  }
})

// 小程序页面“我的”中，点击“已评估”，查看评估记录列表（只含部分表内容）
router.get('/getSubmittedSheetsList', async (ctx, next) =>{
  let {jobid} = ctx.response.body

  let currentPage = parseInt(1) || 1
  let pageSize = parseInt(4) || 2
  let terms = ['id', 'course_name', 'classification', 'teacher_id', 'createdAt']
  let eS = await evaluationSheetPaginationQuery(jobid, currentPage, pageSize, terms)

  ctx.body = {
    eS
  }

  // let tSPaging = await theorySheetPaginationQuery(jobid, currentPage, pageSize)
  // let srSPaging = await studentReportSheetPaginationQuery(jobid, currentPage, pageSize)
  // let eSPaging = await experimentSheetPaginationQuery(jobid, currentPage, pageSize)
  // let peSPaging = await peSheetPaginationQuery(jobid, currentPage, pageSize)
  // let topwSPaging = await theoryOfPublicWelfareSheetPaginationQuery(jobid, currentPage, pageSize)
  // let popwSPaging = await practiceOfPublicWelfareSheetPaginationQuery(jobid, currentPage, pageSize)

  // for(let sheet of tSPaging) {
  //   sheets.push(sheet)    
  // }
  // for(let sheet of srSPaging) {
  //   sheets.push(sheet)    
  // }
  // for(let sheet of eSPaging) {
  //   sheets.push(sheet)    
  // }
  // for(let sheet of peSPaging) {
  //   sheets.push(sheet)    
  // }
  // for(let sheet of topwSPaging) {
  //   sheets.push(sheet)    
  // }
  // for(let sheet of popwSPaging) {
  //   sheets.push(sheet)    
  // }


  // // 根据时间排序sheets，暂时没决定好是用submit_time还是createdAt
  // let len = sheets.length
  // for(let i = 0; i < len - 1; i++) {
  //   for(let j = 0; j < len - 1; j++) {
  //     if(new Date(sheets[j].createdAt).getTime() > new Date(sheets[j + 1].createdAt).getTime()) {
  //       let temp = sheets[j + 1]
  //       sheets[j + 1] = sheets[j]
  //       sheets[j] = temp
  //     }
  //   }
  // }
})

router.get('/evaluationSheet/:sheet_id', async (ctx, next) => {
  let sheet_id = ctx.params.sheet_id
  let {jobid} = ctx.response.body

  let query = {submitter_id: jobid, id: sheet_id}
  let sheet = await evaluationSheetQuery(query)
  ctx.body = sheet[0] // evaluationSheetQuery()中是findAll，但是这里实际上最多只会返回1个对象
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