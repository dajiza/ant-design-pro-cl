import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, message, Popconfirm, Space, Switch } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from '@/services/ant-design-pro/api';
import EmployeeForm from './components/EmployeeForm';

const EmployeeList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const intl = useIntl();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<API.EmployeeItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = () => {
    setEditingEmployee(null);
    setModalVisible(true);
  };

  const handleEdit = (record: API.EmployeeItem) => {
    setEditingEmployee(record);
    setModalVisible(true);
  };

  const handleSubmit = async (
    values: API.CreateEmployeeParams | API.UpdateEmployeeParams,
  ) => {
    setSubmitting(true);
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, values);
        message.success('Employee updated successfully');
      } else {
        await createEmployee(values as API.CreateEmployeeParams);
        message.success('Employee created successfully');
      }
      setModalVisible(false);
      actionRef.current?.reload();
    } catch (error) {
      message.error(
        editingEmployee
          ? 'Failed to update employee'
          : 'Failed to create employee',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee(id);
      message.success('Employee deleted successfully');
      actionRef.current?.reload();
    } catch (error) {
      message.error('Failed to delete employee');
    }
  };

  const handleToggleActive = async (
    record: API.EmployeeItem,
    checked: boolean,
  ) => {
    try {
      await updateEmployee(record.id, { active: checked });
      message.success(checked ? 'Employee activated' : 'Employee deactivated');
      actionRef.current?.reload();
    } catch (error) {
      message.error('Failed to update employee status');
    }
  };

  const columns: ProColumns<API.EmployeeItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.employee.name',
        defaultMessage: 'Name',
      }),
      dataIndex: 'firstName',
      render: (_, record) => (
        <a onClick={() => handleEdit(record)}>
          {`${record.firstName} ${record.lastName || ''}`.trim()}
        </a>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.employee.mobilePhone',
        defaultMessage: 'Phone',
      }),
      dataIndex: 'mobilePhone',
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.employee.email',
        defaultMessage: 'Email',
      }),
      dataIndex: 'email',
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.employee.active',
        defaultMessage: 'Active',
      }),
      dataIndex: 'active',
      hideInSearch: true,
      width: 80,
      render: (_, record) => (
        <Switch
          checked={record.active}
          onChange={(checked) => handleToggleActive(record, checked)}
        />
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.employee.createdAt',
        defaultMessage: 'Created At',
      }),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.employee.actions',
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
              id: 'pages.employee.deleteConfirm',
              defaultMessage: 'Are you sure you want to delete this employee?',
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
      <ProTable<API.EmployeeItem, API.PageParams>
        headerTitle={intl.formatMessage({
          id: 'pages.employee.title',
          defaultMessage: 'Employees',
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
              id: 'pages.employee.add',
              defaultMessage: 'Add Employee',
            })}
          </Button>,
        ]}
        request={async (params) => {
          const response = await getEmployees({
            page: params.current,
            limit: params.pageSize,
          });
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

      <EmployeeForm
        visible={modalVisible}
        initialValues={editingEmployee}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => setModalVisible(false)}
      />
    </PageContainer>
  );
};

export default EmployeeList;
