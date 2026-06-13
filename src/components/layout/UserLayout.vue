<template>
  <div class="user-layout">
    <header class="mobile-topbar">
      <button class="brand" type="button" @click="router.push('/courses')">
        <el-icon><Reading /></el-icon>
        <span>Findrill</span>
      </button>
      <div class="top-actions">
        <el-button v-if="authStore.isAdmin" text bg type="primary" @click="router.push('/admin/dashboard')">
          后台
        </el-button>
        <el-dropdown trigger="click">
          <el-avatar :size="34" :src="authStore.userInfo?.avatar">
            {{ (authStore.userInfo?.name || 'U').slice(0, 1) }}
          </el-avatar>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push('/profile')">个人中心</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="user-main">
      <router-view />
    </main>

    <BottomNav />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Reading } from '@element-plus/icons-vue'
import BottomNav from '@/components/BottomNav.vue'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'

const router = useRouter()
const authStore = useAuthStore()
const menuStore = useMenuStore()

const handleLogout = async () => {
  await authStore.logout()
  menuStore.clearMenus()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>
