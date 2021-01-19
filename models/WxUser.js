// const Sequelize = require('sequelize')
// const sequelize = require('@/controller/mysql')

/**
 * 建立表之间的关系——现在还没做，因为完整的数据库没设计好
 * 参考：https://segmentfault.com/a/1190000017430752
 */

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
    uid: {
      type: DataTypes.INTEGER,
      unique: true,
      // allowNull: false,
      // reference: "uid is table user 's primarykey, id",
      // 暂定为模型User的外键
    },
    username: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
      // 暂定为模型Userinfo的外键。目前也想改成模型User的外键，待改
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