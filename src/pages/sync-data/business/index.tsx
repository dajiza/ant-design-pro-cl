import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import React, { useRef } from 'react';
import { getBusinesses } from '@/services/ant-design-pro/api';

const BusinessList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const intl = useIntl();

  const columns: ProColumns<API.BusinessItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.business.name',
        defaultMessage: 'Name',
      }),
      dataIndex: 'name',
      render: (_, record) => <a>{record.name}</a>,
    },
    {
      title: intl.formatMessage({
        id: 'pages.business.phone',
        defaultMessage: 'Phone',
      }),
      dataIndex: 'phone',
      copyable: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.business.tz',
        defaultMessage: 'Timezone',
      }),
      dataIndex: 'tz',
    },
    {
      title: intl.formatMessage({
        id: 'pages.business.website',
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
    },
    {
      title: intl.formatMessage({
        id: 'pages.business.billingContactEmail',
        defaultMessage: 'Billing Email',
      }),
      dataIndex: 'billingContactEmail',
      copyable: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.business.customBookingUrl',
        defaultMessage: 'Booking URL',
      }),
      dataIndex: 'customBookingUrl',
      render: (_, record) =>
        record.customBookingUrl ? (
          <a
            href={record.customBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {record.customBookingUrl}
          </a>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.BusinessItem>
        headerTitle={intl.formatMessage({
          id: 'pages.business.title',
          defaultMessage: 'Business List',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={false}
        request={async () => {
          const response = await getBusinesses();
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

export default BusinessList;
