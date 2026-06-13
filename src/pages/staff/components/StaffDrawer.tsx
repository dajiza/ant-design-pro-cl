import { EditOutlined, EnvironmentOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Descriptions,
  Divider,
  Drawer,
  message,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
  updateStaff,
  updateStaffLocation,
} from '@/services/ant-design-pro/api';
import StaffFormModal from './StaffFormModal';
import StaffLocationModal from './StaffLocationModal';

const { Text } = Typography;

interface StaffDrawerProps {
  open: boolean;
  staff: API.StaffItem | null;
  roles: API.StaffRoleItem[];
  locations: API.LocationItem[];
  onClose: () => void;
  onRefresh: () => void;
}

const StaffDrawer: React.FC<StaffDrawerProps> = ({
  open,
  staff,
  roles,
  locations,
  onClose,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  if (!staff) return null;

  const handleEdit = async (values: any) => {
    setLoading(true);
    try {
      await updateStaff(staff.id, values);
      message.success('员工信息已更新');
      setEditModalOpen(false);
      onRefresh();
    } catch (error: any) {
      message.error(`更新失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLocation = async (values: {
    locationId: string;
    active: boolean;
  }) => {
    setLoading(true);
    try {
      await updateStaffLocation(staff.id, values);
      message.success(values.active ? '已分配门店' : '已移除门店');
      setLocationModalOpen(false);
      onRefresh();
    } catch (error: any) {
      message.error(`操作失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Drawer
        title={staff.displayName || staff.name}
        open={open}
        onClose={onClose}
        width={520}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Avatar
            size={64}
            src={staff.avatar}
            style={
              staff.hexColor ? { backgroundColor: staff.hexColor } : undefined
            }
          >
            {(staff.firstName?.[0] || staff.name?.[0] || '?').toUpperCase()}
          </Avatar>
        </div>

        <Descriptions column={2} size="small">
          <Descriptions.Item label="姓名">
            {staff.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="显示名">
            {staff.displayName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">
            {staff.email || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="手机">
            {staff.mobilePhone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="角色">
            {staff.role?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="昵称">
            {staff.nickname || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="标识颜色">
            {staff.hexColor ? (
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    backgroundColor: staff.hexColor,
                  }}
                />
                {staff.hexColor}
              </span>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={staff.active ? 'green' : 'red'}>
              {staff.active ? '活跃' : '未激活'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="停用">
            <Tag color={staff.suspended ? 'red' : 'green'}>
              {staff.suspended ? '已停用' : '正常'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {staff.bio && (
          <>
            <Divider>简介</Divider>
            <Text type="secondary">{staff.bio}</Text>
          </>
        )}

        {staff.locations && (staff.locations as any[]).length > 0 && (
          <>
            <Divider>所属门店</Divider>
            <Space wrap>
              {(staff.locations as any[]).map((loc: any) => (
                <Tag key={loc.id} color="blue">
                  {loc.name || loc.id}
                </Tag>
              ))}
            </Space>
          </>
        )}

        <Divider>操作</Divider>
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditModalOpen(true)}
          >
            编辑
          </Button>
          <Button
            icon={<EnvironmentOutlined />}
            onClick={() => setLocationModalOpen(true)}
          >
            分配门店
          </Button>
        </Space>

        <Divider style={{ marginBottom: 8 }} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          ID: {staff.id} | 创建于:{' '}
          {dayjs(staff.createdAt).format('YYYY-MM-DD HH:mm')}
        </Text>
      </Drawer>

      <StaffFormModal
        open={editModalOpen}
        staff={staff}
        roles={roles}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleEdit}
        loading={loading}
      />
      <StaffLocationModal
        open={locationModalOpen}
        locations={locations}
        onCancel={() => setLocationModalOpen(false)}
        onOk={handleLocation}
        loading={loading}
      />
    </>
  );
};

export default StaffDrawer;
