const router = require('koa-router')()
const send = require('koa-send')

const { userCreate, usernameQuery, userQuery } = require('@/controller/user')
const {teacherQuery, teacherCreate, teacherInfoQuery} = require('@/controller/teacher')
const {classCreate} = require('@/controller/class')
const {courseCreate} = require('@/controller/course')
const {evaluationSheetQuery, evaluationSheetUpdate, evaluationSheetQueryIfFinishedProgress, ifFinishEvaluationProgress} = require('@/controller/evaluationSheet')
const {role_taskCountQuery} = require('@/controller/role-taskCount')
const {annualReportQuery} = require('@/controller/annualReport')

const addToken = require('@/token/addToken')
const {encrypt, decrypt} = require('@/middlewares/bcrypt')
const localFilter = require('../middlewares/localFilter')
const {submittedAnnualReport, notSubmitAnnualReport} = require('../middlewares/findAnnualReportSubmitter')

const {selectableCollegeAndDeptOptions} = require('@/public/data/selectableCollegeAndDeptOptions')

router.post('/doregister', async (ctx, next) => {
  console.log(ctx.request)
  let {user, pass, jobid, name, college, dept, role, dean, deansoffice} = ctx.request.body
  pass = await encrypt(pass)
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
  let loginUser = ctx.request.body
  let userRes = await usernameQuery(loginUser.user)
  if(!userRes) {  // 数据库中没有匹配到用户名 null
    ctx.body = {
      code: 500,
      msg: '用户名或密码错误。',
    }
  }else {  // 匹配到用户名
    // let user = userRes.user // 其实这里暂时也能获取jobid，看后续会不会筛选返回数据的属性
    let {user, pass} = userRes
    let passCheck = await decrypt(loginUser.pass, pass) // return true/false
    if(!passCheck) {  // 密码错误
      ctx.body = {
        code: 500,
        msg: '用户名或密码错误。',
      }
    }else {
      let userinfo = await teacherInfoQuery(user)
      let {jobid} = userinfo
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
      }
      /**
       * PS: 前端拿到后台的token，可以
       * 1.存到localStorage。在src/components/login.vue中将token和user存进localStorage中
       * 2.存到vuex中
       */
    }
  }
})


// 测试，checkToken
router.post('/checkToken', async (ctx, next) => {
  console.log('-----this is checkToken URL: ')
  // ↓返回的是一个请求，只是根据不同情况可能修改了里面的ctx.response.body
  let returnCtx = await localFilter(ctx)
  ctx.body = returnCtx.response.body
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

  // 这里判断是否能该教师的jobid的可查询evaluationSheet的范围，和'/evaluationSheet'的一样
  let myJobid = ctx.response.body.jobid
  let deansofficeRes = await teacherQuery({jobid: myJobid}, [], ['deansoffice', 'college', 'dept'])
  let {deansoffice, college, dept} = deansofficeRes.rows[0].dataValues

  let maxSearchRangeValue
  if(deansoffice === 'false') {  // deansoffice=false，只能看到'my'
    maxSearchRangeValue = [['my']]
  }else if(deansoffice === '教务处') { // 能看到全部
    maxSearchRangeValue = [['school'], ['my']]
  }else if(deansoffice === '学院') {
    maxSearchRangeValue = [['school', college], ['my']]
  }else if(deansoffice === '系') {
    maxSearchRangeValue = [['school', college, dept], ['my']]
  }

  let searchRangeValue = maxSearchRangeValue
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
  let query = {submitter_id: jobids, id: sheet_id}
  let selfORName = ['submitter_id']

  let es
  let sheet = ''
  if(!jobids.length && schoolRangeSearch === false) {  // jobids为空，例如可能是查询的范围没有老师，也可能是查询范围是全校，此时实际查询中相当于where={}，需要进行区分
    es = []
  }else {
    es = await evaluationSheetQuery(query, [], {}, [], selfORName)
  }

  if(es.rows && es.rows.length) {
    sheet = es.rows[0]
    ctx.body = sheet
  }else {
    sheet = es
    let fail = '该评估表id不存在或没有查询权限哦'
    ctx.body = {fail}
  }
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
  let selectRangeOptions = selectableCollegeAndDeptOptions
  let deansofficeRes = await teacherQuery({jobid: myJobid}, [], ['deansoffice', 'college', 'dept'])
  let {deansoffice, college, dept} = deansofficeRes.rows[0].dataValues
  let maxSearchRangeValue
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

  // -----------查询deansoffice内(不包括自身)的听课工作完成情况，筛选条件只有最大范围、schoolYear-----------------
  // 查询deansoffice内(不包括自身)的听课工作完成情况，包括哪个教务处，可查询范围教师总人数，可查询范围未完成评估任务的教师。
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
        finishedCount: 0,
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
      // let queryRes = await evaluationSheetQueryIfFinishedProgress(queryContent, schoolYear, '>=')
      let queryRes = await ifFinishEvaluationProgress(queryContent, schoolYear, '>=')
      allQueryableFinishedTeacher = queryRes
      for(let ft of allQueryableFinishedTeacher.rows) {
        let ftItem = ft
        for(let t of allQueryableTeacherinfo.rows) {
          let tItem = t.dataValues
          if(ftItem.jobid === tItem.jobid) {
            for(let attr in tItem) {
              let attrContent = tItem[attr]
              ftItem[attr] = attrContent
            }
          }
        }
      }
      let allQueryableFinishedTeacherCount = allQueryableFinishedTeacher.count

      var deansofficeQueryableEP = {
        range: deansofficeQueryableStr,
        finishedCount: allQueryableFinishedTeacherCount,
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

  // 如果输入有input，即需要先模糊查找 教师工号 / 姓名 / 角色 = input。
  // 这样先筛选出符合条件的teacher，再考虑searchItem的'完成评估任务'、'未完成评估任务'等。
  if(input) {
    query = {
      setQuery: 'searchEvaluationProgressIncludeSearchRange&input',
      query,  // query中也包含jobid属性
      or: {
        jobid: input,
        name: input,
        role: input
      }
    }
  }

  // PS：如果是默认查询，会查询范围内的所有教师的jobid
  filter = ['jobid', 'name', 'role', 'dean', 'deansoffice', 'college', 'dept']
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

  let ep = {}
  let arp = {}
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
      // let queryRes = await evaluationSheetQueryIfFinishedProgress(queryContent, schoolYear, rangeSymbol, currentPage, pageSize)
      let queryRes = await ifFinishEvaluationProgress(queryContent, schoolYear, rangeSymbol, currentPage, pageSize)
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
      // let queryRes = await evaluationSheetQueryIfFinishedProgress(queryContent, schoolYear, rangeSymbol, currentPage, pageSize)
      let queryRes = await ifFinishEvaluationProgress(queryContent, schoolYear, rangeSymbol, currentPage, pageSize)
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
      let aRPagination = [currentPage, pageSize]
      arp = await submittedAnnualReport(schoolYear, teacherinfo, aRPagination)
    }else if(searchItem === 'notSubmitAnnualReport') {
      let aRPagination = [currentPage, pageSize]
      arp = await notSubmitAnnualReport(schoolYear, teacherinfo, aRPagination)
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
      let {jobid, role, dean} = item
      esQuery = {submitter_id: jobid, submit_time: schoolYear}
      esFilter = ['id']
      esFuzzySearchName = ['submit_time']
      let queryRes = await evaluationSheetQuery(esQuery, esPagination, esFilter, esFuzzySearchName, esSelfORName, esGroupQuery)
      let submittedNum = queryRes.count
      item.submittedNum = submittedNum
      let {count} = await role_taskCountQuery(role)
      item.taskCount = count
      if(role === '教师') {
        esQuery = {teacher_id: jobid, submit_time: schoolYear}
        esFilter = ['id']
        esFuzzySearchName = ['teacher_id', 'submit_time']
        let tQueryRes = await evaluationSheetQuery(esQuery, esPagination, esFilter, esFuzzySearchName, esSelfORName, esGroupQuery)
        item.beEvaluatedNum = tQueryRes.count
      }
      if(dean === 'true') {
        let arQ = {
          submitter_id: jobid,
          submit_time: schoolYear
        }
        let arFSN = ['submit_time']
        let arQueryRes = await annualReportQuery(arQ, [], ['submitter_id'], arFSN)
        item.aRSubmittedNum = arQueryRes.count
      }
    }
  }

  if(searchItem === 'submittedAnnualReport' || searchItem === 'notSubmitAnnualReport') {
    ctx.body = {
      selectRangeOptions,
      arp,
      deansofficeQueryableEP
    }
  }else {
    ctx.body = {
      selectRangeOptions,
      // teacherinfo,
      ep,
      deansofficeQueryableEP
    }
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
  let deansofficeRes = await teacherQuery({jobid: myJobid}, [], ['deansoffice', 'college', 'dept'])
  let {deansoffice, college, dept} = deansofficeRes.rows[0].dataValues
  let maxSearchRangeValue

  // TEST
  // deansoffice = '教务处'

  if(deansoffice === 'false') {  // deansoffice=false，只能看到'my'
    maxSearchRangeValue = [['my']]
  }else if(deansoffice === '教务处') { // 能看到全部
    maxSearchRangeValue = [['school'], ['my']]
  }else if(deansoffice === '学院') {
    maxSearchRangeValue = [['school', college], ['my']]
  }else if(deansoffice === '系') {
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

  if(input) {
    query = {
      setQuery: 'searchEvaluationProgressIncludeSearchRange&input',
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
  let arp = {}
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
      // let queryRes = await evaluationSheetQueryIfFinishedProgress(queryContent, schoolYear, rangeSymbol, currentPage, pageSize)
      let queryRes = await ifFinishEvaluationProgress(queryContent, schoolYear, rangeSymbol, currentPage, pageSize)
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
      // let queryRes = await evaluationSheetQueryIfFinishedProgress(queryContent, schoolYear, rangeSymbol, currentPage, pageSize)
      let queryRes = await ifFinishEvaluationProgress(queryContent, schoolYear, rangeSymbol, currentPage, pageSize)
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
      let aRPagination = [currentPage, pageSize]
      arp = await submittedAnnualReport(schoolYear, teacherinfo, aRPagination)
    }else if(searchItem === 'notSubmitAnnualReport') {
      let aRPagination = [currentPage, pageSize]
      arp = await notSubmitAnnualReport(schoolYear, teacherinfo, aRPagination)
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
      let {jobid, role, dean} = item
      esQuery = {submitter_id: jobid, submit_time: schoolYear}
      esFilter = ['id']
      esFuzzySearchName = ['submit_time']
      let queryRes = await evaluationSheetQuery(esQuery, esPagination, esFilter, esFuzzySearchName, esSelfORName, esGroupQuery)
      let submittedNum = queryRes.count
      item.submittedNum = submittedNum
      let {count} = await role_taskCountQuery(role)
      item.taskCount = count
      if(role === '教师') {
        esQuery = {teacher_id: jobid, submit_time: schoolYear}
        esFilter = ['id']
        esFuzzySearchName = ['teacher_id', 'submit_time']
        let tQueryRes = await evaluationSheetQuery(esQuery, esPagination, esFilter, esFuzzySearchName, esSelfORName, esGroupQuery)
        let beEvaluatedNum = tQueryRes.count
        item.beEvaluatedNum = beEvaluatedNum
      }
      if(dean === 'true') {
        let arQ = {
          submitter_id: jobid,
          submit_time: schoolYear
        }
        let arFSN = ['submit_time']
        let arQueryRes = await annualReportQuery(arQ, [], ['submitter_id'], arFSN)
        item.aRSubmittedNum = arQueryRes.count
      }
    }
  }

  if(searchItem === 'submittedAnnualReport' || searchItem === 'notSubmitAnnualReport') {
    ctx.body = {
      arp: arp.rows
    }
  }else {
    ctx.body = {
      ep: ep.rows
    }
  }
})

router.post('/evaluationSheetList', async (ctx, next) => {
  let myJobid = ctx.response.body.jobid

  let currentPage = parseInt(ctx.request.body.currentPage)
  let pageSize = parseInt(ctx.request.body.pageSize)
  let {searchRangeValue, searchItem, schoolYearItem, input} = ctx.request.body // string

  // 设置可查看的评估表的范围和数据，返回给前端
  // 这里是通过设置前端可输入的范围来修改query，但是实际上有安全问题，后端应该也要设置权限。（待弄）
  let selectRangeOptions = selectableCollegeAndDeptOptions
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

  let deansofficeRes = await teacherQuery({jobid: myJobid}, [], ['deansoffice', 'college', 'dept'])
  let {deansoffice, college, dept} = deansofficeRes.rows[0].dataValues
  let maxSearchRangeValue
  if(deansoffice === 'false') {  // deansoffice=false，只能看到'my'
    maxSearchRangeValue = [['my']]
  }else if(deansoffice === '教务处') { // 能看到全部
    maxSearchRangeValue = [['school'], ['my']]
  }else if(deansoffice === '学院') {
    maxSearchRangeValue = [['school', college], ['my']]
  }else if(deansoffice === '系') {
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

router.post('/annualReportList', async (ctx, next) => {
  let myJobid = ctx.response.body.jobid

  let currentPage = parseInt(ctx.request.body.currentPage)
  let pageSize = parseInt(ctx.request.body.pageSize)
  let {searchRangeValue, schoolYearItem, input} = ctx.request.body // string

  // 设置可查看的评估表的范围和数据，返回给前端
  // 这里是通过设置前端可输入的范围来修改query，但是实际上有安全问题，后端应该也要设置权限。（待弄）
  let selectRangeOptions = selectableCollegeAndDeptOptions
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
  let filter = {exclude: ['updatedAt']}
  let fuzzySearchName = []
  let selfORName = []

  // 筛选查询范围。若无输入查询范围，则设置为最大可查询范围（即默认的可查询范围）
  if(!searchRangeValue) {
    searchRangeValue = maxSearchRangeValue
  }
  let jobids = []
  let schoolRangeSearch = false
  for (let i of searchRangeValue) {
    if(i.length === 1 && i[0] === 'school') {  // [['school']]
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

  if(schoolYearItem) {
    let schoolYear = schoolYearItem.substring(0, 4) // evaulationSheet的submit_time年份
    query.submit_time = schoolYear
    fuzzySearchName.push('submit_time')
  }

  if(input) {
    query = {
      setQuery: 'searchAnnualReportIncludeSearchRange&input',
      query,
      or: {
        submitter_id: input,
        submitter: input,
      }
    }
  }

  let ar
  if(!jobids.length && schoolRangeSearch === false) {  // jobids为空，例如可能是查询的范围没有老师，也可能是查询范围是全校，此时实际查询中相当于where={}，需要进行区分
    ar = []
  }else {
    ar = await annualReportQuery(query, pagination, filter, fuzzySearchName, selfORName)
  }

  ctx.body = {
    ar,
    selectRangeOptions
  }
})

router.post('/exportAnnualReportList', async (ctx, next) => {
  let myJobid = ctx.response.body.jobid

  let currentPage = parseInt(ctx.request.body.currentPage)  // 为空
  let pageSize = parseInt(ctx.request.body.pageSize)  // 为空
  let {searchRangeValue, schoolYearItem, input} = ctx.request.body // string

  let deansofficeRes = await teacherQuery({jobid: myJobid}, [], ['deansoffice', 'college', 'dept'])
  let {deansoffice, college, dept} = deansofficeRes.rows[0].dataValues
  let maxSearchRangeValue
  if(deansoffice === 'false') {  // deansoffice=false，只能看到'my'
    maxSearchRangeValue = [['my']]
  }else if(deansoffice === '教务处') { // 能看到全部
    maxSearchRangeValue = [['school'], ['my']]
  }else if(deansoffice === '学院') {
    maxSearchRangeValue = [['school', college], ['my']]
  }else if(deansoffice === '系') {
    maxSearchRangeValue = [['school', college, dept], ['my']]
  }

  let query = {}
  let pagination = [currentPage, pageSize]
  let filter = {exclude: ['updatedAt']}
  let fuzzySearchName = []
  let selfORName = []

  // 筛选查询范围。若无输入查询范围，则设置为最大可查询范围（即默认的可查询范围）
  if(!searchRangeValue) {
    searchRangeValue = maxSearchRangeValue
  }
  let jobids = []
  let schoolRangeSearch = false
  for (let i of searchRangeValue) {
    if(i.length === 1 && i[0] === 'school') {  // [['school']]
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

  if(schoolYearItem) {
    let schoolYear = schoolYearItem.substring(0, 4) // evaulationSheet的submit_time年份
    query.submit_time = schoolYear
    fuzzySearchName.push('submit_time')
  }

  if(input) {
    query = {
      setQuery: 'searchAnnualReportIncludeSearchRange&input',
      query,
      or: {
        submitter_id: input,
        submitter: input,
      }
    }
  }

  let ar
  if(!jobids.length && schoolRangeSearch === false) {  // jobids为空，例如可能是查询的范围没有老师，也可能是查询范围是全校，此时实际查询中相当于where={}，需要进行区分
    ar = []
  }else {
    ar = await annualReportQuery(query, pagination, filter, fuzzySearchName, selfORName)
  }

  ctx.body = ar.rows
})

router.get('/annualReport/:report_id', async (ctx, next) => {
  let report_id = ctx.params.report_id

  // 这里判断是否能该教师的jobid的可查询evaluationSheet的范围，和'/evaluationSheet'的一样
  let myJobid = ctx.response.body.jobid
  let deansofficeRes = await teacherQuery({jobid: myJobid}, [], ['deansoffice', 'college', 'dept'])
  let {deansoffice, college, dept} = deansofficeRes.rows[0].dataValues

  let maxSearchRangeValue
  if(deansoffice === 'false') {  // deansoffice=false，只能看到'my'
    maxSearchRangeValue = [['my']]
  }else if(deansoffice === '教务处') { // 能看到全部
    maxSearchRangeValue = [['school'], ['my']]
  }else if(deansoffice === '学院') {
    maxSearchRangeValue = [['school', college], ['my']]
  }else if(deansoffice === '系') {
    maxSearchRangeValue = [['school', college, dept], ['my']]
  }

  let searchRangeValue = maxSearchRangeValue
  let jobids = []
  let schoolRangeSearch = false
  for (let i of searchRangeValue) {
    if(i.length === 1 && i[0] === 'school') {  // [['school']]
      schoolRangeSearch = true
      break
    }else if(i.length === 1 && i[0] === 'my') {
      if(jobids.indexOf(myJobid) === -1) {
        jobids.push(myJobid)
      }
    }else if(i.length === 2) { // [['school', 'xx学院']]
      let tQuery = {
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
  let query = {submitter_id: jobids, id: report_id}
  let selfORName = ['submitter_id']

  let ar
  let report = ''
  if(!jobids.length && schoolRangeSearch === false) {
    ar = []
  }else {
    ar = await annualReportQuery(query, [], {}, [], selfORName)
  }

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

router.post('/modifyFollowUpRecord', async (ctx, next) => {
  let {id, followUpRecord} = ctx.request.body
  let query = {id}
  let form = followUpRecord
  let updateRes = await evaluationSheetUpdate(form, query)
  if(updateRes[0] !== 0) {
    ctx.body = {
      msg: 'modify success'
    }
  }else {
    ctx.body = {
      errMsg: 'modify fail'
    }
  }
})

module.exports = router