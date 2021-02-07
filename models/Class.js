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
    // 后面待改，应该要要包括教师编号，防止重名
    // 目前是以字符串形式存储数组，因此不作为外键，后面看是否要改，改的话再加一个class-teacher表
    teacher_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // PS：这是后来自己手动加入的，所以也没有设置allowNull，
    // 前后端什么的目前也没做出修改，以后应该会出bug，特别是前端，待改
    teacher_name: {
      type: DataTypes.STRING,
      // allowNull: false,
    },
    // 原本想设classroom_id，作外键，但是这样要再弄一张表，麻烦，先这样叭
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