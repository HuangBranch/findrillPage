<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">题库管理</h1>
        <p class="page-subtitle">维护题目草稿、选项、答案、知识点和题目生命周期。</p>
      </div>
      <el-button type="primary" @click="openCreate">新增题目</el-button>
    </div>

    <section class="surface">
      <div class="toolbar">
        <el-select v-model="query.curriculumId" clearable filterable placeholder="课程" style="width: 180px" @change="handleCourseFilter">
          <el-option v-for="course in courses" :key="course.id" :label="course.name" :value="course.id" />
        </el-select>
        <el-select v-model="query.chapterId" clearable filterable placeholder="章节" style="width: 180px">
          <el-option v-for="chapter in filteredChapters" :key="chapter.id" :label="chapter.name" :value="chapter.id" />
        </el-select>
        <el-select v-model="query.type" clearable placeholder="题型" style="width: 150px">
          <el-option v-for="item in QUESTION_TYPES" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-input v-model="query.keyword" clearable placeholder="题干关键词" style="width: 220px" @keyup.enter="loadData" />
        <el-button @click="loadData">查询</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" style="width: 100%; margin-top: 14px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="题干" min-width="240">
          <template #default="{ row }">{{ stripHtml(row.stemHtml).slice(0, 80) }}</template>
        </el-table-column>
        <el-table-column label="题型" width="110">
          <template #default="{ row }">{{ labelOf(QUESTION_TYPES, row.type) }}</template>
        </el-table-column>
        <el-table-column label="难度" width="90">
          <template #default="{ row }"><el-tag :type="tagOf(DIFFICULTIES, row.difficulty)">{{ labelOf(DIFFICULTIES, row.difficulty) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><el-tag :type="tagOf(QUESTION_STATUS, row.status)">{{ labelOf(QUESTION_STATUS, row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="审核" width="100">
          <template #default="{ row }"><el-tag :type="tagOf(AUDIT_STATUS, row.auditStatus)">{{ labelOf(AUDIT_STATUS, row.auditStatus) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link @click="publish(row)">发布</el-button>
            <el-button link @click="submitAudit(row)">送审</el-button>
            <el-button link @click="disable(row)">停用</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        layout="total, sizes, prev, pager, next"
        :total="total"
        style="margin-top: 14px"
        @current-change="loadData"
        @size-change="loadData"
      />
    </section>

    <el-dialog v-model="formVisible" :title="editingId ? '编辑题目' : '新增题目'" width="min(920px, 96%)" top="4vh">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="form-grid three">
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
          <el-form-item label="题型" prop="type">
            <el-select v-model="form.type" style="width: 100%" @change="resetByType">
              <el-option v-for="item in QUESTION_TYPES" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="题干" prop="stemHtml">
          <el-input v-model="form.stemHtml" type="textarea" :rows="4" placeholder="支持 HTML" />
        </el-form-item>

        <el-form-item label="解析">
          <el-input v-model="form.analysisHtml" type="textarea" :rows="3" placeholder="支持 HTML" />
        </el-form-item>

        <div class="form-grid four">
          <el-form-item label="难度">
            <el-select v-model="form.difficulty" style="width: 100%">
              <el-option v-for="item in DIFFICULTIES" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="分值">
            <el-input-number v-model="form.defaultScore" :min="0.5" :step="0.5" style="width: 100%" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="启用">
            <el-switch v-model="enabledForForm" />
          </el-form-item>
        </div>

        <el-form-item v-if="needsOptions" label="选项">
          <div class="nested-list">
            <div v-for="(option, index) in form.options" :key="index" class="nested-row">
              <el-input v-model.trim="option.optionKey" placeholder="A" style="width: 90px" />
              <el-input v-model="option.contentHtml" placeholder="选项内容，支持 HTML" />
              <el-button :icon="Delete" circle @click="form.options.splice(index, 1)" />
            </div>
            <el-button :icon="Plus" @click="addOption">增加选项</el-button>
          </div>
        </el-form-item>

        <el-form-item label="答案">
          <div class="nested-list">
            <div v-for="(answer, index) in form.answers" :key="index" class="nested-row">
              <el-select v-if="needsOptions" v-model="answer.answerValue" placeholder="答案" style="width: 160px">
                <el-option v-for="option in form.options" :key="option.optionKey" :label="option.optionKey" :value="option.optionKey" />
              </el-select>
              <el-input v-else v-model="answer.answerValue" placeholder="答案内容" />
              <el-input-number v-if="form.type === 4" v-model="answer.blankIndex" :min="1" placeholder="空位" style="width: 120px" />
              <el-button :icon="Delete" circle @click="form.answers.splice(index, 1)" />
            </div>
            <el-button :icon="Plus" @click="addAnswer">增加答案</el-button>
          </div>
        </el-form-item>

        <el-form-item label="知识点">
          <el-tree-select
            v-model="form.knowledgeIds"
            :data="knowledgeTree"
            multiple
            clearable
            check-strictly
            :props="{ label: 'name', value: 'id', children: 'children' }"
            style="width: 100%"
          />
        </el-form-item>
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
import { Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createQuestion,
  deleteQuestion,
  disableQuestion,
  getQuestionDetail,
  listChapters,
  listCourses,
  listKnowledgeTree,
  listQuestions,
  publishQuestion,
  submitQuestionAudit,
  updateQuestion
} from '@/api/admin'
import { AUDIT_STATUS, DIFFICULTIES, QUESTION_STATUS, QUESTION_TYPES, labelOf, tagOf } from '@/utils/dictionaries'
import { getPageList, getPageTotal, stripHtml } from '@/utils/helpers'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const courses = ref([])
const chapters = ref([])
const knowledgeTree = ref([])
const formVisible = ref(false)
const editingId = ref()
const formRef = ref()

const query = reactive({ page: 1, pageSize: 10, curriculumId: undefined, chapterId: undefined, type: undefined, keyword: '' })
const form = reactive({
  curriculumId: undefined,
  chapterId: undefined,
  type: 1,
  stemHtml: '',
  analysisHtml: '',
  difficulty: 1,
  defaultScore: 1,
  gradingStrategy: 1,
  status: 1,
  sort: 0,
  options: [],
  answers: [],
  knowledgeIds: []
})

const rules = {
  curriculumId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  type: [{ required: true, message: '请选择题型', trigger: 'change' }],
  stemHtml: [{ required: true, message: '请输入题干', trigger: 'blur' }]
}

const needsOptions = computed(() => [1, 2, 3].includes(form.type))
const filteredChapters = computed(() => chapters.value.filter((item) => !query.curriculumId || item.curriculumId === query.curriculumId))
const formChapters = computed(() => chapters.value.filter((item) => !form.curriculumId || item.curriculumId === form.curriculumId))
const enabledForForm = computed({
  get: () => form.status === 1,
  set: (value) => {
    form.status = value ? 1 : 0
  }
})

const normalizeAnswer = (answer, index) => ({
  answerGroup: answer.answerGroup ?? 1,
  blankIndex: answer.blankIndex ?? (form.type === 4 ? index + 1 : null),
  answerValue: answer.answerValue || '',
  isCaseSensitive: Boolean(answer.isCaseSensitive),
  matchMode: answer.matchMode ?? 1,
  normalizeRuleJson: answer.normalizeRuleJson || null,
  scoreRatio: answer.scoreRatio ?? null,
  sort: answer.sort ?? index
})

const addOption = () => {
  const key = String.fromCharCode(65 + form.options.length)
  form.options.push({ optionKey: key, optionType: 1, contentHtml: '', sort: form.options.length })
}

const addAnswer = () => {
  form.answers.push(normalizeAnswer({}, form.answers.length))
}

const resetByType = () => {
  form.gradingStrategy = form.type === 5 ? 2 : 1
  if (form.type === 3) {
    form.options = [
      { optionKey: 'A', optionType: 1, contentHtml: '正确', sort: 0 },
      { optionKey: 'B', optionType: 1, contentHtml: '错误', sort: 1 }
    ]
    form.answers = [normalizeAnswer({ answerValue: 'A' }, 0)]
  } else if (needsOptions.value) {
    form.options = [
      { optionKey: 'A', optionType: 1, contentHtml: '', sort: 0 },
      { optionKey: 'B', optionType: 1, contentHtml: '', sort: 1 },
      { optionKey: 'C', optionType: 1, contentHtml: '', sort: 2 },
      { optionKey: 'D', optionType: 1, contentHtml: '', sort: 3 }
    ]
    form.answers = [normalizeAnswer({ answerValue: 'A' }, 0)]
  } else {
    form.options = []
    form.answers = [normalizeAnswer({}, 0)]
  }
}

const resetForm = () => {
  Object.assign(form, {
    curriculumId: courses.value[0]?.id,
    chapterId: undefined,
    type: 1,
    stemHtml: '',
    analysisHtml: '',
    difficulty: 1,
    defaultScore: 1,
    gradingStrategy: 1,
    status: 1,
    sort: 0,
    options: [],
    answers: [],
    knowledgeIds: []
  })
  resetByType()
}

const loadData = async () => {
  loading.value = true
  try {
    const data = await listQuestions(query)
    rows.value = getPageList(data)
    total.value = getPageTotal(data)
  } finally {
    loading.value = false
  }
}

const handleCourseFilter = () => {
  query.chapterId = undefined
  loadData()
}

const openCreate = () => {
  editingId.value = undefined
  resetForm()
  formVisible.value = true
}

const openEdit = async (row) => {
  editingId.value = row.id
  const detail = await getQuestionDetail(row.id)
  Object.assign(form, {
    curriculumId: detail.curriculumId,
    chapterId: detail.chapterId,
    type: detail.type,
    stemHtml: detail.stemHtml,
    analysisHtml: detail.analysisHtml,
    difficulty: detail.difficulty || 1,
    defaultScore: Number(detail.defaultScore || 1),
    gradingStrategy: detail.gradingStrategy || 1,
    status: detail.status ?? 1,
    sort: detail.sort || 0,
    options: (detail.options || []).map((item, index) => ({ ...item, sort: item.sort ?? index })),
    answers: (detail.answers || []).map(normalizeAnswer),
    knowledgeIds: detail.knowledgeIds || []
  })
  formVisible.value = true
}

const payload = () => ({
  curriculumId: form.curriculumId,
  chapterId: form.chapterId,
  type: form.type,
  stemHtml: form.stemHtml,
  analysisHtml: form.analysisHtml,
  difficulty: form.difficulty,
  defaultScore: form.defaultScore,
  gradingStrategy: form.gradingStrategy,
  status: form.status,
  sort: form.sort,
  options: needsOptions.value ? form.options : [],
  answers: form.answers.map(normalizeAnswer),
  knowledgeIds: form.knowledgeIds || []
})

const validateNested = () => {
  if (needsOptions.value && form.options.length < 2) throw new Error('选择题至少需要两个选项')
  if (!form.answers.length || form.answers.some((item) => !item.answerValue)) throw new Error('请填写答案')
}

const save = async () => {
  await formRef.value.validate()
  try {
    validateNested()
  } catch (error) {
    ElMessage.warning(error.message)
    return
  }
  if (editingId.value) await updateQuestion(editingId.value, payload())
  else await createQuestion(payload())
  ElMessage.success('保存成功')
  formVisible.value = false
  loadData()
}

const lifecycleReason = async (message) => {
  const { value } = await ElMessageBox.prompt(message, '原因', {
    inputPlaceholder: '可留空',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
  return { reason: value || '' }
}

const publish = async (row) => {
  await publishQuestion(row.id, await lifecycleReason('发布说明'))
  ElMessage.success('已发布')
  loadData()
}

const submitAudit = async (row) => {
  await submitQuestionAudit(row.id, await lifecycleReason('送审说明'))
  ElMessage.success('已提交审核')
  loadData()
}

const disable = async (row) => {
  await disableQuestion(row.id, await lifecycleReason('停用原因'))
  ElMessage.success('已停用')
  loadData()
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除题目 #${row.id}？`, '删除确认', { type: 'warning' })
  await deleteQuestion(row.id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(async () => {
  const [courseRows, chapterRows] = await Promise.all([listCourses(), listChapters()])
  courses.value = courseRows || []
  chapters.value = chapterRows || []
  if (courses.value[0]) {
    try {
      knowledgeTree.value = await listKnowledgeTree({ curriculumId: courses.value[0].id })
    } catch {
      knowledgeTree.value = []
    }
  }
  await loadData()
})
</script>

<style scoped>
.form-grid {
  display: grid;
  gap: 12px;
}

.form-grid.three {
  grid-template-columns: repeat(3, 1fr);
}

.form-grid.four {
  grid-template-columns: repeat(4, 1fr);
}

.nested-list {
  display: grid;
  width: 100%;
  gap: 10px;
}

.nested-row {
  display: flex;
  gap: 10px;
}

@media (max-width: 760px) {
  .form-grid.three,
  .form-grid.four {
    grid-template-columns: 1fr;
  }

  .nested-row {
    display: grid;
  }
}
</style>
