<template>
  <div class="page">
    <section class="surface profile-head">
      <div class="profile-head__main">
        <el-avatar :size="72" :src="authStore.userInfo?.avatar">{{ authStore.userInfo?.name?.slice(0, 1) }}</el-avatar>
        <div>
          <h2>{{ authStore.userInfo?.name || '-' }}</h2>
          <p>{{ authStore.userInfo?.userId }} · {{ authStore.userInfo?.roleName || '普通用户' }}</p>
        </div>
      </div>
      <el-button class="profile-head__edit" @click="$router.push('/profile/edit')">编辑资料</el-button>
    </section>

    <div class="metric-grid">
      <div class="metric">
        <div class="metric__value">{{ history.length }}</div>
        <div class="metric__label">练习次数</div>
      </div>
    </div>

    <section class="surface">
      <div class="profile-links">
        <el-button class="profile-action" @click="$router.push('/profile/practice-records')">练习记录</el-button>
        <el-button class="profile-action" @click="$router.push('/wrong')">错题复习</el-button>
        <el-button v-if="authStore.isAdmin" class="profile-action" @click="$router.push('/admin/dashboard')">进入后台</el-button>
        <el-button class="profile-action profile-action--danger" type="danger" plain @click="handleLogout">退出登录</el-button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPracticeHistory } from '@/api/practice'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'

const router = useRouter()
const authStore = useAuthStore()
const menuStore = useMenuStore()
const history = ref([])

onMounted(async () => {
  await authStore.refreshUser()
  history.value = await getPracticeHistory()
})

const handleLogout = async () => {
  await authStore.logout()
  menuStore.clearMenus()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.profile-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
}

.profile-head__main {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.profile-head__main div {
  min-width: 0;
}

.profile-head h2 {
  margin: 0;
}

.profile-head p {
  margin: 6px 0 0;
  color: #64748b;
}

.profile-links {
  display: grid;
  gap: 12px;
}

.profile-action {
  width: 100%;
  margin-left: 0;
  justify-content: center;
}

.profile-links :deep(.el-button + .el-button) {
  margin-left: 0;
}

.profile-action--danger {
  color: #ef4444;
}

.profile-head__edit {
  justify-self: end;
  white-space: nowrap;
}
</style>
