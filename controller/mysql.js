const Sequelize = require('sequelize')
const config = require('../config/config').database

// console.log('init sequelize...')

const sequelize = new Sequelize(config.DATABASE, config.USERNAME, config.PASSWORD, {
  host: config.HOST,  // 数据库地址
  dialect: 'mysql', /* 指定连接的数据库类型 选择 'mysql' | 'mariadb' | 'postgres' | 'mssql' 其一 */
  // 连接池
  pool: {
    max: 5, // 连接池最大连接数量
    min: 0, // 最小连接数量
    idle: 10000,  // 如果一个线程10秒内没有被使用的话，就释放
  },
  // 数据表全局配置
  // define: {
  //   // freezeTableName, default true, 会自动给表名表示为复数：user => users，为false则表示，使用我设置的表名
  //   freezeTableName: true,
  //   // timestamp字段，default true，表示数据库中是否会自动更新creatAt和updatedAt字段，false表示不会增加这个字段
  //   timestamps: true,
  //   // paranoid，是否为表添加deletedAt字段
  //   paranoid: false,
  //   // 是否开启op
  //   operatorsAliases: false
  // },
  // // 时区
  // timezone: '+08:00',
  logging: console.log,  // 执行过程会log一些SQL的logging，设为false不显示
})

module.exports = sequelize