import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Badge, Tag } from 'antd';
import React, { useRef } from 'react';
import { getClients } from '@/services/ant-design-pro/api';

const ClientList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const intl = useIntl();

  const columns: ProColumns<API.ClientItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.client.name',
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
        id: 'pages.client.email',
        defaultMessage: 'Email',
      }),
      dataIndex: 'email',
      copyable: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.client.mobilePhone',
        defaultMessage: 'Phone',
      }),
      dataIndex: 'mobilePhone',
    },
    {
      title: intl.formatMessage({
        id: 'pages.client.active',
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
        id: 'pages.client.hasCardOnFile',
        defaultMessage: 'Card on File',
      }),
      dataIndex: 'hasCardOnFile',
      render: (_, record) =>
        record.hasCardOnFile ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>,
      valueEnum: {
        true: { text: 'Yes' },
        false: { text: 'No' },
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.client.appointmentCount',
        defaultMessage: 'Appointments',
      }),
      dataIndex: 'appointmentCount',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.client.currentAccountBalance',
        defaultMessage: 'Balance',
      }),
      dataIndex: 'currentAccountBalance',
      render: (_, record) =>
        `$${(record.currentAccountBalance / 100).toFixed(2)}`,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.client.createdAt',
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
      <ProTable<API.ClientItem, API.PageParams>
        headerTitle={intl.formatMessage({
          id: 'pages.client.title',
          defaultMessage: 'Client List',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          const response = await getClients({
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

export default ClientList;
