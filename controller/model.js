// 扫描所有的model模型
const fs = require('fs')
const path = require('path')

/**
 * 应该后期可以参考这个改：https://segmentfault.com/a/1190000017430752
 */


let modelsPath = path.join(__dirname, '../models')
// 同步遍历目录
let files = fs.readdirSync(modelsPath)

let js_files = files.filter((f) => {
  return f.endsWith('.js')
}, files)

module.exports = {}

for(let f of js_files) {
  console.log(`import model from file ${f}...`)

  let name = f.substring(0, f.length - 3) //User.js ==> name: User
  module.exports[name] = require(modelsPath + '/' + f)
}


// // https://segmentfault.com/a/1190000017430752
// // index.js
// import Sequelize from 'sequelize'
// import config from '@/config/config'

// // 实例化sequelize
// export const sequelize = new Sequelize(config)

// // 导入模型同一管理（推荐使用官方方法）
// export const Xxx = sequelize.import(modelsPath + '/Users.js')