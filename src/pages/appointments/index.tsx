import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import { Badge, Button, Tag, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React, { useRef } from 'react';
import { getAppointments } from '@/services/ant-design-pro/api';

const useStyles = createStyles(() => {
  return {
    newWrap: {
      display: 'flex',
      justifyContent: 'flex-end',
    },
  };
});
const AppointmentList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const intl = useIntl();

  const columns: ProColumns<API.AppointmentItem>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.appointment.id',
        defaultMessage: 'ID',
      }),
      dataIndex: 'id',
      width: 100,
      hideInSearch: true,
      render: (_, record) => (
        <Tooltip title={record.id}>
          <a>{record.id.substring(0, 8)}...</a>
        </Tooltip>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.appointment.startAt',
        defaultMessage: 'Start Time',
      }),
      dataIndex: 'startAt',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.appointment.duration',
        defaultMessage: 'Duration',
      }),
      dataIndex: 'duration',
      hideInSearch: true,
      render: (_, record) =>
        record.duration ? `${Math.round(record.duration / 60)} min` : '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.appointment.state',
        defaultMessage: 'State',
      }),
      dataIndex: 'state',
      hideInSearch: true,
      render: (_, record) => {
        const stateColors: Record<string, string> = {
          confirmed: 'green',
          pending: 'orange',
          cancelled: 'red',
          completed: 'blue',
          no_show: 'default',
        };
        return (
          <Tag color={stateColors[record.state || ''] || 'default'}>
            {record.state || 'Unknown'}
          </Tag>
        );
      },
      valueEnum: {
        confirmed: { text: 'Confirmed', status: 'Success' },
        pending: { text: 'Pending', status: 'Warning' },
        cancelled: { text: 'Cancelled', status: 'Error' },
        completed: { text: 'Completed', status: 'Processing' },
        no_show: { text: 'No Show', status: 'Default' },
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.appointment.cancelled',
        defaultMessage: 'Cancelled',
      }),
      dataIndex: 'cancelled',
      hideInSearch: true,
      render: (_, record) => (
        <Badge
          status={record.cancelled ? 'error' : 'success'}
          text={record.cancelled ? 'Yes' : 'No'}
        />
      ),
      valueEnum: {
        true: { text: 'Yes', status: 'Error' },
        false: { text: 'No', status: 'Success' },
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.appointment.client',
        defaultMessage: 'Client',
      }),
      dataIndex: 'clientId',
      render: (_, record) => {
        const clientName =
          record.client?.name ||
          [record.client?.firstName, record.client?.lastName]
            .filter(Boolean)
            .join(' ') ||
          '-';
        return <a>{clientName}</a>;
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.appointment.staff',
        defaultMessage: 'Staff',
      }),
      dataIndex: 'staffId',
      render: (_, record) => {
        const staffName =
          record.staff?.name ||
          [record.staff?.firstName, record.staff?.lastName]
            .filter(Boolean)
            .join(' ') ||
          '-';
        return <a>{staffName}</a>;
      },
    },
    {
      title: intl.formatMessage({
        id: 'pages.appointment.location',
        defaultMessage: 'Location',
      }),
      dataIndex: 'locationId',
      hideInSearch: true,
      render: (_, record) => record.location?.name || '-',
    },
    {
      title: intl.formatMessage({
        id: 'pages.appointment.services',
        defaultMessage: 'Services',
      }),
      dataIndex: 'appointmentServices',
      hideInSearch: true,
      render: (_, record) =>
        record.appointmentServices?.length ? (
          <Tag color="blue">{record.appointmentServices.length} service(s)</Tag>
        ) : (
          '-'
        ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.appointment.notes',
        defaultMessage: 'Notes',
      }),
      dataIndex: 'notes',
      hideInSearch: true,
      ellipsis: true,
      width: 150,
    },
    {
      title: intl.formatMessage({
        id: 'pages.appointment.createdAt',
        defaultMessage: 'Created At',
      }),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
    },
  ];

  const { styles } = useStyles();

  return (
    <PageContainer>
      <div className={styles.newWrap}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => history.push('/appointments/new')}
        >
          New Appointment
        </Button>
      </div>
      <ProTable<API.AppointmentItem, API.PageParams>
        headerTitle={intl.formatMessage({
          id: 'pages.appointment.title',
          defaultMessage: 'Appointment List',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          const response = await getAppointments({
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

export default AppointmentList;
