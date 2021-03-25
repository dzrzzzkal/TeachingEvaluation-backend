module.exports = (sequelize, DataTypes) => {
  return sequelize.define('annual-report', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true, //PK
      allowNull: false,
      autoIncrement: true,
      autoIncrementIdentity: true,
    },
    submitter_id: { // FK
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    submitter: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    college: {
      type: DataTypes.STRING(80),
    },
    dept: {
      type: DataTypes.STRING(80),
    },
    report_name: {
      type: DataTypes.STRING,
    },
    submit_time: {
      type: DataTypes.STRING(45),
    }
  },
  {
    freezeTableName: true,
    timestamps: true,
  })
}