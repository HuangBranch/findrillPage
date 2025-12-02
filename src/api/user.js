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
 */
export const updateUserInfo = (data) => {
  return request({
    url: '/me',
    method: 'PUT',
    data
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
  getUserStats
}
