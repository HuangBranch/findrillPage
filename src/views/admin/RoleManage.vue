<template>
  <AdminLayout>
    <div class="role-manage-page">
      <el-card>
        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索角色名称"
            style="width: 300px"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-button type="primary" :icon="Plus" @click="handleAdd" style="margin-left: auto">
            新增角色
          </el-button>
        </div>

        <!-- 角色表格 -->
        <el-table :data="tableData" style="width: 100%; margin-top: 20px" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="角色名称" min-width="120" />
          <el-table-column prop="english" label="英文标识" min-width="120" />
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.isUse ? 'success' : 'info'">
                {{ row.isUse ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="permissionCount" label="权限数" width="100" align="center" />
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button link type="primary" size="small" @click="handlePermission(row)">
                权限配置
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
        :style="{ maxWidth: '600px' }"
        @close="handleDialogClose"
      >
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="100px"
        >
          <el-form-item label="角色名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入角色名称" />
          </el-form-item>
          
          <el-form-item label="英文标识" prop="english">
            <el-input v-model="formData.english" placeholder="请输入英文标识，如：Admin" />
          </el-form-item>
          
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入角色描述"
            />
          </el-form-item>
          
          <el-form-item label="启用状态" prop="isUse">
            <el-switch v-model="formData.isUse" active-text="启用" inactive-text="禁用" />
          </el-form-item>
          
          <el-form-item label="权限配置" prop="permissionIds">
            <el-select
              v-model="formData.permissionIds"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择权限"
              style="width: 100%"
            >
              <el-option
                v-for="permission in permissionList"
                :key="permission.id"
                :label="`${permission.name} (${permission.english})`"
                :value="permission.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
        
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </template>
      </el-dialog>

      <!-- 权限配置对话框 -->
      <el-dialog
        v-model="permissionDialogVisible"
        :title="`配置权限 - ${permissionFormData.name}`"
        width="90%"
        :style="{ maxWidth: '600px' }"
      >
        <div class="permission-config">
          <div class="permission-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>快速勾选该角色需要的权限</span>
          </div>
          
          <el-checkbox-group v-model="permissionFormData.permissionIds" class="permission-grid">
            <el-checkbox
              v-for="permission in permissionList"
              :key="permission.id"
              :label="permission.id"
              class="permission-item"
              border
            >
              <div class="permission-content">
                <div class="permission-name">{{ permission.name }}</div>
                <div class="permission-english">{{ permission.english }}</div>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </div>
        
        <template #footer>
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handlePermissionSubmit" :loading="permissionSubmitting">
            <el-icon><Select /></el-icon>
            <span>保存配置</span>
          </el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Search, Plus, InfoFilled, Select } from '@element-plus/icons-vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getRoleList, createRole, updateRole, getRoleDetail, deleteRole, getPermissionList } from '@/api/admin'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'

// 搜索条件
const searchKeyword = ref('')

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

const dialogTitle = computed(() => isEdit.value ? '编辑角色' : '新增角色')

// 权限配置对话框
const permissionDialogVisible = ref(false)
const permissionSubmitting = ref(false)
const permissionFormData = reactive({
  id: null,
  name: '',
  permissionIds: []
})

// 表单数据
const formData = reactive({
  id: null,
  name: '',
  english: '',
  description: '',
  isUse: true,
  permissionIds: []
})

// 权限列表
const permissionList = ref([])

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  english: [
    { required: true, message: '请输入英文标识', trigger: 'blur' },
    { pattern: /^[A-Za-z]+$/, message: '只能包含英文字母', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
  ]
}

// 加载数据
const loadData = async () => {
  loading.value = true
  
  try {
    const data = await getRoleList()
    
    if (data && Array.isArray(data)) {
      let filtered = data
      
      // 关键词搜索
      if (searchKeyword.value) {
        filtered = filtered.filter(role => 
          role.name.includes(searchKeyword.value) ||
          role.english.toLowerCase().includes(searchKeyword.value.toLowerCase())
        )
      }
      
      total.value = filtered.length
      
      // 前端分页
      const start = (currentPage.value - 1) * pageSize.value
      tableData.value = filtered.slice(start, start + pageSize.value)
      
      // 更新缓存
      setStorage('roleList', data)
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
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

// 新增
const handleAdd = () => {
  isEdit.value = false
  Object.assign(formData, {
    id: null,
    name: '',
    english: '',
    description: '',
    isUse: true,
    permissionIds: []
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = async (row) => {
  isEdit.value = true
  
  // 显示全屏加载动画
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '加载角色信息中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    // 获取角色详情以获取权限列表
    const detail = await getRoleDetail(row.id)
    
    // 从 permissions 数组中提取权限 ID
    const permissionIds = detail?.permissions?.map(p => p.id) ?? []
    
    Object.assign(formData, {
      id: row.id,
      name: detail?.name ?? row.name,
      english: detail?.english ?? row.english,
      description: detail?.description ?? '',
      isUse: detail?.isUse ?? true,
      permissionIds: permissionIds
    })
    
    dialogVisible.value = true
  } catch (error) {
    console.error('获取角色详情失败:', error)
    ElMessage.error('获取角色详情失败')
  } finally {
    // 关闭加载动画
    loadingInstance.close()
  }
}

// 权限配置
const handlePermission = async (row) => {
  // 显示全屏加载动画
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '加载权限信息中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    // 获取角色详情以获取权限列表
    const detail = await getRoleDetail(row.id)
    
    // 从 permissions 数组中提取权限 ID
    const permissionIds = detail?.permissions?.map(p => p.id) ?? []
    
    Object.assign(permissionFormData, {
      id: row.id,
      name: row.name,
      permissionIds: permissionIds
    })
    
    permissionDialogVisible.value = true
  } catch (error) {
    console.error('获取角色详情失败:', error)
    ElMessage.error('获取角色详情失败')
  } finally {
    loadingInstance.close()
  }
}

// 提交权限配置
const handlePermissionSubmit = async () => {
  permissionSubmitting.value = true
  
  try {
    // 获取角色详情以获取完整信息
    const detail = await getRoleDetail(permissionFormData.id)
    
    // 使用原有信息 + 新的权限配置
    const params = {
      name: detail.name,
      english: detail.english,
      description: detail.description ?? '',
      isUse: detail.isUse ?? true,
      permissionIds: permissionFormData.permissionIds ?? []
    }
    
    await updateRole(permissionFormData.id, params)
    ElMessage.success('权限配置成功')
    
    permissionDialogVisible.value = false
    // 清除角色缓存
    removeStorage('roleList')
    loadData()
  } catch (error) {
    console.error('权限配置失败:', error)
    ElMessage.error('权限配置失败')
  } finally {
    permissionSubmitting.value = false
  }
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除角色 ${row.name} 吗？此操作不可恢复。`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    // 显示表格加载动画
    loading.value = true
    
    try {
      await deleteRole(row.id)
      ElMessage.success('删除成功')
      // 清除角色缓存
      removeStorage('roleList')
      await loadData()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
      loading.value = false
    }
  }).catch(() => {})
}

// 提交表单
const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    
    try {
      const params = {
        name: formData.name,
        english: formData.english,
        description: formData.description ?? '',
        isUse: formData.isUse ?? true,
        permissionIds: formData.permissionIds ?? []
      }
      
      if (isEdit.value) {
        // 调用编辑接口
        await updateRole(formData.id, params)
        ElMessage.success('编辑成功')
      } else {
        // 调用新增接口
        await createRole(params)
        ElMessage.success('添加成功')
      }
      
      dialogVisible.value = false
      // 清除角色缓存
      removeStorage('roleList')
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

// 加载权限列表
const loadPermissions = async () => {
  try {
    const data = await getPermissionList()
    if (data && Array.isArray(data)) {
      permissionList.value = data
      // 缓存权限列表
      setStorage('permissionList', data)
    }
  } catch (error) {
    console.error('获取权限列表失败:', error)
    // 尝试从缓存读取
    const cached = getStorage('permissionList')
    if (cached) {
      permissionList.value = cached
    }
  }
}

onMounted(() => {
  loadData()
  loadPermissions()
})
</script>

<style scoped>
.role-manage-page {
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
}

/* 权限配置样式 */
.permission-config {
  padding: 10px 0;
}

.permission-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1e40af;
  font-size: 14px;
  margin-bottom: 20px;
}

.permission-tip .el-icon {
  font-size: 18px;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  width: 100%;
}

.permission-item {
  margin: 0 !important;
  height: auto !important;
  padding: 12px 16px !important;
  border-radius: 8px !important;
  transition: all 0.3s ease;
}

.permission-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
}

.permission-item.is-checked {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.permission-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 8px;
}

.permission-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.permission-english {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

@media (max-width: 768px) {
  .permission-grid {
    grid-template-columns: 1fr;
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
