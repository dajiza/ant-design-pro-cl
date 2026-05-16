# 结账流程前端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现前端结账流程 — Front Desk Kanban 看板 + 预约列表结账按钮 + 共享结账 Modal，对接后端 `POST /v1/appointments/:id/checkout`。

**Architecture:** 改造现有 `/kanban` 静态页面为真实数据看板，预约卡片按状态分布在 4 列中，拖拽到「已完成」列触发结账 Modal。同时在 `/appointments` 列表页增加结账操作按钮。结账 Modal 为共享组件，左右分栏布局（服务+小费 | 支付+汇总）。

**Tech Stack:** React 19, Ant Design 6, @hello-pangea/dnd (已安装), react-square-web-payments-sdk (待安装), antd-style, dayjs。

**设计文档：** `docs/superpowers/specs/2026-05-15-checkout-frontend-design.md`

---

## 文件结构

### 新增文件

```
src/pages/kanban/
  components/
    CheckoutModal.tsx          — 结账 Modal（共享组件）
    KanbanColumn.tsx           — 看板列组件
    AppointmentCard.tsx        — 预约卡片组件
```

### 修改文件

```
src/services/ant-design-pro/typings.d.ts  — 新增 CheckoutRequest/Response 类型
src/services/ant-design-pro/api.ts        — 新增 checkoutAppointment 函数
src/pages/kanban/index.tsx                — 完全重写：真实数据 Kanban
src/pages/appointments/index.tsx          — 新增结账按钮列
config/config.ts                          — 新增 Square 配置 define
```

---

## 任务 1：安装依赖

- [ ] **步骤 1：安装 react-square-web-payments-sdk**

```bash
cd /Users/cs/Desktop/workspace/c/ant-design-pro-cl
npm install react-square-web-payments-sdk
```

- [ ] **步骤 2：验证安装**

```bash
grep react-square-web-payments-sdk package.json
```

预期：`"react-square-web-payments-sdk": "^x.x.x"`

- [ ] **步骤 3：提交**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-square-web-payments-sdk dependency"
```

---

## 任务 2：Square 配置

**文件：**
- 修改: `config/config.ts`

- [ ] **步骤 1：在 config.ts 中添加 define 配置**

在 `config/config.ts` 的 `defineConfig` 配置对象中添加 `define` 字段（与其他配置并列）：

```typescript
define: {
  SQUARE_APPLICATION_ID: process.env.SQUARE_APPLICATION_ID || '',
  SQUARE_LOCATION_ID: process.env.SQUARE_LOCATION_ID || '',
},
```

- [ ] **步骤 2：创建 .env 文件添加 Square 变量**

在项目根目录创建或追加 `.env` 文件：

```
SQUARE_APPLICATION_ID=sandbox-sq0idb-ofADQ1exDiUMEPg9KCEmOw
SQUARE_LOCATION_ID=
```

- [ ] **步骤 3：提交**

```bash
git add config/config.ts .env
git commit -m "chore: add Square payment config"
```

---

## 任务 3：API 类型定义

**文件：**
- 修改: `src/services/ant-design-pro/typings.d.ts`

- [ ] **步骤 1：在 API 命名空间中添加结账相关类型**

在 `typings.d.ts` 文件末尾 `}` 之前（API 命名空间闭合前）添加：

```typescript
type CheckoutRequest = {
  staffId: string;
  notifyClient?: boolean;
  gratuity?: { amount: number; staffId: string };
  products?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    sellerId?: string;
  }>;
  payment?: { sourceId: string; amount: number; currency?: string };
};

type CheckoutResponse = {
  appointment: API.AppointmentItem;
  order: {
    id: string;
    appointmentId: string;
    state: string;
    totalAmount: number;
    serviceLines: any[];
    productLines: any[] | null;
    gratuityAmount: number;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
  };
  payment: {
    id: string;
    status: string;
    amount: number;
    method: string;
    cardBrand: string | null;
    cardLast4: string | null;
  } | null;
};
```

- [ ] **步骤 2：提交**

```bash
git add src/services/ant-design-pro/typings.d.ts
git commit -m "feat: add CheckoutRequest and CheckoutResponse types"
```

---

## 任务 4：结账 API 函数

**文件：**
- 修改: `src/services/ant-design-pro/api.ts`

- [ ] **步骤 1：添加 checkoutAppointment 函数**

在 `api.ts` 文件的 appointment 相关函数区域末尾（`updateAppointmentState` 函数之后）添加：

```typescript
/** 结账 POST /api/v1/appointments/:id/checkout */
export async function checkoutAppointment(
  id: string,
  data: API.CheckoutRequest,
  options?: { [key: string]: any },
) {
  return request<API.CheckoutResponse>(
    `/api/v1/appointments/${id}/checkout`,
    {
      method: 'POST',
      data,
      ...(options || {}),
    },
  );
}
```

- [ ] **步骤 2：提交**

```bash
git add src/services/ant-design-pro/api.ts
git commit -m "feat: add checkoutAppointment API function"
```

---

## 任务 5：结账 Modal 组件

**文件：**
- 新建: `src/pages/kanban/components/CheckoutModal.tsx`

这是最核心的组件，被 Kanban 和 appointments 页面共享使用。

- [ ] **步骤 1：创建 CheckoutModal 组件**

创建 `src/pages/kanban/components/CheckoutModal.tsx`：

```tsx
import { CreditCard, PaymentForm } from 'react-square-web-payments-sdk';
import { message, Modal, InputNumber, Select, Input, Radio, Divider, Spin } from 'antd';
import React, { useState, useMemo } from 'react';
import { checkoutAppointment } from '@/services/ant-design-pro/api';
import dayjs from 'dayjs';

interface CheckoutModalProps {
  open: boolean;
  appointment: API.AppointmentItem | null;
  onClose: () => void;
  onSuccess: (result: API.CheckoutResponse) => void;
}

const CHECKOUTABLE_STATES = ['BOOKED', 'CONFIRMED', 'ARRIVED', 'ACTIVE'];

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  open,
  appointment,
  onClose,
  onSuccess,
}) => {
  const [tipType, setTipType] = useState<'15' | '18' | '20' | 'custom' | null>(null);
  const [customTipAmount, setCustomTipAmount] = useState<number | null>(null);
  const [tipStaffId, setTipStaffId] = useState<string | undefined>();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'other' | null>(null);
  const [loading, setLoading] = useState(false);

  const services = useMemo(() => {
    return (appointment?.appointmentServices as any[]) || [];
  }, [appointment]);

  const staffOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const svc of services) {
      const id = svc.staffId;
      const name = svc.staffName || svc.staff?.name || id;
      if (id && !seen.has(id)) {
        seen.set(id, name);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [services]);

  const firstStaffId = staffOptions[0]?.id;

  const subtotal = useMemo(() => {
    return services.reduce((sum, svc) => {
      const price = svc.price?.amount ?? svc.unitPrice ?? 0;
      return sum + price;
    }, 0);
  }, [services]);

  const tipAmount = useMemo(() => {
    if (!tipType) return 0;
    if (tipType === 'custom') return customTipAmount ?? 0;
    return Math.round(subtotal * (parseInt(tipType) / 100));
  }, [tipType, customTipAmount, subtotal]);

  const totalAmount = subtotal + tipAmount;

  const clientName = useMemo(() => {
    if (!appointment) return '';
    return (
      appointment.client?.name ||
      `${(appointment.client as any)?.firstName || ''} ${(appointment.client as any)?.lastName || ''}`.trim() ||
      ''
    );
  }, [appointment]);

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const canCheckout = appointment && CHECKOUTABLE_STATES.includes(appointment.state || '');

  const handleCardToken = async (tokenResult: any) => {
    if (!appointment || !firstStaffId) return;
    if (tokenResult.status !== 'OK') {
      message.error('卡片信息验证失败');
      return;
    }

    setLoading(true);
    try {
      await doCheckout(tokenResult.token);
    } finally {
      setLoading(false);
    }
  };

  const doCheckout = async (squareToken?: string) => {
    if (!appointment || !firstStaffId) return;

    const data: API.CheckoutRequest = {
      staffId: firstStaffId,
    };

    if (tipAmount > 0) {
      data.gratuity = {
        amount: tipAmount,
        staffId: tipStaffId || firstStaffId,
      };
    }

    if (paymentMethod === 'card' && squareToken) {
      data.payment = {
        sourceId: squareToken,
        amount: totalAmount,
      };
    }

    const result = await checkoutAppointment(appointment.id, data);
    message.success('结账成功');
    resetState();
    onSuccess(result);
  };

  const handleConfirm = async () => {
    if (!appointment) return;

    if (paymentMethod === 'card') {
      // Square PaymentForm 会通过 cardTokenizeResponseReceived 触发
      // 这里不需要手动处理，Card组件的按钮会触发tokenize
      return;
    }

    setLoading(true);
    try {
      await doCheckout();
    } catch (err: any) {
      message.error(err?.data?.message || err?.message || '结账失败');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setTipType(null);
    setCustomTipAmount(null);
    setTipStaffId(undefined);
    setPaymentMethod(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!appointment) return null;

  const squareAppId = (globalThis as any).SQUARE_APPLICATION_ID || '';
  const squareLocId = (globalThis as any).SQUARE_LOCATION_ID || '';

  return (
    <Modal
      title={`结账 — ${clientName}`}
      open={open}
      onCancel={handleClose}
      width={720}
      footer={null}
      destroyOnClose
    >
      <div style={{ display: 'flex', gap: 24, minHeight: 400 }}>
        {/* 左栏：服务 + 小费 */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8, color: '#666' }}>
              服务项目
            </div>
            {services.map((svc: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                  fontSize: 13,
                }}
              >
                <span>
                  {svc.name || svc.serviceName || '-'}
                  {svc.staffName ? ` — ${svc.staffName}` : ''}
                </span>
                <span>{formatCents(svc.price?.amount ?? svc.unitPrice ?? 0)}</span>
              </div>
            ))}
            {services.length === 0 && (
              <div style={{ color: '#999', fontSize: 13 }}>暂无服务项目</div>
            )}
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8, color: '#666' }}>
              小费
            </div>
            <Radio.Group
              value={tipType}
              onChange={(e) => setTipType(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="15">15%</Radio.Button>
              <Radio.Button value="18">18%</Radio.Button>
              <Radio.Button value="20">20%</Radio.Button>
              <Radio.Button value="custom">自定义</Radio.Button>
            </Radio.Group>
            {tipType === 'custom' && (
              <InputNumber
                style={{ width: '100%', marginTop: 8 }}
                min={0}
                placeholder="输入小费金额（美元）"
                value={customTipAmount}
                onChange={(val) => setCustomTipAmount(val)}
                addonBefore="$"
                precision={2}
              />
            )}
            {tipAmount > 0 && staffOptions.length > 1 && (
              <Select
                style={{ width: '100%', marginTop: 8 }}
                placeholder="选择接收小费的技师"
                value={tipStaffId || firstStaffId}
                onChange={(val) => setTipStaffId(val)}
                options={staffOptions.map((s) => ({
                  label: s.name,
                  value: s.id,
                }))}
              />
            )}
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div>
            <div style={{ fontWeight: 500, marginBottom: 8, color: '#666' }}>
              备注
            </div>
            <Input.TextArea rows={2} placeholder="可选备注" />
          </div>
        </div>

        {/* 右栏：支付 + 汇总 */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8, color: '#666' }}>
              支付方式
            </div>
            <Radio.Group
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: '100%' }}
            >
              <Radio.Button
                value="card"
                style={{ width: '33.3%', textAlign: 'center' }}
              >
                信用卡
              </Radio.Button>
              <Radio.Button
                value="cash"
                style={{ width: '33.3%', textAlign: 'center' }}
              >
                现金
              </Radio.Button>
              <Radio.Button
                value="other"
                style={{ width: '33.3%', textAlign: 'center' }}
              >
                其他
              </Radio.Button>
            </Radio.Group>
          </div>

          {paymentMethod === 'card' && squareAppId && (
            <div style={{ marginBottom: 16 }}>
              <PaymentForm
                applicationId={squareAppId}
                locationId={squareLocId}
                cardTokenizeResponseReceived={handleCardToken}
              >
                <CreditCard
                  buttonProps={{
                    isLoading: loading,
                    style: {
                      backgroundColor: '#1677ff',
                      color: '#fff',
                      width: '100%',
                      marginTop: 8,
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: 14,
                      border: 'none',
                      cursor: 'pointer',
                    },
                  }}
                >
                  {loading ? '处理中...' : `确认结账 ${formatCents(totalAmount)}`}
                </CreditCard>
              </PaymentForm>
            </div>
          )}

          {paymentMethod !== 'card' && (
            <button
              onClick={handleConfirm}
              disabled={loading || !canCheckout}
              style={{
                backgroundColor: loading || !canCheckout ? '#d9d9d9' : '#1677ff',
                color: '#fff',
                width: '100%',
                marginTop: 8,
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 14,
                border: 'none',
                cursor: loading || !canCheckout ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '处理中...' : `确认结账 ${formatCents(totalAmount)}`}
            </button>
          )}

          <Divider style={{ margin: '12px 0' }} />

          <div
            style={{
              background: '#fafafa',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
                fontSize: 13,
              }}
            >
              <span>小计</span>
              <span>{formatCents(subtotal)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
                fontSize: 13,
              }}
            >
              <span>小费</span>
              <span>{formatCents(tipAmount)}</span>
            </div>
            <Divider style={{ margin: '8px 0' }} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              <span>合计</span>
              <span>{formatCents(totalAmount)}</span>
            </div>
          </div>

          {!paymentMethod && (
            <div
              style={{
                textAlign: 'center',
                color: '#999',
                fontSize: 12,
                marginTop: 12,
              }}
            >
              未选择支付方式将只完成预约，不处理付款
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CheckoutModal;
```

- [ ] **步骤 2：提交**

```bash
git add src/pages/kanban/components/CheckoutModal.tsx
git commit -m "feat: add CheckoutModal component with Square payment support"
```

---

## 任务 6：Kanban 预约卡片组件

**文件：**
- 新建: `src/pages/kanban/components/AppointmentCard.tsx`

- [ ] **步骤 1：创建 AppointmentCard 组件**

创建 `src/pages/kanban/components/AppointmentCard.tsx`：

```tsx
import { Card, Tag } from 'antd';
import React from 'react';
import dayjs from 'dayjs';

interface AppointmentCardProps {
  appointment: API.AppointmentItem;
  index: number;
  checkoutAmount?: number | null;
  checkoutPending?: boolean;
}

const stateColors: Record<string, string> = {
  BOOKED: '#1677ff',
  CONFIRMED: '#1677ff',
  ARRIVED: '#faad14',
  ACTIVE: '#52c41a',
  FINAL: '#722ed1',
};

const getClientName = (record: API.AppointmentItem) => {
  return (
    record.client?.name ||
    `${(record.client as any)?.firstName || ''} ${(record.client as any)?.lastName || ''}`.trim() ||
    '未知客户'
  );
};

const getServiceNames = (record: API.AppointmentItem) => {
  const services = (record.appointmentServices as any[]) || [];
  return services.map((s: any) => s.name || s.serviceName || '-').join(' + ');
};

const getStaffNames = (record: API.AppointmentItem) => {
  const services = (record.appointmentServices as any[]) || [];
  return (
    services
      .map((s: any) => s.staffName || s.staff?.name || '-')
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
      .join(', ') || '-'
  );
};

const formatTime = (startAt: string | null | undefined, tz?: string) => {
  if (!startAt) return '';
  const utc = startAt.endsWith('Z') ? startAt : `${startAt}Z`;
  return dayjs(utc).tz(tz || 'UTC').format('HH:mm');
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  index,
  checkoutAmount,
  checkoutPending,
}) => {
  const tz = (appointment.location as any)?.tz || 'UTC';
  const stateColor = stateColors[appointment.state || ''] || '#999';
  const isFinal = appointment.state === 'FINAL';

  return (
    <div
      style={{
        marginBottom: 8,
        cursor: 'grab',
      }}
    >
      <Card
        size="small"
        style={{
          borderRadius: 6,
          borderLeft: `3px solid ${stateColor}`,
          opacity: appointment.cancelled ? 0.5 : 1,
        }}
        bodyStyle={{ padding: '8px 12px' }}
      >
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>
          {getClientName(appointment)}
        </div>
        <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>
          {formatTime(appointment.startAt, tz)}
          {getServiceNames(appointment) ? ` — ${getServiceNames(appointment)}` : ''}
        </div>
        <div style={{ fontSize: 11, color: '#999' }}>
          {getStaffNames(appointment)}
        </div>
        {isFinal && checkoutAmount != null && (
          <div
            style={{
              fontSize: 11,
              color: checkoutPending ? '#faad14' : '#52c41a',
              marginTop: 4,
            }}
          >
            {checkoutPending ? '⚠ 待收款' : `✓ 已结账 $${(checkoutAmount / 100).toFixed(2)}`}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AppointmentCard;
```

- [ ] **步骤 2：提交**

```bash
git add src/pages/kanban/components/AppointmentCard.tsx
git commit -m "feat: add AppointmentCard component for Kanban"
```

---

## 任务 7：Kanban 列组件

**文件：**
- 新建: `src/pages/kanban/components/KanbanColumn.tsx`

- [ ] **步骤 1：创建 KanbanColumn 组件**

创建 `src/pages/kanban/components/KanbanColumn.tsx`：

```tsx
import { Droppable, Draggable } from '@hello-pangea/dnd';
import React from 'react';
import AppointmentCard from './AppointmentCard';

export interface KanbanColumnData {
  id: string;
  title: string;
  color: string;
  states: string[];
  appointments: API.AppointmentItem[];
  checkoutAmounts?: Record<string, number | null>;
  checkoutPendingSet?: Set<string>;
}

interface KanbanColumnProps {
  column: KanbanColumnData;
  isCompletedColumn?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  isCompletedColumn = false,
}) => {
  return (
    <div
      style={{
        minWidth: 280,
        maxWidth: 280,
        background: '#f5f5f5',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 260px)',
        border: isCompletedColumn ? '2px dashed #1677ff' : 'none',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 4,
            height: 16,
            backgroundColor: column.color,
            borderRadius: 2,
          }}
        />
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          {column.title}
        </span>
        <span
          style={{
            background: '#e0e0e0',
            padding: '0 8px',
            borderRadius: 10,
            fontSize: 12,
            color: '#666',
          }}
        >
          {column.appointments.length}
        </span>
        {isCompletedColumn && (
          <span style={{ fontSize: 11, color: '#1677ff', marginLeft: 'auto' }}>
            拖拽到此处结账
          </span>
        )}
      </div>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              padding: 8,
              flex: 1,
              overflowY: 'auto',
              minHeight: 100,
              background: snapshot.isDraggingOver
                ? 'rgba(22, 119, 255, 0.04)'
                : 'transparent',
              transition: 'background 0.2s',
            }}
          >
            {column.appointments.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: '#ccc',
                  padding: 16,
                  fontSize: 13,
                }}
              >
                暂无预约
              </div>
            )}
            {column.appointments.map((apt, index) => (
              <Draggable
                key={apt.id}
                draggableId={apt.id}
                index={index}
                isDragDisabled={apt.state === 'FINAL'}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <AppointmentCard
                      appointment={apt}
                      index={index}
                      checkoutAmount={column.checkoutAmounts?.[apt.id]}
                      checkoutPending={column.checkoutPendingSet?.has(apt.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
```

- [ ] **步骤 2：提交**

```bash
git add src/pages/kanban/components/KanbanColumn.tsx
git commit -m "feat: add KanbanColumn component with drag-and-drop support"
```

---

## 任务 8：重写 Kanban 页面

**文件：**
- 修改: `src/pages/kanban/index.tsx`（完全重写）

- [ ] **步骤 1：重写 index.tsx**

用以下内容完全替换 `src/pages/kanban/index.tsx`：

```tsx
import {
  DragDropContext,
  type DropResult,
} from '@hello-pangea/dnd';
import { PageContainer } from '@ant-design/pro-components';
import { DatePicker, Select, message, Spin } from 'antd';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import {
  getAppointments,
  getLocations,
  updateAppointmentState,
} from '@/services/ant-design-pro/api';
import KanbanColumn, { type KanbanColumnData } from './components/KanbanColumn';
import CheckoutModal from './components/CheckoutModal';

dayjs.extend(utc);
dayjs.extend(timezone);

const COLUMN_DEFS: Array<{
  id: string;
  title: string;
  color: string;
  states: string[];
}> = [
  { id: 'booked', title: '已预约', color: '#1677ff', states: ['BOOKED', 'CONFIRMED'] },
  { id: 'arrived', title: '已到达', color: '#faad14', states: ['ARRIVED'] },
  { id: 'active', title: '进行中', color: '#52c41a', states: ['ACTIVE'] },
  { id: 'completed', title: '已完成', color: '#722ed1', states: ['FINAL'] },
];

const STATE_TO_COLUMN: Record<string, string> = {
  BOOKED: 'booked',
  CONFIRMED: 'booked',
  ARRIVED: 'arrived',
  ACTIVE: 'active',
  FINAL: 'completed',
};

const COLUMN_TO_STATE: Record<string, string> = {
  booked: 'ARRIVED',
  arrived: 'ACTIVE',
  active: 'ARRIVED',
};

const Kanban: React.FC = () => {
  const [appointments, setAppointments] = useState<API.AppointmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>();
  const [locations, setLocations] = useState<API.LocationItem[]>([]);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutAppointment, setCheckoutAppointment] = useState<API.AppointmentItem | null>(null);
  const [checkoutAmounts, setCheckoutAmounts] = useState<Record<string, number | null>>({});
  const [checkoutPendingSet, setCheckoutPendingSet] = useState<Set<string>>(new Set());

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const date = selectedDate.format('YYYY-MM-DD');
      const startDate = `${date}T00:00:00`;
      const endDate = `${date}T23:59:59`;
      const res = await getAppointments({
        startDate,
        endDate,
        locationId: selectedLocationId,
        limit: 500,
      });
      setAppointments(res.data || []);
    } catch (err) {
      message.error('获取预约失败');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedLocationId]);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await getLocations({ limit: 100 });
      setLocations(res.data || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const columns: KanbanColumnData[] = useMemo(() => {
    return COLUMN_DEFS.map((def) => {
      const apts = appointments.filter(
        (apt) =>
          !apt.cancelled &&
          apt.state &&
          def.states.includes(apt.state),
      );
      return {
        ...def,
        appointments: apts,
        checkoutAmounts: def.id === 'completed' ? checkoutAmounts : undefined,
        checkoutPendingSet: def.id === 'completed' ? checkoutPendingSet : undefined,
      };
    });
  }, [appointments, checkoutAmounts, checkoutPendingSet]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const targetColumnId = destination.droppableId;

    // 拖到已完成列 → 打开结账 Modal
    if (targetColumnId === 'completed') {
      const apt = appointments.find((a) => a.id === draggableId);
      if (apt) {
        setCheckoutAppointment(apt);
        setCheckoutModalOpen(true);
      }
      return;
    }

    // 前 3 列之间拖拽 → 更新预约状态
    const newState = COLUMN_TO_STATE[targetColumnId];
    if (!newState) return;

    // 乐观更新：先移动卡片
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === draggableId ? { ...apt, state: newState } : apt,
      ),
    );

    try {
      await updateAppointmentState(draggableId, newState as API.AppointmentState);
    } catch {
      message.error('更新状态失败');
      fetchAppointments();
    }
  };

  const handleCheckoutSuccess = (result: any) => {
    if (checkoutAppointment) {
      const aptId = checkoutAppointment.id;
      const order = result?.order;
      const payment = result?.payment;

      // 更新本地数据
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === aptId ? { ...apt, state: 'FINAL' } : apt,
        ),
      );

      // 记录结账金额
      if (order) {
        setCheckoutAmounts((prev) => ({
          ...prev,
          [aptId]: order.totalAmount,
        }));
        if (!payment || payment.status !== 'COMPLETED') {
          setCheckoutPendingSet((prev) => new Set(prev).add(aptId));
        }
      }
    }
    setCheckoutModalOpen(false);
    setCheckoutAppointment(null);
  };

  const cancelledCount = appointments.filter((a) => a.cancelled).length;

  return (
    <PageContainer>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <DatePicker
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          allowClear={false}
        />
        {locations.length > 1 && (
          <Select
            style={{ width: 200 }}
            placeholder="选择门店"
            allowClear
            value={selectedLocationId}
            onChange={setSelectedLocationId}
            options={locations.map((l) => ({ label: l.name, value: l.id }))}
          />
        )}
        <span style={{ color: '#999', fontSize: 12, marginLeft: 'auto' }}>
          {appointments.length} 个预约
          {cancelledCount > 0 && ` (${cancelledCount} 已取消)`}
        </span>
      </div>

      <Spin spinning={loading}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                isCompletedColumn={col.id === 'completed'}
              />
            ))}
          </div>
        </DragDropContext>
      </Spin>

      <CheckoutModal
        open={checkoutModalOpen}
        appointment={checkoutAppointment}
        onClose={() => {
          setCheckoutModalOpen(false);
          setCheckoutAppointment(null);
          // 结账取消，刷新恢复原始状态
          fetchAppointments();
        }}
        onSuccess={handleCheckoutSuccess}
      />
    </PageContainer>
  );
};

export default Kanban;
```

- [ ] **步骤 2：验证页面渲染**

```bash
cd /Users/cs/Desktop/workspace/c/ant-design-pro-cl
npm run dev
```

打开 `/kanban` 页面，确认 4 列显示，日期筛选可用。

- [ ] **步骤 3：提交**

```bash
git add src/pages/kanban/index.tsx
git commit -m "feat: rewrite Kanban page with real appointment data and checkout support"
```

---

## 任务 9：预约列表页添加结账按钮

**文件：**
- 修改: `src/pages/appointments/index.tsx`

- [ ] **步骤 1：添加 CheckoutModal 导入和状态**

在 `src/pages/appointments/index.tsx` 顶部添加导入：

```typescript
import CheckoutModal from '@/pages/kanban/components/CheckoutModal';
```

在组件函数体内的 state 声明区域（`drawerOpen` 之后）添加：

```typescript
const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
const [checkoutAppointment, setCheckoutAppointment] = useState<API.AppointmentItem | null>(null);
```

注意：需要把 `React.useState` 改为 `useState`（已在顶部导入），或者保持 `React.useState` 不变。保持与现有代码一致即可。

- [ ] **步骤 2：添加操作列**

在 `columns` 数组中，`已取消` 列之后添加操作列：

```typescript
{
  title: '操作',
  hideInSearch: true,
  width: 80,
  render: (_, record) => {
    const checkoutable = !record.cancelled && ['BOOKED', 'CONFIRMED', 'ARRIVED', 'ACTIVE'].includes(record.state || '');
    if (!checkoutable) return null;
    return (
      <Button
        type="link"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setCheckoutAppointment(record);
          setCheckoutModalOpen(true);
        }}
      >
        结账
      </Button>
    );
  },
},
```

- [ ] **步骤 3：添加 CheckoutModal 渲染**

在 `return` 的 JSX 中，`<AppointmentDrawer>` 组件之后添加：

```tsx
<CheckoutModal
  open={checkoutModalOpen}
  appointment={checkoutAppointment}
  onClose={() => {
    setCheckoutModalOpen(false);
    setCheckoutAppointment(null);
  }}
  onSuccess={() => {
    setCheckoutModalOpen(false);
    setCheckoutAppointment(null);
    actionRef.current?.reload();
  }}
/>
```

- [ ] **步骤 4：验证**

```bash
cd /Users/cs/Desktop/workspace/c/ant-design-pro-cl
npm run dev
```

打开 `/appointments` 页面，确认非 FINAL/CANCELLED 状态的行有「结账」按钮，点击可打开 Modal。

- [ ] **步骤 5：提交**

```bash
git add src/pages/appointments/index.tsx
git commit -m "feat: add checkout button to appointments list page"
```

---

## 任务 10：更新路由配置

**文件：**
- 修改: `config/routes.ts`

- [ ] **步骤 1：更新 Kanban 路由名称和图标**

在 `config/routes.ts` 中找到 kanban 路由：

```typescript
{ path: '/kanban', name: 'kanban', icon: 'appstore', component: './kanban' },
```

修改为：

```typescript
{ path: '/kanban', name: 'front-desk', icon: 'appstore', component: './kanban' },
```

- [ ] **步骤 2：添加 i18n 翻译**

在 `src/locales/zh-CN/` 中的 menu 相关文件中添加翻译 key（如果有 menu 翻译文件的话）：

```typescript
'menu.front-desk': '前台看板',
```

如果没有独立的 menu 翻译文件，跳过此步骤，菜单会显示 key 名称 `front-desk`。

- [ ] **步骤 3：提交**

```bash
git add config/routes.ts
git commit -m "feat: rename kanban route to front-desk"
```

---

## 任务 11：手动测试

- [ ] **步骤 1：启动开发服务器**

```bash
cd /Users/cs/Desktop/workspace/c/ant-design-pro-cl
npm run dev
```

- [ ] **步骤 2：测试 Kanban 页面**

1. 打开 `/kanban`，确认 4 列显示（已预约、已到达、进行中、已完成）
2. 确认日期筛选可用，切换日期后预约数据更新
3. 拖拽卡片在前 3 列之间移动，确认状态更新成功
4. 拖拽卡片到「已完成」列，确认弹出结账 Modal
5. 取消结账 Modal，确认卡片回到原列

- [ ] **步骤 3：测试结账 Modal**

1. 在 Modal 中确认服务项目显示正确
2. 点击小费百分比按钮，确认金额更新
3. 切换支付方式（信用卡/现金/其他）
4. 不选支付方式直接确认结账，确认成功
5. 结账后确认卡片移到「已完成」列

- [ ] **步骤 4：测试预约列表页结账入口**

1. 打开 `/appointments`，确认非 FINAL/CANCELLED 状态的行有「结账」按钮
2. 点击「结账」，确认打开同一个 Modal
3. 完成结账后，确认列表刷新
