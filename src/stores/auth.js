import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi } from '@/api/auth'
import { setStorage, getStorage, removeStorage } from '@/utils/storage'
import CryptoJS from 'crypto-js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    loginFlag: !!getStorage('isLoggedIn'), // 登录时的闪烁效果
    userInfo: getStorage('userInfo') || null
  }),

  getters: {
    // 是否已登录
    isLoggedIn: (state) => state.loginFlag,
    
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
        this.userInfo = data
        this.loginFlag = true
        setStorage('isLoggedIn', true)
        setStorage('userInfo', data)
        return { success: true, data }
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
      // 清除邮箱验证的临时凭证
      sessionStorage.removeItem('pendingAuth')
    },

    // 更新用户信息
    updateUserInfo(userInfo) {
      this.userInfo = { ...this.userInfo, ...userInfo }
      setStorage('userInfo', this.userInfo)
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
        // TODO: 调用检查邮箱状态的接口
        // const result = await checkEmailStatus()
        // if (result && result.data) {
        //   this.setEmailVerified(result.data.isActiveEmail)
        //   return result.data.isActiveEmail
        // }
        return this.isEmailVerified
      } catch (error) {
        console.error('刷新邮箱验证状态失败：', error)
        return false
      }
    }
  }
})
