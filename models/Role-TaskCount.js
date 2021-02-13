// 记录不同角色对应的每年需要完成的听课任务次数

// 每位教师每学年的听课任务是：被听课1次，听课1次；
// 每位督导员的听课任务是：每学年听课32次；
// 主管教学校领导、教务处领导听课任务是：每学年16次；
// 其他校领导与各学院领导听课任务是：每学年4次；

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('role-taskcount', {
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      autoIncrement: true,
      // autoIncrementIdentity: true,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  },
  {
    freezeTableName: true,
    // timestamps: true
    timestamps: false // 不要createAt updateAt
  })
}