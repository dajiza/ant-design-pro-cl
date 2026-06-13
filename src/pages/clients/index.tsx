import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, message, Space, Switch } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createClient,
  getClients,
  updateClient,
} from '@/services/ant-design-pro/api';
import ClientDrawer from './components/ClientDrawer';
import ClientForm from './components/ClientForm';

const ClientList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<API.ClientItem | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<API.ClientItem | null>(
    null,
  );

  const handleAdd = () => {
    setEditingClient(null);
    setModalVisible(true);
  };

  const handleEdit = (record: API.ClientItem) => {
    setEditingClient(record);
    setModalVisible(true);
  };

  const handleSubmit = async (
    values: API.CreateClientParams | API.UpdateClientParams,
  ) => {
    setSubmitting(true);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, values);
        message.success('客户更新成功');
      } else {
        await createClient(values as API.CreateClientParams);
        message.success('客户创建成功');
      }
      setModalVisible(false);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(
        editingClient
          ? `更新失败: ${error.message}`
          : `创建失败: ${error.message}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (
    record: API.ClientItem,
    checked: boolean,
  ) => {
    try {
      await updateClient(record.id, { active: checked } as any);
      message.success(checked ? '客户已激活' : '客户已停用');
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(`状态更新失败: ${error.message}`);
    }
  };

  const handleRowClick = (record: API.ClientItem) => {
    setSelectedClient(record);
    setDrawerOpen(true);
  };

  const getClientName = (record: API.ClientItem) => {
    return (
      record.name ||
      `${record.firstName || ''} ${record.lastName || ''}`.trim() ||
      '-'
    );
  };

  const columns: ProColumns<API.ClientItem>[] = [
    {
      title: '姓名',
      dataIndex: 'firstName',
      render: (_, record) => (
        <a onClick={() => handleRowClick(record)}>{getClientName(record)}</a>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      copyable: true,
      hideInSearch: false,
    },
    {
      title: '电话',
      dataIndex: 'mobilePhone',
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'active',
      valueType: 'select',
      valueEnum: {
        true: { text: '活跃', status: 'Success' },
        false: { text: '停用', status: 'Error' },
      },
      width: 100,
      render: (_, record) => (
        <Switch
          checked={record.active}
          onChange={(checked) => handleToggleActive(record, checked)}
        />
      ),
    },
    {
      title: '预约数',
      dataIndex: 'appointmentCount',
      hideInSearch: true,
      sorter: true,
      width: 90,
    },
    {
      title: '余额',
      dataIndex: 'currentAccountBalance',
      hideInSearch: true,
      width: 100,
      render: (_, record) =>
        record.currentAccountBalance
          ? `$${(record.currentAccountBalance / 100).toFixed(2)}`
          : '$0.00',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
      width: 160,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, record) => (
        <Space size="small">
          <a onClick={() => handleEdit(record)}>编辑</a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ClientItem, API.PageParams>
        headerTitle="客户列表"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新建客户
          </Button>,
        ]}
        request={async (params) => {
          const response = await getClients({
            page: params.current,
            limit: params.pageSize,
            active:
              params.active === 'true'
                ? true
                : params.active === 'false'
                  ? false
                  : undefined,
            name: params.firstName || undefined,
            email: params.email || undefined,
          });
          return {
            data: response.data,
            total: response.total,
            success: true,
          };
        }}
        columns={columns}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' },
        })}
      />

      <ClientForm
        visible={modalVisible}
        initialValues={editingClient}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => setModalVisible(false)}
      />

      <ClientDrawer
        open={drawerOpen}
        client={selectedClient}
        onClose={() => setDrawerOpen(false)}
        onRefresh={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
};

export default ClientList;
