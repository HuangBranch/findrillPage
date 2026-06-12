import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi } from '@/api/auth'
import { setStorage, getStorage, removeStorage } from '@/utils/storage'
import CryptoJS from 'crypto-js'

const PENDING_EMAIL_BIND_KEY = 'pendingEmailBind'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    loginFlag: !!getStorage('isLoggedIn') && !!getStorage('userInfo'), // 登录时的闪烁效果
    userInfo: getStorage('userInfo') || null
  }),

  getters: {
    // 是否已登录
    isLoggedIn: (state) => state.loginFlag && !!state.userInfo,
    
    // 邮箱是否已验证
    isEmailVerified: (state) => state.userInfo?.isActiveEmail || false,
    
    // 用户角色
    userRole: (state) => state.userInfo?.roleName || ''
  },

  actions: {
    // 加密
    digestMessage(message) {
      return CryptoJS.SHA256(message).toString()
    },
    // 登录
    async login(loginForm) {
      try {
        // 密码加密
        const encryptedForm = {
          ...loginForm,
          password: await this.digestMessage(loginForm.password)
        }
        const data = await loginApi(encryptedForm)

        if (data?.status === 'SUCCESS') {
          if (!data.user) {
            this.clearAuth()
            throw new Error('登录响应缺少用户信息')
          }

          this.setAuth(data.user)
          this.clearPendingEmailBind()
          return { success: true, status: data.status, data, user: data.user }
        }

        if (data?.status === 'NEED_BIND_EMAIL') {
          this.clearAuth()
          if (!data.bindTicket) {
            throw new Error('登录响应缺少邮箱绑定凭证')
          }

          this.setPendingEmailBind({
            bindTicket: data.bindTicket,
            user: data.user,
            createdAt: Date.now()
          })
          return {
            success: false,
            needBindEmail: true,
            status: data.status,
            data
          }
        }

        throw new Error('登录状态异常')
      } catch (error) {
        console.error('登录失败：', error)
        return { success: false, error: error.message || '登录失败' }
      }
    },

    // 退出登录
    async logout() {
      try {
        await logoutApi()
      } catch (error) {
        console.error('退出登录失败：', error)
      } finally {
        this.clearAuth()
      }
    },

    // 清除认证信息
    clearAuth() {
      this.userInfo = null
      this.loginFlag = false
      removeStorage('isLoggedIn')
      removeStorage('userInfo')
      this.clearPendingEmailBind()
    },

    ensureAuthState() {
      if (this.loginFlag && this.userInfo) {
        return true
      }

      if (this.loginFlag || this.userInfo) {
        this.clearAuth()
      }

      return false
    },

    // 更新用户信息
    updateUserInfo(userInfo) {
      this.userInfo = { ...this.userInfo, ...userInfo }
      setStorage('userInfo', this.userInfo)
    },

    setAuth(userInfo) {
      this.userInfo = userInfo
      this.loginFlag = true
      setStorage('isLoggedIn', true)
      setStorage('userInfo', userInfo)
    },

    setPendingEmailBind(data) {
      sessionStorage.setItem(PENDING_EMAIL_BIND_KEY, JSON.stringify(data))
    },

    getPendingEmailBind() {
      try {
        return JSON.parse(sessionStorage.getItem(PENDING_EMAIL_BIND_KEY) || '{}')
      } catch (error) {
        console.error('读取邮箱绑定凭证失败：', error)
        return {}
      }
    },

    clearPendingEmailBind() {
      sessionStorage.removeItem(PENDING_EMAIL_BIND_KEY)
    },

    // 设置邮箱验证状态
    setEmailVerified(verified) {
      if (this.userInfo) {
        this.userInfo.isActiveEmail = verified
        setStorage('userInfo', this.userInfo)
      }
    },

    // 刷新用户邮箱验证状态（从服务器获取最新状态）
    async refreshEmailStatus() {
      try {
        return this.isEmailVerified
      } catch (error) {
        console.error('刷新邮箱验证状态失败：', error)
        return false
      }
    }
  }
})
