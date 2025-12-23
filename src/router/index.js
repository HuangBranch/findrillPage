import { createRouter, createWebHistory } from 'vue-router'

// 基础路由（所有用户都可访问）
const baseRoutes = [
  {
    path: '/',
    redirect: '/courses'
  },
  // 登录认证
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/email-verify',
    name: 'EmailVerify',
    component: () => import('@/views/auth/EmailVerify.vue'),
    meta: { title: '邮箱验证'}
  },
  {
    path: '/verify-email-token',
    name: 'VerifyEmailToken',
    component: () => import('@/views/auth/VerifyEmailToken.vue'),
    meta: { title: '验证邮箱', requiresAuth: false }
  },
  // 课程与章节
  {
    path: '/courses',
    name: 'CourseList',
    component: () => import('@/views/course/CourseList.vue'),
    meta: { title: '课程列表', requiresAuth: true, requiresEmailVerified: true }
  },
  {
    path: '/courses/:courseId/chapters',
    name: 'ChapterList',
    component: () => import('@/views/course/ChapterList.vue'),
    meta: { title: '章节列表', requiresAuth: true, requiresEmailVerified: true }
  },
  // 刷题
  {
    path: '/practice',
    name: 'Practice',
    component: () => import('@/views/practice/PracticeMode.vue'),
    meta: { title: '刷题模式', requiresAuth: true, requiresEmailVerified: true }
  },
  // 考试
  {
    path: '/exam',
    name: 'Exam',
    component: () => import('@/views/exam/ExamMode.vue'),
    meta: { title: '考试模式', requiresAuth: true, requiresEmailVerified: true }
  },
  {
    path: '/exam/result/:id',
    name: 'ExamResult',
    component: () => import('@/views/exam/ExamResult.vue'),
    meta: { title: '考试结果', requiresAuth: true, requiresEmailVerified: true }
  },
  // 错题本
  {
    path: '/wrong',
    name: 'WrongList',
    component: () => import('@/views/wrong/WrongList.vue'),
    meta: { title: '错题本', requiresAuth: true, requiresEmailVerified: true }
  },
  {
    path: '/wrong/practice/:curriculumId',
    name: 'WrongPractice',
    component: () => import('@/views/wrong/WrongPractice.vue'),
    meta: { title: '错题练习', requiresAuth: true, requiresEmailVerified: true }
  },
  // 个人中心
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/ProfileView.vue'),
    meta: { title: '个人中心', requiresAuth: true, requiresEmailVerified: true }
  },
  {
    path: '/profile/exam-records',
    name: 'ExamRecords',
    component: () => import('@/views/profile/ExamRecords.vue'),
    meta: { title: '考试记录', requiresAuth: true, requiresEmailVerified: true }
  },
  {
    path: '/profile/practice-records',
    name: 'PracticeRecords',
    component: () => import('@/views/profile/PracticeRecords.vue'),
    meta: { title: '练习记录', requiresAuth: true, requiresEmailVerified: true }
  },
  {
    path: '/profile/edit/:id',
    name: 'EditProfile',
    component: () => import('@/views/profile/EditProfile.vue'),
    meta: { title: '个人信息修改', requiresAuth: true, requiresEmailVerified: true }
  },
  // 后台管理入口
  {
    path: '/admin',
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: baseRoutes
})

/**
 * 动态添加后台管理路由
 * @param {Array} menus - 后端返回的菜单数据
 */
export function addAdminRoutes(menus) {
  if (!menus || !Array.isArray(menus) || menus.length === 0) {
    return
  }

  // 组件路径映射表
  const componentMap = {
    '@/views/admin/Dashboard.vue': () => import('@/views/admin/Dashboard.vue'),
    '@/views/admin/UserManage.vue': () => import('@/views/admin/UserManage.vue'),
    '@/views/admin/RoleManage.vue': () => import('@/views/admin/RoleManage.vue'),
    '@/views/admin/CourseManage.vue': () => import('@/views/admin/CourseManage.vue'),
    '@/views/admin/ChapterManage.vue': () => import('@/views/admin/ChapterManage.vue'),
    '@/views/admin/QuestionManage.vue': () => import('@/views/admin/QuestionManage.vue'),
    '@/views/admin/QuestionUpload.vue': () => import('@/views/admin/QuestionUpload.vue'),
    '@/views/admin/TraceManage.vue': () => import('@/views/admin/TraceManage.vue')
  }

  // 根据菜单数据动态添加路由
  menus.forEach(menu => {
    const componentLoader = componentMap[menu.component]
    
    if (!componentLoader) {
      console.error(`组件路径未找到: ${menu.component}`)
      return
    }

    const route = {
      path: menu.path,
      name: menu.name,
      component: componentLoader,
      meta: {
        ...menu.meta,
        isDynamic: true // 标记为动态路由
      }
    }
    
    try {
      router.addRoute(route)
    } catch (error) {
      console.error(`❌ 添加路由失败: ${menu.path}`, error)
    }
  })
  
  // 最后添加 404 路由（确保在所有路由之后）
  router.addRoute({
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  })
}

/**
 * 清除动态路由（退出登录时调用）
 */
/**
 * 清除动态路由（退出登录时调用）
 */
export function clearAdminRoutes() {
  const routes = router.getRoutes()
  routes.forEach(route => {
    if (route.meta?.isDynamic || route.name === 'NotFound') {
      router.removeRoute(route.name)
    }
  })
  console.log('动态路由已清除')
}

export default router