import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data - { userName, password }
 */
export const login = (data) => {
  return request({
    url: '/auth/login',
    method: 'POST',
    data
  })
}

/**
 * 发送邮箱验证码
 */
export const sendVerificationCode = () => {
  // 测试模式：模拟发送验证码
  if (import.meta.env.DEV) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📧 模拟验证码：123456')
        resolve({ success: true, message: '验证码已发送（测试码：123456）' })
      }, 500)
    })
  }
  
  return request({
    url: '/auth/send-verification-code',
    method: 'POST'
  })
}

/**
 * 验证邮箱
 * @param {Object} data - { code }
 */
export const verifyEmail = (data) => {
  // 测试模式：模拟验证邮箱（验证码：123456）
  if (import.meta.env.DEV) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (data.code === '123456') {
          resolve({ success: true, message: '邮箱验证成功' })
        } else {
          reject({ message: '验证码错误' })
        }
      }, 500)
    })
  }
  
  return request({
    url: '/auth/verify-email',
    method: 'POST',
    data
  })
}

/**
 * 检查邮箱验证状态
 */
export const checkEmailStatus = () => {
  return request({
    url: '/auth/check-email-status',
    method: 'GET'
  })
}

/**
 * 退出登录
 */
export const logout = () => {
  return request({
    url: '/auth/logout',
    method: 'POST'
  })
}

export default {
  login,
  sendVerificationCode,
  verifyEmail,
  checkEmailStatus,
  logout
}
