import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi } from '@/api/auth'
import { setStorage, getStorage, removeStorage } from '@/utils/storage'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getStorage('token') || '',
    userInfo: getStorage('userInfo') || null
  }),

  getters: {
    // 是否已登录
    isLoggedIn: (state) => !!state.token,
    
    // 邮箱是否已验证
    isEmailVerified: (state) => state.userInfo?.emailVerified || false,
    
    // 用户角色
    userRole: (state) => state.userInfo?.roleName || '',
    
    // 是否是管理员
    isAdmin: (state) => {
      const roleId = state.userInfo?.roleId
      return roleId === 1 || roleId === 2 // 1: 超级管理员, 2: 管理员
    }
  },

  actions: {
    // 登录
    async login(loginForm) {
      try {
        // 测试模式：模拟登录（当后端接口不可用时）
        if (import.meta.env.DEV) {
          // 模拟网络延迟
          await new Promise(resolve => setTimeout(resolve, 800))
          
          // 模拟登录成功
          const mockData = {
            token: 'mock-token-' + Date.now(),
            user: {
              id: 1,
              userName: loginForm.userName,
              email: 'test@example.com',
              emailVerified: false, // 首次登录需要验证邮箱
              roleId: 3, // 3: 普通用户
              roleName: '学生'
            }
          }
          
          this.token = mockData.token
          this.userInfo = mockData.user
          
          // 持久化存储
          setStorage('token', mockData.token)
          setStorage('userInfo', mockData.user)
          
          return { success: true, data: mockData }
        }
        
        // 生产模式：调用真实接口
        const data = await loginApi(loginForm)
        
        this.token = data.token
        this.userInfo = data.user
        
        // 持久化存储
        setStorage('token', data.token)
        setStorage('userInfo', data.user)
        
        return { success: true, data }
      } catch (error) {
        return { success: false, error }
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
      this.token = ''
      this.userInfo = null
      removeStorage('token')
      removeStorage('userInfo')
    },

    // 更新用户信息
    updateUserInfo(userInfo) {
      this.userInfo = { ...this.userInfo, ...userInfo }
      setStorage('userInfo', this.userInfo)
    },

    // 设置邮箱验证状态
    setEmailVerified(verified) {
      if (this.userInfo) {
        this.userInfo.emailVerified = verified
        setStorage('userInfo', this.userInfo)
      }
    }
  }
})
