import { Tag } from 'antd';
import React from 'react';

const stateConfig: Record<string, { color: string; label: string }> = {
  BOOKED: { color: 'blue', label: '已预约' },
  CONFIRMED: { color: 'green', label: '已确认' },
  ARRIVED: { color: 'gold', label: '已到达' },
  ACTIVE: { color: 'purple', label: '进行中' },
  FINAL: { color: 'default', label: '已完成' },
  CANCELLED: { color: 'red', label: '已取消' },
};

interface AppointmentStateBadgeProps {
  state?: string;
  cancelled?: boolean;
}

const AppointmentStateBadge: React.FC<AppointmentStateBadgeProps> = ({
  state,
  cancelled,
}) => {
  if (cancelled) {
    return <Tag color="red">已取消</Tag>;
  }
  const config = stateConfig[state || 'BOOKED'] || {
    color: 'blue',
    label: state || '未知',
  };
  return <Tag color={config.color}>{config.label}</Tag>;
};

export default AppointmentStateBadge;
