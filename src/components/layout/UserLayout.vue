<template>
  <div class="user-layout" :class="{ 'user-layout--no-bottom-nav': !showBottomNav }">
    <header class="mobile-topbar mobile-topbar--titled">
      <div v-if="showBackButton" class="topbar-left">
        <button class="top-back" type="button" aria-label="上一页" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </button>
      </div>
      <h1 class="topbar-title">{{ topbarTitle }}</h1>
    </header>

    <main class="user-main">
      <router-view />
    </main>

    <BottomNav v-if="showBottomNav" />
  </div>
</template>

<script setup>
import { computed, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import BottomNav from '@/components/BottomNav.vue'

const route = useRoute()
const router = useRouter()
const customTopbarTitle = ref('')

const showBottomNav = computed(() => !route.meta?.hideBottomNav)
const showBackButton = computed(() => true)
const topbarTitle = computed(() => customTopbarTitle.value || route.meta?.title || 'Findrill')

provide('setTopbarTitle', (value = '') => {
  customTopbarTitle.value = value
})

watch(
  () => route.fullPath,
  () => {
    customTopbarTitle.value = ''
  }
)

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/courses')
}
</script>
