const wxAPI = require('@/API/wxAPI')
const {accessTokenQuery, accessTokenCreate, accessTokenUpdate} = require('@/controller/wxToken')

// 服务器向微信方请求h
async function getAT() {
  let res = await wxAPI.getAccessToken()
  let access_token = res.access_token
  if(!access_token) { // 请求没有获取到access_token
    console.log(res)
  } else {
    // 把access_token更新入数据库
    await accessTokenUpdate(access_token)
  }
}

async function storeAccessToken() {
  const period = 7200000

  let query = await accessTokenQuery()  // 查询是否存在access_token
  if(!query) { // query为null，即不存在
    await accessTokenCreate('') // create 值为''的数据，以便后面update，相当于初始化
    await getAT()
  } else {  // query存在的情况下，先判断access_token是否已超过7200000，未超过可以不先getAT()
    let createdAt = query.createdAt
    let createdTime = new Date(createdAt).getTime()
    let time = new Date().getTime()
    let difference = time - createdTime // 现在距离过期时间的差值
    if(difference > period) { // access_token已过期
      await getAT()

      // 定时重新获取access_token
      // (PS: 应该要设置一个特殊情况时关闭定时器)
      setInterval(async () => {
        await getAT()
      }, period)
    } else {  // 未过期，[difference]毫秒后过期，设置[difference]毫秒后再开启setInterval()
      setTimeout(async () => {
        await setInterval(async () => {
          await getAT()
        }, period)
      }, difference);
    }
  }
}

module.exports = storeAccessToken