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
 * @param {Object} data - { oldPassword, newPassword }
 */
export const changePassword = (data) => {
  return request({
    url: '/me/password',
    method: 'PUT',
    data
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
  getExamRecords,
  getPracticeRecords,
  getUserStats,
  count,
  upavatar,
}
