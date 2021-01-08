const {WxUser} = require('@/models/index')

exports.wxUserCreate = async (wxUserinfo) => {
  return await WxUser.create({
    uid: wxUserinfo.uid,
    openid: wxUserinfo.openid,
    session_key: wxUserinfo.session_key,
  })
}

// 查询微信的用户唯一标识openid是否存在
exports.openidQuery = async (openid) => {
  return await WxUser.findOne({
    where: {
      openid: openid
    }
  })
}

// 根据openid查询对应的uid
exports.uidQuery = async (uid) => {
  return await WxUser.findOne({
    where: {
      uid: uid
    }
  })
}

// 根据openid删除整列数据，待定！！！
exports.deleteData = async (openid) => {
  return await WxUser.destory({
    where: {
      openid: openid
    }
  })
}

// 更新
// User.update({name:'张三丰'},{
//     where: {
//         id:3
//     }
// }).then(()=>{
//     console.log('Done')