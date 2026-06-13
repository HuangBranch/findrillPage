import { defineStore } from 'pinia'
import {
  login as loginApi,
  logout as logoutApi,
  getCurrentUser,
  updateCurrentUser,
  updatePassword as updatePasswordApi,
  register as registerApi
} from '@/api/auth'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'

const AUTH_USER_KEY = 'auth:user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userInfo: getStorage(AUTH_USER_KEY),
    initialized: false,
    loading: false
  }),

  getters: {
    isLoggedIn: (state) => Boolean(state.userInfo?.id),
    userRole: (state) => state.userInfo?.roleName || '',
    isAdmin: (state) => {
      const roleName = state.userInfo?.roleName || ''
      return /admin|管理员|教师|teacher/i.test(roleName) || Number(state.userInfo?.roleId) === 1
    }
  },

  actions: {
    setAuth(user) {
      this.userInfo = user
      setStorage(AUTH_USER_KEY, user)
    },

    clearAuth() {
      this.userInfo = null
      removeStorage(AUTH_USER_KEY)
    },

    async hydrate(force = false) {
      if (this.initialized && !force) return this.userInfo
      if (!this.userInfo && !force) {
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
        if (!data?.user) {
          throw new Error('登录响应缺少用户信息')
        }
        this.setAuth(data.user)
        this.initialized = true
        return data
      } finally {
        this.loading = false
      }
    },

    async register(form) {
      return registerApi(form)
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
