<template>
  <div class="wrong-list-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-left">
        <el-button circle @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
      </div>
      <div class="header-center">
        <h1 class="page-title">错题本</h1>
        <p class="header-subtitle">共 {{ totalWrong }} 道错题</p>
      </div>
      <div class="header-right">
        <div style="width: 40px;"></div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="page-content">
      <el-empty v-if="groupedWrongQuestions.length === 0" description="暂无错题">
        <el-button type="primary" @click="$router.push('/courses')">
          去做题
        </el-button>
      </el-empty>

      <div v-else class="wrong-content">
        <!-- 按课程分组显示 -->
        <div
          v-for="group in groupedWrongQuestions"
          :key="group.courseId"
          class="course-section"
        >
          <!-- 课程头部 - 可折叠 -->
          <div class="section-header" @click="toggleCourse(group.courseId)">
            <div class="section-left">
              <el-icon class="collapse-icon" :class="{ expanded: expandedCourses.has(group.courseId) }">
                <ArrowRight />
              </el-icon>
              <div class="section-title">
                <h2>{{ group.courseName }}</h2>
                <span class="section-count">{{ group.questions.length }} 道错题</span>
              </div>
            </div>
            <el-button
              type="primary"
              size="default"
              @click.stop="startPractice(group.courseId)"
            >
              <el-icon><VideoPlay /></el-icon>
              开始练习
            </el-button>
          </div>

          <!-- 章节列表 - 折叠展开 -->
          <transition name="collapse">
            <div v-show="expandedCourses.has(group.courseId)" class="chapter-list">
              <div
                v-for="chapter in group.chapters"
                :key="chapter.chapterId"
                class="chapter-group"
              >
                <!-- 章节头部 - 可折叠 -->
                <div class="chapter-header" @click="toggleChapter(group.courseId, chapter.chapterId)">
                  <div class="chapter-left">
                    <el-icon class="collapse-icon" :class="{ expanded: expandedChapters.has(`${group.courseId}-${chapter.chapterId}`) }">
                      <ArrowRight />
                    </el-icon>
                    <h3 class="chapter-name">{{ chapter.chapterName }}</h3>
                  </div>
                  <el-tag size="small">{{ chapter.questions.length }} 题</el-tag>
                </div>

                <!-- 题目列表 - 折叠展开 -->
                <transition name="collapse">
                  <div v-show="expandedChapters.has(`${group.courseId}-${chapter.chapterId}`)" class="question-list">
                  <div
                    v-for="(question, index) in chapter.questions"
                    :key="question.timestamp"
                    class="question-item"
                  >
                    <div class="question-content">
                      <div class="question-header-row">
                        <div class="question-meta">
                          <el-tag :type="getQuestionTypeTag(question.type)" size="small">
                            {{ getQuestionTypeName(question.type) }}
                          </el-tag>
                          <span class="question-time">{{ formatTime(question.timestamp) }}</span>
                        </div>
                      </div>
                      <div class="question-text">{{ index + 1 }}. {{ question.question }}</div>
                      
                      <!-- 显示选项 -->
                      <div class="question-options">
                        <div
                          v-for="(option, optIndex) in question.options"
                          :key="optIndex"
                          class="option-item"
                          :class="{
                            'option-correct': option.isCorrect,
                            'option-wrong': isUserSelectedOption(question, optIndex) && !option.isCorrect
                          }"
                        >
                          <span class="option-label">{{ getOptionLabel(question.type, optIndex) }}.</span>
                          <span class="option-text">{{ option.text }}</span>
                          <el-icon v-if="option.isCorrect" class="option-icon correct">
                            <Check />
                          </el-icon>
                          <el-icon v-if="isUserSelectedOption(question, optIndex) && !option.isCorrect" class="option-icon wrong">
                            <Close />
                          </el-icon>
                        </div>
                      </div>
                      
                      <div class="question-answer">
                        <span class="answer-item">
                          <span class="answer-label">你的答案：</span>
                          <span class="user-answer wrong">{{ question.userAnswer || '未作答' }}</span>
                        </span>
                        <span class="answer-item">
                          <span class="answer-label">正确答案：</span>
                          <span class="correct-answer">{{ getCorrectAnswer(question) }}</span>
                        </span>
                      </div>
                    </div>
                    <div class="question-actions">
                      <el-button
                        type="danger"
                        size="small"
                        plain
                        @click="removeWrongQuestion(question)"
                      >
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
              </transition>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { VideoPlay, Delete, ArrowLeft, Reading, Flag, User, ArrowRight, Check, Close } from '@element-plus/icons-vue'
import BottomNav from '@/components/BottomNav.vue'

const router = useRouter()
const route = useRoute()
const wrongQuestions = ref([])

// 折叠状态管理
const expandedCourses = ref(new Set())
const expandedChapters = ref(new Set())

// 总错题数
const totalWrong = computed(() => wrongQuestions.value.length)

// 按课程和章节分组
const groupedWrongQuestions = computed(() => {
  const groups = {}
  
  wrongQuestions.value.forEach(q => {
    if (!groups[q.courseId]) {
      groups[q.courseId] = {
        courseId: q.courseId,
        courseName: q.courseName,
        questions: [],
        chapters: {}
      }
    }
    
    groups[q.courseId].questions.push(q)
    
    if (!groups[q.courseId].chapters[q.chapterId]) {
      groups[q.courseId].chapters[q.chapterId] = {
        chapterId: q.chapterId,
        chapterName: q.chapterName,
        questions: []
      }
    }
    
    groups[q.courseId].chapters[q.chapterId].questions.push(q)
  })
  
  const result = Object.values(groups).map(group => ({
    ...group,
    chapters: Object.values(group.chapters)
  }))
  
  console.log('Grouped wrong questions:', result)
  return result
})

// 加载错题
const loadWrongQuestions = () => {
  const saved = localStorage.getItem('wrong_questions')
  if (saved) {
    wrongQuestions.value = JSON.parse(saved)
  }
}

// 保存错题
const saveWrongQuestions = () => {
  localStorage.setItem('wrong_questions', JSON.stringify(wrongQuestions.value))
}

// 移除错题
const removeWrongQuestion = async (question) => {
  try {
    await ElMessageBox.confirm(
      '确定要从错题本中移除这道题吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = wrongQuestions.value.findIndex(
      q => q.timestamp === question.timestamp
    )
    
    if (index !== -1) {
      wrongQuestions.value.splice(index, 1)
      saveWrongQuestions()
      ElMessage.success('已移除')
    }
  } catch {
    // 用户取消
  }
}

// 切换课程折叠状态
const toggleCourse = (courseId) => {
  if (expandedCourses.value.has(courseId)) {
    expandedCourses.value.delete(courseId)
  } else {
    expandedCourses.value.add(courseId)
  }
  expandedCourses.value = new Set(expandedCourses.value)
}

// 切换章节折叠状态
const toggleChapter = (courseId, chapterId) => {
  const key = `${courseId}-${chapterId}`
  if (expandedChapters.value.has(key)) {
    expandedChapters.value.delete(key)
  } else {
    expandedChapters.value.add(key)
  }
  expandedChapters.value = new Set(expandedChapters.value)
}

// 判断选项是否被用户选择
const isUserSelectedOption = (question, optIndex) => {
  if (!question.userAnswer) return false
  
  if (question.type === 'judge') {
    // 判断题：正确对应索引0，错误对应索引1
    return (question.userAnswer === '正确' && optIndex === 0) || 
           (question.userAnswer === '错误' && optIndex === 1)
  } else {
    // 单选和多选题
    const userAnswers = question.userAnswer.split('、')
    const optionLabel = String.fromCharCode(65 + optIndex)
    return userAnswers.includes(optionLabel)
  }
}

// 获取选项标签
const getOptionLabel = (type, index) => {
  if (type === 'judge') {
    return index === 0 ? '√' : '×'
  }
  return String.fromCharCode(65 + index)
}

// 开始练习
const startPractice = (courseId) => {
  router.push({
    path: '/wrong/practice',
    query: { courseId }
  })
}

// 获取题目类型名称
const getQuestionTypeName = (type) => {
  const map = {
    single: '单选',
    multiple: '多选',
    judge: '判断'
  }
  return map[type] || '未知'
}

// 获取题目类型标签
const getQuestionTypeTag = (type) => {
  const map = {
    single: 'primary',
    multiple: 'warning',
    judge: 'info'
  }
  return map[type] || 'default'
}

// 获取正确答案
const getCorrectAnswer = (question) => {
  const correctOptions = question.options
    .map((opt, idx) => {
      if (opt.isCorrect) {
        if (question.type === 'judge') {
          return idx === 0 ? '正确' : '错误'
        }
        return String.fromCharCode(65 + idx)
      }
      return null
    })
    .filter(Boolean)
  
  return correctOptions.join('、')
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return minutes < 1 ? '刚刚' : `${minutes}分钟前`
  }
  
  // 小于24小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}小时前`
  }
  
  // 小于7天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  }
  
  // 显示日期
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 生成测试错题数据
const generateMockWrongQuestions = () => {
  const saved = localStorage.getItem('wrong_questions')
  if (saved && JSON.parse(saved).length > 0) {
    return // 已有数据，不覆盖
  }
  
  const mockData = []
  const courses = [
    { cId: 1, cName: '高等数学' },
    { cId: 2, cName: '大学英语' },
    { cId: 3, cName: '计算机基础' }
  ]
  
  const chapters = [
    { chapterId: 1, chapterName: '第一章 基础知识' },
    { chapterId: 2, chapterName: '第二章 进阶内容' },
    { chapterId: 3, chapterName: '第三章 综合应用' }
  ]
  
  let questionId = 1
  
  courses.forEach((course, courseIdx) => {
    chapters.slice(0, courseIdx + 1).forEach(chapter => {
      // 每个章节生成3-5道错题
      const questionCount = 3 + Math.floor(Math.random() * 3)
      
      for (let i = 0; i < questionCount; i++) {
        const types = ['single', 'multiple', 'judge']
        const type = types[Math.floor(Math.random() * types.length)]
        
        let question, options, userAnswer
        
        if (type === 'judge') {
          question = `${course.cName} - ${chapter.chapterName}：判断题示例 ${i + 1}`
          options = [
            { text: '正确', isCorrect: Math.random() > 0.5 },
            { text: '错误', isCorrect: false }
          ]
          options[1].isCorrect = !options[0].isCorrect
          userAnswer = options[0].isCorrect ? '错误' : '正确'
        } else if (type === 'single') {
          question = `${course.cName} - ${chapter.chapterName}：单选题示例 ${i + 1}，以下哪个选项是正确的？`
          const correctIdx = Math.floor(Math.random() * 4)
          options = ['A', 'B', 'C', 'D'].map((label, idx) => ({
            text: `选项${label}：这是${label}选项的内容描述`,
            isCorrect: idx === correctIdx
          }))
          const wrongIdx = (correctIdx + 1 + Math.floor(Math.random() * 3)) % 4
          userAnswer = String.fromCharCode(65 + wrongIdx)
        } else {
          question = `${course.cName} - ${chapter.chapterName}：多选题示例 ${i + 1}，以下哪些选项是正确的？`
          options = ['A', 'B', 'C', 'D'].map((label, idx) => ({
            text: `选项${label}：这是${label}选项的内容描述`,
            isCorrect: Math.random() > 0.5
          }))
          if (!options.some(o => o.isCorrect)) options[0].isCorrect = true
          const correctLabels = options.map((o, i) => o.isCorrect ? String.fromCharCode(65 + i) : '').filter(Boolean)
          const wrongAnswers = correctLabels.slice(0, -1)
          userAnswer = wrongAnswers.join('、') || String.fromCharCode(65)
        }
        
        mockData.push({
          id: questionId++,
          courseId: course.cId,
          courseName: course.cName,
          chapterId: chapter.chapterId,
          chapterName: chapter.chapterName,
          type,
          question,
          options,
          userAnswer,
          timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
          analysis: `这道题的正确答案应该是${type === 'judge' ? (options[0].isCorrect ? '正确' : '错误') : options.map((o, i) => o.isCorrect ? String.fromCharCode(65 + i) : '').filter(Boolean).join('、')}。需要注意理解核心概念。`
        })
      }
    })
  })
  
  localStorage.setItem('wrong_questions', JSON.stringify(mockData))
}

onMounted(() => {
  generateMockWrongQuestions()
  loadWrongQuestions()
  
  // 默认展开第一个课程
  nextTick(() => {
    if (groupedWrongQuestions.value.length > 0) {
      const firstCourse = groupedWrongQuestions.value[0]
      expandedCourses.value.add(firstCourse.courseId)
      // 默认展开第一个课程的第一个章节
      if (firstCourse.chapters.length > 0) {
        expandedChapters.value.add(`${firstCourse.courseId}-${firstCourse.chapters[0].chapterId}`)
      }
    }
  })
})
</script>

<style scoped>
.wrong-list-page {
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
  padding: 1rem 1.5rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-left,
.header-right {
  flex-shrink: 0;
}

.header-center {
  flex: 1;
  text-align: center;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-subtitle {
  font-size: 0.75rem;
  color: #909399;
  margin: 0.25rem 0 0 0;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.5rem;
  padding-bottom: 100px;
}

.wrong-content {
  max-width: 1200px;
  margin: 0 auto;
}

.course-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 2px solid #f0f2f5;
  cursor: pointer;
  transition: background 0.2s;
}

.section-header:hover {
  background: #f5f7fa;
}

.section-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.collapse-icon {
  font-size: 16px;
  color: #909399;
  transition: transform 0.3s;
}

.collapse-icon.expanded {
  transform: rotate(90deg);
}

.section-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.section-title h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #303133;
  margin: 0;
  line-height: 1.4;
}

.section-count {
  font-size: 0.8125rem;
  color: #909399;
  line-height: 1;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #fafafa;
}

.chapter-group {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.chapter-header {
  padding: 0.75rem 1rem;
  background: #f5f7fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}

.chapter-header:hover {
  background: #ebeef5;
}

.chapter-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.chapter-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #303133;
  margin: 0;
  line-height: 1.4;
}

/* 折叠动画 */
.collapse-enter-active {
  transition: opacity 0.2s ease;
  overflow: hidden;
}

.collapse-leave-active {
  transition: opacity 0.15s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
}

.question-list {
  background: white;
}

.question-item {
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid #f0f2f5;
  transition: background 0.2s;
}

.question-item:last-child {
  border-bottom: none;
}

.question-item:hover {
  background: #f5f7fa;
}

.question-content {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.question-header-row {
  margin-bottom: 0.5rem;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.question-time {
  font-size: 0.75rem;
  color: #909399;
}

.question-text {
  font-size: 0.875rem;
  color: #303133;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.option-item.option-correct {
  background: #f0f9ff;
  border-color: #67c23a;
}

.option-item.option-wrong {
  background: #fef0f0;
  border-color: #f56c6c;
}

.option-label {
  font-weight: 600;
  color: #606266;
  min-width: 24px;
}

.option-text {
  flex: 1;
  color: #303133;
  line-height: 1.5;
}

.option-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.option-icon.correct {
  color: #67c23a;
}

.option-icon.wrong {
  color: #f56c6c;
}

.question-answer {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #ebeef5;
}

.answer-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.answer-label {
  color: #909399;
}

.user-answer {
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  background: #fef0f0;
}

.user-answer.wrong {
  color: #f56c6c;
}

.correct-answer {
  color: #67c23a;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  background: #f0f9ff;
}

.question-actions {
  display: flex;
  align-items: center;
  margin-left: 1rem;
}

/* 底部导航 */
.bottom-nav-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 16px;
  background: transparent;
  z-index: 1000;
  pointer-events: none;
}

.bottom-nav {
  position: relative;
  display: flex;
  background: white;
  border-radius: 24px;
  padding: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid #e4e7ed;
  z-index: 1000;
  width: 240px;
}

.nav-indicator {
  position: absolute;
  height: calc(100% - 12px);
  background: #409eff;
  border-radius: 18px;
  top: 6px;
  left: 0;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform, width;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: #909399;
  font-size: 12px;
  font-weight: 500;
  z-index: 1;
  flex: 1;
  border-radius: 18px;
}

.nav-item.active {
  color: white;
}

.nav-item .el-icon {
  font-size: 22px;
  transition: transform 0.3s;
}

.nav-item.active .el-icon {
  transform: scale(1.15);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .page-content {
    padding: 1rem;
  }
  
  .course-section {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .section-header .el-button {
    width: 100%;
  }
  
  .question-item {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .question-actions {
    margin-left: 0;
  }
  
  .question-actions .el-button {
    width: 100%;
  }
  
  .bottom-nav {
    width: 240px;
    max-width: calc(100% - 32px);
    padding: 4px;
  }
  
  .nav-indicator {
    height: calc(100% - 8px);
    top: 4px;
  }
  
  .nav-item {
    padding: 6px 16px;
    min-width: 56px;
    gap: 2px;
    font-size: 11px;
  }
  
  .nav-item .el-icon {
    font-size: 20px;
  }
}
</style>
