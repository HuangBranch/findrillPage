<template>
  <AdminLayout>
    <div class="course-manage-page">
      <el-card>
        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索课程名称"
            style="width: 300px"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-button type="primary" :icon="Plus" @click="handleAdd" style="margin-left: auto">
            新增课程
          </el-button>
        </div>

        <!-- 课程表格 -->
        <el-table :data="tableData" style="width: 100%; margin-top: 20px" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="课程名称" min-width="200" />
          <el-table-column prop="remarks" label="课程描述" min-width="250" show-overflow-tooltip />
          <el-table-column prop="chapterCount" label="章节数" width="100" align="center" />
          <el-table-column prop="questionCount" label="题目数" width="100" align="center" />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleEdit(row)">
                编辑
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
          <el-form-item label="课程名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入课程名称" />
          </el-form-item>
          
          <el-form-item label="课程描述" prop="remarks">
            <el-input
              v-model="formData.remarks"
              type="textarea"
              :rows="4"
              placeholder="请输入课程描述"
            />
          </el-form-item>
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
import {createCourse, deleteCourse, getAdminCourseList, updateCourse} from "@/api/admin.js";


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

const dialogTitle = computed(() => isEdit.value ? '编辑课程' : '新增课程')

// 表单数据
const formData = reactive({
  id: null,
  name: '',
  remarks: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入课程名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  remarks: [
    { max: 200, message: '长度不超过 200 个字符', trigger: 'blur' }
  ]
}

// 初始化模拟数据
// const initMockData = () => {
//   const courses = [
//     { name: 'Java 基础', remarks: 'Java 编程语言基础知识学习' },
//     { name: 'Python 入门', remarks: 'Python 编程语言入门课程' },
//     { name: 'JavaScript 高级', remarks: 'JavaScript 高级特性与应用' },
//     { name: 'Vue 3 实战', remarks: 'Vue 3 框架实战开发' },
//     { name: 'React 开发', remarks: 'React 前端框架开发' },
//     { name: 'Node.js 后端', remarks: 'Node.js 后端开发技术' },
//     { name: '数据库设计', remarks: 'MySQL 数据库设计与优化' },
//     { name: '算法与数据结构', remarks: '常用算法与数据结构' },
//     { name: '设计模式', remarks: '23 种设计模式详解' },
//     { name: 'Git 版本控制', remarks: 'Git 版本控制系统使用' },
//     { name: 'Docker 容器', remarks: 'Docker 容器化技术' },
//     { name: 'Linux 运维', remarks: 'Linux 系统运维基础' }
//   ]
//
//   return courses.map((course, index) => ({
//     id: index + 1,
//     name: course.name,
//     remarks: course.remarks,
//     chapterCount: Math.floor(Math.random() * 10) + 3,
//     questionCount: Math.floor(Math.random() * 500) + 100,
//     createTime: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
//   }))
// }
//接口加载数据


// const allCourses = ref(initMockData())

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      isUse:'',
      name:searchKeyword.value
    }


    const data = await getAdminCourseList(params)
    // 响应拦截器已经返回了 data，直接使用
    if (data) {
      // 处理返回数据,映射字段
      tableData.value = data

      total.value = data.total || 0
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
    ElMessage.error('获取课程列表失败')
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
    remarks: ''
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    name: row.name,
    remarks: row.remarks
  })
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row) => { // 改为 async 函数
  try {
    await ElMessageBox.confirm(
        `确定要删除课程"${row.name}"吗？删除后该课程下的所有章节和题目都将被删除，此操作不可恢复。`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    );

    // 等待删除接口执行完成后，再加载数据
    await deleteCourse(row.id);
    // 重新加载最新数据
    await loadData();
    ElMessage.success('删除成功');
  } catch (error) {
    // 区分取消操作和真正的错误
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.message || '服务器异常'));
      console.error('删除课程失败：', error); // 便于调试
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    
    // 模拟提交
      try {

      if (isEdit.value) {
        // 编辑
        // const course = allCourses.value.find(c => c.id === formData.id)
        // if (course) {
        //   Object.assign(course, {
        //     name: formData.name,
        //     remarks: formData.remarks
        //   })
        // }
        // 新增
        const newCourse = {
          name: formData.name,
          remarks: formData.remarks,
        }
        const data=await updateCourse(formData.id,newCourse);
        // allCourses.value.unshift(newCourse)
        ElMessage.success('编辑成功')
      } else {
        // 新增
        const newCourse = {
          // id: allCourses.value.length + 1,
          name: formData.name,
          remarks: formData.remarks,
          // chapterCount: 0,
          // questionCount: 0,
          // createTime: new Date().toLocaleString('zh-CN')
        }
        const data=await createCourse(newCourse);
        // allCourses.value.unshift(newCourse)
        ElMessage.success('添加成功')
      }
      
      submitting.value = false
      dialogVisible.value = false
      loadData()
      }catch (error) {
        // 接口请求失败处理
        ElMessage.error(isEdit.value ? '编辑失败' : '添加失败')
        submitting.value = false // 失败也要重置加载状态
        console.error('课程提交失败：', error)
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
.course-manage-page {
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
