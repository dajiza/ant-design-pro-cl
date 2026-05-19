# Multi-Service 时间排列模式

## 概述

新建预约 Step 2 增加「时间排列方式」选择，支持两种模式：
- 紧凑排列（Back-to-Back）：所有服务自动紧挨排列，只需选一个开始时间
- 自定义间隔：为每个服务分别选择开始时间（现有行为）

## 改动范围

只修改 `src/pages/appointments/new/index.tsx`，无新文件。

## Step 2 UI

在服务列表底部、按钮上方增加 Radio.Group：
- 选项：紧凑排列（默认）/ 自定义间隔
- 仅当 `selectedServiceIds.length >= 2` 时显示
- 新增状态 `timeMode: 'back-to-back' | 'custom'`，默认 `'back-to-back'`

## Step 3 行为

### 紧凑排列
- 选日期后，查询第一个 service 的可用时间
- 用户只选一个开始时间
- `handleStep3Next` 时传 `services` 不带每个 service 的 `startAt`，只传预约级别的 `startAt`

### 自定义间隔
- 保持现有逐个 service 选时间的行为不变

## Step 4 确认页

- 紧凑模式：显示开始时间，每个 service 标注「自动排列」
- 自定义模式：保持现有显示

## 数据流

### 紧凑排列
```
PATCH /booking/:id { services: [{ serviceId, staffId, employeeId }] }  // 无 startAt
→ PATCH /booking/:id { startAt: "2026-05-20T10:00:00Z" }
→ POST /booking/:id/complete
```

### 自定义间隔
```
PATCH /booking/:id { services: [{ serviceId, staffId, employeeId, startAt }] }  // 每个 service 有 startAt
→ PATCH /booking/:id { startAt: earliest }
→ POST /booking/:id/complete
```
