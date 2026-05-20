import {
  Divider,
  Input,
  InputNumber,
  Modal,
  message,
  Radio,
  Select,
  Spin,
} from 'antd';
import { createStyles } from 'antd-style';
import React, { useCallback, useMemo, useState } from 'react';
import { CreditCard, PaymentForm } from 'react-square-web-payments-sdk';
import { checkoutAppointment } from '@/services/ant-design-pro/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckoutModalProps {
  open: boolean;
  appointment: API.AppointmentItem | null;
  onClose: () => void;
  onSuccess: (result: API.CheckoutResponse) => void;
}

type PaymentMethod = 'card' | 'cash' | 'other' | 'none';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CENTS_PER_DOLLAR = 100;

/** Format cents to display string like $12.34 */
function formatCents(cents: number): string {
  const dollars = cents / CENTS_PER_DOLLAR;
  return `$${dollars.toFixed(2)}`;
}

/** Convert dollars (number) to cents */
function dollarsToCents(dollars: number): number {
  return Math.round(dollars * CENTS_PER_DOLLAR);
}

const CHECKOUTABLE_STATES = new Set([
  'BOOKED',
  'CONFIRMED',
  'ARRIVED',
  'ACTIVE',
]);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = createStyles(({ token, css }) => ({
  body: css`
    display: flex;
    gap: 24px;
    min-height: 400px;
  `,
  leftCol: css`
    flex: 1;
    min-width: 0;
  `,
  rightCol: css`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  `,
  sectionTitle: css`
    font-size: 14px;
    font-weight: 600;
    color: ${token.colorText};
    margin-bottom: 8px;
  `,
  serviceItem: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;
  `,
  serviceName: css`
    color: ${token.colorText};
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  servicePrice: css`
    color: ${token.colorTextSecondary};
    margin-left: 12px;
    flex-shrink: 0;
  `,
  tipButtons: css`
    display: flex;
    gap: 8px;
    margin-top: 8px;
    margin-bottom: 8px;
  `,
  tipButton: css`
    flex: 1;
    text-align: center;
    padding: 4px 12px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadius}px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
    background: ${token.colorBgContainer};

    &:hover {
      border-color: ${token.colorPrimary};
      color: ${token.colorPrimary};
    }
  `,
  tipButtonActive: css`
    border-color: ${token.colorPrimary} !important;
    color: ${token.colorPrimary} !important;
    background: ${token.colorPrimaryBg} !important;
  `,
  customTipRow: css`
    margin-top: 8px;
  `,
  tipStaffSelect: css`
    margin-top: 8px;
    width: 100%;
  `,
  notesInput: css`
    margin-top: 8px;
  `,
  paymentSwitch: css`
    margin-bottom: 16px;
  `,
  cardContainer: css`
    margin-bottom: 16px;
  `,
  summaryRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    font-size: 13px;
  `,
  summaryLabel: css`
    color: ${token.colorTextSecondary};
  `,
  summaryValue: css`
    color: ${token.colorText};
    font-weight: 500;
  `,
  summaryTotal: css`
    font-size: 16px;
    font-weight: 700;
  `,
  confirmBtn: css`
    margin-top: auto;
    width: 100%;
  `,
  divider: css`
    margin: 12px 0;
  `,
  noPaymentHint: css`
    text-align: center;
    color: ${token.colorTextSecondary};
    font-size: 12px;
    margin-top: 8px;
  `,
  clientName: css`
    font-size: 13px;
    color: ${token.colorTextSecondary};
    margin-bottom: 12px;
  `,
}));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  open,
  appointment,
  onClose,
  onSuccess,
}) => {
  const { styles } = useStyles();

  // ---- state ----
  const [loading, setLoading] = useState(false);
  const [tipPercent, setTipPercent] = useState<number | null>(null);
  const [customTipDollars, setCustomTipDollars] = useState<number | null>(null);
  const [tipStaffId, setTipStaffId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [discountMode, setDiscountMode] = useState<'none' | 'fixed' | 'percent'>('none');
  const [discountAmount, setDiscountAmount] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [discountReason, setDiscountReason] = useState('');
  const [taxAmount, setTaxAmount] = useState<number | null>(null);

  // Reset on close
  const handleClose = useCallback(() => {
    setLoading(false);
    setTipPercent(null);
    setCustomTipDollars(null);
    setTipStaffId('');
    setNotes('');
    setPaymentMethod('card');
    setDiscountMode('none');
    setDiscountAmount(null);
    setDiscountPercent(null);
    setDiscountReason('');
    setTaxAmount(null);
    onClose();
  }, [onClose]);

  // ---- derived data ----
  const services = useMemo(
    () => (appointment?.appointmentServices as any[]) || [],
    [appointment],
  );

  const staffOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const svc of services) {
      const id = svc.staffId || '';
      const name = svc.staffName || svc.staff?.name || id;
      if (id && !seen.has(id)) {
        seen.set(id, name);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));
  }, [services]);

  const defaultStaffId = useMemo(
    () => services[0]?.staffId || appointment?.staffId || '',
    [services, appointment],
  );

  // Resolve effective tip staff (may be empty → won't send gratuity)
  const effectiveTipStaffId = tipStaffId || defaultStaffId;

  const subtotalCents = useMemo(() => {
    let total = 0;
    for (const svc of services) {
      const price = svc.price?.amount ?? svc.unitPrice ?? 0;
      total += typeof price === 'number' ? price : 0;
    }
    return total;
  }, [services]);

  const tipCents = useMemo(() => {
    if (customTipDollars != null && customTipDollars > 0) {
      return dollarsToCents(customTipDollars);
    }
    if (tipPercent != null && subtotalCents > 0) {
      return Math.round(subtotalCents * (tipPercent / 100));
    }
    return 0;
  }, [customTipDollars, tipPercent, subtotalCents]);

  const discountCents = useMemo(() => {
    if (discountMode === 'fixed' && discountAmount != null && discountAmount > 0) {
      return Math.min(dollarsToCents(discountAmount), subtotalCents);
    }
    if (discountMode === 'percent' && discountPercent != null && discountPercent > 0) {
      return Math.round(subtotalCents * (discountPercent / 100));
    }
    return 0;
  }, [discountMode, discountAmount, discountPercent, subtotalCents]);

  const taxCents = useMemo(() => {
    if (taxAmount != null && taxAmount > 0) {
      return dollarsToCents(taxAmount);
    }
    return 0;
  }, [taxAmount]);

  const totalCents = subtotalCents - discountCents + tipCents + taxCents;

  const clientName = useMemo(() => {
    if (!appointment?.client) return '';
    const c = appointment.client as any;
    return c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || '';
  }, [appointment]);

  // ---- gate ----
  const canCheckout =
    appointment && CHECKOUTABLE_STATES.has(appointment.state || '');

  // ---- submit handlers ----
  const doCheckout = useCallback(
    async (sourceId?: string) => {
      if (!appointment) return;
      setLoading(true);
      try {
        const req: API.CheckoutRequest = {
          staffId: defaultStaffId,
        };

        // Gratuity
        if (tipCents > 0 && effectiveTipStaffId) {
          req.gratuity = {
            amount: tipCents,
            staffId: effectiveTipStaffId,
          };
        }

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
        // paymentMethod === 'none' → no payment, order stays PENDING

        // Notes (not part of CheckoutRequest but kept for potential future use)
        void notes;

        const result = await checkoutAppointment(appointment.id, req);
        message.success('结账成功');
        onSuccess(result);
        handleClose();
      } catch (err: any) {
        message.error(
          err?.message || err?.error?.message || '结账失败，请重试',
        );
      } finally {
        setLoading(false);
      }
    },
    [
      appointment,
      defaultStaffId,
      tipCents,
      effectiveTipStaffId,
      paymentMethod,
      totalCents,
      discountCents,
      discountMode,
      discountAmount,
      discountPercent,
      discountReason,
      taxCents,
      notes,
      onSuccess,
      handleClose,
    ],
  );

  // Square card tokenization callback
  const handleCardTokenize = useCallback(
    async (token: any) => {
      if (!token?.token) {
        message.error('信用卡信息无效');
        return;
      }
      await doCheckout(token.token);
    },
    [doCheckout],
  );

  // Cash / Other submit
  const handleCashOrOtherSubmit = useCallback(() => {
    doCheckout();
  }, [doCheckout]);

  const squareAppId = (globalThis as any).SQUARE_APPLICATION_ID || '';
  const squareLocationId = (globalThis as any).SQUARE_LOCATION_ID || '';

  // ---- render helpers ----
  const renderTipPercentButton = (pct: number) => {
    const active = tipPercent === pct && customTipDollars == null;
    return (
      <div
        key={pct}
        className={`${styles.tipButton} ${active ? styles.tipButtonActive : ''}`}
        onClick={() => {
          setTipPercent(pct);
          setCustomTipDollars(null);
        }}
      >
        {pct}%
        {subtotalCents > 0 && (
          <div style={{ fontSize: 11, color: 'inherit', opacity: 0.7 }}>
            {formatCents(Math.round(subtotalCents * (pct / 100)))}
          </div>
        )}
      </div>
    );
  };

  // ---- render ----
  return (
    <Modal
      title="结账"
      open={open}
      onCancel={handleClose}
      width={720}
      destroyOnClose
      footer={null}
      maskClosable={false}
    >
      <Spin spinning={loading}>
        {!canCheckout ? (
          <div
            style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}
          >
            该预约当前状态无法结账
          </div>
        ) : (
          <div className={styles.body}>
            {/* ========== Left Column ========== */}
            <div className={styles.leftCol}>
              {/* Client name */}
              {clientName && (
                <div className={styles.clientName}>客户: {clientName}</div>
              )}

              {/* Service items */}
              <div className={styles.sectionTitle}>服务项目</div>
              {services.length === 0 ? (
                <div style={{ color: '#999', fontSize: 13 }}>无服务项目</div>
              ) : (
                services.map((svc: any, idx: number) => {
                  const name = svc.name || svc.serviceName || `服务 ${idx + 1}`;
                  const price = svc.price?.amount ?? svc.unitPrice ?? 0;
                  return (
                    <div
                      key={svc.serviceId || name}
                      className={styles.serviceItem}
                    >
                      <span className={styles.serviceName}>{name}</span>
                      <span className={styles.servicePrice}>
                        {typeof price === 'number' ? formatCents(price) : '-'}
                      </span>
                    </div>
                  );
                })
              )}

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
              {discountMode !== 'none' && (
                <Input
                  placeholder="折扣原因（可选）"
                  style={{ marginTop: 8 }}
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                />
              )}

              {/* Tax section */}
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

              <Divider className={styles.divider} />

              {/* Tip section */}
              <div className={styles.sectionTitle}>小费</div>
              <div className={styles.tipButtons}>
                {[15, 18, 20].map(renderTipPercentButton)}
              </div>
              <div className={styles.customTipRow}>
                <InputNumber
                  placeholder="自定义金额 ($)"
                  min={0}
                  max={9999}
                  precision={2}
                  style={{ width: '100%' }}
                  value={customTipDollars}
                  onChange={(val) => {
                    setCustomTipDollars(val ?? null);
                    if (val != null && val > 0) {
                      setTipPercent(null);
                    }
                  }}
                />
              </div>
              <Select
                className={styles.tipStaffSelect}
                placeholder="选择小费归属员工"
                value={effectiveTipStaffId || undefined}
                onChange={(val) => setTipStaffId(val)}
                options={staffOptions}
                allowClear
              />

              <Divider className={styles.divider} />

              {/* Notes */}
              <div className={styles.sectionTitle}>备注</div>
              <Input.TextArea
                className={styles.notesInput}
                rows={3}
                placeholder="可选备注..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* ========== Right Column ========== */}
            <div className={styles.rightCol}>
              {/* Payment method switch */}
              <div className={styles.paymentSwitch}>
                <Radio.Group
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                  options={[
                    { label: '信用卡', value: 'card' },
                    { label: '现金', value: 'cash' },
                    { label: '其他', value: 'other' },
                    { label: '无支付', value: 'none' },
                  ]}
                />
              </div>

              {/* Credit card form */}
              {paymentMethod === 'card' && squareAppId && (
                <div className={styles.cardContainer}>
                  <PaymentForm
                    applicationId={squareAppId}
                    locationId={squareLocationId}
                    cardTokenizeResponseReceived={handleCardTokenize}
                  >
                    <CreditCard
                      focus="cardNumber"
                      style={{
                        '.message-text': { color: '#999' },
                        '.input': { fontSize: '14px' },
                      }}
                    >
                      {/* The CreditCard component renders its own submit button
                          which triggers tokenization then our callback */}
                    </CreditCard>
                  </PaymentForm>
                </div>
              )}

              {paymentMethod === 'card' && !squareAppId && (
                <div
                  style={{
                    color: '#ff4d4f',
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  Square 配置缺失，无法使用信用卡支付
                </div>
              )}

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
                <span
                  className={`${styles.summaryLabel} ${styles.summaryTotal}`}
                >
                  合计
                </span>
                <span
                  className={`${styles.summaryValue} ${styles.summaryTotal}`}
                >
                  {formatCents(totalCents)}
                </span>
              </div>

              {/* Confirm / Submit */}
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
            </div>
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default CheckoutModal;
