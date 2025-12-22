<template>
  <div class="verify-token-page">
    <div class="verify-container">
      <div class="verify-content">
        <!-- 加载状态 -->
        <div v-if="verifying" class="status-box loading">
          <div class="loading-icon">
            <el-icon :size="80" class="rotating"><Loading /></el-icon>
          </div>
          <h2>正在验证...</h2>
          <p>请稍候</p>
        </div>

        <!-- 成功状态 -->
        <div v-else-if="status === 'success'" class="status-box success">
          <div class="status-icon">
            <el-icon :size="80" color="#67c23a"><CircleCheck /></el-icon>
          </div>
          <h2>验证成功！</h2>
          <p>您的邮箱已验证完成，可以关闭此页面</p>
          <el-button type="primary" size="large" @click="closePage">
            关闭页面
          </el-button>
        </div>

        <!-- 失败状态 -->
        <div v-else-if="status === 'error'" class="status-box error">
          <div class="status-icon">
            <el-icon :size="80" color="#f56c6c"><CircleClose /></el-icon>
          </div>
          <h2>验证失败</h2>
          <p class="error-message">{{ errorMessage }}</p>
          <div class="error-tips">
            <div v-if="errorType === 'expired'" class="tip-item">
              <el-icon><Clock /></el-icon>
              <span>链接已过期，请重新发送验证链接</span>
            </div>
            <div v-else-if="errorType === 'used'" class="tip-item">
              <el-icon><Check /></el-icon>
              <span>链接已使用，请直接登录</span>
            </div>
            <div v-else-if="errorType === 'invalid'" class="tip-item">
              <el-icon><WarningFilled /></el-icon>
              <span>链接无效，请确认链接是否正确</span>
            </div>
          </div>
          <div class="error-actions">
            <el-button type="primary" @click="goToLogin">
              返回登录
            </el-button>
            <el-button @click="goToEmailVerify" v-if="errorType === 'expired'">
              重新发送验证链接
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { 
  Loading, CircleCheck, CircleClose, 
  Clock, Check, WarningFilled 
} from '@element-plus/icons-vue'
import { verifyEmailByToken } from '@/api/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const verifying = ref(true)
const status = ref('') // 'success' | 'error'
const errorMessage = ref('')
const errorType = ref('') // 'expired' | 'used' | 'invalid'
const countdown = ref(3)

// 验证 token
const verifyToken = async () => {
  const token = route.query.token

  if (!token) {
    status.value = 'error'
    errorMessage.value = '缺少验证参数'
    errorType.value = 'invalid'
    verifying.value = false
    return
  }

  try {
    // 调用后端 API 验证 token
    const result = await verifyEmailByToken(token)
    
    if (result === true) {
      // 验证成功
      status.value = 'success'
      
      // 更新用户邮箱验证状态
      authStore.setEmailVerified(true)
    } else {
      throw new Error('验证失败')
    }
  } catch (error) {
    // 验证失败
    status.value = 'error'
    errorMessage.value = error.message || '验证失败，请重试'
    errorType.value = 'invalid'
    
    console.error('Token 验证失败：', error)
  } finally {
    verifying.value = false
  }
}

// 关闭页面
const closePage = () => {
  // 尝试关闭窗口
  window.close()
  // 如果无法关闭（不是通过脚本打开的窗口），则跳转到登录页
  setTimeout(() => {
    router.push('/login')
  }, 100)
}

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}

// 跳转到邮箱验证页
const goToEmailVerify = () => {
  router.push('/email-verify')
}

onMounted(() => {
  verifyToken()
})
</script>

<style scoped>
.verify-token-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.verify-container {
  width: 100%;
  max-width: 500px;
}

.verify-content {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: saturate(180%) blur(20px);
  border-radius: 1.5rem;
  padding: 3rem 2rem;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.4);
  text-align: center;
}

.status-box {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-icon {
  margin-bottom: 1.5rem;
}

.rotating {
  animation: rotate 1.5s linear infinite;
  color: white;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.status-icon {
  margin-bottom: 1.5rem;
  animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.status-box h2 {
  font-size: 1.75rem;
  color: white;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.status-box p {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1.5rem;
}

.countdown-text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
}

.error-message {
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.125rem;
}

.error-tips {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 0.75rem;
  padding: 1rem;
  margin: 1.5rem 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  padding: 0.5rem;
}

.tip-item .el-icon {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.8);
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-actions .el-button {
  min-width: 120px;
}

.status-box.success .el-button {
  width: 100%;
  max-width: 300px;
}

/* 响应式设计 */
@media (max-width: 767px) {
  .verify-content {
    padding: 2rem 1.5rem;
  }

  .status-box h2 {
    font-size: 1.5rem;
  }

  .error-actions {
    flex-direction: column;
    width: 100%;
  }

  .error-actions .el-button {
    width: 100%;
  }
}
</style>
