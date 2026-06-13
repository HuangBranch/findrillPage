import { defineStore } from 'pinia'
import { getCurrentMenu } from '@/api/auth'
import { listAdminMenu } from '@/api/admin'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'

const MENU_KEY = 'admin:menus'

export const fallbackAdminMenus = [
  { id: 1, path: '/admin/dashboard', name: 'Dashboard', component: '@/views/admin/Dashboard.vue', meta: { title: '数据看板', icon: 'DataAnalysis', requiresAuth: true, requiresAdmin: true } },
  { id: 2, path: '/admin/users', name: 'UserManage', component: '@/views/admin/UserManage.vue', meta: { title: '用户管理', icon: 'User', requiresAuth: true, requiresAdmin: true } },
  { id: 3, path: '/admin/roles', name: 'RoleManage', component: '@/views/admin/RoleManage.vue', meta: { title: '角色权限', icon: 'Avatar', requiresAuth: true, requiresAdmin: true } },
  { id: 4, path: '/admin/courses', name: 'CourseManage', component: '@/views/admin/CourseManage.vue', meta: { title: '课程管理', icon: 'Reading', requiresAuth: true, requiresAdmin: true } },
  { id: 5, path: '/admin/chapters', name: 'ChapterManage', component: '@/views/admin/ChapterManage.vue', meta: { title: '章节管理', icon: 'Notebook', requiresAuth: true, requiresAdmin: true } },
  { id: 6, path: '/admin/questions', name: 'QuestionManage', component: '@/views/admin/QuestionManage.vue', meta: { title: '题库管理', icon: 'Document', requiresAuth: true, requiresAdmin: true } },
  { id: 7, path: '/admin/imports', name: 'QuestionUpload', component: '@/views/admin/QuestionUpload.vue', meta: { title: '题目导入', icon: 'Upload', requiresAuth: true, requiresAdmin: true } },
  { id: 9, path: '/admin/traces', name: 'TraceManage', component: '@/views/admin/TraceManage.vue', meta: { title: '审核反馈', icon: 'Flag', requiresAuth: true, requiresAdmin: true } }
]

const menuPathAliases = {
  '/admin/question-imports': '/admin/imports',
  '/admin/question-audits': '/admin/traces',
  '/admin/question-reports': '/admin/traces'
}

const canonicalMenus = new Map(fallbackAdminMenus.map((menu) => [menu.path, menu]))

const normalizeAdminMenus = (menus = []) => {
  const result = []
  const seen = new Set()

  menus.forEach((menu) => {
    const path = menuPathAliases[menu.path] || menu.path
    const canonical = canonicalMenus.get(path)
    if (!canonical || seen.has(path)) return

    result.push({
      ...canonical,
      id: menu.id || canonical.id,
      path,
      meta: {
        ...canonical.meta,
        requiresAuth: true,
        requiresAdmin: true
      }
    })
    seen.add(path)
  })

  return result
}

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menuList: normalizeAdminMenus(getStorage(MENU_KEY, [])),
    loading: false,
    loaded: false,
    usingFallback: false
  }),

  getters: {
    menus: (state) => (state.menuList?.length ? state.menuList : fallbackAdminMenus),
    hasMenus: (state) => (state.menuList?.length ? state.menuList : fallbackAdminMenus).length > 0
  },

  actions: {
    async loadMenus(force = false) {
      if (this.loaded && !force) return this.menus
      this.loading = true
      try {
        let menus = []
        try {
          menus = await getCurrentMenu()
        } catch {
          menus = await listAdminMenu({ silent: true })
        }
        const normalizedMenus = normalizeAdminMenus(Array.isArray(menus) ? menus : [])
        this.usingFallback = !normalizedMenus.length
        this.menuList = this.usingFallback ? fallbackAdminMenus : normalizedMenus
        setStorage(MENU_KEY, this.menuList)
        this.loaded = true
        return this.menuList
      } catch {
        const cachedMenus = normalizeAdminMenus(getStorage(MENU_KEY, fallbackAdminMenus))
        this.menuList = cachedMenus.length ? cachedMenus : fallbackAdminMenus
        this.usingFallback = true
        this.loaded = true
        return this.menuList
      } finally {
        this.loading = false
      }
    },

    canAccessPath(path) {
      return this.menus.some((menu) => path === menu.path || path.startsWith(`${menu.path}/`))
    },

    clearMenus() {
      this.menuList = []
      this.loaded = false
      this.usingFallback = false
      removeStorage(MENU_KEY)
    }
  }
})
