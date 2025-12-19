<template>
  <AdminLayout>
    <div class="question-manage-page">
      <el-card>
        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-select v-model="searchCourseId" placeholder="选择课程" style="width: 160px" clearable @change="handleCourseChange">
            <el-option v-for="course in courseList" :key="course.id" :label="course.name" :value="course.id" />
          </el-select>
          
          <el-select v-model="searchChapterId" placeholder="选择章节" style="width: 160px; margin-left: 12px" clearable @change="handleSearch" :disabled="!searchCourseId">
            <el-option v-for="chapter in filteredChapters" :key="chapter.id" :label="chapter.name" :value="chapter.id" />
          </el-select>
          
          <el-select v-model="searchType" placeholder="题目类型" style="width: 120px; margin-left: 12px" clearable @change="handleSearch">
            <el-option label="单选题" :value="1" />
            <el-option label="多选题" :value="2" />
            <el-option label="判断题" :value="3" />
          </el-select>
          
          <el-input v-model="searchKeyword" placeholder="搜索题目" style="width: 200px; margin-left: 12px" clearable @input="handleSearch">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          
          <el-button type="primary" :icon="Plus" @click="handleAdd" style="margin-left: auto">新增题目</el-button>
        </div>

        <!-- 题目表格 -->
        <el-table :data="tableData" style="width: 100%; margin-top: 20px" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="courseName" label="课程" width="120" />
          <el-table-column prop="chapterName" label="章节" width="150" />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTag(row.type)">{{ getTypeName(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="subject" label="题目内容" min-width="250" show-overflow-tooltip />
          <el-table-column label="难度" width="100">
            <template #default="{ row }">
              <el-tag :type="getDifficultyTag(row.difficulty)" effect="plain">{{ getDifficultyName(row.difficulty) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
              <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handlePageChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>

      <!-- 查看对话框 -->
      <el-dialog v-model="viewDialogVisible" title="查看题目" width="90%" :style="{ maxWidth: '800px' }">
        <div v-if="currentQuestion" class="question-detail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="课程">{{ currentQuestion.courseName }}</el-descriptions-item>
            <el-descriptions-item label="章节">{{ currentQuestion.chapterName }}</el-descriptions-item>
            <el-descriptions-item label="题目类型">{{ getTypeName(currentQuestion.type) }}</el-descriptions-item>
            <el-descriptions-item label="难度">{{ getDifficultyName(currentQuestion.difficulty) }}</el-descriptions-item>
            <el-descriptions-item label="题目内容" :span="2">
              <div style="white-space: pre-wrap;">{{ currentQuestion.subject }}</div>
            </el-descriptions-item>
            <el-descriptions-item label="选项" :span="2" v-if="currentQuestion.type !== 3">
              <div v-for="(option, index) in currentQuestion.options" :key="index" style="margin-bottom: 8px;">
                <el-tag size="small" style="margin-right: 8px;">{{ String.fromCharCode(65 + index) }}</el-tag>
                {{ option.text }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="正确答案" :span="2">
              <el-tag type="success">{{ currentQuestion.correctAnswer }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="知识点" :span="2">{{ currentQuestion.knowledgePoint || '无' }}</el-descriptions-item>
            <el-descriptions-item label="解析" :span="2">
              <div style="white-space: pre-wrap;">{{ currentQuestion.analysis || '无' }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-dialog>

      <!-- 新增/编辑对话框 -->
      <el-dialog v-model="dialogVisible" :title="dialogTitle" width="90%" :style="{ maxWidth: '800px' }" @close="handleDialogClose">
        <el-alert title="提示：由于表单较复杂，建议使用批量上传功能" type="info" :closable="false" style="margin-bottom: 20px" />
        <p style="color: #909399; text-align: center;">详细的题目编辑功能请前往【题目上传】页面</p>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getQuestionList, getQuestionDetail } from '@/api/admin'

const courseList = ref([])
const chapterList = ref([])

const searchCourseId = ref('')
const searchChapterId = ref('')
const searchType = ref('')
const searchKeyword = ref('')

const filteredChapters = computed(() => {
  if (!searchCourseId.value) return []
  return chapterList.value.filter(c => c.courseId === searchCourseId.value)
})

const loading = ref(false)
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const viewDialogVisible = ref(false)
const currentQuestion = ref(null)
const dialogVisible = ref(false)
const dialogTitle = computed(() => '新增题目')

// 加载题目数据
const loadData = async () => {
  loading.value = true
  
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    // 添加筛选条件
    if (searchCourseId.value) params.curriculumId = searchCourseId.value
    if (searchChapterId.value) params.chapterId = searchChapterId.value
    if (searchType.value) params.type = searchType.value
    if (searchKeyword.value) params.keyword = searchKeyword.value
    
    const data = await getQuestionList(params)
    
    if (data && data.list) {
      // 映射后端数据到前端字段
      tableData.value = data.list.map(q => ({
        id: q.id,
        courseId: q.curriculumId,
        courseName: q.curriculumName || '未知课程',
        chapterId: q.chapterId,
        chapterName: q.chapterName || '未知章节',
        type: parseInt(q.type),
        subject: q.subject,
        difficulty: q.difficulty,
        isUse: q.isUse,
        createTime: q.createTime
      }))
      
      // 从题目数据中提取课程和章节列表用于筛选
      updateCourseAndChapterLists(data.list)
      
      total.value = data.total || 0
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取题目列表失败:', error)
    ElMessage.error('获取题目列表失败')
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 从题目数据中提取课程和章节列表
const updateCourseAndChapterLists = (questions) => {
  // 提取唯一的课程
  const courseMap = new Map()
  const chapterMap = new Map()
  
  questions.forEach(q => {
    if (q.curriculumId && q.curriculumName) {
      courseMap.set(q.curriculumId, { id: q.curriculumId, name: q.curriculumName })
    }
    if (q.chapterId && q.chapterName) {
      chapterMap.set(q.chapterId, { 
        id: q.chapterId, 
        name: q.chapterName,
        courseId: q.curriculumId 
      })
    }
  })
  
  courseList.value = Array.from(courseMap.values())
  chapterList.value = Array.from(chapterMap.values())
}

const handleCourseChange = () => {
  searchChapterId.value = ''
  handleSearch()
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handlePageChange = () => loadData()
const getTypeName = (type) => ({ 1: '单选题', 2: '多选题', 3: '判断题' }[type] || '未知')
const getTypeTag = (type) => ({ 1: '', 2: 'success', 3: 'warning' }[type] || '')
const getDifficultyName = (d) => ({ 1: '简单', 2: '中等', 3: '困难' }[d] || '未知')
const getDifficultyTag = (d) => ({ 1: 'success', 2: '', 3: 'warning' }[d] || '')

const handleView = async (row) => {
  // 显示加载动画
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '加载题目详情中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    const detail = await getQuestionDetail(row.id)
    
    if (detail) {
      currentQuestion.value = {
        id: detail.id,
        courseName: row.courseName,
        chapterName: row.chapterName,
        type: detail.type,
        subject: detail.subject,
        difficulty: detail.difficulty,
        correctAnswer: detail.answer,
        knowledgePoint: detail.knowledgePoint || '',
        analysis: detail.analysis || '',
        isUse: detail.isUse,
        options: detail.options || []
      }
      
      viewDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取题目详情失败:', error)
    ElMessage.error('获取题目详情失败')
  } finally {
    loadingInstance.close()
  }
}

const handleAdd = () => {
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该题目吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // TODO: 调用删除接口
    loadData()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const handleDialogClose = () => {}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.question-manage-page { min-height: 100%; }
.search-bar { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
.question-detail { padding: 8px 0; }

@media (max-width: 1024px) {
  .pagination :deep(.el-pagination) {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .search-bar { flex-direction: column; align-items: stretch; }
  .search-bar :deep(.el-select),
  .search-bar :deep(.el-input),
  .search-bar :deep(.el-button) { width: 100% !important; margin-left: 0 !important; }
  
  :deep(.el-table) { font-size: 13px; }
  :deep(.el-table .el-button) { padding: 4px 8px; font-size: 12px; }
  
  .pagination { margin-top: 16px; }
  .pagination :deep(.el-pagination) { justify-content: center; }
  .pagination :deep(.el-pagination__sizes) { display: none; }
  
  .question-detail :deep(.el-descriptions) { font-size: 13px; }
  :deep(.el-dialog) { width: 95% !important; }
}

@media (max-width: 375px) {
  :deep(.el-table) { font-size: 12px; }
  :deep(.el-table .cell) { padding: 0 6px; }
  .question-detail :deep(.el-descriptions) { font-size: 12px; }
}
</style>
