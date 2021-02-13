const {Role_TaskCount} = require('@/models/index')
exports.role_taskCountCreate = async (data) => {
  let {role, count} = data
  return await Role_TaskCount.create({
    role,
    count
  })
}

exports.role_taskCountQuery = async (role) => {
  return await Role_TaskCount.findOne({
    attributes: ['count'],
    where: {
      role
    },
    raw: true,
  })
}