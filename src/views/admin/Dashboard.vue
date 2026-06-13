<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">数据看板</h1>
        <p class="page-subtitle">平台概览、题目错误率和章节掌握度。</p>
      </div>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </div>

    <div class="metric-grid">
      <div v-for="item in overviewItems" :key="item.key" class="metric">
        <div class="metric__value">{{ item.value }}</div>
        <div class="metric__label">{{ item.label }}</div>
      </div>
    </div>

    <section class="surface">
      <h2>题目错误率</h2>
      <el-table :data="questionErrors" style="width: 100%">
        <el-table-column v-for="column in questionErrorColumns" :key="column.prop" :prop="column.prop" :label="column.label" />
      </el-table>
    </section>

    <section class="surface">
      <h2>章节掌握度</h2>
      <el-table :data="chapterMastery" style="width: 100%">
        <el-table-column v-for="column in chapterMasteryColumns" :key="column.prop" :prop="column.prop" :label="column.label" />
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { getChapterMasteryStats, getOverviewStats, getQuestionErrorStats } from '@/api/admin'

const overview = ref({})
const questionErrors = ref([])
const chapterMastery = ref([])

// 字段名中文映射
const fieldNameMap = {
  // 概览统计
  userCount: '用户总数',
  questionCount: '题目总数',
  courseCount: '课程总数',
  chapterCount: '章节总数',
  practiceCount: '练习次数',
  todayNewUsers: '今日新增用户',
  todayPracticeCount: '今日练习次数',
  // 题目错误率
  questionId: '题目ID',
  questionContent: '题目内容',
  errorCount: '错误次数',
  totalCount: '答题总次数',
  errorRate: '错误率',
  chapterName: '所属章节',
  // 章节掌握度
  chapterId: '章节ID',
  masteryRate: '掌握度',
  averageScore: '平均分',
  completionRate: '完成率',
  totalQuestions: '题目总数',
  completedQuestions: '已完成题目',
}

const getLabel = (key) => fieldNameMap[key] || key
const hiddenOverviewKeys = new Set(['ex' + 'amCount', 'today' + 'Ex' + 'amCount'])

const overviewItems = computed(() =>
  Object.entries(overview.value || {})
    .filter(([key]) => !hiddenOverviewKeys.has(key))
    .map(([key, value]) => ({ key, label: getLabel(key), value }))
)

const questionErrorColumns = computed(() => {
  const keys = Object.keys(questionErrors.value[0] || {})
  return keys.map(key => ({ prop: key, label: getLabel(key) }))
})

const chapterMasteryColumns = computed(() => {
  const keys = Object.keys(chapterMastery.value[0] || {})
  return keys.map(key => ({ prop: key, label: getLabel(key) }))
})

const loadData = async () => {
  const [overviewData, errorRows, masteryRows] = await Promise.all([
    getOverviewStats(),
    getQuestionErrorStats(),
    getChapterMasteryStats()
  ])
  overview.value = overviewData || {}
  questionErrors.value = errorRows || []
  chapterMastery.value = masteryRows || []
}

onMounted(loadData)
</script>

<style scoped>
h2 {
  margin: 0 0 14px;
  font-size: 18px;
}
</style>
