import { Tag } from 'antd';
import React from 'react';

interface AlertInfo {
  level: 'default' | 'green' | 'yellow' | 'red';
  label: string;
  action?: string;
}

export type DepositOrderType = 'DEPOSIT' | 'PENALTY_AMOUNT' | 'OTHER';
export type DepositStatus = 'INIT' | 'ING' | 'PAID' | 'CANCELED';

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
    if (hours >= 29)
      return { level: 'red', label: 'Overdue 29h+', action: 'cancel' };
    if (hours >= 24)
      return { level: 'yellow', label: 'Overdue 24h+', action: 'resend' };
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

const DepositStatusTag: React.FC<DepositStatusTagProps> = ({
  status,
  orderType,
  createdAt,
}) => {
  const info = getPaymentAlertInfo(orderType, status, createdAt);
  return <Tag color={levelToColor[info.level]}>{info.label}</Tag>;
};

export default DepositStatusTag;
