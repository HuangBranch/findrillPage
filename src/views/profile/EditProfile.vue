<template>
  <div class="edit-profile-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <h1 class="page-title">个人设置</h1>
        <div style="width: 40px;"></div>
      </div>
    </div>

    <!-- 标签页内容 -->
    <div class="form-container">
      <el-tabs v-model="activeTab" class="profile-tabs">
        <!-- 头像设置 -->
        <el-tab-pane label="头像设置" name="avatar">
          <div class="tab-content">
            <div class="avatar-upload-section">
              <el-upload
                  class="avatar-uploader"
                  action="#"
                  :http-request="() => {}"
                  :before-upload="beforeAvatarUpload"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleAvatarChange"
              >
                <div class="avatar-wrapper">
                  <img v-if="avatarPreview" :src="avatarPreview" class="avatar-img" />
                  <div v-else class="avatar-uploader-icon">
                    <el-icon><Plus /></el-icon>
                  </div>
                  <!-- 鼠标悬停遮罩 -->
                  <div v-if="avatarPreview" class="avatar-overlay">
                    <el-icon class="overlay-icon"><Plus /></el-icon>
                    <span class="overlay-text">更换头像</span>
                  </div>
                </div>
              </el-upload>
              <p class="avatar-tip">支持JPG、PNG格式，大小不超过2MB</p>
              <el-button
                  type="primary"
                  size="large"
                  @click="handleAvatarSubmit"
                  :loading="avatarSubmitting"
                  :disabled="!avatarFile"
                  class="submit-btn"
              >
                保存头像
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <div class="tab-content">
            <el-form
                :model="basicForm"
                :rules="basicFormRules"
                ref="basicFormRef"
                label-width="100px"
                class="edit-form"
            >
              <el-form-item label="用户名" prop="name">
                <el-input
                    v-model="basicForm.name"
                    placeholder="请输入用户名"
                    maxlength="20"
                    show-word-limit
                />
              </el-form-item>

              <el-form-item label="真实姓名" prop="realName">
                <el-input
                    v-model="basicForm.realName"
                    placeholder="请输入真实姓名"
                    maxlength="10"
                    show-word-limit
                />
              </el-form-item>

              <el-form-item label="用户ID" prop="id">
                <el-input
                    v-model="basicForm.id"
                    disabled
                    placeholder="用户唯一标识"
                />
              </el-form-item>
            </el-form>

            <div class="submit-button-group">
              <el-button
                  type="primary"
                  size="large"
                  @click="handleBasicSubmit"
                  :loading="basicSubmitting"
                  class="submit-btn"
              >
                保存基本信息
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- 修改密码 -->
        <el-tab-pane label="修改密码" name="password">
          <div class="tab-content">
            <el-form
                :model="passwordForm"
                :rules="passwordFormRules"
                ref="passwordFormRef"
                label-width="100px"
                class="edit-form"
            >
              <el-form-item label="当前密码" prop="oldPassword">
                <el-input
                    v-model="passwordForm.oldPassword"
                    type="password"
                    placeholder="请输入当前密码"
                    show-password
                    maxlength="50"
                />
              </el-form-item>

              <el-form-item label="新密码" prop="newPassword">
                <el-input
                    v-model="passwordForm.newPassword"
                    type="password"
                    placeholder="请输入新密码（6-20位）"
                    show-password
                    maxlength="20"
                />
              </el-form-item>

              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    placeholder="请再次输入新密码"
                    show-password
                    maxlength="20"
                />
              </el-form-item>
            </el-form>

            <div class="submit-button-group">
              <el-button
                  type="primary"
                  size="large"
                  @click="handlePasswordSubmit"
                  :loading="passwordSubmitting"
                  class="submit-btn"
              >
                修改密码
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- 修改邮箱 -->
        <el-tab-pane label="修改邮箱" name="email">
          <div class="tab-content">
            <el-alert
                title="邮箱验证说明"
                type="info"
                description="修改邮箱需要验证当前邮箱和新邮箱。点击发送验证邮件后，请到邮箱中点击验证链接，然后返回此页面点击'检查验证状态'按钮。"
                :closable="false"
                style="margin-bottom: 1.5rem;"
            />
            
            <el-form
                :model="emailForm"
                :rules="emailFormRules"
                ref="emailFormRef"
                label-width="120px"
                class="edit-form"
            >
              <!-- 步骤1：验证当前邮箱 -->
              <div class="verification-step">
                <h3 class="step-title">步骤 1：验证当前邮箱</h3>
                <el-form-item label="当前邮箱">
                  <el-input
                      :model-value="currentEmail"
                      disabled
                      placeholder="当前绑定邮箱"
                  />
                </el-form-item>

                <el-form-item label="邮箱验证">
                  <div class="verification-actions">
                    <el-button
                        type="primary"
                        :disabled="oldEmailCountdown > 0 || oldEmailVerified"
                        @click="sendOldEmailVerification"
                        :loading="oldEmailCodeSending"
                    >
                      {{ oldEmailCountdown > 0 ? `${oldEmailCountdown}秒后重试` : oldEmailVerified ? '已验证' : '发送验证邮件' }}
                    </el-button>
                    <el-button
                        class="transmit-code-btn"
                        v-if="oldEmailSent && !oldEmailVerified"
                        type="success"
                        @click="checkOldEmailVerification"
                        :loading="checkingOldEmail"
                    >
                      检查验证状态
                    </el-button>
                    <el-tag v-if="oldEmailVerified" type="success" size="large">
                      <el-icon><Check /></el-icon> 已验证
                    </el-tag>
                  </div>
                </el-form-item>
              </div>

              <!-- 步骤2：验证新邮箱 -->
              <div class="verification-step" v-if="oldEmailVerified">
                <h3 class="step-title">步骤 2：验证新邮箱</h3>
                <el-form-item label="新邮箱" prop="newEmail">
                  <el-input
                      v-model="emailForm.newEmail"
                      type="email"
                      placeholder="请输入新邮箱"
                      maxlength="50"
                      :disabled="newEmailVerified"
                  />
                </el-form-item>

                <el-form-item label="邮箱验证">
                  <div class="verification-actions">
                    <el-button
                        type="primary"
                        :disabled="newEmailCountdown > 0 || !emailForm.newEmail || newEmailVerified"
                        @click="sendNewEmailVerification"
                        :loading="newEmailCodeSending"
                    >
                      {{ newEmailCountdown > 0 ? `${newEmailCountdown}秒后重试` : newEmailVerified ? '已验证' : '发送验证邮件' }}
                    </el-button>
                    <el-button
                        class="transmit-code-btn"
                        v-if="newEmailSent && !newEmailVerified"
                        type="success"
                        @click="checkNewEmailVerification"
                        :loading="checkingNewEmail"
                    >
                      检查验证状态
                    </el-button>
                    <el-tag v-if="newEmailVerified" type="success" size="large">
                      <el-icon><Check /></el-icon> 已验证
                    </el-tag>
                  </div>
                </el-form-item>
              </div>
            </el-form>

            <div class="submit-button-group" v-if="oldEmailVerified && newEmailVerified">
              <el-button
                  type="primary"
                  size="large"
                  @click="handleEmailSubmit"
                  :loading="emailSubmitting"
                  class="submit-btn"
              >
                完成邮箱修改
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus, Check } from '@element-plus/icons-vue'
import { upavatar, updateUserInfo, changePassword, sendEmailVerification, checkEmailVerification, getUserInfo } from "@/api/user.js"
import CryptoJS from 'crypto-js'

// 路由和状态管理
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 当前标签页
const activeTab = ref('avatar')

// 用户ID和当前邮箱
const userId = ref(0)
const currentEmail = ref('')

// ========== 头像设置 ==========
const avatarFile = ref(null)
const avatarPreview = ref('')
const avatarSubmitting = ref(false)

// ========== 基本信息表单 ==========
const basicFormRef = ref(null)
const basicSubmitting = ref(false)
const basicForm = reactive({
  id: 0,
  name: '',
  realName: ''
})

const basicFormRules = reactive({
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在2-20个字符之间', trigger: 'blur' }
  ],
  realName: [
    { required: false, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '真实姓名长度在2-10个字符之间', trigger: 'blur' }
  ]
})

// ========== 修改密码表单 ==========
const passwordFormRef = ref(null)
const passwordSubmitting = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 自定义验证器：确认密码
const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordFormRules = reactive({
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ]
})

// ========== 修改邮箱表单 ==========
const emailFormRef = ref(null)
const emailSubmitting = ref(false)
const emailForm = reactive({
  newEmail: ''
})

// 邮箱验证状态
const oldEmailSent = ref(false) // 是否已发送旧邮箱验证邮件
const oldEmailVerified = ref(false) // 旧邮箱是否已验证
const newEmailSent = ref(false) // 是否已发送新邮箱验证邮件
const newEmailVerified = ref(false) // 新邮箱是否已验证
const checkingOldEmail = ref(false) // 正在检查旧邮箱验证状态
const checkingNewEmail = ref(false) // 正在检查新邮箱验证状态

// 保存验证邮件返回的UUID
const oldEmailUuid = ref('') // 旧邮箱验证UUID
const newEmailUuid = ref('') // 新邮箱验证UUID

// 验证码倒计时
const oldEmailCountdown = ref(0)
const newEmailCountdown = ref(0)
const oldEmailCodeSending = ref(false)
const newEmailCodeSending = ref(false)

const emailFormRules = reactive({
  newEmail: [
    { required: true, message: '请输入新邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
})

// ========== 页面初始化 ==========
onMounted(() => {
  initFormData()
})

/**
 * 初始化表单数据（从路由参数获取）
 */
const initFormData = () => {
  const id = route.params.id
  const { name, realName, email, avatar } = route.query
  
  if (id) {
    userId.value = Number(id)
    currentEmail.value = email || ''
    avatarPreview.value = avatar || ''
    
    // 基本信息表单
    basicForm.id = Number(id)
    basicForm.name = name || ''
    basicForm.realName = realName || ''
  } else {
    ElMessage.warning('未获取到用户信息，无法修改')
    setTimeout(() => {
      handleBack()
    }, 1500)
  }
}

const handleBack = () => {
  router.back()
}
// ========== 头像相关方法 ==========

/**
 * 头像上传前校验
 */
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('请上传图片文件！')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB！')
    return false
  }
  return true
}

/**
 * 头像文件改变时预览
 */
const handleAvatarChange = (uploadFile) => {
  if (uploadFile.raw) {
    avatarFile.value = uploadFile.raw
    // 创建预览URL
    avatarPreview.value = URL.createObjectURL(uploadFile.raw)
  }
}

/**
 * 提交头像上传
 */
const handleAvatarSubmit = async () => {
  if (!avatarFile.value) {
    ElMessage.warning('请先选择头像')
    return
  }

  avatarSubmitting.value = true
  try {
    const formData = new FormData()
    formData.append('file', avatarFile.value)

    // TODO: 调用你的上传头像接口
    const response = await upavatar(formData)

    if (response) {
      ElMessage.success('头像上传成功')
      // 更新全局存储的用户头像
      authStore.updateUserInfo({
        ...authStore.userInfo,
        avatar: response.avatar || avatarPreview.value
      })
      avatarFile.value = null
    } else {
      ElMessage.error('头像上传失败')
    }
  } catch (error) {
    ElMessage.error('头像上传失败：' + (error.message || '服务器异常'))
    console.error('头像上传错误：', error)
  } finally {
    avatarSubmitting.value = false
  }
}

// ========== 基本信息相关方法 ==========

/**
 * 提交基本信息修改
 */
const handleBasicSubmit = async () => {
  try {
    await basicFormRef.value.validate()
  } catch (error) {
    return
  }

  basicSubmitting.value = true
  try {
    const requestData = {
      id: basicForm.id,
      name: basicForm.name,
      realName: basicForm.realName
    }

    // TODO: 调用你的修改基本信息接口
    const response = await updateUserInfo(basicForm.id, requestData)

    if (response) {
      ElMessage.success('基本信息修改成功！')
      // 更新全局存储的用户信息
      authStore.updateUserInfo({
        ...authStore.userInfo,
        name: basicForm.name,
        realName: basicForm.realName
      })
    } else {
      ElMessage.error('修改失败')
    }
  } catch (error) {
    ElMessage.error('修改失败：' + (error.message || '网络错误'))
    console.error('修改基本信息错误：', error)
  } finally {
    basicSubmitting.value = false
  }
}

// ========== 修改密码相关方法 ==========

/**
 * 提交修改密码
 */
const handlePasswordSubmit = async () => {
  try {
    await passwordFormRef.value.validate()
  } catch (error) {
    return
  }

  passwordSubmitting.value = true
  try {
    // 对新旧密码进行SHA256加密
    const encryptedOldPassword = CryptoJS.SHA256(passwordForm.oldPassword).toString()
    const encryptedNewPassword = CryptoJS.SHA256(passwordForm.newPassword).toString()
    
    const requestData = {
      id: userId.value,
      oldPassword: encryptedOldPassword,
      newPassword: encryptedNewPassword,
      user: authStore.userInfo?.userId || ''
    }

    const result = await changePassword(requestData)
    
    if (result === true) {
      ElMessage.success('密码修改成功，请重新登录！')
      
      // 清空表单
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      
      // 延迟跳转到登录页
      setTimeout(() => {
        authStore.logout()
        router.push('/login')
      }, 1500)
    } else {
      ElMessage.error('修改密码失败')
    }
  } catch (error) {
    ElMessage.error('修改密码失败：' + (error.message || '网络错误'))
    console.error('修改密码错误：', error)
  } finally {
    passwordSubmitting.value = false
  }
}

// ========== 修改邮箱相关方法 ==========

/**
 * 发送旧邮箱验证邮件
 */
const sendOldEmailVerification = async () => {
  if (!currentEmail.value) {
    ElMessage.warning('当前邮箱为空')
    return
  }

  oldEmailCodeSending.value = true
  try {
    // 验证旧邮箱不需要携带参数
    // 拦截器会自动提取data，所以response直接是data对象
    const data = await sendEmailVerification({})
    
    // 保存返回的UUID
    if (data?.uuid) {
      oldEmailUuid.value = data.uuid
      ElMessage.success('验证邮件已发送到当前邮箱，请查收并点击链接验证')
      oldEmailSent.value = true
      
      // 开始倒计时
      startCountdown('old')
    } else {
      ElMessage.error('发送验证邮件失败：未获取到验证标识')
    }
  } catch (error) {
    ElMessage.error('发送验证邮件失败：' + (error.message || '网络错误'))
    console.error('发送验证邮件错误：', error)
  } finally {
    oldEmailCodeSending.value = false
  }
}

/**
 * 检查旧邮箱验证状态
 */
const checkOldEmailVerification = async () => {
  if (!oldEmailUuid.value) {
    ElMessage.warning('请先发送验证邮件')
    return
  }
  
  checkingOldEmail.value = true
  try {
    // 拦截器返回的data就是true/false
    const isVerified = await checkEmailVerification({ 
      uuid: oldEmailUuid.value
    })
    
    if (isVerified === true) {
      oldEmailVerified.value = true
      ElMessage.success('当前邮箱验证成功！请注意：如果发送新邮箱验证邮件时仍提示未验证，请刷新页面后重试')
    } else {
      ElMessage.warning('邮箱尚未验证，请先到邮箱中点击验证链接')
    }
  } catch (error) {
    ElMessage.error('检查验证状态失败：' + (error.message || '网络错误'))
    console.error('检查验证状态错误：', error)
  } finally {
    checkingOldEmail.value = false
  }
}

/**
 * 发送新邮箱验证邮件
 */
const sendNewEmailVerification = async () => {
  if (!emailForm.newEmail) {
    ElMessage.warning('请先输入新邮箱')
    return
  }

  // 验证邮箱格式
  const emailReg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
  if (!emailReg.test(emailForm.newEmail)) {
    ElMessage.warning('请输入正确的邮箱格式')
    return
  }

  // 检查是否与当前邮箱相同
  if (emailForm.newEmail === currentEmail.value) {
    ElMessage.warning('新邮箱不能与当前邮箱相同')
    return
  }

  newEmailCodeSending.value = true
  try {
    // 验证新邮箱需要携带邮箱号
    // 拦截器会自动提取data，所以data直接是data对象
    const data = await sendEmailVerification({ 
      email: emailForm.newEmail
    })
    
    // 保存返回的UUID
    if (data?.uuid) {
      newEmailUuid.value = data.uuid
      ElMessage.success('验证邮件已发送到新邮箱，请查收并点击链接验证')
      newEmailSent.value = true
      
      // 开始倒计时
      startCountdown('new')
    } else {
      ElMessage.error('发送验证邮件失败：未获取到验证标识')
    }
  } catch (error) {
    ElMessage.error('发送验证邮件失败：' + (error.message || '网络错误'))
    console.error('发送验证邮件错误：', error)
  } finally {
    newEmailCodeSending.value = false
  }
}

/**
 * 检查新邮箱验证状态
 */
const checkNewEmailVerification = async () => {
  if (!newEmailUuid.value) {
    ElMessage.warning('请先发送验证邮件')
    return
  }
  
  checkingNewEmail.value = true
  try {
    // 拦截器返回的data就是true/false
    const isVerified = await checkEmailVerification({ 
      uuid: newEmailUuid.value
    })
    
    if (isVerified === true) {
      newEmailVerified.value = true
      ElMessage.success('新邮箱验证成功！')
    } else {
      ElMessage.warning('邮箱尚未验证，请先到新邮箱中点击验证链接')
    }
  } catch (error) {
    ElMessage.error('检查验证状态失败：' + (error.message || '网络错误'))
    console.error('检查验证状态错误：', error)
  } finally {
    checkingNewEmail.value = false
  }
}

/**
 * 开始倒计时
 */
const startCountdown = (type) => {
  const countdownRef = type === 'old' ? oldEmailCountdown : newEmailCountdown
  countdownRef.value = 60
  
  const timer = setInterval(() => {
    countdownRef.value--
    if (countdownRef.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

/**
 * 提交修改邮箱
 */
const handleEmailSubmit = async () => {
  // 检查两个邮箱是否都已验证
  if (!oldEmailVerified.value) {
    ElMessage.warning('请先验证当前邮箱')
    return
  }
  
  if (!newEmailVerified.value) {
    ElMessage.warning('请先验证新邮箱')
    return
  }

  try {
    await emailFormRef.value.validate()
  } catch (error) {
    return
  }

  emailSubmitting.value = true
  try {
    await getUserInfo()
    
    // 更新当前邮箱显示
    currentEmail.value = emailForm.newEmail
    
    // 更新全局存储的用户邮箱
    authStore.updateUserInfo({
      ...authStore.userInfo,
      email: emailForm.newEmail
    })
    ElMessage.success('邮箱修改成功！')
    
    // 重置所有状态
    emailForm.newEmail = ''
    oldEmailSent.value = false
    oldEmailVerified.value = false
    newEmailSent.value = false
    newEmailVerified.value = false
    oldEmailCountdown.value = 0
    newEmailCountdown.value = 0
    oldEmailUuid.value = ''
    newEmailUuid.value = ''
    
    // 重置验证
    emailFormRef.value.resetFields()
  } catch (error) {
    ElMessage.error('修改邮箱失败：' + (error.message || '网络错误'))
    console.error('修改邮箱错误：', error)
  } finally {
    emailSubmitting.value = false
  }
}

</script>
<style scoped>
.edit-profile-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #f5f7fa;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.page-header {
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

/* 表单容器 */
.form-container {
  flex: 1;
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

/* 标签页样式 */
.profile-tabs {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tab-content {
  padding: 1rem 0;
}

/* 头像上传区域 */
.avatar-upload-section {
  text-align: center;
  padding: 2rem 0;
}

.avatar-uploader :deep(.el-upload) {
  border: 2px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.avatar-wrapper {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.overlay-icon {
  font-size: 40px;
  margin-bottom: 0.5rem;
}

.overlay-text {
  font-size: 14px;
  font-weight: 500;
}

.avatar-uploader-icon {
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #c0c4cc;
  background: #fafafa;
  border-radius: 50%;
}

.avatar-tip {
  font-size: 0.875rem;
  color: #909399;
  margin: 1rem 0 1.5rem;
}

/* 表单样式 */
.edit-form {
  padding: 1rem 0;
}

.el-form-item {
  margin-bottom: 1.5rem;
}

/* 验证码输入框 */
.verification-input {
  display: flex;
  gap: 0.5rem;
}

.verification-input .el-input {
  flex: 1;
}

.code-btn {
  min-width: 120px;
  flex-shrink: 0;
}

/* 邮箱验证步骤 */
.verification-step {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.step-title {
  font-size: 1rem;
  font-weight: 600;
  color: #303133;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #409eff;
}

.verification-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.verification-actions .el-button {
  min-width: 140px;
}

.verification-actions .el-tag {
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* 提交按钮 */
.submit-button-group {
  margin-top: 2rem;
  text-align: center;
}

.transmit-code-btn {
  margin-left: auto;
}

.submit-btn {
  width: 100%;
  max-width: 300px;
  height: 48px;
  font-size: 1rem;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .form-container {
    padding: 1rem;
  }
  
  .profile-tabs {
    padding: 0.5rem;
  }
  
  .tab-content {
    padding: 0.5rem 0;
  }
  
  .page-header {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1rem;
  }
  
  .avatar-uploader :deep(.el-upload),
  .avatar-img,
  .avatar-uploader-icon {
    width: 120px;
    height: 120px;
  }
  
  .avatar-uploader-icon {
    font-size: 32px;
  }
  
  .verification-input {
    flex-direction: column;
  }
  
  .code-btn {
    width: 100%;
  }
  
  .verification-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .verification-actions .el-button,
  .verification-actions .el-tag {
    width: 100%;
  }
}

/* Element Plus 样式覆盖 */
:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__active-bar) {
  height: 3px;
  background-color: #409eff;
}

:deep(.el-tabs__item) {
  font-size: 1rem;
  font-weight: 500;
}

:deep(.el-tabs__item.is-active) {
  color: #409eff;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>