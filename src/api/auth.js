import request from '@/utils/request'

export const login = (data) => request({ url: '/auth/login', method: 'POST', data })

export const logout = () => request({ url: '/auth/logout', method: 'POST', silent: true })

export const getCurrentUser = () => request({ url: '/users/me', method: 'GET', silent: true })

export const updateCurrentUser = (data) => request({ url: '/users/me', method: 'PUT', data })

export const updatePassword = (data) => request({ url: '/users/me/password', method: 'PUT', data })

export const getCurrentMenu = () => request({ url: '/users/me/menu', method: 'GET', silent: true })

export default {
  login,
  logout,
  getCurrentUser,
  updateCurrentUser,
  updatePassword,
  getCurrentMenu
}
