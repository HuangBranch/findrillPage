<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">学习中心</h1>
        <p class="page-subtitle">从后端可用考试配置中进入练习、考试和错题复习。</p>
      </div>
      <div class="toolbar">
        <el-select v-model="mode" placeholder="模式" clearable style="width: 150px" @change="loadData">
          <el-option v-for="item in EXAM_MODES" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric">
        <div class="metric__value">{{ configs.length }}</div>
        <div class="metric__label">可用配置</div>
      </div>
      <div class="metric">
        <div class="metric__value">{{ courseCards.length }}</div>
        <div class="metric__label">覆盖课程</div>
      </div>
      <div class="metric">
        <div class="metric__value">{{ progress.length }}</div>
        <div class="metric__label">学习进度</div>
      </div>
    </div>

    <section class="surface">
      <el-skeleton :loading="loading" animated :rows="5">
        <el-empty v-if="!courseCards.length" description="暂无可用课程" />
        <div v-else class="card-grid">
          <el-card v-for="course in courseCards" :key="course.id" shadow="never">
            <template #header>
              <div class="course-card__header">
                <strong>{{ course.name }}</strong>
                <el-tag>{{ course.configs.length }} 个配置</el-tag>
              </div>
            </template>
            <div class="course-card__body">
              <p>{{ course.remarks || `课程 ID：${course.id}` }}</p>
              <el-progress :percentage="progressPercent(course.id)" />
            </div>
            <template #footer>
              <div class="toolbar">
                <el-button type="primary" @click="router.push(`/courses/${course.id}/chapters`)">查看章节</el-button>
                <el-button :disabled="!course.configs.length" @click="startFirst(course.configs)">开始</el-button>
              </div>
            </template>
          </el-card>
        </div>
      </el-skeleton>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import { listExamConfigs, startExam } from '@/api/exam'
import { listChapterProgress } from '@/api/learning'
import { getCourseList } from '@/api/course'
import { EXAM_MODES } from '@/utils/dictionaries'

const router = useRouter()
const loading = ref(false)
const mode = ref()
const configs = ref([])
const progress = ref([])
const courses = ref([])

const normalizeRows = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.records)) return value.records
  if (Array.isArray(value?.rows)) return value.rows
  if (Array.isArray(value?.list)) return value.list
  return []
}

const courseKey = (value) => String(value ?? '')

const configsByCourseId = computed(() => {
  const map = new Map()
  configs.value.forEach((item) => {
    const courseId = item.curriculumId || item.courseId
    if (!courseId) return
    const key = courseKey(courseId)
    const list = map.get(key) || []
    list.push(item)
    map.set(key, list)
  })
  return map
})

const courseCards = computed(() =>
  courses.value
    .filter((course) => course.isUse !== false && course.enabled !== false)
    .map((course) => ({
      ...course,
      configs: configsByCourseId.value.get(courseKey(course.id)) || []
    }))
)

const progressPercent = (curriculumId) => {
  const key = courseKey(curriculumId)
  const rows = progress.value.filter((item) => courseKey(item.curriculumId || item.courseId) === key)
  const total = rows.reduce((sum, item) => sum + Number(item.totalQuestion || 0), 0)
  const done = rows.reduce((sum, item) => sum + Number(item.practicedQuestion || 0), 0)
  return total ? Math.round((done / total) * 100) : 0
}

const startFirst = async (items) => {
  const target = items[0]
  if (!target) return
  const attempt = await startExam({ configId: target.id, practiceMode: 1 })
  const attemptId = attempt?.id || attempt?.attemptId
  if (!attemptId) {
    throw new Error('启动作答失败：后端未返回作答 ID')
  }
  await router.push({ name: 'AttemptWorkspace', params: { attemptId } })
}

const loadData = async () => {
  loading.value = true
  try {
    const [courseRows, configRows, progressRows] = await Promise.all([
      getCourseList({ enabled: true }),
      listExamConfigs({ mode: mode.value }),
      listChapterProgress()
    ])
    courses.value = normalizeRows(courseRows)
    configs.value = normalizeRows(configRows)
    progress.value = normalizeRows(progressRows)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.course-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.course-card__body {
  display: grid;
  gap: 10px;
  color: #64748b;
}
</style>
