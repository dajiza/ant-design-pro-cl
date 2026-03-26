import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, message, Popconfirm, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createEquipment,
  deleteEquipment,
  getEquipment,
  getServices,
  updateEquipment,
} from '@/services/ant-design-pro/api';
import EquipmentForm from './components/EquipmentForm';

const EquipmentList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const intl = useIntl();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEquipment, setEditingEquipment] =
    useState<API.EquipmentItem | null>(null);
  const [services, setServices] = useState<API.ServiceItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = () => {
    setEditingEquipment(null);
    setModalVisible(true);
    loadServices();
  };

  const handleEdit = (record: API.EquipmentItem) => {
    setEditingEquipment(record);
    setModalVisible(true);
    loadServices();
  };

  const loadServices = async () => {
    try {
      const response = await getServices({ page: 1, limit: 100 });
      setServices(response.data);
    } catch (error) {
      console.error('Failed to load services', error);
    }
  };

  const handleSubmit = async (values: {
    name: string;
    serviceId?: string | null;
  }) => {
    setSubmitting(true);
    try {
      if (editingEquipment) {
        await updateEquipment(editingEquipment.id, values);
        message.success('Equipment updated successfully');
      } else {
        await createEquipment(values);
        message.success('Equipment created successfully');
      }
      setModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      message.error(
        editingEquipment
          ? 'Failed to update equipment'
          : 'Failed to create equipment',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEquipment(id);
      message.success('Equipment deleted successfully');
      actionRef.current?.reload();
    } catch (error) {
      message.error('Failed to delete equipment');
    }
  };

  const columns: ProColumns<API.EquipmentItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.equipment.name',
        defaultMessage: 'Equipment Name',
      }),
      dataIndex: 'name',
      render: (_, record) => (
        <a onClick={() => handleEdit(record)}>{record.name}</a>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.equipment.service',
        defaultMessage: 'Service',
      }),
      dataIndex: 'serviceId',
      hideInSearch: true,
      render: (_, record) => {
        const service = services.find((s) => s.id === record.serviceId);
        return service ? <Tag color="blue">{service.name}</Tag> : '-';
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.equipment.createdAt',
        defaultMessage: 'Created At',
      }),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.equipment.updatedAt',
        defaultMessage: 'Updated At',
      }),
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.equipment.actions',
        defaultMessage: 'Actions',
      }),
      valueType: 'option',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <a onClick={() => handleEdit(record)}>
            {intl.formatMessage({ id: 'common.edit', defaultMessage: 'Edit' })}
          </a>
          <Popconfirm
            title={intl.formatMessage({
              id: 'pages.equipment.deleteConfirm',
              defaultMessage: 'Are you sure you want to delete this equipment?',
            })}
            onConfirm={() => handleDelete(record.id)}
            okText={intl.formatMessage({
              id: 'common.confirm',
              defaultMessage: 'Confirm',
            })}
            cancelText={intl.formatMessage({
              id: 'common.cancel',
              defaultMessage: 'Cancel',
            })}
          >
            <a style={{ color: '#ff4d4f' }}>
              {intl.formatMessage({
                id: 'common.delete',
                defaultMessage: 'Delete',
              })}
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.EquipmentItem, API.PageParams>
        headerTitle={intl.formatMessage({
          id: 'pages.equipment.title',
          defaultMessage: 'Equipment List',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={false}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            {intl.formatMessage({
              id: 'pages.equipment.add',
              defaultMessage: 'Add Equipment',
            })}
          </Button>,
        ]}
        request={async (params) => {
          const response = await getEquipment({
            page: params.current,
            limit: params.pageSize,
          });
          // Load services for display
          if (services.length === 0) {
            loadServices();
          }
          return {
            data: response.data,
            total: response.total,
            success: true,
          };
        }}
        columns={columns}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
      />

      <EquipmentForm
        visible={modalVisible}
        initialValues={editingEquipment}
        services={services}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => setModalVisible(false)}
      />
    </PageContainer>
  );
};

export default EquipmentList;
