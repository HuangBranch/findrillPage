import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
      path: '/verify-email',
      name: 'VerifyEmailToken',
      component: () => import('@/views/auth/VerifyEmailToken.vue'),
      meta: { title: '验证邮箱',requiresAuth: true }
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
      path: '/wrong/practice',
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
    // 后台管理
    {
      path: '/admin',
      redirect: '/admin/dashboard',
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/dashboard',
      name: 'AdminDashboard',
      component: () => import('@/views/admin/Dashboard.vue'),
      meta: { title: '后台首页', requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/users',
      name: 'UserManage',
      component: () => import('@/views/admin/UserManage.vue'),
      meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/roles',
      name: 'RoleManage',
      component: () => import('@/views/admin/RoleManage.vue'),
      meta: { title: '角色管理', requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/courses',
      name: 'CourseManage',
      component: () => import('@/views/admin/CourseManage.vue'),
      meta: { title: '课程管理', requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/chapters',
      name: 'ChapterManage',
      component: () => import('@/views/admin/ChapterManage.vue'),
      meta: { title: '章节管理', requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/questions',
      name: 'QuestionManage',
      component: () => import('@/views/admin/QuestionManage.vue'),
      meta: { title: '题目管理', requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/upload',
      name: 'QuestionUpload',
      component: () => import('@/views/admin/QuestionUpload.vue'),
      meta: { title: '题目上传', requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/traces',
      name: 'TraceManage',
      component: () => import('@/views/admin/TraceManage.vue'),
      meta: { title: '记录管理', requiresAuth: true, requiresAdmin: true }
    },
    // 404
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
      meta: { title: '页面不存在' }
    }
  ]
})

export default router
