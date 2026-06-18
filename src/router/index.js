import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import UserLayout from '@/components/layout/UserLayout.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/verify-email-token',
    name: 'VerifyEmailToken',
    component: () => import('@/views/auth/VerifyEmailToken.vue'),
    meta: { title: '邮箱验证' }
  },
  {
    path: '/email-verify',
    name: 'EmailVerify',
    component: () => import('@/views/auth/EmailVerify.vue'),
    meta: { title: '账号状态', requiresAuth: true }
  },
  {
    path: '/',
    component: UserLayout,
    redirect: '/courses',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'courses',
        name: 'CourseList',
        component: () => import('@/views/course/CourseList.vue'),
        meta: { title: '学习中心', requiresAuth: true }
      },
      {
        path: 'courses/:courseId/chapters',
        name: 'ChapterList',
        component: () => import('@/views/course/ChapterList.vue'),
        meta: { title: '章节题库', requiresAuth: true }
      },
      {
        path: 'practice',
        name: 'Practice',
        component: () => import('@/views/practice/PracticeMode.vue'),
        meta: { title: '自主练习', requiresAuth: true, hideBottomNav: true }
      },
      {
        path: 'practice/:attemptId',
        name: 'PracticeAttempt',
        component: () => import('@/views/practice/PracticeMode.vue'),
        meta: { title: '自主练习', requiresAuth: true, hideBottomNav: true }
      },
      {
        path: 'practice/result/:id',
        name: 'PracticeResult',
        component: () => import('@/views/practice/PracticeResult.vue'),
        meta: { title: '练习结果', requiresAuth: true, hideBottomNav: true }
      },
      {
        path: 'wrong',
        name: 'WrongList',
        component: () => import('@/views/wrong/WrongList.vue'),
        meta: { title: '错题复习', requiresAuth: true }
      },
      {
        path: 'wrong/practice',
        name: 'WrongPractice',
        component: () => import('@/views/wrong/WrongPractice.vue'),
        meta: { title: '错题练习', requiresAuth: true, hideBottomNav: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/ProfileView.vue'),
        meta: { title: '我的', requiresAuth: true }
      },
      {
        path: 'profile/edit',
        name: 'EditProfile',
        component: () => import('@/views/profile/EditProfile.vue'),
        meta: { title: '编辑资料', requiresAuth: true }
      },
      {
        path: 'profile/practice-records',
        name: 'PracticeRecords',
        component: () => import('@/views/profile/PracticeRecords.vue'),
        meta: { title: '练习记录', requiresAuth: true }
      }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/admin/Dashboard.vue'), meta: { title: '数据看板', requiresAuth: true, requiresAdmin: true } },
      { path: 'users', name: 'UserManage', component: () => import('@/views/admin/UserManage.vue'), meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true } },
      { path: 'roles', name: 'RoleManage', component: () => import('@/views/admin/RoleManage.vue'), meta: { title: '角色权限', requiresAuth: true, requiresAdmin: true } },
      { path: 'courses', name: 'CourseManage', component: () => import('@/views/admin/CourseManage.vue'), meta: { title: '课程管理', requiresAuth: true, requiresAdmin: true } },
      { path: 'chapters', name: 'ChapterManage', component: () => import('@/views/admin/ChapterManage.vue'), meta: { title: '章节管理', requiresAuth: true, requiresAdmin: true } },
      { path: 'questions', name: 'QuestionManage', component: () => import('@/views/admin/QuestionManage.vue'), meta: { title: '题库管理', requiresAuth: true, requiresAdmin: true } },
      { path: 'imports', name: 'QuestionUpload', component: () => import('@/views/admin/QuestionUpload.vue'), meta: { title: '题目导入', requiresAuth: true, requiresAdmin: true } },
      { path: 'traces', name: 'TraceManage', component: () => import('@/views/admin/TraceManage.vue'), meta: { title: '题目反馈', requiresAuth: true, requiresAdmin: true } },
      { path: 'question-imports', redirect: '/admin/imports', meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'question-reports', redirect: '/admin/traces', meta: { requiresAuth: true, requiresAdmin: true } }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const useHashHistory = import.meta.env.MODE === 'android' || import.meta.env.VITE_ROUTER_MODE === 'hash'

const router = createRouter({
  history: useHashHistory ? createWebHashHistory(import.meta.env.BASE_URL) : createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

export default router
