import { createRouter, createWebHistory } from 'vue-router'
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
        meta: { title: '章节进度', requiresAuth: true }
      },
      {
        path: 'practice',
        name: 'Practice',
        component: () => import('@/views/practice/PracticeMode.vue'),
        meta: { title: '普通练习', requiresAuth: true }
      },
      {
        path: 'exam',
        name: 'Exam',
        component: () => import('@/views/exam/ExamMode.vue'),
        meta: { title: '正式考试', requiresAuth: true }
      },
      {
        path: 'attempt/:attemptId',
        name: 'AttemptWorkspace',
        component: () => import('@/views/exam/ExamMode.vue'),
        meta: { title: '答题中', requiresAuth: true }
      },
      {
        path: 'exam/result/:id',
        name: 'ExamResult',
        component: () => import('@/views/exam/ExamResult.vue'),
        meta: { title: '作答结果', requiresAuth: true }
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
        meta: { title: '错题练习', requiresAuth: true }
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
        path: 'profile/exam-records',
        name: 'ExamRecords',
        component: () => import('@/views/profile/ExamRecords.vue'),
        meta: { title: '作答记录', requiresAuth: true }
      },
      {
        path: 'profile/practice-records',
        name: 'PracticeRecords',
        component: () => import('@/views/profile/PracticeRecords.vue'),
        meta: { title: '学习状态', requiresAuth: true }
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
      { path: 'exam-configs', name: 'ExamConfigManage', component: () => import('@/views/admin/ExamConfigManage.vue'), meta: { title: '考试配置', requiresAuth: true, requiresAdmin: true } },
      { path: 'traces', name: 'TraceManage', component: () => import('@/views/admin/TraceManage.vue'), meta: { title: '审核反馈', requiresAuth: true, requiresAdmin: true } },
      { path: 'exams', redirect: '/admin/exam-configs', meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'question-imports', redirect: '/admin/imports', meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'question-audits', redirect: '/admin/traces', meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'question-reports', redirect: '/admin/traces', meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'gradings', redirect: '/admin/traces', meta: { requiresAuth: true, requiresAdmin: true } },
      { path: 'knowledge-points', redirect: '/admin/questions', meta: { requiresAuth: true, requiresAdmin: true } }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

export default router
