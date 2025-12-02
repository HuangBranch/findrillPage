<template>
  <div class="practice-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <div class="header-info">
          <h1 class="page-title">错题练习</h1>
          <p class="course-name">{{ courseName }}</p>
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
                    
                    <!-- 掌握情况 -->
                    <div v-if="userAnswers[currentIndex]?.isCorrect" class="mastery-section">
                      <el-button type="success" plain size="small" @click="removeFromWrong">
                        已掌握，从错题本移除
                      </el-button>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </transition>
      </div>

      <el-empty v-else description="暂无错题" />
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
    </div>

    <!-- 答题卡抽屉 -->
    <el-drawer
      v-model="showAnswerCard"
      title="答题卡"
      size="80%"
      :style="{ maxWidth: '400px' }"
    >
      <div class="answer-card">
        <div class="card-stats">
          <div class="stat-item">
            <span class="stat-label">已答</span>
            <span class="stat-value">{{ answeredCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">未答</span>
            <span class="stat-value">{{ unansweredCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">答对</span>
            <span class="stat-value correct">{{ correctAnsweredCount }}</span>
          </div>
        </div>
        
        <el-divider />
        
        <div class="card-content">
          <!-- 按题目类型分类显示 -->
          <div v-if="questionsByType.single.length > 0" class="card-type-section">
            <div class="type-header">
              <span class="type-title">单选题</span>
              <span class="type-count">{{ questionsByType.single.length }} 题</span>
            </div>
            <div class="card-grid">
              <div
                v-for="item in questionsByType.single"
                :key="item.originalIndex"
                class="card-item"
                :class="{
                  answered: userAnswers[item.originalIndex],
                  correct: userAnswers[item.originalIndex]?.isCorrect,
                  wrong: userAnswers[item.originalIndex] && !userAnswers[item.originalIndex]?.isCorrect,
                  active: currentIndex === item.originalIndex
                }"
                @click="jumpToQuestion(item.originalIndex)"
              >
                {{ item.originalIndex + 1 }}
              </div>
            </div>
          </div>

          <div v-if="questionsByType.multiple.length > 0" class="card-type-section">
            <div class="type-header">
              <span class="type-title">多选题</span>
              <span class="type-count">{{ questionsByType.multiple.length }} 题</span>
            </div>
            <div class="card-grid">
              <div
                v-for="item in questionsByType.multiple"
                :key="item.originalIndex"
                class="card-item"
                :class="{
                  answered: userAnswers[item.originalIndex],
                  correct: userAnswers[item.originalIndex]?.isCorrect,
                  wrong: userAnswers[item.originalIndex] && !userAnswers[item.originalIndex]?.isCorrect,
                  active: currentIndex === item.originalIndex
                }"
                @click="jumpToQuestion(item.originalIndex)"
              >
                {{ item.originalIndex + 1 }}
              </div>
            </div>
          </div>

          <div v-if="questionsByType.judge.length > 0" class="card-type-section">
            <div class="type-header">
              <span class="type-title">判断题</span>
              <span class="type-count">{{ questionsByType.judge.length }} 题</span>
            </div>
            <div class="card-grid">
              <div
                v-for="item in questionsByType.judge"
                :key="item.originalIndex"
                class="card-item"
                :class="{
                  answered: userAnswers[item.originalIndex],
                  correct: userAnswers[item.originalIndex]?.isCorrect,
                  wrong: userAnswers[item.originalIndex] && !userAnswers[item.originalIndex]?.isCorrect,
                  active: currentIndex === item.originalIndex
                }"
                @click="jumpToQuestion(item.originalIndex)"
              >
                {{ item.originalIndex + 1 }}
              </div>
            </div>
          </div>
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
        <el-button type="primary" @click="handleFinish">返回错题本</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, CircleCheck, CircleClose, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()

// 题目数据
const questions = ref([])
const currentIndex = ref(0)
const selectedAnswer = ref([])
const showAnswer = ref(false)
const showSummary = ref(false)
const showAnswerCard = ref(false)
const userAnswers = ref([])
const isTransitioning = ref(true)
const renderKey = ref(0)
const courseName = ref('')

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

// 按题目类型分组
const questionsByType = computed(() => {
  const result = {
    single: [],
    multiple: [],
    judge: []
  }
  
  questions.value.forEach((q, index) => {
    const item = { ...q, originalIndex: index }
    if (q.type === 'single') {
      result.single.push(item)
    } else if (q.type === 'multiple') {
      result.multiple.push(item)
    } else if (q.type === 'judge') {
      result.judge.push(item)
    }
  })
  
  return result
})

// 判断选项是否被选中
const isOptionSelected = (index) => {
  if (isTransitioning.value) return false
  if (!currentQuestion.value || !currentQuestion.value.id) return false
  
  const label = getOptionLabel(index)
  return selectedAnswer.value.includes(label)
}

// 统计数据
const correctCount = computed(() => userAnswers.value.filter(a => a?.isCorrect).length)
const wrongCount = computed(() => userAnswers.value.filter(a => a && !a.isCorrect).length)
const accuracy = computed(() => {
  if (userAnswers.value.length === 0) return 0
  return Math.round((correctCount.value / userAnswers.value.length) * 100)
})

// 初始化
onMounted(() => {
  loadWrongQuestions()
  setTimeout(() => {
    isTransitioning.value = false
  }, 350)
})

// 加载错题
const loadWrongQuestions = () => {
  const courseId = route.query.courseId
  const saved = localStorage.getItem('wrong_questions')
  
  if (saved) {
    const allWrong = JSON.parse(saved)
    
    if (courseId) {
      questions.value = allWrong.filter(q => q.courseId == courseId)
      if (questions.value.length > 0) {
        courseName.value = questions.value[0].courseName
      }
    } else {
      questions.value = allWrong
      courseName.value = '全部错题'
    }
    
    // 初始化用户答案数组
    userAnswers.value = new Array(questions.value.length).fill(null)
  }
}

// 选择选项
const handleSelectOption = (index) => {
  if (showAnswer.value || isTransitioning.value) return
  
  const label = getOptionLabel(index)
  const currentType = currentQuestion.value.type
  
  if (currentType === 'multiple') {
    const idx = selectedAnswer.value.indexOf(label)
    if (idx > -1) {
      selectedAnswer.value.splice(idx, 1)
    } else {
      selectedAnswer.value.push(label)
    }
  } else {
    selectedAnswer.value = [label]
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
  return String.fromCharCode(65 + index)
}

// 提交答案
const handleSubmit = () => {
  if (selectedAnswer.value.length === 0) {
    ElMessage.warning('请选择答案')
    return
  }

  const correctAnswers = currentQuestion.value.options
    .map((opt, idx) => opt.isCorrect ? getOptionLabel(idx) : null)
    .filter(Boolean)
  
  const userAnswerStr = selectedAnswer.value.sort().join('')
  const correctAnswerStr = correctAnswers.sort().join('')
  const isCorrect = userAnswerStr === correctAnswerStr

  userAnswers.value[currentIndex.value] = {
    questionId: currentQuestion.value.id,
    userAnswer: userAnswerStr,
    correctAnswer: correctAnswerStr,
    isCorrect,
    timestamp: Date.now()
  }

  showAnswer.value = true

  ElMessage({
    type: isCorrect ? 'success' : 'error',
    message: isCorrect ? '回答正确！' : '回答错误，请查看解析',
    duration: 1500
  })
}

// 从错题本移除
const removeFromWrong = async () => {
  try {
    await ElMessageBox.confirm('确定已掌握这道题吗？将从错题本中移除', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const saved = localStorage.getItem('wrong_questions')
    if (saved) {
      const allWrong = JSON.parse(saved)
      const newWrong = allWrong.filter(q => q.timestamp !== currentQuestion.value.timestamp)
      localStorage.setItem('wrong_questions', JSON.stringify(newWrong))
      
      // 从当前列表中移除
      questions.value.splice(currentIndex.value, 1)
      userAnswers.value.splice(currentIndex.value, 1)
      
      // 调整当前索引
      if (currentIndex.value >= questions.value.length) {
        currentIndex.value = Math.max(0, questions.value.length - 1)
      }
      
      // 重置当前题目状态
      resetQuestion()
      
      ElMessage.success('已从错题本移除')
      
      // 如果没有题目了，返回错题列表
      if (questions.value.length === 0) {
        router.push('/wrong')
      }
    }
  } catch {
    // 用户取消
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
  if (currentQuestion.value.type === 'multiple' && !showAnswer.value && selectedAnswer.value.length > 0) {
    handleSubmit()
    return
  }
  
  if (currentIndex.value < questions.value.length - 1) {
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
    selectedAnswer.value = saved.userAnswer ? saved.userAnswer.split('') : []
    showAnswer.value = true
  } else {
    selectedAnswer.value = []
    showAnswer.value = false
  }
}

// 跳转到指定题目
const jumpToQuestion = (index) => {
  isTransitioning.value = true
  currentIndex.value = index
  renderKey.value++
  showAnswerCard.value = false
  resetQuestion()
  
  setTimeout(() => {
    const content = document.querySelector('.page-content')
    if (content) {
      content.scrollTop = 0
    }
    isTransitioning.value = false
  }, 350)
}

// 完成练习
const handleFinish = () => {
  router.push('/wrong')
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
/* 复用 PracticeMode 的样式 */
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #303133;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-name {
  font-size: 0.75rem;
  color: #909399;
  margin: 0.25rem 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-badge {
  padding: 0.375rem 0.75rem;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.question-container {
  max-width: 800px;
  margin: 0 auto;
}

.question-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.question-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.question-difficulty {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.difficulty-easy {
  background: #f0f9ff;
  color: #67c23a;
}

.difficulty-medium {
  background: #fdf6ec;
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
  line-height: 1.8;
  color: #303133;
  margin: 0;
}

.question-hint {
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
  color: #409eff;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.analysis-content {
  color: #606266;
  line-height: 1.6;
}

.correct-answer {
  margin: 0 0 0.75rem 0;
  color: #67c23a;
}

.analysis-text {
  margin: 0;
}

.mastery-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e4e7ed;
}

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

/* 答题卡样式 */
.answer-card {
  padding: 0;
}

.card-stats {
  display: flex;
  justify-content: space-around;
  padding: 1rem 0;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: #909399;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: #409eff;
}

.stat-value.correct {
  color: #67c23a;
}

.stat-value.wrong {
  color: #f56c6c;
}

.card-content {
  padding: 0 1rem 1rem;
}

.card-type-section {
  margin-bottom: 1.5rem;
}

.card-type-section:last-child {
  margin-bottom: 0;
}

.type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e4e7ed;
}

.type-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #303133;
}

.type-count {
  font-size: 0.75rem;
  color: #909399;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
}

.card-item {
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
}

.card-item:hover {
  border-color: #409eff;
  color: #409eff;
}

.card-item.answered {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}

.card-item.correct {
  background: #f0f9ff;
  border-color: #67c23a;
  color: #67c23a;
}

.card-item.wrong {
  background: #fef0f0;
  border-color: #f56c6c;
  color: #f56c6c;
}

.card-item.active {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

/* 总结对话框 */
.summary-content {
  padding: 1rem 0;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
}

.summary-stats .stat-item {
  text-align: center;
}

.summary-stats .stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 0.5rem;
}

.summary-stats .stat-value.correct {
  color: #67c23a;
}

.summary-stats .stat-value.wrong {
  color: #f56c6c;
}

.summary-stats .stat-label {
  display: block;
  font-size: 0.875rem;
  color: #909399;
}

/* 动画 */
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

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(7, 1fr);
    gap: 0.25rem;
  }
  
  .card-item {
    height: 34px;
    font-size: 0.75rem;
  }
}
</style>
