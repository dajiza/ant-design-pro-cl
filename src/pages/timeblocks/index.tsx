import { PlusOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, DatePicker, message, Select, Tag } from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import React, { useEffect, useRef, useState } from 'react';
import {
  createTimeblock,
  getLocations,
  getStaff,
  getTimeblocks,
} from '@/services/ant-design-pro/api';
import TimeblockCreateModal from './components/TimeblockCreateModal';
import TimeblockDrawer from './components/TimeblockDrawer';

dayjs.extend(utc);
dayjs.extend(timezone);

/** 按 location.tz 将 UTC ISO 字符串格式化为门店当地时间 */
const formatByLocationTz = (iso?: string | null, tz?: string | null) => {
  if (!iso) return '-';
  const utcIso = iso.endsWith('Z') ? iso : `${iso}Z`;
  return dayjs(utcIso)
    .tz(tz || 'UTC')
    .format('YYYY-MM-DD HH:mm');
};

const TimeblockPage: React.FC = () => {
  const actionRef = useRef<any>(null);

  const [selectedTimeblock, setSelectedTimeblock] =
    useState<API.TimeblockItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [staffList, setStaffList] = useState<API.StaffItem[]>([]);
  const [locations, setLocations] = useState<API.LocationItem[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<
    string | undefined
  >(undefined);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(
    undefined,
  );
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );

  useEffect(() => {
    getStaff({ limit: 100 })
      .then((r) => setStaffList(r.data || []))
      .catch(() => {});
    getLocations({ limit: 100 })
      .then((r) => setLocations(r.data || []))
      .catch(() => {});
  }, []);

  const handleCreate = async (values: any) => {
    setLoading(true);
    try {
      await createTimeblock(values);
      message.success('时间块创建成功');
      setCreateModalOpen(false);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(`创建失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const columns: ProColumns<API.TimeblockItem>[] = [
    {
      title: '标题',
      dataIndex: 'title',
      width: 150,
      render: (_, record) => record.title || '-',
    },
    {
      title: '员工',
      search: false,
      width: 120,
      render: (_, record) => {
        const staff = record.staff;
        return (
          staff?.displayName ||
          [staff?.firstName, staff?.lastName].filter(Boolean).join(' ') ||
          '-'
        );
      },
    },
    {
      title: '门店',
      search: false,
      width: 120,
      render: (_, record) => record.location?.name || '-',
    },
    {
      title: '开始时间',
      dataIndex: 'startAt',
      search: false,
      width: 180,
      render: (_, record) =>
        formatByLocationTz(record.startAt, record.location?.tz),
    },
    {
      title: '时长',
      search: false,
      width: 80,
      render: (_, record) => `${record.duration}分钟`,
    },
    {
      title: '原因',
      dataIndex: 'reason',
      search: false,
      width: 80,
      render: (_, record) => {
        if (!record.reason) return '-';
        const map: Record<string, { color: string; text: string }> = {
          BUSINESS: { color: 'blue', text: '商务' },
          PERSONAL: { color: 'orange', text: '个人' },
        };
        const item = map[record.reason];
        return item ? <Tag color={item.color}>{item.text}</Tag> : '-';
      },
    },
    {
      title: '已取消',
      dataIndex: 'cancelled',
      search: false,
      width: 80,
      render: (_, record) => (
        <Tag color={record.cancelled ? 'red' : 'default'}>
          {record.cancelled ? '已取消' : '正常'}
        </Tag>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.TimeblockItem>
        headerTitle="时间块列表"
        rowKey="id"
        actionRef={actionRef}
        params={{
          locationId: selectedLocationId,
          staffId: selectedStaffId,
          dateRange,
        }}
        toolBarRender={() => [
          <Select
            key="location"
            allowClear
            placeholder="按门店过滤"
            style={{ width: 180 }}
            value={selectedLocationId}
            onChange={(val) => {
              setSelectedLocationId(val);
              actionRef.current?.reload();
            }}
            options={locations.map((l) => ({ label: l.name, value: l.id }))}
          />,
          <Select
            key="staff"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="按员工过滤"
            style={{ width: 180 }}
            value={selectedStaffId}
            onChange={(val) => {
              setSelectedStaffId(val);
              actionRef.current?.reload();
            }}
            options={staffList.map((s) => ({
              value: s.id,
              label:
                s.displayName ||
                [s.firstName, s.lastName].filter(Boolean).join(' ') ||
                s.id,
            }))}
          />,
          <DatePicker.RangePicker
            key="dateRange"
            showTime
            format="YYYY-MM-DD HH:mm"
            value={dateRange as any}
            onChange={(val) => {
              setDateRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null);
              actionRef.current?.reload();
            }}
          />,
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            新建时间块
          </Button>,
        ]}
        request={async (params) => {
          const response = await getTimeblocks({
            page: params.current,
            limit: params.pageSize,
            locationId: params.locationId,
            staffId: params.staffId,
            // 同时传入 startDate + endDate 时后端忽略分页，返回全部匹配数据
            startDate: dateRange?.[0]?.toISOString(),
            endDate: dateRange?.[1]?.toISOString(),
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
            setSelectedTimeblock(record);
            setDrawerOpen(true);
          },
          style: { cursor: 'pointer' },
        })}
        search={false}
      />

      <TimeblockDrawer
        open={drawerOpen}
        timeblock={selectedTimeblock}
        onClose={() => setDrawerOpen(false)}
        onRefresh={() => actionRef.current?.reload()}
      />

      <TimeblockCreateModal
        open={createModalOpen}
        staffList={staffList}
        locations={locations}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreate}
        loading={loading}
      />
    </PageContainer>
  );
};

export default TimeblockPage;
