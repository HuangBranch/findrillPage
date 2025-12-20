<template>
  <AdminLayout>
    <div class="question-upload-page">
      <el-row :gutter="20">
        <!-- Excel 批量上传 -->
        <el-col :xs="24" :md="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>Excel 批量上传</span>
                <el-tag type="success">推荐</el-tag>
              </div>
            </template>
            
            <div class="upload-section">
              <el-form :model="excelForm" label-width="100px">
                <el-form-item label="所属课程">
                  <el-select v-model="excelForm.courseId" placeholder="请选择课程" style="width: 100%" @change="handleExcelCourseChange" :loading="courseLoading">
                    <el-option v-for="course in courseList" :key="course.id" :label="course.name" :value="course.id" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="所属章节">
                  <el-select v-model="excelForm.chapterId" placeholder="请选择章节" style="width: 100%" :disabled="!excelForm.courseId" :loading="chapterLoading">
                    <el-option v-for="chapter in excelFilteredChapters" :key="chapter.id" :label="chapter.name" :value="chapter.id" />
                  </el-select>
                </el-form-item>
              </el-form>
              
              <el-upload
                class="upload-demo"
                drag
                :auto-upload="false"
                :on-change="handleExcelChange"
                accept=".xlsx,.xls"
                :limit="1"
              >
                <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                <div class="el-upload__text">
                  将 Excel 文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    只能上传 .xlsx/.xls 文件，且不超过 10MB
                  </div>
                </template>
              </el-upload>
              
              <div class="upload-actions">
                <el-button type="primary" @click="handleExcelUpload" :loading="excelUploading" :disabled="!excelFile">
                  <el-icon><Upload /></el-icon>
                  开始上传
                </el-button>
                <el-button @click="handleDownloadTemplate">
                  <el-icon><Download /></el-icon>
                  下载模板
                </el-button>
              </div>
              
              <el-alert
                title="Excel 格式说明"
                type="info"
                :closable="false"
                style="margin-top: 20px"
              >
                <template #default>
                  <div style="font-size: 13px; line-height: 1.8;">
                    <p><strong>必填列：</strong></p>
                    <p>• 题型：single（单选题）/ multiple（多选题）/ judge（判断题）</p>
                    <p>• 题目标题：题目内容</p>
                    <p>• 答案：单选填单个字母（如A），多选不用逗号分隔（如AB）</p>
                    <p><strong>选项列：</strong></p>
                    <p>• 选项A、选项B：必填（判断题也需要填"正确"和"错误"）</p>
                    <p>• 选项C、选项D、选项E、选项F：可选</p>
                    <p><strong>其他列：</strong></p>
                    <p>• 年份：如2024（可选）</p>
                    <p>• 难度：简单/中等/困难 或 1/2/3（可选，默认中等）</p>
                    <p>• 知识点：题目相关知识点（可选）</p>
                    <p>• 解析：答案解析说明（可选）</p>
                    <p style="color: #E6A23C; margin-top: 8px;"><strong>提示：</strong>课程和章节无需在Excel中填写，会自动使用上方选择的课程和章节</p>
                  </div>
                </template>
              </el-alert>
            </div>
          </el-card>
        </el-col>
        
        <!-- JSON 格式上传 -->
        <el-col :xs="24" :md="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>JSON 格式上传</span>
              </div>
            </template>
            
            <div class="upload-section">
              <el-form :model="jsonForm" label-width="100px">
                <el-form-item label="所属课程">
                  <el-select v-model="jsonForm.courseId" placeholder="请选择课程" style="width: 100%" @change="handleJsonCourseChange" :loading="courseLoading">
                    <el-option v-for="course in courseList" :key="course.id" :label="course.name" :value="course.id" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="所属章节">
                  <el-select v-model="jsonForm.chapterId" placeholder="请选择章节" style="width: 100%" :disabled="!jsonForm.courseId" :loading="chapterLoading">
                    <el-option v-for="chapter in jsonFilteredChapters" :key="chapter.id" :label="chapter.name" :value="chapter.id" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="JSON 内容">
                  <el-input
                    v-model="jsonForm.content"
                    type="textarea"
                    :rows="12"
                    placeholder="请输入 JSON 格式的题目数据"
                  />
                </el-form-item>
              </el-form>
              
              <div class="upload-actions">
                <el-button type="primary" @click="handleJsonUpload" :loading="jsonUploading">
                  <el-icon><Upload /></el-icon>
                  开始上传
                </el-button>
                <el-button @click="showJsonExample">
                  <el-icon><Document /></el-icon>
                  查看示例
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- JSON 示例对话框 -->
      <el-dialog v-model="jsonExampleVisible" title="JSON 格式示例" width="90%" :style="{ maxWidth: '700px' }">
        <pre style="background: #f5f7fa; padding: 16px; border-radius: 4px; overflow-x: auto;"><code>{{ jsonExample }}</code></pre>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Upload, Download } from '@element-plus/icons-vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getCourseDict, getChapterDict, batchAddQuestions } from '@/api/admin'
import { parseExcelFile, downloadTemplate } from '@/utils/excelParser'

const courseList = ref([])
const courseLoading = ref(false)
const chapterLoading = ref(false)

// 加载课程列表
const loadCourseList = async () => {
  courseLoading.value = true
  try {
    const data = await getCourseDict()
    if (data && Array.isArray(data)) {
      courseList.value = data
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
    ElMessage.error('获取课程列表失败')
  } finally {
    courseLoading.value = false
  }
}

const chapterList = ref([])

// Excel 上传
const excelForm = ref({ courseId: null, chapterId: null })
const excelFile = ref(null)
const excelUploading = ref(false)

const excelFilteredChapters = computed(() => {
  return chapterList.value
})

const handleExcelCourseChange = async () => {
  excelForm.value.chapterId = null
  chapterList.value = []
  
  if (excelForm.value.courseId) {
    chapterLoading.value = true
    try {
      const data = await getChapterDict(excelForm.value.courseId)
      if (data && Array.isArray(data)) {
        chapterList.value = data
      }
    } catch (error) {
      console.error('获取章节列表失败:', error)
      ElMessage.error('获取章节列表失败')
    } finally {
      chapterLoading.value = false
    }
  }
}

const handleExcelChange = (file) => {
  excelFile.value = file
}

const handleExcelUpload = async () => {
  if (!excelForm.value.courseId || !excelForm.value.chapterId) {
    ElMessage.warning('请选择课程和章节')
    return
  }
  
  if (!excelFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  
  excelUploading.value = true
  
  try {
    // 解析Excel文件
    const result = await parseExcelFile(excelFile.value.raw)
    
    if (!result.success) {
      // 显示验证错误
      const errorMsg = result.errors.map(err => 
        `第${err.row}行: ${err.errors.join(', ')}`
      ).join('\n')
      ElMessage.error({
        message: `Excel数据验证失败：\n${errorMsg}`,
        duration: 5000,
        showClose: true
      })
      return
    }
    
    // 获取选中的课程名和章节名
    const selectedCourse = courseList.value.find(c => c.id === excelForm.value.courseId)
    const selectedChapter = chapterList.value.find(c => c.id === excelForm.value.chapterId)
    const curriculumId = selectedCourse?.id || ''
    const chapterId = selectedChapter?.id || ''
    
    // 转换为后端需要的格式
    const questions = result.data.map(item => {
      // 题型映射: single->1, multiple->2, judge->3
      const typeMap = { single: 1, multiple: 2, judge: 3 }
      const type = typeMap[item.type] || 1
      
      // 组装答案（数组转字符串）
      const answer = Array.isArray(item.answer) ? item.answer.join('') : String(item.answer)
      
      return {
        subject: item.questionTitle || '',
        type: type,
        selectA: item.options.A || '',
        selectB: item.options.B || '',
        selectC: item.options.C || '',
        selectD: item.options.D || '',
        selectE: item.options.E || '',
        selectF: item.options.F || '',
        selectG: item.options.G || '',
        answer: answer,
        difficulty: item.difficulty || 0,
        knowledgePoint: item.knowledgePoint || '',
        analysis: item.analysis || '',
        isUse: true,
        year: String(item.year || ''),
        curriculumId,
        chapterId
      }
    })
    
    // 调用批量上传接口
    await batchAddQuestions(questions)
    
    ElMessage.success(`上传成功！共导入 ${questions.length} 道题目`)
    excelFile.value = null
  } catch (error) {
    console.error('Excel上传失败:', error)
    ElMessage.error('Excel上传失败：' + error.message)
  } finally {
    excelUploading.value = false
  }
}

const handleDownloadTemplate = () => {
  try {
    downloadTemplate()
    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('模板下载失败:', error)
    ElMessage.error('模板下载失败')
  }
}

// JSON 上传
const jsonForm = ref({
  courseId: null,
  chapterId: null,
  content: ''
})
const jsonUploading = ref(false)
const jsonExampleVisible = ref(false)

const jsonFilteredChapters = computed(() => {
  return chapterList.value
})

const handleJsonCourseChange = async () => {
  jsonForm.value.chapterId = null
  chapterList.value = []
  
  if (jsonForm.value.courseId) {
    chapterLoading.value = true
    try {
      const data = await getChapterDict(jsonForm.value.courseId)
      if (data && Array.isArray(data)) {
        chapterList.value = data
      }
    } catch (error) {
      console.error('获取章节列表失败:', error)
      ElMessage.error('获取章节列表失败')
    } finally {
      chapterLoading.value = false
    }
  }
}

const handleJsonUpload = async () => {
  if (!jsonForm.value.courseId || !jsonForm.value.chapterId) {
    ElMessage.warning('请选择课程和章节')
    return
  }
  
  if (!jsonForm.value.content.trim()) {
    ElMessage.warning('请输入 JSON 内容')
    return
  }
  
  let questions
  try {
    questions = JSON.parse(jsonForm.value.content)
    if (!Array.isArray(questions)) {
      ElMessage.error('JSON 必须是一个数组')
      return
    }
  } catch (error) {
    ElMessage.error('JSON 格式不正确，请检查')
    return
  }
  
  jsonUploading.value = true
  
  try {
    // 获取选中的课程名和章节名
    const selectedCourse = courseList.value.find(c => c.id === jsonForm.value.courseId)
    const selectedChapter = chapterList.value.find(c => c.id === jsonForm.value.chapterId)
    const curriculumId = selectedCourse?.id || ''
    const chapterId = selectedChapter?.id || ''
    
    // 为每道题添加课程名和章节名
    const questionsWithNames = questions.map(item => ({
      ...item,
      curriculumId,
      chapterId,
      // 确保必填字段有默认值
      analysis: item.analysis ?? '',
      answer: item.answer ?? '',
      difficulty: item.difficulty ?? 0,
      isUse: item.isUse ?? true,
      knowledgePoint: item.knowledgePoint ?? '',
      selectA: item.selectA ?? '',
      selectB: item.selectB ?? '',
      selectC: item.selectC ?? '',
      selectD: item.selectD ?? '',
      selectE: item.selectE ?? '',
      selectF: item.selectF ?? '',
      selectG: item.selectG ?? '',
      subject: item.subject ?? '',
      type: item.type ?? 0,
      year: item.year ?? ''
    }))
    
    await batchAddQuestions(questionsWithNames)
    ElMessage.success(`上传成功！共导入 ${questionsWithNames.length} 道题目`)
    jsonForm.value.content = ''
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败')
  } finally {
    jsonUploading.value = false
  }
}

const jsonExample = `[
  {
    "subject": "以下哪个是Java的特点？", // 题目内容（必填）
    "type": 1, // 题目类型 1=单选题 2=多选题 3=判断题（必填）
    "selectA": "跨平台", // 选项A（必填）
    "selectB": "面向对象", // 选项B（必填）
    "selectC": "安全性", // 选项C
    "selectD": "以上都是", // 选项D
    "selectE": "", // 选项E
    "selectF": "", // 选项F
    "selectG": "", // 选项G
    "answer": "D", // 正确答案，单选填一个字母如"A"，多选填多个字母如"ABCD"（必填）
    "difficulty": 3, // 难度等级 1-3（可选，默认1）
    "knowledgePoint": "Java基础", // 知识点（可选）
    "analysis": "Java具有跨平台、面向对象、安全性等特点", // 答案解析（可选）
    "isUse": true, // 是否启用 true/false（可选，默认true）
    "year": "2024" // 年份（可选）
  },
  {
    "subject": "以下哪些是Python的特点？(多选)",
    "type": 2,
    "selectA": "简单易学",
    "selectB": "开源免费",
    "selectC": "可移植性",
    "selectD": "丰富的库",
    "selectE": "强类型语言",
    "selectF": "编译型语言",
    "selectG": "",
    "answer": "ABCD",
    "difficulty": 2,
    "knowledgePoint": "Python特性",
    "analysis": "Python具有多种优秀特点",
    "isUse": true,
    "year": "2024"
  },
  {
    "subject": "JavaScript是一门编译型语言",
    "type": 3,
    "selectA": "正确",
    "selectB": "错误",
    "selectC": "",
    "selectD": "",
    "selectE": "",
    "selectF": "",
    "selectG": "",
    "answer": "B",
    "difficulty": 1,
    "knowledgePoint": "JavaScript基础",
    "analysis": "JavaScript是解释型语言",
    "isUse": true,
    "year": "2024"
  }
]`

const showJsonExample = () => {
  jsonExampleVisible.value = true
}

onMounted(() => {
  loadCourseList()
})
</script>

<style scoped>
.question-upload-page {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-section {
  padding: 8px 0;
}

.upload-demo {
  margin: 20px 0;
}

.upload-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

:deep(.el-upload-dragger) {
  padding: 40px;
}

@media (max-width: 1024px) {
  .card-header {
    font-size: 15px;
  }
}

@media (max-width: 768px) {
  .upload-section {
    padding: 0;
  }
  
  .upload-actions {
    flex-direction: column;
  }
  
  .upload-actions :deep(.el-button) {
    width: 100%;
  }
  
  :deep(.el-upload-dragger) {
    padding: 30px 20px;
  }
  
  :deep(.el-form-item__label) {
    font-size: 13px;
  }
  
  :deep(.el-alert) {
    font-size: 12px;
    padding: 8px 12px;
  }
}

@media (max-width: 375px) {
  :deep(.el-upload-dragger) {
    padding: 20px 15px;
  }
  
  .el-upload__text {
    font-size: 13px;
  }
}
</style>
