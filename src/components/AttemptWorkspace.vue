<template>
  <div class="page attempt-page">
    <section v-if="!attempt" class="surface">
      <el-skeleton :loading="true" animated :rows="4">
        <el-empty description="正在加载练习" />
      </el-skeleton>
    </section>

    <template v-else>
      <section class="surface answer-layout">
        <Transition :name="questionTransitionName" mode="out-in">
          <article
            v-if="currentQuestion"
            :key="questionTransitionKey"
            class="question-panel"
            @touchstart.passive="handleTouchStart"
            @touchmove.passive="handleTouchMove"
            @touchcancel="resetTouchState"
            @touchend.passive="handleTouchEnd"
          >
            <div class="question-meta">
              <span>第 {{ currentIndex + 1 }} / {{ questions.length }} 题</span>
              <span>{{ labelOf(QUESTION_TYPES, currentQuestion.type) }}</span>
            </div>

            <div class="question-stem">
              <div class="question-type-badge">
                {{ labelOf(QUESTION_TYPES, currentQuestion.type) }}
              </div>
              <div class="html-content question-stem__content" v-html="currentQuestion.stemHtml"></div>
            </div>

            <div class="answer-input">
              <el-radio-group
                v-if="[1, 3].includes(currentQuestion.type)"
                v-model="singleAnswer"
                :disabled="currentQuestionLocked"
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
                :disabled="currentQuestionLocked"
                @change="updateMulti"
              >
                <el-checkbox v-for="option in currentOptions" :key="option.optionKey" :value="option.optionKey" border>
                  <span class="option-key">{{ option.optionKey }}</span>
                  <span class="html-content" v-html="option.contentHtml"></span>
                </el-checkbox>
              </el-checkbox-group>

              <div v-else-if="currentQuestion.type === 4" class="blank-list">
                <el-input
                  v-for="(_, index) in blankInputModels"
                  :key="index"
                  v-model="blankAnswer[index]"
                  :disabled="currentQuestionLocked"
                  :placeholder="`第 ${index + 1} 空`"
                  @change="updateBlank"
                />
              </div>

              <el-input
                v-else
                v-model="textAnswer"
                type="textarea"
                :rows="6"
                :disabled="currentQuestionLocked"
                placeholder="请输入答案"
                @change="updateText"
              />
            </div>

            <section v-if="hasSubmittedAnswer(currentAnswerResult)" class="practice-answer-result">
              <div class="practice-answer-result__head">
                <el-tag :type="answerResultType(currentAnswerResult)" effect="dark">
                  {{ answerResultText(currentAnswerResult) }}
                </el-tag>
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
              <el-button
                v-if="showSubmitAnswerButton"
                type="primary"
                :loading="saving"
                :disabled="!canSubmitCurrentAnswer"
                @click="submitCurrentAnswer()"
              >
                提交本题
              </el-button>
              <el-button v-if="attempt?.status !== 1" type="primary" @click="goResult(attempt)">
                查看结果
              </el-button>
              <el-button
                v-if="showNextQuestionButton"
                type="primary"
                :loading="saving"
                @click="goNextQuestion"
              >
                下一题
              </el-button>
            </div>
          </article>
        </Transition>
      </section>

      <div class="floating-actions">
        <el-button :icon="ChatDotRound" @click="reportVisible = true">反馈</el-button>
        <el-button type="primary" :icon="Grid" @click="answerCardVisible = true">
          答题卡 {{ answeredCount }}/{{ questions.length }}
        </el-button>
      </div>
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Grid } from '@element-plus/icons-vue'
import {
  getPracticeAttempt,
  submitPracticeAnswer
} from '@/api/practice'
import { createQuestionReport } from '@/api/learning'
import { QUESTION_TYPES, REPORT_REASONS, labelOf } from '@/utils/dictionaries'
import { parseAnswerArray, parseOptions, safeJsonParse } from '@/utils/helpers'

const props = defineProps({
  resultRouteName: {
    type: String,
    default: 'PracticeResult'
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
const answerCardVisible = ref(false)
const reportVisible = ref(false)
const reportForm = reactive({ reason: 1, description: '' })
const navigationDirection = ref('next')
const touchState = reactive({
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  directionLocked: '',
  tracking: false,
  ignore: false
})

const questions = computed(() => attempt.value?.questions || [])
const currentQuestion = computed(() => questions.value[currentIndex.value])
const questionTransitionKey = computed(() => questionAttemptId(currentQuestion.value) ?? currentIndex.value)
const questionTransitionName = computed(() =>
  navigationDirection.value === 'prev' ? 'question-slide-prev' : 'question-slide-next'
)
const currentOptions = computed(() => parseOptions(currentQuestion.value?.optionsJson))
const hasLocalAnswer = (value) => Array.isArray(value) && value.some((item) => String(item || '').trim())
const answeredCount = computed(() => Object.values(answers).filter(hasLocalAnswer).length)

const currentAnswer = computed(() => answers[questionAttemptId(currentQuestion.value)] || [])
const currentAnswerResult = computed(() => answerResults[questionAttemptId(currentQuestion.value)])
const hasSubmittedAnswer = (result) =>
  Boolean(result && (result.answeredTime || result.userAnswerJson !== undefined || result.isCorrect !== undefined))
const currentQuestionLocked = computed(() => hasSubmittedAnswer(currentAnswerResult.value) || attempt.value?.status !== 1)
const showSubmitAnswerButton = computed(() =>
  [2, 4, 5].includes(currentQuestion.value?.type) && !currentQuestionLocked.value && attempt.value?.status === 1
)
const showNextQuestionButton = computed(() =>
  currentAnswerResult.value?.isCorrect === false && currentIndex.value < questions.value.length - 1
)
const singleAnswer = ref('')
const multiAnswer = ref([])
const blankAnswer = ref([''])
const textAnswer = ref('')
const blankInputModels = computed(() => blankAnswer.value)
const currentBlankCount = computed(() => {
  const question = currentQuestion.value
  if (question?.type !== 4) return 1
  const blankCount = Number(question?.blankCount || 0)
  return Math.max(blankCount, currentAnswer.value.length, 1)
})
const canSubmitCurrentAnswer = computed(() => {
  const question = currentQuestion.value
  if (!question) return false
  if ([1, 3].includes(question.type)) {
    return currentAnswer.value.length > 0
  }
  if (question.type === 2) {
    return currentAnswer.value.length > 0
  }
  if (question.type === 4) {
    return currentAnswer.value.length === currentBlankCount.value
      && currentAnswer.value.every((item) => String(item || '').trim())
  }
  return currentAnswer.value.length > 0 && String(currentAnswer.value[0] || '').trim()
})

const getAttemptId = (data) => data?.id || data?.attemptId
const questionAttemptId = (question) => question?.attemptQuestionId || question?.id

const setSaving = (delta) => {
  pendingSaveCount.value = Math.max(0, pendingSaveCount.value + delta)
  saving.value = pendingSaveCount.value > 0
}

const sanitizeAttemptDetail = (data) => ({
  ...data,
  questions: (data?.questions || []).map(({ answer, answersJson, analysisHtml, ...question }) => question)
})

const normalizeAnswerResult = (result, question) => {
  if (!result) return null
  return {
    ...result,
    attemptQuestionId: result?.attemptQuestionId ?? questionAttemptId(question),
    questionId: result?.questionId ?? question?.questionId,
    userAnswerJson: result?.userAnswerJson,
    answersJson: result?.answersJson,
    analysisHtml: result?.analysisHtml,
    autoJudgeDetailJson: result?.autoJudgeDetailJson,
    answeredTime: result?.answeredTime,
    judgeStatus: result?.judgeStatus,
    isCorrect: result?.isCorrect
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
    done: hasLocalAnswer(answers[id]),
    correct: result?.isCorrect === true,
    wrong: result?.isCorrect === false
  }
}

const setQuestionIndex = (index, direction = 'next') => {
  if (index < 0 || index >= questions.value.length || index === currentIndex.value) return false
  navigationDirection.value = direction
  currentIndex.value = index
  return true
}

const selectQuestion = (index) => {
  setQuestionIndex(index, index > currentIndex.value ? 'next' : 'prev')
  answerCardVisible.value = false
}

const goNextQuestion = () => {
  return setQuestionIndex(currentIndex.value + 1, 'next')
}

const goPrevQuestion = () => {
  return setQuestionIndex(currentIndex.value - 1, 'prev')
}

const resetTouchState = () => {
  touchState.startX = 0
  touchState.startY = 0
  touchState.lastX = 0
  touchState.lastY = 0
  touchState.directionLocked = ''
  touchState.tracking = false
  touchState.ignore = false
}

const shouldIgnoreSwipeTarget = (target) => {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      'input, textarea, select, button, a, .answer-input, .question-actions, .floating-actions, .el-drawer, .el-dialog'
    )
  )
}

const handleTouchStart = (event) => {
  if (window.innerWidth > 760 || answerCardVisible.value || reportVisible.value) {
    resetTouchState()
    return
  }
  const touch = event.changedTouches?.[0]
  if (!touch) return
  touchState.startX = touch.clientX
  touchState.startY = touch.clientY
  touchState.lastX = touch.clientX
  touchState.lastY = touch.clientY
  touchState.directionLocked = ''
  touchState.tracking = true
  touchState.ignore = shouldIgnoreSwipeTarget(event.target)
}

const handleTouchMove = (event) => {
  if (!touchState.tracking || touchState.ignore) return
  const touch = event.changedTouches?.[0]
  if (!touch) return
  touchState.lastX = touch.clientX
  touchState.lastY = touch.clientY
  if (touchState.directionLocked) return
  const deltaX = Math.abs(touch.clientX - touchState.startX)
  const deltaY = Math.abs(touch.clientY - touchState.startY)
  if (deltaX < 12 && deltaY < 12) return
  touchState.directionLocked = deltaX > deltaY * 1.2 ? 'horizontal' : 'vertical'
}

const handleTouchEnd = (event) => {
  if (!touchState.tracking || touchState.ignore) {
    resetTouchState()
    return
  }
  const touch = event.changedTouches?.[0]
  const endX = touch?.clientX ?? touchState.lastX
  const endY = touch?.clientY ?? touchState.lastY
  const deltaX = endX - touchState.startX
  const deltaY = endY - touchState.startY
  const absDeltaX = Math.abs(deltaX)
  const absDeltaY = Math.abs(deltaY)
  const isHorizontalSwipe = touchState.directionLocked === 'horizontal'
    && absDeltaX >= 72
    && absDeltaX > absDeltaY * 1.2

  if (isHorizontalSwipe) {
    if (deltaX < 0) {
      goNextQuestion()
    } else {
      goPrevQuestion()
    }
  }

  resetTouchState()
}

const hydrateInputs = () => {
  const value = currentAnswer.value
  singleAnswer.value = value[0] || ''
  multiAnswer.value = [...value]
  blankAnswer.value = Array.from({ length: currentBlankCount.value }, (_, index) => value[index] || '')
  textAnswer.value = value[0] || ''
}

watch(currentQuestion, hydrateInputs)

const setCurrentAnswer = (value) => {
  if (!currentQuestion.value || currentQuestionLocked.value) return
  const id = questionAttemptId(currentQuestion.value)
  answers[id] = value
    .filter((item) => item !== null && item !== undefined)
    .map((item) => String(item))
}

const updateSingle = () => {
  setCurrentAnswer(singleAnswer.value ? [singleAnswer.value] : [])
  submitCurrentAnswer({ silent: true })
}

const updateMulti = () => {
  setCurrentAnswer(multiAnswer.value)
}

const updateBlank = () => {
  setCurrentAnswer(blankAnswer.value)
}

const updateText = () => {
  setCurrentAnswer(textAnswer.value ? [textAnswer.value] : [])
}

const loadAttempt = async (id) => {
  const data = sanitizeAttemptDetail(await getPracticeAttempt(id))
  attempt.value = data
  Object.keys(answers).forEach((key) => delete answers[key])
  Object.keys(answerResults).forEach((key) => delete answerResults[key])
  Object.keys(saveVersions).forEach((key) => delete saveVersions[key])
  ;(data.questions || []).forEach((question) => {
    const id = questionAttemptId(question)
    answers[id] = []
  })
  hydrateInputs()
}

const submitCurrentAnswer = async ({ silent = false } = {}) => {
  if (!currentQuestion.value || currentQuestionLocked.value || saving.value) return
  const question = currentQuestion.value
  const attemptQuestionId = questionAttemptId(question)
  const submittedAnswers = answers[attemptQuestionId] || []
  if (!submittedAnswers.length) {
    if (!silent) ElMessage.warning('请先作答')
    return
  }
  const version = (saveVersions[attemptQuestionId] || 0) + 1
  saveVersions[attemptQuestionId] = version
  const payload = {
    attemptQuestionId,
    answers: submittedAnswers
  }
  setSaving(1)
  try {
    const result = await submitPracticeAnswer(getAttemptId(attempt.value), payload)
    if (saveVersions[attemptQuestionId] === version) {
      const normalizedResult = normalizeAnswerResult(result, question)
      answerResults[attemptQuestionId] = normalizedResult
      answers[attemptQuestionId] = parseAnswerArray(
        normalizedResult?.userAnswerJson ?? normalizedResult?.answerJson ?? submittedAnswers
      )
      if (normalizedResult?.isCorrect === true) {
        goNextQuestion()
      }
    }
    if (!silent) ElMessage.success('本题已判定')
  } finally {
    setSaving(-1)
  }
}

const goResult = (data) => {
  const id = getAttemptId(data)
  if (!id) return
  router.push({ name: props.resultRouteName, params: { id } })
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
  if (route.params.attemptId) {
    await loadAttempt(route.params.attemptId)
  }
})
</script>

<style scoped>
.answer-layout {
  display: block;
  overflow: hidden;
}

.attempt-page {
  padding-bottom: calc(76px + env(safe-area-inset-bottom));
}

.answer-card {
  display: grid;
  align-content: start;
  gap: 14px;
}

.floating-actions {
  position: fixed;
  right: 24px;
  bottom: calc(24px + env(safe-area-inset-bottom));
  z-index: 45;
  display: flex;
  align-items: center;
  gap: 10px;
}

.floating-actions .el-button {
  min-height: 44px;
  margin-left: 0;
  border-radius: 999px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16);
}

.floating-actions .el-button--primary {
  min-width: 132px;
  box-shadow: 0 14px 32px rgba(37, 99, 235, 0.28);
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
  touch-action: pan-y;
  will-change: transform, opacity;
}

.question-slide-next-enter-active,
.question-slide-next-leave-active,
.question-slide-prev-enter-active,
.question-slide-prev-leave-active {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

.question-slide-next-enter-from,
.question-slide-prev-leave-to {
  opacity: 0;
  transform: translateX(28px);
}

.question-slide-next-leave-to,
.question-slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-28px);
}

.question-meta,
.question-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.question-stem {
  position: relative;
  margin: 16px 0;
  padding: 18px 18px 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.question-type-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 24px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.01em;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.16);
}

.question-stem__content {
  min-width: 0;
  padding-left: 64px;
}

.question-stem__content :deep(p) {
  margin: 0;
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
  justify-content: flex-start;
}

@media (max-width: 760px) {
  .attempt-page {
    gap: 10px;
    padding-bottom: calc(70px + env(safe-area-inset-bottom));
  }

  .answer-layout {
    padding: 12px;
  }

  .question-meta {
    gap: 6px;
    font-size: 12px;
  }

  .question-stem {
    padding: 16px 14px 14px;
  }

  .question-type-badge {
    top: 10px;
    left: 10px;
    min-width: 44px;
    min-height: 22px;
    padding: 3px 7px;
    font-size: 10px;
  }

  .question-stem__content {
    padding-left: 56px;
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
    min-height: 34px;
    padding: 8px 10px;
  }

  .floating-actions {
    right: 14px;
    bottom: calc(14px + env(safe-area-inset-bottom));
    gap: 8px;
  }

  .floating-actions .el-button {
    min-width: 118px;
    min-height: 40px;
    padding: 8px 12px;
  }

  .floating-actions .el-button:not(.el-button--primary) {
    min-width: 82px;
  }
}
</style>
