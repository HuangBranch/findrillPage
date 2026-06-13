<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">用户管理</h1>
        <p class="page-subtitle">账号创建、资料维护、状态控制和角色分配。</p>
      </div>
      <el-button type="primary" @click="openCreate">新增用户</el-button>
    </div>

    <section class="surface">
      <div class="toolbar">
        <el-input v-model="query.name" clearable placeholder="搜索昵称/账号" style="width: 220px" @keyup.enter="loadData" />
        <el-select v-model="query.roleId" clearable placeholder="角色" style="width: 180px">
          <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
        </el-select>
        <el-button @click="loadData">查询</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" style="width: 100%; margin-top: 14px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userId" label="账号" min-width="120" />
        <el-table-column prop="name" label="昵称" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="170" show-overflow-tooltip />
        <el-table-column prop="roleName" label="角色" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.isUse" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link @click="openRole(row)">角色</el-button>
            <el-button link @click="openReset(row)">重置密码</el-button>
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

    <el-dialog v-model="formVisible" :title="editingId ? '编辑用户' : '新增用户'" width="min(620px, 94%)">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="form-grid">
          <el-form-item label="账号" prop="userId"><el-input v-model.trim="form.userId" /></el-form-item>
          <el-form-item label="昵称" prop="name"><el-input v-model.trim="form.name" /></el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item label="邮箱" prop="email"><el-input v-model.trim="form.email" /></el-form-item>
          <el-form-item label="真实姓名"><el-input v-model.trim="form.realName" /></el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item label="角色" prop="roleId">
            <el-select v-model="form.roleId" style="width: 100%">
              <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态"><el-switch v-model="form.isUse" active-text="启用" inactive-text="停用" /></el-form-item>
        </div>
        <el-form-item v-if="!editingId" label="初始密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remarks" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="roleVisible" title="分配角色" width="min(420px, 94%)">
      <el-select v-model="roleForm.roleId" style="width: 100%">
        <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
      </el-select>
      <template #footer>
        <el-button @click="roleVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRole">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resetVisible" title="重置密码" width="min(420px, 94%)">
      <el-input v-model="resetPasswordForm.newPwd" type="password" show-password placeholder="新密码" />
      <template #footer>
        <el-button @click="resetVisible = false">取消</el-button>
        <el-button type="primary" @click="saveReset">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  assignUserRole,
  createUser,
  deleteUser,
  listRoles,
  listUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus
} from '@/api/admin'
import { getPageList, getPageTotal } from '@/utils/helpers'

const loading = ref(false)
const rows = ref([])
const roles = ref([])
const total = ref(0)
const formVisible = ref(false)
const roleVisible = ref(false)
const resetVisible = ref(false)
const editingId = ref()
const currentUserId = ref()
const formRef = ref()

const query = reactive({ page: 1, pageSize: 10, name: '', roleId: undefined })
const form = reactive({
  userId: '',
  name: '',
  password: '',
  email: '',
  isActiveEmail: true,
  realName: '',
  roleId: undefined,
  isUse: true,
  remarks: ''
})
const roleForm = reactive({ roleId: undefined })
const resetPasswordForm = reactive({ newPwd: '' })

const rules = {
  userId: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

const resetUserForm = () => {
  Object.assign(form, {
    userId: '',
    name: '',
    password: '',
    email: '',
    isActiveEmail: true,
    realName: '',
    roleId: roles.value[0]?.id,
    isUse: true,
    remarks: ''
  })
}

const loadData = async () => {
  loading.value = true
  try {
    const data = await listUsers(query)
    rows.value = getPageList(data)
    total.value = getPageTotal(data)
  } finally {
    loading.value = false
  }
}

const loadRoles = async () => {
  roles.value = await listRoles()
}

const openCreate = () => {
  editingId.value = undefined
  resetUserForm()
  formVisible.value = true
}

const openEdit = (row) => {
  editingId.value = row.id
  Object.assign(form, { ...row, password: '', uPwd: undefined })
  formVisible.value = true
}

const save = async () => {
  await formRef.value.validate()
  if (editingId.value) {
    const payload = { ...form }
    delete payload.password
    await updateUser(editingId.value, payload)
  } else {
    await createUser(form)
  }
  ElMessage.success('保存成功')
  formVisible.value = false
  loadData()
}

const toggleStatus = async (row) => {
  await updateUserStatus(row.id, { isUse: row.isUse })
  ElMessage.success('状态已更新')
}

const openRole = (row) => {
  currentUserId.value = row.id
  roleForm.roleId = row.roleId
  roleVisible.value = true
}

const saveRole = async () => {
  await assignUserRole(currentUserId.value, roleForm)
  ElMessage.success('角色已更新')
  roleVisible.value = false
  loadData()
}

const openReset = (row) => {
  currentUserId.value = row.id
  resetPasswordForm.newPwd = ''
  resetVisible.value = true
}

const saveReset = async () => {
  if (!resetPasswordForm.newPwd) {
    ElMessage.warning('请输入新密码')
    return
  }
  await resetUserPassword(currentUserId.value, resetPasswordForm)
  ElMessage.success('密码已重置')
  resetVisible.value = false
}

const remove = async (row) => {
  await ElMessageBox.confirm(`确认删除用户 ${row.name}？`, '删除确认', { type: 'warning' })
  await deleteUser(row.id)
  ElMessage.success('已删除')
  loadData()
}

onMounted(async () => {
  await loadRoles()
  await loadData()
})
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 620px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
