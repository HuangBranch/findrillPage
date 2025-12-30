<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Logo 区域 -->
      <div class="login-header">
        <div class="logo-circle">
          <el-icon :size="45"><Document /></el-icon>
        </div>
        <h1 class="system-title">学生在线学习系统</h1>
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

        <div class="login-footer">
          <div class="login-tips">
            <el-icon><InfoFilled /></el-icon>
            <span>首次登录需验证邮箱</span>
          </div>
          <div class="forgot-password">
            <el-link 
              type="primary" 
              @click="resetDialogVisible = true"
              class="forgot-link"
            >
              忘记密码？
            </el-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 忘记密码对话框 -->
    <el-dialog
      v-model="resetDialogVisible"
      title="重置密码"
      width="90%"
      :style="{ maxWidth: '450px' }"
      @close="resetFormRef?.resetFields()"
    >
      <el-form 
        ref="resetFormRef" 
        :model="resetForm" 
        :rules="resetRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="user">
          <el-input
            v-model="resetForm.user"
            placeholder="请输入用户名"
            clearable
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="resetForm.email"
            placeholder="请输入邮箱地址"
            clearable
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-alert
          title="系统将把重置后的密码发送到您的邮箱"
          type="info"
          :closable="false"
          show-icon
        />
      </el-form>

      <template #footer>
        <el-button @click="resetDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="resetLoading"
          @click="handleResetPassword"
        >
          重置密码
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { checkEmailStatus, resetPassword } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { Document, User, Lock, InfoFilled, Message } from '@element-plus/icons-vue'

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
const resetDialogVisible = ref(false)
const resetLoading = ref(false)
const resetFormRef = ref()
const resetForm = reactive({
  email: '',
  user: ''
})

const resetRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  user: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ]
}

const handleResetPassword = async () => {
  await resetFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    resetLoading.value = true
    
    try {
      await resetPassword(resetForm.email, resetForm.user)
      ElMessage.success('密码重置成功，新密码已发送到您的邮箱')
      resetDialogVisible.value = false
      // 清空表单
      resetForm.email = ''
      resetForm.user = ''
    } catch (error) {
      console.error('密码重置错误：', error)
      ElMessage.error(error.message || '密码重置失败，请检查邮箱和用户名是否正确')
    } finally {
      resetLoading.value = false
    }
  })
}

const onSubmit = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    
    try {
      // 1. 先登录获取用户信息
      const result = await authStore.login(form)
      
      if (result.success) {
        // 2. 调用检测接口判断邮箱是否已认证
        const encryptedPassword = authStore.digestMessage(form.password)
        const checkResult = await checkEmailStatus(form.user, encryptedPassword)
        
        // 更新本地邮箱验证状态（与后端保持同步）
        authStore.setEmailVerified(checkResult === true)
        
        if (checkResult === true) {
          // 邮箱已认证，后端已设置 sa-token cookie
          ElMessage.success('登录成功')
          const redirect = route.query.redirect || '/courses'
          router.push(redirect)
        } else {
          // 邮箱未认证，需要验证邮箱
          // 保存临时凭证用于发送邮件和轮询
          sessionStorage.setItem('pendingAuth', JSON.stringify({
            user: form.user,
            password: encryptedPassword,
            email: result.data.email
          }))
          
          ElMessage.warning('请先验证邮箱')
          router.push('/email-verify')
        }
      } else {
        ElMessage.error(result.error || '登录失败')
      }
    } catch (error) {
      console.error('登录错误：', error)
      ElMessage.error(error.message || '登录失败，请重试')
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
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  /* 确保背景铺满 */
  margin: 0;
  padding: 0;
}

.login-container {
  width: 90%;
  max-width: 450px;
}

.login-header {
  text-align: center;
  margin-bottom: 1.5rem;
  color: white;
}

.logo-circle {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.system-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.1em;
}

.system-subtitle {
  font-size: 0.875rem;
  opacity: 0.95;
  letter-spacing: 0.05em;
}

.login-form-card {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 1.5rem;
  padding: 2rem 2rem 1.5rem;
  box-shadow: 
    0 8px 32px rgba(102, 126, 234, 0.4),
    0 4px 16px rgba(118, 75, 162, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.form-title {
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.login-button {
  width: 100%;
  height: 2.5rem;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.login-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.login-tips {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
}

.forgot-password {
  flex-shrink: 0;
}

.forgot-link {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 0.875rem;
  text-decoration: none;
}

.forgot-link:hover {
  color: #fff !important;
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
  .login-page {
    /* iOS Safari 100vh修复 */
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100vh;
    height: -webkit-fill-available;
    min-height: 100vh;
    min-height: -webkit-fill-available;
    /* 确保flex居中 */
    display: flex;
    align-items: center;
    justify-content: center;
    /* 确保背景铺满，去除padding */
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .login-container {
    width: 88%;
    max-width: 380px;
    margin: 0;
    /* 防止内容溢出 */
    flex-shrink: 0;
  }
  
  .login-header {
    margin-bottom: 1rem;
  }
  
  .logo-circle {
    width: 3.5rem;
    height: 3.5rem;
    margin-bottom: 0.75rem;
  }
  
  .system-title {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }
  
  .system-subtitle {
    font-size: 0.8rem;
  }
  
  .login-form-card {
    padding: 1.5rem 1.25rem 1.25rem;
  }
  
  .form-title {
    font-size: 1.1rem;
    margin-bottom: 1.25rem;
  }
  
  .login-button {
    height: 2.5rem;
  }
}

/* 平板和PC端 >= 768px */
@media (min-width: 768px) {
  .login-container {
    max-width: 420px;
  }
  
  .logo-circle {
    width: 4.5rem;
    height: 4.5rem;
  }
  
  .system-title {
    font-size: 1.75rem;
  }
  
  .login-form-card {
    padding: 2rem;
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
    max-width: 450px;
  }
  
  .logo-circle {
    width: 5rem;
    height: 5rem;
  }
  
  .system-title {
    font-size: 2rem;
  }
  
  .system-subtitle {
    font-size: 1rem;
  }
  
  .login-form-card {
    padding: 2.5rem;
  }
  
  .form-title {
    font-size: 1.5rem;
  }
}
</style>
