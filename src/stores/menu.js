import { defineStore } from 'pinia'
import { getMenuList } from '@/api/admin'
import { setStorage, getStorage, removeStorage } from '@/utils/storage'
import { addAdminRoutes, clearAdminRoutes } from '@/router'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    // 菜单列表
    menuList: getStorage('menuList') || [],
    // 菜单加载状态
    loading: false,
    // 是否已加载过菜单
    loaded: false
  }),

  getters: {
    // 获取菜单列表
    menus: (state) => state.menuList,
    
    // 检查是否有菜单数据
    hasMenus: (state) => state.menuList && state.menuList.length > 0
  },

  actions: {
    /**
     * 加载菜单列表
     */
    async loadMenus() {
      // 如果已经加载过，直接返回
      if (this.loaded && this.hasMenus) {
        return this.menuList
      }

      this.loading = true
      try {
        const data = await getMenuList()
        
        if (data && Array.isArray(data)) {
          this.menuList = data
          this.loaded = true
          // 缓存到本地存储
          setStorage('menuList', data)
          // 动态添加路由
          addAdminRoutes(data)
          return data
        } else {
          this.menuList = []
          this.loaded = true
          return []
        }
      } catch (error) {
        console.error('加载菜单失败：', error)
        // 尝试从缓存读取
        const cached = getStorage('menuList')
        if (cached) {
          this.menuList = cached
          this.loaded = true
          // 从缓存恢复路由
          addAdminRoutes(cached)
          return cached
        }
        this.menuList = []
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 清空菜单数据（退出登录时调用）
     */
    clearMenus() {
      this.menuList = []
      this.loaded = false
      removeStorage('menuList')
      // 清除动态路由
      clearAdminRoutes()
    },

    /**
     * 强制重新加载菜单
     */
    async reloadMenus() {
      this.loaded = false
      this.menuList = []
      removeStorage('menuList')
      clearAdminRoutes()
      return await this.loadMenus()
    }
  }
})
