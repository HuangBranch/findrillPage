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
        <h1 class="verify-title">验证您的邮箱</h1>
        <p class="verify-subtitle">为了保障账号安全，请先验证邮箱</p>
      </div>

      <!-- 验证卡片 -->
      <div class="verify-card">
        <!-- 绑定邮箱表单 -->
        <div class="bind-email-form">
          <div class="form-header">
            <div class="form-icon">
              <el-icon :size="50"><Message /></el-icon>
            </div>
            <h3>绑定邮箱</h3>
            <p>请先绑定您的邮箱地址</p>
          </div>
          
          <!-- 邮箱输入 -->
          <el-input
            v-if="!emailSent"
            v-model="inputEmail"
            size="large"
            placeholder="请输入邮箱地址"
            clearable
            @keyup.enter="handleBindEmail"
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
          
          <!-- 已发送提示 -->
          <div v-else class="email-sent-info">
            <p class="info-label">验证链接已发送至</p>
            <p class="email-address">{{ inputEmail }}</p>
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
            :loading="binding"
            @click="handleBindEmail"
            class="bind-btn"
          >
            <el-icon><Promotion /></el-icon>
            <span>绑定并发送验证链接</span>
          </el-button>

          <!-- 重新发送按钮 -->
          <el-button
            v-else
            size="large"
            :disabled="countdown > 0"
            :loading="binding"
            @click="handleBindEmail"
            class="bind-btn"
          >
            <el-icon><RefreshRight /></el-icon>
            <span>{{ countdown > 0 ? `${countdown}秒后可重新发送` : '重新发送' }}</span>
          </el-button>

          <!-- 手动检查验证状态按钮 -->
          <el-button
            v-if="emailSent"
            size="large"
            plain
            :loading="checking"
            @click="manualCheckStatus"
            class="check-status-btn"
          >
            <el-icon><RefreshRight /></el-icon>
            <span>{{ checking ? '检查中...' : '我已完成验证' }}</span>
          </el-button>

          <!-- 提示信息 -->
          <div class="bind-tips">
            <p>• 验证链接 10 分钟内有效</p>
            <p>• 请检查邮箱垃圾箱</p>
            <p>• 60秒后可重新请求发送</p>
            <p>• 验证成功后将自动完成邮箱绑定</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, Message, ChatDotSquare, Clock, Link, InfoFilled,
  CircleCheck, Promotion, RefreshRight
} from '@element-plus/icons-vue'
import { sendEmailVerificationLink, checkEmailStatus } from '@/api/auth'
import { setStorage } from '@/utils/storage'

const router = useRouter()
const authStore = useAuthStore()

// 邮箱绑定相关
const inputEmail = ref('')
const binding = ref(false)
const emailSent = ref(false)
const countdown = ref(0)
const checking = ref(false)
const isDev = import.meta.env.DEV

// 用于防止短时间内多次请求的localStorage key
const LAST_SEND_TIME_KEY = 'email_verify_last_send_time'
const SEND_COOLDOWN = 60 * 1000 // 60秒冷却时间

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

// 绑定邮箱并发送验证链接
const handleBindEmail = async () => {
  // 验证邮箱格式
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!inputEmail.value || !emailReg.test(inputEmail.value)) {
    ElMessage.warning('请输入正确的邮箱地址')
    return
  }

  binding.value = true
  
  try {
    // 获取临时凭证
    const pendingAuth = JSON.parse(sessionStorage.getItem('pendingAuth') || '{}')
    
    if (!pendingAuth.user || !pendingAuth.password) {
      ElMessage.error('登录信息已过期，请重新登录')
      router.push('/login')
      return
    }
    
    // 调用发送验证链接接口
    await sendEmailVerificationLink(
      pendingAuth.user,
      pendingAuth.password,
      inputEmail.value
    )
    
    // 更新临时凭证中的邮箱
    pendingAuth.email = inputEmail.value
    sessionStorage.setItem('pendingAuth', JSON.stringify(pendingAuth))
    
    // 更新本地用户信息
    authStore.updateUserInfo({ email: inputEmail.value })
    emailSent.value = true
    
    // 记录发送时间
    localStorage.setItem(LAST_SEND_TIME_KEY, Date.now().toString())
    countdown.value = 60
    startCountdown()
    
    ElMessage.success({
      message: '验证链接已发送到您的邮箱，请查收',
      duration: 3000
    })
    
    // 开发环境提示
    if (isDev) {
      const frontendUrl = window.location.origin
      setTimeout(() => {
        ElMessage.info({
          message: `开发环境提示：验证链接格式 ${frontendUrl}/verify-email-token?token=xxxxx`,
          duration: 5000,
          showClose: true
        })
      }, 1000)
    }
  } catch (error) {
    console.error('发送验证链接失败：', error)
    ElMessage.error(error.message || '发送失败，请稍后重试')
  } finally {
    binding.value = false
  }
}

// 检查验证状态
const checkVerificationStatus = async (showLoading = false) => {
  if (showLoading) {
    checking.value = true
  }
  
  try {
    // 获取临时凭证
    const pendingAuth = JSON.parse(sessionStorage.getItem('pendingAuth') || '{}')
    
    if (!pendingAuth.user || !pendingAuth.password) {
      if (showLoading) {
        ElMessage.error('登录信息已过期，请重新登录')
        router.push('/login')
      }
      return
    }
    
    // 调用检测接口
    const result = await checkEmailStatus(
      pendingAuth.user,
      pendingAuth.password
    )
    
    if (result === true) {
      // 邮箱已验证，后端已设置 sa-token cookie
      
      // 更新本地用户信息
      authStore.setEmailVerified(true)
      setStorage('isLoggedIn', true)
      
      // 清除临时凭证
      sessionStorage.removeItem('pendingAuth')
      
      ElMessage.success('邮箱验证成功！')
      setTimeout(() => {
        router.push('/courses')
      }, 1000)
    }
  } catch (error) {
    console.error('检查验证状态失败：', error)
    if (showLoading) {
      ElMessage.error('检查失败，请重试')
    }
  } finally {
    if (showLoading) {
      checking.value = false
    }
  }
}

// 手动检查验证状态
const manualCheckStatus = () => {
  checkVerificationStatus(true)
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

// 页面初始化
onMounted(() => {
  // 检查是否有临时凭证
  const pendingAuth = JSON.parse(sessionStorage.getItem('pendingAuth') || '{}')
  
  if (!pendingAuth.user || !pendingAuth.password) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
})

// 组件卸载时清理
onUnmounted(() => {
  // 组件销毁
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
  margin-top: 5rem;
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

.bind-email-form {
  text-align: center;
}

.form-header {
  margin-bottom: 2rem;
}

.form-icon {
  width: 5rem;
  height: 5rem;
  margin: 0 auto 1rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.form-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin: 1rem 0 0.5rem 0;
}

.form-header p {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.bind-email-form .el-input {
  margin-bottom: 1rem;
}

.email-sent-info {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.email-sent-info .info-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
}

.email-sent-info .email-address {
  font-size: 1.125rem;
  color: white;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.check-status-btn {
  width: 100%;
  height: 3rem;
  font-size: 1rem;
  font-weight: 600;
  margin-left: auto;
}

.check-status-btn .el-icon {
  margin-right: 0.5rem;
}

.bind-btn {
  width: 100%;
  height: 3rem;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.bind-btn .el-icon {
  margin-right: 0.5rem;
}

.bind-tips {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  text-align: left;
}

.bind-tips p {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.5rem 0;
  line-height: 1.6;
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

/* 移动端适配 */
@media (max-width: 767px) {
  .email-verify-page {
    padding: 1rem 0.5rem;
    align-items: flex-start;
    padding-top: 2rem;
  }

  .verify-container {
    width: 100%;
    max-width: 100%;
  }

  .back-btn {
    top: 1rem;
    left: 0.5rem;
  }
  
  .verify-header {
    margin-bottom: 1.5rem;
  }

  .verify-card {
    padding: 1.5rem 1rem;
  }
  
  .email-icon {
    width: 4rem;
    height: 4rem;
  }

  .form-icon {
    width: 4rem;
    height: 4rem;
  }
  
  .verify-title {
    font-size: 1.5rem;
  }

  .verify-subtitle {
    font-size: 0.875rem;
  }

  .form-header {
    margin-bottom: 1.5rem;
  }

  .form-header h3 {
    font-size: 1.25rem;
  }

  .bind-btn,
  .check-status-btn {
    height: 2.75rem;
    font-size: 0.9rem;
  }
  
  .success-tip {
    flex-direction: column;
    text-align: center;
    padding: 1rem;
  }
  
  .success-tip .el-icon {
    font-size: 2.5rem;
  }

  .bind-tips {
    margin-top: 1rem;
    padding: 0.875rem;
  }

  .bind-tips p {
    font-size: 0.8rem;
    margin: 0.375rem 0;
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
