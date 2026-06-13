<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">学习状态</h1>
        <p class="page-subtitle">章节进度、题目掌握情况和学习趋势。</p>
      </div>
      <el-button @click="$router.push('/profile')">返回</el-button>
    </div>

    <section class="surface">
      <el-tabs v-model="tab" @tab-change="loadData">
        <el-tab-pane label="章节进度" name="chapters">
          <el-table :data="chapterRows" style="width: 100%">
            <el-table-column prop="curriculumId" label="课程" width="100" />
            <el-table-column prop="chapterId" label="章节" width="100" />
            <el-table-column prop="totalQuestion" label="总题数" width="100" />
            <el-table-column prop="practicedQuestion" label="已练" width="100" />
            <el-table-column prop="masteredQuestion" label="掌握" width="100" />
            <el-table-column prop="wrongQuestion" label="错题" width="100" />
            <el-table-column label="正确率">
              <template #default="{ row }"><el-progress :percentage="rate(row.accuracyRate)" /></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="题目状态" name="questions">
          <el-table :data="questionRows" style="width: 100%">
            <el-table-column prop="questionId" label="题目 ID" />
            <el-table-column prop="answerCount" label="作答次数" />
            <el-table-column prop="rightCount" label="正确" />
            <el-table-column prop="wrongCount" label="错误" />
            <el-table-column label="下次复习">
              <template #default="{ row }">{{ formatDateTime(row.nextReviewTime) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="趋势" name="trend">
          <el-table :data="trendRows" style="width: 100%">
            <el-table-column v-for="column in trendColumns" :key="column" :prop="column" :label="column" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getMyTrend, listChapterProgress, listQuestionStates } from '@/api/learning'
import { formatDateTime } from '@/utils/helpers'

const tab = ref('chapters')
const chapterRows = ref([])
const questionRows = ref([])
const trendRows = ref([])

const trendColumns = computed(() => Object.keys(trendRows.value[0] || {}))

const rate = (value) => {
  const num = Number(value)
  if (Number.isNaN(num)) return 0
  return num <= 1 ? Math.round(num * 100) : Math.round(num)
}

const loadData = async () => {
  if (tab.value === 'chapters') chapterRows.value = await listChapterProgress()
  if (tab.value === 'questions') questionRows.value = await listQuestionStates()
  if (tab.value === 'trend') trendRows.value = await getMyTrend()
}

onMounted(loadData)
</script>
