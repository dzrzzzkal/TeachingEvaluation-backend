module.exports = (sequelize, DataTypes) => {
  return sequelize.define('teacher', {
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      autoIncrement: true,
      autoIncrementIdentity: true,
      allowNull: false,
    },
    jobid: {  // 工号
      type: DataTypes.STRING(20),
      primaryKey: true,  // 主键
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    college: {  // 学院
      type: DataTypes.STRING(50),
    },
    dept: { // 系 department
      type: DataTypes.STRING(50),
    },
    role: {
      type: DataTypes.STRING(20),
    },
    dean: { // 系主任
      type: DataTypes.STRING(50),
    },
  }, {
    freezeTableName: true,
    timestamps: true
  })
}