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
        <el-table-column prop="account" label="账号" min-width="140" />
        <el-table-column prop="name" label="昵称" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="170" show-overflow-tooltip />
        <el-table-column prop="roleName" label="角色" width="120" />
        <el-table-column label="邮箱验证" width="100">
          <template #default="{ row }">
            <el-tag :type="row.emailVerified ? 'success' : 'info'">{{ row.emailVerified ? '已验证' : '未验证' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link @click="openReset(row)">重置密码</el-button>
            <el-button link type="danger" @click="remove(row)">归档</el-button>
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
          <el-form-item label="账号" prop="account"><el-input v-model.trim="form.account" /></el-form-item>
          <el-form-item label="昵称" prop="name"><el-input v-model.trim="form.name" /></el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item label="邮箱" prop="email"><el-input v-model.trim="form.email" /></el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item label="角色" prop="roleId">
            <el-select v-model="form.roleId" style="width: 100%">
              <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态"><el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" /></el-form-item>
        </div>
        <div class="form-grid">
          <el-form-item label="邮箱验证">
            <el-switch v-model="form.emailVerified" :disabled="!form.email" active-text="已验证" inactive-text="未验证" />
          </el-form-item>
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
const resetVisible = ref(false)
const editingId = ref()
const currentUserId = ref()
const formRef = ref()

const query = reactive({ page: 1, pageSize: 10, name: '', roleId: undefined })
const form = reactive({
  account: '',
  name: '',
  password: '',
  email: '',
  emailVerified: false,
  roleId: undefined,
  enabled: true,
  remarks: ''
})
const resetPasswordForm = reactive({ newPwd: '' })

const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
}

const resetUserForm = () => {
  Object.assign(form, {
    account: '',
    name: '',
    password: '',
    email: '',
    emailVerified: false,
    roleId: roles.value[0]?.id,
    enabled: true,
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
  Object.assign(form, { ...row, password: '' })
  formVisible.value = true
}

const save = async () => {
  await formRef.value.validate()
  const payload = {
    ...form,
    email: form.email?.trim() || '',
    emailVerified: form.email?.trim() ? form.emailVerified : false
  }
  if (editingId.value) {
    delete payload.password
    await updateUser(editingId.value, payload)
  } else {
    await createUser(payload)
  }
  ElMessage.success('保存成功')
  formVisible.value = false
  loadData()
}

const toggleStatus = async (row) => {
  await updateUserStatus(row.id, { enabled: row.enabled })
  ElMessage.success('状态已更新')
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
  await ElMessageBox.confirm(`确认归档用户 ${row.name}？归档后历史数据会保留，但账号将不可登录。`, '归档确认', { type: 'warning' })
  await deleteUser(row.id)
  ElMessage.success('已归档')
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
