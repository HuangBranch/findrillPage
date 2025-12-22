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
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
          
          <el-button type="primary" :icon="Plus" @click="handleAdd" style="margin-left: auto">
            新增用户
          </el-button>
          
          <el-button type="success" @click="handleGenerateRandom">
            生成随机账号
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
                {{ row.roleName }}
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
            <el-input v-model="formData.name" placeholder="请输入用户名（非必填）" />
          </el-form-item>
          
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
          </el-form-item>
          
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
          
          <el-form-item label="角色" prop="roleId">
            <el-select v-model="formData.roleId" placeholder="请选择角色" style="width: 100%">
              <el-option
                v-for="role in roleList"
                :key="role.id"
                :label="role.name"
                :value="role.id"
              />
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
          
          <!-- 随机生成信息展示 -->
          <el-alert
            v-if="generatedInfo.visible"
            type="success"
            :closable="false"
            style="margin-bottom: 16px"
          >
            <template #title>
              <div style="font-weight: bold; margin-bottom: 8px;">随机生成的账号信息：</div>
              <div style="line-height: 1.8;">
                <div><strong>用户ID：</strong>{{ generatedInfo.userId }}</div>
                <div><strong>用户名：</strong>{{ generatedInfo.name }}</div>
                <div><strong>真实姓名：</strong>{{ generatedInfo.realName }}</div>
                <div><strong>邮箱：</strong>{{ generatedInfo.email }}</div>
                <div><strong>角色：</strong>{{ generatedInfo.roleName }}</div>
                <div style="color: #e6a23c;"><strong>密码：</strong>{{ generatedInfo.password }}</div>
              </div>
            </template>
          </el-alert>
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
import { getUserList, createUser, updateUser, resetUserPassword, getRoleList,deleteUser } from '@/api/admin'
import { getStorage, setStorage } from '@/utils/storage'
import CryptoJS from 'crypto-js'

// 搜索条件
const searchKeyword = ref('')
const searchRole = ref('')

// 角色列表
const roleList = ref([])

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

// 生成的随机信息
const generatedInfo = reactive({
  visible: false,
  userId: '',
  name: '',
  realName: '',
  email: '',
  roleName: '',
  password: ''
})

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
    {  message: '请输入邮箱', trigger: 'blur' },
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
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    // 添加搜索关键词（可搜索用户名或邮箱）
    if (searchKeyword.value) {
      params.name = searchKeyword.value
    }
    
    // 添加角色筛选
    if (searchRole.value !== '' && searchRole.value !== null) {
      params.roleId = searchRole.value
    }
    
    const data = await getUserList(params)

    // 响应拦截器已经返回了 data，直接使用
    if (data && data.list) {
      // 处理返回数据,映射字段
      tableData.value = data.list.map(user => ({
        id: user.id,
        userName: user.userId || user.name, // userId作为用户名
        name: user.name, // 用户姓名
        realName: user.realName || '', // 真实姓名
        email: user.email || '',
        roleId: user.roleId ?? 3, // 使用空值合并运算符
        roleName: user.roleName || '未知', // 角色名称
        isActiveEmail: user.isActiveEmail ?? false,
        isUse: user.isUse ?? false,
        remarks: user.remarks || '', // 备注
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

// 获取角色标签类型
const getRoleType = (roleId) => {
  const map = { 1: 'danger', 2: 'warning', 3: '' }
  return map[roleId] || ''
}

// 生成随机字符串
const generateRandomString = (length = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 生成随机英文用户名
const generateRandomEnglishName = () => {
  const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
    'Daniel', 'Matthew', 'Andrew', 'Joshua', 'Christopher', 'Emily', 'Emma', 'Olivia', 'Sophia', 'Isabella']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White']
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${firstName} ${lastName}`
}

// 生成随机姓名
const generateRandomName = () => {
  const surnames = ['张', '王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高']
  const names = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平', '刚', '桂英', '建华', '文', '辉', '利', '萍', '燕', '鹏', '华']
  return surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)]
}

// 生成随机账号
const handleGenerateRandom = () => {
  ElMessageBox.confirm(
    '确定要生成一个随机账号吗？生成后将自动创建该账号。',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(async () => {
    // 直接创建账号，不打开对话框
    try {
      loading.value = true
      
      // 生成随机数据
      const randomUserId = 'user' + generateRandomString(6)
      const randomName = generateRandomEnglishName() // 使用英文名
      const randomRealName = generateRandomName()
      const randomEmail = ''
      const defaultPassword = randomUserId + '123456'
      const encryptedPassword = CryptoJS.SHA256(defaultPassword).toString()
      const roleId = 3 // 普通角色
      const roleName = roleList.value.find(r => r.id === roleId)?.name || '普通用户'
      
      const params = {
        userId: randomUserId,
        name: randomName,
        realName: randomRealName,
        email: randomEmail,
        password: encryptedPassword,
        roleId: roleId,
        isActiveEmail: false,
        isUse: true,
        remarks: '随机生成的账号'
      }
      
      await createUser(params)
      
      // 显示生成信息的对话框
      ElMessageBox.alert(
        `<div style="line-height: 1.8;">
          <div><strong>用户ID：</strong>${randomUserId}</div>
          <div><strong>用户名：</strong>${randomName}</div>
          <div><strong>真实姓名：</strong>${randomRealName}</div>
          <div><strong>邮箱：</strong>${randomEmail || '未设置'}</div>
          <div><strong>角色：</strong>${roleName}</div>
          <div style="color: #e6a23c;"><strong>密码：</strong>${defaultPassword}</div>
        </div>`,
        '随机账号创建成功',
        {
          confirmButtonText: '确定',
          dangerouslyUseHTMLString: true,
          type: 'success'
        }
      ).then(() => {
        loadData()
      })
    } catch (error) {
      console.error('创建随机账号失败:', error)
      ElMessage.error('创建随机账号失败')
    } finally {
      loading.value = false
    }
  }).catch(() => {})
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
  generatedInfo.visible = false
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
  ).then(async () => {
    loading.value = true
    // TODO: 调用删除接口
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    loadData()
    loading.value = false
  }).catch(() => {})
}

// 提交表单
const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    
    try {
      if (isEdit.value) {
        // 调用编辑接口
        const params = {
          userId: formData.userId,
          name: formData.name,
          email: formData.email,
          roleId: formData.roleId,
          realName: formData.realName,
          isActiveEmail: formData.isActiveEmail,
          isUse: formData.isUse
        }
        
        // 备注字段非必填
        if (formData.remarks) {
          params.remarks = formData.remarks
        }
        
        await updateUser(formData.id, params)
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
  generatedInfo.visible = false
}

// 加载角色列表
const loadRoles = async () => {
  try {
    // 先从本地缓存读取
    const cachedRoles = getStorage('roleList')
    if (cachedRoles && Array.isArray(cachedRoles) && cachedRoles.length > 0) {
      roleList.value = cachedRoles
      return
    }
    
    // 如果本地没有，从后端获取
    const data = await getRoleList()
    if (data && Array.isArray(data)) {
      roleList.value = data
      // 存储到本地
      setStorage('roleList', data)
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    // 如果请求失败，尝试使用缓存
    const cachedRoles = getStorage('roleList')
    if (cachedRoles && Array.isArray(cachedRoles)) {
      roleList.value = cachedRoles
    }
  }
}

onMounted(() => {
  loadRoles()
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
