import './assets/main.css'
import 'element-plus/dist/index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { setupRouterGuards } from './router/guards'

const app = createApp(App)

// 使用 Pinia
const pinia = createPinia()
app.use(pinia)

// 使用路由
app.use(router)

// 设置路由守卫
setupRouterGuards(router)

// 使用 Element Plus
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
