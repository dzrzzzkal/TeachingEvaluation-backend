module.exports = (sequelize, DataTypes) => {
  return sequelize.define('evaluation-progress', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true, //PK
      allowNull: false,
      autoIncrement: true,
      autoIncrementIdentity: true,
    },
    jobid: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
    },
    year: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // role: {
    //   type: DataTypes.STRING(20),
    // },
    // dean: { // 系主任
    //   type: DataTypes.STRING(50),
    // },
    submittedNum: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    taskCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    beEvaluatedNum: {
      type: DataTypes.INTEGER,
    },
    annualReport: {
      type: DataTypes.INTEGER,
    }
  },
  {
    freezeTableName: true,
    timestamps: true,
  })
}