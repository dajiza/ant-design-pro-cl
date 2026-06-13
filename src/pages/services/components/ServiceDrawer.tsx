import { EditOutlined } from '@ant-design/icons';
import {
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
  activateService,
  deactivateService,
  updateService,
} from '@/services/ant-design-pro/api';
import OverlapConfigSection from './OverlapConfigSection';
import ServiceActivateModal from './ServiceActivateModal';
import ServiceFormModal from './ServiceFormModal';

const { Text } = Typography;

interface ServiceDrawerProps {
  open: boolean;
  service: API.ServiceItem | null;
  categories: API.ServiceCategoryItem[];
  locations: API.LocationItem[];
  onClose: () => void;
  onRefresh: () => void;
}

const ServiceDrawer: React.FC<ServiceDrawerProps> = ({
  open,
  service,
  categories,
  locations,
  onClose,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);

  if (!service) return null;

  const handleEdit = async (values: any) => {
    setLoading(true);
    try {
      await updateService(service.id, values);
      message.success('服务信息已更新');
      setEditModalOpen(false);
      onRefresh();
    } catch (error: any) {
      message.error(`更新失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (values: { locationId: string }) => {
    setLoading(true);
    try {
      if (service.active) {
        await deactivateService(service.id, values);
        message.success('服务已停用');
      } else {
        await activateService(service.id, values);
        message.success('服务已激活');
      }
      setActivateModalOpen(false);
      onRefresh();
    } catch (error: any) {
      message.error(`操作失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Drawer title={service.name} open={open} onClose={onClose} width={520}>
        <Descriptions column={2} size="small">
          <Descriptions.Item label="服务名称">
            {service.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="分类">
            {service.category?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="价格">
            ¥{(service.defaultPrice / 100).toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="时长">
            {service.defaultDuration} 分钟
          </Descriptions.Item>
          <Descriptions.Item label="附加服务">
            <Tag color={service.addon ? 'blue' : 'default'}>
              {service.addon ? '是' : '否'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={service.active ? 'green' : 'default'}>
              {service.active ? '活跃' : '未激活'}
            </Tag>
          </Descriptions.Item>
          {service.serviceStatus && (
            <>
              <Descriptions.Item label="可预约">
                <Tag color={service.serviceStatus.bookable ? 'green' : 'red'}>
                  {service.serviceStatus.bookable ? '是' : '否'}
                </Tag>
              </Descriptions.Item>
            </>
          )}
        </Descriptions>

        {service.description && (
          <>
            <Divider>描述</Divider>
            <Text type="secondary">{service.description}</Text>
          </>
        )}

        {service.externalId && (
          <>
            <Divider>外部信息</Divider>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="外部ID">
                {service.externalId}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}

        <OverlapConfigSection serviceId={service.id} locations={locations} />

        <Divider>操作</Divider>
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditModalOpen(true)}
          >
            编辑
          </Button>
          <Button
            type={service.active ? 'default' : 'primary'}
            danger={service.active}
            onClick={() => setActivateModalOpen(true)}
          >
            {service.active ? '停用' : '激活'}
          </Button>
        </Space>

        <Divider style={{ marginBottom: 8 }} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          ID: {service.id} | 创建于:{' '}
          {dayjs(service.createdAt).format('YYYY-MM-DD HH:mm')}
        </Text>
      </Drawer>

      <ServiceFormModal
        open={editModalOpen}
        service={service}
        categories={categories}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleEdit}
        loading={loading}
      />
      <ServiceActivateModal
        open={activateModalOpen}
        mode={service.active ? 'deactivate' : 'activate'}
        locations={locations}
        onCancel={() => setActivateModalOpen(false)}
        onOk={handleActivate}
        loading={loading}
      />
    </>
  );
};

export default ServiceDrawer;
