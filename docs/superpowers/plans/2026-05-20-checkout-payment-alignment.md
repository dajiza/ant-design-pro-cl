# Checkout / Payment 前端对齐后端 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将前端 CheckoutModal 对齐后端 checkout API 的完整能力：折扣、税费、正确的支付方式发送、无支付结账。

**Architecture:** 修改现有 CheckoutModal 组件，扩展左栏添加折扣和税费区域，修复右栏支付逻辑，更新 types 和 kanban 处理逻辑。保持两栏布局不变。

**Tech Stack:** React, Ant Design, antd-style (createStyles), react-square-web-payments-sdk

---

## 差距分析

| 功能 | 后端支持 | 前端现状 |
|------|---------|---------|
| 折扣 (discount) | `amount` 或 `percentage` + `reason` | 无 |
| 税费 (taxAmount) | 前端传入整数美分 | 无 |
| 支付 method 字段 | `SQUARE_CARD`/`MANUAL_CASH`/`MANUAL_OTHER` | 未发送 method；现金/其他不发 payment |
| 无支付结账 | 不传 payment 时 order 为 PENDING | 无此选项 |
| CheckoutResponse | 含 `initialTotal`/`initialSubtotal` 等 | 字段名不匹配 |

---

### Task 1: 更新 TypeScript 类型定义

**Files:**
- Modify: `src/services/ant-design-pro/typings.d.ts:697-733`

- [ ] **Step 1: 更新 CheckoutRequest 类型**

将 `typings.d.ts` 中 `CheckoutRequest` 的 `payment` 字段改为匹配后端 DTO，新增 `discount` 和 `taxAmount` 字段：

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
    discount?: {
      amount?: number;
      percentage?: number;
      reason?: string;
    };
    taxAmount?: number;
    payment?: {
      method: 'SQUARE_CARD' | 'MANUAL_CASH' | 'MANUAL_OTHER';
      amount: number;
      sourceId?: string;
      currency?: string;
    };
  };
```

- [ ] **Step 2: 更新 CheckoutResponse 类型**

将 `CheckoutResponse` 的 `order` 字段改为匹配后端 Order entity 的实际返回：

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
    };
    payment: {
      id: string;
      amount: number;
      currency: string;
      method: string;
      source: string;
      status: string;
      squarePaymentId: string | null;
      cardBrand: string | null;
      cardLast4: string | null;
      refundAmount: number;
    } | null;
  };
```

- [ ] **Step 3: Commit**

```bash
git add src/services/ant-design-pro/typings.d.ts
git commit -m "feat: align CheckoutRequest/CheckoutResponse types with backend DTO"
```

---

### Task 2: CheckoutModal — 添加折扣 UI

**Files:**
- Modify: `src/pages/kanban/components/CheckoutModal.tsx`

- [ ] **Step 1: 在左栏服务列表和小费之间插入折扣区域**

在小费 `<Divider>` 之前（约第 416 行 `</>` 之后），添加折扣区域。使用固定金额 / 百分比切换：

```tsx
{/* Discount section */}
<Divider className={styles.divider} />
<div className={styles.sectionTitle}>折扣</div>
<Radio.Group
  value={discountMode}
  onChange={(e) => {
    setDiscountMode(e.target.value);
    setDiscountAmount(null);
    setDiscountPercent(null);
  }}
  size="small"
  style={{ marginBottom: 8 }}
>
  <Radio.Button value="none">无折扣</Radio.Button>
  <Radio.Button value="fixed">固定金额</Radio.Button>
  <Radio.Button value="percent">百分比</Radio.Button>
</Radio.Group>
{discountMode === 'fixed' && (
  <InputNumber
    placeholder="折扣金额 ($)"
    min={0}
    max={subtotalCents / 100}
    precision={2}
    style={{ width: '100%' }}
    value={discountAmount}
    onChange={(val) => setDiscountAmount(val ?? null)}
  />
)}
{discountMode === 'percent' && (
  <InputNumber
    placeholder="折扣百分比 (%)"
    min={0}
    max={100}
    precision={0}
    style={{ width: '100%' }}
    value={discountPercent}
    onChange={(val) => setDiscountPercent(val ?? null)}
    addonAfter="%"
  />
)}
{(discountMode !== 'none') && (
  <Input
    placeholder="折扣原因（可选）"
    style={{ marginTop: 8 }}
    value={discountReason}
    onChange={(e) => setDiscountReason(e.target.value)}
  />
)}
```

- [ ] **Step 2: 在组件顶部添加折扣相关 state**

在 `const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');` 之后添加：

```tsx
const [discountMode, setDiscountMode] = useState<'none' | 'fixed' | 'percent'>('none');
const [discountAmount, setDiscountAmount] = useState<number | null>(null);
const [discountPercent, setDiscountPercent] = useState<number | null>(null);
const [discountReason, setDiscountReason] = useState('');
```

在 `handleClose` 的 reset 回调中添加：

```tsx
setDiscountMode('none');
setDiscountAmount(null);
setDiscountPercent(null);
setDiscountReason('');
```

- [ ] **Step 3: 计算 discountCents**

在 `tipCents` 的 `useMemo` 之后添加：

```tsx
const discountCents = useMemo(() => {
  if (discountMode === 'fixed' && discountAmount != null && discountAmount > 0) {
    return Math.min(dollarsToCents(discountAmount), subtotalCents);
  }
  if (discountMode === 'percent' && discountPercent != null && discountPercent > 0) {
    return Math.round(subtotalCents * (discountPercent / 100));
  }
  return 0;
}, [discountMode, discountAmount, discountPercent, subtotalCents]);
```

更新 `totalCents` 计算：

```tsx
const totalCents = subtotalCents - discountCents + tipCents;
```

---

### Task 3: CheckoutModal — 添加税费输入

**Files:**
- Modify: `src/pages/kanban/components/CheckoutModal.tsx`

- [ ] **Step 1: 在折扣区域之后添加税费输入**

在折扣区域代码之后（小费 section 之前），添加税费区域：

```tsx
<Divider className={styles.divider} />
<div className={styles.sectionTitle}>税费</div>
<InputNumber
  placeholder="税费金额 ($)"
  min={0}
  max={9999}
  precision={2}
  style={{ width: '100%' }}
  value={taxAmount}
  onChange={(val) => setTaxAmount(val ?? null)}
/>
```

- [ ] **Step 2: 添加 taxAmount state**

在折扣 state 之后添加：

```tsx
const [taxAmount, setTaxAmount] = useState<number | null>(null);
```

在 `handleClose` 的 reset 回调中添加：

```tsx
setTaxAmount(null);
```

- [ ] **Step 3: 计算 taxCents 并更新 totalCents**

在 `discountCents` 之后添加：

```tsx
const taxCents = useMemo(() => {
  if (taxAmount != null && taxAmount > 0) {
    return dollarsToCents(taxAmount);
  }
  return 0;
}, [taxAmount]);
```

更新 `totalCents`：

```tsx
const totalCents = subtotalCents - discountCents + tipCents + taxCents;
```

---

### Task 4: CheckoutModal — 修复支付方式发送

**Files:**
- Modify: `src/pages/kanban/components/CheckoutModal.tsx`

- [ ] **Step 1: 添加无支付选项**

在 `PaymentMethod` 类型中添加 `'none'`：

```tsx
type PaymentMethod = 'card' | 'cash' | 'other' | 'none';
```

在 `Radio.Group` options 中添加无支付选项：

```tsx
options={[
  { label: '信用卡', value: 'card' },
  { label: '现金', value: 'cash' },
  { label: '其他', value: 'other' },
  { label: '无支付', value: 'none' },
]}
```

- [ ] **Step 2: 修复 doCheckout 中 payment 对象构建**

将 `doCheckout` 函数中 payment 构建逻辑改为：

```tsx
// Payment
if (paymentMethod === 'card' && sourceId) {
  req.payment = {
    method: 'SQUARE_CARD',
    sourceId,
    amount: totalCents,
  };
} else if (paymentMethod === 'cash') {
  req.payment = {
    method: 'MANUAL_CASH',
    amount: totalCents,
  };
} else if (paymentMethod === 'other') {
  req.payment = {
    method: 'MANUAL_OTHER',
    amount: totalCents,
  };
}
// paymentMethod === 'none' → 不发 payment，order 为 PENDING
```

- [ ] **Step 3: 在 doCheckout 中发送 discount 和 taxAmount**

在 `// Payment` 注释之前，添加：

```tsx
// Discount
if (discountCents > 0) {
  if (discountMode === 'fixed' && discountAmount != null) {
    req.discount = { amount: discountCents };
  } else if (discountMode === 'percent' && discountPercent != null) {
    req.discount = { percentage: discountPercent };
  }
  if (discountReason) {
    req.discount = { ...req.discount!, reason: discountReason };
  }
}

// Tax
if (taxCents > 0) {
  req.taxAmount = taxCents;
}
```

- [ ] **Step 4: 更新 submit 按钮逻辑**

将底部按钮区域更新为：信用卡仍由 Square form 提交；现金/其他显示确认结账按钮；无支付也显示确认按钮（文案不同）：

```tsx
{paymentMethod === 'card' ? (
  <div className={styles.noPaymentHint}>
    请在上方信用卡表单中点击 "Pay" 完成支付
  </div>
) : (
  <button
    type="button"
    className={`ant-btn ant-btn-primary ${styles.confirmBtn}`}
    disabled={loading}
    onClick={handleCashOrOtherSubmit}
    style={{ marginTop: 16 }}
  >
    {loading ? '处理中...' : paymentMethod === 'none' ? '确认结账（无支付）' : '确认结账'}
  </button>
)}

{paymentMethod === 'none' && (
  <div className={styles.noPaymentHint}>
    不收取费用，订单将标记为待支付
  </div>
)}
{paymentMethod !== 'card' && paymentMethod !== 'none' && (
  <div className={styles.noPaymentHint}>
    确认后将记录为{paymentMethod === 'cash' ? '现金' : '其他方式'}收款
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/kanban/components/CheckoutModal.tsx
git commit -m "feat: add discount, tax, payment method to checkout modal"
```

---

### Task 5: CheckoutModal — 更新费用明细

**Files:**
- Modify: `src/pages/kanban/components/CheckoutModal.tsx`

- [ ] **Step 1: 更新右栏费用明细区域**

将现有的费用明细区域（约第 513-540 行）替换为包含折扣和税费的完整版本：

```tsx
{/* Amount summary */}
<div className={styles.sectionTitle}>费用明细</div>
<div className={styles.summaryRow}>
  <span className={styles.summaryLabel}>小计</span>
  <span className={styles.summaryValue}>
    {formatCents(subtotalCents)}
  </span>
</div>
{discountCents > 0 && (
  <div className={styles.summaryRow}>
    <span className={styles.summaryLabel}>折扣</span>
    <span className={styles.summaryValue} style={{ color: '#52c41a' }}>
      -{formatCents(discountCents)}
    </span>
  </div>
)}
{tipCents > 0 && (
  <div className={styles.summaryRow}>
    <span className={styles.summaryLabel}>小费</span>
    <span className={styles.summaryValue}>
      {formatCents(tipCents)}
    </span>
  </div>
)}
{taxCents > 0 && (
  <div className={styles.summaryRow}>
    <span className={styles.summaryLabel}>税费</span>
    <span className={styles.summaryValue}>
      {formatCents(taxCents)}
    </span>
  </div>
)}
<Divider className={styles.divider} />
<div className={styles.summaryRow}>
  <span className={`${styles.summaryLabel} ${styles.summaryTotal}`}>
    合计
  </span>
  <span className={`${styles.summaryValue} ${styles.summaryTotal}`}>
    {formatCents(totalCents)}
  </span>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/kanban/components/CheckoutModal.tsx
git commit -m "feat: update checkout fee summary with discount and tax lines"
```

---

### Task 6: 更新 Kanban 结账成功处理

**Files:**
- Modify: `src/pages/kanban/index.tsx:242-265`

- [ ] **Step 1: 更新 handleCheckoutSuccess**

`CheckoutResponse.order` 字段已更新，`totalAmount` 不再存在，改用 `currentTotal`：

```tsx
const handleCheckoutSuccess = useCallback((res: API.CheckoutResponse) => {
  const aptId = res?.appointment?.id;
  const totalAmount = res?.order?.currentTotal ?? null;

  if (aptId) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, state: 'FINAL' } : a)),
    );

    if (totalAmount != null) {
      setCheckoutAmounts((prev) => ({ ...prev, [aptId]: totalAmount }));
    }

    const hasCompletedPayment =
      res?.payment != null && res.payment.status === 'COMPLETED';
    if (!hasCompletedPayment) {
      setCheckoutPendingSet((prev) => new Set(prev).add(aptId));
    }
  }

  message.success('结账成功');
}, []);
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/kanban/index.tsx
git commit -m "fix: update kanban checkout handler for new response shape"
```

---

### Task 7: 验证与测试

- [ ] **Step 1: 启动前端开发服务器**

```bash
cd /Users/cs/Desktop/workspace/c/ant-design-pro-cl && npm run dev
```

- [ ] **Step 2: 手动测试场景**

1. 打开 Kanban 页面，将一个预约拖到 FINAL 列
2. **测试无支付结账**: 选择"无支付"→ 确认结账 → 检查订单状态为 PENDING
3. **测试现金结账**: 选择"现金"→ 确认结账 → 检查订单状态为 COMPLETED
4. **测试折扣**: 选择固定金额折扣 → 输入金额 → 确认费用明细显示折扣行
5. **测试百分比折扣**: 选择百分比折扣 → 输入百分比 → 确认计算正确
6. **测试税费**: 输入税费 → 确认费用明细显示税费行
7. **测试组合**: 折扣 + 小费 + 税费 + 现金支付 → 确认合计计算正确
8. **测试信用卡**: Square form 正常显示

- [ ] **Step 3: Commit 测试修复（如有）**
