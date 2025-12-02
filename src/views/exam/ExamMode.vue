<template>
  <div class="exam-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <div class="header-info">
          <div class="header-main">
            <h1 class="page-title">{{ courseStore.currentChapter?.chapterName || courseStore.currentChapter?.name }}</h1>
            <el-tag size="small" type="danger" effect="plain">考试模式</el-tag>
          </div>
          <p class="course-name">{{ courseStore.currentCourse?.cName || courseStore.currentCourse?.name }}</p>
        </div>
        <div class="header-actions">
          <div class="timer-badge">
            <el-icon><Clock /></el-icon>
            <span>{{ formatTime(remainingTime) }}</span>
          </div>
          <div class="answer-card-badge" @click="showAnswerSheet = true">
            <el-icon><Grid /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="page-content">
      <div v-if="!examStarted" class="exam-start">
        <div class="start-card">
          <el-icon class="start-icon"><Edit /></el-icon>
          <h2>开始考试</h2>
          <div class="exam-info">
            <div class="info-item">
              <span class="info-label">题目数量</span>
              <span class="info-value">{{ questions.length }} 题</span>
            </div>
            <div class="info-item">
              <span class="info-label">考试时长</span>
              <span class="info-value">{{ examDuration }} 分钟</span>
            </div>
            <div class="info-item">
              <span class="info-label">及格分数</span>
              <span class="info-value">60 分</span>
            </div>
          </div>
          <el-button type="primary" size="large" @click="startExam">开始考试</el-button>
        </div>
      </div>

      <div v-else class="exam-content">
        <!-- 单题显示 -->
        <transition name="slide-fade" mode="out-in">
          <div :key="`q-${currentQuestion.id}`" class="question-container">
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
                <p v-if="currentQuestion.type === 'multiple'" class="question-hint">（多选题，选择完后请点击下一题）</p>
              </div>

              <!-- 选项列表 -->
              <div class="options-list" :key="`options-${currentQuestion.id}-${renderKey}`" v-show="!isTransitioning">
                <div
                  v-for="(option, index) in currentQuestion.options"
                  :key="`${currentQuestion.id}-opt-${index}-${renderKey}`"
                  class="option-item"
                  :class="{ selected: isCurrentQuestionOptionSelected(index) }"
                  @click="handleSelectOption(index)"
                >
                  <div class="option-label">{{ getOptionLabel(index, currentQuestion.type) }}</div>
                  <div class="option-content">{{ option.text }}</div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div v-if="examStarted" class="page-footer">
      <el-button
        text
        :disabled="currentIndex === 0"
        @click="handlePrevious"
      >
        上一题
      </el-button>
      
      <el-button
        v-if="currentIndex < questions.length - 1"
        type="primary"
        @click="handleNext"
      >
        下一题
      </el-button>
      
      <el-button
        v-else
        type="primary"
        @click="handleSubmitConfirm"
      >
        提交试卷
      </el-button>
    </div>

    <!-- 答题卡抽屉 -->
    <el-drawer
      v-model="showAnswerSheet"
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
            <span class="stat-label">剩余时间</span>
            <span class="stat-value timer">{{ formatTime(remainingTime) }}</span>
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
                  answered: userAnswers[item.index] && (Array.isArray(userAnswers[item.index]) ? userAnswers[item.index].length > 0 : true),
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
                  answered: userAnswers[item.index] && (Array.isArray(userAnswers[item.index]) ? userAnswers[item.index].length > 0 : true),
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
                  answered: userAnswers[item.index] && (Array.isArray(userAnswers[item.index]) ? userAnswers[item.index].length > 0 : true),
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
          <el-button type="primary" size="large" @click="handleSubmitConfirm" style="width: 100%">
            提交试卷
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 未答题跳转对话框 -->
    <el-dialog
      v-model="showUnansweredDialog"
      title="提示"
      width="90%"
      :style="{ maxWidth: '400px' }"
    >
      <div class="submit-confirm">
        <el-icon class="warning-icon"><WarningFilled /></el-icon>
        <p>还有 {{ unansweredCount }} 道题未答！</p>
        <p style="font-size: 0.875rem; color: #909399; margin-top: 0.5rem;">是否跳转到第一道未答题？</p>
      </div>
      <template #footer>
        <el-button @click="showUnansweredDialog = false">取消</el-button>
        <el-button type="primary" @click="jumpToFirstUnanswered">跳转</el-button>
      </template>
    </el-dialog>
    
    <!-- 提交确认对话框 -->
    <el-dialog
      v-model="showSubmitDialog"
      title="提交确认"
      width="90%"
      :style="{ maxWidth: '400px' }"
    >
      <div class="submit-confirm">
        <el-icon class="warning-icon"><WarningFilled /></el-icon>
        <p>确定要提交试卷吗？</p>
        <div class="submit-stats">
          <span>已答 {{ answeredCount }} 题</span>
          <span>未答 {{ unansweredCount }} 题</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showSubmitDialog = false">取消</el-button>
        <el-button type="primary" @click="submitExam">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { ArrowLeft, Clock, Edit, List, Select, WarningFilled, Grid } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const courseStore = useCourseStore()

// 考试状态
const examStarted = ref(false)
const examDuration = ref(60) // 考试时长(分钟)
const remainingTime = ref(0) // 剩余时间(秒)
const timer = ref(null)

// 题目数据
const questions = ref([])
const currentIndex = ref(0)
const userAnswers = ref([])

// UI状态
const showAnswerSheet = ref(false)
const showSubmitDialog = ref(false)
const showUnansweredDialog = ref(false)
const isTransitioning = ref(false) // 防止移动端跳转过程中触发点击
const renderKey = ref(0) // 强制重新渲染

// 当前题目
const currentQuestion = computed(() => questions.value[currentIndex.value] || {})

// 统计数据
const answeredCount = computed(() => 
  userAnswers.value.filter(a => Array.isArray(a) ? a.length > 0 : a).length
)
const unansweredCount = computed(() => questions.value.length - answeredCount.value)

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

// 初始化
onMounted(() => {
  loadQuestions()
  loadProgress()
})

// 清理定时器
onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})

// 加载题目
const loadQuestions = () => {
  if (import.meta.env.DEV) {
    questions.value = generateMockQuestions()
  } else {
    // 生产环境从接口获取
    // const res = await examApi.getQuestions(...)
  }
}

// 生成模拟题目
const generateMockQuestions = () => {
  const difficulties = ['easy', 'medium', 'hard']
  const questions = []
  let id = 1
  
  // 生成单选题
  for (let i = 0; i < 10; i++) {
    questions.push({
      id: id++,
      type: 'single',
      difficulty: difficulties[i % 3],
      question: `这是第 ${questions.length + 1} 道考试题目（单选题），请根据题意选择正确答案？`,
      options: [
        { text: '选项A：这是第一个选项', isCorrect: i % 4 === 0 },
        { text: '选项B：这是第二个选项', isCorrect: i % 4 === 1 },
        { text: '选项C：这是第三个选项', isCorrect: i % 4 === 2 },
        { text: '选项D：这是第四个选项', isCorrect: i % 4 === 3 }
      ],
      analysis: `正确答案是${String.fromCharCode(65 + (i % 4))}`
    })
  }
  
  // 生成多选题
  for (let i = 0; i < 10; i++) {
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
      question: `这是第 ${questions.length + 1} 道考试题目（多选题），请根据题意选择正确答案？`,
      options,
      analysis: `正确答案是${correctAnswers}`
    })
  }
  
  // 生成判断题
  for (let i = 0; i < 10; i++) {
    questions.push({
      id: id++,
      type: 'judge',
      difficulty: difficulties[i % 3],
      question: `这是第 ${questions.length + 1} 道考试题目（判断题），请根据题意选择正确答案？`,
      options: [
        { text: '正确', isCorrect: i % 2 === 0 },
        { text: '错误', isCorrect: i % 2 !== 0 }
      ],
      analysis: `正确答案是${i % 2 === 0 ? '正确' : '错误'}`
    })
  }
  
  return questions
}

// 加载进度
const loadProgress = () => {
  const courseId = courseStore.currentCourse?.id
  const chapterId = courseStore.currentChapter?.id
  if (!courseId || !chapterId) return

  const key = `exam_${courseId}_${chapterId}`
  const saved = localStorage.getItem(key)
  if (saved) {
    const data = JSON.parse(saved)
    if (data.examStarted && data.remainingTime > 0) {
      examStarted.value = data.examStarted
      remainingTime.value = data.remainingTime
      userAnswers.value = data.userAnswers || []
      currentIndex.value = data.currentIndex || 0
      startTimer()
    }
  }
}

// 保存进度
const saveProgress = () => {
  const courseId = courseStore.currentCourse?.id
  const chapterId = courseStore.currentChapter?.id
  if (!courseId || !chapterId) return

  const key = `exam_${courseId}_${chapterId}`
  localStorage.setItem(key, JSON.stringify({
    examStarted: examStarted.value,
    remainingTime: remainingTime.value,
    userAnswers: userAnswers.value,
    currentIndex: currentIndex.value,
    timestamp: Date.now()
  }))
}

// 开始考试
const startExam = () => {
  examStarted.value = true
  remainingTime.value = examDuration.value * 60
  userAnswers.value = new Array(questions.value.length).fill(null).map(() => [])
  startTimer()
  saveProgress()
}

// 开始计时
const startTimer = () => {
  timer.value = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
      saveProgress()
    } else {
      clearInterval(timer.value)
      ElMessage.warning('考试时间到，自动提交')
      submitExam(true)
    }
  }, 1000)
}

// 判断答案是否选中
const isAnswerSelected = (questionIndex, optionIndex) => {
  const question = questions.value[questionIndex]
  const label = getOptionLabel(optionIndex, question.type)
  const answers = userAnswers.value[questionIndex]
  return Array.isArray(answers) ? answers.includes(label) : answers === label
}

// 判断当前题目选项是否选中
const isCurrentQuestionOptionSelected = (optionIndex) => {
  // 在过渡动画期间，不显示任何选中状态
  if (isTransitioning.value) {
    return false
  }
  
  // 确保当前题目存在
  if (!currentQuestion.value || !currentQuestion.value.id) {
    return false
  }
  
  // 确保索引有效
  if (currentIndex.value < 0 || currentIndex.value >= questions.value.length) {
    return false
  }
  
  // 确保当前渲染的题目ID与索引位置的题目ID一致（防止渲染延迟）
  if (questions.value[currentIndex.value]?.id !== currentQuestion.value.id) {
    return false
  }
  
  const label = getOptionLabel(optionIndex, currentQuestion.value.type)
  const answers = userAnswers.value[currentIndex.value]
  
  // 没有答案，返回false
  if (!answers) {
    return false
  }
  
  // 确保是数组格式
  if (!Array.isArray(answers)) {
    return false
  }
  
  // 检查是否包含该选项
  return answers.includes(label)
}

// 格式化时间
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// 选择选项（当前题目）
const handleSelectOption = (optionIndex) => {
  // 防止跳转过程中触发点击
  if (isTransitioning.value) {
    console.log('跳转中，忽略点击')
    return
  }
  
  const label = getOptionLabel(optionIndex, currentQuestion.value.type)
  
  if (currentQuestion.value.type === 'multiple') {
    // 多选题：切换选中状态
    if (!Array.isArray(userAnswers.value[currentIndex.value])) {
      userAnswers.value[currentIndex.value] = []
    }
    const answers = userAnswers.value[currentIndex.value]
    const idx = answers.indexOf(label)
    if (idx > -1) {
      answers.splice(idx, 1)
    } else {
      answers.push(label)
    }
    saveProgress()
  } else {
    // 单选题和判断题：自动跳转下一题
    // 立即上锁，防止重复点击
    isTransitioning.value = true
    
    const currentIdx = currentIndex.value
    userAnswers.value[currentIdx] = [label]
    saveProgress()
    
    // 立即切换题目，利用isTransitioning阻止显示选中状态
    if (currentIdx < questions.value.length - 1) {
      // 使用requestAnimationFrame确保在下一帧更新
      requestAnimationFrame(() => {
        if (import.meta.env.DEV) {
          console.log(`切换: 从题目${currentIdx + 1}到题目${currentIdx + 2}`)
        }
        currentIndex.value++
        renderKey.value++
        scrollToTop()
        
        // 等待动画完成后解锁 (稍微延长以避免误选)
        setTimeout(() => {
          isTransitioning.value = false
          if (import.meta.env.DEV) {
            console.log(`解锁: 当前题目${currentIndex.value + 1}`)
          }
        }, 350)
      })
    } else {
      // 最后一题，短暂延迟后解锁
      setTimeout(() => {
        isTransitioning.value = false
      }, 200)
    }
  }
}

// 选择答案（用于答题卡）
const selectAnswer = (questionIndex, optionIndex) => {
  const question = questions.value[questionIndex]
  const label = getOptionLabel(optionIndex, question.type)
  
  if (question.type === 'multiple') {
    if (!Array.isArray(userAnswers.value[questionIndex])) {
      userAnswers.value[questionIndex] = []
    }
    const answers = userAnswers.value[questionIndex]
    const idx = answers.indexOf(label)
    if (idx > -1) {
      answers.splice(idx, 1)
    } else {
      answers.push(label)
    }
  } else {
    userAnswers.value[questionIndex] = [label]
  }
  saveProgress()
}

// 获取选项标签
const getOptionLabel = (index, questionType) => {
  if (questionType === 'judge') {
    return index === 0 ? '正确' : '错误'
  }
  return String.fromCharCode(65 + index)
}

// 上一题
const handlePrevious = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    renderKey.value++
    scrollToTop()
  }
}

// 下一题
const handleNext = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    renderKey.value++
    scrollToTop()
  }
}

// 滚动到顶部
const scrollToTop = () => {
  setTimeout(() => {
    const content = document.querySelector('.page-content')
    if (content) {
      content.scrollTop = 0
    }
  }, 100)
}

// 跳转到指定题目
const jumpToQuestion = (index) => {
  currentIndex.value = index
  renderKey.value++
  showAnswerSheet.value = false
  scrollToTop()
}

// 提交确认
const handleSubmitConfirm = () => {
  if (unansweredCount.value > 0) {
    showUnansweredDialog.value = true
  } else {
    showSubmitDialog.value = true
  }
}

// 跳转到第一道未答题
const jumpToFirstUnanswered = () => {
  showUnansweredDialog.value = false
  const firstUnansweredIndex = userAnswers.value.findIndex(a => !Array.isArray(a) || a.length === 0)
  if (firstUnansweredIndex !== -1) {
    currentIndex.value = firstUnansweredIndex
    renderKey.value++
    scrollToTop()
  }
}

// 提交试卷
const submitExam = async (autoSubmit = false) => {
  if (timer.value) {
    clearInterval(timer.value)
  }
  
  showSubmitDialog.value = false
  showAnswerSheet.value = false
  
  // 计算得分
  let correctCount = 0
  const results = questions.value.map((question, index) => {
    // 获取正确答案
    const correctAnswers = question.options
      .map((opt, idx) => opt.isCorrect ? getOptionLabel(idx, question.type) : null)
      .filter(Boolean)
    
    // 获取用户答案
    const userAnswer = Array.isArray(userAnswers.value[index]) 
      ? userAnswers.value[index].sort().join('')
      : ''
    const correctAnswer = correctAnswers.sort().join('')
    
    const isCorrect = userAnswer === correctAnswer
    
    if (isCorrect) correctCount++
    
    return {
      questionId: question.id,
      userAnswer,
      correctAnswer,
      isCorrect
    }
  })
  
  const score = Math.round((correctCount / questions.value.length) * 100)
  
  // 保存错题到错题本
  const wrongKey = 'wrong_questions'
  const savedWrong = localStorage.getItem(wrongKey)
  const wrongQuestions = savedWrong ? JSON.parse(savedWrong) : []
  
  results.forEach((result, index) => {
    if (!result.isCorrect) {
      const wrongQuestion = {
        ...questions.value[index],
        courseId: courseStore.currentCourse?.cId,
        courseName: courseStore.currentCourse?.cName,
        chapterId: courseStore.currentChapter?.chapterId,
        chapterName: courseStore.currentChapter?.chapterName,
        userAnswer: result.userAnswer,
        timestamp: Date.now()
      }
      
      // 避免重复添加
      const exists = wrongQuestions.find(q => 
        q.id === wrongQuestion.id && 
        q.courseId === wrongQuestion.courseId &&
        q.chapterId === wrongQuestion.chapterId
      )
      if (!exists) {
        wrongQuestions.push(wrongQuestion)
      }
    }
  })
  
  localStorage.setItem(wrongKey, JSON.stringify(wrongQuestions))
  
  // 保存考试记录
  const examRecord = {
    courseId: courseStore.currentCourse?.cId,
    courseName: courseStore.currentCourse?.cName,
    chapterId: courseStore.currentChapter?.chapterId,
    chapterName: courseStore.currentChapter?.chapterName,
    score,
    correctCount,
    totalCount: questions.value.length,
    duration: examDuration.value * 60 - remainingTime.value,
    results,
    timestamp: Date.now(),
    autoSubmit
  }
  
  // 保存到本地
  const recordsKey = 'exam_records'
  const saved = localStorage.getItem(recordsKey)
  const records = saved ? JSON.parse(saved) : []
  records.unshift(examRecord)
  localStorage.setItem(recordsKey, JSON.stringify(records))
  
  // 清除考试进度
  const courseId = courseStore.currentCourse?.cId
  const chapterId = courseStore.currentChapter?.chapterId
  if (courseId && chapterId) {
    const key = `exam_${courseId}_${chapterId}`
    localStorage.removeItem(key)
  }
  
  // 跳转到结果页
  router.push({
    path: '/exam/result/' + examRecord.timestamp,
    state: { record: examRecord }
  })
}

// 返回
const handleBack = async () => {
  if (examStarted.value) {
    try {
      await ElMessageBox.confirm(
        '考试尚未提交，确定要退出吗？进度将会保存。',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      if (timer.value) {
        clearInterval(timer.value)
      }
      saveProgress()
      router.back()
    } catch {
      // 取消退出
    }
  } else {
    router.back()
  }
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
  return map[type] || 'primary'
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
.exam-page {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.timer-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #f56c6c;
  color: white;
  padding: 0.375rem 0.625rem;
  border-radius: 16px;
  font-weight: 600;
  font-size: 0.75rem;
  user-select: none;
}

.answer-card-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #409eff;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  font-size: 1rem;
}

.answer-card-badge:active {
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

/* 开始页面 */
.exam-start {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
}

.start-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.start-icon {
  font-size: 4rem;
  color: #409eff;
  margin-bottom: 1rem;
}

.start-card h2 {
  font-size: 1.5rem;
  margin: 0 0 1.5rem 0;
  color: #303133;
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f5f7fa;
  border-radius: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: #606266;
  font-size: 0.875rem;
}

.info-value {
  color: #303133;
  font-weight: 600;
}

/* 考试内容 */
.exam-content {
  max-width: 900px;
  margin: 0 auto;
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
  margin: 0 0 0.75rem 0;
  font-weight: 500;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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

.option-content {
  flex: 1;
  color: #303133;
  line-height: 1.6;
  font-size: 0.875rem;
}

/* 底部操作栏 */
.page-footer {
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
}

.page-footer .el-button {
  flex: 1;
}

.page-footer .el-button.is-text {
  flex: 0.5;
  color: #606266;
}

.page-footer .el-button.is-text:not(:disabled):hover {
  color: #409eff;
  background: transparent;
}

/* 答题卡 */
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

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #909399;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #409eff;
}

.stat-value.timer {
  color: #f56c6c;
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
  transition: all 0.3s;
  -webkit-tap-highlight-color: transparent;
}

.sheet-item:hover {
  border-color: #409eff;
  color: #409eff;
}

.sheet-item.answered {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
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

/* 提交确认 */
.submit-confirm {
  text-align: center;
  padding: 1rem 0;
}

.warning-icon {
  font-size: 4rem;
  color: #e6a23c;
  margin-bottom: 1rem;
}

.submit-confirm p {
  font-size: 1.125rem;
  color: #303133;
  margin: 0 0 1rem 0;
}

.submit-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  color: #606266;
  font-size: 0.875rem;
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

  .timer-badge {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }

  .page-content {
    padding: 1rem;
  }

  .start-card {
    padding: 1.5rem;
  }

  .start-icon {
    font-size: 3rem;
  }

  .question-item {
    padding: 1rem;
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
</style>
