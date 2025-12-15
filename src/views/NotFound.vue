<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <div class="error-content">
        <!-- 404 图标 -->
        <div class="error-icon">
          <el-icon :size="120" color="#909399">
            <WarningFilled />
          </el-icon>
        </div>

        <!-- 错误信息 -->
        <div class="error-info">
          <h1 class="error-code">404</h1>
          <h2 class="error-title">页面不存在</h2>
          <p class="error-desc">抱歉，您访问的页面不存在或已被删除</p>
        </div>

        <!-- 操作按钮 -->
        <div class="error-actions">
          <el-button 
            type="primary" 
            size="large"
            @click="goHome"
          >
            <el-icon><HomeFilled /></el-icon>
            <span>返回首页</span>
          </el-button>
          
          <el-button 
            size="large"
            @click="goBack"
          >
            <el-icon><Back /></el-icon>
            <span>返回上一页</span>
          </el-button>
        </div>

        <!-- 推荐链接 -->
        <div class="recommend-links">
          <p class="recommend-title">您可以访问以下页面：</p>
          <div class="link-list">
            <a @click="router.push('/courses')" class="link-item">
              <el-icon><Reading /></el-icon>
              <span>我的课程</span>
            </a>
            <a @click="router.push('/wrong')" class="link-item">
              <el-icon><Flag /></el-icon>
              <span>错题本</span>
            </a>
            <a @click="router.push('/profile')" class="link-item">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { WarningFilled, HomeFilled, Back, Reading, Flag, User } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/courses')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.not-found-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  overflow: auto;
}

.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.error-content {
  background: white;
  border-radius: 16px;
  padding: 3rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  max-width: 600px;
  width: 100%;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-icon {
  margin-bottom: 1.5rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.error-info {
  margin-bottom: 2rem;
}

.error-code {
  font-size: 5rem;
  font-weight: 700;
  color: #409eff;
  margin: 0 0 1rem 0;
  line-height: 1;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-title {
  font-size: 1.75rem;
  color: #303133;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.error-desc {
  font-size: 1rem;
  color: #909399;
  margin: 0;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.error-actions .el-button {
  min-width: 140px;
}

.error-actions .el-button .el-icon {
  margin-right: 0.5rem;
}

.recommend-links {
  border-top: 1px solid #e4e7ed;
  padding-top: 2rem;
  margin-top: 2rem;
}

.recommend-title {
  font-size: 0.875rem;
  color: #606266;
  margin: 0 0 1rem 0;
}

.link-list {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f5f7fa;
  border-radius: 8px;
  color: #606266;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.875rem;
  border: 1px solid transparent;
}

.link-item:hover {
  background: #ecf5ff;
  color: #409eff;
  border-color: #409eff;
  transform: translateY(-2px);
}

.link-item .el-icon {
  font-size: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-container {
    padding: 1rem;
  }

  .error-content {
    padding: 2rem 1.5rem;
  }

  .error-code {
    font-size: 3.5rem;
  }

  .error-title {
    font-size: 1.5rem;
  }

  .error-desc {
    font-size: 0.875rem;
  }

  .error-actions {
    flex-direction: column;
  }

  .error-actions .el-button {
    width: 100%;
  }

  .link-list {
    flex-direction: column;
  }

  .link-item {
    width: 100%;
    justify-content: center;
  }
}

/* 小屏手机适配 */
@media (max-width: 375px) {
  .error-content {
    padding: 1.5rem 1rem;
  }

  .error-code {
    font-size: 3rem;
  }

  .error-title {
    font-size: 1.25rem;
  }
}
</style>
