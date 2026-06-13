<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-subtitle">查看章节练习进度，并从该课程的可用配置开始作答。</p>
      </div>
      <el-button @click="router.push('/courses')">返回</el-button>
    </div>

    <section class="surface">
      <div class="toolbar">
        <el-button v-for="item in EXAM_MODES" :key="item.value" :type="mode === item.value ? 'primary' : 'default'" @click="mode = item.value">
          {{ item.label }}
        </el-button>
      </div>

      <el-table :data="filteredConfigs" style="width: 100%; margin-top: 14px">
        <el-table-column prop="name" label="配置名称" min-width="180" />
        <el-table-column label="模式" width="110">
          <template #default="{ row }">
            <el-tag :type="tagOf(EXAM_MODES, row.mode)">{{ labelOf(EXAM_MODES, row.mode) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="questionCount" label="题数" width="90" />
        <el-table-column prop="durationMinutes" label="限时(分钟)" width="120" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="start(row)">开始</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="surface">
      <h2 class="section-title">章节进度</h2>
      <el-empty v-if="!progress.length" description="暂无章节进度" />
      <div v-else class="card-grid">
        <el-card v-for="item in progress" :key="item.id || item.chapterId" shadow="never">
          <template #header>
            <strong>{{ chapterName(item.chapterId) }}</strong>
          </template>
          <div class="chapter-progress">
            <span>已练 {{ item.practicedQuestion || 0 }} / {{ item.totalQuestion || 0 }}</span>
            <span>掌握 {{ item.masteredQuestion || 0 }}</span>
            <span>错题 {{ item.wrongQuestion || 0 }}</span>
          </div>
          <el-progress :percentage="accuracy(item)" :status="accuracy(item) >= 80 ? 'success' : undefined" />
        </el-card>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listExamConfigs, startExam } from '@/api/exam'
import { listChapterProgress } from '@/api/learning'
import { getCourseList } from '@/api/course'
import { getChapterList } from '@/api/chapter'
import { EXAM_MODES, labelOf, tagOf } from '@/utils/dictionaries'

const route = useRoute()
const router = useRouter()
const curriculumId = computed(() => Number(route.params.courseId))
const mode = ref(1)
const configs = ref([])
const progress = ref([])
const courses = ref([])
const chapters = ref([])

const title = computed(() => courses.value.find((item) => item.id === curriculumId.value)?.name || `课程 #${curriculumId.value}`)

const filteredConfigs = computed(() => configs.value.filter((item) => item.mode === mode.value))

const chapterName = (id) => chapters.value.find((item) => item.id === id)?.name || `章节 #${id}`

const accuracy = (item) => {
  const value = Number(item.accuracyRate)
  if (!Number.isNaN(value) && value > 0 && value <= 1) return Math.round(value * 100)
  if (!Number.isNaN(value)) return Math.round(value)
  return 0
}

const start = async (config) => {
  const attempt = await startExam({ configId: config.id, practiceMode: 1 })
  router.push(`/attempt/${attempt.id}`)
}

const loadData = async () => {
  const [configRows, progressRows] = await Promise.all([
    listExamConfigs({ curriculumId: curriculumId.value }),
    listChapterProgress({ curriculumId: curriculumId.value })
  ])
  configs.value = configRows || []
  progress.value = progressRows || []
  try {
    const [courseRows, chapterRows] = await Promise.all([
      getCourseList({}, { silent: true }),
      getChapterList(curriculumId.value, { silent: true })
    ])
    courses.value = courseRows || []
    chapters.value = chapterRows || []
  } catch {
    courses.value = []
    chapters.value = []
  }
}

onMounted(loadData)
</script>

<style scoped>
.section-title {
  margin: 0 0 14px;
  font-size: 18px;
}

.chapter-progress {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
  color: #64748b;
}
</style>
