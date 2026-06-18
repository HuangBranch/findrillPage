<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">题目反馈</h1>
        <p class="page-subtitle">集中处理用户提交的题目反馈。</p>
      </div>
      <el-button @click="loadData">刷新</el-button>
    </div>

    <section class="surface">
      <div class="toolbar feedback-filter">
        <el-select v-model="reportStatus" clearable placeholder="状态" style="width: 160px" @change="loadData">
          <el-option v-for="item in REPORT_STATUS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
      <el-table :data="reportRows" style="width: 100%">
        <el-table-column prop="id" label="反馈 ID" width="100" />
        <el-table-column prop="questionId" label="题目 ID" width="100" />
        <el-table-column label="原因" width="120">
          <template #default="{ row }">{{ labelOf(REPORT_REASONS, row.reason) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }"><el-tag :type="tagOf(REPORT_STATUS, row.status)">{{ labelOf(REPORT_STATUS, row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }"><el-button link type="primary" @click="openHandle(row)">处理</el-button></template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="handleVisible" title="处理反馈" width="min(520px, 94%)">
      <el-form label-position="top">
        <el-form-item label="状态">
          <el-select v-model="handleForm.status" style="width: 100%">
            <el-option v-for="item in REPORT_STATUS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理结果">
          <el-input v-model="handleForm.handleResult" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleVisible = false">取消</el-button>
        <el-button type="primary" @click="saveHandle">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { handleQuestionReport, listQuestionReports } from '@/api/admin'
import { REPORT_REASONS, REPORT_STATUS, labelOf, tagOf } from '@/utils/dictionaries'

const reportRows = ref([])
const reportStatus = ref()
const handleVisible = ref(false)
const currentId = ref()
const handleForm = reactive({ status: 2, handleResult: '' })

const loadData = async () => {
  reportRows.value = await listQuestionReports({ status: reportStatus.value, limit: 50 })
}

const openHandle = (row) => {
  currentId.value = row.id
  handleForm.status = row.status || 2
  handleForm.handleResult = row.handleResult || ''
  handleVisible.value = true
}

const saveHandle = async () => {
  await handleQuestionReport(currentId.value, handleForm)
  ElMessage.success('反馈已处理')
  handleVisible.value = false
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.feedback-filter {
  margin-bottom: 12px;
}
</style>
