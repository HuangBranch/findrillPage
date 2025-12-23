<template>
  <div class="admin-layout">
    <!-- 顶部导航 -->
    <div class="admin-header">
      <div class="header-left">
        <el-icon class="menu-icon" @click="toggleSidebar">
          <Fold v-if="!isCollapsed" />
          <Expand v-else />
        </el-icon>
        <h1 class="system-title">刷题系统管理后台</h1>
      </div>
      <div class="header-right">
        <el-dropdown>
          <div class="user-info">
            <el-avatar :size="32" :src="authStore.userInfo.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="username">{{ authStore.userInfo?.userName || '管理员' }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleGoHome">
                <el-icon><HomeFilled /></el-icon>
                返回前台
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="admin-container">
      <!-- 移动端遮罩层 -->
      <div 
        v-if="!isCollapsed" 
        class="sidebar-mask" 
        @click="toggleSidebar"
      ></div>
      
      <!-- 侧边栏 -->
      <div class="admin-sidebar" :class="{ collapsed: isCollapsed }">
        <el-menu
          :default-active="currentPath"
          :collapse="isCollapsed"
          :collapse-transition="false"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/admin/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>数据统计</template>
          </el-menu-item>
          
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <template #title>用户管理</template>
          </el-menu-item>
          
          <el-menu-item index="/admin/roles">
            <el-icon><Avatar /></el-icon>
            <template #title>角色管理</template>
          </el-menu-item>
          
          <el-menu-item index="/admin/courses">
            <el-icon><Reading /></el-icon>
            <template #title>课程管理</template>
          </el-menu-item>
          
          <el-menu-item index="/admin/chapters">
            <el-icon><Notebook /></el-icon>
            <template #title>章节管理</template>
          </el-menu-item>
          
          <el-menu-item index="/admin/questions">
            <el-icon><Document /></el-icon>
            <template #title>题目管理</template>
          </el-menu-item>
          
          <el-menu-item index="/admin/upload">
            <el-icon><Upload /></el-icon>
            <template #title>题目上传</template>
          </el-menu-item>
          
          <el-menu-item index="/admin/traces">
            <el-icon><Tickets /></el-icon>
            <template #title>记录管理</template>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 主内容区 -->
      <div class="admin-main">
        <div class="main-content">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  User,
  Avatar,
  HomeFilled,
  SwitchButton,
  DataAnalysis,
  Reading,
  Notebook,
  Document,
  Upload,
  Tickets,
  Fold,
  Expand
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 移动端默认收起侧边栏
const isCollapsed = ref(window.innerWidth <= 768)

const currentPath = computed(() => route.path)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const handleMenuSelect = (index) => {
  router.push(index)
  // 移动端选择菜单后自动收起侧边栏
  if (window.innerWidth <= 768) {
    isCollapsed.value = true
  }
}

const handleGoHome = () => {
  router.push('/courses')
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    // 用户取消
  }
}
</script>

<style scoped>
.admin-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.admin-header {
  height: 60px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-icon {
  font-size: 40px;
  cursor: pointer;
  transition: all 0.3s;
  padding: 8px;
  border-radius: 4px;
}

.menu-icon:hover {
  color: #409eff;
  background: #ecf5ff;
}

.system-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #606266;
}

.admin-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.admin-sidebar {
  width: 200px;
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 21, 41, 0.08);
  transition: width 0.3s;
  overflow: hidden;
  flex-shrink: 0;
}

.admin-sidebar.collapsed {
  width: 64px;
}

.admin-sidebar :deep(.el-menu) {
  border-right: none;
  height: 100%;
}

.admin-sidebar :deep(.el-menu-item) {
  height: 56px;
  line-height: 56px;
}

.admin-main {
  flex: 1;
  overflow: auto;
  background: #f0f2f5;
}

.main-content {
  padding: 24px;
  min-height: 100%;
  max-width: 100%;
}

/* 平板适配 */
@media (max-width: 1024px) {
  .main-content {
    padding: 20px;
  }
}

/* 移动端遮罩层 */
.sidebar-mask {
  display: none;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .admin-header {
    padding: 0 16px;
    height: 56px;
  }
  
  .system-title {
    font-size: 16px;
  }
  
  .username {
    display: none;
  }
  
  .menu-icon {
    font-size: 35px;
    padding: 6px;
  }
  
  .sidebar-mask {
    display: block;
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    animation: fadeIn 0.3s;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .admin-sidebar {
    position: fixed;
    left: 0;
    top: 56px;
    bottom: 0;
    z-index: 1000;
    width: 240px;
    transform: translateX(-100%);
    transition: transform 0.3s;
    box-shadow: 2px 0 12px rgba(0, 21, 41, 0.15);
  }
  
  .admin-sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  
  .admin-sidebar.collapsed ~ .sidebar-mask {
    display: none;
  }
  
  .admin-main {
    width: 100%;
  }
  
  .main-content {
    padding: 16px 12px;
  }
}

/* 小屏手机适配 */
@media (max-width: 375px) {
  .admin-header {
    padding: 0 12px;
  }
  
  .system-title {
    font-size: 14px;
  }
  
  .main-content {
    padding: 12px 8px;
  }
}
</style>
