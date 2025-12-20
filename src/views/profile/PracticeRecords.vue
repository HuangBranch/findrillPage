<template>
  <div class="practice-records-page">
    <!-- 头部 -->
    <div class="page-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <h1 class="page-title">练习记录</h1>
        <div style="width: 40px"></div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-select v-model="filterType" placeholder="全部课程" clearable @change="onFilterChange">
        <el-option
            v-for="course in courseList"
            :key="course.cId"
            :label="course.cName"
            :value="course.cId"
        />
      </el-select>

      <el-select v-model="sortType" @change="onSortChange">
        <el-option label="最新优先" value="latest" />
        <el-option label="最早优先" value="earliest" />
        <el-option label="正确率从高到低" value="highAccuracy" />
        <el-option label="正确率从低到高" value="lowAccuracy" />
      </el-select>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-card">
      <div class="stat-item">
        <div class="stat-label">练习次数</div>
        <div class="stat-value">{{ totalPractices }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">总题数</div>
        <div class="stat-value">{{ totalQuestions }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">答对题数</div>
        <div class="stat-value">{{ correctQuestions }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">平均正确率</div>
        <div class="stat-value">{{ averageAccuracy }}%</div>
      </div>
    </div>

    <!-- 记录列表 -->
    <div class="page-content">
      <div v-if="filteredRecords.length === 0" class="empty-state">
        <el-empty description="暂无练习记录">
          <el-button type="primary" @click="handleBack">开始练习</el-button>
        </el-empty>
      </div>

      <div v-else class="records-list">
        <div
            v-for="record in filteredRecords"
            :key="record.timestamp"
            class="record-card"
        >
          <div class="card-header">
            <div class="course-info">
              <h3 class="course-name">{{ record.id }}</h3>
              <p class="chapter-name">{{ record.chapterName }}</p>
            </div>
            <div class="accuracy-badge" :class="getAccuracyClass(record.accuracy)">
              {{ record.accuracy }}%
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <div class="info-item">
                <el-icon><Document /></el-icon>
                <span>答对 {{ record.rightCount }}/{{ record.totalQuestion }} 题</span>
              </div>
              <div class="info-item">
                <el-icon><Clock /></el-icon>
                <span>用时 {{ formatDuration(record.useTime) }}</span>
              </div>
            </div>

            <div class="info-row">
              <div class="info-item">
                <el-icon><Calendar /></el-icon>
                <span>{{ formatDate(record.startTime) }}</span>
              </div>
              <div class="info-item">
                <el-tag :type="getModeType(record.mode)" size="small">
                  {{ getModeText(record.mode) }}
                </el-tag>
              </div>
            </div>

            <!-- 题型统计 -->
            <div class="type-stats" v-if="record.typeStats">
              <div class="type-stat" v-for="(stat, type) in record.typeStats" :key="type">
                <span class="type-label">{{ getTypeLabel(type) }}</span>
                <span class="type-value">{{ stat.correct }}/{{ stat.total }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <el-button text type="primary" @click="continueChapter(record)">
              继续练习
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
            <el-button text type="danger" @click="deleteRecord(record)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
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
import axios from 'axios'
import {
  ArrowLeft, Clock, Document, Calendar, ArrowRight, Delete
} from '@element-plus/icons-vue'
import {getPracticeList} from "@/api/practice.js";

const router = useRouter()
const courseStore = useCourseStore()
const records = ref([]) // 存储接口返回的练习记录
const filterType = ref('')
const sortType = ref('latest')

// 课程列表（不变）
const courseList = computed(() => courseStore.courses || [])

// 统计数据（逻辑不变，基于接口数据计算）
const totalPractices = computed(() => records.value.length)
const totalQuestions = computed(() => {
  return records.value.reduce((sum, r) => sum + r.totalQuestion, 0)
})
const correctQuestions = computed(() => {
  return records.value.reduce((sum, r) => sum + r.rightCount, 0)
})
const averageAccuracy = computed(() => {
  if (records.value.length === 0) return 0
  const total = records.value.reduce((sum, r) => sum + r.rightCount%r.totalQuestion, 0)
  return Math.round(total / records.value.length)
})

// 筛选排序（逻辑不变）
const filteredRecords = computed(() => {
  let result = [...records.value]
  if (filterType.value) {
    result = result.filter(r => r.courseId === filterType.value)
  }
  switch (sortType.value) {
    case 'latest':
      result.sort((a, b) => b.timestamp - a.timestamp)
      break
    case 'earliest':
      result.sort((a, b) => a.timestamp - b.timestamp)
      break
    case 'highAccuracy':
      result.sort((a, b) => b.accuracy - a.accuracy)
      break
    case 'lowAccuracy':
      result.sort((a, b) => a.accuracy - b.accuracy)
      break
  }
  return result
})

/**
 * 加载练习记录：调用接口GET /api/practice/list（对应图片中练习接口）
 */
const loadRecords = async () => {
  try {
    const res = await getPracticeList()
    records.value = res || [] // 假设接口返回格式与原数据一致
  } catch (error) {
    ElMessage.error('加载练习记录失败：' + (error.message || '服务器异常'))
    console.error('练习记录接口请求错误：', error)
    records.value = []
  }
}

// 原有工具函数（getAccuracyClass、getModeType等，不变）
const getAccuracyClass = (accuracy) => {
  if (accuracy >= 90) return 'excellent'
  if (accuracy >= 80) return 'good'
  if (accuracy >= 60) return 'pass'
  return 'fail'
}
const getModeType = (mode) => {
  const types = { 'sequence': 'info', 'random': 'warning', 'wrong': 'danger' }
  return types[mode] || 'info'
}
const getModeText = (mode) => {
  const texts = { 'sequence': '顺序练习', 'random': '随机练习', 'wrong': '错题练习' }
  return texts[mode] || '练习'
}
const getTypeLabel = (type) => {
  const labels = { 'single': '单选', 'multiple': '多选', 'judge': '判断' }
  return labels[type] || type
}
const formatDuration = (seconds) => { /* 不变 */ }
const formatDate = (timestamp) => { /* 不变 */ }

// 筛选/排序触发（不变）
const onFilterChange = () => {}
const onSortChange = () => {}

// 继续练习（不变）
const continueChapter = (record) => {
  const course = courseList.value.find(c => c.cId === record.courseId)
  if (course) {
    courseStore.setCurrentCourse(course)
    router.push(`/courses/${record.courseId}/chapters`)
  } else {
    ElMessage.warning('课程不存在')
  }
}

/**
 * 删除练习记录：调用接口DELETE /api/practice/{id}
 */
const deleteRecord = async (record) => {
  try {
    await ElMessageBox.confirm(
        '确定要删除这条练习记录吗？',
        '确认删除',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await axios.delete(`/api/practice/${record.id}`) // 调用删除接口
    ElMessage.success('删除成功')
    await loadRecords() // 重新加载数据
  } catch (error) {
    if (error !== 'cancel' && !error.message.includes('cancel')) {
      ElMessage.error('删除练习记录失败：' + (error.message || '服务器异常'))
      console.error('删除练习记录错误：', error)
    }
  }
}

// 返回（不变）
const handleBack = () => {
  router.back()
}

// 挂载时加载数据
onMounted(async () => {
  await loadRecords()
})
</script>
<style scoped>
.practice-records-page {
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
  color: #67c23a;
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
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.record-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
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

.accuracy-badge {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 1.25rem;
  font-weight: 700;
  margin-left: 1rem;
}

.accuracy-badge.excellent {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.accuracy-badge.good {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.accuracy-badge.pass {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.accuracy-badge.fail {
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

/* 题型统计 */
.type-stats {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f5f7fa;
}

.type-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: #f5f7fa;
  border-radius: 12px;
  font-size: 0.85rem;
}

.type-label {
  color: #909399;
}

.type-value {
  color: #303133;
  font-weight: 600;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #f5f7fa;
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

  .type-stats {
    flex-wrap: wrap;
  }
}
</style>
