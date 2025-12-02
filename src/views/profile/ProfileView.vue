<template>
  <div class="profile-page">
    <!-- 头部用户信息 -->
    <div class="profile-header">
      <div class="user-info">
        <div class="avatar-wrapper">
          <el-avatar :size="80" :src="userInfo.avatar">
            <el-icon :size="40"><User /></el-icon>
          </el-avatar>
        </div>
        <div class="user-details">
          <h2 class="username">{{ userInfo.username }}</h2>
          <p class="user-email">{{ userInfo.email }}</p>
        </div>
      </div>
    </div>

    <!-- 学习统计 -->
    <div class="stats-section">
      <div class="section-title">学习统计</div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ stats.totalCourses }}</div>
          <div class="stat-label">学习课程</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.totalPractice }}</div>
          <div class="stat-label">练习次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.totalExams }}</div>
          <div class="stat-label">考试次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.wrongCount }}</div>
          <div class="stat-label">错题数量</div>
        </div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-section">
      <div class="menu-group">
        <div class="menu-item" @click="goToExamRecords">
          <div class="menu-left">
            <el-icon class="menu-icon" :size="20"><Document /></el-icon>
            <span class="menu-text">考试记录</span>
          </div>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>
        
        <div class="menu-item" @click="goToPracticeRecords">
          <div class="menu-left">
            <el-icon class="menu-icon" :size="20"><Edit /></el-icon>
            <span class="menu-text">练习记录</span>
          </div>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>

        <div class="menu-item" @click="goToWrongBook">
          <div class="menu-left">
            <el-icon class="menu-icon" :size="20"><Flag /></el-icon>
            <span class="menu-text">我的错题</span>
          </div>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>
      </div>

      <div class="menu-group">
        <div class="menu-item" @click="showAboutDialog = true">
          <div class="menu-left">
            <el-icon class="menu-icon" :size="20"><InfoFilled /></el-icon>
            <span class="menu-text">关于应用</span>
          </div>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>

        <div class="menu-item" @click="handleLogout">
          <div class="menu-left">
            <el-icon class="menu-icon" :size="20" color="#f56c6c"><SwitchButton /></el-icon>
            <span class="menu-text" style="color: #f56c6c">退出登录</span>
          </div>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <BottomNav />

    <!-- 关于对话框 -->
    <el-dialog
      v-model="showAboutDialog"
      title="关于应用"
      width="90%"
      :style="{ maxWidth: '400px' }"
    >
      <div class="about-content">
        <div class="app-logo">
          <el-icon :size="60" color="#409eff"><Reading /></el-icon>
        </div>
        <h3>FindRill 刷题系统</h3>
        <p class="version">版本 1.0.0</p>
        <p class="description">
          一款专业的在线学习刷题平台，支持课程学习、在线练习、模拟考试、错题管理等功能。
        </p>
        <div class="app-info">
          <div class="info-item">
            <span class="info-label">开发者</span>
            <span class="info-value">FindRill Team</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系邮箱</span>
            <span class="info-value">support@findrill.com</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showAboutDialog = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCourseStore } from '@/stores/course'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  User, Document, Edit, InfoFilled, 
  SwitchButton, ArrowRight 
} from '@element-plus/icons-vue'
import BottomNav from '@/components/BottomNav.vue'

const router = useRouter()
const authStore = useAuthStore()
const courseStore = useCourseStore()

const showAboutDialog = ref(false)


// 用户信息
const userInfo = computed(() => ({
  username: authStore.user?.username || '未登录',
  email: authStore.user?.email || '',
  avatar: authStore.user?.avatar || ''
}))

// 学习统计
const stats = ref({
  totalCourses: 0,
  totalPractice: 0,
  totalExams: 0,
  wrongCount: 0
})

// 加载统计数据
const loadStats = () => {
  // 获取课程数量
  const courses = courseStore.courses || []
  stats.value.totalCourses = courses.length

  // 获取练习记录数量
  const practiceRecords = JSON.parse(localStorage.getItem('practice_records') || '[]')
  stats.value.totalPractice = practiceRecords.length

  // 获取考试记录数量
  const examRecords = JSON.parse(localStorage.getItem('exam_records') || '[]')
  stats.value.totalExams = examRecords.length

  // 获取错题数量
  const wrongQuestions = JSON.parse(localStorage.getItem('wrong_questions') || '[]')
  stats.value.wrongCount = wrongQuestions.length
}

// 跳转到考试记录
const goToExamRecords = () => {
  router.push('/profile/exam-records')
}

// 跳转到练习记录
const goToPracticeRecords = () => {
  router.push('/profile/practice-records')
}

// 跳转到错题本
const goToWrongBook = () => {
  router.push('/wrong')
}

// 生成测试数据
const generateTestData = () => {
  // 检查是否已经有数据
  const existingExamRecords = localStorage.getItem('exam_records')
  const existingPracticeRecords = localStorage.getItem('practice_records')
  
  // 如果已经有数据，不再生成
  if (existingExamRecords && existingPracticeRecords) {
    const examRecords = JSON.parse(existingExamRecords)
    const practiceRecords = JSON.parse(existingPracticeRecords)
    if (examRecords.length > 0 && practiceRecords.length > 0) {
      return
    }
  }
  
  const now = Date.now()
  const courses = courseStore.courses || []
  
  if (courses.length === 0) return
  
  // 生成考试记录测试数据
  const examRecords = [
    {
      courseId: courses[0]?.cId || 1,
      courseName: courses[0]?.cName || '高等数学',
      chapterId: 1,
      chapterName: '第一章：函数与极限',
      score: 95,
      correctCount: 19,
      totalCount: 20,
      duration: 1800,
      results: [],
      timestamp: now - 86400000 * 7,
      autoSubmit: false
    },
    {
      courseId: courses[0]?.cId || 1,
      courseName: courses[0]?.cName || '高等数学',
      chapterId: 2,
      chapterName: '第二章：导数与微分',
      score: 88,
      correctCount: 44,
      totalCount: 50,
      duration: 2700,
      results: [],
      timestamp: now - 86400000 * 5,
      autoSubmit: false
    },
    {
      courseId: courses[0]?.cId || 1,
      courseName: courses[0]?.cName || '高等数学',
      chapterId: 3,
      chapterName: '第三章：积分',
      score: 72,
      correctCount: 36,
      totalCount: 50,
      duration: 3000,
      results: [],
      timestamp: now - 86400000 * 3,
      autoSubmit: true
    },
    {
      courseId: courses[1]?.cId || 2,
      courseName: courses[1]?.cName || '大学英语',
      chapterId: 1,
      chapterName: '第一章：词汇语法',
      score: 92,
      correctCount: 46,
      totalCount: 50,
      duration: 2400,
      results: [],
      timestamp: now - 86400000 * 2,
      autoSubmit: false
    },
    {
      courseId: courses[1]?.cId || 2,
      courseName: courses[1]?.cName || '大学英语',
      chapterId: 2,
      chapterName: '第二章：阅读理解',
      score: 85,
      correctCount: 17,
      totalCount: 20,
      duration: 1500,
      results: [],
      timestamp: now - 86400000,
      autoSubmit: false
    },
    {
      courseId: courses[0]?.cId || 1,
      courseName: courses[0]?.cName || '高等数学',
      chapterId: 4,
      chapterName: '第四章：微分方程',
      score: 58,
      correctCount: 29,
      totalCount: 50,
      duration: 2100,
      results: [],
      timestamp: now - 3600000 * 12,
      autoSubmit: false
    },
    {
      courseId: courses[1]?.cId || 2,
      courseName: courses[1]?.cName || '大学英语',
      chapterId: 3,
      chapterName: '第三章：写作',
      score: 78,
      correctCount: 39,
      totalCount: 50,
      duration: 2800,
      results: [],
      timestamp: now - 3600000 * 5,
      autoSubmit: false
    },
    {
      courseId: courses[0]?.cId || 1,
      courseName: courses[0]?.cName || '高等数学',
      chapterId: 1,
      chapterName: '第一章：函数与极限',
      score: 100,
      correctCount: 30,
      totalCount: 30,
      duration: 1200,
      results: [],
      timestamp: now - 3600000 * 2,
      autoSubmit: false
    }
  ]
  
  // 生成练习记录测试数据
  const practiceRecords = [
    {
      courseId: courses[0]?.cId || 1,
      courseName: courses[0]?.cName || '高等数学',
      chapterId: 1,
      chapterName: '第一章：函数与极限',
      mode: 'sequence',
      correctCount: 28,
      totalCount: 30,
      accuracy: 93,
      duration: 900,
      typeStats: {
        single: { correct: 18, total: 20 },
        multiple: { correct: 7, total: 8 },
        judge: { correct: 3, total: 2 }
      },
      timestamp: now - 86400000 * 6
    },
    {
      courseId: courses[0]?.cId || 1,
      courseName: courses[0]?.cName || '高等数学',
      chapterId: 2,
      chapterName: '第二章：导数与微分',
      mode: 'random',
      correctCount: 35,
      totalCount: 40,
      accuracy: 88,
      duration: 1200,
      typeStats: {
        single: { correct: 22, total: 25 },
        multiple: { correct: 10, total: 12 },
        judge: { correct: 3, total: 3 }
      },
      timestamp: now - 86400000 * 4
    },
    {
      courseId: courses[1]?.cId || 2,
      courseName: courses[1]?.cName || '大学英语',
      chapterId: 1,
      chapterName: '第一章：词汇语法',
      mode: 'sequence',
      correctCount: 24,
      totalCount: 25,
      accuracy: 96,
      duration: 750,
      typeStats: {
        single: { correct: 15, total: 15 },
        multiple: { correct: 9, total: 10 }
      },
      timestamp: now - 86400000 * 3
    },
    {
      courseId: courses[0]?.cId || 1,
      courseName: courses[0]?.cName || '高等数学',
      chapterId: 3,
      chapterName: '第三章：积分',
      mode: 'sequence',
      correctCount: 18,
      totalCount: 30,
      accuracy: 60,
      duration: 1500,
      typeStats: {
        single: { correct: 10, total: 18 },
        multiple: { correct: 5, total: 8 },
        judge: { correct: 3, total: 4 }
      },
      timestamp: now - 86400000 * 2
    },
    {
      courseId: courses[1]?.cId || 2,
      courseName: courses[1]?.cName || '大学英语',
      chapterId: 2,
      chapterName: '第二章：阅读理解',
      mode: 'random',
      correctCount: 19,
      totalCount: 20,
      accuracy: 95,
      duration: 600,
      typeStats: {
        single: { correct: 12, total: 12 },
        multiple: { correct: 7, total: 8 }
      },
      timestamp: now - 86400000
    },
    {
      courseId: courses[0]?.cId || 1,
      courseName: courses[0]?.cName || '高等数学',
      chapterId: 1,
      chapterName: '第一章：函数与极限',
      mode: 'wrong',
      correctCount: 8,
      totalCount: 10,
      accuracy: 80,
      duration: 480,
      typeStats: {
        single: { correct: 5, total: 6 },
        multiple: { correct: 2, total: 3 },
        judge: { correct: 1, total: 1 }
      },
      timestamp: now - 3600000 * 18
    },
    {
      courseId: courses[1]?.cId || 2,
      courseName: courses[1]?.cName || '大学英语',
      chapterId: 3,
      chapterName: '第三章：写作',
      mode: 'sequence',
      correctCount: 16,
      totalCount: 20,
      accuracy: 80,
      duration: 900,
      typeStats: {
        single: { correct: 10, total: 12 },
        multiple: { correct: 6, total: 8 }
      },
      timestamp: now - 3600000 * 8
    },
    {
      courseId: courses[0]?.cId || 1,
      courseName: courses[0]?.cName || '高等数学',
      chapterId: 4,
      chapterName: '第四章：微分方程',
      mode: 'random',
      correctCount: 22,
      totalCount: 25,
      accuracy: 88,
      duration: 1080,
      typeStats: {
        single: { correct: 14, total: 15 },
        multiple: { correct: 6, total: 8 },
        judge: { correct: 2, total: 2 }
      },
      timestamp: now - 3600000 * 3
    },
    {
      courseId: courses[1]?.cId || 2,
      courseName: courses[1]?.cName || '大学英语',
      chapterId: 1,
      chapterName: '第一章：词汇语法',
      mode: 'sequence',
      correctCount: 29,
      totalCount: 30,
      accuracy: 97,
      duration: 840,
      typeStats: {
        single: { correct: 20, total: 20 },
        multiple: { correct: 9, total: 10 }
      },
      timestamp: now - 3600000
    },
    {
      courseId: courses[0]?.cId || 1,
      courseName: courses[0]?.cName || '高等数学',
      chapterId: 2,
      chapterName: '第二章：导数与微分',
      mode: 'wrong',
      correctCount: 12,
      totalCount: 15,
      accuracy: 80,
      duration: 720,
      typeStats: {
        single: { correct: 8, total: 10 },
        multiple: { correct: 4, total: 5 }
      },
      timestamp: now - 1800000
    }
  ]
  
  localStorage.setItem('exam_records', JSON.stringify(examRecords))
  localStorage.setItem('practice_records', JSON.stringify(practiceRecords))
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    authStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  // 生成测试数据
  generateTestData()
  
  loadStats()
})
</script>

<style scoped>
.profile-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #f5f7fa;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 80px;
}

/* 头部用户信息 */
.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1.5rem;
  color: white;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar-wrapper {
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.username {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: white;
}

.user-email {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 学习统计 */
.stats-section {
  margin: 1.5rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #909399;
}

/* 功能菜单 */
.menu-section {
  margin: 0 1.5rem 1.5rem;
}

.menu-group {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f5f7fa;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.menu-item:active {
  background-color: #ecf0f5;
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.menu-icon {
  color: #606266;
}

.menu-text {
  font-size: 0.95rem;
  color: #303133;
}

.menu-arrow {
  color: #c0c4cc;
  font-size: 14px;
}

/* 关于对话框 */
.about-content {
  text-align: center;
  padding: 1rem 0;
}

.app-logo {
  margin-bottom: 1.5rem;
}

.about-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #303133;
  margin: 0 0 0.5rem 0;
}

.version {
  font-size: 0.9rem;
  color: #909399;
  margin: 0 0 1.5rem 0;
}

.description {
  font-size: 0.95rem;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 2rem 0;
  padding: 0 1rem;
}

.app-info {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e4e7ed;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.9rem;
  color: #909399;
}

.info-value {
  font-size: 0.9rem;
  color: #303133;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .stat-item {
    padding: 0.5rem;
  }
}

@media (max-width: 480px) {
  .profile-header {
    padding: 1.5rem 1rem;
  }

  .username {
    font-size: 1.25rem;
  }

  .stats-section,
  .menu-section {
    margin: 1rem;
  }
}
</style>
