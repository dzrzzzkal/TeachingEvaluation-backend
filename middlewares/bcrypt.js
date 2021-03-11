const bcrypt = require('bcryptjs')

// 加密
const encrypt = password => {
  // 随机字符串
  let salt = bcrypt.genSaltSync(10)
  // 对密码加密
  let hash = bcrypt.hashSync(password, salt)
  return hash
}

/**
 * 
 * @param {String} password 客户端传来待验证的明文密码password 
 * @param {String} hash 数据库中存储的原密码加密后的hash
 */
const decrypt = (password, hash) => {
  // 验证比对,返回布尔值表示验证结果 true表示一致，false表示不一致
  return bcrypt.compareSync(password, hash)
}

module.exports = {
  encrypt,
  decrypt
}