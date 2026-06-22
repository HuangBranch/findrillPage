<template>
  <div class="auth-page">
    <section class="auth-panel">
      <div class="auth-copy">
        <h1>Findrill</h1>
        <p>自主练习、错题复习和后台题库维护都在这里完成。</p>
      </div>

      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-position="top" @submit.prevent>
        <el-form-item label="账号" prop="account">
          <el-input v-model.trim="loginForm.account" size="large" autocomplete="username" placeholder="请输入登录账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            size="large"
            type="password"
            autocomplete="current-password"
            show-password
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button class="full-button" type="primary" size="large" :loading="authStore.loading" @click="handleLogin">
          登录
        </el-button>
      </el-form>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref()

const loginForm = reactive({
  account: '',
  password: ''
})

const loginRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const redirectAfterAuth = () => {
  router.replace(route.query.redirect || '/courses')
}

const handleLogin = async () => {
  await loginFormRef.value.validate()
  await authStore.login(loginForm)
  ElMessage.success('登录成功')
  redirectAfterAuth()
}
</script>

<style scoped>
.auth-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background:
    linear-gradient(120deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.12)),
    #f8fafc;
}

.auth-panel {
  width: min(940px, 100%);
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 28px;
  align-items: center;
  padding: 28px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
}

.auth-copy h1 {
  margin: 0 0 12px;
  color: #111827;
  font-size: 42px;
  letter-spacing: 0;
}

.auth-copy p {
  max-width: 360px;
  margin: 0;
  color: #64748b;
  font-size: 16px;
}

.full-button {
  width: 100%;
}

@media (max-width: 760px) {
  .auth-page {
    padding: 14px;
  }

  .auth-panel {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .auth-copy h1 {
    font-size: 32px;
  }
}
</style>
