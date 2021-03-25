module.exports = (sequelize, DataTypes) => {
  return sequelize.define('evaluation-sheet', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true, //PK
      allowNull: false,
      autoIncrement: true,
      autoIncrementIdentity: true,
    },
    classification: { // 评估表类型
      type: DataTypes.STRING,
      allowNull: false,
    },
    submitter_id: { // FK
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    submitter: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    course_setupUnit: {
      type: DataTypes.STRING(50),
    },
    course_name: {
      type: DataTypes.STRING(100),
    },
    class_id: { // FK
      type: DataTypes.STRING(10),
    },
    teacher_id: { // FK
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    teacher_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    class_time: {
      type: DataTypes.STRING(50),
    },
    place: {
      type: DataTypes.STRING(100),
    },
    attend_num: {
      type: DataTypes.INTEGER,
    },
    actual_num: {
      type: DataTypes.INTEGER,
    },
    role: {
      type: DataTypes.STRING(10),
    },
    environment: {
      type: DataTypes.STRING,
    },
    evaluationList: {
      type: DataTypes.STRING,
    },
    appreciateMethod: {
      type: DataTypes.STRING,
    },
    concreteSuggestion: {
      type: DataTypes.STRING,
    },
    familiarity: {
      type: DataTypes.STRING(10),
    },
    extension: {
      type: DataTypes.STRING(10),
    },
    followUp: {
      type: DataTypes.STRING(10),
    },
    otherSuggestion: {
      type: DataTypes.STRING,
    },
    participant: {  // 听课人
      type: DataTypes.STRING(10),
    },
    submit_time: {
      type: DataTypes.STRING(50),
    },
    followUpDegree: {
      type: DataTypes.STRING(50),
    },
    followUpParticipant: {
      type: DataTypes.STRING(20),
    },
    followUpParticipantSuggestion: {
      type: DataTypes.STRING,
    },
    followUpParticipantTime: {
      type: DataTypes.STRING(50),
    },
    followUpCollege: {
      type: DataTypes.STRING(20),
    },
    followUpCollegeSuggestion: {
      type: DataTypes.STRING,
    },
    followUpCollegeTime: {
      type: DataTypes.STRING(50),
    },
    lecturer: {
      type: DataTypes.STRING(20),
    },
    lecturerRectification: {
      type: DataTypes.STRING,
    },
    lecturerTime: {
      type: DataTypes.STRING(50),
    },
    followUpUnit: {
      type: DataTypes.STRING(40),
    },
    followUpUnitSuggestion: {
      type: DataTypes.STRING,
    },
    followUpUnitTime: {
      type: DataTypes.STRING(50),
    }
  },
  {
    freezeTableName: true,
    timestamps: true,
  })
}