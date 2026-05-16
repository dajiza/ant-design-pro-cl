# 结账流程前端设计

> **状态：设计完成，待实施。**
>
> 最后更新：2026-05-15

## 参考文档

- [结账流程设计文档（后端）](../../baredmonkey-crm-nest-api/docs/superpowers/specs/2026-05-12-checkout-flow-design.md)
- [结账实施计划（后端）](../../baredmonkey-crm-nest-api/docs/superpowers/plans/2026-05-15-checkout-flow.md)

---

## 1. 范围

前端结账流程，对接后端 `POST /v1/appointments/:id/checkout`。不做订单列表、支付历史、退款流程。不改服务端代码。

**三个交付物：**

1. **Front Desk Kanban** — 改造现有 `/kanban` 为真实数据驱动的预约看板
2. **预约列表结账入口** — 在 `/appointments` 列表页增加结账按钮
3. **结账 Modal** — 共享的结账弹窗组件

---

## 2. Front Desk Kanban

### 2.1 路由

复用现有 `/kanban` 路由，替换静态 demo 组件。

### 2.2 列映射

| 列名 | 预约状态 | 颜色标识 |
|---|---|---|
| 已预约 | `BOOKED` / `CONFIRMED` | 蓝色 |
| 已到达 | `ARRIVED` | 黄色 |
| 进行中 | `ACTIVE` | 绿色 |
| 已完成 | `FINAL` | 紫色 |

### 2.3 卡片信息

每张卡片显示：

- 客户名
- 预约时间
- 服务名称（多个服务用 `+` 连接）
- 技师名

### 2.4 拖拽交互

- 前 3 列之间自由拖拽 → 调用 `updateAppointment` 更新状态
- 拖到「已完成」列 → 弹出结账 Modal
- 结账成功 → 卡片留在「已完成」列，显示结账金额
- 结账取消 → 卡片回到原列

### 2.5 顶部筛选

- 日期选择（默认今天）
- 门店选择（如有多门店）

### 2.6 已完成卡片状态

- 已结账：显示金额 + 绿色勾
- 待收款（无支付）：显示金额 + 黄色警告

---

## 3. 预约列表页结账入口

### 3.1 入口位置

在 `/appointments` 的 ProTable 操作列中，状态为 BOOKED / CONFIRMED / ARRIVED / ACTIVE 的行显示「结账」按钮。

### 3.2 交互

点击「结账」→ 打开结账 Modal → 结账成功后刷新列表。

---

## 4. 结账 Modal

### 4.1 布局

方案 B：居中 Modal 弹窗，宽度 720px，左右分栏。

```
┌─────────────────────────────────────────────┐
│  结账 — Jane Smith                        X │
├─────────────────────┬───────────────────────┤
│  服务项目            │  支付方式             │
│  ├ Haircut  $45.00  │  [信用卡] [现金] [其他]│
│  └ Coloring $80.00  │                       │
│                     │  Square 卡片输入      │
│  小费               │  ┌─────────────────┐  │
│  [15%][18%][20%][自]│  │ 4242 xxxx xxxx  │  │
│  $__.__             │  └─────────────────┘  │
│                     │                       │
│  备注               │  汇总                 │
│  ┌─────────────┐    │  小计  $125.00       │
│  │              │    │  小费  $0.00         │
│  └─────────────┘    │  合计  $125.00       │
│                     │                       │
│                     │  [确认结账 $125.00]   │
└─────────────────────┴───────────────────────┘
```

### 4.2 左栏：服务 + 小费

**服务项目：** 自动从 appointment.appointmentServices 读取，只读展示：
- 服务名
- 技师名
- 单价

**小费输入：**
- 快捷百分比按钮：15% / 18% / 20%
- 自定义金额输入
- 选中接收小费的技师（下拉选择）

**备注：** 文本输入框

### 4.3 右栏：支付 + 汇总

**支付方式切换：** 三个选项卡

| 方式 | 行为 |
|---|---|
| 信用卡 | 显示 Square 卡片输入 iframe，提交时传 sourceId |
| 现金 | 无额外输入，标记 MANUAL_CASH |
| 其他 | 无额外输入，标记 MANUAL_OTHER |

**支付可选：** 不选任何支付方式时，只完成预约不扣款。

**金额汇总：**
- 小计（服务项自动计算）
- 小费
- 合计

**确认按钮：** 显示合计金额，点击提交。

### 4.4 提交流程

```
1. 验证：确认 staffId（取 appointmentServices 第一个技师的 staffId；如有多个技师，用户可在 Modal 中选择）
2. 信用卡支付：先调用 Square SDK tokenize → 拿到 sourceId
3. 调用 POST /v1/appointments/:id/checkout
4. 成功 → 显示成功提示，关闭 Modal，刷新数据
5. 失败 → 显示错误信息，保持 Modal
```

### 4.5 结账请求参数映射

```typescript
// Modal 提交时组装的 DTO
{
  staffId: appointment.appointmentServices[0]?.staffId,
  gratuity: tipAmount > 0 ? { amount: tipAmount, staffId: selectedStaffId } : undefined,
  payment: paymentMethod === 'card' ? { sourceId: squareToken, amount: totalAmount } : undefined,
}
```

现金/其他方式：后端 checkout 不传 `payment` 字段，预约标记为 FINAL，order 状态为 PENDING。后续可通过其他方式手动收款。

---

## 5. API 层

### 5.1 新增函数

在 `src/services/ant-design-pro/api.ts` 中新增：

```typescript
/** 结账 */
export async function checkoutAppointment(id: string, data: CheckoutRequest) {
  return request(`/api/v1/appointments/${id}/checkout`, {
    method: 'POST',
    data,
  });
}
```

### 5.2 新增类型

在 `src/services/ant-design-pro/typings.d.ts` 中新增：

```typescript
interface CheckoutRequest {
  staffId: string;
  notifyClient?: boolean;
  gratuity?: { amount: number; staffId: string };
  products?: Array<{ productId: string; quantity: number; unitPrice: number; sellerId?: string }>;
  payment?: { sourceId: string; amount: number; currency?: string };
}

interface CheckoutResponse {
  appointment: API.AppointmentItem;
  order: {
    id: string;
    appointmentId: string;
    state: string;
    totalAmount: number;
    serviceLines: any[];
    // ...其他字段
  };
  payment: {
    id: string;
    status: string;
    amount: number;
    method: string;
    cardBrand?: string;
    cardLast4?: string;
  } | null;
}
```

---

## 6. 文件结构

### 新增文件

```
src/pages/
  kanban/
    index.tsx                          — 重写：真实数据 Kanban
    components/
      KanbanColumn.tsx                 — 列组件
      AppointmentCard.tsx              — 预约卡片
      CheckoutModal.tsx                — 结账 Modal（共享）

src/pages/appointments/
  index.tsx                           — 直接从 kanban/components/CheckoutModal 导入

src/services/ant-design-pro/
  api.ts                              — 新增 checkoutAppointment
  typings.d.ts                        — 新增 CheckoutRequest/Response 类型
```

### 修改文件

```
config/routes.ts                      — Kanban 路由名称/图标调整（可选）
src/pages/kanban/index.tsx            — 完全重写
src/pages/appointments/index.tsx      — 新增结账按钮
src/services/ant-design-pro/api.ts    — 新增 checkoutAppointment
src/services/ant-design-pro/typings.d.ts — 新增类型
```

### 依赖安装

```bash
# Square Web Payments SDK（信用卡输入）
npm install react-square-web-payments-sdk
```

---

## 7. 不涉及

- 订单列表页 / 订单详情页
- 支付历史页
- 退款流程
- Card on File（保存卡片）
- Apple Pay / Google Pay
- 服务端代码修改
