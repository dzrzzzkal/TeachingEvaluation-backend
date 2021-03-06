const selectableCollegeAndDeptOptions = [
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

module.exports = {
  selectableCollegeAndDeptOptions
}