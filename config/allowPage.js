// 定义允许直接访问的url
// const allowPage = ['/login', '/api/login'] // 考虑要不要设置api，以后再说吧
const allowPage = [
  '/', 
  '/dologin',
  '/wxdoLogin',
  'wxdoLogout',
  '/json',
  '/test',
]  // 待定，因为目前后端的/login都是POST


// 我记得之前学的时候好像说不能导出具体数字等的，说那不是模块化，要导出对象、函数，
// 但是经过测试，可以获取数字，还有数组，不知道为什么，先用着吧
module.exports = allowPage 

// module.exports = () => {
//   return allowPage
// }
