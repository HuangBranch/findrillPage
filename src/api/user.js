import request from '@/utils/request'

/**
 * 获取个人信息
 */
export const getUserInfo = () => {
  return request({
    url: '/me',
    method: 'GET'
  })
}

/**
 * 更新个人信息
 * @param {Object} data - 个人信息
 * @param {Number} id
 */

export const updateUserInfo = (id,data) => {
  return request({
    url: `/profile/${id}`,
    method: 'PUT',
    data
  })
}
/**
 * 更新头像
 * @param {formdata} data - 头像
 */

export const upavatar = (data) => {
  return request({
    url: "/avatar",
    method: 'POST',
    data
  })
}
/**
 * 个人页面统计数据
 *  - 头像
 */

export const count = () => {
  return request({
    url: "/count",
    method: 'GET',
  })
}
/**
 * 修改密码
 * @param {Object} data - { id, oldPassword, newPassword, user }
 * @returns {Promise} 返回 { code: 0, data: true, msg: "" }
 */
export const changePassword = (data) => {
  return request({
    url: '/update/password',
    method: 'POST',
    data
  }).then(response => {
    // 如果code是0且data是true，表示成功
    if (response === true) {
      return true
    }
    return false
  }).catch(err => {
    console.error('修改密码失败：', err)
    throw err
  })
}

/**
 * 发送邮箱验证邮件
 * @param {Object} data - { email } - 新邮箱验证时需要传邮箱，旧邮箱验证时不需要
 * @returns {Promise} - 返回 { code, msg, data: { uuid, email } }
 */
export const sendEmailVerification = (data) => {
  return request({
    url: '/update/email',
    method: 'POST',
    data
  })
}

/**
 * 检查邮箱验证状态
 * @param {Object} params - { uuid } - 发送验证邮件后返回的uuid
 * @returns {Promise} - 返回验证状态，验证成功返回 true
 */
export const checkEmailVerification = (params) => {
  return request({
    url: '/update/email/isverifi',
    method: 'GET',
    params
  }).catch(err => {
    // 捕获错误，返回未验证状态
    return false
  })
}

/**
 * 获取考试记录
 * @param {Object} params - { page, size }
 */
export const getExamRecords = (params) => {
  return request({
    url: '/me/exam-records',
    method: 'GET',
    params
  })
}

/**
 * 获取练习记录
 * @param {Object} params - { page, size }
 */
export const getPracticeRecords = (params) => {
  return request({
    url: '/me/practice-records',
    method: 'GET',
    params
  })
}

/**
 * 获取个人统计
 */
export const getUserStats = () => {
  return request({
    url: '/me/stats',
    method: 'GET'
  })
}

export default {
  getUserInfo,
  updateUserInfo,
  changePassword,
  sendEmailVerification,
  checkEmailVerification,
  getExamRecords,
  getPracticeRecords,
  getUserStats,
  count,
  upavatar,
}
