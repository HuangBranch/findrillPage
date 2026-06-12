import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data - { user, password }
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
 * @param {string} bindTicket - 登录接口返回的绑定邮箱票据
 * @param {string} email - 邮箱地址
 */
export const sendEmailVerificationLink = (bindTicket, email) => {
  return request({
    url: '/email/send',
    method: 'POST',
    data: { bindTicket, email }
  })
}

/**
 * 通过 token 验证邮箱（首次注册验证）
 * @param {string} token - 从邮件链接中获取的 token
 * @returns {Promise<boolean>} 返回 true 表示验证成功，false 表示验证失败
 */
export const verifyEmailByToken = (token) => {
  return request({
    url: '/email/verify',
    method: 'GET',
    params: { token }
  }).then(result => {
    return result === true
  }).catch(err => {
    console.error('首次邮箱验证失败：', err)
    return false
  })
}

/**
 * 通过 token 验证邮箱（修改邮箱验证）
 * @param {string} token - 从邮件链接中获取的 token
 * @returns {Promise<boolean>} 返回 true 表示验证成功，false 表示验证失败
 */
export const verifyUpdateEmailByToken = (token) => {
  return request({
    url: '/update/email/verify',
    method: 'GET',
    params: { token }
  }).then(result => {
    return result !== false
  }).catch(err => {
    console.error('修改邮箱验证失败：', err)
    return false
  })
}

/**
 * 重置密码
 * 系统会将重置后的密码发送到用户邮箱
 * @param {string} email - 邮箱地址
 * @param {string} user - 用户名
 * @returns {Promise} 请求结果
 */
export const resetPassword = (email, user) => {
  return request({
    url: '/reset',
    method: 'POST',
    data: { email, user }
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
  verifyUpdateEmailByToken,
  resetPassword,
  logout
}
