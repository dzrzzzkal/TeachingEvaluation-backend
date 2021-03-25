const addToken = require('@/token/addToken')

const refreshToken = async (result) => { // res：checkToken()的返回值
  let { tokenCode, jobid, user } = result
  if(tokenCode == 20001) {
    let token = await addToken({user, jobid})
    
    result.tokenCode = 200
    result.message = 'token 解析成功'
    result.status = true
    result.token = token  // 把token加入result中
  }
  return result
}

module.exports = refreshToken