import { DeleteOutlined } from '@ant-design/icons';
import {
  Button,
  Descriptions,
  Divider,
  Drawer,
  message,
  Popconfirm,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import React, { useState } from 'react';
import { deleteTimeblock } from '@/services/ant-design-pro/api';

dayjs.extend(utc);
dayjs.extend(timezone);

/** 按 location.tz 将 UTC ISO 字符串格式化为门店当地时间 */
const formatByLocationTz = (iso?: string | null, tz?: string | null) => {
  if (!iso) return '-';
  const utcIso = iso.endsWith('Z') ? iso : `${iso}Z`;
  return dayjs(utcIso)
    .tz(tz || 'UTC')
    .format('YYYY-MM-DD HH:mm');
};

const { Text } = Typography;

interface TimeblockDrawerProps {
  open: boolean;
  timeblock: API.TimeblockItem | null;
  onClose: () => void;
  onRefresh: () => void;
}

const TimeblockDrawer: React.FC<TimeblockDrawerProps> = ({
  open,
  timeblock,
  onClose,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);

  if (!timeblock) return null;

  const reasonMap: Record<string, { color: string; text: string }> = {
    BUSINESS: { color: 'blue', text: '商务' },
    PERSONAL: { color: 'orange', text: '个人' },
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteTimeblock(timeblock.id);
      message.success('时间块已删除');
      onClose();
      onRefresh();
    } catch (error: any) {
      message.error(`删除失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const staffName =
    timeblock.staff?.displayName ||
    [timeblock.staff?.firstName, timeblock.staff?.lastName]
      .filter(Boolean)
      .join(' ') ||
    '-';

  return (
    <Drawer
      title={timeblock.title || '时间块详情'}
      open={open}
      onClose={onClose}
      width={520}
    >
      <Descriptions column={2} size="small">
        <Descriptions.Item label="标题" span={2}>
          {timeblock.title || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="原因">
          {timeblock.reason
            ? (() => {
                const item = reasonMap[timeblock.reason];
                return item ? <Tag color={item.color}>{item.text}</Tag> : '-';
              })()
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="已取消">
          <Tag color={timeblock.cancelled ? 'red' : 'default'}>
            {timeblock.cancelled ? '已取消' : '正常'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="员工" span={2}>
          {staffName}
        </Descriptions.Item>
        <Descriptions.Item label="门店" span={2}>
          {timeblock.location?.name || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="开始时间">
          {formatByLocationTz(timeblock.startAt, timeblock.location?.tz)}
        </Descriptions.Item>
        <Descriptions.Item label="时长">
          {`${timeblock.duration}分钟`}
        </Descriptions.Item>
        <Descriptions.Item label="结束时间" span={2}>
          {formatByLocationTz(timeblock.endAt, timeblock.location?.tz)}
        </Descriptions.Item>
        <Descriptions.Item label="时区" span={2}>
          {timeblock.location?.tz || '-'}
        </Descriptions.Item>
      </Descriptions>

      <Divider style={{ marginBottom: 8 }} />
      <Text type="secondary" style={{ fontSize: 12 }}>
        ID: {timeblock.id}
      </Text>

      <Divider />

      <Popconfirm
        title="确定删除此时间块？"
        onConfirm={handleDelete}
        okText="确定"
        cancelText="取消"
      >
        <Button danger icon={<DeleteOutlined />} loading={loading}>
          删除
        </Button>
      </Popconfirm>
    </Drawer>
  );
};

export default TimeblockDrawer;
