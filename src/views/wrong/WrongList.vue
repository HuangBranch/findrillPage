<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">错题复习</h1>
        <p class="page-subtitle">查看错题、收藏、复习计划和题目反馈。</p>
      </div>
      <el-button type="primary" @click="$router.push('/wrong/practice')">开始错题练习</el-button>
    </div>

    <section class="surface">
      <el-tabs v-model="activeTab" @tab-change="loadData">
        <el-tab-pane label="错题" name="wrong">
          <el-table :data="wrongRows" style="width: 100%">
            <el-table-column prop="questionId" label="题目 ID" width="110" />
            <el-table-column prop="wrongCount" label="错误次数" width="100" />
            <el-table-column prop="rightCount" label="正确次数" width="100" />
            <el-table-column label="最近错误" min-width="160">
              <template #default="{ row }">{{ formatDateTime(row.lastWrongTime) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'warning' : 'info'">{{ row.isActive ? '活跃' : '已移除' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" @click="remove(row.questionId)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="收藏" name="favorite">
          <el-table :data="favoriteRows" style="width: 100%">
            <el-table-column prop="questionId" label="题目 ID" />
            <el-table-column label="收藏时间">
              <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button link type="danger" @click="unfavorite(row.questionId)">取消收藏</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="复习计划" name="review">
          <el-table :data="reviewRows" style="width: 100%">
            <el-table-column prop="questionId" label="题目 ID" width="110" />
            <el-table-column prop="reviewCount" label="复习次数" width="100" />
            <el-table-column label="下次复习" min-width="160">
              <template #default="{ row }">{{ formatDateTime(row.nextReviewTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="170">
              <template #default="{ row }">
                <el-button link type="primary" @click="complete(row.id)">完成</el-button>
                <el-button link @click="ignore(row.id)">忽略</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="我的反馈" name="reports">
          <el-table :data="reportRows" style="width: 100%">
            <el-table-column prop="questionId" label="题目 ID" width="110" />
            <el-table-column label="原因" width="120">
              <template #default="{ row }">{{ labelOf(REPORT_REASONS, row.reason) }}</template>
            </el-table-column>
            <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="tagOf(REPORT_STATUS, row.status)">{{ labelOf(REPORT_STATUS, row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  completeReview,
  ignoreReview,
  listFavorites,
  listMyQuestionReports,
  listReviewSchedules,
  listWrongQuestions,
  removeFavorite,
  removeWrongQuestion
} from '@/api/learning'
import { REPORT_REASONS, REPORT_STATUS, labelOf, tagOf } from '@/utils/dictionaries'
import { formatDateTime } from '@/utils/helpers'

const activeTab = ref('wrong')
const wrongRows = ref([])
const favoriteRows = ref([])
const reviewRows = ref([])
const reportRows = ref([])

const loadData = async () => {
  if (activeTab.value === 'wrong') wrongRows.value = await listWrongQuestions({ active: true })
  if (activeTab.value === 'favorite') favoriteRows.value = await listFavorites()
  if (activeTab.value === 'review') reviewRows.value = await listReviewSchedules({ dueOnly: false })
  if (activeTab.value === 'reports') reportRows.value = await listMyQuestionReports()
}

const remove = async (questionId) => {
  await removeWrongQuestion(questionId)
  ElMessage.success('已移除错题')
  loadData()
}

const unfavorite = async (questionId) => {
  await removeFavorite(questionId)
  ElMessage.success('已取消收藏')
  loadData()
}

const complete = async (id) => {
  await completeReview(id)
  ElMessage.success('已完成复习')
  loadData()
}

const ignore = async (id) => {
  await ignoreReview(id)
  ElMessage.success('已忽略')
  loadData()
}

onMounted(loadData)
</script>
