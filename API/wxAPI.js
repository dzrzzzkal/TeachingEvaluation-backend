/**
 * 微信相关操作API
 */

const {request} = require('@/network/request')
const { appid, secret } = require('@/config/wx')  // 导入小程序的appid和secret

var wxAPI = {}
// const api = {
//   code2Session: `/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${js_code}&grant_type=authorization_code`,
//   access_token: `/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`
// }


// 获取code2Session
wxAPI.getCode2Session = async (js_code) => {
  return await request({
    url: `/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${js_code}&grant_type=authorization_code`,
  })
}


// 获取access_token
wxAPI.getAccessToken = async () => {
  return await request({
    url: `/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`,
    header: {
      'content-type': 'application/json' // 默认值
    },
  })
}



module.exports = wxAPI