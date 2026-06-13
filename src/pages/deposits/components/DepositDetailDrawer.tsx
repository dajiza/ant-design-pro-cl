import { request } from '@umijs/max';
import {
  Button,
  Descriptions,
  Drawer,
  message,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import DepositStatusTag, { getPaymentAlertInfo } from './DepositStatusTag';

const { Text, Paragraph } = Typography;

interface DepositOrder {
  id: string;
  locationId: string;
  clientId: string;
  amount: number;
  orderType: 'DEPOSIT' | 'PENALTY_AMOUNT' | 'OTHER';
  status: 'INIT' | 'ING' | 'PAID' | 'CANCELED';
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
  squarePaymentResult: Record<string, any> | null;
  status: 'INIT' | 'ING' | 'PAID' | 'CANCELED';
  createdAt: string;
  updatedAt: string;
}

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
      const res = await request(`/api/v1/deposits/${depositId}`, {
        method: 'GET',
      });
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
      const res = await request(`/api/v1/deposits/${depositId}/payment-link`, {
        method: 'POST',
      });
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
      await request(`/api/v1/deposits/${depositId}/cancel`, {
        method: 'POST',
        data: {},
      });
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
      await request(`/api/v1/deposits/${depositId}/status`, {
        method: 'PATCH',
        data: { status: 'PAID' },
      });
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
            <Descriptions.Item label="Created">
              {deposit.createdAt}
            </Descriptions.Item>
            <Descriptions.Item label="Updated">
              {deposit.updatedAt}
            </Descriptions.Item>
          </Descriptions>

          {alertInfo?.action && (
            <div style={{ marginTop: 12 }}>
              <Text type="warning">
                {alertInfo.label} —{' '}
                {alertInfo.action === 'cancel' &&
                  'Consider canceling this order.'}
                {alertInfo.action === 'resend' &&
                  'Consider resending the payment link.'}
                {alertInfo.action === 'index-card' &&
                  'Consider flagging for collection.'}
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
                      <a
                        href={payment.paymentLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
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
                <Popconfirm
                  title="Mark as paid manually?"
                  onConfirm={handleMarkPaid}
                >
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
