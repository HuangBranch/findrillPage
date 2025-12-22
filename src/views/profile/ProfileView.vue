<template>
  <div class="profile-page">
    <!-- 头部用户信息（不变） -->
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
    <!-- 学习统计（数据来源改为接口） -->
    <div class="stats-section">
      <div class="section-title">学习统计</div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">
            <span v-if="isStatsLoading" class="loading-placeholder">--</span>
            <span v-else>{{ stats.totalCourses || 0 }}</span>
          </div>
          <div class="stat-label">学习课程</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            <span v-if="isStatsLoading" class="loading-placeholder">--</span>
            <span v-else>{{ stats.totalPractice || 0 }}</span>
          </div>
          <div class="stat-label">练习次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            <span v-if="isStatsLoading" class="loading-placeholder">--</span>
            <span v-else>{{ stats.totalExams || 0 }}</span>
          </div>
          <div class="stat-label">考试次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">
            <span v-if="isStatsLoading" class="loading-placeholder">--</span>
            <span v-else>{{ stats.wrongCount || 0 }}</span>
          </div>
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
        <!-- 新增：修改个人信息菜单 -->
        <div class="menu-item" @click="goToEditProfile">
          <div class="menu-left">
            <el-icon class="menu-icon" :size="20"><UserFilled /></el-icon>
            <span class="menu-text">修改个人信息</span>
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
import axios from 'axios'
import {
  User, Document, Edit, InfoFilled, SwitchButton, ArrowRight, UserFilled // 新增UserFilled图标
} from '@element-plus/icons-vue'
import BottomNav from '@/components/BottomNav.vue'
import { getPracticeList } from "@/api/practice.js";
import {count, getExamRecords} from "@/api/user.js";
import { getExamList } from "@/api/exam.js";
import { getWrongList } from "@/api/wrong.js";
import { getCourseList } from "@/api/course.js";

const router = useRouter()
const authStore = useAuthStore()
const courseStore = useCourseStore()
const showAboutDialog = ref(false)
const isStatsLoading = ref(true);

// 用户信息（不变，从authStore获取）
const userInfo = computed(() => ({
  username: authStore.userInfo.name || '未登录',
  email: authStore.userInfo.email || '',
  avatar: authStore.userInfo.avatar || '',
  id: authStore.userInfo.id || 0, // 新增：获取用户ID
  realName: authStore.userInfo.realName || '' // 新增：获取真实姓名
}))

// 学习统计（初始值为空，从接口加载）
const stats = ref({
  totalCourses: 0,
  totalPractice: 0,
  totalExams: 0,
  wrongCount: 0
})

/**
 * 加载统计数据：从接口获取
 */
const loadStats = async () => {
  isStatsLoading.value = true;
  try {
    // // 1. 课程数量
    // const courses = await getCourseList()
    // const totalCourses = Array.isArray(courses) ? courses.length : 0;
    // // 2. 练习次数
    // const practiceRes = await getPracticeList()
    // const totalPractice = Array.isArray(practiceRes) ? practiceRes.length : 0;
    // // 3. 考试次数
    // const examRes = await getExamList()
    // const totalExams = Array.isArray(examRes) ? examRes.length : 0;
    // // 4. 错题数量
    // const wrongRes = await getWrongList()
    // const wrongCount = Array.isArray(wrongRes) ? wrongRes.length : 0;
    const data=await count()
    console.log(data)
    // 更新统计数据
    stats.value = {
      totalCourses:data.courseCount,
      totalPractice:data.practiceCount,
      totalExams:data.examCount,
      wrongCount:data.wrongCount
    }
  } catch (error) {
    ElMessage.error('加载学习统计失败：' + (error.message || '服务器异常'))
    console.error('统计数据接口请求错误：', error)
    stats.value = {
      totalCourses: 0,
      totalPractice: 0,
      totalExams: 0,
      wrongCount: 0
    }
  } finally {
    isStatsLoading.value = false;
  }
}

// 跳转功能（新增修改个人信息跳转）
const goToExamRecords = () => {
  router.push('/profile/exam-records')
}
const goToPracticeRecords = () => {
  router.push('/profile/practice-records')
}
const goToWrongBook = () => {
  router.push('/wrong')
}
// 新增：跳转到修改个人信息页面（携带用户ID参数）
const goToEditProfile = () => {
  if (!userInfo.value.id) {
    ElMessage.warning('用户ID不存在，无法修改信息')
    return
  }
  router.push({
    path: `/profile/edit/${userInfo.value.id}`,
    query: {
      name: userInfo.value.username,
      realName: userInfo.value.realName,
      email: userInfo.value.email,
      avatar: userInfo.value.avatar
    }
  })
}

// 退出登录（不变）
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
        '确定要退出登录吗？',
        '提示',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    authStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  } catch {
    // 用户取消，不处理
  }
}

// 页面挂载时加载统计数据
onMounted(async () => {
  await loadStats()
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
/* 加载占位符样式 */
.loading-placeholder {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  position: relative;
  color: #c0c4cc;
}
.loading-placeholder::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: loadingFlash 1.5s infinite;
}
@keyframes loadingFlash {
  0% { background-position: -2rem 0; }
  100% { background-position: 2rem 0; }
}
</style>