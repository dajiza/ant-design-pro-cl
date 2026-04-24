import { PlusOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import ProTable from '@ant-design/pro-table';
import { history } from '@umijs/max';
import { Button, message } from 'antd';
import React, { useRef } from 'react';
import { getAppointments } from '@/services/ant-design-pro/api';
import AppointmentDrawer from './components/AppointmentDrawer';
import AppointmentStateBadge from './components/AppointmentStateBadge';

const AppointmentList: React.FC = () => {
  const actionRef = useRef<any>();
  const [selectedAppointment, setSelectedAppointment] =
    React.useState<API.AppointmentItem | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const getClientName = (record: API.AppointmentItem) => {
    return (
      record.client?.name ||
      `${(record.client as any)?.firstName || ''} ${(record.client as any)?.lastName || ''}`.trim() ||
      '-'
    );
  };

  const getStaffNames = (record: API.AppointmentItem) => {
    const services = (record.appointmentServices as any[]) || [];
    return (
      services.map((s: any) => s.staffName || s.staffId || '-').join(', ') ||
      '-'
    );
  };

  const getServiceNames = (record: API.AppointmentItem) => {
    const services = (record.appointmentServices as any[]) || [];
    return (
      services.map((s: any) => s.name || s.serviceName || '-').join(', ') || '-'
    );
  };

  const columns: ProColumns<API.AppointmentItem>[] = [
    {
      title: '开始时间',
      dataIndex: 'startAt',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: false,
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'state',
      hideInSearch: false,
      valueEnum: {
        BOOKED: { text: '已预约', status: 'Processing' },
        CONFIRMED: { text: '已确认', status: 'Success' },
        ARRIVED: { text: '已到达', status: 'Warning' },
        ACTIVE: { text: '进行中', status: 'Processing' },
        FINAL: { text: '已完成', status: 'Default' },
        CANCELLED: { text: '已取消', status: 'Error' },
      },
      width: 100,
      render: (_, record) => (
        <AppointmentStateBadge
          state={record.state}
          cancelled={record.cancelled}
        />
      ),
    },
    {
      title: '客户',
      hideInSearch: true,
      render: (_, record) => getClientName(record),
      width: 120,
    },
    {
      title: '员工',
      hideInSearch: true,
      render: (_, record) => getStaffNames(record),
      width: 120,
    },
    {
      title: '服务',
      hideInSearch: true,
      render: (_, record) => getServiceNames(record),
      width: 150,
      ellipsis: true,
    },
    {
      title: '门店',
      hideInSearch: true,
      render: (_, record) =>
        (record.location as any)?.name || record.locationId || '-',
      width: 120,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      hideInSearch: true,
      render: (_, record) =>
        record.duration ? `${Math.round(record.duration / 60)} min` : '-',
      width: 80,
    },
    {
      title: '已取消',
      dataIndex: 'cancelled',
      hideInSearch: false,
      valueEnum: {
        true: { text: '是', status: 'Error' },
        false: { text: '否', status: 'Success' },
      },
      width: 80,
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.AppointmentItem, API.PageParams>
        headerTitle="预约列表"
        rowKey="id"
        actionRef={actionRef}
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push('/appointments/new')}
          >
            新建预约
          </Button>,
        ]}
        request={async (params) => {
          const response = await getAppointments({
            page: params.current,
            limit: params.pageSize,
            state: params.state,
            startDate: params.startAt ? String(params.startAt) : undefined,
            cancelled:
              params.cancelled === 'true'
                ? true
                : params.cancelled === 'false'
                  ? false
                  : undefined,
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
            setSelectedAppointment(record);
            setDrawerOpen(true);
          },
          style: { cursor: 'pointer' },
        })}
        search={{ labelWidth: 'auto' }}
      />

      <AppointmentDrawer
        open={drawerOpen}
        appointment={selectedAppointment}
        onClose={() => setDrawerOpen(false)}
        onRefresh={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
};

export default AppointmentList;
