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
 * @param {string} user - 用户名
 * @param {string} password - 加密后的密码
 * @param {string} email - 邮箱地址
 */
export const sendEmailVerificationLink = (user, password, email) => {
  return request({
    url: '/email',
    method: 'POST',
    data: { user, password, email }
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
 * @param {string} user - 用户名
 * @param {string} password - 加密后的密码
 * @returns {Promise<{code: number, data: boolean}>} data为true表示已认证，后端会设置sa-token cookie
 */
export const checkEmailStatus = (user, password) => {
  return request({
    url: '/email/isverifi',
    method: 'POST',
    data: { user, password }
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
