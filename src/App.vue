<template>
  <div id="app">
    <div class="app-container">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { cleanExpiredProgress } from '@/utils/storage'

// 应用启动时清理过期的答题进度
onMounted(() => {
  cleanExpiredProgress()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  font-size: 16px;
}

#app {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.app-container {
  width: 100%;
  min-height: 100vh;
}

/* 响应式字体大小 */
@media (max-width: 767px) {
  html {
    font-size: 14px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  html {
    font-size: 15px;
  }
}

@media (min-width: 1024px) {
  html {
    font-size: 16px;
  }
}
</style>
