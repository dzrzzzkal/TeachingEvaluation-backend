const {WxToken} = require('@/models/index')
const {Op} = require('sequelize')

// (PS：此表中只会存在一条access_token数据)

// 查询数据库中是否存在access_token
exports.accessTokenQuery = async () => {
  return await WxToken.findOne({
    where: {
      access_token: {
        [Op.ne]: null   // != null
      }
    }
  })
}

exports.accessTokenCreate = async (accessToken) => {
  return await WxToken.create({
    access_token: accessToken
  })
}

// 为 值不为null的access_token 更新值
exports.accessTokenUpdate = async (accessToken) => {
  return await WxToken.update({
    access_token: accessToken
  },
  {
    // truncate: true
    where: {
      access_token: { // 不为null的access_token
        [Op.ne]: null
      }
    }
  })
}