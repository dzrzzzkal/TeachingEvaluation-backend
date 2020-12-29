var mysql = require('mysql')
var config = require('../config/default')


// 建立数据库连接池
var pool = mysql.createPool({
  database: config.database.DATABASE,
  user: config.database.USERNAME,
  password: config.database.PASSWORD,
  host: config.database.HOST
})

/**
 * 参考网址：（目前按第一个）
 * https://blog.csdn.net/wclimb/article/details/77890793?utm_medium=distribute.pc_relevant.none-task-blog-BlogCommendFromMachineLearnPai2-1.control&depth_1-utm_source=distribute.pc_relevant.none-task-blog-BlogCommendFromMachineLearnPai2-1.control
 * https://www.jianshu.com/p/b4e36739d85a
 * https://blog.csdn.net/frank_come/article/details/80805032
 * 
 */


let query = (sql, values) => {
  return new Promise((resolve, reject) => {
    // 使用连接
    pool.getConnection((err, connection) => {
      if(err) {
        reject(err)
      } else {
        // 使用连接执行查询
        connection.query(sql, values, (err, rows) => {
          if(err) {
            reject(err)
          } else {
            resolve(rows)
          }
          // 连接不再使用，返回到连接池
          connection.release()
        })
      }
    })
  })
}

let users = 
  `create table if not exists users(
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(16) NOT NULL,
    pass VARCHAR(32) NOT NULL,
    moment VARCHAR(100) NOT NULL,
    PRIMARY KEY(id)
  );`

let posts = 
  `create table if not exists posts(
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    title TEXT(0) NOT NULL,
    content TEXT(0) NOT NULL,
    md TEXT(0) NOT NULL,
    uid VARCHAR(40) NOT NULL,
    moment VARCHAR(100) NOT NULL,
    comments VARCHAR(200) NOT NULL DEFAULT '0',
    pv VARCHAR(40) NOT NULL DEFAULT '0',
    PRIMARY KEY(id)
  )`

let comment = 
  `create table if not exists comment(
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    content TEXT(0) NOT NULL,
    moment VARCHAR(40) NOT NULL,
    postid VARCHAR(40) NOT NULL,
    PRIMARY KEY ( id )
  )`

let createTable = (sql) => {
  return query(sql, [])
}

// 建表
createTable(users)
createTable(posts)
createTable(comment)

// 注册用户
let insertData = (value) => {
  let _sql = 'insert into users set name=?,pass=?,moment=?;'
  return query(_sql, value)
}

// 删除用户
let deleteUserData = (name) => {
  let _sql = `delete from users where name='${name}';`
  return query(_sql)
}

// 查找用户
let findUserData = (name) => {
  let _sql = `select * from users where name='${name}';`
  return query(_sql)
}

// 通过名字查找用户
let findDataByName =  ( name ) => {
  let _sql = `select * from users where name="${name}";`
  return query( _sql)
}

module.exports = {
  query,
  createTable,
  insertData,
  deleteUserData,
  findUserData,
  findDataByName,
}



// let allServices = {
//   query: (sql, values) => {
//     return new Promise((resolve, reject) => {
//       pool.getConnection((err, connection) => {
//         if(err) {
//           reject(err)
//         } else {
//           connection.query(sql, values, (err, rows) => {
//             if(err) {
//               reject(err)
//             } else {
//               resolve(rows)
//             }
//             connection.release()
//           })
//         }
//       })
//     })
//   },
//   findUserData: (name) => {
//     let _sql = `select * from users where username="${name}";`
//     return allServices.query(_sql)
//   },
//   addUserData: (obj) => {
//     let _sql = 'insert into users set iduser=?,username=?,password=?;'
//     return allServices.query(_sql, obj)
//   }
// }

// module.exports = allServices