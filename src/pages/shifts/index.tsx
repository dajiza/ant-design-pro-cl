import { PageContainer } from '@ant-design/pro-components';
import { Button, message, Select, Spin, Table, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createShift,
  getLocations,
  getShifts,
  getStaff,
  unpublishShift,
} from '@/services/ant-design-pro/api';
import ShiftCreateModal from './components/ShiftCreateModal';
import ShiftUnpublishModal from './components/ShiftUnpublishModal';

const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const ShiftsPage: React.FC = () => {
  const [locations, setLocations] = useState<API.LocationItem[]>([]);
  const [staffList, setStaffList] = useState<API.StaffItem[]>([]);
  const [shifts, setShifts] = useState<API.ShiftItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedLocationId, setSelectedLocationId] = useState<
    string | undefined
  >(undefined);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(
    undefined,
  );

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [unpublishModalOpen, setUnpublishModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [prefill, setPrefill] = useState<{
    staffId?: string;
    day?: number;
  } | null>(null);

  // Load locations and staff on mount
  useEffect(() => {
    getLocations({ limit: 100 })
      .then((r) => {
        setLocations(r.data || []);
        if (r.data && r.data.length > 0) {
          setSelectedLocationId(r.data[0].id);
        }
      })
      .catch(() => {});
    getStaff({ limit: 100 })
      .then((r) => setStaffList(r.data || []))
      .catch(() => {});
  }, []);

  // Load shifts when location changes
  const fetchShifts = useCallback(async () => {
    if (!selectedLocationId) return;
    setLoading(true);
    try {
      const res = await getShifts({ limit: 500 });
      // Filter shifts by selected location
      const filtered = (res.data || []).filter(
        (s) => s.locationId === selectedLocationId,
      );
      setShifts(filtered);
    } catch {
      message.error('加载排班数据失败');
    } finally {
      setLoading(false);
    }
  }, [selectedLocationId]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // Build a map: staffId -> staffName
  const staffNameMap = useMemo(() => {
    const map = new Map<string, string>();
    staffList.forEach((s) => {
      map.set(s.id, s.displayName || s.name || s.id);
    });
    return map;
  }, [staffList]);

  // Group shifts by staffId, optionally filter by selected staff
  const tableData = useMemo(() => {
    // Collect unique staff IDs from shifts (filtered by location)
    const staffIds = new Set<string>();
    shifts.forEach((s) => {
      if (s.staffId) staffIds.add(s.staffId);
    });

    // If a staff filter is selected, only show that staff
    const displayStaffIds = selectedStaffId
      ? [selectedStaffId]
      : Array.from(staffIds);

    // Build shift map: staffId -> day -> shift
    const shiftMap = new Map<string, Map<number, API.ShiftItem>>();
    shifts.forEach((s) => {
      if (!s.staffId || s.day == null) return;
      if (!shiftMap.has(s.staffId)) {
        shiftMap.set(s.staffId, new Map());
      }
      shiftMap.get(s.staffId)!.set(s.day, s);
    });

    return displayStaffIds.map((staffId) => {
      const dayMap = shiftMap.get(staffId) || new Map<number, API.ShiftItem>();
      const row: any = {
        key: staffId,
        staffId,
        staffName: staffNameMap.get(staffId) || staffId,
      };
      for (let d = 0; d < 7; d++) {
        row[`day_${d}`] = dayMap.get(d) || null;
      }
      return row;
    });
  }, [shifts, staffNameMap, selectedStaffId]);

  const handleCellClick = (staffId: string, day: number) => {
    setPrefill({ staffId, day });
    setCreateModalOpen(true);
  };

  const handleCreate = async (values: any) => {
    setSubmitLoading(true);
    try {
      await createShift(values as API.CreateShiftParams);
      message.success('排班创建成功');
      setCreateModalOpen(false);
      setPrefill(null);
      fetchShifts();
    } catch (error: any) {
      message.error(`创建失败: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUnpublish = async (values: any) => {
    setSubmitLoading(true);
    try {
      await unpublishShift(values as API.UnpublishShiftParams);
      message.success('取消发布成功');
      setUnpublishModalOpen(false);
      fetchShifts();
    } catch (error: any) {
      message.error(`取消发布失败: ${error.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    {
      title: '员工',
      dataIndex: 'staffName',
      key: 'staffName',
      width: 120,
      fixed: 'left' as const,
    },
    ...DAY_NAMES.map((name, dayIndex) => ({
      title: name,
      key: `day_${dayIndex}`,
      width: 140,
      render: (_: any, record: any) => {
        const shift: API.ShiftItem | null = record[`day_${dayIndex}`];
        if (!shift) {
          return (
            <span
              style={{ cursor: 'pointer', color: '#999' }}
              onClick={() => handleCellClick(record.staffId, dayIndex)}
            >
              -
            </span>
          );
        }
        const timeStr = `${shift.clockIn || '?'} - ${shift.clockOut || '?'}`;
        return (
          <Tag
            color={shift.available ? 'green' : 'default'}
            style={{ cursor: 'pointer' }}
            onClick={() => handleCellClick(record.staffId, dayIndex)}
          >
            {timeStr}
          </Tag>
        );
      },
    })),
  ];

  return (
    <PageContainer>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <span>门店：</span>
        <Select
          value={selectedLocationId}
          onChange={setSelectedLocationId}
          style={{ width: 240 }}
          placeholder="选择门店"
          options={locations.map((l) => ({
            value: l.id,
            label: l.name || l.id,
          }))}
        />
        <span>员工：</span>
        <Select
          value={selectedStaffId}
          onChange={setSelectedStaffId}
          style={{ width: 200 }}
          placeholder="全部员工"
          allowClear
          showSearch
          optionFilterProp="label"
          options={staffList.map((s) => ({
            value: s.id,
            label: s.displayName || s.name || s.id,
          }))}
        />
        <Button
          type="primary"
          onClick={() => {
            setPrefill(null);
            setCreateModalOpen(true);
          }}
        >
          新建排班
        </Button>
        <Button onClick={() => setUnpublishModalOpen(true)}>取消发布</Button>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          bordered
          size="middle"
          scroll={{ x: 1100 }}
          locale={{ emptyText: '暂无排班数据' }}
        />
      </Spin>

      <ShiftCreateModal
        open={createModalOpen}
        staffList={staffList}
        locations={locations}
        defaultLocationId={selectedLocationId}
        prefill={prefill}
        onCancel={() => {
          setCreateModalOpen(false);
          setPrefill(null);
        }}
        onOk={handleCreate}
        loading={submitLoading}
      />

      <ShiftUnpublishModal
        open={unpublishModalOpen}
        staffList={staffList}
        locations={locations}
        defaultLocationId={selectedLocationId}
        onCancel={() => setUnpublishModalOpen(false)}
        onOk={handleUnpublish}
        loading={submitLoading}
      />
    </PageContainer>
  );
};

export default ShiftsPage;
