import { PageContainer } from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Form,
  Input,
  message,
  Radio,
  Select,
  Space,
  Spin,
  Steps,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

dayjs.extend(utc);
dayjs.extend(timezone);

import {
  bookingAbandon,
  bookingComplete,
  bookingCreate,
  bookingUpdateSession,
  getAvailableDates,
  getAvailableTimes,
  getClient,
  getClients,
  getEmployees,
  getLocations,
  getServices,
  getStaff,
} from '@/services/ant-design-pro/api';

const NewAppointment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // master data
  const [locations, setLocations] = useState<API.LocationItem[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const clientSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [services, setServices] = useState<API.ServiceItem[]>([]);
  const [staffList, setStaffList] = useState<API.StaffItem[]>([]);
  const [employeeList, setEmployeeList] = useState<API.EmployeeItem[]>([]);

  // step 1
  const [locationId, setLocationId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  // step 2
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [employeeMap, setEmployeeMap] = useState<Record<string, string>>({});
  const [timeMode, setTimeMode] = useState<'back-to-back' | 'custom'>(
    'back-to-back',
  );
  // addon: key = baseServiceId, value = addonServiceId[]
  const [addonMap, setAddonMap] = useState<Record<string, string[]>>({});

  // step 3 — time selection
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [serviceTimeMap, setServiceTimeMap] = useState<Record<string, string>>(
    {},
  );
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const [currentSlots, setCurrentSlots] = useState<API.StaffAvailability[]>([]);
  const [fetchingDates, setFetchingDates] = useState(false);
  const [fetchingTimes, setFetchingTimes] = useState(false);
  const [slotMode, setSlotMode] = useState<'regular' | 'compressed'>('regular');
  // back-to-back mode: single start time
  const [backToBackTime, setBackToBackTime] = useState<string | null>(null);

  // step 4
  const [notes, setNotes] = useState('');
  const [clientMessage, setClientMessage] = useState('');

  const abandonedRef = useRef(false);

  // load master data + prefill from query params
  useEffect(() => {
    Promise.all([
      getLocations({ limit: 100 }).then((r) => setLocations(r.data || [])),
      getServices({ limit: 100 }).then((r) =>
        setServices((r.data || []).filter((s: any) => s.active)),
      ),
      getStaff({ limit: 100 }).then((r) =>
        setStaffList(r.data.filter((s: API.StaffItem) => s.active)),
      ),
      getEmployees({ limit: 100, active: true }).then((r) =>
        setEmployeeList(r.data || []),
      ),
    ]).catch(() => message.error('加载数据失败'));

    const qLocation = searchParams.get('locationId');
    const qClient = searchParams.get('clientId');
    const qService = searchParams.get('serviceId');
    const qStaff = searchParams.get('staffId');
    const qEmployee = searchParams.get('employeeId');
    if (qLocation) setLocationId(qLocation);
    if (qClient) {
      setClientId(qClient);
      getClient(qClient)
        .then((r) => setSelectedClient(r))
        .catch(() => {});
    }
    if (qService) {
      setSelectedServiceIds([qService]);
      if (qStaff) setStaffMap({ [qService]: qStaff });
      if (qEmployee) setEmployeeMap({ [qService]: qEmployee });
    }
  }, []);

  // abandon session on unmount
  useEffect(() => {
    return () => {
      if (sessionId && !abandonedRef.current) {
        abandonedRef.current = true;
        bookingAbandon(sessionId).catch(() => {});
      }
    };
  }, [sessionId]);

  // lookup helpers
  const getLocationName = (id: string) =>
    locations.find((l) => l.id === id)?.name || id;
  const getClientName = (id: string) => {
    const c =
      selectedClient?.id === id
        ? selectedClient
        : clients.find((c: any) => c.id === id);
    return (
      c?.name ||
      `${c?.firstName || ''} ${c?.lastName || ''}`.trim() ||
      c?.email ||
      id
    );
  };
  const getServiceName = (id: string) =>
    services.find((s) => s.id === id)?.name || id;
  const getServiceDuration = (id: string) =>
    services.find((s) => s.id === id)?.defaultDuration || 3600;
  const getStaffName = (id: string) => {
    const s = staffList.find((s) => s.id === id);
    return (
      s?.displayName ||
      s?.name ||
      `${s?.firstName || ''} ${s?.lastName || ''}`.trim() ||
      id
    );
  };
  const getEmployeeName = (id: string) => {
    const e = employeeList.find((e) => e.id === id);
    return `${e?.firstName || ''} ${e?.lastName || ''}`.trim() || id;
  };

  // client remote search
  const handleClientSearch = useCallback((value: string) => {
    if (clientSearchTimer.current) clearTimeout(clientSearchTimer.current);
    if (!value || value.length < 2) {
      setClients([]);
      setClientSearchLoading(false);
      return;
    }
    setClientSearchLoading(true);
    clientSearchTimer.current = setTimeout(async () => {
      try {
        const r = await getClients({ name: value, limit: 20 });
        setClients(r.data || []);
      } catch {
        setClients([]);
      } finally {
        setClientSearchLoading(false);
      }
    }, 300);
  }, []);

  const locationTz = useMemo(
    () => locations.find((l) => l.id === locationId)?.tz || 'UTC',
    [locations, locationId],
  );

  // ---- Step 1: next ----
  const handleStep1Next = async () => {
    if (!locationId || !clientId) {
      message.warning('请选择门店和客户');
      return;
    }
    setLoading(true);
    try {
      const session = await bookingCreate({ locationId, clientId });
      setSessionId(session.id);
      setCurrent(1);
    } catch (err: any) {
      message.error(`创建会话失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ---- Step 2: next ----
  const buildServicesPayload = useCallback(
    (timeMap?: Record<string, string>) =>
      selectedServiceIds.map((serviceId) => ({
        serviceId,
        staffId: staffMap[serviceId],
        employeeId: employeeMap[serviceId] || undefined,
        startAt: timeMap?.[serviceId] || undefined,
        addons:
          addonMap[serviceId]?.length > 0
            ? addonMap[serviceId].map((addonId) => ({ serviceId: addonId }))
            : undefined,
      })),
    [selectedServiceIds, staffMap, employeeMap, addonMap],
  );

  const handleStep2Next = async () => {
    if (selectedServiceIds.length === 0) {
      message.warning('请选择至少一个服务');
      return;
    }
    const missingStaff = selectedServiceIds.filter((id) => !staffMap[id]);
    if (missingStaff.length > 0) {
      message.warning('请为每个服务选择房间');
      return;
    }
    if (!sessionId) return;
    setLoading(true);
    try {
      // save services without startAt
      await bookingUpdateSession(sessionId, {
        services: buildServicesPayload(),
      });
      setCurrent(2);
      // auto-fetch available dates for the first service
      fetchDatesForService(selectedServiceIds[0]);
    } catch (err: any) {
      message.error(`添加服务失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ---- Step 3: sequential per-service time selection ----

  const fetchDatesForService = useCallback(
    async (serviceId: string) => {
      if (!locationId) return;
      setFetchingDates(true);
      setSelectedDate(null);
      setServiceTimeMap({});
      setActiveServiceIndex(0);
      setCurrentSlots([]);
      try {
        const dates = await getAvailableDates({
          locationId,
          serviceId,
          staffId: staffMap[serviceId],
          employeeId: employeeMap[serviceId],
          searchRangeLower: dayjs().format('YYYY-MM-DD'),
          searchRangeUpper: dayjs().add(30, 'day').format('YYYY-MM-DD'),
        });
        setAvailableDates(dates || []);
        if (!dates?.length) {
          message.info('该房间未来 30 天无可用日期');
        }
      } catch {
        message.error('获取可用日期失败');
      } finally {
        setFetchingDates(false);
      }
    },
    [locationId, staffMap, employeeMap],
  );

  // query times for a specific service, pass sessionId only if some services already saved
  const fetchTimesForService = useCallback(
    async (serviceId: string, date: string) => {
      if (!locationId) return;
      setFetchingTimes(true);
      setCurrentSlots([]);
      try {
        // pass sessionId so backend excludes already-saved service slots
        const slots = await getAvailableTimes({
          locationId,
          serviceId,
          date,
          staffId: staffMap[serviceId],
          employeeId: employeeMap[serviceId],
          sessionId: sessionId || undefined,
        });
        setCurrentSlots(slots || []);
        if (!slots?.length) {
          message.info('该服务在此日期无可用时段');
        }
      } catch {
        message.error('获取可用时间失败');
      } finally {
        setFetchingTimes(false);
      }
    },
    [locationId, sessionId, staffMap, employeeMap],
  );

  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setSlotMode('regular');
    setActiveServiceIndex(0);
    setServiceTimeMap({});
    // fetch times for the first service (no sessionId exclusion initially)
    await fetchTimesForService(selectedServiceIds[0], date);
  };

  const handleServiceTimeSelect = async (time: string) => {
    if (!sessionId) return;
    const serviceId = selectedServiceIds[activeServiceIndex];
    const updatedMap = { ...serviceTimeMap, [serviceId]: time };
    setServiceTimeMap(updatedMap);
    setLoading(true);
    try {
      // save all services with their startAt to session
      await bookingUpdateSession(sessionId, {
        services: buildServicesPayload(updatedMap),
      });
      // move to next service or allow proceed
      const nextIndex = activeServiceIndex + 1;
      if (nextIndex < selectedServiceIds.length) {
        setActiveServiceIndex(nextIndex);
        // fetch times for next service (sessionId now excludes saved services)
        if (selectedDate) {
          await fetchTimesForService(
            selectedServiceIds[nextIndex],
            selectedDate,
          );
        }
      } else {
        // all services done
        setCurrentSlots([]);
      }
    } catch (err: any) {
      const reverted = { ...updatedMap };
      delete reverted[serviceId];
      setServiceTimeMap(reverted);
      message.error(`设置时间失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // re-select a previously completed service
  const handleReselectService = async (index: number) => {
    const serviceId = selectedServiceIds[index];
    // clear this and all subsequent services' times
    const cleared = { ...serviceTimeMap };
    for (let i = index; i < selectedServiceIds.length; i++) {
      delete cleared[selectedServiceIds[i]];
    }
    setServiceTimeMap(cleared);
    setActiveServiceIndex(index);
    if (selectedDate) {
      await fetchTimesForService(serviceId, selectedDate);
    }
  };

  const allServicesHaveTime = useMemo(
    () => selectedServiceIds.every((id) => serviceTimeMap[id]),
    [selectedServiceIds, serviceTimeMap],
  );

  // back-to-back: handle single time selection
  const handleBackToBackTimeSelect = async (time: string) => {
    if (!sessionId) return;
    setBackToBackTime(time);
    setLoading(true);
    try {
      // update services without individual startAt, set session-level startAt
      await bookingUpdateSession(sessionId, {
        services: buildServicesPayload(),
        startAt: time,
      });
    } catch (err: any) {
      setBackToBackTime(null);
      message.error(`设置时间失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // back-to-back: fetch available times for the first service
  const fetchBackToBackTimes = useCallback(
    async (date: string) => {
      if (!locationId || selectedServiceIds.length === 0) return;
      setFetchingTimes(true);
      setCurrentSlots([]);
      try {
        const firstServiceId = selectedServiceIds[0];
        const slots = await getAvailableTimes({
          locationId,
          serviceId: firstServiceId,
          date,
          staffId: staffMap[firstServiceId],
          employeeId: employeeMap[firstServiceId],
          sessionId: sessionId || undefined,
        });
        setCurrentSlots(slots || []);
        if (!slots?.length) {
          message.info('该日期无可用时段');
        }
      } catch {
        message.error('获取可用时间失败');
      } finally {
        setFetchingTimes(false);
      }
    },
    [locationId, selectedServiceIds, sessionId, staffMap, employeeMap],
  );

  // back-to-back date select
  const handleBackToBackDateSelect = async (date: string) => {
    setSelectedDate(date);
    setBackToBackTime(null);
    setSlotMode('regular');
    await fetchBackToBackTimes(date);
  };

  // ---- Step 3 → Step 4: set session-level startAt ----
  const handleStep3Next = async () => {
    if (!sessionId) return;
    if (timeMode === 'back-to-back' && !backToBackTime) return;
    if (timeMode === 'custom' && !allServicesHaveTime) return;
    setLoading(true);
    try {
      if (timeMode === 'back-to-back') {
        // already saved in handleBackToBackTimeSelect
        setCurrent(3);
      } else {
        // set session startAt to the earliest service startAt
        const earliest = selectedServiceIds
          .map((id) => serviceTimeMap[id])
          .filter(Boolean)
          .sort()[0];
        await bookingUpdateSession(sessionId, { startAt: earliest });
        setCurrent(3);
      }
    } catch (err: any) {
      message.error(`设置预约时间失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ---- Step 4: complete ----
  const handleComplete = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      abandonedRef.current = true;
      await bookingComplete(sessionId);
      message.success('预约创建成功');
      history.push('/appointments');
    } catch (err: any) {
      abandonedRef.current = false;
      message.error(`完成预约失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ---- Back navigation ----
  const handleBack = () => {
    setCurrent(current - 1);
  };

  const steps = [
    { title: '基本信息' },
    { title: '服务与员工' },
    { title: '选择时间' },
    { title: '确认预约' },
  ];

  // deduplicated time options for the current active service
  const currentTimeOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const seen = new Set<string>();
    (currentSlots || []).forEach((staff) => {
      const slotList =
        slotMode === 'compressed'
          ? staff.compressedSlots || []
          : staff.availableSlots || [];
      slotList.forEach((slot) => {
        const time = dayjs(slot.startAt).tz(locationTz).format('HH:mm');
        if (!seen.has(time)) {
          seen.add(time);
          options.push({
            value: slot.startAt,
            label: `${time} - ${staff.staffName}`,
          });
        }
      });
    });
    return options;
  }, [currentSlots, slotMode, locationTz]);

  const hasCompressedSlots = (currentSlots || []).some(
    (s) => s.compressedSlots && s.compressedSlots.length > 0,
  );

  const activeServiceId = selectedServiceIds[activeServiceIndex];

  // base services (non-addon) for selection
  const baseServices = useMemo(
    () => services.filter((s) => !s.addon),
    [services],
  );

  // get available addons for a base service under current location
  const getAddonsForService = useCallback(
    (serviceId: string) => {
      const svc = services.find((s) => s.id === serviceId);
      if (!svc?.addons || !locationId) return [];
      // addons is a JSONB keyed by locationId
      const addonList = svc.addons[locationId];
      if (!Array.isArray(addonList) || addonList.length === 0) return [];
      return addonList
        .map((a: any) => {
          const addonServiceId = a.service?.id;
          const addonService = services.find((s) => s.id === addonServiceId);
          return addonService
            ? {
                serviceId: addonServiceId,
                name: a.service?.name || addonService.name,
                duration: addonService.defaultDuration,
                price: addonService.defaultPrice,
              }
            : null;
        })
        .filter(Boolean) as {
        serviceId: string;
        name: string;
        duration: number;
        price: number;
      }[];
    },
    [services, locationId],
  );

  return (
    <PageContainer title="新建预约">
      <Card>
        <Steps current={current} items={steps} style={{ marginBottom: 32 }} />

        {/* Step 1 */}
        {current === 0 && (
          <>
            <Form layout="vertical">
              <Form.Item label="门店" required>
                <Select
                  showSearch
                  placeholder="选择门店"
                  value={locationId}
                  onChange={setLocationId}
                  filterOption={(input, option) =>
                    (option?.label || '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={locations.map((l) => ({
                    value: l.id,
                    label: l.name || l.id,
                  }))}
                />
              </Form.Item>
              <Form.Item label="客户" required>
                <Select
                  showSearch
                  placeholder="输入客户名称搜索"
                  value={clientId}
                  onChange={(val) => {
                    setClientId(val);
                    const found = clients.find((c: any) => c.id === val);
                    if (found) setSelectedClient(found);
                  }}
                  onSearch={handleClientSearch}
                  filterOption={false}
                  loading={clientSearchLoading}
                  notFoundContent={
                    clientSearchLoading ? '搜索中...' : '无匹配客户'
                  }
                  options={[
                    ...(selectedClient &&
                    !clients.find((c: any) => c.id === selectedClient.id)
                      ? [
                          {
                            value: selectedClient.id,
                            label:
                              selectedClient.name ||
                              `${selectedClient.firstName || ''} ${selectedClient.lastName || ''}`.trim() ||
                              selectedClient.email ||
                              selectedClient.id,
                          },
                        ]
                      : []),
                    ...clients.map((c: any) => ({
                      value: c.id,
                      label:
                        c.name ||
                        `${c.firstName || ''} ${c.lastName || ''}`.trim() ||
                        c.email ||
                        c.id,
                    })),
                  ]}
                />
              </Form.Item>
            </Form>
            <Divider />
            <Space>
              <Button onClick={() => history.push('/appointments')}>
                取消
              </Button>
              <Button
                type="primary"
                loading={loading}
                onClick={handleStep1Next}
              >
                下一步
              </Button>
            </Space>
          </>
        )}

        {/* Step 2 */}
        {current === 1 && (
          <>
            <Form layout="vertical">
              <Form.Item label="服务" required>
                <Select
                  mode="multiple"
                  placeholder="选择服务"
                  value={selectedServiceIds}
                  onChange={(ids) => {
                    setSelectedServiceIds(ids);
                    // remove addons for deselected services
                    const next: Record<string, string[]> = {};
                    ids.forEach((id) => {
                      next[id] = addonMap[id] || [];
                    });
                    setAddonMap(next);
                  }}
                  options={baseServices.map((s) => ({
                    value: s.id,
                    label: `${s.name || s.id}${s.defaultDuration ? ` (${s.defaultDuration / 60}min)` : ''}`,
                  }))}
                />
              </Form.Item>
              {selectedServiceIds.map((serviceId) => (
                <div
                  key={serviceId}
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    background: '#fafafa',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>
                    {getServiceName(serviceId)}
                  </div>
                  <Form.Item label="房间" required style={{ marginBottom: 12 }}>
                    <Select
                      showSearch
                      allowClear
                      placeholder="选择房间"
                      value={staffMap[serviceId]}
                      onChange={(val) =>
                        setStaffMap({ ...staffMap, [serviceId]: val })
                      }
                      filterOption={(input, option) =>
                        (option?.label || '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={staffList.map((s) => ({
                        value: s.id,
                        label:
                          s.displayName ||
                          s.name ||
                          `${s.firstName || ''} ${s.lastName || ''}`.trim(),
                      }))}
                    />
                  </Form.Item>
                  <Form.Item label="技师" style={{ marginBottom: 0 }}>
                    <Select
                      showSearch
                      allowClear
                      placeholder="选择技师（可选）"
                      value={employeeMap[serviceId]}
                      onChange={(val) =>
                        setEmployeeMap({ ...employeeMap, [serviceId]: val })
                      }
                      filterOption={(input, option) =>
                        (option?.label || '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={employeeList.map((e) => ({
                        value: e.id,
                        label: `${e.firstName}${e.lastName ? ' ' + e.lastName : ''}`,
                      }))}
                    />
                  </Form.Item>
                  {getAddonsForService(serviceId).length > 0 && (
                    <Form.Item
                      label="附加服务 (Addon)"
                      style={{ marginTop: 12, marginBottom: 0 }}
                    >
                      <Select
                        mode="multiple"
                        placeholder="选择附加服务（可选）"
                        value={addonMap[serviceId] || []}
                        onChange={(val) =>
                          setAddonMap({ ...addonMap, [serviceId]: val })
                        }
                        options={getAddonsForService(serviceId).map((a) => ({
                          value: a.serviceId,
                          label: `${a.name}${a.duration ? ` (${a.duration / 60}min)` : ''}`,
                        }))}
                      />
                    </Form.Item>
                  )}
                </div>
              ))}
              {/* time mode selection — only show for multi-service */}
              {selectedServiceIds.length >= 2 && (
                <Form.Item label="时间排列方式" style={{ marginTop: 16 }}>
                  <Radio.Group
                    value={timeMode}
                    onChange={(e) => setTimeMode(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="back-to-back">紧凑排列</Radio.Button>
                    <Radio.Button value="custom">自定义间隔</Radio.Button>
                  </Radio.Group>
                  <div style={{ marginTop: 4, color: '#888', fontSize: 12 }}>
                    {timeMode === 'back-to-back'
                      ? '所有服务自动紧挨排列，只需选一个开始时间'
                      : '为每个服务分别选择开始时间'}
                  </div>
                </Form.Item>
              )}
            </Form>
            <Divider />
            <Space>
              <Button onClick={handleBack}>上一步</Button>
              <Button
                type="primary"
                loading={loading}
                onClick={handleStep2Next}
              >
                下一步
              </Button>
            </Space>
          </>
        )}

        {/* Step 3 — time selection */}
        {current === 2 && (
          <>
            <Spin spinning={fetchingDates}>
              <Form layout="vertical">
                <Form.Item label="选择日期">
                  <Select
                    style={{ width: '100%' }}
                    placeholder="选择可用日期"
                    value={selectedDate}
                    onChange={
                      timeMode === 'back-to-back'
                        ? handleBackToBackDateSelect
                        : handleDateSelect
                    }
                    options={availableDates.map((d) => ({
                      value: d,
                      label: dayjs(d).format('YYYY-MM-DD (ddd)'),
                    }))}
                  />
                </Form.Item>
              </Form>
            </Spin>

            {selectedDate && timeMode === 'back-to-back' && (
              <>
                <div
                  style={{
                    marginBottom: 16,
                    padding: 16,
                    background: backToBackTime ? '#f6ffed' : '#fff',
                    border: backToBackTime
                      ? '1px solid #b7eb8f'
                      : '1px solid #1890ff',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>
                    开始时间
                    {backToBackTime && (
                      <Tag color="green" style={{ marginLeft: 8 }}>
                        {dayjs(backToBackTime).tz(locationTz).format('HH:mm')}
                      </Tag>
                    )}
                  </div>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>
                    所有服务将从选定时间开始，自动紧挨排列
                  </div>
                  <Spin spinning={fetchingTimes}>
                    {hasCompressedSlots && (
                      <Form layout="vertical">
                        <Form.Item
                          label="时间段模式"
                          style={{ marginBottom: 8 }}
                        >
                          <Radio.Group
                            value={slotMode}
                            onChange={(e) => setSlotMode(e.target.value)}
                            optionType="button"
                            buttonStyle="solid"
                            size="small"
                          >
                            <Radio.Button value="regular">
                              常规时间
                            </Radio.Button>
                            <Radio.Button value="compressed">
                              极限压缩
                            </Radio.Button>
                          </Radio.Group>
                        </Form.Item>
                      </Form>
                    )}
                    <Select
                      style={{ width: '100%' }}
                      placeholder="选择开始时间"
                      value={backToBackTime || undefined}
                      onChange={handleBackToBackTimeSelect}
                      options={currentTimeOptions}
                      disabled={loading}
                    />
                  </Spin>
                </div>
              </>
            )}

            {selectedDate && timeMode === 'custom' && (
              <>
                {/* service progress list */}
                {selectedServiceIds.map((serviceId, index) => {
                  const isCompleted = !!serviceTimeMap[serviceId];
                  const isActive = index === activeServiceIndex && !isCompleted;
                  const isPending = index > activeServiceIndex;

                  return (
                    <div
                      key={serviceId}
                      style={{
                        marginBottom: 16,
                        padding: 16,
                        background: isCompleted
                          ? '#f6ffed'
                          : isActive
                            ? '#fff'
                            : '#fafafa',
                        border: isCompleted
                          ? '1px solid #b7eb8f'
                          : isActive
                            ? '1px solid #1890ff'
                            : '1px solid #f0f0f0',
                        borderRadius: 8,
                        opacity: isPending ? 0.6 : 1,
                      }}
                    >
                      {/* header */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 4,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 500 }}>
                            {index + 1}/{selectedServiceIds.length}{' '}
                            {getServiceName(serviceId)}
                          </span>
                          <span
                            style={{
                              fontWeight: 400,
                              color: '#888',
                              marginLeft: 8,
                            }}
                          >
                            房间: {getStaffName(staffMap[serviceId])}
                            {employeeMap[serviceId]
                              ? ` | 技师: ${getEmployeeName(employeeMap[serviceId])}`
                              : ''}
                          </span>
                        </div>
                        {isCompleted && (
                          <Space>
                            <Tag color="green">
                              {dayjs(serviceTimeMap[serviceId])
                                .tz(locationTz)
                                .format('HH:mm')}
                            </Tag>
                            <Button
                              size="small"
                              type="link"
                              onClick={() => handleReselectService(index)}
                            >
                              重选
                            </Button>
                          </Space>
                        )}
                        {isPending && <Tag>待选择</Tag>}
                      </div>

                      {/* time selector — only show for the active service */}
                      {isActive && (
                        <Spin spinning={fetchingTimes}>
                          <div style={{ marginTop: 8 }}>
                            {hasCompressedSlots && (
                              <Form layout="vertical">
                                <Form.Item
                                  label="时间段模式"
                                  style={{ marginBottom: 8 }}
                                >
                                  <Radio.Group
                                    value={slotMode}
                                    onChange={(e) =>
                                      setSlotMode(e.target.value)
                                    }
                                    optionType="button"
                                    buttonStyle="solid"
                                    size="small"
                                  >
                                    <Radio.Button value="regular">
                                      常规时间
                                    </Radio.Button>
                                    <Radio.Button value="compressed">
                                      极限压缩
                                    </Radio.Button>
                                  </Radio.Group>
                                </Form.Item>
                              </Form>
                            )}
                            <Select
                              style={{ width: '100%' }}
                              placeholder="选择可用时间"
                              value={undefined}
                              onChange={(time) => handleServiceTimeSelect(time)}
                              options={currentTimeOptions}
                              disabled={loading}
                            />
                          </div>
                        </Spin>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            <Divider />
            <Space>
              <Button onClick={handleBack}>上一步</Button>
              <Button
                type="primary"
                disabled={
                  timeMode === 'back-to-back'
                    ? !backToBackTime
                    : !allServicesHaveTime
                }
                loading={loading}
                onClick={handleStep3Next}
              >
                下一步
              </Button>
            </Space>
          </>
        )}

        {/* Step 4 */}
        {current === 3 && (
          <>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="门店">
                {getLocationName(locationId!)}
              </Descriptions.Item>
              <Descriptions.Item label="客户">
                {getClientName(clientId!)}
              </Descriptions.Item>
              <Descriptions.Item label="服务与时间">
                {timeMode === 'back-to-back' && backToBackTime && (
                  <div style={{ marginBottom: 8, color: '#1890ff' }}>
                    开始时间:{' '}
                    {dayjs(backToBackTime)
                      .tz(locationTz)
                      .format('YYYY-MM-DD HH:mm')}
                    （自动紧挨排列）
                  </div>
                )}
                {selectedServiceIds.map((sid) => {
                  const durationSec = getServiceDuration(sid);
                  const durationMin = durationSec / 60;
                  const startAt =
                    timeMode === 'back-to-back'
                      ? undefined
                      : serviceTimeMap[sid];
                  const selectedAddons = addonMap[sid] || [];
                  return (
                    <div key={sid} style={{ marginBottom: 4 }}>
                      {getServiceName(sid)} ({durationMin}min)
                      {' — '}
                      房间: {getStaffName(staffMap[sid])}
                      {employeeMap[sid]
                        ? ` | 技师: ${getEmployeeName(employeeMap[sid])}`
                        : ''}
                      {startAt && (
                        <span style={{ marginLeft: 8, color: '#1890ff' }}>
                          {dayjs(startAt).tz(locationTz).format('HH:mm')} -{' '}
                          {dayjs(startAt)
                            .add(durationMin, 'minute')
                            .tz(locationTz)
                            .format('HH:mm')}
                        </span>
                      )}
                      {selectedAddons.length > 0 && (
                        <div
                          style={{
                            marginLeft: 16,
                            marginTop: 2,
                            color: '#888',
                            fontSize: 13,
                          }}
                        >
                          {'+ '}附加:{' '}
                          {selectedAddons
                            .map((aid) => getServiceName(aid))
                            .join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Form layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item label="备注">
                <Input.TextArea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Form.Item>
              <Form.Item label="客户留言">
                <Input.TextArea
                  rows={2}
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                />
              </Form.Item>
            </Form>

            <Divider />
            <Space>
              <Button onClick={handleBack}>上一步</Button>
              <Button type="primary" loading={loading} onClick={handleComplete}>
                确认预约
              </Button>
              <Button danger onClick={() => history.push('/appointments')}>
                取消
              </Button>
            </Space>
          </>
        )}
      </Card>
    </PageContainer>
  );
};

export default NewAppointment;
