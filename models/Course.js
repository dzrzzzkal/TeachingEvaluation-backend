module.exports = (sequelize, DataTypes) => {
  return sequelize.define('course', {
    id: { // 课程编号
      type: DataTypes.STRING(20),
      primaryKey: true, // PK
      allowNull: false,
    },
    oldid: {
      type: DataTypes.STRING(10), // 旧课程编码
    },
    name: { // 课程名
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    onlineCourse: { // 是否为网络课程
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    en_name: {  // 英文名称
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    credit: { // 学分
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    // teacher: {  // 教师
    // },
    // classroom: {  // 教室
    // },
    // week: { // 起止周
    // },
    // time: { // 周几+节次
    // },
    setupUnit: { // 开课单位
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    classHours: { // 学时
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    generalCourse: {  // 是否为通识课程
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    classification: { // 课程类型
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    briefIntro: { // 课程简介
      type: DataTypes.STRING,
    },
    syllabus: { // 课程大纲——文件链接
      type: DataTypes.STRING,
    },
    ap: { // 先修课程
      type: DataTypes.STRING,
    },
    fp: { // 同修课程
      type: DataTypes.STRING,
    },

  },
  {
    freezeTableName: true,
    timestamps: true,
  })
}