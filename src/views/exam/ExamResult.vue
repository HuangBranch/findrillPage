<template>
  <div class="result-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <h1 class="page-title">考试结果</h1>
        <div style="width: 40px;"></div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="page-content">
      <div v-if="record" class="result-container">
        <!-- 成绩卡片 -->
        <div class="score-card">
          <div class="score-icon" :class="isPassed ? 'passed' : 'failed'">
            <el-icon v-if="isPassed"><CircleCheck /></el-icon>
            <el-icon v-else><CircleClose /></el-icon>
          </div>
          <div class="score-value">{{ record.score }}</div>
          <div class="score-label">{{ isPassed ? '考试通过' : '考试未通过' }}</div>
        </div>

        <!-- 统计信息 -->
        <div class="stats-card">
          <div class="stat-item">
            <div class="stat-icon"><el-icon><DocumentChecked /></el-icon></div>
            <div class="stat-info">
              <div class="stat-label">答对题数</div>
              <div class="stat-value">{{ record.rightCount }}/{{ record.totalQuestion }}</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon"><el-icon><Clock /></el-icon></div>
            <div class="stat-info">
              <div class="stat-label">用时</div>
              <div class="stat-value">{{ formatDuration() }}</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon"><el-icon><TrendCharts /></el-icon></div>
            <div class="stat-info">
              <div class="stat-label">正确率</div>
              <div class="stat-value">{{ accuracy }}%</div>
            </div>
          </div>
        </div>

        <!-- 考试信息 -->
        <div class="info-card">
          <h3>考试信息</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">课程名称</span>
              <span class="info-value">{{ record.curriculumName || '未知课程' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">章节名称</span>
              <span class="info-value">{{ record.chapterName || '未知章节' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">考试时间</span>
              <span class="info-value">{{ formatTime(record.submitTime) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">考试状态</span>
              <span class="info-value">{{ getStatusText(record.status) }}</span>
            </div>
          </div>
        </div>

        <!-- 答题详情 -->
        <div class="detail-card">
          <h3>答题详情</h3>
          <div class="detail-stats">
            <div class="detail-item correct">
              <el-icon><CircleCheck /></el-icon>
              <span>正确: {{ record.rightCount }}</span>
            </div>
            <div class="detail-item wrong">
              <el-icon><CircleClose /></el-icon>
              <span>错误: {{ record.wrongCount }}</span>
            </div>
            <div class="detail-item unanswered">
              <el-icon><Remove /></el-icon>
              <span>未答: {{ unansweredCount }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button size="large" @click="viewWrongQuestions" v-if="record.wrongCount > 0">
            <el-icon><View /></el-icon>
            查看错题
          </el-button>
          <el-button type="primary" size="large" @click="backToCourses">
            <el-icon><House /></el-icon>
            返回课程
          </el-button>
        </div>
      </div>

      <el-empty v-else description="未找到考试记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, CircleCheck, CircleClose, DocumentChecked, Clock, TrendCharts, View, House, Remove } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import {getExamResult} from "@/api/exam.js";

const router = useRouter()
const route = useRoute()

const record = ref(null)

// 根据接口数据判断是否通过
const isPassed = computed(() => (record.value?.score || 0) >= 60)

// 计算正确率
const accuracy = computed(() => {
  if (!record.value || !record.value.totalQuestion) return 0
  // 防止除以0
  return Math.round((record.value.rightCount / record.value.totalQuestion) * 100)
})

// 计算未答题数
const unansweredCount = computed(() => {
  if (!record.value) return 0
  return (record.value.totalQuestion || 0) - (record.value.rightCount || 0) - (record.value.wrongCount || 0)
})

// 初始化
onMounted(() => {
  loadRecord()
})
const examId = route.params.id
// 加载考试记录
const loadRecord = async () => {
  try {
    // 从路由 state 中获取传递的数据
    const data =await getExamResult(examId)
    console.log(data)
    if (data) {
      // 将传入的数据映射到组件期望的字段
      record.value = {
        score: data.score || 0,
        rightCount: data.correctCount || 0,
        wrongCount: data.wrongCount || 0,
        totalQuestion: data.totalCount || 0,
        curriculumName: data.curriculumName || '未知课程',
        chapterName: data.chapterName || '未知章节',
        submitTime: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
        startTime: data.timestamp ? new Date(data.timestamp - (data.duration || 0) * 1000).toISOString() : new Date().toISOString(),
        status: 1, // 已完成
        duration: data.duration || 0,
        autoSubmit: data.autoSubmit || false
      }
      console.log('加载考试记录:', record.value)
    } else {
      console.warn('未找到考试记录数据')
    }
  } catch (error) {
    console.error('加载考试记录失败:', error)
  }
}

// 格式化考试时长
const formatDuration = () => {
  if (!record.value) {
    return '0分0秒'
  }

  const seconds = record.value.duration || 0
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}分${secs}秒`
}

// 格式化时间显示
const formatTime = (timeStr) => {
  return timeStr ? dayjs(timeStr).format('YYYY-MM-DD HH:mm:ss') : '未知时间'
}

// 转换考试状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: '未完成',
    1: '已完成',
    2: '已过期'
  }
  return statusMap[status] || '未知状态'
}

// 查看错题
const viewWrongQuestions = () => {
  router.push({
    path: '/wrong',
    state: { examId: record.value.id }
  })
}

// 返回课程列表
const backToCourses = () => {
  router.push('/courses')
}

// 返回
const handleBack = () => {
  router.push('/courses')
}
</script>

<style scoped>
/* 样式部分保持不变 */
.result-page {
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
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.page-content::-webkit-scrollbar {
  width: 6px;
}

.page-content::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.page-content::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.result-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 成绩卡片 */
.score-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
  text-align: center;
}

.score-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-icon.passed {
  background: #f0f9ff;
  color: #67c23a;
}

.score-icon.failed {
  background: #fef0f0;
  color: #f56c6c;
}

.score-icon :deep(.el-icon) {
  font-size: 48px;
}

.score-value {
  font-size: 4rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 0.5rem;
}

.score-label {
  font-size: 1.25rem;
  color: #606266;
}

/* 统计卡片 */
.stats-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-icon :deep(.el-icon) {
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #909399;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #303133;
}

/* 信息卡片 */
.info-card,
.detail-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
}

.info-card h3,
.detail-card h3 {
  font-size: 1.125rem;
  margin: 0 0 1rem 0;
  color: #303133;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f5f7fa;
  border-radius: 8px;
}

.info-label {
  color: #909399;
  font-size: 0.875rem;
}

.info-value {
  color: #303133;
  font-weight: 500;
}

/* 答题详情 */
.detail-stats {
  display: flex;
  gap: 1rem;
}

.detail-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
}

.detail-item.correct {
  background: #f0f9ff;
  color: #67c23a;
}

.detail-item.wrong {
  background: #fef0f0;
  color: #f56c6c;
}

.detail-item.unanswered {
  background: #f5f7fa;
  color: #909399;
}

.detail-item :deep(.el-icon) {
  font-size: 32px;
}

.detail-item span {
  font-weight: 600;
  font-size: 0.875rem;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.action-buttons .el-button {
  flex: 1;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .page-header {
    padding: 1rem;
  }

  .page-title {
    font-size: 1rem;
  }

  .page-content {
    padding: 1rem;
  }

  .score-card {
    padding: 1.5rem;
  }

  .score-icon {
    width: 60px;
    height: 60px;
  }

  .score-icon :deep(.el-icon) {
    font-size: 36px;
  }

  .score-value {
    font-size: 3rem;
  }

  .score-label {
    font-size: 1rem;
  }

  .detail-stats {
    flex-direction: column;
  }

  .action-buttons {
    flex-direction: column;
  }
}

/* PC端适配 */
@media (min-width: 1024px) {
  .page-content {
    padding: 2rem 3rem;
  }
}
</style>
