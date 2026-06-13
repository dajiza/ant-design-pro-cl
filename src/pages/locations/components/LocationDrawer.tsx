import { ClockCircleOutlined, EditOutlined } from '@ant-design/icons';
import {
  Button,
  Descriptions,
  Divider,
  Drawer,
  message,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
  getLocation,
  updateLocation,
  updateLocationHours,
} from '@/services/ant-design-pro/api';
import LocationEditModal from './LocationEditModal';
import LocationHoursModal from './LocationHoursModal';

const { Text } = Typography;

const DAY_LABELS: Record<string, string> = {
  MONDAY: '周一',
  TUESDAY: '周二',
  WEDNESDAY: '周三',
  THURSDAY: '周四',
  FRIDAY: '周五',
  SATURDAY: '周六',
  SUNDAY: '周日',
};

const DAY_ORDER = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const pad2 = (n: number) => String(n).padStart(2, '0');

interface LocationDrawerProps {
  open: boolean;
  location: API.LocationItem | null;
  onClose: () => void;
  onRefresh: () => void;
}

const LocationDrawer: React.FC<LocationDrawerProps> = ({
  open,
  location,
  onClose,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] =
    useState<API.LocationItem | null>(location);

  // Reload full location data when drawer opens
  React.useEffect(() => {
    if (open && location?.id) {
      getLocation(location.id)
        .then((data) => setCurrentLocation(data))
        .catch(() => setCurrentLocation(location));
    }
    if (!open) {
      setCurrentLocation(null);
    }
  }, [open, location]);

  if (!currentLocation) return null;

  const loc = currentLocation;
  const addr = loc.address;

  const handleEdit = async (values: any) => {
    setLoading(true);
    try {
      await updateLocation(loc.id, values);
      const updated = await getLocation(loc.id);
      setCurrentLocation(updated);
      message.success('门店信息已更新');
      setEditModalOpen(false);
      onRefresh();
    } catch (error: any) {
      message.error(`更新失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHours = async (hours: API.LocationHoursInput[]) => {
    setLoading(true);
    try {
      await updateLocationHours(loc.id, hours);
      const updated = await getLocation(loc.id);
      setCurrentLocation(updated);
      message.success('营业时间已更新');
      setHoursModalOpen(false);
      onRefresh();
    } catch (error: any) {
      message.error(`更新失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Build hours table data
  const hoursData = DAY_ORDER.map((day, idx) => {
    const entry = (loc.hours as any[])?.find((h: any) => h.day === day);
    return {
      key: day,
      day: DAY_LABELS[day],
      open: entry?.open ?? false,
      start: entry?.start
        ? `${pad2(entry.start.hour)}:${pad2(entry.start.min)}`
        : '--:--',
      finish: entry?.finish
        ? `${pad2(entry.finish.hour)}:${pad2(entry.finish.min)}`
        : '--:--',
      raw: entry || null,
    };
  });

  const hoursColumns = [
    { title: '日期', dataIndex: 'day', width: 80 },
    {
      title: '状态',
      dataIndex: 'open',
      width: 80,
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'default'}>{val ? '营业' : '休息'}</Tag>
      ),
    },
    { title: '开始', dataIndex: 'start', width: 80 },
    { title: '结束', dataIndex: 'finish', width: 80 },
  ];

  return (
    <>
      <Drawer title={loc.name} open={open} onClose={onClose} width={560}>
        {/* Address */}
        <Descriptions column={1} size="small" title="地址">
          {addr?.line1 && (
            <Descriptions.Item label="街道1">{addr.line1}</Descriptions.Item>
          )}
          {addr?.line2 && (
            <Descriptions.Item label="街道2">{addr.line2}</Descriptions.Item>
          )}
          {(addr?.city || addr?.state || addr?.zip) && (
            <Descriptions.Item label="城市/州/邮编">
              {[addr.city, addr.state, addr.zip].filter(Boolean).join(', ')}
            </Descriptions.Item>
          )}
          {addr?.country && (
            <Descriptions.Item label="国家">{addr.country}</Descriptions.Item>
          )}
          {!addr?.line1 && !addr?.city && (
            <Descriptions.Item>-</Descriptions.Item>
          )}
        </Descriptions>

        <Divider />

        {/* Contact Info */}
        <Descriptions column={2} size="small" title="联系信息">
          <Descriptions.Item label="电话">{loc.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="网站">
            {loc.website ? (
              <a href={loc.website} target="_blank" rel="noreferrer">
                {loc.website}
              </a>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="联系邮箱">
            {loc.contactEmail || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="账单邮箱">
            {loc.billingContactEmail || '-'}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Business Hours */}
        <div style={{ marginBottom: 8 }}>
          <Text strong>营业时间</Text>
        </div>
        <Table
          columns={hoursColumns}
          dataSource={hoursData}
          pagination={false}
          size="small"
        />

        <Divider />

        {/* Other Info */}
        <Descriptions column={2} size="small" title="其他信息">
          <Descriptions.Item label="类型">
            <Tag color={loc.isRemote ? 'blue' : 'green'}>
              {loc.isRemote ? '远程' : '实体'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="时区">{loc.tz}</Descriptions.Item>
          <Descriptions.Item label="显示营业时间">
            <Tag color={loc.showLocationHours ? 'green' : 'default'}>
              {loc.showLocationHours ? '是' : '否'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="外部ID">
            {loc.externalId || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="坐标">
            {loc.coordinates
              ? `${loc.coordinates.lat}, ${loc.coordinates.lng}`
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Google Place ID">
            {loc.googlePlaceId || '-'}
          </Descriptions.Item>
          {loc.arrivalInstructions && (
            <Descriptions.Item label="到达指引" span={2}>
              {loc.arrivalInstructions}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider />

        {/* Actions */}
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditModalOpen(true)}
          >
            编辑信息
          </Button>
          <Button
            icon={<ClockCircleOutlined />}
            onClick={() => setHoursModalOpen(true)}
          >
            编辑营业时间
          </Button>
        </Space>

        <Divider style={{ marginBottom: 8 }} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          ID: {loc.id} | 创建于:{' '}
          {dayjs(loc.createdAt).format('YYYY-MM-DD HH:mm')}
        </Text>
      </Drawer>

      <LocationEditModal
        open={editModalOpen}
        location={currentLocation}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleEdit}
        loading={loading}
      />

      <LocationHoursModal
        open={hoursModalOpen}
        hours={(loc.hours as API.LocationHoursInput[]) || []}
        onCancel={() => setHoursModalOpen(false)}
        onOk={handleHours}
        loading={loading}
      />
    </>
  );
};

export default LocationDrawer;
