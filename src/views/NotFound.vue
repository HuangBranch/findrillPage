<template>
  <div class="not-found">
    <el-result icon="warning" title="页面不存在" sub-title="当前地址没有对应的页面。">
      <template #extra>
        <el-button type="primary" @click="$router.push('/courses')">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 18px;
}
</style>
