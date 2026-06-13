import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React, { useRef, useState } from 'react';
import { getLocations } from '@/services/ant-design-pro/api';
import LocationDrawer from './components/LocationDrawer';

const LocationPage: React.FC = () => {
  const actionRef = useRef<any>(null);

  const [selectedLocation, setSelectedLocation] =
    useState<API.LocationItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const columns: ProColumns<API.LocationItem>[] = [
    {
      title: '门店名称',
      dataIndex: 'name',
      width: 180,
    },
    {
      title: '城市/州',
      search: false,
      width: 150,
      render: (_, record) => {
        const addr = record.address;
        if (!addr) return '-';
        const parts = [addr.city, addr.state].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : '-';
      },
    },
    {
      title: '电话',
      dataIndex: 'phone',
      search: false,
      width: 140,
      render: (_, record) => record.phone || '-',
    },
    {
      title: '时区',
      dataIndex: 'tz',
      search: false,
      width: 180,
    },
    {
      title: '类型',
      dataIndex: 'isRemote',
      search: false,
      width: 100,
      render: (_, record) => (
        <Tag color={record.isRemote ? 'blue' : 'green'}>
          {record.isRemote ? '远程' : '实体'}
        </Tag>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.LocationItem>
        headerTitle="门店列表"
        rowKey="id"
        actionRef={actionRef}
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
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        onRow={(record) => ({
          onClick: () => {
            setSelectedLocation(record);
            setDrawerOpen(true);
          },
          style: { cursor: 'pointer' },
        })}
        search={{ labelWidth: 'auto' }}
      />

      <LocationDrawer
        open={drawerOpen}
        location={selectedLocation}
        onClose={() => setDrawerOpen(false)}
        onRefresh={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
};

export default LocationPage;
