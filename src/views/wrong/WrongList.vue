<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">错题复习</h1>
        <p class="page-subtitle">查看错题和收藏，继续针对性练习。</p>
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

      </el-tabs>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  listFavorites,
  listWrongQuestions,
  removeFavorite,
  removeWrongQuestion
} from '@/api/learning'
import { formatDateTime } from '@/utils/helpers'

const activeTab = ref('wrong')
const wrongRows = ref([])
const favoriteRows = ref([])

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
