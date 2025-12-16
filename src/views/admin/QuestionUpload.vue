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
                  <el-select v-model="excelForm.courseId" placeholder="请选择课程" style="width: 100%" @change="handleExcelCourseChange">
                    <el-option v-for="course in courseList" :key="course.id" :label="course.name" :value="course.id" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="所属章节">
                  <el-select v-model="excelForm.chapterId" placeholder="请选择章节" style="width: 100%" :disabled="!excelForm.courseId">
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
                <el-button @click="downloadTemplate">
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
                    <p><strong>必需列：</strong></p>
                    <p>• 题目类型（单选题/多选题/判断题）</p>
                    <p>• 题目内容</p>
                    <p>• 选项A、选项B（判断题不需要）</p>
                    <p>• 正确答案（多个答案用逗号分隔）</p>
                    <p><strong>可选列：</strong></p>
                    <p>• 选项C、选项D、选项E、选项F</p>
                    <p>• 难度等级（1-5）</p>
                    <p>• 知识点</p>
                    <p>• 答案解析</p>
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
                  <el-select v-model="jsonForm.courseId" placeholder="请选择课程" style="width: 100%" @change="handleJsonCourseChange">
                    <el-option v-for="course in courseList" :key="course.id" :label="course.name" :value="course.id" />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="所属章节">
                  <el-select v-model="jsonForm.chapterId" placeholder="请选择章节" style="width: 100%" :disabled="!jsonForm.courseId">
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
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Upload, Download, Document } from '@element-plus/icons-vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const courseList = ref([
  { id: 1, name: 'Java 基础' },
  { id: 2, name: 'Python 入门' },
  { id: 3, name: 'JavaScript 高级' }
])

const chapterList = ref([
  { id: 1, courseId: 1, name: '第一章' },
  { id: 2, courseId: 1, name: '第二章' },
  { id: 3, courseId: 2, name: '第一章' },
  { id: 4, courseId: 2, name: '第二章' },
  { id: 5, courseId: 3, name: '第一章' },
  { id: 6, courseId: 3, name: '第二章' }
])

// Excel 上传
const excelForm = ref({ courseId: null, chapterId: null })
const excelFile = ref(null)
const excelUploading = ref(false)

const excelFilteredChapters = computed(() => {
  if (!excelForm.value.courseId) return []
  return chapterList.value.filter(c => c.courseId === excelForm.value.courseId)
})

const handleExcelCourseChange = () => {
  excelForm.value.chapterId = null
}

const handleExcelChange = (file) => {
  excelFile.value = file
}

const handleExcelUpload = () => {
  if (!excelForm.value.courseId || !excelForm.value.chapterId) {
    ElMessage.warning('请选择课程和章节')
    return
  }
  
  if (!excelFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  
  excelUploading.value = true
  
  // 模拟上传
  setTimeout(() => {
    ElMessage.success('上传成功！共导入 50 道题目')
    excelUploading.value = false
    excelFile.value = null
  }, 2000)
}

const downloadTemplate = () => {
  ElMessage.info('正在下载模板文件...')
  // 实际项目中这里应该触发文件下载
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
  if (!jsonForm.value.courseId) return []
  return chapterList.value.filter(c => c.courseId === jsonForm.value.courseId)
})

const handleJsonCourseChange = () => {
  jsonForm.value.chapterId = null
}

const handleJsonUpload = () => {
  if (!jsonForm.value.courseId || !jsonForm.value.chapterId) {
    ElMessage.warning('请选择课程和章节')
    return
  }
  
  if (!jsonForm.value.content.trim()) {
    ElMessage.warning('请输入 JSON 内容')
    return
  }
  
  try {
    JSON.parse(jsonForm.value.content)
  } catch (error) {
    ElMessage.error('JSON 格式不正确，请检查')
    return
  }
  
  jsonUploading.value = true
  
  // 模拟上传
  setTimeout(() => {
    ElMessage.success('上传成功！')
    jsonUploading.value = false
    jsonForm.value.content = ''
  }, 1500)
}

const jsonExample = `[
  {
    "type": "single",
    "subject": "以下哪个是Java的特点？",
    "options": ["跨平台", "面向对象", "安全性", "以上都是"],
    "answer": "D",
    "difficulty": 3,
    "knowledgePoint": "Java基础",
    "analysis": "Java具有跨平台、面向对象、安全性等特点"
  },
  {
    "type": "multiple",
    "subject": "以下哪些是Python的特点？",
    "options": ["简单易学", "开源免费", "可移植性", "丰富的库"],
    "answer": "ABCD",
    "difficulty": 2,
    "knowledgePoint": "Python特性",
    "analysis": "Python具有多种优秀特点"
  },
  {
    "type": "judge",
    "subject": "JavaScript是一门编译型语言",
    "answer": "F",
    "difficulty": 1,
    "knowledgePoint": "JavaScript基础",
    "analysis": "JavaScript是解释型语言"
  }
]`

const showJsonExample = () => {
  jsonExampleVisible.value = true
}
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
