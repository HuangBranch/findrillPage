<template>
  <div class="page attempt-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ pageTitle }}</h1>
        <p class="page-subtitle">{{ attempt ? attempt.name : '选择一个可用配置开始作答。' }}</p>
      </div>
      <div class="toolbar">
        <el-tag v-if="attempt" :type="attempt.status === 1 ? 'warning' : 'success'">
          {{ attempt.status === 1 ? '进行中' : '已提交' }}
        </el-tag>
        <el-tag v-if="remainingText && attempt?.status === 1" type="danger">{{ remainingText }}</el-tag>
      </div>
    </div>

    <section v-if="!attempt" class="surface">
      <div class="toolbar">
        <el-select v-model="filters.curriculumId" placeholder="课程 ID" clearable filterable style="width: 180px" @change="loadConfigs">
          <el-option v-for="id in curriculumIds" :key="id" :label="`课程 #${id}`" :value="id" />
        </el-select>
        <el-button :icon="Refresh" @click="loadConfigs">刷新配置</el-button>
      </div>

      <el-skeleton :loading="loadingConfigs" animated :rows="4">
        <el-empty v-if="!configs.length" description="暂无可用配置" />
        <div v-else class="card-grid config-grid">
          <el-card v-for="config in configs" :key="config.id" shadow="never">
            <template #header>
              <div class="config-title">
                <strong>{{ config.name }}</strong>
                <el-tag :type="tagOf(EXAM_MODES, config.mode)">{{ labelOf(EXAM_MODES, config.mode) }}</el-tag>
              </div>
            </template>
            <div class="config-meta">
              <span>课程 #{{ config.curriculumId }}</span>
              <span v-if="config.chapterId">章节 #{{ config.chapterId }}</span>
              <span>{{ config.questionCount || 0 }} 题</span>
              <span>{{ config.durationMinutes || '不限时' }}{{ config.durationMinutes ? ' 分钟' : '' }}</span>
            </div>
            <template #footer>
              <el-button type="primary" :loading="startingId === config.id" @click="start(config)">开始作答</el-button>
            </template>
          </el-card>
        </div>
      </el-skeleton>
    </section>

    <template v-else>
      <section class="surface answer-layout">
        <aside class="answer-card">
          <div class="answer-card__head">
            <strong>答题卡</strong>
            <span>{{ answeredCount }}/{{ questions.length }}</span>
          </div>
          <div class="answer-card__grid">
            <button
              v-for="(question, index) in questions"
              :key="question.id"
              type="button"
              :class="{ active: index === currentIndex, done: answers[question.id]?.length }"
              @click="currentIndex = index"
            >
              {{ index + 1 }}
            </button>
          </div>
          <el-button v-if="attempt.status === 1" type="primary" class="submit-button" @click="submit">
            提交
          </el-button>
          <el-button v-else class="submit-button" @click="router.push(`/exam/result/${attempt.id}`)">
            查看结果
          </el-button>
        </aside>

        <article v-if="currentQuestion" class="question-panel">
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

          <div class="question-actions">
            <el-button :disabled="currentIndex === 0" @click="currentIndex--">上一题</el-button>
            <el-button v-if="attempt.status === 1" type="primary" :loading="saving" @click="saveCurrent">保存答案</el-button>
            <el-button :disabled="currentIndex >= questions.length - 1" @click="currentIndex++">下一题</el-button>
            <el-button @click="openNote">笔记</el-button>
            <el-button @click="reportVisible = true">反馈</el-button>
          </div>
        </article>
      </section>
    </template>

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
import { Refresh } from '@element-plus/icons-vue'
import { getAttempt, listExamConfigs, saveAnswer, startExam, submitAttempt } from '@/api/exam'
import { createQuestionReport, deleteNote, getNote, saveNote } from '@/api/learning'
import { EXAM_MODES, QUESTION_TYPES, REPORT_REASONS, labelOf, tagOf } from '@/utils/dictionaries'
import { formatDuration, parseAnswerArray, parseOptions } from '@/utils/helpers'

const props = defineProps({
  mode: {
    type: Number,
    default: 1
  },
  title: {
    type: String,
    default: '答题'
  }
})

const route = useRoute()
const router = useRouter()

const loadingConfigs = ref(false)
const configs = ref([])
const filters = reactive({ curriculumId: undefined })
const startingId = ref()
const attempt = ref(null)
const currentIndex = ref(0)
const answers = reactive({})
const saving = ref(false)
const now = ref(Date.now())
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
const curriculumIds = computed(() => [...new Set(configs.value.map((item) => item.curriculumId).filter(Boolean))])
const remainingText = computed(() => {
  if (!attempt.value?.deadlineTime) return ''
  const remain = Math.max(0, Math.floor((new Date(attempt.value.deadlineTime).getTime() - now.value) / 1000))
  return `剩余 ${formatDuration(remain)}`
})

const currentAnswer = computed(() => answers[currentQuestion.value?.id] || [])
const singleAnswer = ref('')
const multiAnswer = ref([])
const blankAnswer = ref([''])
const textAnswer = ref('')

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
  answers[currentQuestion.value.id] = value.filter((item) => item !== null && item !== undefined).map((item) => String(item))
}

const updateSingle = () => setCurrentAnswer(singleAnswer.value ? [singleAnswer.value] : [])
const updateMulti = () => setCurrentAnswer(multiAnswer.value)
const updateBlank = () => setCurrentAnswer(blankAnswer.value)
const updateText = () => setCurrentAnswer(textAnswer.value ? [textAnswer.value] : [])

const loadConfigs = async () => {
  loadingConfigs.value = true
  try {
    configs.value = await listExamConfigs({
      mode: props.mode,
      curriculumId: filters.curriculumId
    })
  } finally {
    loadingConfigs.value = false
  }
}

const loadAttempt = async (id) => {
  const data = await getAttempt(id)
  attempt.value = data
  Object.keys(answers).forEach((key) => delete answers[key])
  ;(data.questions || []).forEach((question) => {
    answers[question.id] = parseAnswerArray(question.answer?.userAnswerJson)
  })
  hydrateInputs()
}

const start = async (config) => {
  startingId.value = config.id
  try {
    const data = await startExam({ configId: config.id, practiceMode: 1 })
    const attemptId = data?.id || data?.attemptId
    if (!attemptId) {
      throw new Error('启动作答失败：后端未返回作答 ID')
    }
    await router.replace({ name: 'AttemptWorkspace', params: { attemptId } })
    await loadAttempt(attemptId)
  } finally {
    startingId.value = undefined
  }
}

const saveCurrent = async () => {
  if (!currentQuestion.value || attempt.value.status !== 1) return
  saving.value = true
  try {
    await saveAnswer(attempt.value.id, {
      attemptQuestionId: currentQuestion.value.id,
      answers: answers[currentQuestion.value.id] || []
    })
    ElMessage.success('已保存')
  } finally {
    saving.value = false
  }
}

const submit = async () => {
  await ElMessageBox.confirm('提交后将进入判题，确认提交吗？', '提交确认', { type: 'warning' })
  if (currentQuestion.value) {
    await saveCurrent()
  }
  const result = await submitAttempt(attempt.value.id)
  attempt.value = result
  ElMessage.success('提交成功')
  router.push(`/exam/result/${result.id}`)
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
  } else {
    await loadConfigs()
  }
})

onUnmounted(() => {
  window.clearInterval(timer)
})
</script>

<style scoped>
.answer-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
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
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.answer-card__grid button {
  width: 34px;
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

.answer-card__grid button.active {
  border-color: #2563eb;
  color: #fff;
  background: #2563eb;
}

.submit-button {
  width: 100%;
}

.question-panel {
  min-width: 0;
}

.question-meta,
.question-actions,
.config-title,
.config-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.config-title {
  justify-content: space-between;
}

.config-meta {
  color: #64748b;
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

.question-actions {
  margin-top: 18px;
}

@media (max-width: 760px) {
  .answer-layout {
    grid-template-columns: 1fr;
  }

  .answer-card {
    order: 2;
  }

  .answer-card__grid {
    grid-template-columns: repeat(8, 1fr);
  }
}
</style>
