<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Logo 区域 -->
      <div class="login-header">
        <div class="logo-circle">
          <el-icon :size="60"><Document /></el-icon>
        </div>
        <h1 class="system-title">刷题系统</h1>
        <p class="system-subtitle">专注于高效学习</p>
      </div>

      <!-- 登录表单 -->
      <div class="login-form-card">
        <h2 class="form-title">欢迎登录</h2>
        
        <el-form 
          ref="formRef" 
          :model="form" 
          :rules="rules"
          @submit.prevent="onSubmit"
          size="large"
        >
          <el-form-item prop="user">
            <el-input
              v-model="form.user"
              placeholder="请输入用户名"
              clearable
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
              clearable
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              native-type="submit"
              :loading="loading"
              class="login-button"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-tips">
          <el-icon><InfoFilled /></el-icon>
          <span>首次登录需验证邮箱</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { Document, User, Lock, InfoFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const formRef = ref()

const form = reactive({
  user: '',
  password: ''
})

const rules = {
  user: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const loading = ref(false)

const onSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    
    try {
      const result = await authStore.login(form)
      
      if (result.success) {
        ElMessage.success('登录成功')
        // 检查邮箱是否验证
        if (!authStore.isEmailVerified) {
          router.push('/email-verify')

        } else {
          // 跳转到原来要访问的页面或首页
          const redirect = route.query.redirect || '/courses'
          router.push(redirect)
        }
      } else {
        // result.error 现在是字符串（来自 catch 中的 error.message）
        ElMessage.error(result.error || '登录失败')
      }
    } catch (error) {
      console.error('登录错误：', error)
      ElMessage.error('登录失败，请重试')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.login-container {
  width: 90%;
  max-width: 450px;
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
  color: white;
}

.logo-circle {
  width: 5rem;
  height: 5rem;
  margin: 0 auto 1.5rem;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.system-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.1em;
}

.system-subtitle {
  font-size: 1rem;
  opacity: 0.95;
  letter-spacing: 0.05em;
}

.login-form-card {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 1.5rem;
  padding: 2.5rem;
  box-shadow: 
    0 8px 32px rgba(102, 126, 234, 0.4),
    0 4px 16px rgba(118, 75, 162, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 2rem;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.login-button {
  width: 100%;
  height: 3rem;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.login-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}

/* Element Plus 输入框样式优化 */
.login-form-card :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3) inset;
}

.login-form-card :deep(.el-input__wrapper:hover),
.login-form-card :deep(.el-input__wrapper.is-focus) {
  background-color: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.login-form-card :deep(.el-input__inner) {
  color: #303133;
  font-size: 16px;
}

.login-form-card :deep(.el-input__inner::placeholder) {
  color: rgba(0, 0, 0, 0.4);
}

/* 移动端 < 768px */
@media (max-width: 767px) {
  .login-container {
    width: 90%;
    max-width: 380px;
  }
  
  .logo-circle {
    width: 4rem;
    height: 4rem;
  }
  
  .system-title {
    font-size: 1.75rem;
  }
  
  .system-subtitle {
    font-size: 0.875rem;
  }
  
  .login-form-card {
    padding: 2rem 1.5rem;
  }
  
  .form-title {
    font-size: 1.25rem;
  }
  
  .login-button {
    height: 2.75rem;
  }
}

/* 平板和PC端 >= 768px */
@media (min-width: 768px) {
  .login-container {
    max-width: 480px;
  }
  
  .logo-circle {
    width: 6rem;
    height: 6rem;
  }
  
  .system-title {
    font-size: 2.5rem;
  }
  
  .login-form-card {
    padding: 3rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .login-form-card:hover {
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
    transform: translateY(-4px);
  }
}

/* 大屏 PC >= 1440px */
@media (min-width: 1440px) {
  .login-container {
    max-width: 520px;
  }
  
  .logo-circle {
    width: 7rem;
    height: 7rem;
  }
  
  .system-title {
    font-size: 3rem;
  }
  
  .system-subtitle {
    font-size: 1.125rem;
  }
  
  .login-form-card {
    padding: 3.5rem;
  }
  
  .form-title {
    font-size: 1.75rem;
  }
}
</style>
