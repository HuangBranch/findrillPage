import { defineStore } from 'pinia'
import {
  login as loginApi,
  logout as logoutApi,
  getCurrentUser,
  updateCurrentUser,
  updatePassword as updatePasswordApi
} from '@/api/auth'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'

const AUTH_USER_KEY = 'auth:user'
const AUTH_TOKEN_KEY = 'auth:token'

const pickToken = (data) => {
  if (!data) return ''
  if (typeof data === 'string') return data
  return data.token || data.tokenValue || data.accessToken || ''
}

const pickUser = (data) => {
  if (!data || typeof data !== 'object') return null
  return data.user || data.userInfo || data.currentUser || (data.id ? data : null)
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userInfo: getStorage(AUTH_USER_KEY),
    token: getStorage(AUTH_TOKEN_KEY, ''),
    initialized: false,
    loading: false
  }),

  getters: {
    isLoggedIn: (state) => Boolean(state.userInfo?.id && state.token),
    userRole: (state) => state.userInfo?.roleName || '',
    isAdmin: (state) => {
      const roleName = state.userInfo?.roleName || ''
      return /admin|管理员|教师|teacher/i.test(roleName) || Number(state.userInfo?.roleId) === 1
    }
  },

  actions: {
    setAuth(user, token = this.token) {
      this.userInfo = user
      this.token = token
      setStorage(AUTH_USER_KEY, user)
      if (token) {
        setStorage(AUTH_TOKEN_KEY, token)
      }
    },

    clearAuth() {
      this.userInfo = null
      this.token = ''
      removeStorage(AUTH_USER_KEY)
      removeStorage(AUTH_TOKEN_KEY)
    },

    async hydrate(force = false) {
      if (this.initialized && !force) return this.userInfo
      if ((!this.userInfo || !this.token) && !force) {
        this.clearAuth()
        this.initialized = true
        return null
      }
      try {
        const user = await getCurrentUser()
        this.setAuth(user)
        return user
      } catch {
        this.clearAuth()
        return null
      } finally {
        this.initialized = true
      }
    },

    async login(form) {
      this.loading = true
      try {
        const data = await loginApi({
          user: form.user || form.userId || form.username,
          password: form.password
        })
        const user = pickUser(data)
        const token = pickToken(data)
        if (!user) {
          throw new Error('登录响应缺少用户信息')
        }
        if (!token) {
          throw new Error('登录响应缺少 token')
        }
        this.setAuth(user, token)
        this.initialized = true
        return data
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await logoutApi()
      } finally {
        this.clearAuth()
        this.initialized = true
      }
    },

    async refreshUser() {
      const user = await getCurrentUser()
      this.setAuth(user)
      return user
    },

    async updateProfile(form) {
      const user = await updateCurrentUser(form)
      this.setAuth({ ...this.userInfo, ...user })
      return user
    },

    async updatePassword(form) {
      return updatePasswordApi(form)
    }
  }
})
