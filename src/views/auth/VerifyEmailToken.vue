<template>
  <div class="auth-page">
    <section class="surface token-panel">
      <el-result icon="info" title="邮箱验证入口已保留" sub-title="当前后端没有暴露邮箱 token 验证接口，账号资料可在个人中心维护。">
        <template #extra>
          <el-button type="primary" @click="$router.push('/courses')">进入系统</el-button>
        </template>
      </el-result>
    </section>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 18px;
}

.token-panel {
  width: min(520px, 100%);
}
</style>
