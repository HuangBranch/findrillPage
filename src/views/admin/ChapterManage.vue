<template>
  <AdminLayout>
    <div class="chapter-manage-page">
      <el-card>
        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-select
            v-model="searchCourseName"
            placeholder="选择课程"
            style="width: 200px"
            clearable
            @change="handleSearch"
          >
            <el-option
              v-for="course in courseList"
              :key="course.id"
              :label="course.name"
              :value="course.name"
            />
          </el-select>
          
          <el-input
            v-model="searchKeyword"
            placeholder="搜索章节名称"
            style="width: 250px; margin-left: 12px"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-button type="primary" :icon="Plus" @click="handleAdd" style="margin-left: auto">
            新增章节
          </el-button>
        </div>

        <!-- 章节表格 -->
        <el-table :data="tableData" style="width: 100%; margin-top: 20px" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="curriculumName" label="所属课程名称" min-width="150" />
          <el-table-column prop="name" label="章节名称" min-width="180" />
          <el-table-column prop="description" label="章节描述" min-width="200" show-overflow-tooltip />
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
          <el-form-item label="所属课程" prop="courseId">
            <el-select v-model="formData.courseId" placeholder="请选择课程" style="width: 100%">
              <el-option
                v-for="course in courseList"
                :key="course.id"
                :label="course.name"
                :value="course.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="章节名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入章节名称" />
          </el-form-item>
          
          <el-form-item label="章节描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="4"
              placeholder="请输入章节描述"
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
import {
  createChapter,
  deleteChapter,
  getAdminChapterList,
  getAdminCourseList,
  updateChapter,
  updateCourse
} from "@/api/admin.js";

const courseList = ref()

// 搜索条件
const searchCourseName = ref('')
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

const dialogTitle = computed(() => isEdit.value ? '编辑章节' : '新增章节')

// 表单数据
const formData = reactive({
  id: null,
  courseId: null,
  name: '',
  description: '',
  isUse:true,
  sort:''
})

// 表单验证规则
const formRules = {
  courseId: [
    { required: true, message: '请选择课程', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入章节名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '长度不超过 200 个字符', trigger: 'blur' }
  ]
}
// const allChapters = ref(initMockData())
//加载课程数据
const courseData = async () => {
  try {
    const params = {
      isUse:"",
      name:""
    }
    const cdata = await getAdminCourseList(params)
    // 响应拦截器已经返回了 data，直接使用
    if (cdata) {
      courseList.value=cdata
    }
  } catch (error) {
    console.error('获取课程列表失败:', error)
    ElMessage.error('获取课程列表失败')
  }
}
courseData()
// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      chapterName:searchKeyword.value,
      curriculumName: searchCourseName.value,
    }

    const data = await getAdminChapterList(params)
    console.log(params)
    // 响应拦截器已经返回了 data，直接使用
    if (data) {
      // 处理返回数据,映射字段
      tableData.value = data.list
      total.value = data.total || 0
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取章节列表失败:', error)
    ElMessage.error('获取章节列表失败')
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handlePageChange = () => {
  loadData()
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(formData, {
    id: null,
    courseId: null,
    name: '',
    description: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    courseId: row.courseId,
    name: row.name,
    description: row.description
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    // 等待用户确认删除操作（ElMessageBox.confirm 本身返回 Promise）
    await ElMessageBox.confirm(
        `确定要删除章节"${row.name}"吗？删除后该章节下的所有题目都将被删除，此操作不可恢复。`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
    );

    // 等待删除接口执行完成（关键：确保删除操作先完成）
    await deleteChapter(row.id);
    // 等待数据重新加载完成（确保加载的是删除后的最新数据）
    await loadData();
    // 只有上面两步都完成，才提示删除成功
    ElMessage.success('删除成功');
  } catch (error) {
    // 区分“用户取消删除”和“真正的接口错误”
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error.message || '服务器异常'));
      console.error('删除章节失败：', error); // 便于调试问题
    }
    // 如果是用户取消（error === 'cancel'），则什么都不做
  }
}

const handleSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true

    try {
      if (isEdit.value) {
        const newChapter = {
          curriculumId: formData.courseId,
          name: formData.name,
          description: formData.description,
        }
        console.log(newChapter)
        const data=await updateChapter(formData.id,newChapter);
        ElMessage.success('编辑成功')
      } else {
        const newChapter = {
          curriculumId: formData.courseId,
          name: formData.name,
          description: formData.description,
          isUse:true,
          sort:0
        }
        const data=await createChapter(newChapter);
        ElMessage.success('添加成功')
      }

      submitting.value = false
      dialogVisible.value = false
      loadData()
    }catch (error) {
        // 接口请求失败处理
        ElMessage.error(isEdit.value ? '编辑失败' : '添加失败')
        submitting.value = false // 失败也要重置加载状态
        console.error('章节提交失败：', error)
      }

  })
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.chapter-manage-page {
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
  
  .search-bar :deep(.el-select),
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
