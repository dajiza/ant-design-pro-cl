import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Avatar, Badge, Tag } from 'antd';
import React, { useRef } from 'react';
import { getStaff } from '@/services/ant-design-pro/api';

const StaffList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const intl = useIntl();

  const columns: ProColumns<API.StaffItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.staff.avatar',
        defaultMessage: 'Avatar',
      }),
      dataIndex: 'avatar',
      hideInSearch: true,
      width: 60,
      render: (_, record) => (
        <Avatar src={record.avatar} size={40}>
          {record.name?.charAt(0)?.toUpperCase()}
        </Avatar>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.staff.name',
        defaultMessage: 'Name',
      }),
      dataIndex: 'name',
      render: (_, record) => {
        const fullName =
          [record.firstName, record.lastName].filter(Boolean).join(' ') ||
          record.name ||
          '-';
        return <a>{fullName}</a>;
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.staff.displayName',
        defaultMessage: 'Display Name',
      }),
      dataIndex: 'displayName',
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.staff.email',
        defaultMessage: 'Email',
      }),
      dataIndex: 'email',
      copyable: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.staff.mobilePhone',
        defaultMessage: 'Phone',
      }),
      dataIndex: 'mobilePhone',
    },
    {
      title: intl.formatMessage({
        id: 'pages.staff.role',
        defaultMessage: 'Role',
      }),
      dataIndex: 'role',
      render: (_, record) =>
        record.role?.name ? <Tag color="blue">{record.role.name}</Tag> : '-',
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.staff.active',
        defaultMessage: 'Status',
      }),
      dataIndex: 'active',
      render: (_, record) => (
        <Badge
          status={record.active ? 'success' : 'default'}
          text={record.active ? 'Active' : 'Inactive'}
        />
      ),
      valueEnum: {
        true: { text: 'Active', status: 'Success' },
        false: { text: 'Inactive', status: 'Default' },
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.staff.suspended',
        defaultMessage: 'Suspended',
      }),
      dataIndex: 'suspended',
      render: (_, record) =>
        record.suspended ? <Tag color="red">Suspended</Tag> : <Tag>Normal</Tag>,
      valueEnum: {
        true: { text: 'Suspended', status: 'Error' },
        false: { text: 'Normal', status: 'Success' },
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.staff.createdAt',
        defaultMessage: 'Created At',
      }),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.StaffItem, API.PageParams>
        headerTitle={intl.formatMessage({
          id: 'pages.staff.title',
          defaultMessage: 'Staff List',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          const response = await getStaff({
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
    </PageContainer>
  );
};

export default StaffList;
