// 定义允许直接访问的url
const allowPage = [
  '/', 
  '/doregister',
  '/doLogin',
  '/api/doLogin',
  '/api/doLogout',
  '/api/checkToken',
  '/json',
  '/test',
  
]


// 我记得之前学的时候好像说不能导出具体数字等的，说那不是模块化，要导出对象、函数，
// 但是经过测试，可以获取数字，还有数组，不知道为什么，先用着吧
module.exports = allowPage 

// module.exports = () => {
//   return allowPage
// }
