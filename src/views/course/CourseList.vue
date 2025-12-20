<template>
  <div class="course-list-page">
    <!-- 头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">我的课程</h1>
        <el-button circle @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
        </el-button>
      </div>
      
      <!-- 搜索框 -->
      <el-input
        v-model="keyword"
        placeholder="搜索课程"
        clearable
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 课程列表 -->
    <div class="page-content">
      <el-row :gutter="20" v-loading="loading">
        <el-col
          v-for="course in filteredCourses"
          :key="course.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <div class="course-card" @click="goToChapters(course)">
            <div class="card-header">
              <div class="course-icon">
                <el-icon :size="40"><Reading /></el-icon>
              </div>
            </div>
            
            <div class="card-body">
              <h3 class="course-title">{{ course.name }}</h3>
              <p class="course-desc">{{ course.remarks || '暂无描述' }}</p>
            </div>
            
            <div class="card-footer">
              <div class="course-stats">
                <el-tag size="small">
                  <el-icon><Document /></el-icon>
                  {{ course.questionCount || 0 }} 题
                </el-tag>
                <el-tag size="small" type="success" v-if="course.recentExamCount">
                  <el-icon><View /></el-icon>
                  {{ course.recentExamCount || 0}} 次
                </el-tag>
              </div>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 空状态 -->
      <el-empty v-if="!loading && filteredCourses.length === 0" description="暂无课程" />
    </div>

    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCourseList } from '@/api/course'
import { 
  Reading, Search, Document, View, ArrowRight, Flag, User, SwitchButton 
} from '@element-plus/icons-vue'
import BottomNav from '@/components/BottomNav.vue'

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()
const authStore = useAuthStore()

const keyword = ref('')
const courseList = ref([])
const loading = ref(false)

// 搜索过滤（按题目数量排序）
const filteredCourses = computed(() => {
  let courses = courseList.value
  
  // 搜索过滤
  if (keyword.value) {
    courses = courses.filter(course => 
      course.name.toLowerCase().includes(keyword.value.toLowerCase()) ||
      (course.remarks && course.remarks.toLowerCase().includes(keyword.value.toLowerCase()))
    )
  }
  
  // 按题目数量降序排序
  return courses.sort((a, b) => {
    const countA = a.questionCount || 0
    const countB = b.questionCount || 0
    return countB - countA
  })
})

// 加载课程列表
const loadCourses = async () => {
  loading.value = true
  
  try {
    const data = await getCourseList({ page: 1, pageSize: 100 })
    courseList.value = data || []
    courseStore.setCourseList(courseList.value)
  } catch (error) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 进入章节列表
const goToChapters = (course) => {
  courseStore.setCurrentCourse(course)
  router.push(
    { 
      path: `/courses/${course.id}/chapters` ,
      query: { 
        curriculumName: course.name,
        questionCount: course.questionCount || 0
      }
    }
  )
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    // 用户取消
  }
}

onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
.course-list-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #f5f7fa;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 1.5rem 1.5rem 1.25rem;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.header-content :deep(.el-button) {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  color: #606266;
  transition: all 0.3s;
}

.header-content :deep(.el-button:hover) {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.search-input {
  max-width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  box-shadow: none;
  transition: all 0.3s;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  background: white;
  border-color: #409eff;
}

.search-input :deep(.el-input__inner) {
  color: #303133;
  font-size: 16px;
}

.search-input :deep(.el-input__inner::placeholder) {
  color: #909399;
}

.search-input :deep(.el-input__prefix) {
  color: #909399;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  padding-bottom: 100px;
}

.page-content::-webkit-scrollbar {
  width: 6px;
}

.page-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.page-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.page-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.course-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  height: calc(100% - 1rem);
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.card-header {
  margin-bottom: 1rem;
}

.course-icon {
  width: 56px;
  height: 56px;
  background: #ecf5ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
}

.card-body {
  flex: 1;
  margin-bottom: 0.75rem;
}

.course-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-desc {
  font-size: 0.875rem;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #ebeef5;
}

.course-stats {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.course-stats :deep(.el-tag) {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #f0f2f5;
  border: none;
  color: #606266;
  font-weight: 500;
}

.course-stats :deep(.el-tag.el-tag--success) {
  background: #e8f5e9;
  color: #67c23a;
}

.arrow-icon {
  color: #c0c4cc;
  font-size: 1.25rem;
  transition: all 0.3s;
}

.course-card:hover .arrow-icon {
  transform: translateX(4px);
  color: #409eff;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .page-header {
    padding: 1rem 1rem 0.75rem;
  }
  
  .page-title {
    font-size: 1.25rem;
  }
  
  .page-content {
    padding: 1rem;
    padding-bottom: 100px;
  }
  
  .course-card {
    margin-bottom: 1rem;
    padding: 1rem;
  }
  
  .course-icon {
    width: 48px;
    height: 48px;
  }
  
  .course-title {
    font-size: 1rem;
  }
  
  .course-desc {
    font-size: 0.813rem;
  }
  
  .bottom-nav {
    width: 240px;
    max-width: calc(100% - 32px);
    padding: 4px;
  }
  
  .nav-indicator {
    height: calc(100% - 8px);
    top: 4px;
  }
  
  .nav-item {
    padding: 6px 16px;
    min-width: 56px;
    gap: 2px;
    font-size: 11px;
  }
  
  .nav-item .el-icon {
    font-size: 20px;
  }
}

/* 平板适配 */
@media (min-width: 768px) and (max-width: 1023px) {
  .page-header {
    padding: 2rem 2rem 1.5rem;
  }
  
  .page-content {
    padding: 1.5rem 2rem;
  }
  
  .bottom-nav {
    max-width: 400px;
    padding: 8px;
  }
  
  .nav-indicator {
    height: calc(100% - 16px);
    top: 8px;
  }
  
  .nav-item {
    padding: 10px 24px;
    min-width: 80px;
  }
}

/* PC端适配 */
@media (min-width: 1024px) {
  .page-header {
    padding: 2.5rem 3rem 2rem;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .page-content {
    padding: 2rem 3rem;
  }
  
  .bottom-nav {
    max-width: 450px;
    padding: 8px;
  }
  
  .nav-indicator {
    height: calc(100% - 16px);
    top: 8px;
  }
  
  .nav-item {
    padding: 12px 28px;
    min-width: 90px;
  }
  
  .nav-item .el-icon {
    font-size: 24px;
  }
}
</style>
