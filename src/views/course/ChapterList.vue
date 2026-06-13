<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-subtitle">查看章节练习进度，并直接开始章节题库自主练习。</p>
      </div>
    </div>

    <section class="surface">
      <h2 class="section-title">章节进度</h2>
      <el-skeleton :loading="loading" animated :rows="5">
        <el-empty v-if="!chapterCards.length" description="暂无章节数据" />
        <div v-else class="card-grid">
          <el-card v-for="item in chapterCards" :key="item.id" shadow="never">
            <template #header>
              <div class="chapter-card__header">
                <strong>{{ item.name }}</strong>
                <el-tag>{{ accuracy(item) }}%</el-tag>
              </div>
            </template>
            <div class="chapter-progress">
              <span>已练 {{ item.practicedQuestion || 0 }} / {{ item.totalQuestion || 0 }}</span>
              <span>掌握 {{ item.masteredQuestion || 0 }}</span>
              <span>错题 {{ item.wrongQuestion || 0 }}</span>
            </div>
            <el-progress :percentage="accuracy(item)" :status="accuracy(item) >= 80 ? 'success' : undefined" />
            <template #footer>
              <div class="toolbar">
                <el-button
                  type="primary"
                  :loading="startingId === item.id"
                  @click="startChapterPractice(item)"
                >
                  章节练习
                </el-button>
                <el-button @click="openPracticeForm(item)">筛选练习</el-button>
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
import { useRoute, useRouter } from 'vue-router'
import { getChapterList } from '@/api/chapter'
import { getCourseList } from '@/api/course'
import { listChapterProgress } from '@/api/learning'
import { startPractice } from '@/api/practice'

const route = useRoute()
const router = useRouter()
const curriculumId = computed(() => Number(route.params.courseId))
const loading = ref(false)
const startingId = ref()
const progress = ref([])
const courses = ref([])
const chapters = ref([])

const title = computed(() => courses.value.find((item) => item.id === curriculumId.value)?.name || `课程 #${curriculumId.value}`)

const normalizeRows = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.records)) return value.records
  if (Array.isArray(value?.rows)) return value.rows
  if (Array.isArray(value?.list)) return value.list
  return []
}

const chapterCards = computed(() => {
  const progressMap = new Map(progress.value.map((item) => [Number(item.chapterId), item]))
  if (chapters.value.length) {
    return chapters.value.map((chapter) => ({
      ...chapter,
      ...(progressMap.get(Number(chapter.id)) || {}),
      id: chapter.id,
      name: chapter.name || `章节 #${chapter.id}`
    }))
  }

  return progress.value.map((item) => ({
    ...item,
    id: item.chapterId,
    name: `章节 #${item.chapterId}`
  }))
})

const accuracy = (item) => {
  const value = Number(item.accuracyRate)
  if (!Number.isNaN(value) && value > 0 && value <= 1) return Math.round(value * 100)
  if (!Number.isNaN(value)) return Math.round(value)
  return 0
}

const getAttemptId = (data) => data?.id || data?.attemptId

const startWithPayload = async (payload, loadingKey) => {
  startingId.value = loadingKey
  try {
    const attempt = await startPractice({
      sourceType: 1,
      orderType: 1,
      questionTypes: [],
      ...payload
    })
    const attemptId = getAttemptId(attempt)
    if (!attemptId) {
      throw new Error('启动练习失败：后端未返回作答 ID')
    }
    await router.push({ name: 'PracticeAttempt', params: { attemptId } })
  } finally {
    startingId.value = undefined
  }
}

const startChapterPractice = (chapter) =>
  startWithPayload({ curriculumId: curriculumId.value, chapterId: chapter.id }, chapter.id)

const openPracticeForm = (chapter) =>
  router.push({
    name: 'Practice',
    query: {
      sourceType: 1,
      curriculumId: curriculumId.value,
      chapterId: chapter.id
    }
  })

const loadData = async () => {
  loading.value = true
  try {
    const [progressRows, courseRows, chapterRows] = await Promise.all([
      listChapterProgress({ curriculumId: curriculumId.value }),
      getCourseList({}, { silent: true }),
      getChapterList(curriculumId.value, { silent: true })
    ])
    progress.value = normalizeRows(progressRows)
    courses.value = normalizeRows(courseRows)
    chapters.value = normalizeRows(chapterRows)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.section-title {
  margin: 0 0 14px;
  font-size: 18px;
}

.chapter-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.chapter-progress {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
  color: #64748b;
}
</style>
