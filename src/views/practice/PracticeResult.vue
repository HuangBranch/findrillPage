<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">练习结果</h1>
        <p class="page-subtitle">{{ attempt?.name || '自主练习结果' }}</p>
      </div>
      <div class="toolbar">
        <el-button @click="router.push('/profile/practice-records')">查看记录</el-button>
        <el-button type="primary" @click="router.push('/courses')">继续学习</el-button>
      </div>
    </div>

    <el-skeleton :loading="loading" animated :rows="6">
        <div v-if="attempt" class="page">
          <div class="metric-grid">
            <div class="metric">
            <div class="metric__value">{{ attempt.totalQuestion || 0 }}</div>
            <div class="metric__label">题目总数</div>
            </div>
            <div class="metric">
              <div class="metric__value">{{ attempt.rightCount || 0 }}</div>
            <div class="metric__label">正确</div>
          </div>
          <div class="metric">
            <div class="metric__value">{{ attempt.wrongCount || 0 }}</div>
            <div class="metric__label">错误</div>
          </div>
          <div class="metric">
            <div class="metric__value">{{ attempt.pendingCount || 0 }}</div>
            <div class="metric__label">未答题</div>
          </div>
        </div>

        <section class="surface">
          <el-descriptions :column="descriptionColumns" border>
            <el-descriptions-item label="模式">
              <el-tag type="success">自主练习</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="tagOf(ATTEMPT_STATUS, attempt.status)">{{ labelOf(ATTEMPT_STATUS, attempt.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ formatDateTime(attempt.startedTime) }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ formatDateTime(attempt.submittedTime) }}</el-descriptions-item>
            <el-descriptions-item label="用时">{{ formatDuration(attempt.useTimeSeconds) }}</el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="surface question-results">
          <h2>题目明细</h2>
          <el-collapse>
            <el-collapse-item v-for="(question, index) in attempt.questions || []" :key="question.id" :name="question.id">
              <template #title>
                <span class="result-title">
                  第 {{ index + 1 }} 题
                  <el-tag size="small">{{ labelOf(QUESTION_TYPES, question.type) }}</el-tag>
                  <el-tag v-if="!question.answer" size="small" type="info">未作答</el-tag>
                  <el-tag v-else-if="question.answer?.judgeStatus === 2" size="small" type="warning">待判定</el-tag>
                  <el-tag v-else-if="question.answer?.isCorrect" size="small" type="success">正确</el-tag>
                  <el-tag v-else size="small" type="danger">错误</el-tag>
                </span>
              </template>
              <div class="html-content question-stem" v-html="question.stemHtml"></div>
              <p class="answer-line">你的答案：{{ displayAnswer(question) }}</p>
              <p class="answer-line">正确答案：{{ displayCorrectAnswer(question) }}</p>
              <div
                v-if="question.analysisHtml"
                class="html-content analysis"
                v-html="question.analysisHtml"
              ></div>
            </el-collapse-item>
          </el-collapse>
        </section>
      </div>
    </el-skeleton>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPracticeResult } from '@/api/practice'
import { ATTEMPT_STATUS, QUESTION_TYPES, labelOf, tagOf } from '@/utils/dictionaries'
import { formatDateTime, formatDuration, parseAnswerArray } from '@/utils/helpers'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const attempt = ref(null)

const descriptionColumns = computed(() => (window.innerWidth < 720 ? 1 : 3))

const displayAnswerValues = (value, fallback) => {
  const values = parseAnswerArray(value)
  return values.length ? values.join('，') : '未作答'
}

const displayAnswer = (question) => displayAnswerValues(question.answer?.userAnswerJson, '未作答')

const displayCorrectAnswer = (question) => {
  const values = parseAnswerArray(question.answersJson)
  return values.length ? values.join('，') : '-'
}

onMounted(async () => {
  loading.value = true
  try {
    attempt.value = await getPracticeResult(route.params.id)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.question-results h2 {
  margin: 0 0 14px;
  font-size: 18px;
}

.result-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.question-stem,
.analysis {
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.answer-line {
  color: #475569;
}
</style>
