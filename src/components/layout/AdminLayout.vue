<template>
  <div class="admin-layout">
    <header class="admin-header">
      <div class="admin-title">
        <el-button text circle @click="drawerVisible = true">
          <el-icon><Menu /></el-icon>
        </el-button>
        <strong>管理后台</strong>
      </div>
      <div class="admin-actions">
        <el-button text @click="router.push('/courses')">前台</el-button>
        <el-dropdown trigger="click">
          <span class="admin-user">{{ authStore.userInfo?.name || '管理员' }}</span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push('/profile')">个人资料</el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="admin-body">
      <aside class="admin-sidebar">
        <el-menu :default-active="route.path" router>
          <el-menu-item v-for="menu in menuStore.menus" :key="menu.path" :index="menu.path">
            <el-icon><component :is="iconMap[menu.meta?.icon] || Grid" /></el-icon>
            <span>{{ menu.meta?.title || menu.name }}</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <main class="admin-main">
        <router-view />
      </main>
    </div>

    <el-drawer v-model="drawerVisible" direction="ltr" size="280px" title="管理菜单">
      <el-menu :default-active="route.path" router @select="drawerVisible = false">
        <el-menu-item v-for="menu in menuStore.menus" :key="menu.path" :index="menu.path">
          <el-icon><component :is="iconMap[menu.meta?.icon] || Grid" /></el-icon>
          <span>{{ menu.meta?.title || menu.name }}</span>
        </el-menu-item>
      </el-menu>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Avatar,
  DataAnalysis,
  Document,
  Flag,
  Grid,
  Menu,
  Notebook,
  Reading,
  Upload,
  User
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const menuStore = useMenuStore()
const drawerVisible = ref(false)

const iconMap = {
  Avatar,
  DataAnalysis,
  Document,
  Flag,
  Grid,
  Menu,
  Notebook,
  Reading,
  Upload,
  User
}

onMounted(() => {
  menuStore.loadMenus()
})

const handleLogout = async () => {
  await authStore.logout()
  menuStore.clearMenus()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>
