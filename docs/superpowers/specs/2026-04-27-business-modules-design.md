# 业务模块前端页面设计

> 为 Location、Service Category、Service、Shift、Timeblock 五个模块创建前端管理页面，沿用 Staff 模块的 Drawer + Modal 模式。

## 1. 通用约定

- **UI 模式**：ProTable 列表 + Drawer 详情 + Modal 创建/编辑（中文 UI）
- **路由**：侧边栏平级展示
- **文件结构**：每个模块一个 `src/pages/<module>/` 目录
- **API**：统一添加到 `src/services/ant-design-pro/api.ts`
- **类型**：统一添加到 `src/services/ant-design-pro/typings.d.ts`
- **路由配置**：`config/routes.ts`
- **菜单国际化**：`src/locales/zh-CN/menu.ts`
- **后端项目**：`baredmonkey-crm-nest-api`，API 前缀 `/api/v1/`

## 2. 各模块设计

---

### 2.1 Location（门店管理）

**后端接口：**
- `GET /api/v1/locations` — 分页列表
- `GET /api/v1/locations/:id` — 详情
- `PATCH /api/v1/locations/:id` — 编辑（coordinates, externalId）
- `PATCH /api/v1/locations/:id/hours` — 编辑营业时间

**UI 设计：**
- **列表页**：ProTable，列：name、city/state、phone、tz、isRemote
  - 无创建/删除按钮（Location 由 Boulevard 同步，不支持手动创建）
- **Drawer 详情**：展示完整信息
  - 地址（line1, line2, city, state, zip, country）
  - 联系方式（phone, contactEmail, website）
  - 营业时间（周一~周日，每天 start/finish + open 开关）
  - 其他（tz, coordinates, externalId, paymentOptions）
  - 操作按钮：「编辑信息」「编辑营业时间」
- **编辑 Modal**：表单字段 — coordinates（latitude, longitude）、externalId
- **营业时间 Modal**：
  - 周一~周日，每天一行
  - Switch 控制 open
  - TimePicker 选择 start / finish（hour + min）
  - 提交调用 `PATCH /locations/:id/hours`

**新增文件：**
- `src/pages/locations/index.tsx`
- `src/pages/locations/components/LocationDrawer.tsx`
- `src/pages/locations/components/LocationEditModal.tsx`
- `src/pages/locations/components/LocationHoursModal.tsx`

---

### 2.2 Service Category（服务分类）

**后端接口：**
- `GET /api/v1/service-categories` — 分页列表
- `GET /api/v1/service-categories/:id` — 详情
- `POST /api/v1/service-categories` — 创建（name 必填）
- `PATCH /api/v1/service-categories/:id` — 编辑（name）

**UI 设计：**
- **列表页**：ProTable，列：name、active、sortPath、createdAt
  - 工具栏「新建分类」按钮
- **Drawer 详情**：展示 name、active、sortPath、createdAt、updatedAt
  - 操作按钮：「编辑」
- **创建/编辑 Modal**：表单字段 — name（必填）

**新增文件：**
- `src/pages/service-categories/index.tsx`
- `src/pages/service-categories/components/ServiceCategoryDrawer.tsx`
- `src/pages/service-categories/components/ServiceCategoryFormModal.tsx`

---

### 2.3 Service（服务项目）

**后端接口：**
- `GET /api/v1/services` — 分页列表
- `GET /api/v1/services/:id` — 详情
- `POST /api/v1/services` — 创建（name, categoryId 必填）
- `PATCH /api/v1/services/:id` — 编辑
- `POST /api/v1/services/:id/activate` — 激活（需 locationId）
- `POST /api/v1/services/:id/deactivate` — 停用（需 locationId）

**UI 设计：**
- **列表页**：ProTable，列：name、category（name）、defaultPrice（分转元）、defaultDuration（分钟）、addon（是/否）、active
  - 工具栏「新建服务」按钮
  - 支持 activate/deactivate 操作（需选 locationId，用 Select 弹窗）
- **Drawer 详情**：展示所有字段
  - 基本信息：name, description, addon, externalId
  - 分类：category.name
  - 定价：defaultPrice（元）、defaultDuration（分钟）
  - 状态：active、serviceStatus（active/bookable）
  - 操作按钮：「编辑」「激活/停用」
- **创建 Modal**：表单字段 — name（必填）、categoryId（必填，Select 下拉）、addon（Switch）、description（TextArea）、externalId
- **编辑 Modal**：同创建 + customFields 编辑
- **激活/停用 Modal**：选择 locationId（Select 下拉），确认操作

**新增文件：**
- `src/pages/services/index.tsx`
- `src/pages/services/components/ServiceDrawer.tsx`
- `src/pages/services/components/ServiceFormModal.tsx`
- `src/pages/services/components/ServiceActivateModal.tsx`

---

### 2.4 Shift（排班管理）

**后端接口：**
- `GET /api/v1/shifts` — 分页列表
- `GET /api/v1/shifts/:id` — 详情
- `GET /api/v1/shifts/staff/:staffId/location/:locationId` — 按员工+门店查询
- `POST /api/v1/shifts` — 创建
- `POST /api/v1/shifts/unpublish` — 取消发布

**数据结构（按星期模板）：**
- id: 复合主键 `staffId_locationId_day`
- day: 0-6（星期日~星期六）
- clockIn / clockOut: 时间字符串（如 "09:00:00"）
- available: 是否可用
- staffId / locationId
- bookingInterval: 预约间隔
- recurrence / recurrenceInterval / recurrenceStart / recurrenceEnd: 循环规则
- resourceId: 分配的资源 ID
- unavailableReason: 不可用原因

**UI 设计 — 周排班表视图：**
- **顶部工具栏**：
  - 门店 Select 筛选（默认选第一个）
  - 员工 Select 筛选（可选，空=全部）
  - 「新建排班」按钮
  - 「取消发布」按钮
- **主体 — 周排班表格**：
  - 横轴：周一 ~ 周日（7 列）
  - 纵轴：按员工分组，每个员工一行
  - 每个单元格显示：clockIn - clockOut、available 状态色块
  - available=true 绿色、available=false 灰色
  - 点击单元格 → 打开创建/编辑 Drawer
- **创建 Modal**：
  - staffId（必填，Select）
  - locationId（必填，Select）
  - day（必填，Select 周一~日）
  - clockIn（必填，TimePicker）
  - clockOut（必填，TimePicker）
  - available（必填，Switch，默认 true）
  - bookingInterval（选填，InputNumber）
  - recurrence（选填，Select：daily/weekly）
  - recurrenceInterval（选填，InputNumber）
  - recurrenceStart / recurrenceEnd（选填，DatePicker）
  - resourceId（选填，Input）
  - unavailableReason（选填，TextArea，available=false 时显示）
- **取消发布 Modal**：选择 staffId、locationId、day、startIso8601、endIso8601

**新增文件：**
- `src/pages/shifts/index.tsx`
- `src/pages/shifts/components/ShiftCreateModal.tsx`
- `src/pages/shifts/components/ShiftUnpublishModal.tsx`

---

### 2.5 Timeblock（时间块）

**后端接口：**
- `GET /api/v1/timeblocks` — 分页列表
- `GET /api/v1/timeblocks/:id` — 详情
- `POST /api/v1/timeblocks` — 创建
- `DELETE /api/v1/timeblocks/:id` — 删除

**UI 设计：**
- **列表页**：ProTable，列：title、staff（displayName）、location（name）、startAt、duration（秒转分钟）、reason、cancelled
  - 工具栏「新建时间块」按钮
- **Drawer 详情**：展示所有字段
  - title、reason（BUSINESS/PERSONAL）
  - staff 信息、location 信息
  - startAt、duration（分钟）
  - cancelled 状态
  - 操作按钮：「删除」（Popconfirm 确认）
- **创建 Modal**：
  - staffId（必填，Select）
  - locationId（必填，Select）
  - startTime（必填，DateTimePicker）
  - duration（必填，InputNumber，秒）
  - title（选填）
  - reason（选填，Select：BUSINESS/PERSONAL）
  - recurring（选填）：
    - frequency（Select：DAILY/WEEKLY）
    - interval（InputNumber）
    - endAfter: count（InputNumber）或 datetime（DateTimePicker）

**新增文件：**
- `src/pages/timeblocks/index.tsx`
- `src/pages/timeblocks/components/TimeblockDrawer.tsx`
- `src/pages/timeblocks/components/TimeblockCreateModal.tsx`

---

## 3. 路由配置

```ts
// config/routes.ts — 在 staff 路由后面添加
{ path: '/locations',        name: 'locations',         icon: 'environment',  component: './locations' },
{ path: '/service-categories', name: 'service-categories', icon: 'appstore',   component: './service-categories' },
{ path: '/services',         name: 'services',           icon: 'scissor',     component: './services' },
{ path: '/shifts',           name: 'shifts',             icon: 'schedule',    component: './shifts' },
{ path: '/timeblocks',       name: 'timeblocks',         icon: 'block',       component: './timeblocks' },
```

## 4. 菜单国际化

```ts
// src/locales/zh-CN/menu.ts
'menu.locations': '门店管理',
'menu.service-categories': '服务分类',
'menu.services': '服务项目',
'menu.shifts': '排班管理',
'menu.timeblocks': '时间块',
```

## 5. 文件变更清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `config/routes.ts` | 修改 | 添加 5 条路由 |
| `src/locales/zh-CN/menu.ts` | 修改 | 添加 5 条菜单翻译 |
| `src/services/ant-design-pro/typings.d.ts` | 修改 | 添加 5 组类型定义 |
| `src/services/ant-design-pro/api.ts` | 修改 | 添加 5 组 API 函数 |
| `src/pages/locations/` | 新建 | 4 个文件 |
| `src/pages/service-categories/` | 新建 | 3 个文件 |
| `src/pages/services/` | 新建 | 4 个文件 |
| `src/pages/shifts/` | 新建 | 3 个文件 |
| `src/pages/timeblocks/` | 新建 | 3 个文件 |

**共计**：修改 4 个文件 + 新建 17 个文件
