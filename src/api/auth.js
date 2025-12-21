import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data - { userName, password }
 */
export const login = (data) => {
  return request({
    url: '/login',
    method: 'POST',
    data
  })
}

/**
 * 发送邮箱验证链接
 * 后端会发送包含 token 的验证链接到用户邮箱
 * @param {string} email - 可选，如果用户没有邮箱，需要传入要绑定的邮箱地址
 */
export const sendEmailVerificationLink = (email) => {
  const params = {}
  if (email) {
    params.email = email
  }
  
  return request({
    url: '/email',
    method: 'GET',
    params
  })
}

/**
 * 通过 token 验证邮箱
 * @param {string} token - 从邮件链接中获取的 token
 */
export const verifyEmailByToken = (token) => {
  return request({
    url: '/email/verify',
    method: 'GET',
    params: { token }
  })
}

/**
 * 检查邮箱验证状态
 */
export const checkEmailStatus = () => {
  return request({
    url: '/email/isverifi',
    method: 'GET'
  })
}

/**
 * 退出登录
 */
export const logout = () => {
  return request({
    url: '/logout',
    method: 'GET'
  })
}

export default {
  login,
  sendEmailVerificationLink,
  verifyEmailByToken,
  checkEmailStatus,
  logout
}
