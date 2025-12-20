<template>
  <div class="practice-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <div class="header-info">
          <div class="header-main">
            <h1 class="page-title">{{ route.query?.chapterName || '章节测试'}}</h1>
            <el-tag size="small" type="success" effect="plain">刷题模式</el-tag>
          </div>
          <p class="course-name">{{ route.query?.curriculumName || '未知课程'}}</p>
        </div>
        <div class="progress-badge" @click="showAnswerCard = true">{{ currentIndex + 1 }}/{{ total }}</div>
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
                <div 
                  v-for="i in 4" 
                  :key="i" 
                  class="option-item"
                  style="pointer-events: none;" 
                >
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
        <template #default>
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
                    <el-tag :type="getDifficultyTag(currentQuestion.difficulty)" effect="plain">
                      {{ getDifficultyName(currentQuestion.difficulty) }}
                    </el-tag>
                  </div>
                  
                  <div class="question-content">
                    <p class="question-text">{{ currentIndex + 1 }}. {{ currentQuestion.subject }}</p>
                    <p v-if="currentQuestion.type === 2" class="question-hint">（多选题，选择完毕后请点击下一题）</p>
                  </div>

                  <!-- 选项列表 -->
                  <div class="options-list" :key="`options-${currentQuestion.id}-${renderKey}`" v-show="!isTransitioning">
                    <div
                      v-for="(option, index) in currentQuestion.options"
                      :key="`${currentQuestion.id}-opt-${index}-${renderKey}`"
                      class="option-item"
                      :class="{
                        selected: isOptionSelected(index),
                        correct: showAnswer && isOptionCorrect(index),
                        wrong: showAnswer && isOptionSelected(index) && !isOptionCorrect(index)
                      }"
                      @click="handleSelectOption(index)"
                    >
                      <div class="option-label">{{ getOptionLabel(index) }}</div>
                      <div class="option-content">{{ option.text }}</div>
                      <div v-if="showAnswer" class="option-icon">
                        <el-icon v-if="isOptionCorrect(index)" color="#67c23a"><CircleCheck /></el-icon>
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
                        <p class="correct-answer">
                          <strong>知识点：</strong>
                          {{ currentQuestion.knowledgePoint || '暂无知识点' }}
                        </p>
                        <p class="correct-answer">
                          <strong>解析：</strong>
                          {{ currentQuestion.analysis || '暂无解析' }}
                        </p>
                      </div>
                    </div>
                  </transition>
                  </div>
                </div>
              </transition>
            </div>

            <el-empty v-else description="暂无题目" />
          </div>
        </template>
      </el-skeleton>
    </div>
    <!-- 底部操作栏 -->
    <div class="page-footer">
      <el-button
        v-if="currentIndex > 0"
        @click="handlePrevious"
      >
        上一题
      </el-button>
      
      <el-button
        v-if="currentIndex < Number(total) - 1"
        @click="handleNext"
      >
        下一题
      </el-button>
      
      <el-button
        v-if="currentQuestion.type === 2 && !showAnswer && hasAnswer"
        type="primary"
        @click="handleSubmit"
      >
        提交答案
      </el-button>
      
      <el-button
        v-else
        type="primary"
        :disabled="questions.length <= 0"
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
import practiceApi from '@/api/practice'

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
const examId = ref(null)
const loading = ref(null)
const total = ref(0)

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
  questions.value.map((q, index) => ({ question: q, index })).filter(item => item.question.type === 1)
)
const multipleQuestions = computed(() => 
  questions.value.map((q, index) => ({ question: q, index })).filter(item => item.question.type === 2)
)
const judgeQuestions = computed(() => 
  questions.value.map((q, index) => ({ question: q, index })).filter(item => item.question.type === 3)
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

// 继续加载后面的题目


// 判断当前选项索引是否对应正确答案
const isOptionCorrect = (index) => {
  const q = currentQuestion.value
  if (!q || !q.answer) return false
  const label = getOptionLabel(index)
  // 2. 判断是否在答案里
  // 兼容单选 "A" 和 多选 "A,B" 或 "AB"
  return q.answer.includes(label)
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
  // 延迟解锁，确保页面完全渲染后再显示选项状态
  setTimeout(() => {
    isTransitioning.value = false
  }, 350)
})

// 加载题目
const loadQuestions = async (type = 'first') => {
  console.log(questions.value.length, total.value)
    if (type === 'add') {
      if (questions.value.length >= total.value) return;
      const res = await practiceApi.getPracticeQuestions({
        chapterId: route.query.chapterId,
        chapterName: route.query.chapterName,
        curriculumId: route.query.courseId,
        curriculumName: route.query.curriculumName,
        examId: examId.value,
        page: Math.floor(questions.value.length / 50) + 1,
        pageSize: 50
      });
      const newQuestions = res?.subjectList || []
      // 按题型排序：1-单选题，2-多选题，3-判断题
      const sortedQuestions = sortQuestionsByType(newQuestions)
      questions.value = questions.value.concat(sortedQuestions)
      return
    }
    loading.value = true
    const res = await practiceApi.getPracticeQuestions({
      chapterId: route.query.chapterId,
      chapterName: route.query.chapterName,
      curriculumId: route.query.courseId,
      curriculumName: route.query.curriculumName,
      page:1,
      pageSize: 50
    });
    examId.value = res?.examId || null
    const loadedQuestions = res?.subjectList || []
    // 按题型排序：1-单选题，2-多选题，3-判断题
    questions.value = sortQuestionsByType(loadedQuestions)
    total.value = Number(res?.total) || questions.value.length
    loading.value = false
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

// 提交答案到后端
const saveProgress = async (userAnswerStr, isCorrect) => {
  try{
      const submit_answers = await practiceApi.submitPracticeRecord({
        answer: userAnswerStr,
        examId: examId.value,
        subjectId: currentQuestion.value.id,
        isCorrect: isCorrect
      });
      console.log('提交答案成功:', submit_answers);
  }catch (error) {
    console.error('提交答案失败:', error)
  }
  
}

// 选择选项
const handleSelectOption = (index) => {
  if (showAnswer.value || isTransitioning.value) return
  
  const label = getOptionLabel(index)
  const currentType = currentQuestion.value.type
  
  if (currentType === 2) {
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
  if (question.type === 3) {
    return index === 0 ? 'A' : 'B'
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
  const correctAnswers = currentQuestion.value.answer
  
  // 判断是否正确
  const userAnswerStr = selectedAnswer.value.sort().join('')
  const isCorrect = userAnswerStr === correctAnswers

  // 记录答题结果
  userAnswers.value[currentIndex.value] = {
    questionId: currentQuestion.value.id,
    userAnswer: userAnswerStr,
    correctAnswer: correctAnswers,
    isCorrect,
    timestamp: Date.now()
  }

  showAnswer.value = true
  saveProgress(userAnswerStr, isCorrect)

  ElMessage({
    type: isCorrect ? 'success' : 'error',
    message: isCorrect ? '回答正确！' : '回答错误，请查看解析',
    duration: 1500
  })
}

// 获取正确答案
const getCorrectAnswer = () => {
  if (!currentQuestion.value || !currentQuestion.value.options) return ''
  const ans =currentQuestion.value.answer
  return Array.isArray(ans) ? ans.join('、') : ans
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
  if (currentQuestion.value.type === 2 && !showAnswer.value && selectedAnswer.value.length > 0) {
    handleSubmit()
    return
  }

  if (questions.value.length < total.value && currentIndex.value > questions.value.length - 6) loadQuestions('add')
  
  if (currentIndex.value < total.value - 1) {
    isTransitioning.value = true
    currentIndex.value++
    renderKey.value++
    resetQuestion()
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
  if (index < total.value && index >= questions.value.length - 6) loadQuestions('add')
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
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 }
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

  // TODO: 可以在这里调用 API 保存练习记录到服务器
  console.log('练习记录:', practiceRecord)
}

// 完成练习（提交试卷）
const handleFinishPractice = () => {
  showAnswerCard.value = false
  showSummary.value = true
  // savePracticeRecord()
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
  return map[type] || ''
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

/* 内部内容层：不再负责滚动，只负责撑开高度 */
.page-content {
  /* 移除之前的 flex: 1 和 overflow 设置 */
  /* 只需要设置内边距即可 */
  padding: 1.5rem;
  
  /* 确保最小占满容器 */
  min-height: 100%; 
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


/* 底部：固定高度 */
.page-footer {
  flex-shrink: 0; /* 防止被挤压 */
  background: white;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  z-index: 10; /* 确保浮在最上层 */
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
