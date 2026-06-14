<template>
  <div class="page chapter-page">
    <section class="surface">
      <h2 class="section-title">章节题库</h2>
      <el-skeleton :loading="loading" animated :rows="5">
        <el-empty v-if="!chapterCards.length" description="暂无章节数据" />
        <div v-else class="card-grid">
          <el-card
            v-for="item in chapterCards"
            :key="item.id"
            class="chapter-card"
            :class="{ 'chapter-card--has-summary': item.remarks }"
            shadow="never"
          >
            <template #header>
              <div class="chapter-card__header">
                <strong>{{ item.name }}</strong>
              </div>
            </template>
            <div v-if="item.remarks" class="chapter-summary">{{ item.remarks }}</div>
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
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getChapterList } from '@/api/chapter'
import { getCourse } from '@/api/course'
import { startPractice } from '@/api/practice'

const route = useRoute()
const router = useRouter()
const curriculumId = computed(() => Number(route.params.courseId))
const loading = ref(false)
const startingId = ref()
const courses = ref([])
const chapters = ref([])
const setTopbarTitle = inject('setTopbarTitle', () => {})

const title = computed(() => courses.value.find((item) => item.id === curriculumId.value)?.name || `课程 #${curriculumId.value}`)

watch(title, (value) => setTopbarTitle(value), { immediate: true })

const normalizeRows = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.records)) return value.records
  if (Array.isArray(value?.rows)) return value.rows
  if (Array.isArray(value?.list)) return value.list
  return []
}

const chapterCards = computed(() => {
  return chapters.value.map((chapter) => ({
    ...chapter,
    id: chapter.id,
    name: chapter.name || `章节 #${chapter.id}`
  }))
})

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
    const [courseDetail, chapterRows] = await Promise.all([
      getCourse(curriculumId.value, { silent: true }),
      getChapterList(curriculumId.value, { silent: true })
    ])
    courses.value = courseDetail ? [courseDetail] : []
    chapters.value = normalizeRows(chapterRows)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

onUnmounted(() => {
  setTopbarTitle('')
})
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

.chapter-summary {
  color: #64748b;
  line-height: 1.6;
}

.chapter-card:not(.chapter-card--has-summary) :deep(.el-card__body) {
  display: none;
}

@media (max-width: 760px) {
  .chapter-summary {
    display: -webkit-box;
    max-height: 4.8em;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  :deep(.el-card__header) {
    padding: 10px 12px;
  }

  :deep(.el-card__body) {
    padding: 10px 12px;
  }

  :deep(.el-card__footer) {
    padding: 10px 12px;
  }

  :deep(.el-card__footer .toolbar) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  :deep(.el-card__footer .el-button) {
    min-height: 34px;
    margin-left: 0;
    padding: 8px 10px;
  }
}
</style>
