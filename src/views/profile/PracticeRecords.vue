<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">练习记录</h1>
        <p class="page-subtitle">查看练习历史和学习趋势。</p>
      </div>
      <el-button @click="$router.push('/profile')">返回</el-button>
    </div>

    <section class="surface">
      <el-tabs v-model="tab" @tab-change="loadData">
        <el-tab-pane label="练习历史" name="history">
          <el-table :data="historyRows" style="width: 100%">
            <el-table-column prop="name" label="名称" min-width="180" />
            <el-table-column label="得分" width="120">
              <template #default="{ row }">{{ row.earnedScore ?? '-' }} / {{ row.totalScore || 0 }}</template>
            </el-table-column>
            <el-table-column label="正确/错误" width="120">
              <template #default="{ row }">{{ row.rightCount || 0 }} / {{ row.wrongCount || 0 }}</template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="tagOf(ATTEMPT_STATUS, row.status)">{{ labelOf(ATTEMPT_STATUS, row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时间" min-width="160">
              <template #default="{ row }">{{ formatDateTime(row.submittedTime || row.startedTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="$router.push(`/practice/result/${row.id || row.attemptId}`)">详情</el-button>
              </template>
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
import { getMyTrend } from '@/api/learning'
import { getPracticeHistory } from '@/api/practice'
import { ATTEMPT_STATUS, labelOf, tagOf } from '@/utils/dictionaries'
import { formatDateTime } from '@/utils/helpers'

const tab = ref('history')
const historyRows = ref([])
const trendRows = ref([])

const trendColumns = computed(() => Object.keys(trendRows.value[0] || {}))

const loadData = async () => {
  if (tab.value === 'history') historyRows.value = await getPracticeHistory()
  if (tab.value === 'trend') trendRows.value = await getMyTrend()
}

onMounted(loadData)
</script>
