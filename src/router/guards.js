import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { ElMessage, ElLoading } from 'element-plus'

/**
 * 设置路由守卫
 * @param {Router} router - Vue Router 实例
 */
export const setupRouterGuards = (router) => {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const menuStore = useMenuStore()

    // 设置页面标题
    document.title = to.meta.title ? `${to.meta.title} - 学生在线学习系统` : '学生在线学习系统'

    // 如果是登录页，已登录则跳转到首页
    if (to.path === '/login') {
      if (authStore.isLoggedIn) {
        next('/courses')
      } else {
        next()
      }
      return
    }

    // 需要登录的页面
    if (to.meta.requiresAuth) {
      if (!authStore.isLoggedIn) {
        ElMessage.warning('请先登录')
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }

      // 邮箱验证检查（登录页和邮箱验证页除外）
      if (
        to.meta.requiresEmailVerified && 
        !authStore.isEmailVerified && 
        to.path !== '/email-verify'
      ) {
        ElMessage.warning('请先完成邮箱验证')
        next('/email-verify')
        return
      }
    }

    // 管理员路由访问检查（所有 /admin/ 开头的路径）
    if (to.path.startsWith('/admin/')) {
      // 先检查是否登录
      if (!authStore.isLoggedIn) {
        ElMessage.warning('请先登录')
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }

      // 确保菜单已加载（动态路由已注册）
      if (!menuStore.loaded) {
        // 显示加载动画
        const loading = ElLoading.service({
          lock: true,
          text: '正在加载权限信息...',
          background: 'rgba(255, 255, 255, 0.9)'
        })
        
        try {
          await menuStore.loadMenus()
          loading.close()
          // 重新导航到目标路由，因为动态路由可能刚刚注册
          next({ ...to, replace: true })
          return
        } catch (error) {
          loading.close()
          console.error('加载菜单失败:', error)
          ElMessage.error('加载菜单失败，请重新登录')
          next('/courses')
          return
        }
      }

      // 检查动态路由是否存在（权限验证）
      const routes = router.getRoutes()
      const routeExists = routes.some(route => route.path === to.path)
      
      if (!routeExists) {
        ElMessage.error('您没有访问该页面的权限')
        // 跳转到第一个有权限的菜单页面
        if (menuStore.menus.length > 0) {
          next(menuStore.menus[0].path)
        } else {
          next('/courses')
        }
        return
      }
    }

    next()
  })

  // 全局后置守卫
  router.afterEach(() => {
    // 滚动到顶部
    window.scrollTo(0, 0)
  })

  // 路由错误处理
  router.onError((error) => {
    console.error('路由错误:', error)
    ElMessage.error('页面加载失败')
  })
}

export default setupRouterGuards
