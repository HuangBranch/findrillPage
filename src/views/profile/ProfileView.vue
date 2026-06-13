<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">我的</h1>
        <p class="page-subtitle">个人资料、自主练习状态和错题复习。</p>
      </div>
      <div class="toolbar">
        <el-button @click="$router.push('/profile/edit')">编辑资料</el-button>
        <el-button v-if="authStore.isAdmin" type="primary" @click="$router.push('/admin/dashboard')">进入后台</el-button>
      </div>
    </div>

    <section class="surface profile-head">
      <el-avatar :size="72" :src="authStore.userInfo?.avatar">{{ authStore.userInfo?.name?.slice(0, 1) }}</el-avatar>
      <div>
        <h2>{{ authStore.userInfo?.name || '-' }}</h2>
        <p>{{ authStore.userInfo?.userId }} · {{ authStore.userInfo?.roleName || '普通用户' }}</p>
      </div>
    </section>

    <div class="metric-grid">
      <div class="metric">
        <div class="metric__value">{{ history.length }}</div>
        <div class="metric__label">练习次数</div>
      </div>
      <div class="metric">
        <div class="metric__value">{{ submittedCount }}</div>
        <div class="metric__label">已提交</div>
      </div>
      <div class="metric">
        <div class="metric__value">{{ avgScore }}</div>
        <div class="metric__label">平均得分</div>
      </div>
    </div>

    <section class="surface">
      <div class="toolbar profile-links">
        <el-button @click="$router.push('/profile/practice-records')">练习记录</el-button>
        <el-button @click="$router.push('/wrong')">错题复习</el-button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getPracticeHistory } from '@/api/practice'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const history = ref([])

const submittedCount = computed(() => history.value.filter((item) => item.status === 2).length)
const avgScore = computed(() => {
  const scores = history.value.map((item) => Number(item.earnedScore)).filter((item) => !Number.isNaN(item))
  if (!scores.length) return '-'
  return Math.round(scores.reduce((sum, item) => sum + item, 0) / scores.length)
})

onMounted(async () => {
  await authStore.refreshUser()
  history.value = await getPracticeHistory()
})
</script>

<style scoped>
.profile-head {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-head h2 {
  margin: 0;
}

.profile-head p {
  margin: 6px 0 0;
  color: #64748b;
}

.profile-links {
  justify-content: center;
}
</style>
