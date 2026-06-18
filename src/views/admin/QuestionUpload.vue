<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">题目导入</h1>
        <p class="page-subtitle">支持 Excel 文件导入，也支持按后端 DTO 提交 JSON 题目数组。</p>
      </div>
      <el-button @click="loadData">刷新批次</el-button>
    </div>

    <section class="surface">
      <h2>导入目标</h2>
      <el-form label-position="top" class="target-form">
        <el-form-item label="课程" required>
          <el-select v-model="target.curriculumId" clearable filterable placeholder="请选择课程" style="width: 100%" @change="handleCourseChange">
            <el-option v-for="course in courses" :key="course.id" :label="course.name" :value="course.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="章节" required>
          <el-select v-model="target.chapterId" clearable filterable placeholder="请选择章节" style="width: 100%" :disabled="!target.curriculumId">
            <el-option v-for="chapter in targetChapters" :key="chapter.id" :label="chapter.name" :value="chapter.id" />
          </el-select>
        </el-form-item>
      </el-form>
    </section>

    <div class="upload-grid">
      <section class="surface">
        <h2>Excel 导入</h2>
        <el-upload ref="uploadRef" drag :auto-upload="false" :limit="1" :on-change="handleFileChange" :on-remove="() => (file = null)">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div>拖拽 Excel 到这里，或点击选择文件</div>
        </el-upload>
        <el-button type="primary" :disabled="!file || !targetReady" :loading="uploading" style="margin-top: 12px" @click="uploadExcel">
          上传导入
        </el-button>
      </section>

      <section class="surface">
        <h2>JSON 导入</h2>
        <el-input v-model="jsonText" type="textarea" :rows="9" placeholder='{"questions":[...]}' />
        <el-button type="primary" :disabled="!targetReady" :loading="jsonImporting" style="margin-top: 12px" @click="importJson">提交 JSON</el-button>
      </section>
    </div>

    <section class="surface">
      <div class="section-head">
        <h2>导入模板</h2>
        <el-button text :icon="CopyDocument" @click="copyTemplate">复制 JSON 模板</el-button>
      </div>
      <pre class="template-box">{{ template }}</pre>
    </section>

    <section class="surface">
      <h2>导入批次</h2>
      <el-table :data="rows" style="width: 100%">
        <el-table-column prop="id" label="批次" width="90" />
        <el-table-column prop="fileUrl" label="文件" min-width="160" show-overflow-tooltip />
        <el-table-column prop="totalCount" label="总数" width="90" />
        <el-table-column prop="successCount" label="成功" width="90" />
        <el-table-column prop="failCount" label="失败" width="90" />
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }"><el-button link type="primary" @click="showErrors(row)">错误</el-button></template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="errorVisible" title="错误行" width="min(720px, 96%)">
      <el-table :data="errors" style="width: 100%">
        <el-table-column prop="rowNo" label="行号" width="90" />
        <el-table-column prop="errorMessage" label="错误" min-width="220" />
        <el-table-column prop="rawJson" label="原始数据" min-width="260" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, UploadFilled } from '@element-plus/icons-vue'
import {
  getImportTemplate,
  importQuestionExcel,
  importQuestions,
  listChapters,
  listCourses,
  listImportBatches,
  listImportErrors
} from '@/api/admin'
import { formatDateTime, getPageList } from '@/utils/helpers'

const file = ref(null)
const uploadRef = ref()
const uploading = ref(false)
const jsonImporting = ref(false)
const jsonText = ref('')
const template = ref('')
const rows = ref([])
const errors = ref([])
const errorVisible = ref(false)
const courses = ref([])
const chapters = ref([])
const target = reactive({
  curriculumId: undefined,
  chapterId: undefined
})

const targetChapters = computed(() => chapters.value.filter((item) => item.curriculumId === target.curriculumId))
const targetReady = computed(() => Boolean(target.curriculumId && target.chapterId))

const handleFileChange = (uploadFile) => {
  file.value = uploadFile.raw
}

const handleCourseChange = () => {
  target.chapterId = undefined
}

const getTargetPayload = () => ({
  curriculumId: target.curriculumId,
  chapterId: target.chapterId
})

const validateTarget = () => {
  if (!target.curriculumId) {
    ElMessage.warning('请先选择要导入的课程')
    return false
  }
  if (!target.chapterId) {
    ElMessage.warning('请先选择要导入的章节')
    return false
  }
  return true
}

const uploadExcel = async () => {
  if (!validateTarget()) return

  uploading.value = true
  try {
    await importQuestionExcel(file.value, getTargetPayload())
    ElMessage.success('导入任务已完成')
    file.value = null
    uploadRef.value?.clearFiles()
    await loadData()
  } finally {
    uploading.value = false
  }
}

const importJson = async () => {
  const text = jsonText.value.trim()
  if (!text) {
    ElMessage.warning('请先输入 JSON 内容')
    return
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    ElMessage.error('JSON 格式不正确，请检查后再提交')
    return
  }

  if (!validateTarget()) return

  jsonImporting.value = true
  try {
    const payload = buildQuestionPayload(data)
    if (!payload) return

    await importQuestions(payload)
    ElMessage.success('JSON 导入完成')
    jsonText.value = ''
    await loadData()
  } finally {
    jsonImporting.value = false
  }
}

const showErrors = async (row) => {
  errors.value = await listImportErrors(row.id)
  errorVisible.value = true
}

const copyTemplate = async () => {
  const text = template.value.trim()
  if (!text) {
    ElMessage.warning('当前没有可复制的模板内容')
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('JSON 模板已复制')
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', 'readonly')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()

    try {
      document.execCommand('copy')
      ElMessage.success('JSON 模板已复制')
    } catch {
      ElMessage.error('复制失败，请手动复制模板内容')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

const buildQuestionPayload = (data) => {
  const targetPayload = getTargetPayload()
  const questions = Array.isArray(data) ? data : data?.questions
  if (!Array.isArray(questions)) {
    ElMessage.error('JSON 内容必须是题目数组或包含 questions 数组的对象')
    return null
  }

  return {
    ...(Array.isArray(data) ? {} : data),
    ...targetPayload,
    questions: questions.map((question) => ({ ...question, ...targetPayload }))
  }
}

const formatTemplate = (value) => {
  const notes = Array.isArray(value?.notes) ? value.notes : []
  const json = JSON.stringify(value?.template ?? value ?? {}, null, 2)
  const fieldMeta = value?.fieldMeta ?? {}
  const annotated = json
    .split('\n')
    .map((line) => {
      const match = line.match(/^(\s*)"([^"]+)":/)
      const meta = fieldMeta[match?.[2]]
      if (!meta) {
        return line
      }
      const parts = [meta.requirement, meta.comment].filter(Boolean)
      return parts.length ? `${line} // ${parts.join('；')}` : line
    })
    .join('\n')

  return [...notes.map((note) => `// ${note}`), annotated].join('\n')
}

const loadOptions = async () => {
  const [courseRows, chapterRows] = await Promise.all([listCourses(), listChapters()])
  courses.value = getPageList(courseRows)
  chapters.value = getPageList(chapterRows)
}

const loadData = async () => {
  const [tpl, batchPage] = await Promise.all([getImportTemplate(), listImportBatches({ page: 1, pageSize: 20 })])
  template.value = formatTemplate(tpl)
  rows.value = getPageList(batchPage)
}

onMounted(async () => {
  await Promise.all([loadOptions(), loadData()])
})
</script>

<style scoped>
.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
  gap: 16px;
}

.target-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.target-form :deep(.el-form-item) {
  margin-bottom: 0;
}

h2 {
  margin: 0 0 14px;
  font-size: 18px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-head h2 {
  margin: 0;
}

.template-box {
  max-height: 260px;
  overflow: auto;
  padding: 12px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
}

@media (max-width: 760px) {
  .upload-grid {
    grid-template-columns: 1fr;
  }

  .target-form {
    grid-template-columns: 1fr;
  }

  .template-box {
    max-height: 220px;
    font-size: 12px;
  }
}
</style>
