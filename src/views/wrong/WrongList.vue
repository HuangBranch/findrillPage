<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">错题复习</h1>
        <p class="page-subtitle">查看错题、收藏、题目掌握状态和章节进度。</p>
      </div>
      <el-button type="primary" @click="$router.push({ name: 'Practice', query: { sourceType: 2 } })">开始错题练习</el-button>
    </div>

    <section class="surface">
      <el-tabs v-model="activeTab" @tab-change="loadData">
        <el-tab-pane label="错题" name="wrong">
          <el-table :data="wrongRows" style="width: 100%" row-key="questionId">
            <el-table-column label="题目内容" min-width="260">
              <template #default="{ row }">
                <div v-if="questionStem(row)" class="html-content wrong-question-stem" v-html="questionStem(row)"></div>
                <span v-else class="muted-text">题目 #{{ row.questionId }}</span>
              </template>
            </el-table-column>
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

        <el-tab-pane label="题目掌握状态" name="states">
          <el-table :data="questionRows" style="width: 100%">
            <el-table-column prop="questionId" label="题目 ID" width="110" />
            <el-table-column prop="rightCount" label="正确次数" width="100" />
            <el-table-column prop="wrongCount" label="错误次数" width="100" />
            <el-table-column label="正确率" width="120">
              <template #default="{ row }">{{ percent(row.accuracyRate) }}</template>
            </el-table-column>
            <el-table-column label="掌握状态" width="120">
              <template #default="{ row }">
                <el-tag :type="masteryTag(row)">{{ masteryText(row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="最近练习" min-width="160">
              <template #default="{ row }">{{ formatDateTime(row.lastPracticeTime || row.updateTime) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="章节进度" name="chapters">
          <el-table :data="chapterRows" style="width: 100%">
            <el-table-column prop="chapterName" label="章节" min-width="180" />
            <el-table-column prop="totalQuestion" label="题量" width="90" />
            <el-table-column prop="masteredQuestion" label="掌握" width="90" />
            <el-table-column prop="wrongQuestion" label="错题" width="90" />
            <el-table-column label="进度" min-width="180">
              <template #default="{ row }">
                <el-progress :percentage="rate(row.accuracyRate)" />
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
  listChapterProgress,
  listFavorites,
  listQuestionStates,
  listWrongQuestions,
  removeFavorite,
  removeWrongQuestion
} from '@/api/learning'
import { formatDateTime } from '@/utils/helpers'

const activeTab = ref('wrong')
const wrongRows = ref([])
const favoriteRows = ref([])
const questionRows = ref([])
const chapterRows = ref([])

const questionStem = (row) =>
  row.stemHtml ||
  row.question?.stemHtml ||
  row.questionStemHtml ||
  row.questionContentHtml ||
  row.questionContent ||
  row.stem ||
  row.content ||
  ''

const loadData = async () => {
  if (activeTab.value === 'wrong') wrongRows.value = await listWrongQuestions({ active: true })
  if (activeTab.value === 'favorite') favoriteRows.value = await listFavorites()
  if (activeTab.value === 'states') questionRows.value = await listQuestionStates()
  if (activeTab.value === 'chapters') chapterRows.value = await listChapterProgress()
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

const rate = (value) => Math.round(Number(value || 0))

const percent = (value) => `${rate(value)}%`

const masteryText = (row) => {
  const mastered = row.mastered ?? row.isMastered
  if (mastered === true || mastered === 1) return '已掌握'
  if (rate(row.accuracyRate) >= 80) return '趋于掌握'
  return '待巩固'
}

const masteryTag = (row) => {
  const text = masteryText(row)
  if (text === '已掌握') return 'success'
  if (text === '趋于掌握') return 'warning'
  return 'danger'
}

onMounted(loadData)
</script>

<style scoped>
.wrong-question-stem {
  display: -webkit-box;
  max-height: 4.8em;
  overflow: hidden;
  color: #1f2937;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.muted-text {
  color: #94a3b8;
}

@media (max-width: 760px) {
  .wrong-question-stem {
    max-height: none;
    -webkit-line-clamp: 4;
  }
}
</style>
