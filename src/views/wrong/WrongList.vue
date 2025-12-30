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
      <!-- 加载中状态 -->
      <el-skeleton v-if="loading" :count="5" class="skeleton-container" />

      <!-- 无数据状态 -->
      <el-empty v-else-if="groupedWrongQuestions.length === 0" description="暂无错题">
        <el-button type="primary" @click="$router.push('/courses')">
          去做题
        </el-button>
      </el-empty>

      <!-- 错题列表 -->
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
                        :key="question.id"
                        class="question-item"
                    >
                      <div class="question-content">
                        <div class="question-header-row">
                          <div class="question-meta">
                            <el-tag :type="getQuestionTypeTag(question.type)" size="small">
                              {{ getQuestionTypeName(question.type) }}
                            </el-tag>
                            <el-tag size="small" type="info">{{ question.knowledgePoint }}</el-tag>
                            <span class="question-time">{{ formatTime(question.timestamp) }}</span>
                          </div>
                        </div>
                        <div class="question-text">{{ index + 1 }}. {{ question.subject }}</div>

                        <!-- 显示选项 -->
                        <div class="question-options">
                          <div
                              v-for="option in question.options"
                              :key="option.option"
                              class="option-item"
                              :class="{
                              'option-correct': option.option === question.answer,
                              'option-wrong': question.userAnswer === option.option && option.option !== question.answer
                            }"
                          >
                            <span class="option-label">{{ option.option }}.</span>
                            <span class="option-text">{{ option.text }}</span>
                            <el-icon v-if="option.option === question.answer" class="option-icon correct">
                              <Check />
                            </el-icon>
                            <el-icon v-if="question.userAnswer === option.option && option.option !== question.answer" class="option-icon wrong">
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
                            <span class="correct-answer">{{ question.answer }}</span>
                          </span>
                        </div>

                        <!-- 题目解析 -->
                        <div class="question-analysis" v-if="question.analysis">
                          <el-divider content-position="left">题目解析</el-divider>
                          <p class="analysis-text">{{ question.analysis }}</p>
                        </div>
                      </div>
                      <div class="question-actions">
                        <el-button
                            type="danger"
                            size="small"
                            plain
                            @click="handleDelete(question)"
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage, ElSkeleton, ElDivider, ElPagination } from 'element-plus'
import { VideoPlay, Delete, ArrowLeft, ArrowRight, Check, Close } from '@element-plus/icons-vue'
import BottomNav from '@/components/BottomNav.vue'
import {getWrongList, removeWrongQuestion} from "@/api/wrong.js";
import {getCourseList} from "@/api/course.js";
import {getChapterList} from "@/api/chapter.js";

const router = useRouter()
const route = useRoute()

// 接口参数
const page = ref(1)
const pageSize = ref(10)
const curriculumId = ref('') // 课程ID
const chapterId = ref('') // 章节ID
const loading = ref(false)

// 课程&章节映射（从接口获取）
const courses = ref({}) // 格式：{ curriculumId: "课程名称" }
const chapters = ref({}) // 格式：{ curriculumId: { chapterId: "章节名称" } }


// 错题数据
const wrongQuestions = ref([])

// 课程和章节加载状态
const coursesLoading = ref(true)
const totalWrong = ref(0)

// 折叠状态管理
const expandedCourses = ref(new Set())
const expandedChapters = ref(new Set())

// 课程和章节加载状态
const chaptersLoading = ref(true)

// 按课程和章节分组（使用接口获取的真实名称）
const groupedWrongQuestions = computed(() => {
  const groups = {}

  wrongQuestions.value.forEach(q => {
    const courseId = q.curriculumId
    // 初始化课程分组
    if (!groups[courseId]) {
      groups[courseId] = {
        courseId: courseId,
        courseName: coursesLoading.value ? '加载中...' : (courses.value[courseId] || `课程${courseId}`),
        questions: [],
        chapters: {}
      }
    }

    groups[courseId].questions.push(q)

    // 初始化章节分组
    if (!groups[courseId].chapters[q.chapterId]) {
      const chapterName = chaptersLoading.value ? '加载中...' : (chapters.value[courseId]?.[q.chapterId] || `章节${q.chapterId}`)
      groups[courseId].chapters[q.chapterId] = {
        chapterId: q.chapterId,
        chapterName: chapterName,
        questions: []
      }
    }

    groups[courseId].chapters[q.chapterId].questions.push(q)
  })

  // 转换为数组格式
  return Object.values(groups).map(group => ({
    ...group,
    chapters: Object.values(group.chapters)
  }))
})

// 1. 请求课程列表（/api/courses）
const fetchCourses = async () => {
  coursesLoading.value = true
  try {
    const res = await getCourseList()
    if (res) {
      // 假设接口返回格式：[{ curriculumId: 21, name: "计算机网络" }, ...]
      res.forEach(course => {
        courses.value[course.id] = course.name
      })
    } else {
      ElMessage.error('获取课程列表失败')
    }
  } catch (error) {
    console.error('课程列表请求失败:', error)
    ElMessage.error('网络错误，请重试')
  } finally {
    coursesLoading.value = false
  }
}

// 2. 根据课程ID请求章节列表（/api/chapters）
const fetchChaptersByCurriculumId = async (cid) => {
  if (!cid || chapters.value[cid]) return // 避免重复请求
  try {
    const params = new URLSearchParams({ curriculumId: cid })
    const res = await getChapterList(params)
    if (res) {
      // 假设接口返回格式：[{ chapterId: 3, name: "计算机网络基础" }, ...]
      const chapterMap = {}
      res.forEach(chapter => {
        chapterMap[chapter.id] = chapter.name
      })
      chapters.value[cid] = chapterMap

    } else {
      ElMessage.error(`获取课程${cid}的章节失败`)
    }
  } catch (error) {
    console.error('章节列表请求失败:', error)
    ElMessage.error('网络错误，请重试')
  }
}

// 接口请求：获取错题列表
const fetchWrongQuestions = async () => {
  loading.value = true
  try {
    // 构造请求参数
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      // curriculumId: curriculumId.value,
      // chapterId: chapterId.value
    }

    // 发送请求（替换为实际接口地址）
    const res = await getWrongList(params)
    if (res) {
      // 接口返回的data直接是错题数组
      wrongQuestions.value = res.map(item => ({
        ...item,
        // 补充用户答案字段（接口返回的wrongAnswers可能存储用户错误答案）
        userAnswer: item.wrongAnswers || '',
        // 补充时间戳（使用当前时间模拟，实际应从接口获取）
        timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
      }))
      totalWrong.value = res.length // 实际项目中应使用接口返回的total字段
    } else {
      ElMessage.error('获取错题列表失败')
    }
  } catch (error) {
    console.error('错题列表请求失败:', error)
    ElMessage.error('网络错误，请重试')
  } finally {
    loading.value = false
  }
}

// 保存错题到本地存储
const saveWrongQuestions = () => {
  localStorage.setItem('wrong_questions', JSON.stringify(wrongQuestions.value))
}

// 移除错题
const handleDelete = async (row) => {
  try {
    // 等待用户确认删除操作（ElMessageBox.confirm 本身返回 Promise）
    await ElMessageBox.confirm(
        `确定要删除该错题吗？此操作不可恢复。`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    );
    // 等待删除接口执行完成（关键：确保删除操作先完成）
    const res = await removeWrongQuestion(row.id);

    // 等待数据重新加载完成（确保加载的是删除后的最新数据）
    await fetchWrongQuestions();
    // 只有上面两步都完成，才提示删除成功
    ElMessage.success('删除成功');
  } catch (error) {
    // 区分“用户取消删除”和“真正的接口错误”
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.message || '服务器异常'));
      console.error('删除错题失败：', error); // 便于调试问题
    }
    // 如果是用户取消（error === 'cancel'），则什么都不做
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

// 获取题目类型名称（接口type为数字：1=单选）
const getQuestionTypeName = (type) => {
  const map = {
    1: '单选',
    2: '多选',
    3: '判断'
  }
  return map[type] || '未知'
}

// 获取题目类型标签
const getQuestionTypeTag = (type) => {
  const map = {
    1: 'primary',
    2: 'warning',
    3: 'info'
  }
  return map[type] || 'default'
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

// 开始练习
const startPractice = (courseId) => {
  console.log(courseId)
  // courseId 实际是错题数据的 id 字段，作为 examId 参数传递
  router.push({
    path: `/wrong/practice/${courseId}`,
  })
}

// 分页相关方法
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchWrongQuestions()
}

const handleCurrentChange = (val) => {
  page.value = val
  fetchWrongQuestions()
}

// 页面加载时获取数据
onMounted(async () => {
  await fetchCourses() // 先获取所有课程名称
  curriculumId.value = route.query.curriculumId || ''
  chapterId.value = route.query.chapterId || ''
  await fetchWrongQuestions() // 再获取错题
  // 最后获取错题对应的章节名称
  chaptersLoading.value = true
  const uniqueCourseIds = [...new Set(wrongQuestions.value.map(q => q.curriculumId))]
  for (const cid of uniqueCourseIds) {
    await fetchChaptersByCurriculumId(cid)
  }
  chaptersLoading.value = false

  // 默认展开第一个课程和章节
  nextTick(() => {
    if (groupedWrongQuestions.value.length > 0) {
      const firstCourse = groupedWrongQuestions.value[0]
      expandedCourses.value.add(firstCourse.courseId)
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

.skeleton-container {
  max-width: 1200px;
  margin: 0 auto;
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
  flex-wrap: wrap;
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
  align-items: flex-start;
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
  margin-top: 2px;
}

.option-text {
  flex: 1;
  color: #303133;
  line-height: 1.5;
}

.option-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
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
  margin-bottom: 0.75rem;
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

.question-analysis {
  margin-top: 1rem;
}

.analysis-text {
  font-size: 0.875rem;
  color: #606266;
  line-height: 1.6;
  margin: 0.5rem 0 0 0;
  padding-left: 0.5rem;
  border-left: 2px solid #409eff;
}

.question-actions {
  display: flex;
  align-items: center;
  margin-left: 1rem;
}

.pagination-container {
  margin-top: 1.5rem;
  text-align: center;
  display: flex;
  justify-content: center;
}

/* 底部导航样式 */
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