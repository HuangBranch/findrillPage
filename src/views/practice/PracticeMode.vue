<template>
  <div class="practice-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <div class="header-info">
          <div class="header-main">
            <h1 class="page-title">{{ courseStore.currentChapter?.chapterName || courseStore.currentChapter?.name }}</h1>
            <el-tag size="small" type="success" effect="plain">刷题模式</el-tag>
          </div>
          <p class="course-name">{{ courseStore.currentCourse?.cName || courseStore.currentCourse?.name }}</p>
        </div>
        <div class="progress-badge" @click="showAnswerCard = true">{{ currentIndex + 1 }}/{{ questions.length }}</div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="page-content">
      <div v-if="questions.length > 0">
        <transition name="slide-fade" mode="out-in">
          <div :key="`q-${currentQuestion.id}`" class="question-container">
            <!-- 题目卡片 -->
            <div class="question-card">
            <div class="question-header">
              <el-tag :type="getQuestionTypeTag(currentQuestion.type)">
                {{ getQuestionTypeName(currentQuestion.type) }}
              </el-tag>
              <span class="question-difficulty" :class="'difficulty-' + currentQuestion.difficulty">
                {{ getDifficultyName(currentQuestion.difficulty) }}
              </span>
            </div>
            
            <div class="question-content">
              <p class="question-text">{{ currentIndex + 1 }}. {{ currentQuestion.question }}</p>
              <p v-if="currentQuestion.type === 'multiple'" class="question-hint">（多选题，选择完毕后请点击下一题）</p>
            </div>

            <!-- 选项列表 -->
            <div class="options-list" :key="`options-${currentQuestion.id}-${renderKey}`" v-show="!isTransitioning">
              <div
                v-for="(option, index) in currentQuestion.options"
                :key="`${currentQuestion.id}-opt-${index}-${renderKey}`"
                class="option-item"
                :class="{
                  selected: isOptionSelected(index),
                  correct: showAnswer && option.isCorrect,
                  wrong: showAnswer && isOptionSelected(index) && !option.isCorrect
                }"
                @click="handleSelectOption(index)"
              >
                <div class="option-label">{{ getOptionLabel(index) }}</div>
                <div class="option-content">{{ option.text }}</div>
                <div v-if="showAnswer" class="option-icon">
                  <el-icon v-if="option.isCorrect" color="#67c23a"><CircleCheck /></el-icon>
                  <el-icon v-else-if="isOptionSelected(index)" color="#f56c6c"><CircleClose /></el-icon>
                </div>
              </div>
            </div>

            <!-- 答案解析 -->
            <transition name="fade">
              <div v-if="showAnswer" class="answer-analysis">
                <div class="analysis-header">
                  <el-icon><Document /></el-icon>
                  <span>答案解析</span>
                </div>
                <div class="analysis-content">
                  <p class="correct-answer">
                    <strong>正确答案：</strong>{{ getCorrectAnswer() }}
                  </p>
                  <p class="analysis-text">{{ currentQuestion.analysis || '暂无解析' }}</p>
                </div>
              </div>
            </transition>
            </div>
          </div>
        </transition>
      </div>

      <el-empty v-else description="暂无题目" />
    </div>

    <!-- 底部操作栏 -->
    <div class="page-footer">
      <el-button
        :disabled="currentIndex === 0"
        @click="handlePrevious"
      >
        上一题
      </el-button>
      
      <el-button
        :disabled="currentIndex >= questions.length - 1"
        @click="handleNext"
      >
        下一题
      </el-button>
      
      <el-button
        v-if="currentQuestion.type === 'multiple' && !showAnswer && hasAnswer"
        type="primary"
        @click="handleSubmit"
      >
        提交答案
      </el-button>
      
      <el-button
        v-else
        type="primary"
        @click="handleFinishPractice"
      >
        提交试卷
      </el-button>
    </div>

    <!-- 答题卡抽屉 -->
    <el-drawer
      v-model="showAnswerCard"
      title="答题卡"
      size="80%"
      :style="{ maxWidth: '400px' }"
    >
      <div class="answer-sheet">
        <div class="sheet-stats">
          <div class="stat-item">
            <span class="stat-label">已答</span>
            <span class="stat-value">{{ answeredCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">未答</span>
            <span class="stat-value">{{ unansweredCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">正确</span>
            <span class="stat-value correct">{{ correctAnsweredCount }}</span>
          </div>
        </div>
        
        <el-divider />
        
        <div class="sheet-content">
          <!-- 单选题 -->
          <div v-if="singleQuestions.length > 0" class="question-group">
            <div class="group-title">单选题 ({{ singleQuestions.length }})</div>
            <div class="sheet-grid">
              <div
                v-for="item in singleQuestions"
                :key="item.question.id"
                class="sheet-item"
                :class="{
                  answered: userAnswers[item.index],
                  correct: userAnswers[item.index]?.isCorrect,
                  wrong: userAnswers[item.index] && !userAnswers[item.index]?.isCorrect,
                  active: currentIndex === item.index
                }"
                @click="jumpToQuestion(item.index)"
              >
                {{ item.index + 1 }}
              </div>
            </div>
          </div>

          <!-- 多选题 -->
          <div v-if="multipleQuestions.length > 0" class="question-group">
            <div class="group-title">多选题 ({{ multipleQuestions.length }})</div>
            <div class="sheet-grid">
              <div
                v-for="item in multipleQuestions"
                :key="item.question.id"
                class="sheet-item"
                :class="{
                  answered: userAnswers[item.index],
                  correct: userAnswers[item.index]?.isCorrect,
                  wrong: userAnswers[item.index] && !userAnswers[item.index]?.isCorrect,
                  active: currentIndex === item.index
                }"
                @click="jumpToQuestion(item.index)"
              >
                {{ item.index + 1 }}
              </div>
            </div>
          </div>

          <!-- 判断题 -->
          <div v-if="judgeQuestions.length > 0" class="question-group">
            <div class="group-title">判断题 ({{ judgeQuestions.length }})</div>
            <div class="sheet-grid">
              <div
                v-for="item in judgeQuestions"
                :key="item.question.id"
                class="sheet-item"
                :class="{
                  answered: userAnswers[item.index],
                  correct: userAnswers[item.index]?.isCorrect,
                  wrong: userAnswers[item.index] && !userAnswers[item.index]?.isCorrect,
                  active: currentIndex === item.index
                }"
                @click="jumpToQuestion(item.index)"
              >
                {{ item.index + 1 }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="sheet-footer">
          <el-button type="primary" size="large" @click="handleFinishPractice" style="width: 100%">
            提交试卷
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 完成练习对话框 -->
    <el-dialog
      v-model="showSummary"
      title="练习完成"
      width="90%"
      :style="{ maxWidth: '500px' }"
    >
      <div class="summary-content">
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-value">{{ questions.length }}</div>
            <div class="stat-label">总题数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value correct">{{ correctCount }}</div>
            <div class="stat-label">正确</div>
          </div>
          <div class="stat-item">
            <div class="stat-value wrong">{{ wrongCount }}</div>
            <div class="stat-label">错误</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ accuracy }}%</div>
            <div class="stat-label">正确率</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleReview">查看错题</el-button>
        <el-button type="primary" @click="handleFinish">返回章节</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { ArrowLeft, CircleCheck, CircleClose, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()

// 题目数据
const questions = ref([])
const currentIndex = ref(0)
const selectedAnswer = ref([]) // 支持多选，使用数组
const showAnswer = ref(false)
const showSummary = ref(false)
const showAnswerCard = ref(false)
const userAnswers = ref([])
const isTransitioning = ref(true) // 初始为true，防止首次渲染时误显示选中状态
const renderKey = ref(0) // 强制重新渲染

// 当前题目
const currentQuestion = computed(() => questions.value[currentIndex.value] || {})

// 是否有答案
const hasAnswer = computed(() => selectedAnswer.value.length > 0)

// 已答题数
const answeredCount = computed(() => userAnswers.value.filter(a => a).length)

// 未答题数
const unansweredCount = computed(() => questions.value.length - answeredCount.value)

// 已答对题数
const correctAnsweredCount = computed(() => userAnswers.value.filter(a => a?.isCorrect).length)

// 题目分组
const singleQuestions = computed(() => 
  questions.value.map((q, index) => ({ question: q, index })).filter(item => item.question.type === 'single')
)
const multipleQuestions = computed(() => 
  questions.value.map((q, index) => ({ question: q, index })).filter(item => item.question.type === 'multiple')
)
const judgeQuestions = computed(() => 
  questions.value.map((q, index) => ({ question: q, index })).filter(item => item.question.type === 'judge')
)

// 判断选项是否被选中
const isOptionSelected = (index) => {
  // 在过渡动画期间，不显示任何选中状态
  if (isTransitioning.value) return false
  
  // 确保当前题目存在
  if (!currentQuestion.value || !currentQuestion.value.id) return false
  
  const label = getOptionLabel(index)
  return selectedAnswer.value.includes(label)
}

// 统计数据
const correctCount = computed(() => userAnswers.value.filter(a => a.isCorrect).length)
const wrongCount = computed(() => userAnswers.value.filter(a => !a.isCorrect).length)
const accuracy = computed(() => {
  if (userAnswers.value.length === 0) return 0
  return Math.round((correctCount.value / userAnswers.value.length) * 100)
})

// 初始化
onMounted(() => {
  loadQuestions()
  loadProgress()
  // 延迟解锁，确保页面完全渲染后再显示选项状态
  setTimeout(() => {
    isTransitioning.value = false
  }, 350)
})

// 加载题目
const loadQuestions = () => {
  // 开发环境使用模拟数据
  if (import.meta.env.DEV) {
    questions.value = generateMockQuestions()
  } else {
    // 生产环境从接口获取
    // const res = await practiceApi.getQuestions(...)
  }
}

// 生成模拟题目
const generateMockQuestions = () => {
  const difficulties = ['easy', 'medium', 'hard']
  const questions = []
  let id = 1
  
  // 生成单选题
  for (let i = 0; i < 7; i++) {
    questions.push({
      id: id++,
      type: 'single',
      difficulty: difficulties[i % 3],
      question: `这是第 ${questions.length + 1} 道题目（单选题），请根据题意选择正确答案？`,
      options: [
        { text: '选项A：这是第一个选项', isCorrect: i % 4 === 0 },
        { text: '选项B：这是第二个选项', isCorrect: i % 4 === 1 },
        { text: '选项C：这是第三个选项', isCorrect: i % 4 === 2 },
        { text: '选项D：这是第四个选项', isCorrect: i % 4 === 3 }
      ],
      analysis: `这道题的正确答案是${String.fromCharCode(65 + (i % 4))}，解析内容：这里是详细的答案解析说明。`
    })
  }
  
  // 生成多选题
  for (let i = 0; i < 7; i++) {
    const options = [
      { text: '选项A：这是第一个选项', isCorrect: i % 2 === 0 },
      { text: '选项B：这是第二个选项', isCorrect: true },
      { text: '选项C：这是第三个选项', isCorrect: i % 3 === 0 },
      { text: '选项D：这是第四个选项', isCorrect: false }
    ]
    const correctAnswers = options
      .map((opt, idx) => opt.isCorrect ? String.fromCharCode(65 + idx) : '')
      .filter(Boolean)
      .join('')
    
    questions.push({
      id: id++,
      type: 'multiple',
      difficulty: difficulties[i % 3],
      question: `这是第 ${questions.length + 1} 道题目（多选题），请根据题意选择正确答案？`,
      options,
      analysis: `这道题的正确答案是${correctAnswers}，解析内容：这里是详细的答案解析说明。`
    })
  }
  
  // 生成判断题
  for (let i = 0; i < 6; i++) {
    questions.push({
      id: id++,
      type: 'judge',
      difficulty: difficulties[i % 3],
      question: `这是第 ${questions.length + 1} 道题目（判断题），请根据题意选择正确答案？`,
      options: [
        { text: '正确', isCorrect: i % 2 === 0 },
        { text: '错误', isCorrect: i % 2 !== 0 }
      ],
      analysis: `这道题的正确答案是${i % 2 === 0 ? '正确' : '错误'}，解析内容：这里是详细的答案解析说明。`
    })
  }
  
  return questions
}

// 加载进度
const loadProgress = () => {
  const courseId = courseStore.currentCourse?.id
  const chapterId = courseStore.currentChapter?.id
  if (!courseId || !chapterId) return

  const key = `practice_${courseId}_${chapterId}`
  const saved = localStorage.getItem(key)
  if (saved) {
    const data = JSON.parse(saved)
    currentIndex.value = data.currentIndex || 0
    userAnswers.value = data.userAnswers || []
  }
}

// 保存进度
const saveProgress = () => {
  const courseId = courseStore.currentCourse?.id
  const chapterId = courseStore.currentChapter?.id
  if (!courseId || !chapterId) return

  const key = `practice_${courseId}_${chapterId}`
  localStorage.setItem(key, JSON.stringify({
    currentIndex: currentIndex.value,
    userAnswers: userAnswers.value,
    timestamp: Date.now()
  }))
}

// 选择选项
const handleSelectOption = (index) => {
  if (showAnswer.value || isTransitioning.value) return
  
  const label = getOptionLabel(index)
  const currentType = currentQuestion.value.type
  
  if (currentType === 'multiple') {
    // 多选题：切换选中状态
    const idx = selectedAnswer.value.indexOf(label)
    if (idx > -1) {
      selectedAnswer.value.splice(idx, 1)
    } else {
      selectedAnswer.value.push(label)
    }
  } else {
    // 单选题和判断题：只能选一个，自动提交
    selectedAnswer.value = [label]
    // 延迟提交，让用户看到选中效果
    setTimeout(() => {
      handleSubmit()
    }, 100)
  }
}

// 获取选项标签
const getOptionLabel = (index) => {
  const question = currentQuestion.value
  if (question.type === 'judge') {
    return index === 0 ? '正确' : '错误'
  }
  return String.fromCharCode(65 + index) // A, B, C, D
}

// 提交答案
const handleSubmit = () => {
  if (selectedAnswer.value.length === 0) {
    ElMessage.warning('请选择答案')
    return
  }

  // 获取正确答案
  const correctAnswers = currentQuestion.value.options
    .map((opt, idx) => opt.isCorrect ? getOptionLabel(idx) : null)
    .filter(Boolean)
  
  // 判断是否正确
  const userAnswerStr = selectedAnswer.value.sort().join('')
  const correctAnswerStr = correctAnswers.sort().join('')
  const isCorrect = userAnswerStr === correctAnswerStr

  // 记录答题结果
  userAnswers.value[currentIndex.value] = {
    questionId: currentQuestion.value.id,
    userAnswer: userAnswerStr,
    correctAnswer: correctAnswerStr,
    isCorrect,
    timestamp: Date.now()
  }

  showAnswer.value = true
  saveProgress()

  // 如果答错了,添加到错题本
  if (!isCorrect) {
    addToWrongBook()
  }

  ElMessage({
    type: isCorrect ? 'success' : 'error',
    message: isCorrect ? '回答正确！' : '回答错误，请查看解析',
    duration: 1500
  })
}

// 添加到错题本
const addToWrongBook = () => {
  const wrongKey = 'wrong_questions'
  const saved = localStorage.getItem(wrongKey)
  const wrongQuestions = saved ? JSON.parse(saved) : []
  
  const wrongQuestion = {
    ...currentQuestion.value,
    courseId: courseStore.currentCourse?.cId,
    courseName: courseStore.currentCourse?.cName,
    chapterId: courseStore.currentChapter?.chapterId,
    chapterName: courseStore.currentChapter?.chapterName,
    userAnswer: selectedAnswer.value.sort().join('、'),
    timestamp: Date.now()
  }
  
  // 避免重复添加
  const exists = wrongQuestions.find(q => q.id === wrongQuestion.id)
  if (!exists) {
    wrongQuestions.push(wrongQuestion)
    localStorage.setItem(wrongKey, JSON.stringify(wrongQuestions))
  }
}

// 获取正确答案
const getCorrectAnswer = () => {
  const correctAnswers = currentQuestion.value.options
    ?.map((opt, idx) => opt.isCorrect ? getOptionLabel(idx) : null)
    .filter(Boolean)
  return correctAnswers?.join('、') || ''
}

// 上一题
const handlePrevious = () => {
  if (currentIndex.value > 0) {
    isTransitioning.value = true
    currentIndex.value--
    renderKey.value++
    resetQuestion()
    setTimeout(() => {
      isTransitioning.value = false
    }, 350)
  }
}

// 下一题
const handleNext = () => {
  // 如果当前题是多选题且还没有显社答案，先提交
  if (currentQuestion.value.type === 'multiple' && !showAnswer.value && selectedAnswer.value.length > 0) {
    handleSubmit()
    return
  }
  
  if (currentIndex.value < questions.value.length - 1) {
    isTransitioning.value = true
    currentIndex.value++
    renderKey.value++
    resetQuestion()
    saveProgress()
    setTimeout(() => {
      isTransitioning.value = false
    }, 350)
  } else {
    showSummary.value = true
  }
}

// 重置题目状态
const resetQuestion = () => {
  const saved = userAnswers.value[currentIndex.value]
  if (saved) {
    // 将字符串答案转换回数组
    selectedAnswer.value = saved.userAnswer ? saved.userAnswer.split('') : []
    showAnswer.value = true
  } else {
    selectedAnswer.value = []
    showAnswer.value = false
  }
}

// 查看错题
const handleReview = () => {
  router.push('/wrong')
}

// 跳转到指定题目
const jumpToQuestion = (index) => {
  isTransitioning.value = true
  currentIndex.value = index
  renderKey.value++
  showAnswerCard.value = false
  resetQuestion()
  
  // 滚动到顶部
  setTimeout(() => {
    const content = document.querySelector('.page-content')
    if (content) {
      content.scrollTop = 0
    }
    isTransitioning.value = false
  }, 350)
}

// 保存练习记录
const savePracticeRecord = () => {
  // 计算统计数据
  let correctCount = 0
  const typeStats = {
    single: { correct: 0, total: 0 },
    multiple: { correct: 0, total: 0 },
    judge: { correct: 0, total: 0 }
  }

  questions.value.forEach((question, index) => {
    const answer = userAnswers.value[index]
    if (answer && answer.isCorrect) {
      correctCount++
      typeStats[question.type].correct++
    }
    typeStats[question.type].total++
  })

  // 移除没有题目的题型
  Object.keys(typeStats).forEach(type => {
    if (typeStats[type].total === 0) {
      delete typeStats[type]
    }
  })

  const accuracy = questions.value.length > 0
    ? Math.round((correctCount / questions.value.length) * 100)
    : 0

  const practiceRecord = {
    courseId: courseStore.currentCourse?.cId,
    courseName: courseStore.currentCourse?.cName,
    chapterId: courseStore.currentChapter?.chapterId,
    chapterName: courseStore.currentChapter?.chapterName,
    mode: 'sequence', // 练习模式：sequence/random/wrong
    correctCount,
    totalCount: questions.value.length,
    accuracy,
    duration: 0, // 可以后续添加计时功能
    typeStats,
    timestamp: Date.now()
  }

  // 保存到本地
  const recordsKey = 'practice_records'
  const saved = localStorage.getItem(recordsKey)
  const records = saved ? JSON.parse(saved) : []
  records.unshift(practiceRecord)
  
  // 只保留最近100条记录
  if (records.length > 100) {
    records.splice(100)
  }
  
  localStorage.setItem(recordsKey, JSON.stringify(records))
}

// 完成练习（提交试卷）
const handleFinishPractice = () => {
  showAnswerCard.value = false
  showSummary.value = true
  savePracticeRecord()
}

// 完成练习
const handleFinish = () => {
  router.back()
}

// 返回
const handleBack = () => {
  router.back()
}

// 题目类型名称
const getQuestionTypeName = (type) => {
  const map = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题'
  }
  return map[type] || '未知'
}

// 题目类型标签
const getQuestionTypeTag = (type) => {
  const map = {
    single: 'primary',
    multiple: 'warning',
    judge: 'info'
  }
  return map[type] || ''
}

// 难度名称
const getDifficultyName = (difficulty) => {
  const map = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return map[difficulty] || '未知'
}
</script>

<style scoped>
.practice-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #f5f7fa;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.page-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-name {
  font-size: 0.7rem;
  color: #909399;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-badge {
  background: #409eff;
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 16px;
  font-weight: 600;
  font-size: 0.75rem;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  min-width: 48px;
  text-align: center;
}

.progress-badge:active {
  transform: scale(0.95);
  background: #3a8ee6;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  position: relative;
}

/* 页面切换动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.page-content::-webkit-scrollbar {
  width: 6px;
}

.page-content::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.page-content::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.question-container {
  max-width: 900px;
  margin: 0 auto;
}

.question-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
}

.question-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.question-difficulty {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.difficulty-easy {
  background: #f0f9ff;
  color: #67c23a;
}

.difficulty-medium {
  background: #fef0f0;
  color: #e6a23c;
}

.difficulty-hard {
  background: #fef0f0;
  color: #f56c6c;
}

.question-content {
  margin-bottom: 1.5rem;
}

.question-text {
  font-size: 1rem;
  color: #303133;
  line-height: 1.8;
  margin: 0;
}

.question-hint {
  font-size: 0.875rem;
  color: #e6a23c;
  margin: 0.5rem 0 0 0;
  font-weight: 500;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f5f7fa;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s, transform 0.1s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.option-item:active {
  transform: scale(0.97);
  background: #e6f0ff;
}

.option-item:hover {
  background: #ecf5ff;
  border-color: #409eff;
}

.option-item.selected {
  background: #ecf5ff;
  border-color: #409eff;
}

.option-item.correct {
  background: #f0f9ff;
  border-color: #67c23a;
}

.option-item.wrong {
  background: #fef0f0;
  border-color: #f56c6c;
}

.option-label {
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #606266;
  flex-shrink: 0;
  font-size: 0.875rem;
}

.option-item.selected .option-label {
  background: #409eff;
  color: white;
}

.option-item.correct .option-label {
  background: #67c23a;
  color: white;
}

.option-item.wrong .option-label {
  background: #f56c6c;
  color: white;
}

.option-content {
  flex: 1;
  color: #303133;
  line-height: 1.6;
  font-size: 0.875rem;
}

.option-icon {
  flex-shrink: 0;
}

.option-icon :deep(.el-icon) {
  font-size: 24px;
}

.answer-analysis {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #409eff;
  font-weight: 600;
}

.analysis-content {
  color: #606266;
  line-height: 1.6;
}

.correct-answer {
  margin: 0 0 0.75rem 0;
}

.analysis-text {
  margin: 0;
}

.page-footer {
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
}

.page-footer .el-button {
  flex: 1;
}

.summary-content {
  padding: 1rem 0;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 0.5rem;
}

.stat-value.correct {
  color: #67c23a;
}

.stat-value.wrong {
  color: #f56c6c;
}

.stat-label {
  font-size: 0.875rem;
  color: #909399;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 答题卡样式 */
.answer-sheet {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sheet-stats {
  display: flex;
  justify-content: space-around;
  padding: 1rem 0;
}

.sheet-stats .stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.sheet-stats .stat-label {
  font-size: 0.875rem;
  color: #909399;
}

.sheet-stats .stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #409eff;
}

.sheet-stats .stat-value.correct {
  color: #67c23a;
}

.sheet-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 1rem;
}

.question-group {
  margin-bottom: 1rem;
}

.question-group:last-child {
  margin-bottom: 0;
}

.group-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #606266;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e4e7ed;
}

.sheet-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.sheet-item {
  aspect-ratio: 1;
  background: #f5f7fa;
  border: 2px solid #e4e7ed;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: #606266;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.sheet-item:active {
  transform: scale(0.95);
}

.sheet-item.answered {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.sheet-item.correct {
  background: #f0f9ff;
  border-color: #67c23a;
  color: #67c23a;
}

.sheet-item.wrong {
  background: #fef0f0;
  border-color: #f56c6c;
  color: #f56c6c;
}

.sheet-item.active {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.sheet-footer {
  padding-top: 1rem;
  border-top: 1px solid #e4e7ed;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .page-header {
    padding: 1rem;
  }

  .page-title {
    font-size: 0.875rem;
  }

  .chapter-name {
    font-size: 0.75rem;
  }

  .progress-badge {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }

  .page-content {
    padding: 1rem;
  }

  .question-card {
    padding: 1rem;
  }

  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .sheet-grid {
    gap: 0.25rem;
    grid-template-columns: repeat(7, 1fr);
    padding: 0 0.25rem;
  }

  .sheet-item {
    aspect-ratio: auto;
    height: 34px;
    font-size: 0.7rem;
    border-width: 1px;
    border-radius: 4px;
  }

  .answer-sheet {
    overflow-x: hidden;
  }
}

/* PC端适配 */
@media (min-width: 1024px) {
  .page-footer {
    padding: 1rem 3rem;
  }

  .page-footer .el-button {
    max-width: 200px;
  }
}
</style>
