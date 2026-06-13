import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Badge, Tag } from 'antd';
import React, { useRef } from 'react';
import { getServices } from '@/services/ant-design-pro/api';

const ServiceList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const intl = useIntl();

  const columns: ProColumns<API.ServiceItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.service.name',
        defaultMessage: 'Name',
      }),
      dataIndex: 'name',
      render: (_, record) => <a>{record.name}</a>,
    },
    {
      title: intl.formatMessage({
        id: 'pages.service.active',
        defaultMessage: 'Active',
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
        id: 'pages.service.addon',
        defaultMessage: 'Addon',
      }),
      dataIndex: 'addon',
      render: (_, record) =>
        record.addon ? <Tag color="purple">Addon</Tag> : <Tag>Standalone</Tag>,
      valueEnum: {
        true: { text: 'Addon' },
        false: { text: 'Standalone' },
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.service.defaultDuration',
        defaultMessage: 'Duration (min)',
      }),
      dataIndex: 'defaultDuration',
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.service.defaultPrice',
        defaultMessage: 'Price',
      }),
      dataIndex: 'defaultPrice',
      render: (_, record) => `$${(record.defaultPrice / 100).toFixed(2)}`,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.service.description',
        defaultMessage: 'Description',
      }),
      dataIndex: 'description',
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.service.categoryId',
        defaultMessage: 'Category ID',
      }),
      dataIndex: 'categoryId',
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.service.createdAt',
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
      <ProTable<API.ServiceItem, API.PageParams>
        headerTitle={intl.formatMessage({
          id: 'pages.service.title',
          defaultMessage: 'Service List',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
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
        columns={columns}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
      />
    </PageContainer>
  );
};

export default ServiceList;
