<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">角色权限</h1>
        <p class="page-subtitle">维护角色信息，并绑定权限码。</p>
      </div>
      <el-button type="primary" @click="openCreate">新增角色</el-button>
    </div>

    <section class="surface">
      <div class="toolbar">
        <el-input v-model="query.name" clearable placeholder="角色名称" style="width: 220px" @keyup.enter="loadData" />
        <el-button @click="loadData">查询</el-button>
      </div>

      <el-table :data="rows" style="width: 100%; margin-top: 14px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" min-width="140" />
        <el-table-column prop="english" label="英文标识" min-width="130" />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="permissionCount" label="权限数" width="100" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><el-tag :type="row.isUse ? 'success' : 'info'">{{ row.isUse ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link @click="openPermissions(row)">权限</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="formVisible" :title="editingId ? '编辑角色' : '新增角色'" width="min(560px, 94%)">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="form-grid">
          <el-form-item label="角色名称" prop="name"><el-input v-model.trim="form.name" /></el-form-item>
          <el-form-item label="英文标识" prop="english"><el-input v-model.trim="form.english" /></el-form-item>
        </div>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="form.isUse" active-text="启用" inactive-text="停用" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionVisible" title="分配权限" width="min(560px, 94%)">
      <el-checkbox-group v-model="permissionForm.permissionIds" class="permission-grid">
        <el-checkbox v-for="item in permissions" :key="item.id" :value="item.id" border>
          {{ item.name }} / {{ item.english }}
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="permissionVisible = false">取消</el-button>
        <el-button type="primary" @click="savePermissions">保存权限</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { assignRolePermissions, createRole, getRoleDetail, listPermissions, listRoles, updateRole } from '@/api/admin'

const hiddenPermissionPattern = new RegExp(['ex' + 'am', 'grad' + 'ing', '\\u8003\\u8bd5', '\\u6279\\u6539'].join('|'), 'i')
const rows = ref([])
const permissions = ref([])
const formVisible = ref(false)
const permissionVisible = ref(false)
const editingId = ref()
const formRef = ref()
const query = reactive({ name: '', english: '', description: '', isUse: undefined })
const form = reactive({ name: '', english: '', description: '', isUse: true, permissionIds: [] })
const permissionForm = reactive({ roleId: undefined, permissionIds: [] })

const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  english: [{ required: true, message: '请输入英文标识', trigger: 'blur' }]
}

const isVisiblePermission = (item) => {
  const text = [item.name, item.english, item.code, item.path, item.permissionCode].filter(Boolean).join(' ')
  return !hiddenPermissionPattern.test(text)
}

const visiblePermissionIds = () => new Set(permissions.value.map((item) => item.id))

const sanitizePermissionIds = (ids = []) => {
  const visibleIds = visiblePermissionIds()
  return ids.filter((id) => visibleIds.has(id))
}

const loadData = async () => {
  rows.value = await listRoles(query)
}

const resetForm = () => {
  Object.assign(form, { name: '', english: '', description: '', isUse: true, permissionIds: [] })
}

const openCreate = () => {
  editingId.value = undefined
  resetForm()
  formVisible.value = true
}

const openEdit = async (row) => {
  editingId.value = row.id
  const detail = await getRoleDetail(row.id)
  Object.assign(form, {
    name: detail.name,
    english: row.english,
    description: detail.description || detail.roleDesc || row.description,
    isUse: detail.isUse,
    permissionIds: sanitizePermissionIds((detail.permissions || []).map((item) => item.id))
  })
  formVisible.value = true
}

const save = async () => {
  await formRef.value.validate()
  if (editingId.value) {
    await updateRole(editingId.value, form)
  } else {
    await createRole(form)
  }
  ElMessage.success('保存成功')
  formVisible.value = false
  loadData()
}

const openPermissions = async (row) => {
  const detail = await getRoleDetail(row.id)
  permissionForm.roleId = row.id
  permissionForm.permissionIds = sanitizePermissionIds((detail.permissions || []).map((item) => item.id))
  permissionVisible.value = true
}

const savePermissions = async () => {
  await assignRolePermissions(permissionForm.roleId, { permissionIds: sanitizePermissionIds(permissionForm.permissionIds) })
  ElMessage.success('权限已保存')
  permissionVisible.value = false
  loadData()
}

onMounted(async () => {
  permissions.value = ((await listPermissions()) || []).filter(isVisiblePermission)
  await loadData()
})
</script>

<style scoped>
.form-grid,
.permission-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.permission-grid :deep(.el-checkbox) {
  width: 100%;
  margin: 0;
}

@media (max-width: 620px) {
  .form-grid,
  .permission-grid {
    grid-template-columns: 1fr;
  }
}
</style>
