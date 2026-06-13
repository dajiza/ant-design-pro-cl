# Deposits 管理页面 & Checkout 类型同步 — 前端设计

## 背景

后端新增了押金/违约金/其他收款（Deposits）模块，基于 Square Payment Links 实现远程支付。前端需新增独立管理页面，并同步更新现有 Checkout 类型以匹配后端文档。

## 范围

1. **新增 Deposits 独立管理页面** — API 函数、类型定义、页面组件、路由
2. **同步更新 Checkout 类型** — `CheckoutResponse` 中的 order/payment 字段对齐后端文档

## 类型层 (`typings.d.ts`)

### 新增类型

```typescript
type DepositOrderType = 'DEPOSIT' | 'PENALTY_AMOUNT' | 'OTHER';

type DepositStatus = 'INIT' | 'ING' | 'PAID' | 'CANCELED';

interface DepositOrder {
  id: string;
  locationId: string;
  clientId: string;
  amount: number;
  orderType: DepositOrderType;
  status: DepositStatus;
  title: string;
  memo: string | null;
  appointmentId: string | null;
  staffId: string | null;
  paymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DepositPayment {
  id: string;
  depositId: string;
  amount: number;
  paymentLinkUrl: string | null;
  squarePaymentLinkId: string | null;
  squareOrderId: string | null;
  squarePaymentResult: any | null;
  status: DepositStatus;
  createdAt: string;
  updatedAt: string;
}

interface CreateDepositParams {
  locationId: string;
  clientId: string;
  amount: number;
  orderType: DepositOrderType;
  title: string;
  memo?: string;
  appointmentId?: string;
  staffId?: string;
}

interface DepositListParams {
  locationId?: string;
  clientId?: string;
  appointmentId?: string;
  status?: DepositStatus;
  orderType?: DepositOrderType;
  page?: number;
  limit?: number;
}

interface DepositDetailResponse {
  deposit: DepositOrder;
  payment: DepositPayment | null;
}

interface DepositListResponse {
  data: DepositOrder[];
  total: number;
}
```

### 更新 Checkout 类型

`CheckoutResponse.order` 添加: `staffId`, `gratuityStaffId`, `createdAt`, `updatedAt`
`CheckoutResponse.payment` 添加: `orderId`, `appointmentId`, `createdAt`, `updatedAt`
移除 order 中不存在的字段: `number`, `clientId`, `locationId`, `note`, `initialFeeAmount`, `currentFeeAmount`, `paymentGroups`

## API 层 (`api.ts`)

新增 6 个函数：

| 函数 | 方法 | 端点 |
|------|------|------|
| `createDeposit(data)` | POST | `/v1/deposits` |
| `getDeposits(params)` | GET | `/v1/deposits` |
| `getDepositDetail(id)` | GET | `/v1/deposits/:id` |
| `generatePaymentLink(id)` | POST | `/v1/deposits/:id/payment-link` |
| `cancelDeposit(id, data?)` | POST | `/v1/deposits/:id/cancel` |
| `updateDepositStatus(id, data)` | PATCH | `/v1/deposits/:id/status` |

## 页面结构

```
src/pages/deposits/
├── index.tsx                          — 主列表页 (ProTable)
├── components/
│   ├── CreateDepositModal.tsx         — 创建订单弹窗
│   ├── DepositDetailDrawer.tsx        — 详情抽屉
│   └── DepositStatusTag.tsx           — 状态标签 (含超时告警)
```

### 主列表页 (`index.tsx`)

- ProTable 展示收款记录列表
- 筛选条件: 门店 (locationId)、状态 (status)、类型 (orderType)
- 列: 标题、客户名、类型、金额、状态、创建时间、操作
- 操作: 查看详情、生成支付链接、取消、手动标记已支付
- 顶部"新建"按钮打开 CreateDepositModal

### 创建订单弹窗 (`CreateDepositModal.tsx`)

- 表单字段: 门店、客户、金额、类型、标题、备注、关联预约、操作员工
- 门店和客户使用 Select + 搜索
- 金额输入以美元为单位，提交时转为分
- 提交后返回到列表并刷新

### 详情抽屉 (`DepositDetailDrawer.tsx`)

- 展示订单完整信息和关联支付信息
- 操作按钮根据状态显示:
  - INIT: 生成支付链接
  - ING: 复制支付链接、取消
  - PAID: 已完成标记
  - CANCELED: 无操作
- 支付链接生成后可复制到剪贴板

### 状态标签 (`DepositStatusTag.tsx`)

- 按文档规范实现 `getPaymentAlertInfo()` 超时告警逻辑
- 颜色映射: INIT/ING(默认灰)、ING超时(黄/红)、PAID(绿)、CANCELED(灰)

## 路由

在 `config/routes.ts` 添加:
```typescript
{ path: '/deposits', name: 'deposits', icon: 'dollar', component: './deposits' }
```

放在 `/kanban` 路由附近，属于前台管理区域。

## 与结账系统的关系

两套独立系统，不共享数据表。Deposits 不需要 Square Web SDK，只需调 API 拿支付链接 URL。

## 不在范围内

- 聊天面板集成（后续迭代）
- 退款端点（后端未实现）
- 催缴短信发送（仅展示链接，手动发送）
