<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">作答记录</h1>
        <p class="page-subtitle">所有练习、考试和错题练习记录来自 `/api/exams/history`。</p>
      </div>
      <el-button @click="$router.push('/profile')">返回</el-button>
    </div>

    <section class="surface">
      <el-table :data="rows" style="width: 100%">
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column label="模式" width="110">
          <template #default="{ row }">
            <el-tag :type="tagOf(EXAM_MODES, row.mode)">{{ labelOf(EXAM_MODES, row.mode) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="得分" width="120">
          <template #default="{ row }">{{ row.earnedScore ?? '-' }} / {{ row.totalScore || 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="tagOf(ATTEMPT_STATUS, row.status)">{{ labelOf(ATTEMPT_STATUS, row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" min-width="160">
          <template #default="{ row }">{{ formatDateTime(row.submittedTime || row.startedTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/exam/result/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getExamHistory } from '@/api/exam'
import { ATTEMPT_STATUS, EXAM_MODES, labelOf, tagOf } from '@/utils/dictionaries'
import { formatDateTime } from '@/utils/helpers'

const rows = ref([])

onMounted(async () => {
  rows.value = await getExamHistory()
})
</script>
