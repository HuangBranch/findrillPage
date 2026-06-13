<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">考试配置</h1>
        <p class="page-subtitle">创建普通练习、正式考试和错题练习配置。</p>
      </div>
      <el-button type="primary" @click="openCreate">新增配置</el-button>
    </div>

    <section class="surface">
      <div class="toolbar">
        <el-select v-model="query.mode" clearable placeholder="模式" style="width: 160px" @change="loadData">
          <el-option v-for="item in EXAM_MODES" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="query.curriculumId" clearable filterable placeholder="课程" style="width: 200px" @change="loadData">
          <el-option v-for="course in courses" :key="course.id" :label="course.name" :value="course.id" />
        </el-select>
        <el-button @click="loadData">查询</el-button>
      </div>

      <el-table :data="rows" style="width: 100%; margin-top: 14px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column label="模式" width="110">
          <template #default="{ row }"><el-tag :type="tagOf(EXAM_MODES, row.mode)">{{ labelOf(EXAM_MODES, row.mode) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="questionCount" label="题数" width="90" />
        <el-table-column prop="durationMinutes" label="限时" width="90" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-switch v-model="rowEnabled[row.id]" @change="toggle(row)" /></template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="formVisible" :title="editingId ? '编辑配置' : '新增配置'" width="min(720px, 96%)">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="form-grid">
          <el-form-item label="名称" prop="name"><el-input v-model.trim="form.name" /></el-form-item>
          <el-form-item label="模式" prop="mode">
            <el-select v-model="form.mode" style="width: 100%">
              <el-option v-for="item in EXAM_MODES" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item label="课程" prop="curriculumId">
            <el-select v-model="form.curriculumId" filterable style="width: 100%" @change="form.chapterId = undefined">
              <el-option v-for="course in courses" :key="course.id" :label="course.name" :value="course.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="章节">
            <el-select v-model="form.chapterId" clearable filterable style="width: 100%">
              <el-option v-for="chapter in formChapters" :key="chapter.id" :label="chapter.name" :value="chapter.id" />
            </el-select>
          </el-form-item>
        </div>
        <div class="form-grid four">
          <el-form-item label="题数"><el-input-number v-model="form.questionCount" :min="1" style="width: 100%" /></el-form-item>
          <el-form-item label="限时(分钟)"><el-input-number v-model="form.durationMinutes" :min="0" style="width: 100%" /></el-form-item>
          <el-form-item label="及格分"><el-input-number v-model="form.passScore" :min="0" style="width: 100%" /></el-form-item>
          <el-form-item label="状态"><el-switch v-model="enabledForm" /></el-form-item>
        </div>
        <div class="form-grid four">
          <el-form-item label="显示答案"><el-input-number v-model="form.showAnswerPolicy" :min="0" style="width: 100%" /></el-form-item>
          <el-form-item label="显示解析"><el-input-number v-model="form.showAnalysisPolicy" :min="0" style="width: 100%" /></el-form-item>
          <el-form-item label="允许重试"><el-switch v-model="form.allowRetry" /></el-form-item>
          <el-form-item label="随机题序"><el-switch v-model="form.randomQuestionOrder" /></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createExamConfig,
  deleteExamConfig,
  listChapters,
  listCourses,
  listExamConfigsAdmin,
  updateExamConfig,
  updateExamConfigStatus
} from '@/api/admin'
import { EXAM_MODES, labelOf, tagOf } from '@/utils/dictionaries'

const rows = ref([])
const courses = ref([])
const chapters = ref([])
const rowEnabled = reactive({})
const formVisible = ref(false)
const editingId = ref()
const formRef = ref()
const query = reactive({ mode: undefined, curriculumId: undefined, status: undefined })
const form = reactive({
  curriculumId: undefined,
  chapterId: undefined,
  name: '',
  mode: 1,
  questionCount: 10,
  durationMinutes: 0,
  passScore: 60,
  showAnswerPolicy: 1,
  showAnalysisPolicy: 1,
  allowRetry: true,
  randomQuestionOrder: false,
  randomOptionOrder: false,
  startTime: null,
  endTime: null,
  status: 1
})
const rules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  mode: [{ required: true, message: '请选择模式', trigger: 'change' }],
  curriculumId: [{ required: true, message: '请选择课程', trigger: 'change' }]
}

const formChapters = computed(() => chapters.value.filter((item) => !form.curriculumId || item.curriculumId === form.curriculumId))
const enabledForm = computed({
  get: () => form.status === 1,
  set: (value) => {
    form.status = value ? 1 : 0
  }
})

const loadData = async () => {
  rows.value = await listExamConfigsAdmin(query)
  rows.value.forEach((row) => {
    rowEnabled[row.id] = row.status === 1
  })
}

const resetForm = () => {
  Object.assign(form, {
    curriculumId: courses.value[0]?.id,
    chapterId: undefined,
    name: '',
    mode: 1,
    questionCount: 10,
    durationMinutes: 0,
    passScore: 60,
    showAnswerPolicy: 1,
    showAnalysisPolicy: 1,
    allowRetry: true,
    randomQuestionOrder: false,
    randomOptionOrder: false,
    startTime: null,
    endTime: null,
    status: 1
  })
}

const openCreate = () => {
  editingId.value = undefined
  resetForm()
  formVisible.value = true
}

const openEdit = (row) => {
  editingId.value = row.id
  Object.assign(form, row)
  formVisible.value = true
}

const save = async () => {
  await formRef.value.validate()
  if (editingId.value) await updateExamConfig(editingId.value, form)
  else await createExamConfig(form)
  ElMessage.success('保存成功')
  formVisible.value = false
  loadData()
}

const toggle = async (row) => {
  await updateExamConfigStatus(row.id, rowEnabled[row.id])
  ElMessage.success('状态已更新')
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除配置 ${row.name}？`, '删除确认', { type: 'warning' })
  await deleteExamConfig(row.id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(async () => {
  const [courseRows, chapterRows] = await Promise.all([listCourses(), listChapters()])
  courses.value = courseRows || []
  chapters.value = chapterRows || []
  await loadData()
})
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-grid.four {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 760px) {
  .form-grid,
  .form-grid.four {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
