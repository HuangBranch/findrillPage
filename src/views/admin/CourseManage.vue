<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">课程管理</h1>
        <p class="page-subtitle">维护课程目录，停用课程不会影响历史作答快照。</p>
      </div>
      <el-button type="primary" @click="openCreate">新增课程</el-button>
    </div>

    <section class="surface">
      <div class="toolbar">
        <el-select v-model="enabled" clearable placeholder="启用状态" style="width: 160px" @change="loadData">
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
        <el-button @click="loadData">刷新</el-button>
      </div>

      <el-table :data="rows" style="width: 100%; margin-top: 14px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="课程名称" min-width="180" />
        <el-table-column prop="remarks" label="备注" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-switch v-model="row.isUse" @change="toggle(row)" /></template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link @click="$router.push(`/admin/chapters?curriculumId=${row.id}`)">章节</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="formVisible" :title="editingId ? '编辑课程' : '新增课程'" width="min(520px, 94%)">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="课程名称" prop="name"><el-input v-model.trim="form.name" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remarks" type="textarea" :rows="3" /></el-form-item>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { createCourse, deleteCourse, listCourses, updateCourse, updateCourseStatus } from '@/api/admin'
import { formatDateTime } from '@/utils/helpers'

const rows = ref([])
const enabled = ref()
const formVisible = ref(false)
const editingId = ref()
const formRef = ref()
const form = reactive({ name: '', isUse: true, remarks: '' })
const rules = { name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }] }

const loadData = async () => {
  rows.value = await listCourses({ enabled: enabled.value })
}

const openCreate = () => {
  editingId.value = undefined
  Object.assign(form, { name: '', isUse: true, remarks: '' })
  formVisible.value = true
}

const openEdit = (row) => {
  editingId.value = row.id
  Object.assign(form, row)
  formVisible.value = true
}

const save = async () => {
  await formRef.value.validate()
  if (editingId.value) await updateCourse(editingId.value, form)
  else await createCourse(form)
  ElMessage.success('保存成功')
  formVisible.value = false
  loadData()
}

const toggle = async (row) => {
  await updateCourseStatus(row.id, row.isUse)
  ElMessage.success('状态已更新')
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除课程 ${row.name}？`, '删除确认', { type: 'warning' })
  await deleteCourse(row.id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(loadData)
</script>
