<template>
  <div class="exam-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <div class="header-info">
          <div class="header-main">
            <h1 class="page-title">{{ route.query?.chapterName || '章节考试' }}</h1>
            <el-tag size="small" type="danger" effect="plain">考试模式</el-tag>
          </div>
          <p class="course-name">{{ route.query?.curriculumName || courseStore.currentCourse?.cName ||
            courseStore.currentCourse?.name }}</p>
        </div>
        <div class="header-actions">
          <div class="timer-badge">
            <el-icon>
              <Clock />
            </el-icon>
            <span>{{ formatTime(remainingTime) }}</span>
          </div>
          <div class="answer-card-badge" @click="showAnswerSheet = true">
            <el-icon>
              <Grid />
            </el-icon>
          </div>
        </div>
      </div>
    </div>

    <div class="practice-container">
      <el-skeleton :loading="loading" animated>
        <template #template>
          <div class="page-content">
            <div class="question-card">
              <div class="question-header">
                <el-skeleton-item variant="button" style="width: 60px; height: 24px;" />
                <el-skeleton-item variant="text" style="width: 40px;" />
              </div>
              <div class="question-content">
                <el-skeleton-item variant="h3" style="width: 80%; margin-bottom: 8px;" />
                <el-skeleton-item variant="h3" style="width: 40%;" />
              </div>
              <div class="options-list">
                <div v-for="i in 4" :key="i" class="option-item" style="pointer-events: none;">
                  <div class="option-label" style="background: transparent;">
                    <el-skeleton-item variant="circle" style="width: 24px; height: 24px;" />
                  </div>
                  <div class="option-content">
                    <el-skeleton-item variant="text" style="width: 60%;" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </template>
        <!-- 内容区域 -->
        <template #default>
          <div class="page-content">
            <div v-if="!examStarted" class="exam-start">
              <div class="start-card">
                <el-icon class="start-icon">
                  <Edit />
                </el-icon>
                <h2>开始考试</h2>
                <div class="exam-info">
                  <div class="info-item">
                    <span class="info-label">题目数量</span>
                    <span class="info-value">
                      <el-select v-model="timer" size="small" style="width:60px"
                        :default-value="total < 30 ? total : 30" :options="opentions" placeholder="选择题目数量" />
                      题
                    </span>
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
                      <el-tag :type="getDifficultyTag(currentQuestion.difficulty)" effect="plain">
                        {{ getDifficultyName(currentQuestion.difficulty) }}
                      </el-tag>
                    </div>

                    <div class="question-content">
                      <p class="question-text">{{ currentIndex + 1 }}. {{ currentQuestion.subject }}</p>
                      <p v-if="currentQuestion.type === 'multiple'" class="question-hint">（多选题，选择完后请点击下一题）</p>
                    </div>

                    <!-- 选项列表 -->
                    <div class="options-list" :key="`options-${currentQuestion.id}-${renderKey}`"
                      v-show="!isTransitioning">
                      <div v-for="(option, index) in currentQuestion.options"
                        :key="`${currentQuestion.id}-opt-${index}-${renderKey}`" class="option-item"
                        :class="{ selected: isCurrentQuestionOptionSelected(index) }"
                        @click="handleSelectOption(index)">
                        <div class="option-label">{{ getOptionLabel(index, currentQuestion.type) }}</div>
                        <div class="option-content">{{ option.text }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </template>
      </el-skeleton>

    </div>


    <!-- 底部操作栏 -->
    <div v-if="examStarted" class="page-footer">
      <el-button text :disabled="currentIndex === 0" @click="handlePrevious">
        上一题
      </el-button>

      <el-button v-if="currentIndex < questions.length - 1" type="primary" @click="handleNext">
        下一题
      </el-button>

      <el-button v-else type="primary" @click="handleSubmitConfirm">
        提交试卷
      </el-button>
    </div>

    <!-- 答题卡抽屉 -->
    <el-drawer v-model="showAnswerSheet" title="答题卡" size="80%" :style="{ maxWidth: '400px' }">
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
              <div v-for="item in singleQuestions" :key="item.question.id" class="sheet-item" :class="{
                answered: userAnswers[item.index] && (Array.isArray(userAnswers[item.index]) ? userAnswers[item.index].length > 0 : true),
                active: currentIndex === item.index
              }" @click="jumpToQuestion(item.index)">
                {{ item.index + 1 }}
              </div>
            </div>
          </div>

          <!-- 多选题 -->
          <div v-if="multipleQuestions.length > 0" class="question-group">
            <div class="group-title">多选题 ({{ multipleQuestions.length }})</div>
            <div class="sheet-grid">
              <div v-for="item in multipleQuestions" :key="item.question.id" class="sheet-item" :class="{
                answered: userAnswers[item.index] && (Array.isArray(userAnswers[item.index]) ? userAnswers[item.index].length > 0 : true),
                active: currentIndex === item.index
              }" @click="jumpToQuestion(item.index)">
                {{ item.index + 1 }}
              </div>
            </div>
          </div>

          <!-- 判断题 -->
          <div v-if="judgeQuestions.length > 0" class="question-group">
            <div class="group-title">判断题 ({{ judgeQuestions.length }})</div>
            <div class="sheet-grid">
              <div v-for="item in judgeQuestions" :key="item.question.id" class="sheet-item" :class="{
                answered: userAnswers[item.index] && (Array.isArray(userAnswers[item.index]) ? userAnswers[item.index].length > 0 : true),
                active: currentIndex === item.index
              }" @click="jumpToQuestion(item.index)">
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
    <el-dialog v-model="showUnansweredDialog" title="提示" width="90%" :style="{ maxWidth: '400px' }">
      <div class="submit-confirm">
        <el-icon class="warning-icon">
          <WarningFilled />
        </el-icon>
        <p>还有 {{ unansweredCount }} 道题未答！</p>
        <p style="font-size: 0.875rem; color: #909399; margin-top: 0.5rem;">是否跳转到第一道未答题？</p>
      </div>
      <template #footer>
        <el-button @click="showUnansweredDialog = false">取消</el-button>
        <el-button type="primary" @click="jumpToFirstUnanswered">跳转</el-button>
      </template>
    </el-dialog>

    <!-- 提交确认对话框 -->
    <el-dialog v-model="showSubmitDialog" title="提交确认" width="90%" :style="{ maxWidth: '400px' }">
      <div class="submit-confirm">
        <el-icon class="warning-icon">
          <WarningFilled />
        </el-icon>
        <p>确定要提交试卷吗？</p>
        <div class="submit-stats">
          <span>已答 {{ answeredCount }} 题</span>
          <span>未答 {{ unansweredCount }} 题</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showSubmitDialog = false">取消</el-button>
        <el-button type="primary" @click="submitExam(false)">确认提交</el-button>
      </template>
    </el-dialog>

    <!-- 提交加载遮罩 -->
    <div v-if="submitting" class="submitting-overlay">
      <div class="submitting-content">
        <el-icon class="rotating">
          <Loading />
        </el-icon>
        <p>正在提交试卷...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { ArrowLeft, Clock, Edit, List, Select, WarningFilled, Grid, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import examAPI from '@/api/exam'

const router = useRouter()
const route = useRoute()
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
const examId = ref(0)

// UI状态
const showAnswerSheet = ref(false)
const showSubmitDialog = ref(false)
const showUnansweredDialog = ref(false)
const isTransitioning = ref(true) // 初始为true，防止首次渲染时误显示选中状态
const renderKey = ref(0) // 强制重新渲染
const loading = ref(false)
const submitting = ref(false) // 提交中的加载状态
const isManualSubmit = ref(false) // 标记是否为手动提交

const total = route.query.questionCount
// 当前题目
const currentQuestion = computed(() => questions.value[currentIndex.value] || {})

// 统计数据
const answeredCount = computed(() =>
  userAnswers.value.filter(a => Array.isArray(a) ? a.length > 0 : a).length
)
const unansweredCount = computed(() => questions.value.length - answeredCount.value)

// 题目分组
const singleQuestions = computed(() =>
  questions.value.map((q, index) => ({ question: q, index })).filter(item => item.question.type === 1)
)
const multipleQuestions = computed(() =>
  questions.value.map((q, index) => ({ question: q, index })).filter(item => item.question.type === 2)
)
const judgeQuestions = computed(() =>
  questions.value.map((q, index) => ({ question: q, index })).filter(item => item.question.type === 3)
)
const opentions = ref([
  { label: `全部(${total})`, value: total, disabled: total >= 30 },
  { label: '30', value: 30, disabled: !(total >= 30) },
  { label: '50', value: 50, disabled: !(total >= 50) },
  { label: '100', value: 100, disabled: !(total >= 100) }
]
);


// 初始化
onMounted(() => {
  timer.value = total < 30 ? total : 30
  
  // 检查是否有刷新前的提交记录
  const lastSubmitLog = localStorage.getItem('exam_submit_log')
  if (lastSubmitLog) {
    const log = JSON.parse(lastSubmitLog)
    ElMessage({
      type: 'info',
      message: `检测到上次刷新时自动提交了试卷（${new Date(log.timestamp).toLocaleTimeString()}）`,
      duration: 5000,
      showClose: true
    })
    // 清除日志
    localStorage.removeItem('exam_submit_log')
  }
  
  // 监听页面刷新，显示提示
  window.addEventListener('beforeunload', handleBeforeUnload)
  // 监听页面可见性变化（用户切换标签页等）
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 延迟解锁，确保页面完全渲染后再显示选项状态
  setTimeout(() => {
    isTransitioning.value = false
  }, 500)
})

// 清理定时器和事件监听
onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
// 路由离开守卫（返回按钮）
onBeforeRouteLeave(async (to, from, next) => {
  // 如果是手动提交跳转，直接放行
  if (isManualSubmit.value) {
    next()
    return
  }
  
  if (examStarted.value) {
    try {
      await ElMessageBox.confirm(
        '离开页面将自动提交试卷，确定要离开吗？',
        '提示',
        {
          confirmButtonText: '确定离开',
          cancelButtonText: '继续答题',
          type: 'warning'
        }
      )
      // 显示加载动画
      submitting.value = true
      // 清理定时器
      if (timer.value) {
        clearInterval(timer.value)
      }
      // 先重置状态，避免重复弹窗
      examStarted.value = false
      // 自动提交试卷
      await submitExam(true)
      // 提交成功后会自动跳转，不需要 next()
    } catch {
      // 取消离开
      next(false)
    }
  } else {
    next()
  }
})

// 页面可见性变化时的处理
const handleVisibilityChange = () => {
  // 当页面隐藏时（用户关闭标签页、刷新等），尝试提交
  if (document.hidden && examStarted.value) {
    console.log('页面隐藏，准备提交试卷...')
    submitDataBeforeLeave()
  }
}

// 页面刷新/关闭时的处理
// 在页面关闭前提交数据
const submitDataBeforeLeave = () => {
  const payload = questions.value.map((q, index) => {
    const ans = userAnswers.value[index]
    const ansStr = Array.isArray(ans) ? ans.join('') : (ans || '')
    return {
      subjectId: q.id,
      answer: ansStr
    }
  })
  
  const submitData = {
    examId: examId.value,
    answers: payload,
    autoSubmit: true
  }
  
  try {
    // 记录提交日志到本地存储（刷新后可以看到）
    const submitLog = {
      timestamp: Date.now(),
      examId: examId.value,
      questionCount: questions.value.length,
      answeredCount: userAnswers.value.filter(a => Array.isArray(a) && a.length > 0).length
    }
    localStorage.setItem('exam_submit_log', JSON.stringify(submitLog))
    
    // 使用 sendBeacon API（专为页面卸载场景设计）
    const blob = new Blob([JSON.stringify(submitData)], { type: 'application/json' })
    const apiUrl = import.meta.env.VITE_API_BASE_URL || ''
    const url = `${apiUrl}/api/exam/submit`
    const success = navigator.sendBeacon(url, blob)
    
    console.log(success ? '✅ 试卷已发送' : '⚠️ 发送失败')
  } catch (error) {
    console.error('❌ 提交失败:', error)
  }
}

// 处理页面刷新/关闭事件
const handleBeforeUnload = (e) => {
  if (examStarted.value && !submitting.value) {
    submitDataBeforeLeave()
  }
}

const loadQuestions = async (type = 'first') => {
  // 加载时锁定，防止误操作
  isTransitioning.value = true
  loading.value = true
  try {
    // 从接口加载题目
    const data = await examAPI.getExamPaper(
      {
        curriculumId: route.query.courseId,
        chapterId: route.query.chapterId,
        curriculumName: route.query.curriculumName,
        chapterName: route.query.chapterName,
        count: timer.value || total || 30
      }
    )
    const loadedQuestions = data?.subjectList || []
    // 按题型排序：1-单选题，2-多选题，3-判断题
    questions.value = sortQuestionsByType(loadedQuestions)
    examId.value = data?.examId || 0
  } finally {
    loading.value = false
  }
  // 加载完成后不立即解锁，由调用方处理
}

// 按题型排序题目
const sortQuestionsByType = (questionList) => {
  return [...questionList].sort((a, b) => {
    // 先按题型排序：1(单选) < 2(多选) < 3(判断)
    if (a.type !== b.type) {
      return a.type - b.type
    }
    // 同一题型保持原有顺序
    return 0
  })
}

// 开始考试
const startExam = async () => {
  // 开始考试时锁定，防止误点击
  isTransitioning.value = true
  examStarted.value = true
  remainingTime.value = examDuration.value * 60
  
  // 先加载题目
  await loadQuestions()
  
  // 加载完成后再初始化答案数组（确保长度正确）
  userAnswers.value = new Array(questions.value.length).fill(null).map(() => [])
  
  // 开始计时
  startTimer()
  
  // 强制重新渲染，清除任何意外的选中状态
  renderKey.value++
  
  // 延迟解锁，等待题目完全渲染后再允许交互
  setTimeout(() => {
    isTransitioning.value = false
  }, 500)
}

// 开始计时
const startTimer = () => {
  timer.value = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      clearInterval(timer.value)
      ElMessage.warning('考试时间到，自动提交')
      submitExam(true)
    }
  }, 1000)
}

// 判断答案是否选中
// const isAnswerSelected = (questionIndex, optionIndex) => {
//   const question = questions.value[questionIndex]
//   const label = getOptionLabel(optionIndex, question.type)
//   const answers = userAnswers.value[questionIndex]
//   return Array.isArray(answers) ? answers.includes(label) : answers === label
// }

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

  if (currentQuestion.value.type === 2) {
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
  } else {
    // 单选题和判断题：自动跳转下一题
    // 立即上锁，防止重复点击
    isTransitioning.value = true

    const currentIdx = currentIndex.value
    userAnswers.value[currentIdx] = [label]

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
// const selectAnswer = (questionIndex, optionIndex) => {
//   const question = questions.value[questionIndex]
//   const label = getOptionLabel(optionIndex, question.type)

//   if (question.type === 2) {
//     if (!Array.isArray(userAnswers.value[questionIndex])) {
//       userAnswers.value[questionIndex] = []
//     }
//     const answers = userAnswers.value[questionIndex]
//     const idx = answers.indexOf(label)
//     if (idx > -1) {
//       answers.splice(idx, 1)
//     } else {
//       answers.push(label)
//     }
//   } else {
//     userAnswers.value[questionIndex] = [label]
//   }
//   saveProgress()
// }

// 获取选项标签
const getOptionLabel = (index, questionType) => {
  if (questionType === 3) {
    return index === 0 ? 'A' : 'B'
  }
  return String.fromCharCode(65 + index)
}

// 上一题
const handlePrevious = () => {
  if (currentIndex.value > 0) {
    // 立即开始过渡并清除视觉选中状态
    isTransitioning.value = true
    
    // 使用 requestAnimationFrame 确保状态清除后再切换
    requestAnimationFrame(() => {
      currentIndex.value--
      renderKey.value++
      scrollToTop()
      
      // 延迟结束过渡
      setTimeout(() => {
        isTransitioning.value = false
      }, 350)
    })
  }
}

// 下一题
const handleNext = () => {
  if (currentIndex.value < questions.value.length - 1) {
    // 立即开始过渡并清除视觉选中状态
    isTransitioning.value = true
    
    // 使用 requestAnimationFrame 确保状态清除后再切换
    requestAnimationFrame(() => {
      currentIndex.value++
      renderKey.value++
      scrollToTop()
      
      // 延迟结束过渡
      setTimeout(() => {
        isTransitioning.value = false
      }, 350)
    })
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
  // 立即开始过渡并清除视觉选中状态
  isTransitioning.value = true
  showAnswerSheet.value = false
  
  // 使用 requestAnimationFrame 确保状态清除后再切换
  requestAnimationFrame(() => {
    currentIndex.value = index
    renderKey.value++
    scrollToTop()
    
    // 延迟结束过渡
    setTimeout(() => {
      isTransitioning.value = false
    }, 350)
  })
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
  submitting.value = true
  // 如果不是自动提交，设置手动提交标志
  if (!autoSubmit) {
    isManualSubmit.value = true
  }
  
  if (timer.value) {
    clearInterval(timer.value)
  }
  const payload = questions.value.map((q, index) => {
    const ans = userAnswers.value[index]
    // 把数组 ['A', 'B'] 转成字符串 "AB"，如果是空数组转成 ""
    const ansStr = Array.isArray(ans) ? ans.join('') : (ans || '')

    return {
      subjectId: q.id,
      answer: ansStr
    }
  })
  showSubmitDialog.value = false
  showAnswerSheet.value = false


  try {
    const data = await examAPI.submitExam({
      answers: payload,
      examId: examId.value
    })
    ElMessage.success(autoSubmit ? '考试时间到，试卷已自动提交' : '试卷提交成功')

    const serverData = data || {}
    const recordData = {
      // --- 来自后端的数据 ---
      score: serverData.score,
      correctCount: serverData.rightCount,
      wrongCount: serverData.wrongCount,
      totalCount: serverData.totalQuestion,

      // --- 我们可以计算出的数据 ---
      // 未答数 = 总数 - 对的 - 错的
      unansweredCount: serverData.totalQuestion - serverData.rightCount - serverData.wrongCount,

      // --- 来自前端本地的数据 ---
      // 计算用时 (总时长 - 剩余时长)
      duration: (examDuration.value * 60) - remainingTime.value,
      courseName: route.query.curriculumName,
      chapterName: route.query.chapterName,
      timestamp: Date.now(),
      autoSubmit: autoSubmit
    }
    // 3. 跳转并携带数据
    router.replace({
      path: '/exam/result/' + examId.value,
      state: {
        record: JSON.parse(JSON.stringify(recordData))
      }
    })
  } catch (error) {
    submitting.value = false
    isManualSubmit.value = false
    ElMessage.error('提交试卷失败，请稍后重试')
    return
  }
}

// 返回（由路由守卫处理提交逻辑）
const handleBack = () => {
  router.back()
}

// 题目类型名称
const getQuestionTypeName = (type) => {
  const map = {
    1: '单选题',
    2: '多选题',
    3: '判断题'
  }
  return map[type] || '未知'
}

// 题目类型标签
const getQuestionTypeTag = (type) => {
  const map = {
    1: 'primary',
    2: 'warning',
    3: 'info'
  }
  return map[type] || 'primary'
}

// 难度名称
const getDifficultyName = (difficulty) => {
  const map = {
    1: '简单',
    2: '中等',
    3: '困难'
  }
  return map[difficulty] || '未知'
}

// 难度标签类型
const getDifficultyTag = (difficulty) => {
  const map = {
    1: 'success',  // 简单 - 绿色
    2: 'warning',  // 中等 - 橙色
    3: 'danger'    // 困难 - 红色
  }
  return map[difficulty] || 'info'
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


.practice-container {
  /* 1. 占据剩余空间 */
  flex: 1;

  /* 2. 关键：强制限制最小高度为0，防止被内容撑爆 */
  min-height: 0;

  /* 3. 关键：滚动条加在这里！ */
  overflow-y: auto;

  /* 优化移动端滚动体验 */
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.page-header {
  /* 🛑 关键：禁止被压缩 🛑 */
  flex-shrink: 0;

  /* 你的原有样式 */
  background: white;
  border-bottom: 1px solid #e4e7ed;

  /* 确保有内边距撑开高度 */
  padding: 1rem 1.5rem;
  z-index: 10;
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
  z-index: 10;
  /* 移动端关键修复 */
  position: relative;
  min-height: 68px;
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
  .exam-page {
    /* iOS Safari 100vh修复 */
    height: 100vh;
    height: -webkit-fill-available;
    min-height: 100vh;
    min-height: -webkit-fill-available;
  }

  .practice-container {
    /* 确保容器能正确滚动 */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

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

  .page-footer {
    /* 移动端底部固定 */
    padding: 1rem;
    gap: 0.75rem;
    flex-shrink: 0;
    position: relative;
    /* 确保显示在最上层 */
    z-index: 100;
  }

  .page-footer .el-button {
    font-size: 0.875rem;
    height: 40px;
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

/* 提交加载遮罩 */
.submitting-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.submitting-content {
  background: white;
  border-radius: 16px;
  padding: 3rem 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.submitting-content .el-icon {
  font-size: 48px;
  color: #409eff;
}

.submitting-content p {
  font-size: 1.125rem;
  color: #303133;
  margin: 0;
  font-weight: 500;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 767px) {
  .submitting-content {
    padding: 2rem 3rem;
  }
  
  .submitting-content .el-icon {
    font-size: 40px;
  }
  
  .submitting-content p {
    font-size: 1rem;
  }
}
</style>
