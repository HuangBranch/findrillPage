<template>
  <div class="page">
    <section class="surface">
      <el-result icon="success" title="账号可用" sub-title="账号状态正常，可以继续学习和练习。">
        <template #extra>
          <el-button type="primary" @click="$router.push('/courses')">返回学习中心</el-button>
        </template>
      </el-result>
    </section>
  </div>
</template>
