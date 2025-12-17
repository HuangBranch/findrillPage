<template>
  <AdminLayout>
    <div class="user-manage-page">
      <el-card>
        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索用户名或邮箱"
            style="width: 300px"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select
            v-model="searchRole"
            placeholder="角色筛选"
            style="width: 150px; margin-left: 12px"
            clearable
            @change="handleSearch"
          >
            <el-option label="全部" value="" />
            <el-option label="超级管理员" :value="1" />
            <el-option label="管理员" :value="2" />
            <el-option label="普通用户" :value="3" />
          </el-select>
          
          <el-button type="primary" :icon="Plus" @click="handleAdd" style="margin-left: auto">
            新增用户
          </el-button>
        </div>

        <!-- 用户表格 -->
        <el-table :data="tableData" style="width: 100%; margin-top: 20px" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="userName" label="用户ID" min-width="120" />
          <el-table-column prop="name" label="姓名" min-width="120" />
          <el-table-column prop="email" label="邮箱" min-width="180" />
          <el-table-column label="角色" width="120">
            <template #default="{ row }">
              <el-tag :type="getRoleType(row.roleId)">
                {{ getRoleName(row.roleId) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="邮箱状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.isActiveEmail ? 'success' : 'info'">
                {{ row.isActiveEmail ? '已验证' : '未验证' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isUse" label="是否启用" width="100" >
            <template #default="{ row }">
              <el-tag :type="row.isUse ? 'success' : 'error'">
                {{ row.isUse ? '已启用' : '未启用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column prop="lastLoginTime" label="最后登录时间" width="180" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button link type="primary" size="small" @click="handleResetPassword(row)">
                重置密码
              </el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handlePageChange"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>

      <!-- 新增/编辑对话框 -->
      <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="90%"
        :style="{ maxWidth: '500px' }"
        @close="handleDialogClose"
      >
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="100px"
        >
          <el-form-item label="用户ID" prop="userId">
            <el-input v-model="formData.userId" placeholder="请输入用户ID(用于登陆的账号)" />
          </el-form-item>
          
          <el-form-item label="用户名" prop="name">
            <el-input v-model="formData.name" placeholder="请输入用户名" />
          </el-form-item>
          
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
          </el-form-item>
          
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
          
          <el-form-item label="角色" prop="roleId">
            <el-select v-model="formData.roleId" placeholder="请选择角色" style="width: 100%">
              <el-option label="超级管理员" :value="1" />
              <el-option label="管理员" :value="2" />
              <el-option label="普通用户" :value="3" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="启用账号" prop="isUse">
            <el-switch v-model="formData.isUse" active-text="启用" inactive-text="禁用" />
          </el-form-item>
          
          <el-form-item label="邮箱验证" prop="isActiveEmail">
            <el-switch v-model="formData.isActiveEmail" active-text="已验证" inactive-text="未验证" />
          </el-form-item>
          
          <el-form-item label="备注" prop="remarks">
            <el-input v-model="formData.remarks" type="textarea" :rows="3" placeholder="请输入备注（非必填）" />
          </el-form-item>
          
          <el-alert
            v-if="!isEdit"
            title="默认密码为：用户ID+123456"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 16px"
          />
        </el-form>
        
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getUserList, createUser, resetUserPassword } from '@/api/admin'
import CryptoJS from 'crypto-js'

// 搜索条件
const searchKeyword = ref('')
const searchRole = ref('')

// 表格数据
const loading = ref(false)
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const submitting = ref(false)

const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新增用户')

// 表单数据
const formData = reactive({
  id: null,
  userId: '',
  name: '',
  realName: '',
  email: '',
  password: '',
  roleId: 3,
  isActiveEmail: false,
  isUse: true,
  remarks: ''
})

// 表单验证规则
const formRules = {
  userId: [
    { required: true, message: '请输入用户ID(用于登陆的账号)', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  roleId: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 加载数据
const loadData = async () => {
  loading.value = true
  
  try {
    const params = {
      current: currentPage.value,
      size: pageSize.value
    }
    
    // 添加搜索关键词
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    // 添加角色筛选
    if (searchRole.value !== '' && searchRole.value !== null) {
      params.roleId = searchRole.value
    }
    
    const data = await getUserList(params)

    // 响应拦截器已经返回了 data，直接使用
    if (data && data.records) {
      // 处理返回数据,映射字段
      tableData.value = data.records.map(user => ({
        id: user.id,
        userName: user.userId || user.name, // userId作为用户名
        name: user.name, // 用户姓名
        email: user.email || '',
        roleId: user.roleId || 3,
        isActiveEmail: user.isActiveEmail || false,
        isUse: user.isUse || false,
        createTime: user.createTime || '',
        lastLoginTime: user.lastLoginTime || ''
      }))
      
      total.value = data.total || 0
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 分页
const handlePageChange = () => {
  loadData()
}

// 获取角色名称
const getRoleName = (roleId) => {
  const map = { 1: '超级管理员', 2: '管理员', 3: '普通用户' }
  return map[roleId] || '未知'
}

// 获取角色标签类型
const getRoleType = (roleId) => {
  const map = { 1: 'danger', 2: 'warning', 3: '' }
  return map[roleId] || ''
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  Object.assign(formData, {
    id: null,
    userId: '',
    name: '',
    realName: '',
    email: '',
    password: '',
    roleId: 3,
    isActiveEmail: false,
    isUse: true,
    remarks: ''
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    userId: row.userName,
    name: row.name,
    realName: row.realName || row.name,
    email: row.email,
    password: '',
    roleId: row.roleId,
    isActiveEmail: row.isActiveEmail,
    isUse: row.isUse !== undefined ? row.isUse : true,
    remarks: row.remarks || ''
  })
  dialogVisible.value = true
}

// 重置密码
const handleResetPassword = (row) => {
  ElMessageBox.confirm(
    `确定要重置用户 ${row.userName} 的密码吗？密码将重置为：${row.userName}123456`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 生成默认密码：用户ID + 123456，并加密
      const defaultPassword = row.userName + '123456'
      const encryptedPassword = CryptoJS.SHA256(defaultPassword).toString()
      
      await resetUserPassword(row.id, {
        newPwd: encryptedPassword
      })
      
      ElMessage.success('密码重置成功')
    } catch (error) {
      console.error('重置密码失败:', error)
      ElMessage.error('重置密码失败')
    }
  }).catch(() => {})
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户 ${row.userName} 吗？此操作不可恢复。`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // TODO: 调用删除接口
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}

// 提交表单
const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    
    try {
      if (isEdit.value) {
        // TODO: 调用编辑接口
        ElMessage.success('编辑成功')
      } else {
        // 调用新增接口
        // 生成默认密码：用户ID+123456，并加密
        const defaultPassword = formData.userId + '123456'
        const encryptedPassword = CryptoJS.SHA256(defaultPassword).toString()
        
        const params = {
          userId: formData.userId,
          name: formData.name,
          realName: formData.realName,
          email: formData.email,
          password: encryptedPassword,
          roleId: formData.roleId,
          isActiveEmail: formData.isActiveEmail,
          isUse: formData.isUse
        }
        
        // 备注字段非必填
        if (formData.remarks) {
          params.remarks = formData.remarks
        }
        
        await createUser(params)
        ElMessage.success('添加成功')
      }
      
      dialogVisible.value = false
      loadData()
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error(isEdit.value ? '编辑失败' : '添加失败')
    } finally {
      submitting.value = false
    }
  })
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.user-manage-page {
  min-height: 100%;
}

.search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1024px) {
  .pagination :deep(.el-pagination) {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar :deep(.el-input),
  .search-bar :deep(.el-select),
  .search-bar :deep(.el-button) {
    width: 100% !important;
    margin-left: 0 !important;
  }
  
  /* 移动端表格优化 */
  :deep(.el-table) {
    font-size: 13px;
  }
  
  :deep(.el-table .el-button) {
    padding: 4px 8px;
    font-size: 12px;
  }
  
  .pagination {
    margin-top: 16px;
  }
  
  .pagination :deep(.el-pagination) {
    justify-content: center;
  }
  
  .pagination :deep(.el-pagination__sizes) {
    display: none;
  }
}

@media (max-width: 375px) {
  :deep(.el-table) {
    font-size: 12px;
  }
  
  :deep(.el-table .cell) {
    padding: 0 6px;
  }
}
</style>
