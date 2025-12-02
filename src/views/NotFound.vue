<template>
  <div class="not-found">
    <van-empty description="页面不存在">
      <van-button type="primary" @click="goHome">返回首页</van-button>
    </van-empty>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/courses')
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
</style>
