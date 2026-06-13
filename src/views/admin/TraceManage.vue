<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">审核反馈</h1>
        <p class="page-subtitle">题目审核、用户反馈和人工批改统一处理。</p>
      </div>
      <el-button @click="loadData">刷新</el-button>
    </div>

    <section class="surface">
      <el-tabs v-model="tab" @tab-change="loadData">
        <el-tab-pane label="题目审核" name="audit">
          <el-table :data="auditRows" style="width: 100%">
            <el-table-column prop="id" label="题目 ID" width="100" />
            <el-table-column label="题干" min-width="260">
              <template #default="{ row }">{{ stripHtml(row.stemHtml).slice(0, 90) }}</template>
            </el-table-column>
            <el-table-column label="题型" width="110">
              <template #default="{ row }">{{ labelOf(QUESTION_TYPES, row.type) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="170">
              <template #default="{ row }">
                <el-button link type="primary" @click="approve(row)">通过</el-button>
                <el-button link type="danger" @click="reject(row)">驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="题目反馈" name="reports">
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
        </el-tab-pane>

        <el-tab-pane label="人工批改" name="grading">
          <el-table :data="gradingRows" style="width: 100%">
            <el-table-column prop="answerId" label="答案 ID" width="100" />
            <el-table-column prop="attemptId" label="作答 ID" width="100" />
            <el-table-column label="题干" min-width="260">
              <template #default="{ row }">{{ stripHtml(row.stemHtml).slice(0, 90) }}</template>
            </el-table-column>
            <el-table-column prop="questionScore" label="满分" width="90" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }"><el-button link type="primary" @click="openGrade(row)">批改</el-button></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
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

    <el-dialog v-model="gradeVisible" title="人工批改" width="min(520px, 94%)">
      <el-form label-position="top">
        <el-form-item label="得分">
          <el-input-number v-model="gradeForm.score" :min="0" :max="gradeForm.maxScore" style="width: 100%" />
        </el-form-item>
        <el-form-item label="评语">
          <el-input v-model="gradeForm.comment" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="gradeVisible = false">取消</el-button>
        <el-button type="primary" @click="saveGrade">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  approveQuestion,
  gradeAnswer,
  handleQuestionReport,
  listAuditQuestions,
  listPendingGradings,
  listQuestionReports,
  rejectQuestion
} from '@/api/admin'
import { QUESTION_TYPES, REPORT_REASONS, REPORT_STATUS, labelOf, tagOf } from '@/utils/dictionaries'
import { getPageList, stripHtml } from '@/utils/helpers'

const tab = ref('audit')
const auditRows = ref([])
const reportRows = ref([])
const gradingRows = ref([])
const reportStatus = ref()
const handleVisible = ref(false)
const gradeVisible = ref(false)
const currentId = ref()
const handleForm = reactive({ status: 2, handleResult: '' })
const gradeForm = reactive({ answerId: undefined, score: 0, maxScore: 100, comment: '' })

const loadData = async () => {
  if (tab.value === 'audit') {
    const data = await listAuditQuestions({ page: 1, pageSize: 50 })
    auditRows.value = getPageList(data)
  }
  if (tab.value === 'reports') {
    reportRows.value = await listQuestionReports({ status: reportStatus.value })
  }
  if (tab.value === 'grading') {
    gradingRows.value = await listPendingGradings()
  }
}

const reason = async (title) => {
  const { value } = await ElMessageBox.prompt(title, '说明', { inputPlaceholder: '可留空' })
  return { reason: value || '' }
}

const approve = async (row) => {
  await approveQuestion(row.id, await reason('通过说明'))
  ElMessage.success('已通过')
  loadData()
}

const reject = async (row) => {
  await rejectQuestion(row.id, await reason('驳回原因'))
  ElMessage.success('已驳回')
  loadData()
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

const openGrade = (row) => {
  gradeForm.answerId = row.answerId
  gradeForm.maxScore = Number(row.questionScore || 100)
  gradeForm.score = gradeForm.maxScore
  gradeForm.comment = ''
  gradeVisible.value = true
}

const saveGrade = async () => {
  await gradeAnswer(gradeForm.answerId, { score: gradeForm.score, comment: gradeForm.comment })
  ElMessage.success('批改完成')
  gradeVisible.value = false
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.feedback-filter {
  margin-bottom: 12px;
}
</style>
