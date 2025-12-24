# 学生在线学习系统 (FindrillPage)

<div align="center">

[![Vue](https://img.shields.io/badge/Vue-3.5.25-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.11.9-409EFF?logo=element&logoColor=white)](https://element-plus.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

一个功能完善的现代化在线学习平台，提供课程学习、在线练习、模拟考试、错题管理等完整功能。

[在线演示](https://fd.pnrp.com) · [使用文档](./docs/使用说明文档.md) · [技术文档](./docs/技术文档.md) · [问题反馈](https://github.com/HuangBranch/findrillPage/issues)

</div>

---

## ✨ 特性

- 🎯 **智能练习** - 实时答题反馈，即时查看答案和解析
- 📝 **模拟考试** - 限时考试模式，真实还原考试场景
- 📚 **错题本** - 自动收集错题，支持错题重练
- 📊 **数据统计** - 详细的学习记录和成绩分析
- 👥 **多角色管理** - 支持学生、教师、管理员等多种角色
- 📱 **响应式设计** - 完美支持电脑、平板、手机等多种设备
- 🔐 **权限控制** - 基于角色的动态路由和权限管理
- 📦 **批量导入** - 支持 Excel 批量导入题目
- 📈 **可视化统计** - ECharts 图表展示学习数据

---

## 🚀 快速开始

### 环境要求

- **Node.js**: 20.19.0+ 或 22.12.0+
- **pnpm**: 8.0.0+ （推荐）
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/HuangBranch/findrillPage.git
cd findrillPage

# 安装依赖
pnpm install
```

### 开发环境

```bash
# 启动开发服务器
pnpm dev

# 在浏览器中打开 http://localhost:3000
```

### 生产构建

```bash
# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```

---

## 📦 技术栈

### 核心框架

- **[Vue 3](https://vuejs.org/)** - 渐进式 JavaScript 框架
- **[Vite](https://vitejs.dev/)** - 下一代前端构建工具
- **[Vue Router](https://router.vuejs.org/)** - Vue.js 官方路由管理器
- **[Pinia](https://pinia.vuejs.org/)** - Vue 状态管理库

### UI 组件

- **[Element Plus](https://element-plus.org/)** - Vue 3 组件库
- **[@element-plus/icons-vue](https://element-plus.org/zh-CN/component/icon.html)** - Element Plus 图标库

### 工具库

- **[Axios](https://axios-http.com/)** - HTTP 请求库
- **[ECharts](https://echarts.apache.org/)** - 数据可视化图表库
- **[XLSX](https://docs.sheetjs.com/)** - Excel 文件解析库
- **[Crypto-JS](https://cryptojs.gitbook.io/)** - 加密库
- **[Day.js](https://day.js.org/)** - 日期处理库
- **[@vueuse/core](https://vueuse.org/)** - Vue 组合式工具集

---

## 📁 项目结构

```
findrillPage/
├── docs/                        # 文档目录
│   ├── 技术文档.md               # 技术文档
│   ├── 使用说明文档.md           # 使用说明
│   └── screenshots/             # 截图目录
├── public/                      # 静态资源
├── src/
│   ├── api/                     # API 接口
│   │   ├── admin.js            # 管理端接口
│   │   ├── auth.js             # 认证接口
│   │   ├── chapter.js          # 章节接口
│   │   ├── course.js           # 课程接口
│   │   ├── exam.js             # 考试接口
│   │   ├── practice.js         # 练习接口
│   │   ├── user.js             # 用户接口
│   │   └── wrong.js            # 错题接口
│   ├── assets/                  # 资源文件
│   ├── components/              # 组件
│   ├── router/                  # 路由
│   ├── stores/                  # 状态管理
│   ├── utils/                   # 工具函数
│   ├── views/                   # 页面视图
│   ├── App.vue                  # 根组件
│   └── main.js                  # 入口文件
├── index.html                   # HTML 模板
├── vite.config.js              # Vite 配置
├── package.json                # 项目配置
└── README.md                   # 项目说明
```

---

## 🎨 核心功能

### 学生端

#### 📚 课程学习
- 浏览课程列表
- 查看章节内容
- 搜索课程功能

#### 🎯 练习模式
- 章节刷题
- 实时答题反馈
- 答案解析展示
- 答题卡快速导航
- 自动收集错题

#### 📝 考试模式
- 限时考试
- 倒计时提醒
- 答题卡功能
- 成绩统计分析
- 详细答题报告

#### 📖 错题本
- 错题自动收集
- 按课程分类
- 错题练习
- 移除错题

#### 👤 个人中心
- 个人信息管理
- 考试记录查询
- 练习记录查询
- 密码修改

### 管理端

#### 📊 数据统计
- 核心数据展示
- 考试情况图表
- 用户增长趋势
- 最近考试记录

#### 👥 用户管理
- 用户 CRUD
- 角色分配
- 密码重置

#### 🎭 角色管理
- 角色 CRUD
- 权限分配

#### 📚 课程管理
- 课程 CRUD
- 章节管理

#### 📝 题目管理
- 题目 CRUD
- Excel 批量导入
- 题目筛选搜索

#### 📈 考试追踪
- 考试记录查询
- 成绩分析
- 数据导出

---

## 🔧 配置说明

### 环境变量

创建 `.env.development` 文件（开发环境）：

```bash
VITE_API_BASE_URL=https://api.pnrp.cn
```

创建 `.env.production` 文件（生产环境）：

```bash
VITE_API_BASE_URL=https://api.pnrp.cn
```

### Vite 配置

主要配置项（`vite.config.js`）：

```javascript
export default defineConfig({
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'https://api.pnrp.cn',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

---

## 📖 文档

- **[使用说明文档](./docs/使用说明文档.md)** - 详细的功能介绍和操作指南
- **[技术文档](./docs/技术文档.md)** - 架构设计、API 接口、开发规范等

---

## 🚀 部署

### Nginx 部署

1. 构建生产版本：
```bash
pnpm build
```

2. 配置 Nginx：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass https://api.pnrp.cn;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

### Docker 部署

```bash
# 构建镜像
docker build -t findrill-page .

# 运行容器
docker run -d -p 80:80 findrill-page
```

详细部署说明请查看 [技术文档](./docs/技术文档.md#12-部署说明)。

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构代码
perf: 性能优化
test: 测试相关
chore: 构建/工具链更新
```

---

## 📝 开发规范

### 代码规范

- 使用 ES6+ 语法
- 组件使用 Composition API
- 遵循 Vue 3 风格指南

### 命名规范

- 组件文件：PascalCase（如 `UserManage.vue`）
- 工具文件：camelCase（如 `excelParser.js`）
- 变量/函数：camelCase（如 `getUserInfo`）
- 常量：UPPER_SNAKE_CASE（如 `MAX_COUNT`）

详细开发规范请查看 [技术文档](./docs/技术文档.md#11-开发规范)。

---

## ❓ 常见问题

### 无法启动开发服务器？

检查 Node.js 版本是否符合要求（20.19.0+ 或 22.12.0+）。

### 登录后提示邮箱未验证？

需要先完成邮箱验证才能使用系统功能。

### 管理后台无法访问？

需要管理员权限才能访问管理后台。

更多问题请查看 [使用说明文档](./docs/使用说明文档.md#5-常见问题)。

---

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

感谢以下开源项目：

- [Vue.js](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Element Plus](https://element-plus.org/)
- [ECharts](https://echarts.apache.org/)
- 以及所有贡献者

---

## 📞 联系方式

- **GitHub**: [@HuangBranch](https://github.com/HuangBranch)
- **Repository**: [findrillPage](https://github.com/HuangBranch/findrillPage)
- **Issues**: [问题反馈](https://github.com/HuangBranch/findrillPage/issues)

---

## 🌟 Star History

如果这个项目对您有帮助，请给个 Star ⭐️

[![Star History Chart](https://api.star-history.com/svg?repos=HuangBranch/findrillPage&type=Date)](https://star-history.com/#HuangBranch/findrillPage&Date)

---

<div align="center">

**[⬆ 回到顶部](#学生在线学习系统-findrillpage)**

Made with ❤️ by [HuangBranch](https://github.com/HuangBranch)

</div>
