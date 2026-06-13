import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Badge } from 'antd';
import React, { useRef } from 'react';
import { getServiceCategories } from '@/services/ant-design-pro/api';

const ServiceCategoryList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const intl = useIntl();

  const columns: ProColumns<API.ServiceCategoryItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.serviceCategory.name',
        defaultMessage: 'Name',
      }),
      dataIndex: 'name',
      render: (_, record) => <a>{record.name}</a>,
    },
    {
      title: intl.formatMessage({
        id: 'pages.serviceCategory.active',
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
        id: 'pages.serviceCategory.createdAt',
        defaultMessage: 'Created At',
      }),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.serviceCategory.updatedAt',
        defaultMessage: 'Updated At',
      }),
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ServiceCategoryItem, API.PageParams>
        headerTitle={intl.formatMessage({
          id: 'pages.serviceCategory.title',
          defaultMessage: 'Service Category List',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          const response = await getServiceCategories({
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

export default ServiceCategoryList;
