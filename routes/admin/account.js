const router = require('koa-router')()
// const checkNotLogin = require('@/middlewares/check').checkNotLogin
// const checkLogin = require('@/middlewares/check').checkLogin
const md5 = require('md5')

const { userCreate, usernameQuery, userQuery } = require('@/controller/user')
const {teacherQuery, teacherCreate, teacherQueryByJobid, teacherInfoQuery} = require('@/controller/teacher')
const {classCreate} = require('@/controller/class')
const {courseCreate} = require('@/controller/course')
const {evaluationSheetCreate, evaluationSheetQuery, evaluationSheetQueryByYear, evaluationSheetPaginationQuery, evaluationSheetQueryIfFinishedProgress} = require('@/controller/evaluationSheet')
const {role_taskCountQuery} = require('@/controller/role-taskCount')
const addToken = require('@/token/addToken')
const checkToken = require('@/middlewares/checkToken')
const localFilter = require('../../middlewares/localFilter')


// 目前登录注册主要参考网址：
// https://blog.csdn.net/where_slr/article/details/100580730

// 注册
/**
 * 还有很多bug，
 * 例如:密码加密，判断当前是否处于登录状态，判断是否用户名密码等都输入了，用户名长度密码限制，等
 * 还有注册后的跳转界面，返回什么result
 * 还有模型关系参考：https://segmentfault.com/a/1190000017430752
 */
router.post('/doregister', async (ctx, next) => {
  console.log(ctx.request)
  let {user, pass, jobid, name, college, dept, role, dean, deansoffice} = ctx.request.body
  let registerUser = {user, pass, jobid}
  let registerTeacher = {jobid, name, college, dept, role, dean, deansoffice}
  // 查询用户名是否存在
  let query = await usernameQuery(user)
  if(!query) {
    await teacherCreate(registerTeacher)
    await userCreate(registerUser)
      .then(result => {
        ctx.body = {
          code: 200,
          msg: '注册成功。',
          message: result
        }
      }).catch(err => {
        console.log(err)
        ctx.body = {
          code: 500,
          msg: '注册失败。',
          message: err
        }
      })
  } else {
      ctx.body = {
        code: 500,
        message: '该用户名已注册。'
      }
  }
})

// 网页端登录
router.post('/doLogin', async (ctx, next) => {
  console.log(ctx)
  let loginUser = ctx.request.body
  let userRes = await userQuery(loginUser)  // 通过表user查询该用户
  let user = userRes.user // 其实这里暂时也能获取jobid，看后续会不会筛选返回数据的属性
  let userinfo = await teacherInfoQuery(user)
  let {jobid} = userinfo
  if(!userRes) {  // 数据库中没有匹配到用户
    ctx.body = {
      code: 500,
      msg: '用户名或密码错误。',
    }
  } else {  // 匹配到用户
    let token = await addToken({   // token中要携带的信息，自己定义
      user: loginUser.user,
      jobid,
    })
    ctx.body = {
      code: 200,
      tokenCode: 200, // token返回码
      token,  // 返回给前端
      user: loginUser.user,
      msg: '登录成功。',
      status: true, // 登录状态，目前还没用上，不知道要不要弄到数据库去
      /**
       * PS: 前端拿到后台的token，可以
       * 1.存到localStorage。在src/components/login.vue中将token和user存进localStorage中
       * 2.存到vuex中
       */
    }
  }
})


// 测试，checkToken
// 到时候应该要做一个后端的请求拦截器
/**
 * 不对
 * 当token失效时，现在的网站一般会做两种处理，
 * 一种是跳转到登陆页面让用户重新登陆获取新的token，
 * 另外一种就是当检测到请求失效时，网站自动去请求新的token，第二种方式在app保持登陆状态上面用得比较多。
 * 到时候要区分小程序和网页端进行处理TAT
 */
router.post('/checkToken', async (ctx, next) => {
  console.log('-----this is checkToken URL: ')
  // ↓返回的是一个请求，只是根据不同情况可能修改了里面的ctx.response.body
  let returnCtx = await localFilter(ctx)
  ctx.body = returnCtx.response.body
})

router.post('/test', async (ctx, next) =>{
  
  ctx.body = {status: true}
})

router.post('/create-course', async (ctx, next) => {
  let courseinfo = ctx.request.body
  await courseCreate(courseinfo)
  console.log(ctx.request.body)
  ctx.body = 'create course success'
})

router.post('/create-class', async (ctx, next) => {
  let classinfo = ctx.request.body
  let time = ''
  let teacher = ''
  let classroom = ''
  console.log(ctx.request.body)
  if(classinfo.time) {
    classinfo.time.forEach((timeItem, index, array) => {
      let t = ''
      timeItem.forEach((item) => {
        t += item
      })
      time += t + ',' 
    })
  }
  classinfo.teacher.forEach(item => {
    teacher += item + ','
  })
  classinfo.classroom.forEach(item => {
    classroom += item + ','
  })
  classinfo.time = time
  classinfo.teacher = teacher
  console.log(typeof(classinfo.teacher))
  classinfo.classroom = classroom
  console.log('classroom: ' + classroom)
  await classCreate(classinfo)
  ctx.body = 'create class success'
})

router.get('/evaluationSheet/:sheet_id', async (ctx, next) => {
  let sheet_id = ctx.params.sheet_id
  let {jobid} = ctx.response.body

  let query = {submitter_id: jobid, id: sheet_id}
  let sheet = await evaluationSheetQuery(query)
  ctx.body = sheet[0] // evaluationSheetQuery()中是findAll，但是这里实际上最多只会返回1个对象
})

const send = require('koa-send')
router.get('/es', async (ctx, next) => {
  console.log('这里是es')
  

  // let {jobid} = ctx.response.body
  // let year = new Date().getFullYear()

  // // 这里待改，其实不需要evaluationSHeetQueryByYear,到时参考下面这个evaluationSheetQuery即可
  // let eS = await evaluationSheetQueryByYear(jobid, year)
  // let length = eS.length
  // await exportDocx(eS[1])

  

  // const path = '../../public/evaluationSheet1.docx';
  // ctx.set("Content-disposition", "attachment; filename=" + path)
  // ctx.attachment(path);
  // await send(ctx, path)

  var fileName = 'evaluationSheet1.docx'
    // Set Content-Disposition to "attachment" to signal the client to prompt for download.
    // Optionally specify the filename of the download.
    // 设置实体头（表示消息体的附加信息的头字段）,提示浏览器以文件下载的方式打开
    // 也可以直接设置 ctx.set("Content-disposition", "attachment; filename=" + fileName);
    ctx.attachment(fileName)
    await send(ctx, fileName, { root: __dirname})


  // ctx.response.body='es'
})


// 查询评估进度
router.post('/evaluationProgress', async (ctx, next) => {
  let myJobid = ctx.response.body.jobid

  let currentPage = parseInt(ctx.request.body.currentPage)
  let pageSize = parseInt(ctx.request.body.pageSize)
  let {searchRangeValue, searchItem, schoolYearItem, input} = ctx.request.body // string
  let schoolYear = schoolYearItem.substring(0, 4) // evaulationSheet的submit_time年份

  // 设置可查看的评估表的范围和数据，返回给前端
  // 这里是通过设置前端可输入的范围来修改query，但是实际上有安全问题，后端应该也要设置权限。（待弄）
  let selectRangeOptions = [
    {
      value: 'school',
      label: '全校',
      children: [
        {
          value: '工学院',
          label: '工学院',
          children: [
            {
              value: '计算机系',
              label: '计算机系',
            },
            {
              value: '机械设计与自动化系',
              label: '机械设计与自动化系',
            },
            {
              value: '土木工程系',
              label: '土木工程系',
            },
            {
              value: '电子系',
              label: '电子系',
            },
          ]
        },
        {
          value: '商学院',
          label: '商学院',
          children: [
            {
              value: '工商管理',
              label: '工商管理',
            },
            {
              value: '商务英语',
              label: '商务英语',
            },
          ]
        },
        {
          value: '医学院',
          label: '医学院',
          children: [
            {
              value: '临床医学',
              label: '临床医学',
            },
            {
              value: '口腔科',
              label: '口腔科',
            },
            {
              value: '骨科',
              label: '骨科',
            }
          ]
        },
        {
          value: '海洋中心',
          label: '海洋中心',
          children: [
            {
              value: '海洋生物研究',
              label: '海洋生物研究',
            },
          ]
        },
        {
          value: '就业中心',
          label: '就业中心',
          children: [
            {
              value: '就业指导中心',
              label: '就业指导中心',
            },
          ]
        },
      ]
    },
    {
      value: 'my',
      label: '我的',
    }
  ]
  let deansofficeRes = await teacherQuery({jobid: myJobid}, [], ['deansoffice', 'college', 'dept'])
  let {deansoffice, college, dept} = deansofficeRes.rows[0].dataValues
  let maxSearchRangeValue

  // TEST
  // deansoffice = '教务处'

  if(deansoffice === 'false') {  // deansoffice=false，只能看到'my'
    selectRangeOptions[0].disabled = true  // schoolViewable
    let collegesChildren = selectRangeOptions[0].children
    for(let i of collegesChildren) {
      i.disabled = true
      let deptsChildren = i.children
      for(let j of deptsChildren) {
        j.disabled = true
      }
    }
    maxSearchRangeValue = [['my']]
  }else if(deansoffice === '教务处') { // 能看到全部
    maxSearchRangeValue = [['school'], ['my']]
  }else if(deansoffice === '学院') {
    let collegesChildren = selectRangeOptions[0].children
    for(let i of collegesChildren) {
      if(college !== i.value) {
        i.disabled = true
        let deptsChildren = i.children
        for(let j of deptsChildren) {
          j.disabled = true
        }
      }
    }
    maxSearchRangeValue = [['school', college], ['my']]
  }else if(deansoffice === '系') {
    let collegesChildren = selectRangeOptions[0].children
    for(let i of collegesChildren) {
      if(college === i.value) {
        let deptsChildren = i.children
        for(let j of deptsChildren) {
          if(dept !== j.value) {
            j.disabled = true
          }
        }
      }else {
        i.disabled = true
        let deptsChildren = i.children
        for(let j of deptsChildren) {
          j.disabled = true
        }
      }
    }
    maxSearchRangeValue = [['school', college, dept], ['my']]
  }

  // -----------查询最大查询范围内的听课工作完成情况，筛选条件只有最大范围、schoolYear-----------------
  // 查询最大查询范围内的听课工作完成情况，包括哪个教务处，可查询范围教师总人数，可查询范围未完成评估任务的教师。
  // 逻辑和下面的一样，基本就是取的下面的代码，只是下面的代码要加上searchRangeValue和input的筛选，这里不需要。
  if(deansoffice === 'false') { // 不是教务管理人员
    var deansofficeQueryableEP = "不是教务管理人员哦"
  }else { // 是教务管理人员
    let deansofficeQueryableRange = maxSearchRangeValue.concat()
    deansofficeQueryableRange.pop() // 删除['my']
    let jobids = []
    let i = deansofficeQueryableRange[0]
    let schoolRangeSearch
    let deansofficeQueryableStr = ''
    if(i.length === 1 && i[0] === 'school') {  // [['school']]
      // 只要存在'school'，即查询全部evaluationSheet，而目前下面的evaluationSheetQuery()默认查询所有表。
      // 因此这里break，则不修改查询条件，仍然jobids=[] aQuery={}
      schoolRangeSearch = true
      deansofficeQueryableStr = '全校'
    }else if(i.length === 2) { // [['school', 'xx学院']]
      let tQuery = {  // 查询该学院的教师，再根据教师查询对应的evaluationSheet
        college: i[1]
      }
      let teachers_jobid = await teacherQuery(tQuery, [], ['jobid'])
      for(let i of teachers_jobid.rows) {
        let {jobid} = i.dataValues
        if(jobids.indexOf(jobid) === -1) {
          jobids.push(jobid)
        }
      }
      deansofficeQueryableStr = i[1]
    }else if(i.length === 3) {  // [['school', 'xx学院', 'xx系']]
      let tQuery = {  // 查询该系的教师
        college: i[1],
        dept: i[2]
      }
      let teachers_jobid = await teacherQuery(tQuery, [], ['jobid'])
      for(let i of teachers_jobid.rows) {
        let {jobid} = i.dataValues
        if(jobids.indexOf(jobid) === -1) {
          jobids.push(jobid)
        }
      }
      deansofficeQueryableStr = i[1] + ' ' + i[2]
    }
    let aQuery = {jobid: jobids}
    let aSelfORName = ['jobid']
    let aFilter = ['jobid', 'name', 'role', 'dean', 'deansoffice']
    let allQueryableTeacherinfo
    // jobids为空(jobids=[])。例如可能上面通过searchRangeValue的范围没有教师(例如查询的某个系没有教师)，也可能是查询范围为全校，需要进行区分。第一种情况直接设置teacherinfo=[]
    if(!jobids.length && schoolRangeSearch === false){  // 如果jobids=[] 会导致 aQuery=={[]} 即where:{}，没有任何查询条件，会返回所有数据
      allQueryableTeacherinfo = []
    }else {
      allQueryableTeacherinfo = await teacherQuery(aQuery, [], aFilter, [], aSelfORName)  
    }

    if(!allQueryableTeacherinfo.rows || !allQueryableTeacherinfo.rows.length) { // allQueryableTeacherinfo格式为{count: x, rows: ['xxx']}，若查询不到对应teacher，则此时{count: 0, rows: []}
      // allQueryableTeacherinfo = {
      //   count: 0,
      //   rows: []
      // }
      var deansofficeQueryableEP = {
        range: deansofficeQueryableStr,
        notFinishedCount: 0,
        teacherTotal: 0
      }
    }else {
      // 查询当前教师可查询的范围内的所有人数
      let allQueryableTeacherCount = allQueryableTeacherinfo.count

      // 查询当前教师可查询的范围内所有未完成评估任务的人数
      let queryContent = []
      for(let i of allQueryableTeacherinfo.rows) {
        let item = i.dataValues
        let {jobid, role} = item
        let taskCountQuery = await role_taskCountQuery(role)
        let taskCount = taskCountQuery.count
        let queryItem = {
          submitter_id: jobid,
          taskCount: parseInt(taskCount),
        }
        if(role === '教师') {
          queryItem = {
            submitter_id: jobid,
            taskCount: parseInt(taskCount),
            teacher_id: jobid
          }
        }
        queryContent.push(queryItem)
      }
      let queryRes = await evaluationSheetQueryIfFinishedProgress(queryContent, schoolYear, '<')
      allQueryableNotFinishedTeacher = queryRes
      for(let nft of allQueryableNotFinishedTeacher.rows) {
        let nftItem = nft
        for(let t of allQueryableTeacherinfo.rows) {
          let tItem = t.dataValues
          if(nftItem.jobid === tItem.jobid) {
            for(let attr in tItem) {
              let attrContent = tItem[attr]
              nftItem[attr] = attrContent
            }
          }
        }
      }
      let allQueryableNotFinishedTeacherCount = allQueryableNotFinishedTeacher.count

      var deansofficeQueryableEP = {
        range: deansofficeQueryableStr,
        notFinishedCount: allQueryableNotFinishedTeacherCount,
        teacherTotal: allQueryableTeacherCount
      }
    }
  }
  
  // --------查询schoolYear范围内输入searchRangeValue、input、searchItem后的教师评估结果-----------------

  let query = {}
  let pagination = [currentPage, pageSize]
  let filter = {}
  let fuzzySearchName = []
  let selfORName = []
  let orQueryName = []

  // 筛选查询范围。若无输入查询范围，则设置为最大可查询范围（即默认的可查询范围）
  if(!searchRangeValue) {
    searchRangeValue = maxSearchRangeValue
  }

  let jobids = [] // 要在循环外，因为是jobid是跟随循环累积push进去的
  // 由于查询范围包含'school' 和 查询范围的结果为空(即查询的某个范围没有教师) 这两种情况都会导致jobids=[]，此时即where:{}，返回全部数据
  // 因此设置schoolRangeSearch用来区分(!jobids.length)的情况是哪一种导致
  let schoolRangeSearch = false 
  for (let i of searchRangeValue) {
    if(i.length === 1 && i[0] === 'school') {  // [['school']]
      // 只要存在'school'，即查询全部evaluationSheet，而目前下面的evaluationSheetQuery()默认查询所有表。
      // 因此这里break，则不修改查询条件，仍然jobids=[] query={}
      schoolRangeSearch = true
      break
    }else if(i.length === 1 && i[0] === 'my') {
      if(jobids.indexOf(myJobid) === -1) {
        jobids.push(myJobid)
      }
    }else if(i.length === 2) { // [['school', 'xx学院']]
      let tQuery = {  // 查询该学院的教师，再根据教师查询对应的evaluationSheet
        college: i[1]
      }
      let teachers_jobid = await teacherQuery(tQuery, [], ['jobid'])
      for(let i of teachers_jobid.rows) {
        let {jobid} = i.dataValues
        if(jobids.indexOf(jobid) === -1) {
          jobids.push(jobid)
        }
      }
    }else if(i.length === 3) {  // [['school', 'xx学院', 'xx系']]
      let tQuery = {  // 查询该系的教师
        college: i[1],
        dept: i[2]
      }
      let teachers_jobid = await teacherQuery(tQuery, [], ['jobid'])
      for(let i of teachers_jobid.rows) {
        let {jobid} = i.dataValues
        if(jobids.indexOf(jobid) === -1) {
          jobids.push(jobid)
        }
      }
    }
  }
  query = {jobid: jobids}
  selfORName = ['jobid']
  console.log('jobids: ')
  console.log(jobids)

  // 如果输入有input，即需要先模糊查找 教师工号 / 姓名 / 角色 = input。
  // 这样先筛选出符合条件的teacher，再考虑searchItem的'完成评估任务'、'未完成评估任务'等。
  if(input) {
    // query中增加一个or 查询jobid/name/role
    // query.jobid = input
    // query.name = input
    // query.role = input
    // orQueryName = ['jobid', 'name', 'role']
    // fuzzySearchName.push('jobid', 'name', 'role')
    query = {
      setQuery: 'includeSearchRange&input',
      query,
      or: {
        jobid: input,
        name: input,
        role: input
      }
    }
  }

  // PS：如果是默认查询，会查询范围内的所有教师的jobid
  filter = ['jobid', 'name', 'role', 'dean', 'deansoffice', 'college', 'dept']
  // let teacherinfo = await teacherQuery(query, pagination, filter, fuzzySearchName, selfORName)
  let teacherinfo
  // jobids为空(jobids=[])。例如可能上面通过searchRangeValue的范围没有教师(例如查询的某个系没有教师)，也可能是查询范围为全校，需要进行区分。第一种情况直接设置teacherinfo=[]
  if(!jobids.length && schoolRangeSearch === false){  // 如果jobids=[] 会导致 query=={[]} 即where:{}，没有任何查询条件，会返回所有数据
    teacherinfo = []
  }else {
    // 有无searchItem，之后的查询evaluationSheet函数是不一样的。
    if(searchItem) {  // 设置了筛选'未完成评估任务'、'已完成评估任务'等
      // ↓这里不能用pagination。要先筛选出所有符合筛选范围的teacher，再查询evaluationSheet判断他们的评估进度，在查询evaluationSheet返回submitter_id那里用pagination。
      teacherinfo = await teacherQuery(query, [], filter, fuzzySearchName, selfORName, orQueryName)
    }else { // 没有设置筛选'未完成评估任务'、'已完成评估任务'等，则此时默认查询条件只有searchRangeValue和schoolYear，需要分页
      teacherinfo = await teacherQuery(query, pagination, filter, fuzzySearchName, selfORName, orQueryName)
    }
  }
  // console.log(teacherinfo)

  let ep = {}
  if(!teacherinfo.rows || !teacherinfo.rows.length) { // teacherinfo格式为{count: x, rows: ['xxx']}，若查询不到对应teacher，则此时{count: 0, rows: []}
    ep = {
      count: 0,
      rows: []
    }
  }else 
  if(searchItem) {
    let rangeSymbol = ''  // 在'>=' 或 '<'中选择，判断是≥taskCount还是<，用来查询'已完成评估任务'或'未完成'
    if(searchItem === 'finishedEvaluation') { // '已完成评估任务'
      rangeSymbol = '>='
      let queryContent = []
      for(let i of teacherinfo.rows) {
        let item = i.dataValues
        let {jobid, role} = item
        let taskCountQuery = await role_taskCountQuery(role)
        let taskCount = taskCountQuery.count
        let queryItem = {
          submitter_id: jobid,
          taskCount: parseInt(taskCount),
        }
        if(role === '教师') {
          queryItem = {
            submitter_id: jobid,
            taskCount: parseInt(taskCount),
            teacher_id: jobid
          }
        }
        queryContent.push(queryItem)
      }
      // console.log('queryContent: ')
      // console.log(queryContent)
      // var query = await evaluationSheetQueryIfFinishedProgress(queryContent, schoolYear, '<', 1, 10)
      let queryRes = await evaluationSheetQueryIfFinishedProgress(queryContent, schoolYear, rangeSymbol, currentPage, pageSize)
      ep = queryRes
      for(let q of ep.rows) {
        let qItem = q
        for(let t of teacherinfo.rows) {
          let tItem = t.dataValues
          if(qItem.jobid === tItem.jobid) {
            for(let attr in tItem) {
              let attrContent = tItem[attr]
              qItem[attr] = attrContent
            }
          }
        }
      }
    }else if(searchItem === 'notFinishEvaluation') {
      rangeSymbol = '<'
      let queryContent = []
      for(let i of teacherinfo.rows) {
        let item = i.dataValues
        let {jobid, role} = item
        let taskCountQuery = await role_taskCountQuery(role)
        let taskCount = taskCountQuery.count
        let queryItem = {
          submitter_id: jobid,
          taskCount: parseInt(taskCount),
        }
        if(role === '教师') {
          queryItem = {
            submitter_id: jobid,
            taskCount: parseInt(taskCount),
            teacher_id: jobid
          }
        }
        queryContent.push(queryItem)
      }
      let queryRes = await evaluationSheetQueryIfFinishedProgress(queryContent, schoolYear, rangeSymbol, currentPage, pageSize)
      ep = queryRes
      for(let q of ep.rows) {
        let qItem = q
        for(let t of teacherinfo.rows) {
          let tItem = t.dataValues
          if(qItem.jobid === tItem.jobid) {
            for(let attr in tItem) {
              let attrContent = tItem[attr]
              qItem[attr] = attrContent
            }
          }
        }
      }
    }else if(searchItem === 'submittedAnnualReport') {
      // 待完成！！！！！！！！！！！！！！！！！！！
    }else if(searchItem === 'notSubmitAnnualReport') {
      // 待完成！！！！！！！！！！！！！！！！！！！
    }
  }
  else {  // teacherinfo 不为空，且不需要筛选'已完成评估'、'未完成评估'等
    let esQuery = {}
    let esPagination = [currentPage, pageSize]
    let esFilter = {}
    let esFuzzySearchName = []
    let esSelfORName = []
    let esGroupQuery = {}
    ep = teacherinfo
    for(let i of ep.rows) {
      let item = i.dataValues
      let {jobid, role} = item
      // let es1 = await evaluationSheetQuery({submitter_id: jobid}, [], ['id'])  // 其实['id']是没必要的，由于目的是获得长度而已，想让获取数据少一点而已
      esQuery = {submitter_id: jobid, submit_time: schoolYear}
      esFuzzySearchName = ['submit_time']
      let queryRes = await evaluationSheetQuery(esQuery, esPagination, esFilter, esFuzzySearchName, esSelfORName, esGroupQuery)
      let submittedNum = queryRes.count
      item.submittedNum = submittedNum
      let {count} = await role_taskCountQuery(role)
      item.taskCount = count
      if(role === '教师') {
        // let es2 = await evaluationSheetQuery({teacher_id: jobid}, [], ['id'], ['teacher_id'])
        esQuery = {teacher_id: jobid, submit_time: schoolYear}
        esFuzzySearchName = ['teacher_id', 'submit_time']
        let tQueryRes = await evaluationSheetQuery(esQuery, esPagination, esFilter, esFuzzySearchName, esSelfORName, esGroupQuery)
        let beEvaluatedNum = tQueryRes.count
        item.beEvaluatedNum = beEvaluatedNum
      }
    }
  }

  ctx.body = {
    selectRangeOptions,
    // teacherinfo,
    ep,
    deansofficeQueryableEP
  }
})

// 总体和上面'/evaluationProgress'一致。但是无currentPage&pageSize，因为前端要导出查询出来的所有评估进度的xlsx文件，不需要分页。
// 且只需要返回ep。
router.post('/exportEvaluationProgress', async (ctx, next) => {
  let myJobid = ctx.response.body.jobid

  let currentPage = parseInt(ctx.request.body.currentPage)  // 为空
  let pageSize = parseInt(ctx.request.body.pageSize)  // 为空
  let {searchRangeValue, searchItem, schoolYearItem, input} = ctx.request.body // string
  let schoolYear = schoolYearItem.substring(0, 4) // evaulationSheet的submit_time年份

  // 设置可查看的评估表的范围和数据，返回给前端
  // 这里是通过设置前端可输入的范围来修改query，但是实际上有安全问题，后端应该也要设置权限。（待弄）
  let selectRangeOptions = [
    {
      value: 'school',
      label: '全校',
      children: [
        {
          value: '工学院',
          label: '工学院',
          children: [
            {
              value: '计算机系',
              label: '计算机系',
            },
            {
              value: '机械设计与自动化系',
              label: '机械设计与自动化系',
            },
            {
              value: '土木工程系',
              label: '土木工程系',
            },
            {
              value: '电子系',
              label: '电子系',
            },
          ]
        },
        {
          value: '商学院',
          label: '商学院',
          children: [
            {
              value: '工商管理',
              label: '工商管理',
            },
            {
              value: '商务英语',
              label: '商务英语',
            },
          ]
        },
        {
          value: '医学院',
          label: '医学院',
          children: [
            {
              value: '临床医学',
              label: '临床医学',
            },
            {
              value: '口腔科',
              label: '口腔科',
            },
            {
              value: '骨科',
              label: '骨科',
            }
          ]
        },
        {
          value: '海洋中心',
          label: '海洋中心',
          children: [
            {
              value: '海洋生物研究',
              label: '海洋生物研究',
            },
          ]
        },
        {
          value: '就业中心',
          label: '就业中心',
          children: [
            {
              value: '就业指导中心',
              label: '就业指导中心',
            },
          ]
        },
      ]
    },
    {
      value: 'my',
      label: '我的',
    }
  ]
  let deansofficeRes = await teacherQuery({jobid: myJobid}, [], ['deansoffice', 'college', 'dept'])
  let {deansoffice, college, dept} = deansofficeRes.rows[0].dataValues
  let maxSearchRangeValue

  // TEST
  // deansoffice = '教务处'

  if(deansoffice === 'false') {  // deansoffice=false，只能看到'my'
    selectRangeOptions[0].disabled = true  // schoolViewable
    let collegesChildren = selectRangeOptions[0].children
    for(let i of collegesChildren) {
      i.disabled = true
      let deptsChildren = i.children
      for(let j of deptsChildren) {
        j.disabled = true
      }
    }
    maxSearchRangeValue = [['my']]
  }else if(deansoffice === '教务处') { // 能看到全部
    maxSearchRangeValue = [['school'], ['my']]
  }else if(deansoffice === '学院') {
    let collegesChildren = selectRangeOptions[0].children
    for(let i of collegesChildren) {
      if(college !== i.value) {
        i.disabled = true
        let deptsChildren = i.children
        for(let j of deptsChildren) {
          j.disabled = true
        }
      }
    }
    maxSearchRangeValue = [['school', college], ['my']]
  }else if(deansoffice === '系') {
    let collegesChildren = selectRangeOptions[0].children
    for(let i of collegesChildren) {
      if(college === i.value) {
        let deptsChildren = i.children
        for(let j of deptsChildren) {
          if(dept !== j.value) {
            j.disabled = true
          }
        }
      }else {
        i.disabled = true
        let deptsChildren = i.children
        for(let j of deptsChildren) {
          j.disabled = true
        }
      }
    }
    maxSearchRangeValue = [['school', college, dept], ['my']]
  }
  
  let query = {}
  let pagination = [currentPage, pageSize]
  let filter = {}
  let fuzzySearchName = []
  let selfORName = []
  let orQueryName = []

  if(!searchRangeValue) {
    searchRangeValue = maxSearchRangeValue
  }

  let jobids = []
  let schoolRangeSearch = false 
  for (let i of searchRangeValue) {
    if(i.length === 1 && i[0] === 'school') {  // [['school']]
      // 只要存在'school'，即查询全部evaluationSheet，而目前下面的evaluationSheetQuery()默认查询所有表。
      // 因此这里break，则不修改查询条件，仍然jobids=[] query={}
      schoolRangeSearch = true
      break
    }else if(i.length === 1 && i[0] === 'my') {
      if(jobids.indexOf(myJobid) === -1) {
        jobids.push(myJobid)
      }
    }else if(i.length === 2) { // [['school', 'xx学院']]
      let tQuery = {  // 查询该学院的教师，再根据教师查询对应的evaluationSheet
        college: i[1]
      }
      let teachers_jobid = await teacherQuery(tQuery, [], ['jobid'])
      for(let i of teachers_jobid.rows) {
        let {jobid} = i.dataValues
        if(jobids.indexOf(jobid) === -1) {
          jobids.push(jobid)
        }
      }
    }else if(i.length === 3) {  // [['school', 'xx学院', 'xx系']]
      let tQuery = {  // 查询该系的教师
        college: i[1],
        dept: i[2]
      }
      let teachers_jobid = await teacherQuery(tQuery, [], ['jobid'])
      for(let i of teachers_jobid.rows) {
        let {jobid} = i.dataValues
        if(jobids.indexOf(jobid) === -1) {
          jobids.push(jobid)
        }
      }
    }
  }
  query = {jobid: jobids}
  selfORName = ['jobid']
  console.log('jobids: ')
  console.log(jobids)

  if(input) {
    query = {
      setQuery: 'includeSearchRange&input',
      query,
      or: {
        jobid: input,
        name: input,
        role: input
      }
    }
  }

  filter = ['jobid', 'name', 'role', 'dean', 'deansoffice', 'college', 'dept']
  let teacherinfo
  if(!jobids.length && schoolRangeSearch === false){  // 如果jobids=[] 会导致 query=={[]} 即where:{}，没有任何查询条件，会返回所有数据
    teacherinfo = []
  }else {
    if(searchItem) {  // 设置了筛选'未完成评估任务'、'已完成评估任务'等
      teacherinfo = await teacherQuery(query, [], filter, fuzzySearchName, selfORName, orQueryName)
    }else { // 没有设置筛选'未完成评估任务'、'已完成评估任务'等，则此时默认查询条件只有searchRangeValue和schoolYear，需要分页
      teacherinfo = await teacherQuery(query, pagination, filter, fuzzySearchName, selfORName, orQueryName)
    }
  }

  let ep = {}
  if(!teacherinfo.rows || !teacherinfo.rows.length) { // teacherinfo格式为{count: x, rows: ['xxx']}，若查询不到对应teacher，则此时{count: 0, rows: []}
    ep = {
      count: 0,
      rows: []
    }
  }else 
  if(searchItem) {
    let rangeSymbol = ''  // 在'>=' 或 '<'中选择，判断是≥taskCount还是<，用来查询'已完成评估任务'或'未完成'
    if(searchItem === 'finishedEvaluation') { // '已完成评估任务'
      rangeSymbol = '>='
      let queryContent = []
      for(let i of teacherinfo.rows) {
        let item = i.dataValues
        let {jobid, role} = item
        let taskCountQuery = await role_taskCountQuery(role)
        let taskCount = taskCountQuery.count
        let queryItem = {
          submitter_id: jobid,
          taskCount: parseInt(taskCount),
        }
        if(role === '教师') {
          queryItem = {
            submitter_id: jobid,
            taskCount: parseInt(taskCount),
            teacher_id: jobid
          }
        }
        queryContent.push(queryItem)
      }
      // console.log('queryContent: ')
      // console.log(queryContent)
      // var query = await evaluationSheetQueryIfFinishedProgress(queryContent, schoolYear, '<', 1, 10)
      let queryRes = await evaluationSheetQueryIfFinishedProgress(queryContent, schoolYear, rangeSymbol, currentPage, pageSize)
      ep = queryRes
      for(let q of ep.rows) {
        let qItem = q
        for(let t of teacherinfo.rows) {
          let tItem = t.dataValues
          if(qItem.jobid === tItem.jobid) {
            for(let attr in tItem) {
              let attrContent = tItem[attr]
              qItem[attr] = attrContent
            }
          }
        }
      }
    }else if(searchItem === 'notFinishEvaluation') {
      rangeSymbol = '<'
      let queryContent = []
      for(let i of teacherinfo.rows) {
        let item = i.dataValues
        let {jobid, role} = item
        let taskCountQuery = await role_taskCountQuery(role)
        let taskCount = taskCountQuery.count
        let queryItem = {
          submitter_id: jobid,
          taskCount: parseInt(taskCount),
        }
        if(role === '教师') {
          queryItem = {
            submitter_id: jobid,
            taskCount: parseInt(taskCount),
            teacher_id: jobid
          }
        }
        queryContent.push(queryItem)
      }
      let queryRes = await evaluationSheetQueryIfFinishedProgress(queryContent, schoolYear, rangeSymbol, currentPage, pageSize)
      ep = queryRes
      for(let q of ep.rows) {
        let qItem = q
        for(let t of teacherinfo.rows) {
          let tItem = t.dataValues
          if(qItem.jobid === tItem.jobid) {
            for(let attr in tItem) {
              let attrContent = tItem[attr]
              qItem[attr] = attrContent
            }
          }
        }
      }
    }else if(searchItem === 'submittedAnnualReport') {
      // 待完成！！！！！！！！！！！！！！！！！！！
    }else if(searchItem === 'notSubmitAnnualReport') {
      // 待完成！！！！！！！！！！！！！！！！！！！
    }
  }
  else {  // teacherinfo 不为空，且不需要筛选'已完成评估'、'未完成评估'等
    let esQuery = {}
    let esPagination = [currentPage, pageSize]
    let esFilter = {}
    let esFuzzySearchName = []
    let esSelfORName = []
    let esGroupQuery = {}
    ep = teacherinfo
    for(let i of ep.rows) {
      let item = i.dataValues
      let {jobid, role} = item
      esQuery = {submitter_id: jobid, submit_time: schoolYear}
      esFuzzySearchName = ['submit_time']
      let queryRes = await evaluationSheetQuery(esQuery, esPagination, esFilter, esFuzzySearchName, esSelfORName, esGroupQuery)
      let submittedNum = queryRes.count
      item.submittedNum = submittedNum
      let {count} = await role_taskCountQuery(role)
      item.taskCount = count
      if(role === '教师') {
        esQuery = {teacher_id: jobid, submit_time: schoolYear}
        esFuzzySearchName = ['teacher_id', 'submit_time']
        let tQueryRes = await evaluationSheetQuery(esQuery, esPagination, esFilter, esFuzzySearchName, esSelfORName, esGroupQuery)
        let beEvaluatedNum = tQueryRes.count
        item.beEvaluatedNum = beEvaluatedNum
      }
    }
  }

  // ctx.body = {
  //   ep
  // }
  ctx.body = ep.rows
})

router.post('/evaluationSheetList', async (ctx, next) => {
  let myJobid = ctx.response.body.jobid

  let currentPage = parseInt(ctx.request.body.currentPage)
  let pageSize = parseInt(ctx.request.body.pageSize)
  let {searchRangeValue, searchItem, schoolYearItem, input} = ctx.request.body // string

  // 设置可查看的评估表的范围和数据，返回给前端
  // 这里是通过设置前端可输入的范围来修改query，但是实际上有安全问题，后端应该也要设置权限。（待弄）
  let selectRangeOptions = [
    {
      value: 'school',
      label: '全校',
      children: [
        {
          value: '工学院',
          label: '工学院',
          children: [
            {
              value: '计算机系',
              label: '计算机系',
            },
            {
              value: '机械设计与自动化系',
              label: '机械设计与自动化系',
            },
            {
              value: '土木工程系',
              label: '土木工程系',
            },
            {
              value: '电子系',
              label: '电子系',
            },
          ]
        },
        {
          value: '商学院',
          label: '商学院',
          children: [
            {
              value: '工商管理',
              label: '工商管理',
            },
            {
              value: '商务英语',
              label: '商务英语',
            },
          ]
        },
        {
          value: '医学院',
          label: '医学院',
          children: [
            {
              value: '临床医学',
              label: '临床医学',
            },
            {
              value: '口腔科',
              label: '口腔科',
            },
            {
              value: '骨科',
              label: '骨科',
            }
          ]
        },
        {
          value: '海洋中心',
          label: '海洋中心',
          children: [
            {
              value: '海洋生物研究',
              label: '海洋生物研究',
            },
          ]
        },
        {
          value: '就业中心',
          label: '就业中心',
          children: [
            {
              value: '就业指导中心',
              label: '就业指导中心',
            },
          ]
        },
      ]
    },
    {
      value: 'my',
      label: '我的',
    }
  ]
  let deansofficeRes = await teacherQuery({jobid: myJobid}, [], ['deansoffice', 'college', 'dept'])
  let {deansoffice, college, dept} = deansofficeRes.rows[0].dataValues
  let maxSearchRangeValue
  if(deansoffice === 'false') {  // deansoffice=false，只能看到'my'
    selectRangeOptions[0].disabled = true  // schoolViewable
    let collegesChildren = selectRangeOptions[0].children
    for(let i of collegesChildren) {
      i.disabled = true
      let deptsChildren = i.children
      for(let j of deptsChildren) {
        j.disabled = true
      }
    }
    // selectRangeOptions[1].disabled = false // myViewable 其实可不写，只要不为true，默认可见
    maxSearchRangeValue = [['my']]
  }else if(deansoffice === '教务处') { // 能看到全部
    // selectRangeOptions[0].disabled = false
    // selectRangeOptions[1].disabled = false
    maxSearchRangeValue = [['school'], ['my']]
  }else if(deansoffice === '学院') {
    let collegesChildren = selectRangeOptions[0].children
    for(let i of collegesChildren) {
      if(college !== i.value) {
        i.disabled = true
        let deptsChildren = i.children
        for(let j of deptsChildren) {
          j.disabled = true
        }
      }
    }
    maxSearchRangeValue = [['school', college], ['my']]
  }else if(deansoffice === '系') {
    let collegesChildren = selectRangeOptions[0].children
    for(let i of collegesChildren) {
      if(college === i.value) {
        let deptsChildren = i.children
        for(let j of deptsChildren) {
          if(dept !== j.value) {
            j.disabled = true
          }
        }
      }else {
        i.disabled = true
        let deptsChildren = i.children
        for(let j of deptsChildren) {
          j.disabled = true
        }
      }
    }
    maxSearchRangeValue = [['school', college, dept], ['my']]
  }

  let query = {}
  let pagination = [currentPage, pageSize]
  let filter = {}
  let fuzzySearchName = []
  let selfORName = []

  // 筛选查询范围。若无输入查询范围，则设置为最大可查询范围（即默认的可查询范围）
  if(!searchRangeValue) {
    searchRangeValue = maxSearchRangeValue
  }
  let jobids = [] // 要在循环外，因为是jobid是跟随循环累积push进去的
  let schoolRangeSearch = false
  for (let i of searchRangeValue) {
    if(i.length === 1 && i[0] === 'school') {  // [['school']]
      // 只要存在'school'，即查询全部evaluationSheet，而目前下面的evaluationSheetQuery()默认查询所有表。
      // 因此这里break，则不修改查询条件，仍然jobids=[] query={}
      schoolRangeSearch = true
      break
    }else if(i.length === 1 && i[0] === 'my') {
      if(jobids.indexOf(myJobid) === -1) {
        jobids.push(myJobid)
      }
    }else if(i.length === 2) { // [['school', 'xx学院']]
      let tQuery = {  // 查询该学院的教师，再根据教师查询对应的evaluationSheet
        college: i[1]
      }
      let teachers_jobid = await teacherQuery(tQuery, [], ['jobid'])
      for(let i of teachers_jobid.rows) {
        let {jobid} = i.dataValues
        if(jobids.indexOf(jobid) === -1) {
          jobids.push(jobid)
        }
      }
    }else if(i.length === 3) {  // [['school', 'xx学院', 'xx系']]
      let tQuery = {  // 查询该系的教师
        college: i[1],
        dept: i[2]
      }
      let teachers_jobid = await teacherQuery(tQuery, [], ['jobid'])
      for(let i of teachers_jobid.rows) {
        let {jobid} = i.dataValues
        if(jobids.indexOf(jobid) === -1) {
          jobids.push(jobid)
        }
      }
    }  
  }
  query = {submitter_id: jobids}
  selfORName = ['submitter_id']
  // console.log(jobids)

  // 如果输入有input，即需要查找
  if(input && searchItem) { // 实际上传入的参数一定会有searchItem
    // query = { [searchItem]: input } // 查询条件（目前设置只有一个）
    query[searchItem] = input
    fuzzySearchName.push(searchItem)  // 查询条件设置为模糊查询
  }

  // 如果输入有schoolYearItem
  if(schoolYearItem) {
    let schoolYear = schoolYearItem.substring(0, 4) // evaulationSheet的submit_time年份
    query.submit_time = schoolYear
    fuzzySearchName.push('submit_time')
  }

  // PS：如果是默认查询，会查询范围内的所有evaluationSheet
  // console.log(query)
  let es
  if(!jobids.length && schoolRangeSearch === false) {  // jobids为空，例如可能是查询的范围没有老师，也可能是查询范围是全校，此时实际查询中相当于where={}，需要进行区分
    es = []
  }else {
    es = await evaluationSheetQuery(query, pagination, filter, fuzzySearchName, selfORName)
  }

  // ctx.body = {jobids, evaluationSheets}
  // ctx.body = {evaluationSheets, es, es2}
  ctx.body = {
    es,
    selectRangeOptions
  }
})

// 和上面'/evaluationSheetList'的区别只有。输入的参数currentPage pageSize为空。且ctx.body只有es，没有selectRangeOptions
router.post('/exportEvaluationSheetList', async (ctx, next) => {
  let myJobid = ctx.response.body.jobid

  let currentPage = parseInt(ctx.request.body.currentPage)  // 为空
  let pageSize = parseInt(ctx.request.body.pageSize)  // 为空
  let {searchRangeValue, searchItem, schoolYearItem, input} = ctx.request.body // string

  // 设置可查看的评估表的范围和数据，返回给前端
  // 这里是通过设置前端可输入的范围来修改query，但是实际上有安全问题，后端应该也要设置权限。（待弄）
  let selectRangeOptions = [
    {
      value: 'school',
      label: '全校',
      children: [
        {
          value: '工学院',
          label: '工学院',
          children: [
            {
              value: '计算机系',
              label: '计算机系',
            },
            {
              value: '机械设计与自动化系',
              label: '机械设计与自动化系',
            },
            {
              value: '土木工程系',
              label: '土木工程系',
            },
            {
              value: '电子系',
              label: '电子系',
            },
          ]
        },
        {
          value: '商学院',
          label: '商学院',
          children: [
            {
              value: '工商管理',
              label: '工商管理',
            },
            {
              value: '商务英语',
              label: '商务英语',
            },
          ]
        },
        {
          value: '医学院',
          label: '医学院',
          children: [
            {
              value: '临床医学',
              label: '临床医学',
            },
            {
              value: '口腔科',
              label: '口腔科',
            },
            {
              value: '骨科',
              label: '骨科',
            }
          ]
        },
        {
          value: '海洋中心',
          label: '海洋中心',
          children: [
            {
              value: '海洋生物研究',
              label: '海洋生物研究',
            },
          ]
        },
        {
          value: '就业中心',
          label: '就业中心',
          children: [
            {
              value: '就业指导中心',
              label: '就业指导中心',
            },
          ]
        },
      ]
    },
    {
      value: 'my',
      label: '我的',
    }
  ]
  let deansofficeRes = await teacherQuery({jobid: myJobid}, [], ['deansoffice', 'college', 'dept'])
  let {deansoffice, college, dept} = deansofficeRes.rows[0].dataValues
  let maxSearchRangeValue
  if(deansoffice === 'false') {  // deansoffice=false，只能看到'my'
    selectRangeOptions[0].disabled = true  // schoolViewable
    let collegesChildren = selectRangeOptions[0].children
    for(let i of collegesChildren) {
      i.disabled = true
      let deptsChildren = i.children
      for(let j of deptsChildren) {
        j.disabled = true
      }
    }
    maxSearchRangeValue = [['my']]
  }else if(deansoffice === '教务处') { // 能看到全部
    maxSearchRangeValue = [['school'], ['my']]
  }else if(deansoffice === '学院') {
    let collegesChildren = selectRangeOptions[0].children
    for(let i of collegesChildren) {
      if(college !== i.value) {
        i.disabled = true
        let deptsChildren = i.children
        for(let j of deptsChildren) {
          j.disabled = true
        }
      }
    }
    maxSearchRangeValue = [['school', college], ['my']]
  }else if(deansoffice === '系') {
    let collegesChildren = selectRangeOptions[0].children
    for(let i of collegesChildren) {
      if(college === i.value) {
        let deptsChildren = i.children
        for(let j of deptsChildren) {
          if(dept !== j.value) {
            j.disabled = true
          }
        }
      }else {
        i.disabled = true
        let deptsChildren = i.children
        for(let j of deptsChildren) {
          j.disabled = true
        }
      }
    }
    maxSearchRangeValue = [['school', college, dept], ['my']]
  }

  let query = {}
  let pagination = [currentPage, pageSize]
  let filter = {}
  let fuzzySearchName = []
  let selfORName = []

  // 筛选查询范围。若无输入查询范围，则设置为最大可查询范围（即默认的可查询范围）
  if(!searchRangeValue) {
    searchRangeValue = maxSearchRangeValue
  }
  let jobids = [] // 要在循环外，因为是jobid是跟随循环累积push进去的
  let schoolRangeSearch = false
  for (let i of searchRangeValue) {
    if(i.length === 1 && i[0] === 'school') {  // [['school']]
      // 只要存在'school'，即查询全部evaluationSheet，而目前下面的evaluationSheetQuery()默认查询所有表。
      // 因此这里break，则不修改查询条件，仍然jobids=[] query={}
      schoolRangeSearch = true
      break
    }else if(i.length === 1 && i[0] === 'my') {
      if(jobids.indexOf(myJobid) === -1) {
        jobids.push(myJobid)
      }
    }else if(i.length === 2) { // [['school', 'xx学院']]
      let tQuery = {  // 查询该学院的教师，再根据教师查询对应的evaluationSheet
        college: i[1]
      }
      let teachers_jobid = await teacherQuery(tQuery, [], ['jobid'])
      for(let i of teachers_jobid.rows) {
        let {jobid} = i.dataValues
        if(jobids.indexOf(jobid) === -1) {
          jobids.push(jobid)
        }
      }
    }else if(i.length === 3) {  // [['school', 'xx学院', 'xx系']]
      let tQuery = {  // 查询该系的教师
        college: i[1],
        dept: i[2]
      }
      let teachers_jobid = await teacherQuery(tQuery, [], ['jobid'])
      for(let i of teachers_jobid.rows) {
        let {jobid} = i.dataValues
        if(jobids.indexOf(jobid) === -1) {
          jobids.push(jobid)
        }
      }
    }  
  }
  query = {submitter_id: jobids}
  selfORName = ['submitter_id']

  if(input && searchItem) { // 实际上传入的参数一定会有searchItem
    // query = { [searchItem]: input } // 查询条件（目前设置只有一个）
    query[searchItem] = input
    fuzzySearchName.push(searchItem)  // 查询条件设置为模糊查询
  }

  if(schoolYearItem) {
    let schoolYear = schoolYearItem.substring(0, 4) // evaulationSheet的submit_time年份
    query.submit_time = schoolYear
    fuzzySearchName.push('submit_time')
  }

  let es
  if(!jobids.length && schoolRangeSearch === false) {  // jobids为空，例如可能是查询的范围没有老师，也可能是查询范围是全校，此时实际查询中相当于where={}，需要进行区分
    es = []
  }else {
    es = await evaluationSheetQuery(query, pagination, filter, fuzzySearchName, selfORName)
  }

  ctx.body = es.rows
})

module.exports = router



/**
 * 以下是用session登录，已经可以登录的
 */

// router.get('/login', async (ctx, next) => {
//   await checkNotLogin(ctx)
//   await ctx.render('login', {
//     session: ctx.session
//   })
// })

// 较复杂的方法以后可以封装出去？
// router.post('/login', async (ctx, next) => {
//   console.log(ctx.request.body)
//   let name = ctx.request.body.name
//   let pass = ctx.request.body.password

//   await userModel.findDataByName(name)
//         .then(result => {
//             let res = result
//             if (name === res[0]['name'] && md5(pass) === res[0]['pass']) {
//                 ctx.body = true
//                 ctx.session.user = res[0]['name']
//                 ctx.session.id = res[0]['id']
//                 console.log('ctx.session.id', ctx.session.id)
//                 console.log('session', ctx.session)
//                 console.log('登录成功')
//             }else{
//                 ctx.body = false
//                 console.log('用户名或密码错误!')
//             }
//         }).catch(err => {
//             console.log(err)
//         })
// })

module.exports = router