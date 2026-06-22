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
let currentUserRequest = null

const pickToken = (data) => {
  if (!data) return ''
  if (typeof data === 'string') return data
  return data.token || data.tokenValue || data.accessToken || ''
}

const pickUser = (data) => {
  if (!data || typeof data !== 'object') return null
  return data.user || data.userInfo || data.currentUser || (data.id ? data : null)
}

const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') return null

  const account = user.account ?? user.userId ?? user.username ?? user.user ?? user.id ?? ''

  return {
    ...user,
    id: user.id ?? user.userId ?? user.uid ?? '',
    account,
    userId: account,
    name: user.name ?? user.nickname ?? user.nickName ?? '',
    avatar: user.avatar ?? user.avatarUrl ?? user.headImg ?? user.headImage ?? '',
    emailVerified: user.emailVerified ?? user.isActiveEmail ?? false,
    enabled: user.enabled ?? user.isUse ?? true
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userInfo: normalizeUser(getStorage(AUTH_USER_KEY)),
    token: getStorage(AUTH_TOKEN_KEY, ''),
    initialized: false,
    loading: false
  }),

  getters: {
    isLoggedIn: (state) => Boolean(state.userInfo?.id && state.token),
    userRole: (state) => state.userInfo?.roleName || '',
    isEmailVerified: (state) => Boolean(state.userInfo?.emailVerified),
    isAdmin: (state) => {
      const roleName = state.userInfo?.roleName || ''
      return /admin|管理员|教师|teacher/i.test(roleName) || Number(state.userInfo?.roleId) === 1
    }
  },

  actions: {
    setAuth(user, token = this.token) {
      const normalizedUser = normalizeUser(user)
      this.userInfo = normalizedUser
      this.token = token
      setStorage(AUTH_USER_KEY, normalizedUser)
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

    async fetchCurrentUser(options = {}) {
      const { clearOnError = false } = options

      if (!currentUserRequest) {
        currentUserRequest = getCurrentUser()
          .then((user) => {
            this.setAuth(user)
            return this.userInfo
          })
          .finally(() => {
            currentUserRequest = null
          })
      }

      try {
        return await currentUserRequest
      } catch (error) {
        if (clearOnError) {
          this.clearAuth()
        }
        throw error
      }
    },

    async hydrate(force = false) {
      if (this.initialized && !force && this.userInfo) return this.userInfo
      if (!this.token) {
        this.clearAuth()
        this.initialized = true
        return null
      }
      try {
        return await this.fetchCurrentUser({ clearOnError: true })
      } catch {
        return null
      } finally {
        this.initialized = true
      }
    },

    async login(form) {
      this.loading = true
      try {
        const data = await loginApi({
          account: form.account || form.user || form.userId || form.username,
          user: form.account || form.user || form.userId || form.username,
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
      const user = await this.fetchCurrentUser()
      this.initialized = true
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
