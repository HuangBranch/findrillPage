import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

/**
 * 设置路由守卫
 * @param {Router} router - Vue Router 实例
 */
export const setupRouterGuards = (router) => {
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    // 设置页面标题
    document.title = to.meta.title ? `${to.meta.title} - 刷题系统` : '刷题系统'

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

      // // 管理员权限检查
      // if (to.meta.requiresAdmin && !authStore.isAdmin) {
      //   ElMessage.error('无权访问')
      //   next('/courses')
      //   return
      // }
    }

    next()
  })

  // 全局后置守卫
  router.afterEach(() => {
    // 滚动到顶部
    window.scrollTo(0, 0)
  })
}

export default setupRouterGuards
