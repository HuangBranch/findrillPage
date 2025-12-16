<template>
  <AdminLayout>
    <div class="trace-manage-page">
      <el-card>
        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-select v-model="searchType" placeholder="记录类型" style="width: 150px" clearable @change="handleSearch">
            <el-option label="考试记录" value="exam" />
            <el-option label="练习记录" value="practice" />
          </el-select>
          
          <el-input v-model="searchKeyword" placeholder="搜索用户名或课程" style="width: 250px; margin-left: 12px" clearable @input="handleSearch">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          
          <el-date-picker
            v-model="searchDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 280px; margin-left: 12px"
            @change="handleSearch"
          />
          
          <el-button type="danger" :icon="Delete" @click="handleBatchDelete" :disabled="selectedIds.length === 0" style="margin-left: auto">
            批量删除
          </el-button>
        </div>

        <!-- 记录表格 -->
        <el-table
          :data="tableData"
          style="width: 100%; margin-top: 20px"
          v-loading="loading"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'exam' ? 'danger' : 'success'">
                {{ row.type === 'exam' ? '考试' : '练习' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="userName" label="用户" width="120" />
          <el-table-column prop="courseName" label="课程" min-width="150" />
          <el-table-column prop="chapterName" label="章节" min-width="150" />
          <el-table-column label="成绩" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.type === 'exam'" :type="row.score >= 60 ? 'success' : 'danger'">
                {{ row.score }}分
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="答题情况" width="120" align="center">
            <template #default="{ row }">
              <span>{{ row.correctCount }}/{{ row.totalCount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="用时" width="100" align="center">
            <template #default="{ row }">
              {{ formatDuration(row.duration) }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="时间" width="180" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleView(row)">
                查看详情
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

      <!-- 详情对话框 -->
      <el-dialog v-model="detailDialogVisible" title="记录详情" width="90%" :style="{ maxWidth: '900px' }">
        <div v-if="currentTrace">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="记录类型">
              <el-tag :type="currentTrace.type === 'exam' ? 'danger' : 'success'">
                {{ currentTrace.type === 'exam' ? '考试记录' : '练习记录' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户">{{ currentTrace.userName }}</el-descriptions-item>
            <el-descriptions-item label="课程">{{ currentTrace.courseName }}</el-descriptions-item>
            <el-descriptions-item label="章节">{{ currentTrace.chapterName }}</el-descriptions-item>
            <el-descriptions-item label="成绩" v-if="currentTrace.type === 'exam'">
              <el-tag :type="currentTrace.score >= 60 ? 'success' : 'danger'">
                {{ currentTrace.score }}分
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="答题情况">
              正确：{{ currentTrace.correctCount }} / 总数：{{ currentTrace.totalCount }}
            </el-descriptions-item>
            <el-descriptions-item label="用时">{{ formatDuration(currentTrace.duration) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ currentTrace.createTime }}</el-descriptions-item>
          </el-descriptions>
          
          <el-divider />
          
          <h4>答题详情</h4>
          <el-table :data="currentTrace.details" style="width: 100%; margin-top: 16px">
            <el-table-column prop="questionNum" label="题号" width="80" align="center" />
            <el-table-column prop="questionContent" label="题目内容" min-width="250" show-overflow-tooltip />
            <el-table-column label="答题结果" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="row.isCorrect ? 'success' : 'danger'">
                  {{ row.isCorrect ? '正确' : '错误' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="userAnswer" label="用户答案" width="100" align="center" />
            <el-table-column prop="correctAnswer" label="正确答案" width="100" align="center" />
          </el-table>
        </div>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Delete } from '@element-plus/icons-vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const searchType = ref('')
const searchKeyword = ref('')
const searchDateRange = ref([])
const loading = ref(false)
const tableData = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedIds = ref([])
const detailDialogVisible = ref(false)
const currentTrace = ref(null)

const initMockData = () => {
  const traces = []
  const users = ['张三', '李四', '王五', '赵六', '钱七']
  const courses = ['Java 基础', 'Python 入门', 'JavaScript 高级']
  const chapters = ['第一章', '第二章', '第三章']
  
  for (let i = 0; i < 50; i++) {
    const type = Math.random() > 0.5 ? 'exam' : 'practice'
    const totalCount = 20
    const correctCount = Math.floor(Math.random() * totalCount)
    const score = type === 'exam' ? Math.floor((correctCount / totalCount) * 100) : 0
    
    traces.push({
      id: i + 1,
      type,
      userName: users[Math.floor(Math.random() * users.length)],
      courseName: courses[Math.floor(Math.random() * courses.length)],
      chapterName: chapters[Math.floor(Math.random() * chapters.length)],
      score,
      correctCount,
      totalCount,
      duration: Math.floor(Math.random() * 3600) + 600,
      createTime: `2025-12-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      details: Array.from({ length: totalCount }, (_, idx) => ({
        questionNum: idx + 1,
        questionContent: `这是第 ${idx + 1} 题的内容`,
        isCorrect: idx < correctCount,
        userAnswer: String.fromCharCode(65 + Math.floor(Math.random() * 4)),
        correctAnswer: 'A'
      }))
    })
  }
  
  return traces
}

const allTraces = ref(initMockData())

const loadData = () => {
  loading.value = true
  
  setTimeout(() => {
    let filtered = allTraces.value
    
    if (searchType.value) {
      filtered = filtered.filter(t => t.type === searchType.value)
    }
    
    if (searchKeyword.value) {
      filtered = filtered.filter(t => 
        t.userName.includes(searchKeyword.value) || 
        t.courseName.includes(searchKeyword.value)
      )
    }
    
    total.value = filtered.length
    
    const start = (currentPage.value - 1) * pageSize.value
    tableData.value = filtered.slice(start, start + pageSize.value)
    
    loading.value = false
  }, 300)
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handlePageChange = () => loadData()

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${h}时${m}分${s}秒` : `${m}分${s}秒`
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

const handleView = (row) => {
  currentTrace.value = row
  detailDialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该记录吗？此操作不可恢复。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = allTraces.value.findIndex(t => t.id === row.id)
    if (index > -1) {
      allTraces.value.splice(index, 1)
      loadData()
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    allTraces.value = allTraces.value.filter(t => !selectedIds.value.includes(t.id))
    selectedIds.value = []
    loadData()
    ElMessage.success('批量删除成功')
  }).catch(() => {})
}

onMounted(() => loadData())
</script>

<style scoped>
.trace-manage-page { min-height: 100%; }
.search-bar { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }

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
  .search-bar :deep(.el-date-editor),
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
  
  :deep(.el-descriptions) {
    font-size: 13px;
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
