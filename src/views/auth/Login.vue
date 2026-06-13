<template>
  <div class="auth-page">
    <section class="auth-panel">
      <div class="auth-copy">
        <h1>Findrill</h1>
        <p>练习、考试、错题复习和后台题库维护都在这里完成。</p>
      </div>

      <el-tabs v-model="activeTab" stretch>
        <el-tab-pane label="登录" name="login">
          <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-position="top" @submit.prevent>
            <el-form-item label="账号" prop="user">
              <el-input v-model.trim="loginForm.user" size="large" autocomplete="username" placeholder="请输入用户编码" />
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
        </el-tab-pane>

        <el-tab-pane label="注册" name="register">
          <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-position="top" @submit.prevent>
            <div class="form-grid">
              <el-form-item label="用户编码" prop="userId">
                <el-input v-model.trim="registerForm.userId" placeholder="如 stu001" />
              </el-form-item>
              <el-form-item label="昵称" prop="name">
                <el-input v-model.trim="registerForm.name" placeholder="用于页面展示" />
              </el-form-item>
            </div>
            <el-form-item label="密码" prop="password">
              <el-input v-model="registerForm.password" type="password" show-password placeholder="至少 6 位" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model.trim="registerForm.email" placeholder="用于找回和通知" />
            </el-form-item>
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model.trim="registerForm.realName" placeholder="可选" />
            </el-form-item>
            <el-button class="full-button" type="primary" :loading="registering" @click="handleRegister">
              创建账号
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
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

const activeTab = ref('login')
const registering = ref(false)
const loginFormRef = ref()
const registerFormRef = ref()

const loginForm = reactive({
  user: '',
  password: ''
})

const registerForm = reactive({
  userId: '',
  name: '',
  password: '',
  email: '',
  realName: ''
})

const loginRules = {
  user: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const registerRules = {
  userId: [{ required: true, message: '请输入用户编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [{ required: true, min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
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

const handleRegister = async () => {
  await registerFormRef.value.validate()
  registering.value = true
  try {
    await authStore.register(registerForm)
    ElMessage.success('注册成功，请登录')
    loginForm.user = registerForm.userId
    loginForm.password = ''
    activeTab.value = 'login'
  } finally {
    registering.value = false
  }
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

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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

  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
