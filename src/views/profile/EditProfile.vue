<template>
  <div class="edit-profile-page">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-content">
        <el-button :icon="ArrowLeft" circle @click="handleBack" />
        <h1 class="page-title">修改个人信息</h1>
        <div style="width: 40px;"></div>
      </div>
    </div>

    <!-- 表单内容 -->
    <div class="form-container">
      <!-- 头像上传区域（核心错误修复：去掉<i>前多余的<） -->
      <div class="avatar-upload-section">
        <el-upload
            class="avatar-uploader"
            action="#"
            :http-request="handleAvatarUpload"
            :before-upload="beforeAvatarUpload"
            :file-list="avatarFileList"
            :auto-upload="false"
            list-type="picture-card"
        >
          <img v-if="form.avatar" :src="form.avatar" class="avatar-img" />
          <i v-else class="el-icon-plus avatar-uploader-icon"></i> <!-- 修复：仅保留一个<，正确关联v-if -->
        </el-upload>
        <p class="avatar-tip">支持JPG、PNG格式，大小不超过2MB</p>
      </div>

      <!-- 表单区域 -->
      <el-form
          :model="form"
          :rules="formRules"
          ref="formRef"
          label-width="100px"
          class="edit-form"
      >
        <el-form-item label="用户名" prop="name">
          <el-input
              v-model="form.name"
              placeholder="请输入用户名"
              maxlength="20"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="真实姓名" prop="realName">
          <el-input
              v-model="form.realName"
              placeholder="请输入真实姓名"
              maxlength="10"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="联系邮箱" prop="email">
          <el-input
              v-model="form.email"
              type="email"
              placeholder="请输入联系邮箱"
              maxlength="50"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="用户ID" prop="id">
          <el-input
              v-model="form.id"
              disabled
              placeholder="用户唯一标识"
          />
        </el-form-item>
      </el-form>

      <!-- 提交按钮 -->
      <div class="submit-button-group">
        <el-button
            type="primary"
            size="large"
            @click="handleSubmit"
            :loading="isSubmitting"
            class="submit-btn"
        >
          <el-icon v-if="isSubmitting"><Loading /></el-icon>
          <span>保存修改</span>
        </el-button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { ArrowLeft, Loading } from '@element-plus/icons-vue'
import {upavatar, updateUserInfo} from "@/api/user.js";

// 路由和状态管理
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const formRef = ref(null) // 表单引用

// 状态变量
const isSubmitting = ref(false) // 提交加载状态
const avatarFileList = ref([]) // 头像文件列表
const avatarUploadLoading = ref(false) // 头像上传加载状态

// 表单数据（初始化从路由参数获取）
const form = reactive({
  id: 0,
  name: '',
  realName: '',
  email: '',
  avatar: '', // 头像URL
  avatarFile: null // 待上传的头像文件
})

// 表单验证规则
const formRules = reactive({
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在2-20个字符之间', trigger: 'blur' }
  ],
  realName: [
    { required: false, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '真实姓名长度在2-10个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: false, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  id: [
    { required: true, message: '用户ID不能为空', trigger: 'blur' }
  ]
})

// 页面挂载时初始化表单数据
onMounted(() => {
  initFormData()
})

/**
 * 初始化表单数据（从路由参数获取）
 */
const initFormData = () => {
  const id=route.params.id
  const { name, realName, email, avatar } = route.query
  if (id) {
    form.id = Number(id)
    form.name = name || ''
    form.realName = realName || ''
    form.email = email || ''
    form.avatar = avatar || ''

    // 初始化头像文件列表
    if (form.avatar) {
      avatarFileList.value = [
        {
          url: form.avatar,
          name: 'avatar',
          status: 'success'
        }
      ]
    }
  } else {
    ElMessage.warning('未获取到用户信息，无法修改')
    setTimeout(() => {
      handleBack()
    }, 1500)
  }
}

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
  form.avatarFile = file // 保存文件对象
  return true
}

/**
 * 自定义头像上传逻辑（如果需要单独上传头像接口）
 */
const handleAvatarUpload = async (uploadFile) => {
  if (!form.avatarFile) return
  avatarUploadLoading.value = true
  try {
    const formData = new FormData()
    formData.append('avatar', form.avatarFile)

    // 假设单独上传头像接口（如果不需要单独上传，可删除此逻辑，在提交时一起上传）
    const response = await upavatar(formData)
    //     axios.post('/api/upload/avatar', formData, {
    //   headers: { 'Content-Type': 'multipart/form-data' }
    // })

    if (response === 0) {
      form.avatar = response.avatar // 保存上传后的头像URL
      avatarFileList.value = [
        { url: form.avatar, name: 'avatar', status: 'success' }
      ]
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error('头像上传失败：' + response.data.msg)
    }
  } catch (error) {
    ElMessage.error('头像上传失败：' + (error.message || '服务器异常'))
    console.error('头像上传错误：', error)
  } finally {
    avatarUploadLoading.value = false
  }
}

/**
 * 提交表单修改个人信息
 */
const handleSubmit = async () => {
  // 表单校验
  try {
    await formRef.value.validate()
  } catch (error) {
    return // 校验失败直接返回
  }

  isSubmitting.value = true
  try {
    // 构建请求参数（根据接口要求，使用form-data格式）
    const requestData = {
      id: form.id,
      name: form.name,
      realName: form.realName,
    }


    // 如果有新头像文件，一起上传（如果接口支持）
    if (form.avatarFile) {
      requestData.append('avatar', form.avatarFile)
    }

    // 调用修改个人信息接口（PUT请求）
    const response = await updateUserInfo(form.id,requestData)
    //     axios.put(`/api/profile/${form.id}`, formData, {
    //   headers: {
    //     'Content-Type': 'multipart/form-data' // 表单数据格式
    //   }
    // })
     console.log(response)
    if (response) {
      ElMessage.success('个人信息修改成功！')

      // 更新全局存储的用户信息
      authStore.updateUserInfo({
        ...authStore.userInfo,
        name: form.name,
        realName: form.realName,
        avatar: form.avatar
      })

      // 延迟跳转回个人中心
      setTimeout(() => {
        handleBack()
      }, 1500)
    } else {
      ElMessage.error('修改失败：' + (response.data.msg || '服务器异常'))
    }
  } catch (error) {
    ElMessage.error('修改失败：' + (error.message || '网络错误'))
    console.error('修改个人信息错误：', error)
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 返回上一页（个人中心）
 */
const handleBack = () => {
  router.push('/profile')
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
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

/* 头像上传区域 */
.avatar-upload-section {
  text-align: center;
  margin-bottom: 2rem;
}
.avatar-uploader {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}
.avatar-img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-uploader-icon {
  width: 120px;
  height: 120px;
  line-height: 120px;
  font-size: 24px;
  color: #c0c4cc;
  background: #f5f7fa;
  border-radius: 50%;
}
.avatar-tip {
  font-size: 0.875rem;
  color: #909399;
  margin: 0;
}

/* 表单样式 */
.edit-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.el-form-item {
  margin-bottom: 1.5rem;
}
.el-input {
  width: 100%;
}

/* 提交按钮 */
.submit-button-group {
  margin-top: 2rem;
  text-align: center;
}
.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 1rem;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .form-container {
    padding: 1rem;
  }
  .edit-form {
    padding: 1.5rem;
  }
  .page-header {
    padding: 1rem;
  }
  .page-title {
    font-size: 1rem;
  }
  .avatar-img,
  .avatar-uploader-icon {
    width: 100px;
    height: 100px;
    line-height: 100px;
  }
}

/* 加载状态样式 */
.el-upload__tip {
  color: #909399;
}
.el-loading-mask {
  z-index: 1000 !important;
}
</style>