<template>
  <AttemptWorkspace :mode="mode" :title="title" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AttemptWorkspace from '@/components/AttemptWorkspace.vue'

const route = useRoute()
const mode = computed(() => (route.params.attemptId ? undefined : 2))
const title = computed(() => (route.params.attemptId ? '答题工作台' : '正式考试'))
</script>
