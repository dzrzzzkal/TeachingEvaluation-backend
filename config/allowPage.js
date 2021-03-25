// 定义允许直接访问的url
const allowPage = [
  '/', 
  '/doregister',
  '/doLogin',
  '/api/doLogin',
  '/api/doLogout',
  '/api/checkToken',
  '/json',
  '/file/annualReportTemplate.docx',
  '/public/file/annualReportTemplate.docx'
]

module.exports = allowPage 