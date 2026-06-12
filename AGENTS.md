# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 项目概述

基于 Vue 3 的移动端优先刷题系统（学生在线学习系统）。用户可以浏览课程、练习题目、参加限时考试、复习错题、管理个人资料。后台管理面板支持用户/角色/课程/题目管理，支持 Excel 批量导入题目。

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 启动开发服务器 http://localhost:3000
pnpm build            # 生产环境构建
pnpm preview          # 预览生产构建
```

项目未配置测试、linter 或 formatter。

## 技术栈

Vue 3.5 (Composition API, `<script setup>`) | Vite 7 | Pinia 3 | Vue Router 4 | Element Plus 2 | Axios | SCSS | JavaScript（无 TypeScript）

## 架构

### API 通信

- Axios 实例在 `src/utils/request.js`，使用 Cookie 鉴权（`withCredentials: true`，后端为 sa-token）
- 响应格式 `{ code, msg, data }`，拦截器在 code 200 时返回 `data`，401 跳转登录，403 提示邮箱未验证
- API 模块在 `src/api/`，按领域划分：`auth.js`、`course.js`、`chapter.js`、`exam.js`、`practice.js`、`user.js`、`wrong.js`、`admin.js`
- 开发代理：`/api` → `http://localhost:8848`（配置在 `vite.config.js`）
- 生产环境 API：`https://api.pnrp.cn/api`

### 状态管理（Pinia）

四个 Store，均使用 Options API 风格（`defineStore` + `state`/`getters`/`actions`）：
- **`auth`** — 登录/登出、用户信息（持久化到 localStorage）、邮箱验证状态、密码使用 crypto-js SHA-256 加密后传输
- **`course`** — 当前课程/章节选择，仅内存缓存
- **`exam`** — 管理考试和练习模式状态；进度自动保存到 localStorage（按 userId+sessionId 键），24 小时后自动清理
- **`menu`** — 后台菜单管理，从后端加载菜单数据并缓存到 localStorage，负责动态注册后台管理路由

### 路由

- 基础路由在 `src/router/index.js` 中静态定义并懒加载，后台管理路由**动态加载**
- 后台路由由 `menu` store 从后端获取菜单数据后，通过 `router.addRoute()` 动态注册（`addAdminRoutes` 函数）
- 组件映射表 `componentMap` 在 `src/router/index.js` 中维护，将后端返回的组件路径映射到懒加载导入
- 路由守卫在 `src/router/guards.js`：
  - 校验登录状态（`requiresAuth`）、邮箱验证（`requiresEmailVerified`）
  - 访问 `/admin/` 路径时，先确保菜单已加载（触发 `menuStore.loadMenus()`），再检查动态路由是否存在以验证权限
  - 404 路由在动态路由注册后添加，确保兜底

### 样式

- SCSS 全局变量 `variables.scss` 通过 Vite `additionalData` 自动注入每个组件
- 主要使用 Element Plus 组件库，优先使用其组件而非自行实现
- 移动端优先响应式设计，`src/assets/base.css` 提供 CSS Reset
- 全局工具类在 `src/assets/styles/common.scss`

### 视图组织

视图按功能领域组织在 `src/views/` 下：
- `auth/` — 登录、邮箱验证
- `course/` — 课程列表、章节列表
- `exam/` — 考试模式、考试结果
- `practice/` — 练习模式
- `wrong/` — 错题列表、错题练习
- `profile/` — 个人中心、编辑资料、考试记录、练习记录
- `admin/` — 仪表盘、用户管理、角色管理、课程管理、章节管理、题目管理、题目上传、记录追踪

共享组件在 `src/components/`：BottomNav（移动端底部导航）、AnswerCard（答题卡抽屉）、AdminLayout（后台侧边栏+顶栏布局）、RouteLoading（路由加载动画）。

### 编码规范

- 所有 Vue 组件使用 `<script setup>` Composition API
- 视图文件 PascalCase 命名（如 `CourseList.vue`）
- API 函数 camelCase 动词命名（如 `getCourseList`、`submitExam`）
- 使用 `@/` 路径别名（映射到 `src/`）
- 环境变量 `VITE_API_BASE_URL` 控制 API 基础路径

### 特殊功能

- Excel 文件解析用于批量导入题目（`xlsx` 库，`src/utils/excelParser.js`）
- ECharts 用于管理后台统计图表
- 考试/练习进度持久化到 localStorage，刷新页面不丢失
- 后台管理路由基于后端菜单数据动态生成，支持细粒度权限控制
