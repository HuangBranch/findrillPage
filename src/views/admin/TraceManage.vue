<template>
    <AdminLayout>
        <div class="trace-manage-page">
            <el-card>
                <!-- 搜索栏 -->
                <div class="search-bar">
                    <el-select v-model="searchType" placeholder="记录类型" style="width: 150px" clearable
                        @change="handleSearch">
                        <el-option label="考试记录" value="exam" />
                        <el-option label="练习记录" value="practice" />
                    </el-select>

                    <el-input v-model="searchKeyword" placeholder="搜索用户名或课程" style="width: 250px; margin-left: 12px"
                        clearable @input="handleSearch">
                        <template #prefix><el-icon>
                                <Search />
                            </el-icon></template>
                    </el-input>

                    <el-date-picker v-model="searchDateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" style="width: 280px; margin-left: 12px"
                        @change="handleSearch" />

                    <el-button type="danger" :icon="Delete" @click="handleBatchDelete"
                        :disabled="selectedIds.length === 0" style="margin-left: auto">
                        批量删除
                    </el-button>
                </div>

                <!-- 记录表格 -->
                <el-table :data="tableData" style="width: 100%; margin-top: 20px" v-loading="loading"
                    @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="id" label="ID" width="80" />
                    <el-table-column label="类型" width="100">
                        <template #default="{ row }">
                            <el-tag :type="getExamTypeTag(row.examType)">
                                {{ getExamTypeName(row.examType) }}
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
                            <span>{{ row.completedQuestionCount }}/{{ row.totalCount }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="duration" label="用时" width="100" align="center">
                        <template #default="{ row }">
                            {{ formatDuration(row.startTime && row.endTime ? calculateDuration(row.startTime, row.endTime) : 0) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag :type="row.status === 2 ? 'success' : 'info'">
                                {{ row.status === 2 ? '已完成' : '未完成' }}
                            </el-tag>
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
                    <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                        :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" :total="total"
                        @size-change="handlePageChange" @current-change="handlePageChange" />
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
                        <el-descriptions-item label="用时">{{ formatDuration(currentTrace.duration)
                            }}</el-descriptions-item>
                        <el-descriptions-item label="创建时间">{{ currentTrace.startTime }}</el-descriptions-item>
                    </el-descriptions>

                    <el-divider />

                    <h4>答题详情</h4>
                    <el-table :data="paginatedDetails" style="width: 100%; margin-top: 16px">
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
                    
                    <!-- 详情分页 -->
                    <div class="detail-pagination">
                        <el-pagination
                            v-model:current-page="detailCurrentPage"
                            v-model:page-size="detailPageSize"
                            :page-sizes="[10, 20, 50]"
                            layout="total, sizes, prev, pager, next, jumper"
                            :total="detailTotal"
                            small
                        />
                    </div>
                </div>
            </el-dialog>
        </div>
    </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { Search, Delete } from '@element-plus/icons-vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { getTraceList, getTraceDetail, deleteTraces } from '@/api/admin'

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

// 详情分页相关
const detailCurrentPage = ref(1)
const detailPageSize = ref(10)
const detailTotal = computed(() => currentTrace.value?.details?.length || 0)

// 分页后的详情数据
const paginatedDetails = computed(() => {
    if (!currentTrace.value?.details) return []
    const start = (detailCurrentPage.value - 1) * detailPageSize.value
    const end = start + detailPageSize.value
    return currentTrace.value.details.slice(start, end)
})

// 获取记录类型名称
const getExamTypeName = (type) => {
    const map = { 1: '刷题', 2: '考试', 3: '错题' }
    return map[type] || '未知'
}

// 获取记录类型标签
const getExamTypeTag = (type) => {
    const map = { 1: 'success', 2: 'danger', 3: 'warning' }
    return map[type] || ''
}

// 加载数据
const loadData = async () => {
    loading.value = true

    try {
        const params = {
            page: currentPage.value,
            pageSize: pageSize.value
        }

        // 添加筛选条件
        if (searchType.value) {
            // 将exam/practice转为examType: 1(刷题)/2(考试)/3(错题)
            if (searchType.value === 'exam') {
                params.examType = 2
            } else if (searchType.value === 'practice') {
                params.examType = 1
            }
        }

        if (searchKeyword.value) {
            params.keyword = searchKeyword.value
        }

        // 添加时间范围筛选
        if (searchDateRange.value && searchDateRange.value.length === 2) {
            // 格式化开始时间为 YYYY-MM-DD 00:00:00
            const startDate = new Date(searchDateRange.value[0])
            params.startTime = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} 00:00:00`
            
            // 格式化结束时间为 YYYY-MM-DD 23:59:59
            const endDate = new Date(searchDateRange.value[1])
            params.submitTime = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} 23:59:59`
        }

        const data = await getTraceList(params)

        if (data && data.list) {
            // 映射后端数据到前端字段
            tableData.value = data.list.map(record => ({
                id: record.id,
                userId: record.userId,
                type: record.examType === 2 ? 'exam' : (record.examType === 1 ? 'practice' : 'wrong'),
                examType: record.examType,
                userName: record.name || `用户${record.userId}`,
                courseName: record.curriculumName || '未知课程',
                chapterName: record.chapterName || '未知章节',
                score: record.score || 0,
                correctCount: 0, // 后端没有返回，需要查看详情获取
                totalCount: record.totalQuestion || 0,
                duration:  0, // 后端没有返回
                startTime: record.startTime || '',
                endTime: record.submitTime || '',
                status: record.status,
                completedQuestionCount: record.completedQuestionCount || 0,
                createTime: record.startTime || ''
            }))

            total.value = data.total || 0
        } else {
            tableData.value = []
            total.value = 0
        }
    } catch (error) {
        console.error('获取记录列表失败:', error)
        ElMessage.error('获取记录列表失败')
        tableData.value = []
        total.value = 0
    } finally {
        loading.value = false
    }
}

const handleSearch = () => {
    currentPage.value = 1
    console.log(searchDateRange.value)
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

// 计算时间
function calculateDuration(startTime, endTime) {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    return Math.floor((end - start) / 1000) // 返回秒数
}

const handleView = async (row) => {
    // 显示加载动画
    const loadingInstance = ElLoading.service({
        lock: true,
        text: '加载详情中...',
        background: 'rgba(0, 0, 0, 0.7)'
    })

    try {
        const detail = await getTraceDetail(row.id)

        if (detail) {
            // 计算用时（秒）
            let duration = 0
            if (detail.startTime && detail.submitTime) {
                duration = calculateDuration(detail.startTime, detail.submitTime)
            }

            // 构造详情数据
            currentTrace.value = {
                id: detail.id,
                userId: detail.userId,
                type: detail.examType === 2 ? 'exam' : (detail.examType === 1 ? 'practice' : 'wrong'),
                examType: detail.examType,
                userName: `${detail.name}`,
                courseName: detail.curriculumName || '未知课程',
                chapterName: detail.chapterName || '未知章节',
                score: detail.score || 0,
                correctCount: detail.rightCount || 0,
                totalCount: detail.totalQuestion || 0,
                duration: duration,
                status: detail.status,
                startTime: detail.startTime,
                submitTime: detail.submitTime,
                // 答题详情
                details: detail.subjectList ? detail.subjectList.map((item, index) => ({
                    questionNum: index + 1,
                    questionContent: item.subject,
                    isCorrect: item.isCorrect,
                    userAnswer: item.userAnswer || '-',
                    correctAnswer: item.answer
                })) : []
            }

            // 重置详情分页
            detailCurrentPage.value = 1
            detailDialogVisible.value = true
        }
    } catch (error) {
        console.error('获取记录详情失败:', error)
        ElMessage.error('获取记录详情失败')
    } finally {
        loadingInstance.close()
    }
}

const handleDelete = (row) => {
    ElMessageBox.confirm('确定要删除该记录吗？此操作不可恢复。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        loading.value = true
        try {
            await deleteTraces([row.id])
            ElMessage.success('删除成功')
            await loadData()
        } catch (error) {
            console.error('删除失败:', error)
            ElMessage.error('删除失败')
            loading.value = false
        }
    }).catch(() => { })
}

const handleBatchDelete = () => {
    ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        loading.value = true
        try {
            await deleteTraces(selectedIds.value)
            ElMessage.success('批量删除成功')
            selectedIds.value = []
            await loadData()
        } catch (error) {
            console.error('批量删除失败:', error)
            ElMessage.error('批量删除失败')
            loading.value = false
        }
    }).catch(() => { })
}

onMounted(() => loadData())
</script>

<style scoped>
.trace-manage-page {
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

.detail-pagination {
    margin-top: 16px;
    display: flex;
    justify-content: center;
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
