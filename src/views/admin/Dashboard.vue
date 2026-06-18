<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">数据看板</h1>
        <p class="page-subtitle">平台概览、题目错误率和章节正确率。</p>
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
      <el-table :data="questionErrorRows" style="width: 100%">
        <el-table-column
          v-for="column in questionErrorColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :min-width="column.minWidth"
          :width="column.width"
          show-overflow-tooltip
        />
      </el-table>
    </section>

    <section class="surface">
      <h2>章节正确率</h2>
      <el-table :data="chapterAccuracyRows" style="width: 100%">
        <el-table-column
          v-for="column in chapterAccuracyColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :min-width="column.minWidth"
          :width="column.width"
          show-overflow-tooltip
        />
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { getChapterAccuracyStats, getOverviewStats, getQuestionErrorStats, listChapters, listCourses } from '@/api/admin'

const overview = ref({})
const questionErrors = ref([])
const chapterAccuracy = ref([])
const courses = ref([])
const chapters = ref([])

// 字段名中文映射
const fieldNameMap = {
  // 概览统计
  userCount: '用户总数',
  questionCount: '题目总数',
  courseCount: '课程总数',
  chapterCount: '章节总数',
  practiceCount: '练习次数',
  activeQuestionCount: '启用题目数',
  publishedQuestionCount: '已发布题目数',
  attemptCount: '作答次数',
  reportPendingCount: '待处理反馈数',
  averageEarnedScore: '平均得分',
  todayNewUsers: '今日新增用户',
  todayPracticeCount: '今日练习次数',
  // 题目错误率
  questionId: '题目编号',
  questionContent: '题目内容',
  courseName: '课程名称',
  curriculumName: '课程名称',
  errorCount: '错误次数',
  totalCount: '答题总次数',
  answerCount: '作答次数',
  wrongCount: '错误次数',
  rightCount: '正确次数',
  correctCount: '正确次数',
  errorRate: '错误率',
  chapterName: '章节名称',
  // 章节正确率
  chapterId: '章节编号',
  accuracyRate: '正确率',
  averageScore: '平均分',
  completionRate: '完成率',
  totalQuestions: '题目总数',
  completedQuestions: '已完成题目',
}

const fieldTokenMap = {
  active: '启用',
  published: '已发布',
  attempt: '作答',
  answer: '作答',
  wrong: '错误',
  right: '正确',
  correct: '正确',
  report: '反馈',
  pending: '待处理',
  average: '平均',
  earned: '得分',
  score: '分',
  user: '用户',
  curriculum: '课程',
  question: '题目',
  course: '课程',
  chapter: '章节',
  name: '名称',
  content: '内容',
  total: '总',
  today: '今日',
  new: '新增',
  accuracy: '正确',
  completion: '完成',
  practice: '练习',
  count: '数',
  rate: '率',
  id: '编号'
}

const buildFallbackLabel = (key) => {
  const parts = String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)

  if (!parts.length) return '数据字段'

  const translated = parts.map((part) => fieldTokenMap[part]).filter(Boolean)
  return translated.length === parts.length ? translated.join('') : '数据字段'
}

const getLabel = (key) => fieldNameMap[key] || buildFallbackLabel(key)
const hiddenOverviewKeys = new Set(['ex' + 'amCount', 'today' + 'Ex' + 'amCount'])
const questionErrorColumnOrder = [
  { prop: 'questionContent', minWidth: 320 },
  { prop: 'chapterName', minWidth: 180 },
  { prop: 'courseName', minWidth: 180 },
  { prop: 'answerCount', width: 120 },
  { prop: 'wrongCount', width: 120 },
  { prop: 'errorCount', width: 120 },
  { prop: 'totalCount', width: 130 },
  { prop: 'errorRate', width: 120 }
]
const chapterAccuracyColumnOrder = [
  { prop: 'curriculumName', minWidth: 180 },
  { prop: 'chapterName', minWidth: 180 },
  { prop: 'answerCount', width: 120 },
  { prop: 'rightCount', width: 120 },
  { prop: 'wrongCount', width: 120 },
  { prop: 'accuracyRate', width: 120 },
  { prop: 'averageScore', width: 120 },
  { prop: 'completionRate', width: 120 },
  { prop: 'totalQuestions', width: 120 },
  { prop: 'completedQuestions', width: 130 }
]

const courseMap = computed(() => new Map(courses.value.map((item) => [String(item.id), item])))
const chapterMap = computed(() => new Map(chapters.value.map((item) => [String(item.id), item])))

const formatEntityName = (type, id, name) => {
  if (name) return name
  if (id === undefined || id === null || id === '') return `${type}未命名`
  return `${type}（编号 ${id}）`
}

const getCourseName = (id) => formatEntityName('课程', id, courseMap.value.get(String(id))?.name)
const getChapterName = (id) => formatEntityName('章节', id, chapterMap.value.get(String(id))?.name)

const buildVisibleColumns = (rows, columns) =>
  columns
    .filter(({ prop }) => rows.some((row) => row?.[prop] !== undefined && row?.[prop] !== null && row?.[prop] !== ''))
    .map((column) => ({
      ...column,
      label: getLabel(column.prop)
    }))

const overviewItems = computed(() =>
  Object.entries(overview.value || {})
    .filter(([key]) => !hiddenOverviewKeys.has(key))
    .map(([key, value]) => ({ key, label: getLabel(key), value }))
)

const questionErrorRows = computed(() =>
  questionErrors.value.map((row) => {
    const chapter = chapterMap.value.get(String(row.chapterId))
    const curriculumId = row.curriculumId ?? row.courseId ?? chapter?.curriculumId

    return {
      ...row,
      questionContent: row.questionContent || row.content || row.title || formatEntityName('题目', row.questionId ?? row.id),
      chapterName: row.chapterName || chapter?.name || getChapterName(row.chapterId),
      courseName: row.courseName || row.curriculumName || getCourseName(curriculumId)
    }
  })
)

const questionErrorColumns = computed(() => buildVisibleColumns(questionErrorRows.value, questionErrorColumnOrder))

const chapterAccuracyRows = computed(() =>
  chapterAccuracy.value.map(({ masteryRate, ...row }) => {
    const chapter = chapterMap.value.get(String(row.chapterId))
    const curriculumId = row.curriculumId ?? row.courseId ?? chapter?.curriculumId

    return {
      ...row,
      curriculumName: row.curriculumName || row.courseName || getCourseName(curriculumId),
      chapterName: row.chapterName || chapter?.name || getChapterName(row.chapterId),
      accuracyRate: row.accuracyRate ?? masteryRate
    }
  })
)

const chapterAccuracyColumns = computed(() => buildVisibleColumns(chapterAccuracyRows.value, chapterAccuracyColumnOrder))

const loadData = async () => {
  const [overviewData, errorRows, accuracyRows, courseRows, chapterRows] = await Promise.all([
    getOverviewStats(),
    getQuestionErrorStats({ limit: 20 }),
    getChapterAccuracyStats({ limit: 20 }),
    listCourses(),
    listChapters()
  ])
  overview.value = overviewData || {}
  questionErrors.value = errorRows || []
  chapterAccuracy.value = accuracyRows || []
  courses.value = courseRows || []
  chapters.value = chapterRows || []
}

onMounted(loadData)
</script>

<style scoped>
h2 {
  margin: 0 0 14px;
  font-size: 18px;
}
</style>
