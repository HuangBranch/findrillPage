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
            :key="course.curriculumId"
            :label="course.curriculumName"
            :value="course.curriculumId"
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
            :key="record.id"
            class="record-card"
        >
          <div class="card-header">
            <div class="course-info">
              <h3 class="course-name">{{ record.curriculumName }}</h3>
              <p class="chapter-name">{{ record.chapterName }}</p>
            </div>
            <div class="accuracy-badge" :class="getAccuracyClass(getAccuracy(record))">
              {{ getAccuracyText(record) }}
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <div class="info-item">
                <el-icon><Document /></el-icon>
                <span>{{ getAnswerText(record) }}</span>
              </div>
              <div class="info-item">
                <el-icon><Clock /></el-icon>
                <span>{{ getTimeText(record) }}</span>
              </div>
            </div>

            <div class="info-row">
              <div class="info-item">
                <el-icon><Calendar /></el-icon>
                <span>{{ new Date(record.startTime).toLocaleString('zh-CN') }}</span>
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
            <el-button text type="primary" @click="viewDetail(record)">
              查看详情
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
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

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="练习详情" width="90%" :style="{ maxWidth: '800px' }">
      <div v-if="currentDetail" class="practice-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="课程">{{ currentDetail.curriculumName }}</el-descriptions-item>
          <el-descriptions-item label="章节">{{ currentDetail.chapterName }}</el-descriptions-item>
          <el-descriptions-item label="总题数">{{ currentDetail.totalQuestion }}</el-descriptions-item>
          <el-descriptions-item label="答对题数">{{ currentDetail.rightCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="错题数">{{ currentDetail.wrongCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="得分">{{ currentDetail.score }}</el-descriptions-item>
          <el-descriptions-item label="用时">{{ getTimeText(currentDetail) }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ new Date(currentDetail.startTime).toLocaleString('zh-CN') }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 题目列表 -->
        <div class="subject-list" v-if="currentDetail.subjectList && currentDetail.subjectList.length > 0">
          <h3 style="margin: 20px 0 10px 0; font-size: 16px;">题目详情</h3>
          <div v-for="(item, index) in paginatedSubjects" :key="item.id" class="subject-item">
            <div class="subject-header">
              <span class="subject-number">第 {{ (subjectPage - 1) * subjectPageSize + index + 1 }} 题</span>
              <el-tag :type="item.isCorrect ? 'success' : (item.userAnswer ? 'danger' : 'info')" size="small">
                {{ item.isCorrect ? '正确' : (item.userAnswer ? '错误' : '未作答') }}
              </el-tag>
            </div>
            <div class="subject-content">{{ item.subject }}</div>
            <div class="subject-answer">
              <span class="answer-label">正确答案：</span>
              <el-tag type="success" size="small">{{ item.answer }}</el-tag>
              <span class="answer-label" style="margin-left: 20px;">你的答案：</span>
              <el-tag :type="item.userAnswer ? (item.isCorrect ? 'success' : 'danger') : 'info'" size="small">
                {{ item.userAnswer || '未作答' }}
              </el-tag>
            </div>
          </div>
          
          <!-- 题目分页 -->
          <div class="subject-pagination" v-if="subjectTotal > subjectPageSize">
            <el-pagination
              v-model:current-page="subjectPage"
              v-model:page-size="subjectPageSize"
              :page-sizes="[5, 10, 20, 30]"
              layout="total, sizes, prev, pager, next"
              :total="subjectTotal"
              small
            />
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import {getPracticeDetailedResult} from '@/api/practice'
import {
  ArrowLeft, Clock, Document, Calendar, ArrowRight, Delete
} from '@element-plus/icons-vue'
import {getPracticeList} from "@/api/practice.js";

const router = useRouter()
const courseStore = useCourseStore()
const records = ref([]) // 存储接口返回的练习记录
const filterType = ref('')
const sortType = ref('latest')
const detailDialogVisible = ref(false)
const currentDetail = ref(null)

// 题目分页相关
const subjectPage = ref(1)
const subjectPageSize = ref(5)
const subjectTotal = computed(() => currentDetail.value?.subjectList?.length || 0)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 课程列表（不变）
const courseList = computed(() => courseStore.courses || [])

// 题目列表分页
const paginatedSubjects = computed(() => {
  if (!currentDetail.value?.subjectList) return []
  const start = (subjectPage.value - 1) * subjectPageSize.value
  const end = start + subjectPageSize.value
  return currentDetail.value.subjectList.slice(start, end)
})

// 统计数据（逻辑不变，基于接口数据计算）
const totalPractices = computed(() => records.value.length)
const totalQuestions = computed(() => {
  return records.value.reduce((sum, r) => sum + r.totalQuestion, 0)
})
const correctQuestions = computed(() => {
  return records.value.reduce((sum, r) => sum + (r.rightCount || 0), 0)
})
const averageAccuracy = computed(() => {
  const completedRecords = records.value.filter(r => r.rightCount !== null && r.totalQuestion > 0)
  if (completedRecords.length === 0) return 0
  const total = completedRecords.reduce((sum, r) => {
    const accuracy = (r.rightCount / r.totalQuestion) * 100
    return sum + accuracy
  }, 0)
  return Math.round(total / completedRecords.length)
})

// 筛选排序（预留位置，需要改动）
const filteredRecords = computed(() => {
  let result = [...records.value]
  
  // 筛选
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
    case 'highAccuracy':
      result.sort((a, b) => getAccuracy(b) - getAccuracy(a))
      break
    case 'lowAccuracy':
      result.sort((a, b) => getAccuracy(a) - getAccuracy(b))
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
 * 加载练习记录：调用接口GET /api/practice/list（对应图片中练习接口）
 */
const loadRecords = async () => {
  try {
    const res = await getPracticeList()
    console.log(res)
    records.value = res || [] // 假设接口返回格式与原数据一致
  } catch (error) {
    ElMessage.error('加载练习记录失败：' + (error.message || '服务器异常'))
    console.error('练习记录接口请求错误：', error)
    records.value = []
  }
}

// 计算正确率
const getAccuracy = (record) => {
  if (record.rightCount === null || record.totalQuestion === 0) return 0
  return Math.round((record.rightCount / record.totalQuestion) * 100)
}

// 获取正确率显示文本
const getAccuracyText = (record) => {
  if (record.rightCount === null) return '未作答'
  return `${getAccuracy(record)}%`
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

// 筛选/排序触发（不变）
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

// 查看详情
const viewDetail = async (record) => {
  // 显示加载动画
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '加载练习详情中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    // 调用接口获取练习详情
    const data = await getPracticeDetailedResult(record.id)
    
    if (data) {
      currentDetail.value = response.data.data
      subjectPage.value = 1 // 重置题目分页
      detailDialogVisible.value = true
    } else {
      ElMessage.error(response.data?.msg || '获取练习详情失败')
    }
  } catch (error) {
    console.error('获取练习详情失败:', error)
    ElMessage.error('获取练习详情失败')
  } finally {
    loadingInstance.close()
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

/* 练习详情 */
.practice-detail {
  padding: 8px 0;
}

.subject-list {
  margin-top: 20px;
}

.subject-item {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.subject-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.subject-number {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.subject-content {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.subject-answer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.answer-label {
  color: #909399;
  font-size: 14px;
}

/* 题目分页 */
.subject-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
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

  .type-stats {
    flex-wrap: wrap;
  }
  
  .subject-answer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
