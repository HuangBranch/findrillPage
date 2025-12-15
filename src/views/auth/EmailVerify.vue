<template>
  <div class="email-verify-page">
    <div class="verify-container">
      <!-- 返回按钮 -->
      <div class="back-btn">
        <el-button @click="handleBack" circle>
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
          <p class="info-label">验证链接将发送至</p>
          <p class="email-address">{{ maskedEmail }}</p>
        </div>

        <!-- 发送状态提示 -->
        <div v-if="emailSent" class="success-tip">
          <el-icon><CircleCheck /></el-icon>
          <div class="tip-content">
            <p class="tip-title">验证链接已发送</p>
            <p class="tip-desc">请前往邮箱点击验证链接完成验证</p>
          </div>
        </div>

        <!-- 发送按钮 -->
        <el-button
          v-if="!emailSent"
          type="primary"
          size="large"
          :loading="sending"
          @click="sendVerificationLink"
          class="send-link-btn"
        >
          <el-icon><Promotion /></el-icon>
          <span>发送验证链接</span>
        </el-button>

        <!-- 重新发送按钮 -->
        <el-button
          v-else
          size="large"
          :disabled="countdown > 0"
          :loading="sending"
          @click="sendVerificationLink"
          class="resend-btn"
        >
          <el-icon><RefreshRight /></el-icon>
          <span>{{ countdown > 0 ? `${countdown}秒后可重新发送` : '重新发送' }}</span>
        </el-button>

        <!-- 提示信息 -->
        <div class="verify-tips">
          <el-divider content-position="center">
            <span class="tips-title">验证说明</span>
          </el-divider>
          <div class="tips-list">
            <div class="tip-item">
              <el-icon><Link /></el-icon>
              <span>验证链接 10 分钟内有效</span>
            </div>
            <div class="tip-item">
              <el-icon><ChatDotSquare /></el-icon>
              <span>请检查邮箱垃圾箱</span>
            </div>
            <div class="tip-item">
              <el-icon><Clock /></el-icon>
              <span>60秒后可重新请求发送</span>
            </div>
            <div class="tip-item">
              <el-icon><InfoFilled /></el-icon>
              <span>验证后才能使用系统功能</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, Message, ChatDotSquare, Clock, Link, InfoFilled,
  CircleCheck, Promotion, RefreshRight
} from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()

const emailSent = ref(false)
const countdown = ref(0)
const sending = ref(false)
const isDev = import.meta.env.DEV

// 用于防止短时间内多次请求的localStorage key
const LAST_SEND_TIME_KEY = 'email_verify_last_send_time'
const SEND_COOLDOWN = 60 * 1000 // 60秒冷却时间

// 脱敏邮箱
const maskedEmail = computed(() => {
  const email = authStore.userInfo?.email || 'test@example.com'
  const [name, domain] = email.split('@')
  if (name.length <= 2) return email
  return name.substring(0, 2) + '***@' + domain
})

// 检查冷却时间
const checkCooldown = () => {
  const lastSendTime = localStorage.getItem(LAST_SEND_TIME_KEY)
  if (!lastSendTime) return true
  
  const elapsed = Date.now() - parseInt(lastSendTime)
  if (elapsed < SEND_COOLDOWN) {
    const remaining = Math.ceil((SEND_COOLDOWN - elapsed) / 1000)
    countdown.value = remaining
    startCountdown()
    return false
  }
  
  return true
}

// 开始倒计时
const startCountdown = () => {
  if (countdown.value <= 0) return
  
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

// 发送验证链接
const sendVerificationLink = async () => {
  // 检查冷却时间
  if (!checkCooldown()) {
    ElMessage.warning(`请等待 ${countdown.value} 秒后再发送`)
    return
  }

  sending.value = true
  
  try {
    // TODO: 调用后端 API 发送验证链接
    // await sendEmailVerificationLink()
    
    // 模拟发送
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 记录发送时间
    localStorage.setItem(LAST_SEND_TIME_KEY, Date.now().toString())
    
    emailSent.value = true
    countdown.value = 60
    startCountdown()
    
    ElMessage.success({
      message: '验证链接已发送到您的邮箱，请查收',
      duration: 3000
    })
    
    // 开发环境提示
    if (isDev) {
      setTimeout(() => {
        ElMessage.info({
          message: '开发环境：验证链接示例 https://xxx.com/verify-email?token=xxxxx',
          duration: 5000,
          showClose: true
        })
      }, 1000)
    }
  } catch (error) {
    ElMessage.error(error.message || '发送失败，请稍后重试')
  } finally {
    sending.value = false
  }
}


// 返回处理
const handleBack = async () => {
  try {
    await ElMessageBox.confirm(
      '邮箱验证后才能使用系统功能，确定要退出吗？',
      '提示',
      {
        confirmButtonText: '退出登录',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    authStore.logout()
    router.push('/login')
  } catch {
    // 取消操作
  }
}
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

.success-tip {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(103, 194, 58, 0.2);
  border: 1px solid rgba(103, 194, 58, 0.4);
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  color: white;
}

.success-tip .el-icon {
  font-size: 2rem;
  color: #67c23a;
  flex-shrink: 0;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.tip-desc {
  font-size: 0.875rem;
  opacity: 0.9;
}

.send-link-btn,
.resend-btn {
  width: 100%;
  height: 3rem;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.send-link-btn .el-icon,
.resend-btn .el-icon {
  margin-right: 0.5rem;
}

.resend-btn:disabled {
  opacity: 0.6;
}

.dev-actions {
  margin-top: 1.5rem;
  padding-top: 1rem;
}

.dev-actions .el-divider {
  border-color: rgba(255, 255, 255, 0.3);
  margin: 1rem 0;
}

.dev-actions .el-button {
  width: 100%;
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
  
  .success-tip {
    flex-direction: column;
    text-align: center;
  }
  
  .success-tip .el-icon {
    font-size: 2.5rem;
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
