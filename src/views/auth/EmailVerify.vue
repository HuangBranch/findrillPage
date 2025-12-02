<template>
  <div class="email-verify-page">
    <div class="verify-container">
      <!-- 返回按钮 -->
      <div class="back-btn">
        <el-button @click="router.back()" circle>
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
      </div>

      <!-- 邮箱图标 -->
      <div class="verify-header">
        <div class="email-icon">
          <el-icon :size="70"><Message /></el-icon>
        </div>
        <h1 class="verify-title">验证您的邮箱</h1>
        <p class="verify-subtitle">为了保障账号安全，请先验证邮箱</p>
      </div>

      <!-- 验证卡片 -->
      <div class="verify-card">
        <div class="email-info">
          <p class="info-label">验证码将发送至</p>
          <p class="email-address">{{ maskedEmail }}</p>
        </div>

        <!-- 验证码输入 -->
        <div class="code-input-group">
          <el-input
            v-model="verifyCode"
            placeholder="请输入6位验证码"
            maxlength="6"
            size="large"
            clearable
            @keyup.enter="handleVerify"
          >
            <template #prefix>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
          
          <el-button
            type="primary"
            size="large"
            :disabled="countdown > 0"
            :loading="sending"
            @click="sendCode"
            class="send-btn"
          >
            {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
          </el-button>
        </div>

        <!-- 验证按钮 -->
        <el-button
          type="primary"
          size="large"
          :loading="verifying"
          :disabled="verifyCode.length !== 6"
          @click="handleVerify"
          class="verify-button"
        >
          立即验证
        </el-button>

        <!-- 提示信息 -->
        <div class="verify-tips">
          <el-divider content-position="center">
            <span class="tips-title">未收到验证码？</span>
          </el-divider>
          <div class="tips-list">
            <div class="tip-item">
              <el-icon><ChatDotSquare /></el-icon>
              <span>请检查邮箱垃圾箱</span>
            </div>
            <div class="tip-item">
              <el-icon><Clock /></el-icon>
              <span>等待60秒后可重新发送</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { sendVerificationCode, verifyEmail } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Message, Key, ChatDotSquare, Clock } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const verifyCode = ref('')
const countdown = ref(0)
const sending = ref(false)
const verifying = ref(false)

// 脱敏邮箱
const maskedEmail = computed(() => {
  const email = authStore.userInfo?.email || 'test@example.com'
  const [name, domain] = email.split('@')
  if (name.length <= 2) return email
  return name.substring(0, 2) + '***@' + domain
})

// 发送验证码
const sendCode = async () => {
  sending.value = true
  
  try {
    await sendVerificationCode()
    ElMessage.success('验证码已发送到您的邮箱（测试码：123456）')
    
    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    ElMessage.error(error.message || '发送失败')
  } finally {
    sending.value = false
  }
}

// 验证邮箱
const handleVerify = async () => {
  if (verifyCode.value.length !== 6) {
    ElMessage.warning('请输入6位验证码')
    return
  }

  verifying.value = true
  
  try {
    await verifyEmail({ code: verifyCode.value })
    
    // 更新验证状态
    authStore.setEmailVerified(true)
    
    ElMessage.success('验证成功！')
    
    // 跳转到首页
    setTimeout(() => {
      router.push('/courses')
    }, 1000)
  } catch (error) {
    ElMessage.error(error.message || '验证失败')
    verifyCode.value = ''
  } finally {
    verifying.value = false
  }
}

// 页面加载时自动发送验证码
onMounted(() => {
  sendCode()
})
</script>

<style scoped>
.email-verify-page {
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
  overflow-y: auto;
}

.verify-container {
  width: 90%;
  max-width: 500px;
  position: relative;
}

.back-btn {
  position: absolute;
  top: -60px;
  left: 0;
}

.back-btn :deep(.el-button) {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
}

.back-btn :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.3);
}

.verify-header {
  text-align: center;
  margin-bottom: 2rem;
  color: white;
}

.email-icon {
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

.verify-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.verify-subtitle {
  font-size: 1rem;
  opacity: 0.95;
}

.verify-card {
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.email-info {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.info-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
}

.email-address {
  font-size: 1.125rem;
  color: white;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.code-input-group {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.code-input-group :deep(.el-input) {
  flex: 1;
}

.code-input-group :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3) inset;
}

.code-input-group :deep(.el-input__wrapper.is-focus) {
  background-color: rgba(255, 255, 255, 1);
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.code-input-group :deep(.el-input__inner) {
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-align: center;
}

.send-btn {
  flex-shrink: 0;
  min-width: 120px;
}

.verify-button {
  width: 100%;
  height: 3rem;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.verify-tips {
  margin-top: 2rem;
}

.tips-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  font-weight: 600;
}

.verify-tips :deep(.el-divider__text) {
  background: transparent;
}

.verify-tips :deep(.el-divider) {
  border-color: rgba(255, 255, 255, 0.3);
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
}

/* 移动端适配 */
@media (max-width: 767px) {
  .verify-container {
    width: 95%;
  }
  
  .verify-card {
    padding: 1.5rem;
  }
  
  .email-icon {
    width: 4rem;
    height: 4rem;
  }
  
  .verify-title {
    font-size: 1.5rem;
  }
  
  .code-input-group {
    flex-direction: column;
  }
  
  .send-btn {
    width: 100%;
    min-width: auto;
  }
}

/* PC端适配 */
@media (min-width: 768px) {
  .verify-card:hover {
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
    transform: translateY(-4px);
  }
  
  .email-icon {
    width: 6rem;
    height: 6rem;
  }
}
</style>
