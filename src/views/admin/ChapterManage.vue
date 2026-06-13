<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">章节管理</h1>
        <p class="page-subtitle">按课程维护章节、排序和启停状态。</p>
      </div>
      <el-button type="primary" @click="openCreate">新增章节</el-button>
    </div>

    <section class="surface">
      <div class="toolbar">
        <el-select v-model="query.curriculumId" clearable filterable placeholder="课程" style="width: 220px" @change="loadData">
          <el-option v-for="course in courses" :key="course.id" :label="course.name" :value="course.id" />
        </el-select>
        <el-select v-model="query.enabled" clearable placeholder="状态" style="width: 150px" @change="loadData">
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
        <el-button @click="loadData">查询</el-button>
      </div>

      <el-table :data="rows" style="width: 100%; margin-top: 14px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="课程" min-width="140">
          <template #default="{ row }">{{ courseName(row.curriculumId) }}</template>
        </el-table-column>
        <el-table-column prop="name" label="章节名称" min-width="180" />
        <el-table-column prop="sort" label="排序" width="90" />
        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-switch v-model="row.isUse" @change="toggle(row)" /></template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="formVisible" :title="editingId ? '编辑章节' : '新增章节'" width="min(560px, 94%)">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="课程" prop="curriculumId">
          <el-select v-model="form.curriculumId" filterable style="width: 100%">
            <el-option v-for="course in courses" :key="course.id" :label="course.name" :value="course.id" />
          </el-select>
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="章节名称" prop="name"><el-input v-model.trim="form.name" /></el-form-item>
          <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" style="width: 100%" /></el-form-item>
        </div>
        <el-form-item label="说明"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="form.isUse" active-text="启用" inactive-text="停用" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createChapter, deleteChapter, listChapters, listCourses, updateChapter, updateChapterStatus } from '@/api/admin'

const route = useRoute()
const rows = ref([])
const courses = ref([])
const formVisible = ref(false)
const editingId = ref()
const formRef = ref()
const query = reactive({ curriculumId: route.query.curriculumId ? Number(route.query.curriculumId) : undefined, enabled: undefined })
const form = reactive({ curriculumId: undefined, name: '', description: '', sort: 0, isUse: true })
const rules = {
  curriculumId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  name: [{ required: true, message: '请输入章节名称', trigger: 'blur' }]
}

const courseName = (id) => courses.value.find((item) => item.id === id)?.name || `课程 #${id}`

const loadData = async () => {
  rows.value = await listChapters(query)
}

const openCreate = () => {
  editingId.value = undefined
  Object.assign(form, { curriculumId: query.curriculumId || courses.value[0]?.id, name: '', description: '', sort: 0, isUse: true })
  formVisible.value = true
}

const openEdit = (row) => {
  editingId.value = row.id
  Object.assign(form, row)
  formVisible.value = true
}

const save = async () => {
  await formRef.value.validate()
  if (editingId.value) await updateChapter(editingId.value, form)
  else await createChapter(form)
  ElMessage.success('保存成功')
  formVisible.value = false
  loadData()
}

const toggle = async (row) => {
  await updateChapterStatus(row.id, row.isUse)
  ElMessage.success('状态已更新')
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除章节 ${row.name}？`, '删除确认', { type: 'warning' })
  await deleteChapter(row.id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(async () => {
  courses.value = await listCourses()
  await loadData()
})
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr 160px;
  gap: 12px;
}

@media (max-width: 620px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
