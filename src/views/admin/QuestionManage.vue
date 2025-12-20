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
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.isUse ? 'success' : 'info'">
                {{ row.isUse ? '启用' : '禁用' }}
              </el-tag>
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
      <el-dialog v-model="dialogVisible" :title="dialogTitle" width="90%" :style="{ maxWidth: '900px' }" @close="handleDialogClose">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="所属课程" prop="curriculumId">
                <el-select v-model="formData.curriculumId" placeholder="请选择课程" style="width: 100%" @change="handleFormCourseChange" :loading="courseLoading">
                  <el-option v-for="course in formCourseList" :key="course.id" :label="course.name" :value="course.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所属章节" prop="chapterId">
                <el-select v-model="formData.chapterId" placeholder="请选择章节" style="width: 100%" :disabled="!formData.curriculumId" :loading="chapterLoading">
                  <el-option v-for="chapter in formChapterList" :key="chapter.id" :label="chapter.name" :value="chapter.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="题目类型" prop="type">
                <el-select v-model="formData.type" placeholder="请选择题目类型" style="width: 100%">
                  <el-option label="单选题" :value="1" />
                  <el-option label="多选题" :value="2" />
                  <el-option label="判断题" :value="3" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="难度" prop="difficulty">
                <el-select v-model="formData.difficulty" placeholder="请选择难度" style="width: 100%">
                  <el-option label="简单" :value="1" />
                  <el-option label="中等" :value="2" />
                  <el-option label="困难" :value="3" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="题目内容" prop="subject">
            <el-input v-model="formData.subject" type="textarea" :rows="3" placeholder="请输入题目内容" />
          </el-form-item>

          <el-form-item label="选项A" prop="selectA">
            <el-input v-model="formData.selectA" placeholder="请输入选项A" />
          </el-form-item>

          <el-form-item label="选项B" prop="selectB">
            <el-input v-model="formData.selectB" placeholder="请输入选项B" />
          </el-form-item>

          <el-form-item label="选项C" v-if="optionCount >= 3">
            <el-input v-model="formData.selectC" placeholder="请输入选项C" />
          </el-form-item>

          <el-form-item label="选项D" v-if="optionCount >= 4">
            <el-input v-model="formData.selectD" placeholder="请输入选项D" />
          </el-form-item>

          <el-form-item label="选项E" v-if="optionCount >= 5">
            <el-input v-model="formData.selectE" placeholder="请输入选项E" />
          </el-form-item>

          <el-form-item label="选项F" v-if="optionCount >= 6">
            <el-input v-model="formData.selectF" placeholder="请输入选项F" />
          </el-form-item>

          <el-form-item label="选项G" v-if="optionCount >= 7">
            <el-input v-model="formData.selectG" placeholder="请输入选项G" />
          </el-form-item>

          <el-form-item v-if="optionCount < 7">
            <el-button type="primary" plain :icon="Plus" @click="addOption">添加选项</el-button>
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="正确答案" prop="answer">
                <el-input v-model="formData.answer" placeholder="单选填单个字母如A，多选填ABCD" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="年份">
                <el-input v-model="formData.year" placeholder="如：2024" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="知识点">
            <el-input v-model="formData.knowledgePoint" placeholder="请输入知识点" />
          </el-form-item>

          <el-form-item label="答案解析">
            <el-input v-model="formData.analysis" type="textarea" :rows="3" placeholder="请输入答案解析" />
          </el-form-item>

          <el-form-item label="是否启用">
            <el-switch v-model="formData.isUse" active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getQuestionList, getQuestionDetail, createQuestion, updateQuestion, getCourseDict, getChapterDict } from '@/api/admin'

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
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()
const optionCount = ref(2) // 默认显示2个选项

const dialogTitle = computed(() => isEdit.value ? '编辑题目' : '新增题目')

// 表单相关数据
const formCourseList = ref([])
const formChapterList = ref([])
const courseLoading = ref(false)
const chapterLoading = ref(false)

const formData = reactive({
  id: null,
  curriculumId: null,
  chapterId: null,
  type: 1,
  subject: '',
  selectA: '',
  selectB: '',
  selectC: '',
  selectD: '',
  selectE: '',
  selectF: '',
  selectG: '',
  answer: '',
  difficulty: 1,
  knowledgePoint: '',
  analysis: '',
  isUse: true,
  year: ''
})

const formRules = {
  curriculumId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  chapterId: [{ required: true, message: '请选择章节', trigger: 'change' }],
  type: [{ required: true, message: '请选择题目类型', trigger: 'change' }],
  subject: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
  selectA: [{ required: true, message: '请输入选项A', trigger: 'blur' }],
  selectB: [{ required: true, message: '请输入选项B', trigger: 'blur' }],
  answer: [{ required: true, message: '请输入正确答案', trigger: 'blur' }]
}

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

// 加载表单用的课程列表
const loadFormCourseList = async () => {
  courseLoading.value = true
  try {
    const data = await getCourseDict()
    if (data && Array.isArray(data)) {
      formCourseList.value = data
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
    ElMessage.error('获取课程列表失败')
  } finally {
    courseLoading.value = false
  }
}

// 表单中课程改变时加载章节
const handleFormCourseChange = async () => {
  formData.chapterId = null
  formChapterList.value = []
  
  if (formData.curriculumId) {
    chapterLoading.value = true
    try {
      const data = await getChapterDict(formData.curriculumId)
      if (data && Array.isArray(data)) {
        formChapterList.value = data
      }
    } catch (error) {
      console.error('获取章节列表失败:', error)
      ElMessage.error('获取章节列表失败')
    } finally {
      chapterLoading.value = false
    }
  }
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

// 添加选项
const addOption = () => {
  if (optionCount.value < 7) {
    optionCount.value++
  }
}

const handleAdd = async () => {
  // 显示加载动画
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '加载中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    isEdit.value = false
    optionCount.value = 2 // 重置为2个选项
    // 重置表单
    Object.assign(formData, {
      id: null,
      curriculumId: null,
      chapterId: null,
      type: 1,
      subject: '',
      selectA: '',
      selectB: '',
      selectC: '',
      selectD: '',
      selectE: '',
      selectF: '',
      selectG: '',
      answer: '',
      difficulty: 1,
      knowledgePoint: '',
      analysis: '',
      isUse: true,
      year: ''
    })
    
    // 加载课程列表
    await loadFormCourseList()
    dialogVisible.value = true
  } finally {
    loadingInstance.close()
  }
}

const handleEdit = async (row) => {
  // 显示加载动画
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '加载题目信息中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    isEdit.value = true
    
    // 加载课程列表
    await loadFormCourseList()
    
    // 获取题目详情
    const detail = await getQuestionDetail(row.id)
    
    if (detail) {
      // 从 options 数组中提取选项
      const optionsMap = {}
      if (detail.options && Array.isArray(detail.options)) {
        detail.options.forEach(opt => {
          // text 格式: "选项A：内容" 或直接 "内容"
          const text = opt.text.replace(/^选项[A-G][:：]\s*/, '')
          optionsMap[`select${opt.option}`] = text
        })
      }
      
      // 填充表单数据
      Object.assign(formData, {
        id: detail.id,
        curriculumId: row.courseId, // 从 row 中获取
        chapterId: row.chapterId,   // 从 row 中获取
        type: detail.type,
        subject: detail.subject,
        selectA: optionsMap.selectA || '',
        selectB: optionsMap.selectB || '',
        selectC: optionsMap.selectC || '',
        selectD: optionsMap.selectD || '',
        selectE: optionsMap.selectE || '',
        selectF: optionsMap.selectF || '',
        selectG: optionsMap.selectG || '',
        answer: detail.answer,
        difficulty: detail.difficulty,
        knowledgePoint: detail.knowledgePoint || '',
        analysis: detail.analysis || '',
        isUse: detail.isUse,
        year: detail.year || ''
      })
      
      // 计算选项数量
      let count = 2 // A和B必有
      if (optionsMap.selectC) count = 3
      if (optionsMap.selectD) count = 4
      if (optionsMap.selectE) count = 5
      if (optionsMap.selectF) count = 6
      if (optionsMap.selectG) count = 7
      optionCount.value = count
      
      // 加载对应课程的章节列表
      if (formData.curriculumId) {
        chapterLoading.value = true
        try {
          const chapterData = await getChapterDict(formData.curriculumId)
          if (chapterData && Array.isArray(chapterData)) {
            formChapterList.value = chapterData
            // 确保章节ID在列表加载后再设置
            formData.chapterId = row.chapterId
          }
        } catch (error) {
          console.error('获取章节列表失败:', error)
        } finally {
          chapterLoading.value = false
        }
      }
      
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('加载题目信息失败:', error)
    ElMessage.error('加载题目信息失败')
  } finally {
    loadingInstance.close()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    
    try {
      // 获取选中的课程和章节名称
      const selectedCourse = formCourseList.value.find(c => c.id === formData.curriculumId)
      const selectedChapter = formChapterList.value.find(c => c.id === formData.chapterId)
      
      const questionData = {
        curriculumId: formData.curriculumId,
        curriculumName: selectedCourse?.name || '',
        chapterId: formData.chapterId,
        chapterName: selectedChapter?.name || '',
        type: formData.type,
        subject: formData.subject,
        selectA: formData.selectA,
        selectB: formData.selectB,
        selectC: formData.selectC || '',
        selectD: formData.selectD || '',
        selectE: formData.selectE || '',
        selectF: formData.selectF || '',
        selectG: formData.selectG || '',
        answer: formData.answer,
        difficulty: formData.difficulty,
        knowledgePoint: formData.knowledgePoint || '',
        analysis: formData.analysis || '',
        isUse: formData.isUse,
        year: formData.year || ''
      }
      
      if (isEdit.value) {
        // 编辑
        await updateQuestion(formData.id, questionData)
        ElMessage.success('编辑成功')
      } else {
        // 新增
        await createQuestion(questionData)
        ElMessage.success('新增成功')
      }
      
      dialogVisible.value = false
      await loadData()
    } catch (error) {
      console.error(isEdit.value ? '编辑失败:' : '新增失败:', error)
      ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  formChapterList.value = []
  optionCount.value = 2 // 重置为2个选项
}
  ElMessageBox.confirm('确定要删除该题目吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // TODO: 调用删除接口
    loadData()
    ElMessage.success('删除成功')
  }).catch(() => {})

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
