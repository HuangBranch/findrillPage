import { useAuthStore } from '@/stores/auth'

/**
 * 根据用户权限过滤路由
 * @param {Array} routes - 原始路由列表
 * @returns {Array} 过滤后的路由列表
 */
export const filterRoutesByPermission = (routes) => {
    const authStore = useAuthStore()
    const { isLoggedIn, isEmailVerified, isAdmin } = authStore

    return routes.filter(route => {
        // 1. 不需要登录的路由直接显示
        if (!route.meta?.requiresAuth) {
            return true
        }

        // 2. 需要登录但未登录的用户不显示
        if (!isLoggedIn) {
            return false
        }

        // 3. 需要邮箱验证但未验证的用户不显示（排除邮箱验证页本身）
        if (route.meta.requiresEmailVerified && !isEmailVerified && route.path !== '/email-verify') {
            return false
        }

        // 4. 需要管理员权限但不是管理员的用户不显示
        if (route.meta.requiresAdmin && !isAdmin) {
            return false
        }

        // 递归处理子路由（如果有嵌套路由）
        if (route.children && route.children.length) {
            route.children = filterRoutesByPermission(route.children)
        }

        return true
    })
}