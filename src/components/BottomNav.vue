<template>
  <div class="bottom-nav-wrapper">
    <div class="bottom-nav" ref="bottomNav">
      <div class="nav-indicator" ref="indicator"></div>
      
      <div 
        class="nav-item" 
        :class="{ active: activeIndex === 0 }"
        @click="handleNavigate(0, '/courses')"
      >
        <el-icon><Reading /></el-icon>
        <span>课程</span>
      </div>
      
      <div 
        class="nav-item" 
        :class="{ active: activeIndex === 1 }"
        @click="handleNavigate(1, '/wrong')"
      >
        <el-icon><Flag /></el-icon>
        <span>错题</span>
      </div>
      
      <div 
        class="nav-item" 
        :class="{ active: activeIndex === 2 }"
        @click="handleNavigate(2, '/profile')"
      >
        <el-icon><User /></el-icon>
        <span>我的</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Reading, Flag, User } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const bottomNav = ref(null)
const indicator = ref(null)

// 根据当前路由计算活动索引
const activeIndex = computed(() => {
  const path = route.path
  if (path === '/courses') return 0
  if (path === '/wrong') return 1
  if (path === '/profile') return 2
  return 0
})

// 更新指示器位置
const updateIndicator = (index) => {
  if (!bottomNav.value || !indicator.value) return
  
  nextTick(() => {
    const navItems = bottomNav.value.querySelectorAll('.nav-item')
    const targetItem = navItems[index]
    
    if (targetItem) {
      const navRect = bottomNav.value.getBoundingClientRect()
      const itemRect = targetItem.getBoundingClientRect()
      const offsetLeft = itemRect.left - navRect.left
      const width = itemRect.width
      
      indicator.value.style.transform = `translateX(${offsetLeft}px)`
      indicator.value.style.width = `${width}px`
    }
  })
}

// 处理导航点击
const handleNavigate = (index, path) => {
  if (route.path === path) return // 已经在当前页面
  
  updateIndicator(index)
  
  setTimeout(() => {
    router.push(path)
  }, 200)
}

// 监听路由变化
watch(() => route.path, () => {
  nextTick(() => {
    setTimeout(() => {
      updateIndicator(activeIndex.value)
    }, 100)
  })
}, { immediate: false })

// 初始化
onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      updateIndicator(activeIndex.value)
    }, 150)
  })
})
</script>

<style scoped>
/* 底部导航 */
.bottom-nav-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 16px;
  background: transparent;
  z-index: 1000;
  pointer-events: none;
}

.bottom-nav {
  position: relative;
  display: flex;
  background: white;
  border-radius: 24px;
  padding: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border: 1px solid #e4e7ed;
  z-index: 1000;
  width: 240px;
  pointer-events: auto;
}

.nav-indicator {
  position: absolute;
  height: calc(100% - 12px);
  background: #409eff;
  border-radius: 18px;
  top: 6px;
  left: 0;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform, width;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: #909399;
  font-size: 12px;
  font-weight: 500;
  z-index: 1;
  flex: 1;
  border-radius: 18px;
}

.nav-item.active {
  color: white;
}

.nav-item .el-icon {
  font-size: 22px;
  transition: transform 0.3s;
}

.nav-item.active .el-icon {
  transform: scale(1.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .bottom-nav-wrapper {
    padding: 12px;
  }

  .bottom-nav {
    width: 200px;
    max-width: calc(100% - 24px);
    padding: 4px;
    border-radius: 20px;
  }

  .nav-indicator {
    height: calc(100% - 8px);
    border-radius: 16px;
    top: 4px;
  }

  .nav-item {
    padding: 8px 6px;
    gap: 2px;
    font-size: 11px;
    border-radius: 16px;
  }

  .nav-item .el-icon {
    font-size: 18px;
  }

  .nav-item.active .el-icon {
    transform: scale(1.1);
  }

  .nav-item span {
    font-size: 10px;
  }
}

/* 小屏手机适配 */
@media (max-width: 375px) {
  .bottom-nav-wrapper {
    padding: 10px;
  }

  .bottom-nav {
    width: 180px;
    max-width: calc(100% - 20px);
    padding: 3px;
  }

  .nav-item {
    padding: 6px 4px;
    gap: 2px;
  }

  .nav-item .el-icon {
    font-size: 16px;
  }

  .nav-item span {
    font-size: 9px;
  }
}
</style>
