# 动态菜单接口技术文档

## 概述

本文档定义了后台管理系统动态菜单功能所需的后端接口规范。通过该接口，前端可以根据用户角色动态获取并渲染后台管理菜单。

---

## 接口定义

### 1. 获取当前用户的菜单列表

#### 接口信息
- **接口路径**: `/admin/menus` 或 `/admin/user/menus`
- **请求方式**: `GET`
- **认证方式**: 需要携带用户登录凭证（sa-token）
- **权限要求**: 需要管理员权限（roleId: 1, 2 或其他管理角色）

#### 请求参数
无需额外参数，后端从当前登录会话中获取用户信息。

#### 响应格式

**成功响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "数据统计",
      "path": "/admin/dashboard",
      "icon": "DataAnalysis",
      "sort": 1
    },
    {
      "id": 2,
      "name": "用户管理",
      "path": "/admin/users",
      "icon": "User",
      "sort": 2
    },
    {
      "id": 3,
      "name": "角色管理",
      "path": "/admin/roles",
      "icon": "Avatar",
      "sort": 3
    },
    {
      "id": 4,
      "name": "课程管理",
      "path": "/admin/courses",
      "icon": "Reading",
      "sort": 4
    },
    {
      "id": 5,
      "name": "章节管理",
      "path": "/admin/chapters",
      "icon": "Notebook",
      "sort": 5
    },
    {
      "id": 6,
      "name": "题目管理",
      "path": "/admin/questions",
      "icon": "Document",
      "sort": 6
    },
    {
      "id": 7,
      "name": "题目上传",
      "path": "/admin/upload",
      "icon": "Upload",
      "sort": 7
    },
    {
      "id": 8,
      "name": "记录管理",
      "path": "/admin/traces",
      "icon": "Tickets",
      "sort": 8
    }
  ]
}
```

**失败响应示例：**
```json
{
  "code": 401,
  "message": "未登录或登录已过期",
  "data": null
}
```

```json
{
  "code": 403,
  "message": "无权限访问",
  "data": null
}
```

#### 响应字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | Integer | 是 | 状态码，200 表示成功 |
| message | String | 是 | 响应消息 |
| data | Array | 是 | 菜单列表数组，无权限时为空数组 [] |

**菜单对象字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | Integer | 是 | 菜单唯一标识 |
| name | String | 是 | 菜单显示名称（中文） |
| path | String | 是 | 前端路由路径，必须以 `/admin/` 开头 |
| icon | String | 是 | 图标名称，对应 Element Plus Icons 组件名 |
| sort | Integer | 否 | 排序序号，数字越小越靠前，可选字段 |

---

## 后端实现逻辑

### 1. 获取用户角色
```java
// 伪代码示例
Long userId = StpUtil.getLoginIdAsLong(); // 从 sa-token 获取当前用户ID
User user = userService.getById(userId);
Long roleId = user.getRoleId();
```

### 2. 查询角色权限
```sql
-- 从 permission_role 表获取该角色的所有权限ID
SELECT permission_id 
FROM permission_role 
WHERE role_id = #{roleId}
```

### 3. 查询菜单信息
```sql
-- 从 permission 表获取权限对应的菜单信息
-- 假设 permission 表需要增加以下字段：path, icon, sort, type
SELECT id, name, path, icon, sort
FROM permission
WHERE id IN (权限ID列表)
  AND type = 'menu'  -- 只查询菜单类型的权限（如果有区分菜单和按钮权限）
ORDER BY sort ASC
```

### 4. 返回菜单数据
根据查询结果组装返回数据。

---

## 数据库设计建议

### 方案一：扩展现有 permission 表（推荐）

在现有的 `permission` 表中增加字段：

```sql
ALTER TABLE permission ADD COLUMN path VARCHAR(255) COMMENT '菜单路径';
ALTER TABLE permission ADD COLUMN icon VARCHAR(100) COMMENT '菜单图标';
ALTER TABLE permission ADD COLUMN sort INT DEFAULT 0 COMMENT '排序序号';
ALTER TABLE permission ADD COLUMN type VARCHAR(20) DEFAULT 'menu' COMMENT '权限类型：menu-菜单, button-按钮';
```

**示例数据：**
```sql
-- 插入菜单权限数据
INSERT INTO permission (id, name, english, path, title, component, icon, sort, router_name) VALUES
(1, '数据统计', 'dashboard', '/admin/dashboard', '数据统计', 'Dashboard', 'DataAnalysis', 1, 'AdminDashboard'),
(2, '用户管理', 'user', '/admin/users', '用户管理', 'UserManage', 'User', 2, 'UserManage'),
(3, '角色管理', 'role', '/admin/roles', '角色管理', 'RoleManage', 'Avatar', 3, 'RoleManage'),
(4, '课程管理', 'course', '/admin/courses', '课程管理', 'CourseManage', 'Reading', 4, 'CourseManage'),
(5, '章节管理', 'chapter', '/admin/chapters', '章节管理', 'ChapterManage', 'Notebook', 5, 'ChapterManage'),
(6, '题目管理', 'question', '/admin/questions', '题目管理', 'QuestionManage', 'Document', 6, 'QuestionManage'),
(7, '题目上传', 'upload', '/admin/upload', '题目上传', 'QuestionUpload', 'Upload', 7, 'QuestionUpload'),
(8, '记录管理', 'trace', '/admin/traces', '记录管理', 'TraceManage', 'Tickets', 8, 'TraceManage');

-- 如果需要更新现有数据，使用以下语句：
UPDATE permission SET path = '/admin/dashboard', title = '数据统计', component = 'Dashboard', icon = 'DataAnalysis', sort = 1, router_name = 'AdminDashboard' WHERE id = 1;
UPDATE permission SET path = '/admin/users', title = '用户管理', component = 'UserManage', icon = 'User', sort = 2, router_name = 'UserManage' WHERE id = 2;
UPDATE permission SET path = '/admin/roles', title = '角色管理', component = 'RoleManage', icon = 'Avatar', sort = 3, router_name = 'RoleManage' WHERE id = 3;
UPDATE permission SET path = '/admin/courses', title = '课程管理', component = 'CourseManage', icon = 'Reading', sort = 4, router_name = 'CourseManage' WHERE id = 4;
UPDATE permission SET path = '/admin/chapters', title = '章节管理', component = 'ChapterManage', icon = 'Notebook', sort = 5, router_name = 'ChapterManage' WHERE id = 5;
UPDATE permission SET path = '/admin/questions', title = '题目管理', component = 'QuestionManage', icon = 'Document', sort = 6, router_name = 'QuestionManage' WHERE id = 6;
UPDATE permission SET path = '/admin/upload', title = '题目上传', component = 'QuestionUpload', icon = 'Upload', sort = 7, router_name = 'QuestionUpload' WHERE id = 7;
UPDATE permission SET path = '/admin/traces', title = '记录管理', component = 'TraceManage', icon = 'Tickets', sort = 8, router_name = 'TraceManage' WHERE id = 8;
```

**字段说明：**
- `id`: 权限唯一标识
- `name`: 权限名称（中文）
- `english`: 权限标识（英文）
- `path`: 前端路由路径
- `title`: 菜单标题（显示在浏览器标签和面包屑）
- `component`: 对应的 Vue 组件名称
- `icon`: Element Plus 图标名称
- `sort`: 排序序号
- `router_name`: Vue Router 路由名称

### 方案二：创建独立的 menu 表

如果需要更灵活的菜单管理，可以创建独立的 `menu` 表：

```sql
CREATE TABLE menu (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '菜单名称',
  path VARCHAR(255) NOT NULL COMMENT '菜单路径',
  icon VARCHAR(100) COMMENT '菜单图标',
  sort INT DEFAULT 0 COMMENT '排序序号',
  permission_id BIGINT COMMENT '关联的权限ID',
  parent_id BIGINT DEFAULT 0 COMMENT '父级菜单ID，0表示顶级菜单',
  is_visible TINYINT DEFAULT 1 COMMENT '是否显示：1-显示，0-隐藏',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (permission_id) REFERENCES permission(id)
);
```

---

## 图标名称参考

前端使用 Element Plus Icons，以下是常用图标名称：

| 图标名称 | 说明 | 适用菜单 |
|---------|------|---------|
| DataAnalysis | 数据分析图标 | 数据统计 |
| User | 用户图标 | 用户管理 |
| Avatar | 头像/角色图标 | 角色管理 |
| Reading | 阅读/书籍图标 | 课程管理 |
| Notebook | 笔记本图标 | 章节管理 |
| Document | 文档图标 | 题目管理 |
| Upload | 上传图标 | 题目上传 |
| Tickets | 票据/记录图标 | 记录管理 |
| Setting | 设置图标 | 系统设置 |
| Grid | 网格图标 | 模块管理 |

更多图标请参考：https://element-plus.org/zh-CN/component/icon.html

---

## 角色权限配置示例

基于现有数据库结构，以下是角色与菜单权限的对应关系：

### 超级管理员（roleId: 1）
拥有全部菜单权限：
```sql
INSERT INTO permission_role (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8);
```

### 普通管理员（roleId: 2）
拥有除角色管理外的权限：
```sql
INSERT INTO permission_role (role_id, permission_id) VALUES
(2, 1), (2, 2), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8);
```

### 课程编辑员（roleId: 150001）
仅拥有课程相关权限：
```sql
INSERT INTO permission_role (role_id, permission_id) VALUES
(150001, 4), (150001, 5), (150001, 6), (150001, 7);
```

---

## 安全注意事项

1. **必须验证用户登录状态**：确保请求携带有效的 sa-token
2. **必须验证管理员权限**：普通用户（roleId: 3）不应访问此接口
3. **只返回用户有权限的菜单**：避免泄露系统功能结构
4. **防止越权访问**：即使前端隐藏了菜单，后端路由也要验证权限

---

## 前端调用示例

```javascript
// src/api/admin.js
export const getMenuList = () => {
  return request({
    url: '/admin/menus',
    method: 'GET'
  })
}

// 使用示例
import { getMenuList } from '@/api/admin'

const menus = await getMenuList()
console.log(menus) // [{ id: 1, name: '数据统计', path: '/admin/dashboard', ... }]
```

---

## 测试用例

### 测试场景 1：超级管理员获取菜单
- **用户角色**：roleId = 1
- **期望结果**：返回全部 8 个菜单项

### 测试场景 2：普通管理员获取菜单
- **用户角色**：roleId = 2
- **期望结果**：返回 7 个菜单项（不包含"角色管理"）

### 测试场景 3：课程编辑员获取菜单
- **用户角色**：roleId = 150001
- **期望结果**：返回 4 个菜单项（课程管理、章节管理、题目管理、题目上传）

### 测试场景 4：普通用户访问
- **用户角色**：roleId = 3
- **期望结果**：返回 403 或空数组

### 测试场景 5：未登录用户访问
- **期望结果**：返回 401 未授权

---

## 后续扩展建议

1. **多级菜单支持**：增加 `parent_id` 字段支持子菜单
2. **菜单缓存**：考虑使用 Redis 缓存用户菜单，减少数据库查询
3. **动态路由**：配合前端实现完全动态的路由系统
4. **按钮级权限**：扩展 `type` 字段，支持页面内按钮权限控制
5. **菜单国际化**：增加多语言支持

---

## 联系方式

如有接口实现问题，请联系前端开发团队。

**文档版本**: v1.0  
**更新日期**: 2025-12-23
