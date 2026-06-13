import { PlusOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, message, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createServiceCategory,
  getServiceCategories,
} from '@/services/ant-design-pro/api';
import ServiceCategoryDrawer from './components/ServiceCategoryDrawer';
import ServiceCategoryFormModal from './components/ServiceCategoryFormModal';

const ServiceCategoryPage: React.FC = () => {
  const actionRef = useRef<any>(null);

  const [selectedCategory, setSelectedCategory] =
    useState<API.ServiceCategoryItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (values: any) => {
    setLoading(true);
    try {
      await createServiceCategory(values);
      message.success('服务分类创建成功');
      setCreateModalOpen(false);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(`创建失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const columns: ProColumns<API.ServiceCategoryItem>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'active',
      valueEnum: {
        true: { text: '启用', status: 'Success' },
        false: { text: '未启用', status: 'Default' },
      },
      width: 100,
      render: (_, record) => (
        <Tag color={record.active ? 'green' : 'default'}>
          {record.active ? '启用' : '未启用'}
        </Tag>
      ),
    },
    {
      title: '排序路径',
      dataIndex: 'sortPath',
      search: false,
      width: 150,
      render: (_, record) => String(record.sortPath ?? '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      search: false,
      width: 180,
      render: (_, record) => {
        if (!record.createdAt) return '-';
        const d = new Date(record.createdAt);
        return d.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ServiceCategoryItem>
        headerTitle="服务分类列表"
        rowKey="id"
        actionRef={actionRef}
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            新建分类
          </Button>,
        ]}
        request={async (params) => {
          const response = await getServiceCategories({
            page: params.current,
            limit: params.pageSize,
          });
          return {
            data: response.data,
            total: response.hasNextPage
              ? (params.current || 1) * (params.pageSize || 10) + 1
              : (params.current || 1) * (params.pageSize || 10),
            success: true,
          };
        }}
        columns={columns}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        onRow={(record) => ({
          onClick: () => {
            setSelectedCategory(record);
            setDrawerOpen(true);
          },
          style: { cursor: 'pointer' },
        })}
        search={{ labelWidth: 'auto' }}
      />

      <ServiceCategoryDrawer
        open={drawerOpen}
        category={selectedCategory}
        onClose={() => setDrawerOpen(false)}
        onRefresh={() => actionRef.current?.reload()}
      />

      <ServiceCategoryFormModal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreate}
        loading={loading}
      />
    </PageContainer>
  );
};

export default ServiceCategoryPage;
