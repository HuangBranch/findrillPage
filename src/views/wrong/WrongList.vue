<template>
  <div class="page">
    <section class="surface">
      <div class="toolbar filter-toolbar">
        <el-select
          v-model="filters.curriculumId"
          clearable
          filterable
          placeholder="课程"
          :loading="loadingCourses"
          style="width: 180px"
          @change="handleCourseChange"
        >
          <el-option
            v-for="course in courses"
            :key="optionId(course)"
            :label="course.name || `课程 #${optionId(course)}`"
            :value="optionId(course)"
          />
        </el-select>

        <el-select
          v-model="filters.chapterId"
          clearable
          filterable
          placeholder="章节"
          :disabled="!filters.curriculumId"
          :loading="loadingChapters"
          style="width: 180px"
        >
          <el-option
            v-for="chapter in chapters"
            :key="optionId(chapter)"
            :label="chapter.name || `章节 #${optionId(chapter)}`"
            :value="optionId(chapter)"
          />
        </el-select>

        <el-button :icon="Search" type="primary" @click="search">查询</el-button>
        <el-button :icon="Refresh" @click="resetFilters">重置</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="wrongRows"
        class="wrong-table"
        style="width: 100%"
        :row-key="rowKey"
      >
        <el-table-column type="expand" width="48">
          <template #default="{ row }">
            <div class="wrong-detail">
              <section v-if="questionOptions(row).length" class="detail-section">
                <h3>选项</h3>
                <ol class="option-list">
                  <li v-for="(option, index) in questionOptions(row)" :key="option.optionKey || index">
                    <span class="detail-key">{{ option.optionKey || String.fromCharCode(65 + index) }}</span>
                    <div class="html-content detail-html" v-html="optionContent(option)"></div>
                  </li>
                </ol>
              </section>

              <section v-if="questionAnswers(row).length" class="detail-section">
                <h3>答案</h3>
                <div class="answer-list">
                  <div v-for="(answer, index) in questionAnswers(row)" :key="index" class="answer-item">
                    <span v-if="answerLabel(answer)" class="detail-key">{{ answerLabel(answer) }}</span>
                    <div class="html-content detail-html" v-html="answerContent(answer)"></div>
                  </div>
                </div>
              </section>

              <section v-if="questionAnalysis(row)" class="detail-section">
                <h3>解析</h3>
                <div class="html-content detail-html" v-html="questionAnalysis(row)"></div>
              </section>

              <el-empty
                v-if="!questionOptions(row).length && !questionAnswers(row).length && !questionAnalysis(row)"
                description="暂无详情"
                :image-size="64"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="题干" min-width="320">
          <template #default="{ row }">
            <div v-if="questionStem(row)" class="html-content wrong-question-stem" v-html="questionStem(row)"></div>
            <span v-else class="muted-text">题目 #{{ questionId(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="错误次数" width="96">
          <template #default="{ row }">{{ Number(row.wrongCount || 0) }}</template>
        </el-table-column>
        <el-table-column label="正确次数" width="96">
          <template #default="{ row }">{{ Number(row.rightCount || 0) }}</template>
        </el-table-column>
        <el-table-column label="最近错误时间" min-width="160">
          <template #default="{ row }">{{ formatDateTime(row.lastWrongTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button :icon="Delete" link type="danger" @click="remove(row)">移除</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无错题" />
        </template>
      </el-table>

      <div ref="loadMoreTrigger" class="load-more-trigger" aria-hidden="true"></div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { Delete, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getChapterList } from '@/api/chapter'
import { getCourseList } from '@/api/course'
import { listWrongQuestions, removeWrongQuestion } from '@/api/learning'
import { formatDateTime, safeJsonParse } from '@/utils/helpers'

const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const wrongRows = ref([])

const filters = reactive({
  curriculumId: undefined,
  chapterId: undefined
})

const courses = ref([])
const chapters = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const loadingCourses = ref(false)
const loadingChapters = ref(false)
const loadMoreTrigger = ref()
let requestSeq = 0
let observer

const hasMore = computed(() => page.value * pageSize.value < total.value)

const optionId = (item) => item?.id ?? item?.curriculumId ?? item?.chapterId

const normalizeRows = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.records)) return value.records
  if (Array.isArray(value?.rows)) return value.rows
  if (Array.isArray(value?.list)) return value.list
  return []
}

const firstPresent = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '')

const questionId = (row) => row.questionId ?? row.question?.id ?? row.id

const rowKey = (row) => questionId(row) ?? row.__clientKey

const questionStem = (row) =>
  row.stemHtml ||
  row.question?.stemHtml ||
  row.questionStemHtml ||
  row.questionContentHtml ||
  row.questionContent ||
  row.stem ||
  row.content ||
  ''

const questionAnalysis = (row) =>
  row.analysisHtml ||
  row.question?.analysisHtml ||
  row.questionAnalysisHtml ||
  row.analysis ||
  row.question?.analysis ||
  ''

const normalizeOptions = (value) => {
  const parsed = safeJsonParse(value, value)
  if (Array.isArray(parsed)) {
    return [...parsed].sort((a, b) => Number(a?.sort ?? 0) - Number(b?.sort ?? 0))
  }
  if (parsed && typeof parsed === 'object') {
    return Object.entries(parsed).map(([key, contentHtml], index) => ({
      optionKey: key,
      contentHtml,
      sort: index
    }))
  }
  return []
}

const normalizeAnswers = (value) => {
  const parsed = safeJsonParse(value, value)
  if (Array.isArray(parsed)) return parsed
  if (parsed === undefined || parsed === null || parsed === '') return []
  return [parsed]
}

const questionOptions = (row) =>
  normalizeOptions(
    firstPresent(
      row.options,
      row.question?.options,
      row.optionList,
      row.question?.optionList,
      row.optionsJson,
      row.question?.optionsJson
    )
  )

const questionAnswers = (row) =>
  normalizeAnswers(
    firstPresent(
      row.answers,
      row.question?.answers,
      row.answerList,
      row.question?.answerList,
      row.answersJson,
      row.question?.answersJson,
      row.answerJson,
      row.question?.answerJson,
      row.answer,
      row.correctAnswer
    )
  )

const optionContent = (option) => {
  if (option === undefined || option === null) return ''
  if (typeof option !== 'object') return String(option)
  return String(firstPresent(option.contentHtml, option.content, option.label, option.optionValue, option.value, ''))
}

const answerContent = (answer) => {
  if (answer === undefined || answer === null) return ''
  if (typeof answer !== 'object') return String(answer)
  return String(firstPresent(answer.answerHtml, answer.contentHtml, answer.answerValue, answer.value, answer.content, ''))
}

const answerLabel = (answer) => {
  if (!answer || typeof answer !== 'object') return ''
  if (answer.blankIndex) return `第 ${answer.blankIndex} 空`
  if (answer.answerGroup && answer.answerGroup !== 1) return `分组 ${answer.answerGroup}`
  return ''
}

const withLoadedPage = (rows, loadedPage) =>
  rows.map((row, index) => ({
    ...row,
    __loadedPage: loadedPage,
    __clientKey: `${questionId(row) ?? 'row'}-${loadedPage}-${index}`
  }))

const buildWrongQuestionParams = () => ({
  page: page.value,
  pageSize: pageSize.value,
  curriculumId: filters.curriculumId,
  chapterId: filters.chapterId
})

const loadCourses = async () => {
  loadingCourses.value = true
  try {
    courses.value = normalizeRows(await getCourseList({ enabled: true }, { silent: true }))
  } finally {
    loadingCourses.value = false
  }
}

const loadChapters = async () => {
  if (!filters.curriculumId) {
    chapters.value = []
    return
  }
  loadingChapters.value = true
  try {
    chapters.value = normalizeRows(await getChapterList(filters.curriculumId, { silent: true }))
  } catch {
    chapters.value = []
  } finally {
    loadingChapters.value = false
  }
}

const loadData = async ({ append = false } = {}) => {
  const currentSeq = ++requestSeq
  const loadedPage = page.value
  if (append) loadingMore.value = true
  else loading.value = true

  try {
    const res = await listWrongQuestions(buildWrongQuestionParams())
    if (currentSeq !== requestSeq) return

    const pageData = res?.data?.list ? res.data : res
    const rows = withLoadedPage(pageData?.list || [], loadedPage)
    wrongRows.value = append ? [...wrongRows.value, ...rows] : rows
    total.value = Number(pageData?.total || 0)
    page.value = Number(pageData?.page || page.value)
    pageSize.value = Number(pageData?.size || pageSize.value)
  } finally {
    if (currentSeq === requestSeq) {
      loading.value = false
      loadingMore.value = false
    }
  }
}

const search = () => {
  page.value = 1
  loadData()
}

const resetFilters = async () => {
  filters.curriculumId = undefined
  filters.chapterId = undefined
  chapters.value = []
  page.value = 1
  await loadData()
}

const handleCourseChange = async () => {
  filters.chapterId = undefined
  await loadChapters()
}

const loadNextPage = async () => {
  if (!hasMore.value || loading.value || loadingMore.value) return
  const previousPage = page.value
  page.value += 1
  try {
    await loadData({ append: true })
  } catch (error) {
    page.value = previousPage
    throw error
  }
}

const handleScroll = () => {
  if (!hasMore.value || loading.value || loadingMore.value) return
  const scrollElement = document.documentElement
  const distanceToBottom = scrollElement.scrollHeight - window.innerHeight - window.scrollY
  if (distanceToBottom <= 160) loadNextPage()
}

const observeLoadMore = () => {
  if (!loadMoreTrigger.value || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) loadNextPage()
  })
  observer.observe(loadMoreTrigger.value)
}

const remove = async (row) => {
  const id = questionId(row)
  if (!id) {
    ElMessage.warning('缺少题目 ID')
    return
  }

  const removedPage = row.__loadedPage || page.value
  const removedPageRows = wrongRows.value.filter((item) => item.__loadedPage === removedPage)
  await removeWrongQuestion(id)
  ElMessage.success('已移除错题')

  page.value = removedPage
  if (removedPageRows.length <= 1 && page.value > 1) {
    page.value -= 1
  }
  await loadData()
}

onMounted(async () => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  observeLoadMore()
  await Promise.all([loadCourses(), loadData()])
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  observer?.disconnect()
})
</script>

<style scoped>
.filter-toolbar {
  margin-bottom: 14px;
}

.wrong-table {
  min-height: 240px;
}

.wrong-question-stem {
  display: -webkit-box;
  max-height: 4.8em;
  overflow: hidden;
  color: #1f2937;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.wrong-detail {
  display: grid;
  gap: 14px;
  padding: 4px 8px 8px;
}

.detail-section {
  display: grid;
  gap: 8px;
}

.detail-section h3 {
  margin: 0;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

.option-list,
.answer-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.option-list li,
.answer-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: flex-start;
  min-width: 0;
}

.detail-key {
  min-width: 28px;
  color: #2563eb;
  font-weight: 700;
  line-height: 1.6;
}

.detail-html {
  min-width: 0;
  color: #334155;
  line-height: 1.6;
}

.muted-text {
  color: #94a3b8;
}

.load-more-trigger {
  width: 100%;
  height: 1px;
  overflow: hidden;
}

@media (max-width: 760px) {
  .wrong-question-stem {
    max-height: none;
    -webkit-line-clamp: 4;
  }

}
</style>
