module.exports = (sequelize, DataTypes) => {
  return sequelize.define('class', {
    id: { // 开课班号
      type: DataTypes.INTEGER,
      primaryKey: true, // PK
      allowNull: false,
    },
    course_id: {  // 外键，想要包括课程名，先这样吧
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    schoolYear: { // 学年
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    semester: { // 学期
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    week: { // 周
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    time: { // 周几(xx节)
      type: DataTypes.STRING(50),
      // allowNull: false,
    },
    // 目前是以字符串形式存储数组，因此不作为外键
    teacher_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teacher_name: {
      type: DataTypes.STRING,
      // allowNull: false,
    },
    classroom: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    note: { // 备注
      type: DataTypes.STRING,
    },
    selectedRule: { // 选课规则
      type: DataTypes.STRING,
    },
    teachingMaterial: { // 教材
      type: DataTypes.STRING,
    },
    student_id: { // 学生学号 外键
      type: DataTypes.INTEGER,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  })
}