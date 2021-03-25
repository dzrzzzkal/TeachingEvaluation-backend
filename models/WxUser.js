module.exports = (sequelize, DataTypes) => {
  return sequelize.define('wxUser', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
      autoIncrementIdentity: true,
      allowNull: false,
    },
    // uid: {
    //   type: DataTypes.INTEGER,
    //   unique: true,
    //   // allowNull: false,
    //   // reference: "uid is table user 's primarykey, id",
    // },
    username: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
    },
    session_key: {  // 微信的会话密钥 session_key
      type: DataTypes.STRING,
    },
    openid: { // 微信的用户唯一标识openid
      type: DataTypes.STRING
    },
  }, {
    freezeTableName: true,
    timestamps: true,
  })
}