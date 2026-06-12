# 代码审查报告 - FindRill 前端项目

**审查日期**: 2026-05-23  
**技术栈**: Vue 3 + Vite + Element Plus + Pinia + Vue Router

---

## 一、总览

| 严重程度 | 数量 | 说明 |
|---------|------|------|
| HIGH | 3 | 变量冲突、类型判断不一致、安全存储 |
| MEDIUM | 6 | 性能优化、代码规范、重复代码 |
| LOW | 4 | 命名规范、注释清理、日志清理 |
| **合计** | **13** | |

已修复问题（3项）已移除：管理员权限检查、错题删除API、题型映射统一。

---

## 二、HIGH 级别问题

### H-1. 考试计时器变量名冲突
**文件**: `src/views/exam/ExamMode.vue:276`

| 行号 | 问题 |
|------|------|
| 276 | `const timer = ref(null)` 存储题目数量选择值 |
| 519 | `timer.value = setInterval(...)` 覆盖为定时器 |

**影响**: 题目数量选择功能异常  
**建议**: 重命名为 `questionCount` 和 `timerInterval`

---

### H-2. 考试题型判断不一致
**文件**: `src/views/exam/ExamMode.vue:105`

| 位置 | 判断方式 |
|------|---------|
| L105 | `currentQuestion.type === 'multiple'` (字符串) |
| 其他 | `currentQuestion.type === 2` (数字) |

**影响**: 多选题提示不显示  
**建议**: 统一为 `currentQuestion.type === 2`

---

### H-3. 敏感信息存储在 localStorage
**文件**: `src/stores/auth.js:38-40`

```javascript
setStorage('isLoggedIn', true)
setStorage('userInfo', data)
```

**影响**: XSS 攻击可窃取用户信息  
**建议**: 使用 httpOnly cookie 或依赖后端 session 验证

---

## 三、MEDIUM 级别问题

### M-1. Element Plus 图标全量注册
**文件**: `src/main.js:28-30`

**影响**: 增加打包体积  
**建议**: 使用按需导入或 `unplugin-icons`

---

### M-2. ECharts 全量导入
**文件**: `src/views/admin/Dashboard.vue:139`

**影响**: 增加约 1MB 打包体积  
**建议**: 使用 `echarts/core` 按需导入

---

### M-3. 课程列表硬编码分页
**文件**: `src/views/course/CourseList.vue:120`

```javascript
const data = await getCourseList({ page: 1, pageSize: 100 })
```

**影响**: 课程增多时性能问题  
**建议**: 实现分页加载或无限滚动

---

### M-4. 请求拦截器注释掉
**文件**: `src/utils/request.js:13-27`

**影响**: 认证机制不清晰  
**建议**: 删除注释代码，明确认证方式

---

### M-5. 函数命名模糊
**文件**: `src/api/user.js:43`

```javascript
export const count = () => { ... }
```

**建议**: 重命名为 `getUserStats`

---

### M-6. 题型映射未完全统一
**文件**: 
- `src/views/wrong/WrongList.vue`
- `src/views/admin/QuestionManage.vue`

**问题**: 仍有本地定义的题型映射函数  
**建议**: 统一使用 `@/utils/helpers` 中的 `questionTypeMap`

---

## 四、LOW 级别问题

### L-1. console.log 残留
**文件**: 多个文件

**建议**: 使用 `if (import.meta.env.DEV)` 控制或删除

---

### L-2. 密码哈希无加盐
**文件**: `src/stores/auth.js:25-27`

**说明**: SHA256 仅防明文传输，需确保后端安全存储

---

### L-3. 注释代码未清理
**文件**: `src/views/exam/ExamMode.vue:531-536`, `src/views/exam/ExamMode.vue:648-667`

**建议**: 删除无用注释代码

---

### L-4. 反馈功能未对接 API
**文件**: `src/views/practice/PracticeMode.vue:842-860`

**说明**: 反馈提交仅有 console.log，需对接后端接口

---

## 五、优先级建议

| 优先级 | 问题 |
|--------|------|
| 🔴 立即修复 | H-1 计时器冲突、H-2 题型判断 |
| 🟡 尽快修复 | H-3 安全存储、M-1/M-2 性能优化 |
| 🟢 计划修复 | M-3~M-6、L-1~L-4 |

---

**审查人**: Claude Code Review
