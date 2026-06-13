<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">题目导入</h1>
        <p class="page-subtitle">支持 Excel 文件导入，也支持按后端 DTO 提交 JSON 题目数组。</p>
      </div>
      <el-button @click="loadData">刷新批次</el-button>
    </div>

    <div class="upload-grid">
      <section class="surface">
        <h2>Excel 导入</h2>
        <el-upload drag :auto-upload="false" :limit="1" :on-change="handleFileChange" :on-remove="() => (file = null)">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div>拖拽 Excel 到这里，或点击选择文件</div>
        </el-upload>
        <el-button type="primary" :disabled="!file" :loading="uploading" style="margin-top: 12px" @click="uploadExcel">
          上传导入
        </el-button>
      </section>

      <section class="surface">
        <h2>JSON 导入</h2>
        <el-input v-model="jsonText" type="textarea" :rows="9" placeholder='{"questions":[...]}' />
        <el-button type="primary" style="margin-top: 12px" @click="importJson">提交 JSON</el-button>
      </section>
    </div>

    <section class="surface">
      <h2>导入模板</h2>
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
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { getImportTemplate, importQuestionExcel, importQuestions, listImportBatches, listImportErrors } from '@/api/admin'
import { formatDateTime, getPageList } from '@/utils/helpers'

const file = ref(null)
const uploading = ref(false)
const jsonText = ref('')
const template = ref('')
const rows = ref([])
const errors = ref([])
const errorVisible = ref(false)

const handleFileChange = (uploadFile) => {
  file.value = uploadFile.raw
}

const uploadExcel = async () => {
  uploading.value = true
  try {
    await importQuestionExcel(file.value)
    ElMessage.success('导入任务已完成')
    file.value = null
    loadData()
  } finally {
    uploading.value = false
  }
}

const importJson = async () => {
  const data = JSON.parse(jsonText.value)
  await importQuestions(data.questions ? data : { questions: data })
  ElMessage.success('JSON 导入完成')
  jsonText.value = ''
  loadData()
}

const showErrors = async (row) => {
  errors.value = await listImportErrors(row.id)
  errorVisible.value = true
}

const loadData = async () => {
  const [tpl, batchPage] = await Promise.all([getImportTemplate(), listImportBatches({ page: 1, pageSize: 20 })])
  template.value = JSON.stringify(tpl, null, 2)
  rows.value = getPageList(batchPage)
}

onMounted(loadData)
</script>

<style scoped>
.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

h2 {
  margin: 0 0 14px;
  font-size: 18px;
}

.template-box {
  max-height: 260px;
  overflow: auto;
  padding: 12px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 8px;
}
</style>
