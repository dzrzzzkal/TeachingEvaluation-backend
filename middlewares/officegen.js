const officegen = require('officegen')
const fs = require('fs')


// https://www.cnblogs.com/liangyy/p/12466111.html
// https://blog.csdn.net/lvye1221/article/details/90339712
// https://www.npmjs.com/package/officegen
// https://www.cnblogs.com/jackson-yqj/p/10329448.html 抛出接口

const exportDocx = function(formData) {
  let {classification, 
    submitter_id, submitter, course_setupUnit, course_name, class_id, teacher_id, teacher_name, class_time, place, attend_num, actual_num, role, 
    environment, 
    evaluationList, appreciateMethod, concreteSuggestion, familiarity, extension, followUp, otherSuggestion, participant, submit_time, 
    followUpDegree, followUpParticipant, followUpParticipantSuggestion, followUpParticipantTime, 
    followUpCollege, followUpCollegeSuggestion, followUpCollegeTime,
    lecturer, lecturerRectification, lecturerTime,
    followUpUnit, followUpUnitSuggestion, followUpUnitTime
  } = formData
  // 处理evaluationList为数组，其本身为字符串(例如:优-,良,不合格+)
  evaluationList = evaluationList.split(',')

  // Create an empty Word object:
  let docx = officegen('docx')

  // Officegen calling this function after finishing to generate the docx document:
  docx.on('finalize', function(written) {
    console.log(
      'Finish to create a Microsoft Word document.'
    )
  })

  // title
  let pObj = docx.createP({ align: 'center' })
  let title
  switch (classification) {
    case 'theory':
      title = '汕头大学听课记录表（理论课适用）'
      break;
    case 'student report':
      title = '汕头大学听课记录表（学生汇报课适用）'
      break;
    case 'experiment':
      title = '汕头大学听课记录表（实验课适用）'
      break;
    case 'PE':
      title = '汕头大学听课记录表（公益课程理论讲授适用）'
      break;
    case 'theory of public welfare':
      title = '汕头大学听课记录表（公益课程服务实践适用）'
      break;
    case 'practice of public welfare':
      title = '汕头大学听课记录表（理论课适用）'
      break;
  
    default:
      break;
  }
  pObj.addText(title, {
    font_face: '黑体',
    font_size: 15,
    bold: true,
    align: 'center',
  })

  // briefinfo
  pObj = docx.createP()
  pObj.addText('开课单位：', {
    // font_face: '宋体', // 本身默认就是宋体
    font_size: 10.5,
  })
  pObj.addText(`     ${course_setupUnit}     `, {font_size: 10.5, underline: true})
  pObj.addText('  ')
  pObj.addText('课程名称：', {font_size: 10.5})
  pObj.addText(`     ${course_name}     `, {font_size: 10.5, underline: true})
  pObj.addText('  ')
  pObj.addText('开课班号：', {font_size: 10.5})
  pObj.addText(`     ${class_id}     `, {font_size: 10.5, underline: true})
  pObj.addText('  ')
  pObj.addText('授课教师：', {font_size: 10.5})
  pObj.addText(`     ${teacher_name}     `, {font_size: 10.5, underline: true})
  pObj.addText('  ')
  pObj.addText('听课时间：', {font_size: 10.5})
  pObj.addText(`     ${class_time}     `, {font_size: 10.5, underline: true})
  pObj.addText('  ')
  pObj.addText('地点：', {font_size: 10.5})
  pObj.addText(`     ${place}     `, {font_size: 10.5, underline: true})
  pObj.addText('  ')
  pObj.addText('学生应到人数：', {font_size: 10.5})
  pObj.addText(`     ${attend_num}     `, {font_size: 10.5, underline: true})
  pObj.addText('  ')
  pObj.addText('学生实到人数：', {font_size: 10.5})
  pObj.addText(`     ${actual_num}     `, {font_size: 10.5, underline: true})
  pObj.addText('  ')
  pObj.addLineBreak()
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
  pObj.addText(roleType, {font_size: 10.5})

  // 一、教学环境观察
  if(classification !== 'experiment') {
    pObj = docx.createP()
    pObj.addText('一、教学环境观察：', {bold: true, font_size: 10.5})
    pObj.addText('请观察教室安排是否合理，教室设备，教室采光、通风、噪音、温度等环境条件是否符合教学要求以及其他可能影响到教学效果的环境因素。', {font_size: 10.5})
    let environmentTable = [
      [{
        val: environment,
        opts: {
          align: "left",
          vAlign: "left",
          // color: "A00000", 
          sz: '21',
          // cellColWidth: 42,
          b: true,
          // shd: {
          //   fill: "7F7F7F",
          //   themeFill: "text1",
          //   "themeFillTint": "80"
          // },
          // fontFamily: "Avenir Book"
        }
      }]
    ]
    let environmentTableStyle = {
      // tableColWidth: 2400,
      tableColWidth: 8000,
      // tableSize: 24,
      // tableColor: "ada",
      // tableAlign: "center",
      // tableVAlign: "center",
      // tableFontFamily: "Comic Sans MS",
      borders: true
    }
    docx.createTable(environmentTable, environmentTableStyle)
    // pObj.addLineBreak()
    pObj = docx.createP()
  }
  
  // 二、评价
  pObj = docx.createP()
  let evaluationTitle = '二、评价'
  if(classification === 'experiment') {evaluationTitle = '一、观察清单'}
  pObj.addText(evaluationTitle, {bold: true, font_size: 10.5})
  let evaluationTable = [
    [{
      val: "项目",
      opts: {
        cellColWidth: 4261,
        b:true,
        sz: '21', // 字体大小
        spacingBefore: 120,
        spacingAfter: 120,
        spacingLine: 240,
        spacingLineRule: 'atLeast',
        shd: {
          fill: "7F7F7F",
          themeFill: "text1",
          "themeFillTint": "80"
        },
        fontFamily: "Avenir Book"
      }
    },{
      val: "内容",
      opts: {
        cellColWidth: 4261,
        b:true,
        sz: '21', // 字体大小
        spacingBefore: 120,
        spacingAfter: 120,
        spacingLine: 240,
        spacingLineRule: 'atLeast',
        shd: {
          fill: "7F7F7F",
          themeFill: "text1",
          "themeFillTint": "80"
        },
        fontFamily: "Avenir Book"
      }
    },{
      val: "推荐如下有效的教学行为",
      opts: {
        align: "center",
        vAlign: "center",
        cellColWidth: 42,
        b:true,
        sz: '21',
        shd: {
          fill: "92CDDC",
          themeFill: "text1",
          "themeFillTint": "80"
        }
      }
    },{
      val: ["评价等级", '优、良、中、合格、不合格、不适用（含+、-）'],
      opts: {
        cellColWidth: 4261,
        b:true,
        sz: '21', // 字体大小
        spacingBefore: 120,
        spacingAfter: 120,
        spacingLine: 240,
        spacingLineRule: 'atLeast',
        shd: {
          fill: "7F7F7F",
          themeFill: "text1",
          "themeFillTint": "80"
        },
        fontFamily: "Avenir Book"
      }
    }],
  ]
  if(classification === 'experiment') {
    let evaluationTable_experiment = [
      [{
        val: "类别",
        opts: {
          cellColWidth: 4261,
          b:true,
          sz: '21', // 字体大小
          spacingBefore: 120,
          spacingAfter: 120,
          spacingLine: 240,
          spacingLineRule: 'atLeast',
          shd: {
            fill: "7F7F7F",
            themeFill: "text1",
            "themeFillTint": "80"
          },
          fontFamily: "Avenir Book"
        }
      },{
        val: "观察项目",
        opts: {
          align: "center",
          vAlign: "center",
          cellColWidth: 42,
          b:true,
          sz: '21',
          shd: {
            fill: "92CDDC",
            themeFill: "text1",
            "themeFillTint": "80"
          }
        }
      },{
        val: ["评价等级", '优、良、中、合格、不合格、不适用（含+、-）'],
        opts: {
          cellColWidth: 4261,
          b:true,
          sz: '21', // 字体大小
          spacingBefore: 120,
          spacingAfter: 120,
          spacingLine: 240,
          spacingLineRule: 'atLeast',
          shd: {
            fill: "7F7F7F",
            themeFill: "text1",
            "themeFillTint": "80"
          },
          fontFamily: "Avenir Book"
        }
      }],
    ]
    evaluationTable = evaluationTable_experiment
  }
  let evaluationTableStyle = {
    // tableColWidth: 4261,
    // // tableColWidth: 2000,
    // tableSize: 24,
    // tableColor: "ada",
    // tableAlign: "left",
    // tableFontFamily: "Comic Sans MS",
    // spacingBefor: 120, // default is 100
    // spacingAfter: 120, // default is 100
    // spacingLine: 240, // default is 240
    // spacingLineRule: 'atLeast', // default is atLeast
    // indent: 100, // table indent, default is 0
    // fixedLayout: true, // default is false
    borders: true, // default is false. if true, default border size is 4
    // borderSize: 2, // To use this option, the 'borders' must set as true, default is 4
    // columns: [{ width: 900 }, { width: 1500 }, { width: 1500 }, { width: 20 }], // Table logical columns
    // columns: [{align: "center"}, {align: "left"}, {align: "left"}, {align: "center"},]
  }
  let theoryEvaluationContent = [
    ['教学态度', '教学认真，备课细致',  '向学生指出具体并对学习有指导性的目标；有教学内容提纲；对所下结论提供证据信息；结束时有总结。'],
    ['', '讲课精神饱满，举止得体，仪容整洁', '多数时间是面向学生的（不是面对电脑或屏幕），能与大多数学生沟通。'],
    ['教学能力', '声音宏亮，外语或普通话发音准确，表达流畅', '对关键的用词有解释；注重用语的准确、科学性。'],
    ['', '时间安排合理，节奏控制好', '能从容完成授课计划；提问并给予学生时间思考；内容过渡合理。'],
    ['', '条理性强，内容熟练，运用启发式教学', '讲授有条理；对学生表现给予及时反馈；不需要逐字读PPT；鼓励学生自由提问讨论并可随时应对学生的问题。'],
    ['', '内容符合大纲要求，重点突出', '一节课的知识点数量适当；收尾时强调重点；示范对重点知识的应用；提出进一步学习的参考文献；给学生创造应用知识的机会。'],
    ['', '理论联系实际；反映学科进展', '采用具体事例帮助学生理解；结合学科较新热点或引用较新文献。'],
    ['教学手段', '内容简明扼要；合理使用多媒体教学手段', 'PPT应清晰；图示应与课程内容相匹配；合理运用图片、视频等资料；多媒体技术运用应服务于课堂教学，避免干扰正常教学秩序情况。'],
    ['学生表现', '迟到现象少，听课率高', '学生缺席、迟到现象少（低于5%）；学生能跟随老师的讲课节奏；不存在与课堂无关的手机、电脑使用情况或低头做其他事情等现象。'],
    ['', '课堂表现积极、活跃', '大多数学生课堂表现活跃，学生之间、师生之间互动积极。'],
    ['总体评价等级', '', '']
  ]
  let studentReportEvaluationContent = [
    ['教学态度', '反馈及时，备课充分',  '针对学生的汇报，能及时作出意见反馈，向学生指出具体并对学习有指导性的修改目标；对所下结论提供证据信息；汇报结束能够对汇报内容进行适当点评。'],
    ['', '聆听汇报时精神饱满，态度认真 ，举止得体，仪容整洁', '多数时间是面向学生的，能与汇报人进行有效沟通。'],
    ['教学能力', '声音宏亮，外语或普通话发音准确，表达流畅', '对关键的用词有解释；注重用语的准确、科学性。'],
    ['', '时间安排合理，节奏控制好', '能提醒学生把控好汇报时间，从容完成课堂计划，提问并给予学生时间思考；内容过渡合理。'],
    ['', '课堂氛围把控得当，兼顾把控汇报人与聆听者学习节奏', '汇报人汇报时，能引导全体学生参与学习，把控课堂纪律。'],
    ['', '条理性强，内容熟练，运用启发式教学', '讲授有条理；对学生表现给予及时反馈；鼓励学生自由提问讨论并可随时应对学生的问题。'],
    ['', '理论联系实际；反映学科进展', '采用具体事例帮助学生理解；结合学科较新热点或引用较新文献。'],
    ['教学手段', '合理引导学生使用多媒体教学手段', '针对学生PPT出现的问题（如：PPT不清晰；图示与课程内容不匹配；图片、视频等资料运用不合理等）能指出并提出修改建议；引导学生合理应用多媒体技术，避免干扰正常教学秩序。'],
    ['学生表现', '汇报认真，准备充分', '汇报人准备充分，汇报时态度认真。'],
    ['', '迟到现象少，听课率高', '学生缺席、迟到现象少（低于5%）；学生能跟随汇报人、老师的讲课节奏；不存在与课堂无关的手机、电脑使用情况或低头做其他事情等现象。'],
    ['', '课堂表现积极、活跃', '大多数学生课堂表现活跃，学生之间、师生之间互动积极。'],
    ['总体评价等级', '', '']
  ]
  let experimentEvaluationContent = [
    ['实验环境与实验准备', '实验规章制度有悬挂上墙；实验场地整洁，实验室教学环境符合卫生和安全的要求。'],
    ['', '实验仪器、工具、材料齐备， 且处于良好的使用状态。'],
    ['教师指导过程', '对实验目的、实验内容、要求及注意事项的交代清楚明确。'],
    ['', '教师能熟练操作和使用实验仪器（或软件工具），能及时发现实验中出现的问题，并恰当地引导学生自行合理解决。'],
    ['', '实验内容充实，与实验大纲一致；讲授时间与实验操作时间分配比例恰当。'],
    ['', '实验教师让学生独立完成实验、重视操作能力训练。'],
    ['课堂组织管理', '每组实验人数安排合理（指在每套仪器设备上同时完成本实验项目的人数），学生能得到充分的动手操作机会。'],
    ['', '按时上课，实验课堂秩序良好，有效管理课堂；实验过程中指导教师始终在场，指导教师人数安排能满足指导学生实验的需求。'],
    ['学生表现', '学生缺席、迟到现象少（低于5%）；学生能跟随老师的讲课节奏；不存在与课堂无关的手机、电脑使用情况或低头做其他事情等现象。'],
    ['', '实验前学生有实验预习报告，实验时能遵循学生实验守则及实验安全操作规程。'],
    ['总体评价等级', '']
  ]
  let PEEvaluationContent = [
    ['教学态度', '教学认真，备课细致',  '教师按时到达授课运动场地；准时上、下课，不擅离课堂；课堂表现显示教师课前备课充分。'],
    ['', '讲课精神饱满，举止得体，仪容整洁', '穿运动服和运动鞋上课；明确本次课内容及学习目标；平等对待学生，耐心辅导；在课堂上不使用手机等通信工具。'],
    ['教学能力', '教学内容符合大纲，安排合理', '项目特点突出；有身体素质练习内容；符合大纲要求。'],
    ['', '讲解精确规范，教学方法适应学生学习需要', '讲解清晰、示范动作准确规范；身体素质练习手段科学；教学方法有实效；能因材施教, 注重学生个性发展及培养自我锻炼能力。'],
    ['', '运动量适宜，教学能促进学生身体素质的发展', '科学安排心肺功能锻炼内容，运动量适宜，有助于促进学生体质水平的提高；能促进学生运动技术、技能水平和身体素质的全面发展。'],
    ['', '师生间互动良好', '师生之间互动良好，能够激发学生的学习兴趣与主动性；注重终身体育意识及创新能力培养。'],
    ['教学措施', '教学措施得当，有安全意识', '热身准备活动充分，达到项目要求；对突发事故处理及时、科学、合理，如未发生可不评价。'],
    ['', '', '教学措施能有助于增进学生身心健康，有助于培养学生的积极进取、团结协作和集体主义精神；教学中始终贯彻安全意识教育。'],
    ['学生表现', '迟到现象少，听课率高', '学生缺席、迟到现象少（低于5%）；学生能跟随老师的讲课节奏；不存在与课堂无关的手机、电脑使用情况或低头做其他事情等现象。'],
    ['', '课堂表现积极、活跃', '大多数学生课堂表现活跃，学生之间、师生之间互动积极。'],
    ['总体评价等级', '', '']
  ]
  let theoryOfPublicWelfareEvaluationContent = [
    ['教学态度', '课堂掌控有序',  '能对课堂进行管理；课堂纪律好。'],
    ['', '教学认真，备课细致',  '课程开始时向学生指出具体的学习目标；有教学内容提纲。'],
    ['', '讲课精神饱满，举止得体，仪容整洁', '课程中能有效地引导学生；多数时间是面向学生的（不是面对电脑或屏幕）；能与大多数学生沟通。'],
    ['教学能力', '对学生有引导，表达流畅', '对学生的计划或分享给予及时反馈，能及时指出学生的不足；对关键的用词有解释；注重用语的准确、科学性。'],
    ['', '时间安排合理，节奏控制好', '课程内容安排适当；能让学生始终保持学习兴趣。'],
    ['', '条理性强，内容熟练，运用启发式教学', '讲授或指导有条理，从简单到复杂；老师对自己的计划或总结到位、评价合理；鼓励学生自由提问讨论并可随时应对学生的问题；'],
    ['', '理论联系实际；反映该服务内容的新进展', '理论讲授内容与该课程的实践环节紧密结合；采用具体事例帮助学生理解。'],
    ['教学手段', '合理使用多媒体教学手段', '老师自己上课使用的PPT应清晰；图示应与课程内容相匹配；能引导学生合理运用相片、视频、报告、论文等多种形式进行课程设计或总结。'],
    ['学生表现', '迟到现象少，听课率高', '学生缺席、迟到现象少（低于5%）；学生能跟随老师的讲课节奏；不存在与课堂无关的手机、电脑使用情况或低头做其他事情等现象。'],
    ['', '课堂表现积极、活跃', '大多数学生课堂表现活跃，学生之间、师生之间互动积极。'],
    ['总体评价等级', '', '']
  ]
  let practiceOfPublicWelfareEvaluationContent = [
    ['教师表现', '沟通与交流',  '老师在课程中平易近人、令人信任，与学生们进行交流互动，注重培养学生们的交流和沟通能力。'],
    ['', '知识传授及价值观引导',  '老师不仅传授公益知识，同时引导学生们如何做人（如如何具有奉献精神和积极、乐观向上的价值取向等）。'],
    ['', '启发思考和能力培养', '老师能启发学生们从多方面思考问题，注重培养学生们综合采用多种思维方式分析问题与解决问题的能力。'],
    ['', '活动准备及秩序维护', '老师在服务前与学生们们一起详细讨论活动方案，活动过程中能够维持活动安全有序。'],
    ['', '服务实践与示范', '老师严格按照活动方案进行实践服务，亲身示范如何安全、有效地进行服务。'],
    ['', '突发事件处理', '老师能有效而及时地处理突发事件与紧急情况。'],
    ['', '指导和观察', '老师能指导学生们如何与服务对象进行交流沟通，观察服务对象的行为和情感变化，进行资料的收集和整理。'],
    ['', '总结与反思', '老师对实践服务进行总结到位、评价合理，在反思、分享过程中注意对学生们进行情感、态度、价值观和环保意识等方面的教育。'],
    ['学生表现', '出席与参与情况', '学生缺席、迟到现象少（低于5%）；学生们都能有条不紊开展公益服务活动，分工明确，各司其职。'],
    ['', '表现积极、活跃', '大多数学生表现活跃，学生之间、师生之间互动积极。'],
    ['总体评价等级', '', '']
  ]
  let evaluationContent
  switch (classification) {
    case 'theory':
      evaluationContent = theoryEvaluationContent
      break;
    case 'student report':
      evaluationContent = studentReportEvaluationContent
      break;
    case 'experiment':
      evaluationContent = experimentEvaluationContent
      break;
    case 'PE':
      evaluationContent = PEEvaluationContent
      break;
    case 'theory of public welfare':
      evaluationContent = theoryOfPublicWelfareEvaluationContent
      break;
    case 'practice of public welfare':
      evaluationContent = practiceOfPublicWelfareEvaluationContent
      break;
  
    default:
      break;
  }
  for(let i = 0; i < evaluationContent.length; i++) {
    evaluationContent[i].push(evaluationList[i])
    evaluationTable.push(evaluationContent[i])
  }
  docx.createTable(evaluationTable, evaluationTableStyle)
  // pObj.addLineBreak()
  pObj = docx.createP()

  // 三、总体评价
  pObj = docx.createP()
  let overallEvaluationTitle = '三、总体评价'
  if(classification === 'experiment') {overallEvaluationTitle = '二、总体评价'}
  pObj.addText(overallEvaluationTitle, {bold: true, font_size: 10.5})
  // 处理一些数据，设置■□
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
  let submit_timeResolve = submit_time.split('/')
  let overallEvaluationTable = [
    [{
      val: ['最欣赏的方法或表现：', appreciateMethod],
      opts: {
        align: "left",
        vAlign: "left",
        // sz: '21',
        // cellColWidth: 42,
      }
    }], 
    [['给任课教师的具体建议：', concreteSuggestion]], 
    ['本人对听课的课程的内容熟悉程度：' + familiarityText],
    [
      ['建议推广主讲教师教学方法：' + extensionText, 
      '建议主讲教师提升教学能力，学院（部、中心）继续听课跟进：' + followUpText, 
      '其他建议：' + otherSuggestion, 
      `              听课人（签名）：${participant}           ${submit_timeResolve[0]}年 ${submit_timeResolve[1]}月 ${submit_timeResolve[2]}日`]
    ],

  ]
  let overallEvaluationTableStyle = {
    // tableColWidth: 2400,
    tableColWidth: 8000,
    tableSize: 6,
    // tableColor: "ada",
    tableAlign: "left",
    tableVAlign: "left",
    // tableFontFamily: "Comic Sans MS",
    borders: true
  }
  docx.createTable(overallEvaluationTable, overallEvaluationTableStyle)
  // pObj.addLineBreak()
  pObj = docx.createP()

  // 四、跟进记录
  if(followUp === 'true') {
    pObj = docx.createP()
    let followUpRecordTitle = '四、跟进记录'
    if(classification === 'experiment') {followUpRecordTitle = '三、跟进记录'}
    pObj.addText(followUpRecordTitle + '（勾选“需要跟进”及跟进“其他建议”时填写）', {bold: true, font_size: 10.5})
    // 处理一些数据，设置■□
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
    let followUpDegreeTable = [
      [{
        val: followUpDegreeText,
        opts: {
          align: "left",
          vAlign: "left",
          // sz: '21',
          // cellColWidth: 42,
        }
      }], 
    ]
    let followUpDegreeTableStyle = {
      // tableColWidth: 2400,
      tableColWidth: 8000,
      tableSize: 6,
      // tableColor: "ada",
      tableAlign: "left",
      tableVAlign: "left",
      // tableFontFamily: "Comic Sans MS",
      borders: true
    }
    docx.createTable(followUpDegreeTable, followUpDegreeTableStyle)
    // pObj.addLineBreak()
    pObj = docx.createP()
    let followUpParticipantTimeResolve = followUpParticipantTime.split('/')
    let followUpCollegeTimeResolve = followUpCollegeTime.split('/')
    let lecturerTimeResolve = lecturerTime.split('/')
    let followUpUnitTimeResolve = followUpUnitTime.split('/')
    let followUpRecordTable = [
      [{
        val: ['（跟进听课）', '听课教师意见及建议'],
        opts: {
          align: "left",
          vAlign: "left",
          // sz: '21',
          cellColWidth: 240,
        }
      }, {
        val: [followUpParticipantSuggestion, '', `             （签名）：${followUpParticipant}      ${followUpParticipantTimeResolve[0]}年 ${followUpParticipantTimeResolve[1]}月 ${followUpParticipantTimeResolve[2]}日`],
        opts: {
          align: "left",
          vAlign: "left",
          // sz: '21',
          cellColWidth: 1200,
        }
      }], 
      [['学院（部、中心）跟进意见'], [followUpCollegeSuggestion, '', `             （签名）：${followUpCollege}      ${followUpCollegeTimeResolve[0]}年 ${followUpCollegeTimeResolve[1]}月 ${followUpCollegeTimeResolve[2]}日`]],
      [['主讲教师反思及整改方案'], [lecturerRectification, '', `             （签名）：${lecturer}      ${lecturerTimeResolve[0]}年 ${lecturerTimeResolve[1]}月 ${lecturerTimeResolve[2]}日`]],
      [['教学管理、服务部门意见'], [followUpUnitSuggestion, '', `             （签名）：${followUpUnit}      ${followUpUnitTimeResolve[0]}年 ${followUpUnitTimeResolve[1]}月 ${followUpUnitTimeResolve[2]}日`]]
    ]
    let followUpRecordTableStyle = {
      tableColWidth: 4000,
      // tableColWidth: 8000,
      tableSize: 6,
      // tableColor: "ada",
      tableAlign: "left",
      tableVAlign: "left",
      // tableFontFamily: "Comic Sans MS",
      borders: true
    }
    docx.createTable(followUpRecordTable, followUpRecordTableStyle)

  }

  

  // We can even add images:
  // pObj.addImage('some-image.png')

  // Let's generate the Word document into a file:
  let out = fs.createWriteStream('C:\\Users\\Administrator\\Desktop\\evaluationSheet1.docx')

  out.on('error', function(err) {
    console.log(err)
  })

  // Async call to generate the output file:
  docx.generate(out)
}

module.exports = {
  exportDocx
}