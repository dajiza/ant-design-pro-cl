import { PlusOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, message, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  createService,
  getLocations,
  getServiceCategories,
  getServices,
} from '@/services/ant-design-pro/api';
import ServiceDrawer from './components/ServiceDrawer';
import ServiceFormModal from './components/ServiceFormModal';

const ServicePage: React.FC = () => {
  const actionRef = useRef<any>(null);

  const [selectedService, setSelectedService] =
    useState<API.ServiceItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<API.ServiceCategoryItem[]>([]);
  const [locations, setLocations] = useState<API.LocationItem[]>([]);

  useEffect(() => {
    getServiceCategories({ limit: 100 })
      .then((r) => setCategories(r.data || []))
      .catch(() => {});
    getLocations({ limit: 100 })
      .then((r) => setLocations(r.data || []))
      .catch(() => {});
  }, []);

  const handleCreate = async (values: any) => {
    setLoading(true);
    try {
      await createService(values);
      message.success('服务创建成功');
      setCreateModalOpen(false);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(`创建失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const serviceColumns: ProColumns<API.ServiceItem>[] = [
    {
      title: '服务名称',
      dataIndex: 'name',
      width: 180,
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      search: false,
      width: 120,
    },
    {
      title: '价格',
      search: false,
      width: 100,
      render: (_, record) => `¥${(record.defaultPrice / 100).toFixed(2)}`,
    },
    {
      title: '时长(分钟)',
      dataIndex: 'defaultDuration',
      search: false,
      width: 100,
    },
    {
      title: '附加服务',
      dataIndex: 'addon',
      search: false,
      width: 80,
      render: (_, record) => (
        <Tag color={record.addon ? 'blue' : 'default'}>
          {record.addon ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'active',
      valueEnum: {
        true: { text: '活跃', status: 'Success' },
        false: { text: '未激活', status: 'Default' },
      },
      width: 80,
      render: (_, record) => (
        <Tag color={record.active ? 'green' : 'default'}>
          {record.active ? '活跃' : '未激活'}
        </Tag>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ServiceItem>
        headerTitle="服务项目"
        rowKey="id"
        actionRef={actionRef}
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            新建服务
          </Button>,
        ]}
        request={async (params) => {
          const response = await getServices({
            page: params.current,
            limit: params.pageSize,
          });
          return {
            data: response.data,
            total: response.total,
            success: true,
          };
        }}
        columns={serviceColumns}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        onRow={(record) => ({
          onClick: () => {
            setSelectedService(record);
            setDrawerOpen(true);
          },
          style: { cursor: 'pointer' },
        })}
        search={{ labelWidth: 'auto' }}
      />

      <ServiceDrawer
        open={drawerOpen}
        service={selectedService}
        categories={categories}
        locations={locations}
        onClose={() => setDrawerOpen(false)}
        onRefresh={() => actionRef.current?.reload()}
      />

      <ServiceFormModal
        open={createModalOpen}
        categories={categories}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreate}
        loading={loading}
      />
    </PageContainer>
  );
};

export default ServicePage;
