<template>
  <AttemptWorkspace
    v-if="route.params.attemptId"
    result-route-name="PracticeResult"
  />

  <div v-else class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">自主练习</h1>
        <p class="page-subtitle">按课程、章节或错题范围直接开始刷题。</p>
      </div>
      <el-button :icon="Refresh" @click="loadCourses">刷新课程</el-button>
    </div>

    <section class="surface">
      <el-form class="practice-form" label-position="top">
        <el-form-item label="练习来源">
          <el-radio-group v-model="form.sourceType">
            <el-radio-button v-for="item in PRACTICE_SOURCE_TYPES" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <div class="form-grid">
          <el-form-item label="课程">
            <el-select
              v-model="form.curriculumId"
              placeholder="选择课程"
              clearable
              filterable
              :loading="loadingCourses"
              @change="handleCourseChange"
            >
              <el-option v-for="course in courses" :key="course.id" :label="course.name || `课程 #${course.id}`" :value="course.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="章节">
            <el-select
              v-model="form.chapterId"
              placeholder="全部章节"
              clearable
              filterable
              :disabled="!form.curriculumId"
              :loading="loadingChapters"
            >
              <el-option v-for="chapter in chapters" :key="chapter.id" :label="chapter.name || `章节 #${chapter.id}`" :value="chapter.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="出题顺序">
            <el-radio-group v-model="form.orderType">
              <el-radio-button v-for="item in PRACTICE_ORDER_TYPES" :key="item.value" :value="item.value">
                {{ item.label }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>

        </div>

        <el-collapse v-model="filterPanels" class="filter-collapse">
          <el-collapse-item name="questionTypes">
            <template #title>
              <span class="collapse-title">
                题型筛选
                <el-tag v-if="form.questionTypes.length" size="small" type="primary">
                  已选 {{ form.questionTypes.length }}
                </el-tag>
              </span>
            </template>
            <el-checkbox-group v-model="form.questionTypes" class="question-type-group">
              <el-checkbox-button v-for="item in QUESTION_TYPES" :key="item.value" :value="item.value">
                {{ item.label }}
              </el-checkbox-button>
            </el-checkbox-group>
          </el-collapse-item>
        </el-collapse>

        <div class="form-actions">
          <el-button @click="resetOptional">清空筛选</el-button>
          <el-button type="primary" :loading="starting" @click="start">开始练习</el-button>
        </div>
      </el-form>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import AttemptWorkspace from '@/components/AttemptWorkspace.vue'
import { getChapterList } from '@/api/chapter'
import { getCourseList } from '@/api/course'
import { startPractice } from '@/api/practice'
import { PRACTICE_ORDER_TYPES, PRACTICE_SOURCE_TYPES, QUESTION_TYPES } from '@/utils/dictionaries'

const props = defineProps({
  defaultSourceType: {
    type: Number,
    default: 1
  }
})

const route = useRoute()
const router = useRouter()

const courses = ref([])
const chapters = ref([])
const loadingCourses = ref(false)
const loadingChapters = ref(false)
const starting = ref(false)
const filterPanels = ref([])

const form = reactive({
  curriculumId: undefined,
  chapterId: undefined,
  sourceType: props.defaultSourceType,
  orderType: 1,
  questionTypes: []
})

const normalizeRows = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.records)) return value.records
  if (Array.isArray(value?.rows)) return value.rows
  if (Array.isArray(value?.list)) return value.list
  return []
}

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined
  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? undefined : numberValue
}

const normalizeSourceType = (value, fallback = props.defaultSourceType) => {
  const fallbackSourceType = toNumber(fallback)
  const normalizedFallback = fallbackSourceType === 1 || fallbackSourceType === 2 ? fallbackSourceType : 1
  const sourceType = toNumber(value)
  return sourceType === 1 || sourceType === 2 ? sourceType : normalizedFallback
}

const getAttemptId = (data) => data?.id || data?.attemptId

const loadCourses = async () => {
  loadingCourses.value = true
  try {
    courses.value = normalizeRows(await getCourseList({ enabled: true }))
  } finally {
    loadingCourses.value = false
  }
}

const loadChapters = async () => {
  if (!form.curriculumId) {
    chapters.value = []
    form.chapterId = undefined
    return
  }
  loadingChapters.value = true
  try {
    chapters.value = normalizeRows(await getChapterList(form.curriculumId, { silent: true }))
  } catch {
    chapters.value = []
  } finally {
    loadingChapters.value = false
  }
}

const handleCourseChange = async () => {
  form.chapterId = undefined
  await loadChapters()
}

const buildPayload = () => {
  const payload = {
    sourceType: form.sourceType,
    orderType: form.orderType,
    questionTypes: [...form.questionTypes]
  }

  if (form.curriculumId) payload.curriculumId = form.curriculumId
  if (form.chapterId) payload.chapterId = form.chapterId

  return payload
}

const start = async () => {
  if (form.sourceType === 1 && !form.curriculumId) {
    ElMessage.warning('章节题库练习需要先选择课程')
    return
  }

  starting.value = true
  try {
    const data = await startPractice(buildPayload())
    const attemptId = getAttemptId(data)
    if (!attemptId) {
      throw new Error('启动练习失败：后端未返回作答 ID')
    }
    await router.push({ name: 'PracticeAttempt', params: { attemptId } })
  } finally {
    starting.value = false
  }
}

const resetOptional = () => {
  form.curriculumId = undefined
  form.chapterId = undefined
  form.questionTypes = []
  chapters.value = []
}

watch(
  () => props.defaultSourceType,
  (value) => {
    if (!route.query.sourceType) form.sourceType = normalizeSourceType(value)
  }
)

watch(
  () => route.query,
  async (query) => {
    if (route.params.attemptId) return
    form.sourceType = normalizeSourceType(query.sourceType)
    form.curriculumId = toNumber(query.curriculumId)
    form.chapterId = toNumber(query.chapterId)
    form.orderType = toNumber(query.orderType) || 1
    await loadChapters()
  }
)

onMounted(async () => {
  form.sourceType = normalizeSourceType(route.query.sourceType)
  form.curriculumId = toNumber(route.query.curriculumId)
  form.chapterId = toNumber(route.query.chapterId)
  form.orderType = toNumber(route.query.orderType) || 1

  await loadCourses()
  await loadChapters()
})
</script>

<style scoped>
.practice-form {
  display: grid;
  gap: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
}

.question-type-group,
.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.form-actions {
  justify-content: flex-end;
}

.filter-collapse {
  border-top: 0;
}

.filter-collapse :deep(.el-collapse-item__header) {
  min-height: 44px;
  line-height: 1.4;
}

.collapse-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .page-header :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }

  .question-type-group :deep(.el-checkbox-button),
  .practice-form :deep(.el-radio-button) {
    flex: 1 1 calc(50% - 10px);
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-actions .el-button {
    flex: 1;
    margin-left: 0;
  }
}
</style>
