<template>
  <div class="page">
    <section class="surface">
      <el-result icon="success" title="账号可用" sub-title="当前后端注册后会直接激活邮箱状态，可以继续学习和考试。">
        <template #extra>
          <el-button type="primary" @click="$router.push('/courses')">返回学习中心</el-button>
        </template>
      </el-result>
    </section>
  </div>
</template>
