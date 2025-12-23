<template>
  <div class="practice-page" v-loading.fullscreen.lock="submitLoading" element-loading-text="提交中..."></div>
  <div class="practice-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <div class="header-info">
          <div class="header-main">
            <h1 class="page-title">错题练习</h1>
            <el-tag size="small" type="danger" effect="plain">错题模式</el-tag>
          </div>
          <p class="course-name">{{ courseName }}</p>
        </div>
        <div v-if="!loading" class="progress-badge" @click="showAnswerCard = true">{{ currentIndex + 1 }}/{{ questions.length }}</div>
        <el-skeleton v-else animated style="width: 60px;">
          <template #template>
            <el-skeleton-item variant="text" style="width: 100%;" />
          </template>
        </el-skeleton>
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
                <p class="question-text">{{ currentIndex + 1 }}. {{ currentQuestion.question }}</p>
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
                    <p class="correct-answer">
                      <strong>知识点：</strong>
                      {{ currentQuestion.knowledgePoint || '暂无知识点' }}
                    </p>
                    <p class="correct-answer">
                      <strong>解析：</strong>
                      {{ currentQuestion.analysis || '暂无解析' }}
                    </p>
                    
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
        </template>
      </el-skeleton>
    </div>

    <!-- 底部操作栏 -->
    <div class="page-footer" v-if="!loading">
      <el-button
        v-if="currentIndex > 0"
        @click="handlePrevious"
      >
        上一题
      </el-button>
      
      <el-button
        v-if="currentIndex < questions.length - 1"
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
        完成练习
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
          <div v-if="questionsByType.single.length > 0" class="question-group">
            <div class="group-title">单选题 ({{ questionsByType.single.length }})</div>
            <div class="sheet-grid">
              <div
                v-for="item in questionsByType.single"
                :key="item.originalIndex"
                class="sheet-item"
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

          <!-- 多选题 -->
          <div v-if="questionsByType.multiple.length > 0" class="question-group">
            <div class="group-title">多选题 ({{ questionsByType.multiple.length }})</div>
            <div class="sheet-grid">
              <div
                v-for="item in questionsByType.multiple"
                :key="item.originalIndex"
                class="sheet-item"
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

          <!-- 判断题 -->
          <div v-if="questionsByType.judge.length > 0" class="question-group">
            <div class="group-title">判断题 ({{ questionsByType.judge.length }})</div>
            <div class="sheet-grid">
              <div
                v-for="item in questionsByType.judge"
                :key="item.originalIndex"
                class="sheet-item"
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
        
        <div class="sheet-footer">
          <el-button type="primary" size="large" @click="showSummary = true" style="width: 100%">
            完成练习
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
            <div class="stat-value">{{ practiceResult?.totalQuestion || questions.length }}</div>
            <div class="stat-label">总题数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value correct">{{ practiceResult?.rightCount || correctCount }}</div>
            <div class="stat-label">正确</div>
          </div>
          <div class="stat-item">
            <div class="stat-value wrong">{{ practiceResult?.wrongCount || wrongCount }}</div>
            <div class="stat-label">错误</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ practiceResult?.score !== undefined ? practiceResult.score : accuracy + '%' }}</div>
            <div class="stat-label">{{ practiceResult?.score !== undefined ? '得分' : '正确率' }}</div>
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
import { getWrongPracticeQuestions, submitWrongAnswer, getWrongPracticeResult, removeWrongQuestion } from '@/api/wrong.js'

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
const courseName = ref('错题练习')
const examId = ref(null)
const totalQuestions = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const loading = ref(true)
const submitLoading = ref(false)
const practiceResult = ref({})

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
    // 接口返回的type是数字: 1=单选, 2=多选, 3=判断
    if (q.type === 1) {
      result.single.push(item)
    } else if (q.type === 2) {
      result.multiple.push(item)
    } else if (q.type === 3) {
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
onMounted(async () => {
  await loadWrongQuestions()
  setTimeout(() => {
    isTransitioning.value = false
  }, 350)
})

// 提交答案到后端
const saveProgress = async (userAnswerStr, isCorrect) => {
  try {
    await submitWrongAnswer({
      answer: userAnswerStr,
      examId: examId.value,
      subjectId: currentQuestion.value.id,
      isCorrect: isCorrect,
      sort: currentIndex.value + 1 // 题号从1开始
    })
    console.log('提交答案成功')
  } catch (error) {
    console.error('提交答案失败:', error)
  }
}

// 加载错题 - 调用新接口
const loadWrongQuestions = async () => {
  try {
    loading.value = true
    // 从路由参数获取 examId（对应数据的 id 字段）
    const params = {
      curriculumId: route.params.curriculumId,
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    // 调用接口
    const res = await getWrongPracticeQuestions(params)
    
    if (res ) {
      const { subjectList, total, examId: resExamId } = res
      examId.value = resExamId || null
      totalQuestions.value = total || 0
      
      // 转换接口返回的数据格式以适配前端
      questions.value = subjectList.map(item => ({
        id: item.id,
        question: item.subject, // 接口字段是 subject
        type: item.type, // 1=单选, 2=多选, 3=判断
        difficulty: item.difficulty,
        answer: item.answer,
        analysis: item.analysis,
        knowledgePoint: item.knowledgePoint,
        options: item.options.map(opt => ({
          text: opt.text,
          option: opt.option,
          isCorrect: opt.option === item.answer // 判断是否为正确答案
        }))
      }))
      
      // 初始化用户答案数组
      userAnswers.value = new Array(questions.value.length).fill(null)
      
      if (questions.value.length === 0) {
        ElMessage.warning('暂无错题')
      }
    } else {
      ElMessage.error('获取错题失败')
    }
  } catch (error) {
    console.error('加载错题失败:', error)
    ElMessage.error('网络错误，请重试')
  } finally {
    loading.value = false
  }
}

// 选择选项
const handleSelectOption = (index) => {
  if (showAnswer.value || isTransitioning.value) return
  
  const label = getOptionLabel(index)
  const currentType = currentQuestion.value.type
  
  // type: 1=单选, 2=多选, 3=判断
  if (currentType === 2) { // 多选
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
  if (question.type === 3) { // 判断题
    return index === 0 ? 'A' : 'B'
  }
  // 返回当前选项的 option 字段值
  return question.options[index]?.option || String.fromCharCode(65 + index)
}

// 提交答案
const handleSubmit = () => {
  if (selectedAnswer.value.length === 0) {
    ElMessage.warning('请选择答案')
    return
  }

  // 获取正确答案（接口返回的 answer 字段，如 "B" 或 "AB"）
  const correctAnswer = currentQuestion.value.answer
  const userAnswerStr = selectedAnswer.value.sort().join('')
  const correctAnswerStr = correctAnswer.split('').sort().join('')
  const isCorrect = userAnswerStr === correctAnswerStr

  userAnswers.value[currentIndex.value] = {
    questionId: currentQuestion.value.id,
    userAnswer: userAnswerStr,
    correctAnswer: correctAnswer,
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

// 从错题本移除
const removeFromWrong = async () => {
  try {
    await ElMessageBox.confirm('确定已掌握这道题吗？将从错题本中移除', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 调用后端接口移除错题
    await removeWrongQuestion(currentQuestion.value.id)
    
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
  } catch (error) {
    // 用户取消或接口错误
    if (error !== 'cancel') {
      console.error('移除错题失败:', error)
      ElMessage.error('移除失败，请重试')
    }
  }
}

// 获取正确答案
const getCorrectAnswer = () => {
  // 直接返回接口的 answer 字段
  return currentQuestion.value.answer || ''
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
  // type: 2=多选题
  if (currentQuestion.value.type === 2 && !showAnswer.value && selectedAnswer.value.length > 0) {
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

// 完成练习（提交试卷）
const handleFinishPractice = async () => {
  if (!examId.value) {
    ElMessage.error('考试ID不存在')
    return
  }
  
  submitLoading.value = true
  try {
    const data = await getWrongPracticeResult(examId.value)
    practiceResult.value = data
    showAnswerCard.value = false
    showSummary.value = true
  } catch (error) {
    console.error('获取练习结果失败:', error)
    ElMessage.error('获取练习结果失败')
  } finally {
    submitLoading.value = false
  }
}

// 完成练习
const handleFinish = () => {
  router.push('/wrong')
}

// 返回
const handleBack = () => {
  router.back()
}

// 题目类型名称 - 适配数字类型
const getQuestionTypeName = (type) => {
  const map = {
    1: '单选题',
    2: '多选题',
    3: '判断题'
  }
  return map[type] || '未知'
}

// 题目类型标签 - 适配数字类型
const getQuestionTypeTag = (type) => {
  const map = {
    1: 'primary',
    2: 'warning',
    3: 'info'
  }
  return map[type] || 'primary'
}

// 难度名称 - 适配数字类型
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
  flex-shrink: 0;
  background: white;
  border-bottom: 1px solid #e4e7ed;
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
  color: #303133;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-name {
  font-size: 0.7rem;
  color: #909399;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.practice-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.page-content {
  padding: 1.5rem;
  min-height: 100%;
}

.practice-container::-webkit-scrollbar {
  width: 6px;
}

.practice-container::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.practice-container::-webkit-scrollbar-thumb {
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
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
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
}

.mastery-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e4e7ed;
}

.page-footer {
  flex-shrink: 0;
  background: white;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  z-index: 10;
}

.page-footer .el-button {
  flex: 1;
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

/* 总结对话框 */
.summary-content {
  padding: 1rem 0;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.summary-stats .stat-item {
  text-align: center;
}

.summary-stats .stat-value {
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
@media (max-width: 767px) {
  .page-header {
    padding: 1rem;
  }

  .page-title {
    font-size: 0.875rem;
  }

  .course-name {
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

  .summary-stats .stat-value {
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
