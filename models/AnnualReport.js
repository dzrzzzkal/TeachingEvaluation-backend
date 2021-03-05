module.exports = (sequelize, DataTypes) => {
  return sequelize.define('annual-report', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true, //PK
      allowNull: false,
      autoIncrement: true,
      autoIncrementIdentity: true,
    },
    // sheet_id: {
    //   type: DataTypes.STRING,
    //   primaryKey: true, //PK
    //   allowNull: false,
    // },
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
    }
  },
  {
    freezeTableName: true,
    timestamps: true,
  })
}