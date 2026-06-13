import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import React, { useRef } from 'react';
import { getLocations } from '@/services/ant-design-pro/api';

const LocationList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const intl = useIntl();

  const columns: ProColumns<API.LocationItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.location.name',
        defaultMessage: 'Name',
      }),
      dataIndex: 'name',
      render: (_, record) => <a>{record.name}</a>,
    },
    {
      title: intl.formatMessage({
        id: 'pages.location.businessName',
        defaultMessage: 'Business',
      }),
      dataIndex: 'businessName',
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.location.phone',
        defaultMessage: 'Phone',
      }),
      dataIndex: 'phone',
      copyable: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.location.tz',
        defaultMessage: 'Timezone',
      }),
      dataIndex: 'tz',
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.location.isRemote',
        defaultMessage: 'Remote',
      }),
      dataIndex: 'isRemote',
      render: (_, record) =>
        record.isRemote ? <Tag color="blue">Remote</Tag> : <Tag>On-site</Tag>,
      valueEnum: {
        true: { text: 'Remote', status: 'Processing' },
        false: { text: 'On-site', status: 'Default' },
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.location.city',
        defaultMessage: 'City',
      }),
      dataIndex: ['address', 'city'],
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.location.website',
        defaultMessage: 'Website',
      }),
      dataIndex: 'website',
      render: (_, record) =>
        record.website ? (
          <a href={record.website} target="_blank" rel="noopener noreferrer">
            {record.website}
          </a>
        ) : (
          '-'
        ),
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.location.createdAt',
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
      <ProTable<API.LocationItem, API.PageParams>
        headerTitle={intl.formatMessage({
          id: 'pages.location.title',
          defaultMessage: 'Location List',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          const response = await getLocations({
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

export default LocationList;
