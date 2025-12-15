<template>
  <div class="chapter-list-page">
    <!-- 头部 -->
    <div class="page-header">
      <div class="header-content">
        <el-button circle @click="onBack">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h1 class="page-title">{{ currentCourse?.name || '章节列表' }}</h1>
        <div style="width: 32px;"></div>
      </div>
    </div>

    <!-- 章节列表 -->
    <div class="page-content" v-loading="loading">
      <el-row :gutter="16">
        <!-- 章节考试卡片 -->
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <div class="chapter-card final-exam" @click="selectFinalExam">
            <div class="chapter-header">
              <div class="chapter-number final">
                <el-icon><Trophy /></el-icon>
              </div>
              <el-icon class="play-icon" :size="24"><Medal /></el-icon>
            </div>
            
            <div class="chapter-body">
              <h3 class="chapter-title">章节考试</h3>
              <p class="chapter-desc">测试所有章节的知识掌握程度</p>
            </div>
            
            <div class="chapter-footer">
              <el-tag size="small" type="warning">
                <el-icon><Star /></el-icon>
                综合考试
              </el-tag>
            </div>
          </div>
        </el-col>
        
        <!-- 普通章节 -->
        <el-col
          v-for="(chapter, index) in chapterList"
          :key="chapter.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <div class="chapter-card" @click="selectMode(chapter)">
            <div class="chapter-header">
              <div class="chapter-number">{{ index + 1 }}</div>
              <el-icon class="play-icon" :size="24"><VideoPlay /></el-icon>
            </div>
            
            <div class="chapter-body">
              <h3 class="chapter-title">{{ chapter.name }}</h3>
              <p class="chapter-desc">{{ chapter.description || '暂无描述' }}</p>
            </div>
            
            <div class="chapter-footer">
              <el-tag size="small">
                <el-icon><Document /></el-icon>
                {{ chapter.questionCount || 0 }} 题
              </el-tag>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 空状态 -->
      <el-empty v-if="!loading && chapterList.length === 0" description="暂无章节" />
    </div>

    <!-- 模式选择对话框 -->
    <el-dialog
      v-model="showModeDialog"
      :title="isFinalExam ? '选择考试模式' : '选择学习模式'"
      width="90%"
      :style="{ maxWidth: '400px' }"
      center
    >
      <div class="mode-selection">
        <div v-if="!isFinalExam" class="mode-card" @click="onModeSelect('practice')">
          <div class="mode-icon practice">
            <el-icon :size="40"><Edit /></el-icon>
          </div>
          <h3>刷题模式</h3>
          <p>逐题练习，即时查看答案和解析</p>
        </div>
        
        <div class="mode-card" @click="onModeSelect(isFinalExam ? 'final-practice' : 'exam')">
          <div class="mode-icon" :class="isFinalExam ? 'practice' : 'exam'">
            <el-icon :size="40"><component :is="isFinalExam ? Edit : Clock" /></el-icon>
          </div>
          <h3>{{ isFinalExam ? '章节刷题' : '考试模式' }}</h3>
          <p>{{ isFinalExam ? '刷所有章节的全部题目，即时查看解析' : '限时答题，完成后统一查看成绩' }}</p>
        </div>
        
        <div v-if="isFinalExam" class="mode-card" @click="onModeSelect('final-exam')">
          <div class="mode-icon exam">
            <el-icon :size="40"><Clock /></el-icon>
          </div>
          <h3>章节考试</h3>
          <p>随机抽取所有章节题目，限时考试</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { ElMessage } from 'element-plus'
import { getChapterList } from '@/api/chapter'
import { 
  ArrowLeft, VideoPlay, Document, Edit, Clock, Trophy, Medal, Star, Refresh
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()

const chapterList = ref([])
const loading = ref(false)
const showModeDialog = ref(false)
const selectedChapter = ref(null)
const isFinalExam = ref(false)
const total = ref(0)
const currentCourse = computed(() => courseStore.currentCourse)

const onBack = () => {
  router.back()
}

const loadChapters = async () => {
  loading.value = true
  
  try {

    const courseId = route.params.courseId
    console.log(courseStore, )
    const data = await getChapterList({ curriculumId: courseId})
    chapterList.value = data || []
    courseStore.setChapterList(chapterList.value)
  } catch (error) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const selectMode = (chapter) => {
  selectedChapter.value = chapter
  total.value = chapter.questionCount
  courseStore.setCurrentChapter(chapter)
  isFinalExam.value = false
  showModeDialog.value = true
}

const selectFinalExam = () => {
  selectedChapter.value = null
  isFinalExam.value = true
  showModeDialog.value = true
}

const onModeSelect = (mode) => {
  showModeDialog.value = false
  
  if (mode === 'practice') {
    // 刷题模式
    courseStore.setCurrentChapter(selectedChapter.value)
    router.push({
      path: '/practice',
      query: {
        courseId: route.params.courseId,
        curriculumName: route.query.curriculumName,
        chapterId: selectedChapter.value.id,
        chapterName: selectedChapter.value.name,
      }
    })
  } else if (mode === 'exam') {
    // 普通考试模式
    courseStore.setCurrentChapter(selectedChapter.value)
    router.push({
      path: '/exam',
      query: {
        courseId: route.params.courseId,
        curriculumName: route.query.curriculumName,
        chapterId: selectedChapter.value.id,
        chapterName: selectedChapter.value.name,
        questionCount: total || 0
      }
    })
  } else if (mode === 'final-practice') {
    // 章节刷题 - 所有题目
    courseStore.setCurrentChapter({
      chapterId: 'final-practice',
      chapterName: '章节刷题',
      name: '章节刷题'
    })
    router.push({
      path: '/practice',
      query: {
        courseId: route.params.courseId,
        curriculumName: route.query.curriculumName
      }
    })
  } else if (mode === 'final-exam') {
    // 章节考试 - 随机抽题
    courseStore.setCurrentChapter({
      chapterId: 'final-exam',
      chapterName: '章节考试',
      name: '章节考试'
    })
    router.push({
      path: '/exam',
      query: {
        courseId: route.params.courseId,
        curriculumName: route.query.curriculumName,
        questionCount: route.query.questionCount || 0
      }
    })
  }
}

onMounted(() => {
  loadChapters()
})
</script>

<style scoped>
.chapter-list-page {
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
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: #303133;
  flex: 1;
  text-align: center;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
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

.chapter-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  height: calc(100% - 1rem);
  display: flex;
  flex-direction: column;
}

.chapter-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.chapter-card.final-exam {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.chapter-card.final-exam:hover {
  border-color: #764ba2;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.chapter-card.final-exam .chapter-number {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.chapter-card.final-exam .chapter-number.final {
  width: 48px;
  height: 48px;
}

.chapter-card.final-exam .play-icon {
  color: white;
}

.chapter-card.final-exam .chapter-title,
.chapter-card.final-exam .chapter-desc {
  color: white;
}

.chapter-card.final-exam .chapter-footer :deep(.el-tag) {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
}

.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chapter-number {
  width: 48px;
  height: 48px;
  background: #409eff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.play-icon {
  color: #409eff;
}

.chapter-body {
  flex: 1;
  margin-bottom: 1rem;
}

.chapter-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-desc {
  font-size: 0.875rem;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chapter-footer {
  padding-top: 0.75rem;
  border-top: 1px solid #ebeef5;
}

.chapter-footer :deep(.el-tag) {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #f0f2f5;
  border: none;
  color: #606266;
  font-weight: 500;
}

.mode-selection {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mode-card {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  border: 2px solid transparent;
}

.mode-card:hover {
  background: white;
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.mode-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-icon.practice {
  background: #e1f3d8;
  color: #67c23a;
}

.mode-icon.exam {
  background: #fef0f0;
  color: #f56c6c;
}

.mode-icon.random {
  background: #fff7e6;
  color: #e6a23c;
}

.mode-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 0.5rem;
}

.mode-card p {
  font-size: 0.875rem;
  color: #909399;
  margin: 0;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .page-header {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1rem;
  }
  
  .page-content {
    padding: 1rem;
  }
  
  .chapter-card {
    padding: 1rem;
  }
  
  .chapter-number {
    width: 40px;
    height: 40px;
    font-size: 1.125rem;
  }
  
  .mode-icon {
    width: 60px;
    height: 60px;
  }
  
  .mode-icon :deep(.el-icon) {
    font-size: 30px !important;
  }
}

/* PC端适配 */
@media (min-width: 1024px) {
  .page-content {
    padding: 2rem 3rem;
  }
}
</style>
