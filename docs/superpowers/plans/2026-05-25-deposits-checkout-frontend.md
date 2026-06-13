# Deposits 管理页面 & Checkout 类型同步 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 Deposits（押金/违约金/其他收款）独立管理页面，并同步更新 Checkout 类型以匹配后端文档。

**Architecture:** 遵循项目现有模式 — ProTable 列表页 + Modal 创建 + Drawer 详情。API 函数放在 `api.ts`，类型放在 `typings.d.ts`。不需要新增依赖。

**Tech Stack:** React 19, Ant Design v6, @ant-design/pro-components v3, @umijs/max, dayjs

**Spec:** `docs/superpowers/specs/2026-05-25-deposits-checkout-frontend-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/services/ant-design-pro/typings.d.ts` | 新增 Deposit 类型，更新 Checkout 类型 |
| Modify | `src/services/ant-design-pro/api.ts` | 新增 6 个 Deposit API 函数 |
| Create | `src/pages/deposits/components/DepositStatusTag.tsx` | 状态标签 + 超时告警逻辑 |
| Create | `src/pages/deposits/components/CreateDepositModal.tsx` | 创建订单表单弹窗 |
| Create | `src/pages/deposits/components/DepositDetailDrawer.tsx` | 订单详情抽屉 + 操作按钮 |
| Create | `src/pages/deposits/index.tsx` | 主列表页 |
| Modify | `config/routes.ts` | 添加 /deposits 路由 |

---

### Task 1: 新增 Deposit 类型 + 更新 Checkout 类型

**Files:**
- Modify: `src/services/ant-design-pro/typings.d.ts`

- [ ] **Step 1: 在 `typings.d.ts` 末尾 `}` (第765行) 之前，添加 Deposit 相关类型**

在 `CheckoutResponse` 类型定义之后，`}` 闭合之前，添加：

```typescript
  // ===== Deposit Types =====

  type DepositOrderType = 'DEPOSIT' | 'PENALTY_AMOUNT' | 'OTHER';

  type DepositStatus = 'INIT' | 'ING' | 'PAID' | 'CANCELED';

  type DepositOrder = {
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
  };

  type DepositPayment = {
    id: string;
    depositId: string;
    amount: number;
    paymentLinkUrl: string | null;
    squarePaymentLinkId: string | null;
    squareOrderId: string | null;
    squarePaymentResult: Record<string, any> | null;
    status: DepositStatus;
    createdAt: string;
    updatedAt: string;
  };

  type CreateDepositParams = {
    locationId: string;
    clientId: string;
    amount: number;
    orderType: DepositOrderType;
    title: string;
    memo?: string;
    appointmentId?: string;
    staffId?: string;
  };

  type DepositListParams = {
    locationId?: string;
    clientId?: string;
    appointmentId?: string;
    status?: DepositStatus;
    orderType?: DepositOrderType;
    page?: number;
    limit?: number;
  };

  type DepositDetailResponse = {
    deposit: DepositOrder;
    payment: DepositPayment | null;
  };

  type DepositListResponse = {
    data: DepositOrder[];
    total: number;
  };
```

- [ ] **Step 2: 更新 CheckoutResponse 类型 — order 添加 createdAt/updatedAt，payment 添加 orderId/appointmentId/createdAt/updatedAt**

将 `CheckoutResponse` 类型（第724-764行）替换为：

```typescript
  type CheckoutResponse = {
    appointment: API.AppointmentItem;
    order: {
      id: string;
      number: string | null;
      appointmentId: string;
      state: string;
      clientId: string | null;
      locationId: string | null;
      staffId: string | null;
      gratuityStaffId: string | null;
      note: string | null;
      initialSubtotal: number;
      initialDiscountAmount: number;
      initialFeeAmount: number;
      initialGratuityAmount: number;
      initialTaxAmount: number;
      initialTotal: number;
      currentSubtotal: number;
      currentDiscountAmount: number;
      currentFeeAmount: number;
      currentGratuityAmount: number;
      currentTaxAmount: number;
      currentTotal: number;
      refundAmount: number;
      lineGroups: any | null;
      paymentGroups: any | null;
      createdAt: string;
      updatedAt: string;
    };
    payment: {
      id: string;
      orderId: string;
      appointmentId: string;
      amount: number;
      currency: string;
      method: string;
      source: string;
      status: string;
      squarePaymentId: string | null;
      cardBrand: string | null;
      cardLast4: string | null;
      refundAmount: number;
      createdAt: string;
      updatedAt: string;
    } | null;
  };
```

- [ ] **Step 3: 验证类型文件无语法错误**

Run: `cd /Users/cs/Desktop/workspace/c/ant-design-pro-cl && npx tsc --noEmit src/services/ant-design-pro/typings.d.ts 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/services/ant-design-pro/typings.d.ts
git commit -m "feat: add Deposit types and update Checkout types to match backend API"
```

---

### Task 2: 新增 Deposit API 函数

**Files:**
- Modify: `src/services/ant-design-pro/api.ts`

- [ ] **Step 1: 在文件末尾（第1172行 `}` 之后）添加 Deposit API 函数**

```typescript
// ===== Deposit API =====

/** 创建押金/违约金订单 POST /api/v1/deposits */
export async function createDeposit(data: API.CreateDepositParams, options?: { [key: string]: any }) {
  return request<API.DepositOrder>('/api/v1/deposits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 查询押金列表 GET /api/v1/deposits */
export async function getDeposits(params: API.DepositListParams, options?: { [key: string]: any }) {
  return request<API.DepositListResponse>('/api/v1/deposits', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
}

/** 获取押金详情 GET /api/v1/deposits/:id */
export async function getDepositDetail(id: string, options?: { [key: string]: any }) {
  return request<API.DepositDetailResponse>(`/api/v1/deposits/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 生成支付链接 POST /api/v1/deposits/:id/payment-link */
export async function generatePaymentLink(id: string, options?: { [key: string]: any }) {
  return request<API.DepositPayment>(`/api/v1/deposits/${id}/payment-link`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** 取消押金订单 POST /api/v1/deposits/:id/cancel */
export async function cancelDeposit(id: string, data?: { staffId?: string }, options?: { [key: string]: any }) {
  return request<API.DepositOrder>(`/api/v1/deposits/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: data || {},
    ...(options || {}),
  });
}

/** 手动更新押金状态 PATCH /api/v1/deposits/:id/status */
export async function updateDepositStatus(id: string, data: { status: API.DepositStatus; staffId?: string }, options?: { [key: string]: any }) {
  return request<API.DepositOrder>(`/api/v1/deposits/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/ant-design-pro/api.ts
git commit -m "feat: add Deposit API functions (create, list, detail, payment-link, cancel, status)"
```

---

### Task 3: DepositStatusTag 组件

**Files:**
- Create: `src/pages/deposits/components/DepositStatusTag.tsx`

- [ ] **Step 1: 创建 DepositStatusTag 组件**

```tsx
import React from 'react';
import { Tag } from 'antd';
import type { DepositOrderType, DepositStatus } from '@/services/ant-design-pro/typings';

interface AlertInfo {
  level: 'default' | 'green' | 'yellow' | 'red';
  label: string;
  action?: string;
}

export function getPaymentAlertInfo(
  orderType: DepositOrderType,
  status: DepositStatus,
  createdAt: string,
): AlertInfo {
  if (status === 'PAID') return { level: 'green', label: 'Received' };
  if (status === 'CANCELED') return { level: 'default', label: 'Canceled' };
  if (status === 'INIT') return { level: 'default', label: 'Pending' };
  if (status !== 'ING') return { level: 'default', label: status };

  const hours = (Date.now() - new Date(createdAt).getTime()) / 3600000;

  if (orderType === 'DEPOSIT' || orderType === 'OTHER') {
    if (hours >= 29) return { level: 'red', label: 'Overdue 29h+', action: 'cancel' };
    if (hours >= 24) return { level: 'yellow', label: 'Overdue 24h+', action: 'resend' };
  }
  if (orderType === 'PENALTY_AMOUNT' && hours >= 48) {
    return { level: 'red', label: 'Overdue 48h+', action: 'index-card' };
  }

  return { level: 'default', label: 'Pending' };
}

const levelToColor: Record<string, string> = {
  green: 'green',
  yellow: 'warning',
  red: 'error',
  default: 'default',
};

interface DepositStatusTagProps {
  status: DepositStatus;
  orderType: DepositOrderType;
  createdAt: string;
}

const DepositStatusTag: React.FC<DepositStatusTagProps> = ({ status, orderType, createdAt }) => {
  const info = getPaymentAlertInfo(orderType, status, createdAt);
  return <Tag color={levelToColor[info.level]}>{info.label}</Tag>;
};

export default DepositStatusTag;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/deposits/components/DepositStatusTag.tsx
git commit -m "feat: add DepositStatusTag component with overdue alert logic"
```

---

### Task 4: CreateDepositModal 组件

**Files:**
- Create: `src/pages/deposits/components/CreateDepositModal.tsx`

- [ ] **Step 1: 创建 CreateDepositModal 组件**

```tsx
import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { createDeposit } from '@/services/ant-design-pro/api';
import type { DepositOrderType } from '@/services/ant-design-pro/typings';

interface CreateDepositModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  locations: { id: string; name: string }[];
  clients: { id: string; name?: string; firstName?: string; lastName?: string }[];
}

const orderTypeOptions: { label: string; value: DepositOrderType }[] = [
  { label: 'Deposit', value: 'DEPOSIT' },
  { label: 'Penalty', value: 'PENALTY_AMOUNT' },
  { label: 'Other', value: 'OTHER' },
];

const CreateDepositModal: React.FC<CreateDepositModalProps> = ({
  open,
  onClose,
  onSuccess,
  locations,
  clients,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await createDeposit({
        ...values,
        amount: Math.round(values.amount * 100), // 美元转分
      });
      message.success('Order created');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.data?.message) {
        message.error(err.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create Deposit / Penalty"
      open={open}
      onOk={handleSubmit}
      onCancel={() => { form.resetFields(); onClose(); }}
      confirmLoading={loading}
      destroyOnClose
      width={520}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="locationId" label="Location" rules={[{ required: true }]}>
          <Select placeholder="Select location" showSearch optionFilterProp="label">
            {locations.map((l) => (
              <Select.Option key={l.id} value={l.id} label={l.name}>
                {l.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="clientId" label="Client" rules={[{ required: true }]}>
          <Select placeholder="Select client" showSearch optionFilterProp="label">
            {clients.map((c) => (
              <Select.Option
                key={c.id}
                value={c.id}
                label={c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()}
              >
                {c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="orderType" label="Type" rules={[{ required: true }]}>
          <Select placeholder="Select type" options={orderTypeOptions} />
        </Form.Item>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input placeholder="e.g. Appointment Deposit - 2026/06/01" />
        </Form.Item>
        <Form.Item name="amount" label="Amount (USD)" rules={[{ required: true }]}>
          <InputNumber
            prefix="$"
            min={0.01}
            step={0.01}
            precision={2}
            style={{ width: '100%' }}
            placeholder="0.00"
          />
        </Form.Item>
        <Form.Item name="memo" label="Memo">
          <Input.TextArea rows={2} placeholder="Optional notes" />
        </Form.Item>
        <Form.Item name="appointmentId" label="Appointment ID (optional)">
          <Input placeholder="Link to an existing appointment" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateDepositModal;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/deposits/components/CreateDepositModal.tsx
git commit -m "feat: add CreateDepositModal component"
```

---

### Task 5: DepositDetailDrawer 组件

**Files:**
- Create: `src/pages/deposits/components/DepositDetailDrawer.tsx`

- [ ] **Step 1: 创建 DepositDetailDrawer 组件**

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Drawer, Descriptions, Button, Space, Typography, message, Popconfirm, Tag } from 'antd';
import {
  getDepositDetail,
  generatePaymentLink,
  cancelDeposit,
  updateDepositStatus,
} from '@/services/ant-design-pro/api';
import DepositStatusTag, { getPaymentAlertInfo } from './DepositStatusTag';
import type { DepositOrder, DepositPayment } from '@/services/ant-design-pro/typings';

const { Text, Paragraph } = Typography;

interface DepositDetailDrawerProps {
  open: boolean;
  depositId: string | null;
  onClose: () => void;
  onRefresh: () => void;
}

const DepositDetailDrawer: React.FC<DepositDetailDrawerProps> = ({
  open,
  depositId,
  onClose,
  onRefresh,
}) => {
  const [deposit, setDeposit] = useState<DepositOrder | null>(null);
  const [payment, setPayment] = useState<DepositPayment | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!depositId) return;
    setLoading(true);
    try {
      const res = await getDepositDetail(depositId);
      setDeposit(res.deposit);
      setPayment(res.payment);
    } catch {
      message.error('Failed to load deposit detail');
    } finally {
      setLoading(false);
    }
  }, [depositId]);

  useEffect(() => {
    if (open && depositId) fetchDetail();
  }, [open, depositId, fetchDetail]);

  const handleGenerateLink = async () => {
    if (!depositId) return;
    try {
      const res = await generatePaymentLink(depositId);
      setPayment(res);
      message.success('Payment link generated');
      onRefresh();
    } catch (err: any) {
      message.error(err?.data?.message || 'Failed to generate payment link');
    }
  };

  const handleCancel = async () => {
    if (!depositId) return;
    try {
      await cancelDeposit(depositId);
      message.success('Order canceled');
      fetchDetail();
      onRefresh();
    } catch (err: any) {
      message.error(err?.data?.message || 'Failed to cancel');
    }
  };

  const handleMarkPaid = async () => {
    if (!depositId) return;
    try {
      await updateDepositStatus(depositId, { status: 'PAID' });
      message.success('Marked as paid');
      fetchDetail();
      onRefresh();
    } catch (err: any) {
      message.error(err?.data?.message || 'Failed to update status');
    }
  };

  const handleCopyLink = () => {
    if (payment?.paymentLinkUrl) {
      navigator.clipboard.writeText(payment.paymentLinkUrl);
      message.success('Payment link copied');
    }
  };

  const alertInfo = deposit
    ? getPaymentAlertInfo(deposit.orderType, deposit.status, deposit.createdAt)
    : null;

  return (
    <Drawer
      title="Deposit Detail"
      open={open}
      onClose={onClose}
      width={520}
      loading={loading}
      destroyOnClose
    >
      {deposit && (
        <>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Title">{deposit.title}</Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag>{deposit.orderType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              ${(deposit.amount / 100).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <DepositStatusTag
                status={deposit.status}
                orderType={deposit.orderType}
                createdAt={deposit.createdAt}
              />
            </Descriptions.Item>
            {deposit.memo && (
              <Descriptions.Item label="Memo">{deposit.memo}</Descriptions.Item>
            )}
            <Descriptions.Item label="Created">{deposit.createdAt}</Descriptions.Item>
            <Descriptions.Item label="Updated">{deposit.updatedAt}</Descriptions.Item>
          </Descriptions>

          {alertInfo?.action && (
            <div style={{ marginTop: 12 }}>
              <Text type="warning">
                {alertInfo.label} —{' '}
                {alertInfo.action === 'cancel' && 'Consider canceling this order.'}
                {alertInfo.action === 'resend' && 'Consider resending the payment link.'}
                {alertInfo.action === 'index-card' && 'Consider flagging for collection.'}
              </Text>
            </div>
          )}

          {payment && (
            <div style={{ marginTop: 24 }}>
              <Typography.Title level={5}>Payment Info</Typography.Title>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Status">
                  <Tag>{payment.status}</Tag>
                </Descriptions.Item>
                {payment.paymentLinkUrl && (
                  <Descriptions.Item label="Payment Link">
                    <Paragraph copyable={{ text: payment.paymentLinkUrl }}>
                      <a href={payment.paymentLinkUrl} target="_blank" rel="noopener noreferrer">
                        Open Link
                      </a>
                    </Paragraph>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <Space>
              {deposit.status === 'INIT' && (
                <Button type="primary" onClick={handleGenerateLink}>
                  Generate Payment Link
                </Button>
              )}
              {deposit.status === 'ING' && payment?.paymentLinkUrl && (
                <Button onClick={handleCopyLink}>Copy Payment Link</Button>
              )}
              {(deposit.status === 'INIT' || deposit.status === 'ING') && (
                <Popconfirm title="Cancel this order?" onConfirm={handleCancel}>
                  <Button danger>Cancel</Button>
                </Popconfirm>
              )}
              {(deposit.status === 'INIT' || deposit.status === 'ING') && (
                <Popconfirm title="Mark as paid manually?" onConfirm={handleMarkPaid}>
                  <Button>Mark as Paid</Button>
                </Popconfirm>
              )}
            </Space>
          </div>
        </>
      )}
    </Drawer>
  );
};

export default DepositDetailDrawer;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/deposits/components/DepositDetailDrawer.tsx
git commit -m "feat: add DepositDetailDrawer component with payment link and status actions"
```

---

### Task 6: Deposits 主列表页

**Files:**
- Create: `src/pages/deposits/index.tsx`

- [ ] **Step 1: 创建 Deposits 主列表页**

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import ProTable from '@ant-design/pro-table';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Button, Select, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getDeposits, getLocations, getClients } from '@/services/ant-design-pro/api';
import type { DepositOrder, DepositStatus, DepositOrderType } from '@/services/ant-design-pro/typings';
import DepositStatusTag from './components/DepositStatusTag';
import CreateDepositModal from './components/CreateDepositModal';
import DepositDetailDrawer from './components/DepositDetailDrawer';

const statusOptions: { label: string; value: DepositStatus }[] = [
  { label: 'Init', value: 'INIT' },
  { label: 'Pending', value: 'ING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Canceled', value: 'CANCELED' },
];

const orderTypeOptions: { label: string; value: DepositOrderType }[] = [
  { label: 'Deposit', value: 'DEPOSIT' },
  { label: 'Penalty', value: 'PENALTY_AMOUNT' },
  { label: 'Other', value: 'OTHER' },
];

const DepositsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(null);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; name?: string; firstName?: string; lastName?: string }[]>([]);

  useEffect(() => {
    getLocations({ limit: 100 }).then((res) => {
      setLocations(res.data.map((l) => ({ id: l.id, name: l.name })));
    });
    getClients({ limit: 100 }).then((res) => {
      setClients(
        res.data.map((c) => ({
          id: c.id,
          name: c.name || undefined,
          firstName: c.firstName || undefined,
          lastName: c.lastName || undefined,
        })),
      );
    });
  }, []);

  const columns: ProColumns<DepositOrder>[] = [
    {
      title: 'Title',
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Type',
      dataIndex: 'orderType',
      width: 100,
      valueEnum: Object.fromEntries(orderTypeOptions.map((o) => [o.value, { text: o.label }])),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 100,
      render: (_, record) => `$${(record.amount / 100).toFixed(2)}`,
    },
    {
      title: 'Client',
      dataIndex: 'clientId',
      width: 150,
      render: (_, record) => {
        const client = clients.find((c) => c.id === record.clientId);
        return client?.name || client?.firstName || record.clientId;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 140,
      render: (_, record) => (
        <DepositStatusTag
          status={record.status}
          orderType={record.orderType}
          createdAt={record.createdAt}
        />
      ),
      valueEnum: Object.fromEntries(statusOptions.map((o) => [o.value, { text: o.label }])),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 160,
      sorter: true,
    },
    {
      title: 'Actions',
      valueType: 'option',
      width: 80,
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          size="small"
          onClick={() => {
            setSelectedDepositId(record.id);
            setDrawerOpen(true);
          }}
        >
          Detail
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<DepositOrder>
        headerTitle="Deposits / Penalties"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            New
          </Button>,
        ]}
        request={async (params) => {
          const res = await getDeposits({
            locationId: params.locationId,
            status: params.status,
            orderType: params.orderType,
            page: params.current,
            limit: params.pageSize,
          });
          return {
            data: res.data,
            total: res.total,
            success: true,
          };
        }}
        pagination={{ defaultPageSize: 20 }}
        search={{
          filterType: 'light',
          defaultCollapsed: false,
        }}
      />

      <CreateDepositModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
        locations={locations}
        clients={clients}
      />

      <DepositDetailDrawer
        open={drawerOpen}
        depositId={selectedDepositId}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedDepositId(null);
        }}
        onRefresh={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
};

export default DepositsPage;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/deposits/index.tsx
git commit -m "feat: add Deposits list page with ProTable, create modal, and detail drawer"
```

---

### Task 7: 添加路由

**Files:**
- Modify: `config/routes.ts`

- [ ] **Step 1: 在 kanban 路由（第199行）之后添加 deposits 路由**

在 `{ path: '/kanban', ... }` 之后、`{ path: '/', redirect: '/welcome' }` 之前添加：

```typescript
  {
    path: '/deposits',
    name: 'deposits',
    icon: 'dollar',
    component: './deposits',
  },
```

- [ ] **Step 2: 验证路由配置正确**

Run: `cd /Users/cs/Desktop/workspace/c/ant-design-pro-cl && grep -n 'deposits' config/routes.ts`

Expected: 看到新添加的 deposits 路由条目

- [ ] **Step 3: Commit**

```bash
git add config/routes.ts
git commit -m "feat: add /deposits route"
```

---

### Task 8: 验证编译通过

- [ ] **Step 1: 运行 TypeScript 检查**

Run: `cd /Users/cs/Desktop/workspace/c/ant-design-pro-cl && npx tsc --noEmit 2>&1 | tail -20`

Expected: 无错误或仅已有的无关错误

- [ ] **Step 2: 运行 lint 检查**

Run: `cd /Users/cs/Desktop/workspace/c/ant-design-pro-cl && npx biome check src/pages/deposits/ src/services/ant-design-pro/ 2>&1 | tail -20`

Expected: 无严重错误。如有格式问题，运行 `npx biome check --fix` 修复。

- [ ] **Step 3: 最终 Commit（如有 lint 修复）**

```bash
git add -A
git commit -m "chore: fix lint issues from deposits implementation"
```
