# 业务模块前端页面实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Location、Service Category、Service、Shift、Timeblock 五个模块创建前端管理页面

**Architecture:** 沿用 Staff 模块的 ProTable + Drawer + Modal 模式。每个模块独立一个 pages 目录。API 和类型分别追加到 `api.ts` 和 `typings.d.ts`。Shift 使用周排班表视图。

**Tech Stack:** React 19 + Ant Design 6 + @ant-design/pro-components (ProTable, PageContainer) + UmiJS Max

**参考模式:** `src/pages/staff/` 目录下的 index.tsx / StaffDrawer.tsx / StaffFormModal.tsx / StaffLocationModal.tsx

---

## Task 1: 基础设施 — 类型定义

**Files:**
- Modify: `src/services/ant-design-pro/typings.d.ts` (在文件末尾 `}` 之前追加)

- [ ] **Step 1: 在 typings.d.ts 的 `}` 闭合前添加 5 组类型**

```typescript
  // ===== Location Hours Types =====
  type LocationHoursInput = {
    open: boolean;
    start: { hour: number; min: number };
    finish: { hour: number; min: number };
  };

  type UpdateLocationParams = {
    coordinates?: { latitude: number; longitude: number };
    externalId?: string;
  };

  // ===== Service Category Types =====
  type ServiceCategoryItem = {
    id: string;
    name: string;
    active: boolean;
    sortPath?: string | null;
    services?: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
  };

  type ServiceCategoryList = {
    data: ServiceCategoryItem[];
    hasNextPage: boolean;
  };

  type CreateServiceCategoryParams = {
    name: string;
  };

  type UpdateServiceCategoryParams = {
    name?: string;
  };

  // ===== Service Types =====
  type ServiceItem = {
    id: string;
    name: string;
    active: boolean;
    addon: boolean;
    description?: string | null;
    externalId?: string | null;
    categoryId: string;
    category: { id: string; name: string };
    defaultDuration: number;
    defaultPrice: number;
    sortPath: string;
    custom?: Record<string, any>;
    customFields?: Record<string, any>[];
    serviceStatus?: { active: boolean; bookable: boolean };
    serviceOverrides?: Record<string, any>;
    serviceOptionGroups?: Record<string, any>[];
    addons?: Record<string, any>[];
    createdAt: string;
    updatedAt: string;
  };

  type ServiceList = {
    data: ServiceItem[];
    total: number;
  };

  type CreateServiceParams = {
    name: string;
    categoryId: string;
    addon?: boolean;
    description?: string;
    externalId?: string;
  };

  type UpdateServiceParams = {
    name?: string;
    categoryId?: string;
    addon?: boolean;
    description?: string;
    externalId?: string;
    customFields?: { key: string; textValue?: string; booleanValue?: boolean; integerValue?: number; floatValue?: number }[];
  };

  type ActivateServiceParams = {
    locationId: string;
  };

  // ===== Shift Types =====
  type ShiftItem = {
    id: string;
    available: boolean;
    day?: number | null;
    clockIn?: string | null;
    clockOut?: string | null;
    locationId: string;
    bookingInterval?: number | null;
    recurrence?: string | null;
    recurrenceEnd?: string | null;
    recurrenceInterval?: number | null;
    recurrenceStart?: string | null;
    resourceId?: string | null;
    staffId?: string | null;
    unavailableReason?: string | null;
  };

  type ShiftList = {
    data: ShiftItem[];
    hasNextPage: boolean;
  };

  type CreateShiftParams = {
    staffId: string;
    locationId: string;
    available: boolean;
    day?: number | null;
    clockIn: string;
    clockOut: string;
    bookingInterval?: number | null;
    recurrence?: string | null;
    recurrenceEnd?: string | null;
    recurrenceInterval?: number | null;
    recurrenceStart?: string | null;
    resourceId?: string | null;
    unavailableReason?: string | null;
  };

  type UnpublishShiftParams = {
    staffId: string;
    locationId: string;
    day: number;
    startIso8601: string;
    endIso8601?: string;
  };

  // ===== Timeblock Types =====
  type TimeblockItem = {
    id: string;
    cancelled?: boolean | null;
    duration: number;
    endAt: string;
    location: { id: string; name?: string };
    reason?: 'BUSINESS' | 'PERSONAL' | null;
    staff: { id: string; firstName?: string; lastName?: string; displayName?: string };
    staffId: string;
    startAt: string;
    title?: string | null;
  };

  type TimeblockList = {
    data: TimeblockItem[];
    hasNextPage: boolean;
  };

  type CreateTimeblockParams = {
    staffId: string;
    locationId: string;
    startTime: string;
    duration: number;
    title?: string;
    reason?: 'BUSINESS' | 'PERSONAL';
    recurring?: {
      frequency: string;
      interval: number;
      endAfter?: { count?: number; datetime?: string };
    };
  };
```

- [ ] **Step 2: Commit**
```bash
git add src/services/ant-design-pro/typings.d.ts
git commit -m "feat: add type definitions for location, service-category, service, shift, timeblock"
```

---

## Task 2: 基础设施 — API 函数

**Files:**
- Modify: `src/services/ant-design-pro/api.ts` (在文件末尾追加)

- [ ] **Step 1: 在 api.ts 末尾追加 5 组 API 函数**

```typescript
// ===== Location API =====

/** 编辑门店信息 PATCH /api/v1/locations/:id */
export async function updateLocation(id: string, data: API.UpdateLocationParams, options?: { [key: string]: any }) {
  return request<API.LocationItem>(`/api/v1/locations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 编辑门店营业时间 PATCH /api/v1/locations/:id/hours */
export async function updateLocationHours(id: string, hours: API.LocationHoursInput[], options?: { [key: string]: any }) {
  return request<API.LocationItem>(`/api/v1/locations/${id}/hours`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { hours },
    ...(options || {}),
  });
}

// ===== Service Category API =====

/** 获取服务分类列表 GET /api/v1/service-categories */
export async function getServiceCategories(params?: { page?: number; limit?: number }, options?: { [key: string]: any }) {
  return request<API.ServiceCategoryList>('/api/v1/service-categories', {
    method: 'GET',
    params: { page: params?.page || 1, limit: params?.limit || 10 },
    ...(options || {}),
  });
}

/** 获取服务分类详情 GET /api/v1/service-categories/:id */
export async function getServiceCategory(id: string, options?: { [key: string]: any }) {
  return request<API.ServiceCategoryItem>(`/api/v1/service-categories/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建服务分类 POST /api/v1/service-categories */
export async function createServiceCategory(data: API.CreateServiceCategoryParams, options?: { [key: string]: any }) {
  return request<API.ServiceCategoryItem>('/api/v1/service-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 更新服务分类 PATCH /api/v1/service-categories/:id */
export async function updateServiceCategory(id: string, data: API.UpdateServiceCategoryParams, options?: { [key: string]: any }) {
  return request<API.ServiceCategoryItem>(`/api/v1/service-categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

// ===== Service API =====

/** 获取服务列表 GET /api/v1/services */
export async function getServices(params?: { page?: number; limit?: number }, options?: { [key: string]: any }) {
  return request<API.ServiceList>('/api/v1/services', {
    method: 'GET',
    params: { page: params?.page || 1, limit: params?.limit || 10 },
    ...(options || {}),
  });
}

/** 获取服务详情 GET /api/v1/services/:id */
export async function getService(id: string, options?: { [key: string]: any }) {
  return request<API.ServiceItem>(`/api/v1/services/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建服务 POST /api/v1/services */
export async function createService(data: API.CreateServiceParams, options?: { [key: string]: any }) {
  return request<API.ServiceItem>('/api/v1/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 更新服务 PATCH /api/v1/services/:id */
export async function updateService(id: string, data: API.UpdateServiceParams, options?: { [key: string]: any }) {
  return request<API.ServiceItem>(`/api/v1/services/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 激活服务 POST /api/v1/services/:id/activate */
export async function activateService(id: string, data: API.ActivateServiceParams, options?: { [key: string]: any }) {
  return request<{ serviceId: string; locationId: string; active: boolean }>(`/api/v1/services/${id}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 停用服务 POST /api/v1/services/:id/deactivate */
export async function deactivateService(id: string, data: API.ActivateServiceParams, options?: { [key: string]: any }) {
  return request<{ serviceId: string; locationId: string; active: boolean }>(`/api/v1/services/${id}/deactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

// ===== Shift API =====

/** 获取排班列表 GET /api/v1/shifts */
export async function getShifts(params?: { page?: number; limit?: number }, options?: { [key: string]: any }) {
  return request<API.ShiftList>('/api/v1/shifts', {
    method: 'GET',
    params: { page: params?.page || 1, limit: params?.limit || 100 },
    ...(options || {}),
  });
}

/** 获取排班详情 GET /api/v1/shifts/:id */
export async function getShift(id: string, options?: { [key: string]: any }) {
  return request<API.ShiftItem>(`/api/v1/shifts/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 按员工+门店查询排班 GET /api/v1/shifts/staff/:staffId/location/:locationId */
export async function getShiftsByStaffAndLocation(staffId: string, locationId: string, options?: { [key: string]: any }) {
  return request<API.ShiftItem[]>(`/api/v1/shifts/staff/${staffId}/location/${locationId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建排班 POST /api/v1/shifts */
export async function createShift(data: API.CreateShiftParams, options?: { [key: string]: any }) {
  return request<API.ShiftItem>('/api/v1/shifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 取消发布排班 POST /api/v1/shifts/unpublish */
export async function unpublishShift(data: API.UnpublishShiftParams, options?: { [key: string]: any }) {
  return request('/api/v1/shifts/unpublish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

// ===== Timeblock API =====

/** 获取时间块列表 GET /api/v1/timeblocks */
export async function getTimeblocks(params?: { page?: number; limit?: number }, options?: { [key: string]: any }) {
  return request<API.TimeblockList>('/api/v1/timeblocks', {
    method: 'GET',
    params: { page: params?.page || 1, limit: params?.limit || 10 },
    ...(options || {}),
  });
}

/** 获取时间块详情 GET /api/v1/timeblocks/:id */
export async function getTimeblock(id: string, options?: { [key: string]: any }) {
  return request<API.TimeblockItem>(`/api/v1/timeblocks/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建时间块 POST /api/v1/timeblocks */
export async function createTimeblock(data: API.CreateTimeblockParams, options?: { [key: string]: any }) {
  return request<API.TimeblockItem>('/api/v1/timeblocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 删除时间块 DELETE /api/v1/timeblocks/:id */
export async function deleteTimeblock(id: string, options?: { [key: string]: any }) {
  return request(`/api/v1/timeblocks/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}
```

- [ ] **Step 2: Commit**
```bash
git add src/services/ant-design-pro/api.ts
git commit -m "feat: add API functions for location, service-category, service, shift, timeblock"
```

---

## Task 3: 基础设施 — 路由与菜单

**Files:**
- Modify: `config/routes.ts` (在 staff 路由后、kanban 路由前添加)
- Modify: `src/locales/zh-CN/menu.ts` (追加)

- [ ] **Step 1: 在 routes.ts 的 `/staff` 路由后添加 5 条路由**

在 `component: './staff'` 那一项后面添加：

```typescript
  {
    path: '/locations',
    name: 'locations',
    icon: 'environment',
    component: './locations',
  },
  {
    path: '/service-categories',
    name: 'service-categories',
    icon: 'appstore',
    component: './service-categories',
  },
  {
    path: '/services',
    name: 'services',
    icon: 'scissor',
    component: './services',
  },
  {
    path: '/shifts',
    name: 'shifts',
    icon: 'schedule',
    component: './shifts',
  },
  {
    path: '/timeblocks',
    name: 'timeblocks',
    icon: 'stop',
    component: './timeblocks',
  },
```

- [ ] **Step 2: 在 menu.ts 末尾追加菜单翻译**

```typescript
'menu.locations': '门店管理',
'menu.service-categories': '服务分类',
'menu.services': '服务项目',
'menu.shifts': '排班管理',
'menu.timeblocks': '时间块',
```

- [ ] **Step 3: Commit**
```bash
git add config/routes.ts src/locales/zh-CN/menu.ts
git commit -m "feat: add routes and menu items for 5 business modules"
```

---

## Task 4: Location 门店管理页面

**Files:**
- Create: `src/pages/locations/index.tsx`
- Create: `src/pages/locations/components/LocationDrawer.tsx`
- Create: `src/pages/locations/components/LocationEditModal.tsx`
- Create: `src/pages/locations/components/LocationHoursModal.tsx`

参考 `src/pages/staff/index.tsx` 的模式。Location 是只读+编辑，无创建/删除。

- [ ] **Step 1: 创建 `src/pages/locations/index.tsx`**

ProTable 列表页，列：name、city/state、phone、tz、isRemote。无新建按钮。点击行打开 Drawer。用 `getLocations` API。

- [ ] **Step 2: 创建 `src/pages/locations/components/LocationDrawer.tsx`**

Drawer 详情：地址、联系方式、营业时间（周一~日表格）、其他信息。底部有「编辑信息」和「编辑营业时间」按钮。

- [ ] **Step 3: 创建 `src/pages/locations/components/LocationEditModal.tsx`**

Modal 表单：coordinates（latitude/longitude 两个 InputNumber）、externalId（Input）。调用 `updateLocation`。

- [ ] **Step 4: 创建 `src/pages/locations/components/LocationHoursModal.tsx`**

Modal 表单：7 天营业时间编辑器。每天一行：Switch（open）+ TimePicker（start hour:min）+ TimePicker（finish hour:min）。调用 `updateLocationHours`。

- [ ] **Step 5: Commit**
```bash
git add src/pages/locations/
git commit -m "feat: add location management page"
```

---

## Task 5: Service Category 服务分类页面

**Files:**
- Create: `src/pages/service-categories/index.tsx`
- Create: `src/pages/service-categories/components/ServiceCategoryDrawer.tsx`
- Create: `src/pages/service-categories/components/ServiceCategoryFormModal.tsx`

最简单的 CRUD 模块，参考 StaffFormModal 模式。

- [ ] **Step 1: 创建 `src/pages/service-categories/index.tsx`**

ProTable 列表页，列：name、active（Tag）、sortPath、createdAt。工具栏「新建分类」按钮。点击行打开 Drawer。

- [ ] **Step 2: 创建 `src/pages/service-categories/components/ServiceCategoryDrawer.tsx`**

Drawer 详情：name、active、sortPath、创建/更新时间。底部「编辑」按钮打开 FormModal。

- [ ] **Step 3: 创建 `src/pages/service-categories/components/ServiceCategoryFormModal.tsx`**

Modal 表单：name（必填）。isEdit 模式回填。复用 createServiceCategory / updateServiceCategory。

- [ ] **Step 4: Commit**
```bash
git add src/pages/service-categories/
git commit -m "feat: add service category management page"
```

---

## Task 6: Service 服务项目页面

**Files:**
- Create: `src/pages/services/index.tsx`
- Create: `src/pages/services/components/ServiceDrawer.tsx`
- Create: `src/pages/services/components/ServiceFormModal.tsx`
- Create: `src/pages/services/components/ServiceActivateModal.tsx`

标准 CRUD + activate/deactivate。需要加载 service-categories 列表作为 Select 选项。

- [ ] **Step 1: 创建 `src/pages/services/index.tsx`**

ProTable 列表页，列：name、category.name、defaultPrice（分转元）、defaultDuration（分钟）、addon（是/否 Tag）、active（Tag）。工具栏「新建服务」按钮。点击行打开 Drawer。

- [ ] **Step 2: 创建 `src/pages/services/components/ServiceDrawer.tsx`**

Drawer 详情：基本信息、分类、定价、状态、serviceStatus。底部「编辑」「激活/停用」按钮。

- [ ] **Step 3: 创建 `src/pages/services/components/ServiceFormModal.tsx`**

Modal 表单：name（必填）、categoryId（必填 Select，从 service-categories 加载）、addon（Switch）、description（TextArea）、externalId（Input）。

- [ ] **Step 4: 创建 `src/pages/services/components/ServiceActivateModal.tsx`**

Modal：Select locationId，确认按钮。调用 activateService 或 deactivateService。

- [ ] **Step 5: Commit**
```bash
git add src/pages/services/
git commit -m "feat: add service management page"
```

---

## Task 7: Shift 排班管理页面

**Files:**
- Create: `src/pages/shifts/index.tsx`
- Create: `src/pages/shifts/components/ShiftCreateModal.tsx`
- Create: `src/pages/shifts/components/ShiftUnpublishModal.tsx`

周排班表视图。横轴周一~周日，按员工分组。顶部有门店/员工筛选。用 `getShifts` API 获取数据后按 day 映射到表格。

- [ ] **Step 1: 创建 `src/pages/shifts/index.tsx`**

顶部工具栏：门店 Select + 员工 Select + 「新建排班」按钮 + 「取消发布」按钮。
主体：Ant Design Table，columns = ['员工', '周一'~'周日']。dataSource 按 staffId 分组，每个单元格显示 clockIn-clockOut 和 available 状态色块。
数据加载：getShifts 获取全部数据，前端按 staffId 和 day 映射到表格。点击单元格打开创建 Modal。

- [ ] **Step 2: 创建 `src/pages/shifts/components/ShiftCreateModal.tsx`**

Modal 表单：staffId（必填 Select）、locationId（必填 Select）、day（必填 Select 0-6）、clockIn（必填 TimePicker）、clockOut（必填 TimePicker）、available（Switch 默认 true）、bookingInterval（InputNumber）、recurrence（Select）、recurrenceInterval（InputNumber）、recurrenceStart/End（DatePicker）、unavailableReason（TextArea，available=false 时显示）。

- [ ] **Step 3: 创建 `src/pages/shifts/components/ShiftUnpublishModal.tsx`**

Modal 表单：staffId（Select）、locationId（Select）、day（Select 0-6）、startIso8601（Input）、endIso8601（Input）。调用 unpublishShift。

- [ ] **Step 4: Commit**
```bash
git add src/pages/shifts/
git commit -m "feat: add shift management page with weekly schedule view"
```

---

## Task 8: Timeblock 时间块页面

**Files:**
- Create: `src/pages/timeblocks/index.tsx`
- Create: `src/pages/timeblocks/components/TimeblockDrawer.tsx`
- Create: `src/pages/timeblocks/components/TimeblockCreateModal.tsx`

简单列表 + 创建 + 删除，无编辑。

- [ ] **Step 1: 创建 `src/pages/timeblocks/index.tsx`**

ProTable 列表页，列：title、staff.displayName、location.name、startAt、duration（秒转分钟）、reason（Tag）、cancelled（Tag）。工具栏「新建时间块」按钮。点击行打开 Drawer。

- [ ] **Step 2: 创建 `src/pages/timeblocks/components/TimeblockDrawer.tsx`**

Drawer 详情：title、reason、staff 信息、location 信息、startAt、duration（分钟）、cancelled 状态。底部「删除」按钮（Popconfirm 确认）调用 deleteTimeblock。

- [ ] **Step 3: 创建 `src/pages/timeblocks/components/TimeblockCreateModal.tsx`**

Modal 表单：staffId（必填 Select）、locationId（必填 Select）、startTime（必填 DateTimePicker）、duration（必填 InputNumber 秒）、title（Input）、reason（Select BUSINESS/PERSONAL）、recurring 设置区域（frequency Select、interval InputNumber、endAfter count/datetime）。

- [ ] **Step 4: Commit**
```bash
git add src/pages/timeblocks/
git commit -m "feat: add timeblock management page"
```

---

## Task 9: 编译验证

- [ ] **Step 1: 运行 TypeScript 编译检查**
```bash
cd /Users/cs/Desktop/workspace/c/ant-design-pro-cl && npx tsc --noEmit 2>&1 | head -50
```
修复所有类型错误。

- [ ] **Step 2: 运行 dev server 验证页面可访问**
```bash
cd /Users/cs/Desktop/workspace/c/ant-design-pro-cl && npm run dev
```
浏览器逐个访问 /locations、/service-categories、/services、/shifts、/timeblocks 确认页面渲染正常。

- [ ] **Step 3: Final commit**
```bash
git add -A
git commit -m "feat: complete 5 business module frontend pages"
```
