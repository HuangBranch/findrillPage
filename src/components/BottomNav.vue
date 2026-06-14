<template>
  <nav class="bottom-nav">
    <button
      v-for="item in items"
      :key="item.path"
      type="button"
      class="bottom-nav__item"
      :class="{ active: isActive(item) }"
      @click="router.push(item.path)"
    >
      <el-icon><component :is="item.icon" /></el-icon>
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { Collection, User } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const items = [
  { label: '课程', path: '/courses', icon: Collection },
  { label: '我的', path: '/profile', icon: User }
]

const isActive = (item) => route.path === item.path || route.path.startsWith(`${item.path}/`)
</script>
