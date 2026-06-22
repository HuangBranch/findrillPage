<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">编辑资料</h1>
        <p class="page-subtitle">修改昵称和登录密码。</p>
      </div>
      <el-button @click="$router.push('/profile')">返回</el-button>
    </div>

    <div class="edit-grid">
      <section class="surface">
        <h2>基本资料</h2>
        <el-form :model="profileForm" label-position="top">
          <el-form-item label="昵称">
            <el-input v-model.trim="profileForm.name" />
          </el-form-item>
          <el-button type="primary" :loading="savingProfile" @click="saveProfile">保存资料</el-button>
        </el-form>
      </section>

      <section class="surface">
        <h2>修改密码</h2>
        <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-position="top">
          <el-form-item label="原密码" prop="oldPassword">
            <el-input v-model="passwordForm.oldPassword" type="password" show-password />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="passwordForm.newPassword" type="password" show-password />
          </el-form-item>
          <el-button type="primary" :loading="savingPassword" @click="savePassword">更新密码</el-button>
        </el-form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const savingProfile = ref(false)
const savingPassword = ref(false)
const passwordFormRef = ref()

const profileForm = reactive({
  name: authStore.userInfo?.name || ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, min: 6, message: '新密码至少 6 位', trigger: 'blur' }]
}

const saveProfile = async () => {
  savingProfile.value = true
  try {
    await authStore.updateProfile(profileForm)
    ElMessage.success('资料已更新')
  } finally {
    savingProfile.value = false
  }
}

const savePassword = async () => {
  await passwordFormRef.value.validate()
  savingPassword.value = true
  try {
    await authStore.updatePassword(passwordForm)
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    ElMessage.success('密码已更新')
  } finally {
    savingPassword.value = false
  }
}
</script>

<style scoped>
.edit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

h2 {
  margin: 0 0 14px;
  font-size: 18px;
}
</style>
