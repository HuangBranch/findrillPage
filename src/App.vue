<template>
  <el-config-provider :message="messageConfig">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import { onMounted } from 'vue'
import { cleanExpiredProgress } from '@/utils/storage'

const messageConfig = {
  offset: 56
}

onMounted(() => {
  cleanExpiredProgress()
})
</script>
