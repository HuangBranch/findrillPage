import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'

const needs = (to, key) => to.matched.some((record) => record.meta?.[key])

export const setupRouterGuards = (router) => {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore()
    const menuStore = useMenuStore()

    document.title = to.meta.title ? `${to.meta.title} - Findrill` : 'Findrill'

    if (to.path === '/login') {
      if (authStore.isLoggedIn) return to.query.redirect || '/courses'
      return true
    }

    if (needs(to, 'requiresAuth')) {
      if (!authStore.isLoggedIn) {
        const user = await authStore.hydrate()
        if (!user) {
          return { path: '/login', query: { redirect: to.fullPath } }
        }
      } else {
        authStore.hydrate().catch(() => {})
      }
    }

    if (needs(to, 'requiresAdmin')) {
      await menuStore.loadMenus()
      if (!authStore.isAdmin && (menuStore.usingFallback || !menuStore.canAccessPath(to.path))) {
        ElMessage.warning('当前账号没有后台访问权限')
        return '/courses'
      }
    }

    return true
  })

  router.onError((error) => {
    console.error('Router error:', error)
    ElMessage.error('页面加载失败')
  })
}

export default setupRouterGuards
