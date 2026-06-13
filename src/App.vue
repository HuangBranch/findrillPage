<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { cleanExpiredProgress } from '@/utils/storage'

onMounted(() => {
  cleanExpiredProgress()
})
</script>
