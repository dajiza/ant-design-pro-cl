# Employee Management Page Design

## Overview

新增员工管理前端页面，参照 rooms 页面的简单 CRUD 模式。后端 API 已完成，仅做前端开发。

## API

Base path: `/api/v1/employees`

- `GET /` — 列表（分页、搜索）
- `POST /` — 创建
- `PATCH /:id` — 更新
- `DELETE /:id` — 删除
- `PATCH /:id` — 切换 active 状态（同 update 接口，只传 active 字段）

## Fields

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| firstName | string | 是 | 名 |
| lastName | string | 否 | 姓 |
| displayName | string | 否 | 显示名称（不传时后端自动拼接） |
| mobilePhone | string | 否 | 手机号 |
| email | string | 否 | 邮箱 |
| active | boolean | 否 | 在职状态，默认 true |

## Page Structure

```
src/pages/employees/
  index.tsx                       -- ProTable 列表页 + 状态管理
  components/
    EmployeeForm.tsx              -- 新建/编辑 Modal
```

## Table Columns

| 列 | 宽度 | 说明 |
|---|---|---|
| displayName | - | 名称，可点击打开编辑 |
| mobilePhone | 150px | 手机号 |
| email | 200px | 邮箱 |
| active | 80px | Switch 直接切换在职/离职 |
| createdAt | 180px | 创建时间 |
| 操作 | 120px | 编辑链接 / 删除 Popconfirm |

## Form Fields (Modal)

- firstName — Input，必填
- lastName — Input
- displayName — Input（提示：留空则自动拼接）
- mobilePhone — Input
- email — Input

## Files to Modify/Create

1. `src/services/ant-design-pro/typings.d.ts` — 新增 EmployeeItem, CreateEmployeeParams, UpdateEmployeeParams
2. `src/services/ant-design-pro/api.ts` — 新增 getEmployees, createEmployee, updateEmployee, deleteEmployee
3. `src/pages/employees/index.tsx` — 新建
4. `src/pages/employees/components/EmployeeForm.tsx` — 新建
5. `config/routes.ts` — 新增 /employees 路由
6. `src/locales/zh-CN/menu.ts` — 新增菜单名（如有多语言文件）
