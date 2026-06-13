import { EditOutlined } from '@ant-design/icons';
import {
  Button,
  Descriptions,
  Drawer,
  message,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useState } from 'react';
import { updateServiceCategory } from '@/services/ant-design-pro/api';
import ServiceCategoryFormModal from './ServiceCategoryFormModal';

const { Text } = Typography;

interface ServiceCategoryDrawerProps {
  open: boolean;
  category: API.ServiceCategoryItem | null;
  onClose: () => void;
  onRefresh: () => void;
}

const ServiceCategoryDrawer: React.FC<ServiceCategoryDrawerProps> = ({
  open,
  category,
  onClose,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  if (!category) return null;

  const handleEdit = async (values: any) => {
    setLoading(true);
    try {
      await updateServiceCategory(category.id, values);
      message.success('服务分类已更新');
      setEditModalOpen(false);
      onRefresh();
    } catch (error: any) {
      message.error(`更新失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Drawer title={category.name} open={open} onClose={onClose} width={480}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="名称">
            {category.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={category.active ? 'green' : 'default'}>
              {category.active ? '启用' : '未启用'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="排序路径">
            {String(category.sortPath ?? '-')}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {category.createdAt
              ? new Date(category.createdAt).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {category.updatedAt
              ? new Date(category.updatedAt).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-'}
          </Descriptions.Item>
        </Descriptions>

        <Typography.Paragraph
          type="secondary"
          style={{ fontSize: 12, marginTop: 16 }}
        >
          ID: {category.id}
        </Typography.Paragraph>

        <Space style={{ marginTop: 16 }}>
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditModalOpen(true)}
          >
            编辑
          </Button>
        </Space>
      </Drawer>

      <ServiceCategoryFormModal
        open={editModalOpen}
        category={category}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleEdit}
        loading={loading}
      />
    </>
  );
};

export default ServiceCategoryDrawer;
