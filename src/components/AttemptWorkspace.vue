<template>
  <div class="page attempt-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ pageTitle }}</h1>
        <p class="page-subtitle">{{ attempt ? attempt.name : emptySubtitle }}</p>
      </div>
      <div class="toolbar">
        <el-tag v-if="attempt" :type="attempt.status === 1 ? 'warning' : 'success'">
          {{ attempt.status === 1 ? '进行中' : '已提交' }}
        </el-tag>
        <el-tag v-if="remainingText && attempt?.status === 1" type="danger">{{ remainingText }}</el-tag>
      </div>
    </div>

    <section v-if="!attempt" class="surface">
      <el-skeleton :loading="true" animated :rows="4">
        <el-empty description="正在加载练习" />
      </el-skeleton>
    </section>

    <template v-else>
      <section class="surface attempt-controls">
        <el-button @click="answerCardVisible = true">答题卡 {{ answeredCount }}/{{ questions.length }}</el-button>
        <el-button v-if="attempt.status === 1" type="primary" @click="submit">
          提交
        </el-button>
        <el-button v-else @click="goResult(attempt)">
          查看结果
        </el-button>
      </section>

      <section class="surface answer-layout">
        <article
          v-if="currentQuestion"
          class="question-panel"
          @touchstart.passive="handleTouchStart"
          @touchend.passive="handleTouchEnd"
        >
          <div class="question-meta">
            <el-tag>{{ labelOf(QUESTION_TYPES, currentQuestion.type) }}</el-tag>
            <span>第 {{ currentIndex + 1 }} / {{ questions.length }} 题</span>
            <span>{{ currentQuestion.questionScore || 0 }} 分</span>
          </div>

          <div class="html-content question-stem" v-html="currentQuestion.stemHtml"></div>

          <div class="answer-input">
            <el-radio-group
              v-if="[1, 3].includes(currentQuestion.type)"
              v-model="singleAnswer"
              :disabled="attempt.status !== 1"
              @change="updateSingle"
            >
              <el-radio v-for="option in currentOptions" :key="option.optionKey" :value="option.optionKey" border>
                <span class="option-key">{{ option.optionKey }}</span>
                <span class="html-content" v-html="option.contentHtml"></span>
              </el-radio>
            </el-radio-group>

            <el-checkbox-group
              v-else-if="currentQuestion.type === 2"
              v-model="multiAnswer"
              :disabled="attempt.status !== 1"
              @change="updateMulti"
            >
              <el-checkbox v-for="option in currentOptions" :key="option.optionKey" :value="option.optionKey" border>
                <span class="option-key">{{ option.optionKey }}</span>
                <span class="html-content" v-html="option.contentHtml"></span>
              </el-checkbox>
            </el-checkbox-group>

            <div v-else-if="currentQuestion.type === 4" class="blank-list">
              <el-input
                v-for="(_, index) in blankAnswer"
                :key="index"
                v-model="blankAnswer[index]"
                :disabled="attempt.status !== 1"
                :placeholder="`第 ${index + 1} 空`"
                @change="updateBlank"
              />
              <el-button v-if="attempt.status === 1" @click="blankAnswer.push('')">增加空位</el-button>
            </div>

            <el-input
              v-else
              v-model="textAnswer"
              type="textarea"
              :rows="6"
              :disabled="attempt.status !== 1"
              placeholder="请输入答案"
              @change="updateText"
            />
          </div>

          <section v-if="currentAnswerResult" class="practice-answer-result">
            <div class="practice-answer-result__head">
              <el-tag :type="answerResultType(currentAnswerResult)" effect="dark">
                {{ answerResultText(currentAnswerResult) }}
              </el-tag>
              <span v-if="currentAnswerResult.earnedScore !== null && currentAnswerResult.earnedScore !== undefined">
                得分 {{ currentAnswerResult.earnedScore }}
              </span>
            </div>

            <div class="answer-detail-grid">
              <div>
                <strong>用户答案</strong>
                <p>{{ displayUserAnswer(currentAnswerResult) }}</p>
              </div>
              <div>
                <strong>正确答案</strong>
                <p>{{ displayCorrectAnswer(currentAnswerResult) }}</p>
              </div>
            </div>

            <div v-if="currentAnswerResult.analysisHtml" class="analysis-block">
              <strong>解析</strong>
              <div class="html-content" v-html="currentAnswerResult.analysisHtml"></div>
            </div>
          </section>

          <div class="question-actions">
            <el-button @click="openNote">笔记</el-button>
            <el-button @click="reportVisible = true">反馈</el-button>
          </div>
        </article>
      </section>
    </template>

    <el-drawer v-model="answerCardVisible" title="答题卡" size="min(420px, 92%)">
      <div class="answer-card">
        <div class="answer-card__head">
          <strong>作答进度</strong>
          <span>{{ answeredCount }}/{{ questions.length }}</span>
        </div>
        <div class="answer-card__grid">
          <button
            v-for="(question, index) in questions"
            :key="questionAttemptId(question)"
            type="button"
            :class="answerCardClass(question, index)"
            @click="selectQuestion(index)"
          >
            {{ index + 1 }}
          </button>
        </div>
      </div>
    </el-drawer>

    <el-drawer v-model="noteVisible" title="题目笔记" size="min(420px, 92%)">
      <el-input v-model="noteContent" type="textarea" :rows="8" placeholder="记录自己的思路或易错点" />
      <template #footer>
        <el-button @click="deleteCurrentNote">删除</el-button>
        <el-button type="primary" @click="saveCurrentNote">保存</el-button>
      </template>
    </el-drawer>

    <el-dialog v-model="reportVisible" title="题目反馈" width="min(460px, 92%)">
      <el-form label-position="top">
        <el-form-item label="问题类型">
          <el-select v-model="reportForm.reason" style="width: 100%">
            <el-option v-for="item in REPORT_REASONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="reportForm.description" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReport">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPracticeAttempt,
  savePracticeAnswer,
  submitPractice
} from '@/api/practice'
import { createQuestionReport, deleteNote, getNote, saveNote } from '@/api/learning'
import { QUESTION_TYPES, REPORT_REASONS, labelOf } from '@/utils/dictionaries'
import { formatDuration, parseAnswerArray, parseOptions, safeJsonParse } from '@/utils/helpers'

const props = defineProps({
  title: {
    type: String,
    default: '答题'
  },
  resultRouteName: {
    type: String,
    default: 'PracticeResult'
  },
  emptySubtitle: {
    type: String,
    default: '选择一个可用配置开始作答。'
  }
})

const route = useRoute()
const router = useRouter()

const attempt = ref(null)
const currentIndex = ref(0)
const answers = reactive({})
const answerResults = reactive({})
const saveVersions = reactive({})
const saving = ref(false)
const pendingSaveCount = ref(0)
const now = ref(Date.now())
const answerCardVisible = ref(false)
const touchStartX = ref(0)
const touchStartY = ref(0)
const noteVisible = ref(false)
const noteContent = ref('')
const reportVisible = ref(false)
const reportForm = reactive({ reason: 1, description: '' })

let timer

const pageTitle = computed(() => props.title)
const questions = computed(() => attempt.value?.questions || [])
const currentQuestion = computed(() => questions.value[currentIndex.value])
const currentOptions = computed(() => parseOptions(currentQuestion.value?.optionsJson))
const answeredCount = computed(() => Object.values(answers).filter((item) => item?.length).length)
const remainingText = computed(() => {
  if (!attempt.value?.deadlineTime) return ''
  const remain = Math.max(0, Math.floor((new Date(attempt.value.deadlineTime).getTime() - now.value) / 1000))
  return `剩余 ${formatDuration(remain)}`
})

const currentAnswer = computed(() => answers[questionAttemptId(currentQuestion.value)] || [])
const currentAnswerResult = computed(() => answerResults[questionAttemptId(currentQuestion.value)])
const singleAnswer = ref('')
const multiAnswer = ref([])
const blankAnswer = ref([''])
const textAnswer = ref('')

const getAttemptId = (data) => data?.id || data?.attemptId
const questionAttemptId = (question) => question?.attemptQuestionId || question?.id

const setSaving = (delta) => {
  pendingSaveCount.value = Math.max(0, pendingSaveCount.value + delta)
  saving.value = pendingSaveCount.value > 0
}

const normalizeAnswerResult = (result, question) => {
  if (!result && !question?.answer) return null
  const answer = question?.answer || {}
  return {
    ...answer,
    ...result,
    attemptQuestionId: result?.attemptQuestionId ?? answer.attemptQuestionId ?? questionAttemptId(question),
    questionId: result?.questionId ?? answer.questionId ?? question?.questionId,
    userAnswerJson: result?.userAnswerJson ?? answer.userAnswerJson,
    answersJson: result?.answersJson ?? answer.answersJson ?? question?.answersJson,
    analysisHtml: result?.analysisHtml ?? answer.analysisHtml ?? question?.analysisHtml,
    judgeStatus: result?.judgeStatus ?? answer.judgeStatus,
    isCorrect: result?.isCorrect ?? answer.isCorrect,
    earnedScore: result?.earnedScore ?? answer.earnedScore
  }
}

const answerValueText = (value) => {
  if (Array.isArray(value)) {
    return value.map(answerValueText).filter(Boolean).join('，')
  }
  if (value && typeof value === 'object') {
    return value.answerValue ?? value.value ?? value.optionKey ?? value.content ?? JSON.stringify(value)
  }
  return value === null || value === undefined || value === '' ? '' : String(value)
}

const displayAnswerJson = (value) => {
  const parsed = safeJsonParse(value, value)
  const text = answerValueText(parsed)
  return text || '未作答'
}

const displayUserAnswer = (result) => displayAnswerJson(result?.userAnswerJson ?? currentAnswer.value)
const displayCorrectAnswer = (result) => displayAnswerJson(result?.answersJson)

const answerResultType = (result) => {
  if (result?.isCorrect === true) return 'success'
  if (result?.isCorrect === false) return 'danger'
  return 'warning'
}

const answerResultText = (result) => {
  if (result?.isCorrect === true) return '回答正确'
  if (result?.isCorrect === false) return '回答错误'
  return '待判定'
}

const answerCardClass = (question, index) => {
  const id = questionAttemptId(question)
  const result = answerResults[id]
  return {
    active: index === currentIndex.value,
    done: answers[id]?.length,
    correct: result?.isCorrect === true,
    wrong: result?.isCorrect === false
  }
}

const selectQuestion = (index) => {
  currentIndex.value = index
  answerCardVisible.value = false
}

const goNextQuestion = () => {
  if (currentIndex.value >= questions.value.length - 1) return false
  currentIndex.value += 1
  return true
}

const handleTouchStart = (event) => {
  const touch = event.changedTouches?.[0]
  if (!touch) return
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
}

const handleTouchEnd = (event) => {
  if (window.innerWidth > 760 || answerCardVisible.value) return
  const touch = event.changedTouches?.[0]
  if (!touch) return
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value
  if (deltaX > 70 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
    goNextQuestion()
  }
}

const hydrateInputs = () => {
  const value = currentAnswer.value
  singleAnswer.value = value[0] || ''
  multiAnswer.value = [...value]
  blankAnswer.value = value.length ? [...value] : ['']
  textAnswer.value = value[0] || ''
}

watch(currentQuestion, hydrateInputs)

const setCurrentAnswer = (value) => {
  if (!currentQuestion.value) return
  const id = questionAttemptId(currentQuestion.value)
  answers[id] = value
    .filter((item) => item !== null && item !== undefined)
    .map((item) => String(item))
  delete answerResults[id]
}

const saveAfterAnswerChange = () => {
  saveCurrent({ silent: true }).catch(() => {})
}

const updateSingle = () => {
  setCurrentAnswer(singleAnswer.value ? [singleAnswer.value] : [])
  saveAfterAnswerChange()
}

const updateMulti = () => {
  setCurrentAnswer(multiAnswer.value)
  saveAfterAnswerChange()
}

const updateBlank = () => {
  setCurrentAnswer(blankAnswer.value)
  saveAfterAnswerChange()
}

const updateText = () => {
  setCurrentAnswer(textAnswer.value ? [textAnswer.value] : [])
  saveAfterAnswerChange()
}

const loadAttempt = async (id) => {
  const data = await getPracticeAttempt(id)
  attempt.value = data
  Object.keys(answers).forEach((key) => delete answers[key])
  Object.keys(answerResults).forEach((key) => delete answerResults[key])
  Object.keys(saveVersions).forEach((key) => delete saveVersions[key])
  ;(data.questions || []).forEach((question) => {
    const id = questionAttemptId(question)
    answers[id] = parseAnswerArray(question.answer?.userAnswerJson)
  })
  hydrateInputs()
}

const saveCurrent = async ({ silent = false } = {}) => {
  if (!currentQuestion.value || attempt.value.status !== 1) return
  const question = currentQuestion.value
  const attemptQuestionId = questionAttemptId(question)
  const version = (saveVersions[attemptQuestionId] || 0) + 1
  saveVersions[attemptQuestionId] = version
  const payload = {
    attemptQuestionId,
    answers: answers[attemptQuestionId] || []
  }
  setSaving(1)
  try {
    const result = await savePracticeAnswer(getAttemptId(attempt.value), payload)
    if (saveVersions[attemptQuestionId] === version) {
      const normalizedResult = normalizeAnswerResult(result, question)
      answerResults[attemptQuestionId] = normalizedResult
      if (normalizedResult?.isCorrect === true) {
        goNextQuestion()
      }
    }
    if (!silent) ElMessage.success('已保存')
  } finally {
    setSaving(-1)
  }
}

const submit = async () => {
  await ElMessageBox.confirm('提交后将进入判题，确认提交吗？', '提交确认', { type: 'warning' })
  if (currentQuestion.value) {
    await saveCurrent()
  }
  const result = await submitPractice(getAttemptId(attempt.value))
  attempt.value = result
  ElMessage.success('提交成功')
  goResult(result)
}

const goResult = (data) => {
  const id = getAttemptId(data)
  if (!id) return
  router.push({ name: props.resultRouteName, params: { id } })
}

const openNote = async () => {
  if (!currentQuestion.value) return
  noteContent.value = ''
  try {
    const note = await getNote(currentQuestion.value.questionId)
    noteContent.value = note?.content || ''
  } catch {
    noteContent.value = ''
  }
  noteVisible.value = true
}

const saveCurrentNote = async () => {
  await saveNote(currentQuestion.value.questionId, { content: noteContent.value })
  ElMessage.success('笔记已保存')
  noteVisible.value = false
}

const deleteCurrentNote = async () => {
  await deleteNote(currentQuestion.value.questionId)
  noteContent.value = ''
  ElMessage.success('笔记已删除')
  noteVisible.value = false
}

const submitReport = async () => {
  if (!reportForm.description.trim()) {
    ElMessage.warning('请填写反馈说明')
    return
  }
  await createQuestionReport({
    questionId: currentQuestion.value.questionId,
    reason: reportForm.reason,
    description: reportForm.description
  })
  reportForm.description = ''
  reportVisible.value = false
  ElMessage.success('反馈已提交')
}

onMounted(async () => {
  timer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
  if (route.params.attemptId) {
    await loadAttempt(route.params.attemptId)
  }
})

onUnmounted(() => {
  window.clearInterval(timer)
})
</script>

<style scoped>
.answer-layout {
  display: block;
}

.attempt-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.answer-card {
  display: grid;
  align-content: start;
  gap: 14px;
}

.answer-card__head {
  display: flex;
  justify-content: space-between;
}

.answer-card__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(34px, 1fr));
  gap: 8px;
}

.answer-card__grid button {
  width: 100%;
  height: 34px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
}

.answer-card__grid button.done {
  border-color: #22c55e;
  color: #15803d;
  background: #f0fdf4;
}

.answer-card__grid button.correct {
  border-color: #16a34a;
  color: #166534;
  background: #dcfce7;
}

.answer-card__grid button.wrong {
  border-color: #ef4444;
  color: #991b1b;
  background: #fee2e2;
}

.answer-card__grid button.active {
  border-color: #2563eb;
  color: #fff;
  background: #2563eb;
}

.question-panel {
  min-width: 0;
}

.question-meta,
.question-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.question-stem {
  margin: 16px 0;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.answer-input :deep(.el-radio-group),
.answer-input :deep(.el-checkbox-group),
.blank-list {
  display: grid;
  gap: 10px;
}

.answer-input :deep(.el-radio),
.answer-input :deep(.el-checkbox) {
  width: 100%;
  height: auto;
  min-height: 44px;
  margin: 0;
  padding: 10px 14px;
  white-space: normal;
}

.option-key {
  display: inline-block;
  margin-right: 8px;
  color: #2563eb;
  font-weight: 700;
}

.practice-answer-result {
  display: grid;
  gap: 14px;
  margin-top: 16px;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.practice-answer-result__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: #475569;
}

.answer-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.answer-detail-grid > div,
.analysis-block {
  min-width: 0;
}

.answer-detail-grid strong,
.analysis-block strong {
  display: block;
  margin-bottom: 6px;
  color: #111827;
}

.answer-detail-grid p {
  margin: 0;
  color: #475569;
  overflow-wrap: anywhere;
}

.analysis-block {
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.question-actions {
  margin-top: 18px;
  justify-content: flex-end;
}

@media (max-width: 760px) {
  .attempt-page {
    gap: 10px;
  }

  .attempt-page .page-header {
    align-items: center;
    gap: 8px;
  }

  .attempt-page .page-title {
    font-size: 18px;
    line-height: 1.2;
  }

  .attempt-page .page-subtitle {
    max-width: 210px;
    margin-top: 1px;
    overflow: hidden;
    font-size: 12px;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .attempt-page .toolbar {
    gap: 6px;
    justify-content: flex-end;
  }

  .attempt-page .toolbar :deep(.el-tag) {
    height: 22px;
    padding: 0 6px;
    font-size: 12px;
  }

  .attempt-controls {
    position: sticky;
    top: 58px;
    z-index: 12;
    justify-content: stretch;
    padding: 10px;
  }

  .attempt-controls .el-button {
    flex: 1 1 0;
    min-height: 34px;
    margin-left: 0;
    padding: 8px 10px;
  }

  .answer-layout {
    padding: 12px;
  }

  .question-meta {
    gap: 6px;
    font-size: 12px;
  }

  .question-meta :deep(.el-tag) {
    height: 22px;
    padding: 0 6px;
    font-size: 12px;
  }

  .answer-detail-grid {
    grid-template-columns: 1fr;
  }

  .question-actions {
    justify-content: stretch;
  }

  .question-actions .el-button {
    flex: 1 1 0;
    margin-left: 0;
  }
}
</style>
