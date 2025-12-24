<template>
  <div class="exam-records-page">
    <!-- 头部 -->
    <div class="page-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <h1 class="page-title">考试记录</h1>
        <div style="width: 40px"></div>
      </div>
    </div>
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filterType" placeholder="全部课程" clearable @change="onFilterChange">
        <el-option
            v-for="course in courseList"
            :key="course.curriculumId"
            :label="course.curriculumName"
            :value="course.curriculumId"
        />
      </el-select>

      <el-select v-model="sortType" @change="onSortChange">
        <el-option label="最新优先" value="latest" />
        <el-option label="最早优先" value="earliest" />
        <el-option label="分数从高到低" value="highScore" />
        <el-option label="分数从低到高" value="lowScore" />
      </el-select>
    </div>
    <!-- 统计卡片 -->
    <div class="stats-card">
      <div class="stat-item">
        <div class="stat-label">总考试次数</div>
        <div class="stat-value">{{ totalExams }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">平均分</div>
        <div class="stat-value">{{ averageScore }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">最高分</div>
        <div class="stat-value">{{ maxScore }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">及格率</div>
        <div class="stat-value">{{ passRate }}%</div>
      </div>
    </div>
    <!-- 记录列表 -->
    <div class="page-content">
      <div v-if="filteredRecords.length === 0" class="empty-state">
        <el-empty description="暂无考试记录">
          <el-button type="primary" @click="handleBack">开始考试</el-button>
        </el-empty>
      </div>
      <div v-else class="records-list">
        <div
            v-for="record in filteredRecords"
            :key="record.id"
        class="record-card"
        @click="viewDetail(record)"
        >
        <div class="card-header">
          <div class="course-info">
            <h3 class="course-name">{{ record.curriculumName }}</h3>
            <p class="chapter-name">{{ record.chapterName }}</p>
          </div>
          <div class="score-badge" :class="getScoreClass(record.score)">
            {{ getScoreText(record) }}
          </div>
        </div>
        <div class="card-body">
          <div class="info-row">
            <div class="info-item">
              <el-icon><Clock /></el-icon>
              <span>{{ getTimeText(record) }}</span>
            </div>
            <div class="info-item">
              <el-icon><Document /></el-icon>
              <span>{{ getAnswerText(record) }}</span>
            </div>
          </div>

          <div class="info-row">
            <div class="info-item">
              <el-icon><Calendar /></el-icon>
              <span>{{ formatDate(record.startTime) }}</span>
            </div>
            <div class="info-item" v-if="record.autoSubmit">
              <el-tag type="warning" size="small">超时自动提交</el-tag>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <el-button text type="primary" @click.stop="viewDetail(record)">
            查看详情
            <el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
          <el-button text type="danger" @click.stop="deleteRecord(record)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios' // 引入axios用于接口请求
import {
  ArrowLeft, Clock, Document, Calendar, ArrowRight, Delete
} from '@element-plus/icons-vue'
import {getExamRecords} from "@/api/user.js";
import {getExamList, getExamResult} from "@/api/exam.js";

const router = useRouter()
const courseStore = useCourseStore()
const records = ref([]) // 存储接口返回的考试记录
const filterType = ref('')
const sortType = ref('latest')

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 课程列表（从courseStore获取，不变）
const courseList = computed(() => courseStore.courses || [])

// 统计数据（逻辑不变，基于接口返回的records计算）
const totalExams = computed(() => records.value.length)
const averageScore = computed(() => {
  const completedRecords = records.value.filter(r => r.rightCount !== null)
  if (completedRecords.length === 0) return 0
  const total = completedRecords.reduce((sum, r) => sum + (r.score || 0), 0)
  return Math.round(total / completedRecords.length)
})
const maxScore = computed(() => {
  const completedRecords = records.value.filter(r => r.rightCount !== null)
  if (completedRecords.length === 0) return 0
  return Math.max(...completedRecords.map(r => r.score || 0))
})
const passRate = computed(() => {
  const completedRecords = records.value.filter(r => r.rightCount !== null)
  if (completedRecords.length === 0) return 0
  const passCount = completedRecords.filter(r => r.score >= 60).length
  return Math.round((passCount / completedRecords.length) * 100)
})

// 筛选排序（逻辑不变，基于接口数据计算）
const filteredRecords = computed(() => {
  let result = [...records.value]
  
  // 按课程筛选
  if (filterType.value) {
    result = result.filter(r => r.curriculumId === filterType.value)
  }
  
  // 排序
  switch (sortType.value) {
    case 'latest':
      result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      break
    case 'earliest':
      result.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      break
    case 'highScore':
      result.sort((a, b) => (b.score || 0) - (a.score || 0))
      break
    case 'lowScore':
      result.sort((a, b) => (a.score || 0) - (b.score || 0))
      break
  }
  
  // 更新总数
  total.value = result.length
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

/**
 * 加载考试记录：替换LocalStorage为接口请求
 * 接口：GET /api/exam/list（对应图片中考试记录接口）
 */
const loadRecords = async () => {
  try {
    const res = await getExamList()
    // 假设接口返回格式与原LocalStorage数据一致（字段匹配）
    // 若字段不匹配，需在这里做数据映射（如res.data.list → records.value）
    records.value = res || []
  } catch (error) {
    ElMessage.error('加载考试记录失败：' + (error.message || '服务器异常'))
    console.error('考试记录接口请求错误：', error)
    records.value = [] // 失败时置空，避免页面异常
  }
}

// 获取分数显示文本
const getScoreText = (record) => {
  if (record.rightCount === null) return '未作答'
  return `${record.score}分`
}

// 获取答题情况文本
const getAnswerText = (record) => {
  if (record.rightCount === null) {
    return `共 ${record.totalQuestion} 题（未作答）`
  }
  return `答对 ${record.rightCount}/${record.totalQuestion} 题`
}

// 获取用时文本
const getTimeText = (record) => {
  if (!record.useTime || record.useTime === 0) {
    return '用时 0分0秒'
  }
  const minutes = Math.floor(record.useTime / 60)
  const seconds = record.useTime % 60
  return `用时 ${minutes}分${seconds}秒`
}

// 原有工具函数（不变）
const getScoreClass = (score) => {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 60) return 'pass'
  return 'fail'
}
const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0分0秒'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}分${secs}秒`
}
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (date.toDateString() === now.toDateString())
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString())
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 筛选/排序触发（逻辑不变）
const onFilterChange = () => {
  currentPage.value = 1 // 重置到第一页
}
const onSortChange = () => {
  currentPage.value = 1 // 重置到第一页
}

// 分页变化
const handlePageChange = () => {
  // 分页变化时，filteredRecords 会自动重新计算
}

// 查看详情（不变）
const viewDetail = async (record) => {
  try {
    // 校验record和record.id是否有效
    if (!record || !record.id || record.id === 0) {
      ElMessage.warning('考试记录ID无效，无法查看详情')
      return
    }
    router.push({
      path: `/exam/result/${record.id}`,
    })
  }catch (error) {
    ElMessage(error)
  }

}

/**
 * 删除考试记录：替换LocalStorage为接口请求
 * 接口：DELETE /api/exam/{id}（按RESTful规范设计，需与后端对齐）
 */
const deleteRecord = async (record) => {
  try {
    await ElMessageBox.confirm(
        '确定要删除这条考试记录吗？',
        '确认删除',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    // 调用删除接口（传入记录id）
    await axios.delete(`/api/exam/${record.id}`)
    ElMessage.success('删除成功')
    // 重新加载数据，确保页面与后端同步
    await loadRecords()
  } catch (error) {
    // 排除用户取消的情况，只提示真实错误
    if (error !== 'cancel' && !error.message.includes('cancel')) {
      ElMessage.error('删除考试记录失败：' + (error.message || '服务器异常'))
      console.error('删除考试记录错误：', error)
    }
  }
}

// 返回（不变）
const handleBack = () => {
  router.back()
}

// 页面挂载时加载数据（异步）
onMounted(async () => {
  await loadRecords()
})
</script>

<style scoped>
.exam-records-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #f5f7fa;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 头部 */
.page-header {
  flex-shrink: 0;
  padding: 1rem 1.5rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.page-title {
  flex: 1;
  text-align: center;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #303133;
}

/* 筛选栏 */
.filter-bar {
  padding: 1rem 1.5rem;
  background: white;
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid #ebeef5;
}

.filter-bar .el-select {
  flex: 1;
}

/* 统计卡片 */
.stats-card {
  margin: 1rem 1.5rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.85rem;
  color: #909399;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #409eff;
}

/* 内容区域 */
.page-content {
  padding: 0 1.5rem 1.5rem;
}

.empty-state {
  padding: 3rem 0;
}

/* 记录列表 */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.record-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.record-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.record-card:active {
  transform: translateY(0);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f5f7fa;
}

.course-info {
  flex: 1;
  min-width: 0;
}

.course-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #303133;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-name {
  font-size: 0.9rem;
  color: #909399;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-badge {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 1.25rem;
  font-weight: 700;
  margin-left: 1rem;
}

.score-badge.excellent {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.score-badge.good {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.score-badge.pass {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.score-badge.fail {
  background: #f5f7fa;
  color: #909399;
}

.card-body {
  margin-bottom: 1rem;
}

.info-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.75rem;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #606266;
}

.info-item .el-icon {
  color: #909399;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f5f7fa;
}

/* 分页 */
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-card {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .filter-bar {
    flex-direction: column;
  }

  .info-row {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
