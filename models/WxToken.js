/**
 * 本模型是设计存储微信的access_token, jsapi_ticket等值，数据量会很小，
 * （本来想用create,destory来处理数据，但是怕此表的id溢出，因此改用update）
 * 本表中的每个属性，access_token, jsapi_ticket等，只会存在一条数据，但是会被不断更新
 */

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('wxToken', {
    access_token: {
      type: DataTypes.STRING,
    },
    jsapi_ticket: {
      type: DataTypes.STRING,
    },
  }, 
  {
    freezeTableName: true,
    timestamps: true,
  })
}