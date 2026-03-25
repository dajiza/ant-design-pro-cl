import { LeftOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useNavigate } from '@umijs/max';
import { useRequest } from 'ahooks';
import {
  Button,
  Card,
  Col,
  message,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useMemo, useState } from 'react';
import {
  createAppointment,
  getAppointments,
  getClients,
  getServices,
  getStaff,
} from '@/services/ant-design-pro/api';

const { Title, Text } = Typography;

// 预约规则配置
const BOOKING_RULES = {
  startHour: 9, // 开始时间 9:00
  endHour: 18, // 结束时间 18:00
  slotDuration: 30, // 时间区块 30 分钟
};

// 检查时间区间是否重叠
const isTimeOverlapping = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean => {
  return start1 < end2 && start2 < end1;
};

// 生成指定日期的时间区块
const generateTimeSlots = (
  date: dayjs.Dayjs,
  serviceDuration: number,
  bookedAppointments: API.AppointmentItem[],
) => {
  const slots: { time: string; available: boolean; datetime: Date }[] = [];
  const startOfDay = date.hour(BOOKING_RULES.startHour).minute(0).second(0);
  const endOfDay = date.hour(BOOKING_RULES.endHour).minute(0).second(0);

  let currentSlot = startOfDay;
  while (currentSlot.isBefore(endOfDay)) {
    const slotStart = currentSlot.toDate();
    const slotEnd = currentSlot.add(serviceDuration, 'minute').toDate();

    // 检查是否与已有预约重叠
    const isBooked = bookedAppointments.some((apt) => {
      const aptStart = new Date(apt.startAt);
      const aptEnd = apt.endAt
        ? new Date(apt.endAt)
        : new Date(aptStart.getTime() + (apt.duration || 3600) * 1000);
      return isTimeOverlapping(slotStart, slotEnd, aptStart, aptEnd);
    });

    // 检查是否已经过了当前时间
    const isPast = slotStart < new Date();

    slots.push({
      time: currentSlot.format('HH:mm'),
      available: !isBooked && !isPast,
      datetime: slotStart,
    });
    currentSlot = currentSlot.add(BOOKING_RULES.slotDuration, 'minute');
  }

  return slots;
};

// 生成 UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const NewAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState<string | undefined>();
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [selectedStaff, setSelectedStaff] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 获取客户列表
  const { data: clientsData, loading: clientsLoading } = useRequest(
    () => getClients({ page: 1, limit: 100 }),
    { refreshDeps: [] },
  );

  // 获取服务列表
  const { data: servicesData, loading: servicesLoading } = useRequest(
    () => getServices({ page: 1, limit: 100 }),
    { refreshDeps: [] },
  );

  // 获取员工列表
  const { data: staffData, loading: staffLoading } = useRequest(
    () => getStaff({ page: 1, limit: 100 }),
    { refreshDeps: [] },
  );

  // 获取已预约的时间（当选择员工和日期后）
  const startDateStr = selectedDate.startOf('day').toISOString();
  const endDateStr = selectedDate.endOf('day').toISOString();

  const { data: bookedAppointmentsData, loading: bookedLoading } = useRequest(
    () =>
      getAppointments({
        staffId: selectedStaff!,
        startDate: startDateStr,
        endDate: endDateStr,
        limit: 100,
      }),
    {
      ready: !!selectedStaff,
      refreshDeps: [selectedStaff, selectedDate.format('YYYY-MM-DD')],
    },
  );

  const bookedAppointments = bookedAppointmentsData?.data || [];

  // 获取当前选中服务的信息
  const selectedServiceInfo = useMemo(() => {
    if (!selectedService || !servicesData?.data) return null;
    return servicesData.data.find((s) => s.id === selectedService);
  }, [selectedService, servicesData]);

  // 获取当前选中客户的信息
  const selectedClientInfo = useMemo(() => {
    if (!selectedClient || !clientsData?.data) return null;
    return clientsData.data.find((c) => c.id === selectedClient);
  }, [selectedClient, clientsData]);

  // 生成时间区块
  const timeSlots = useMemo(() => {
    if (!selectedServiceInfo) return [];
    return generateTimeSlots(
      selectedDate,
      selectedServiceInfo.defaultDuration,
      bookedAppointments,
    );
  }, [selectedDate, selectedServiceInfo, bookedAppointments]);

  // 生成未来 7 天的日期选项
  const dateOptions = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = dayjs().add(i, 'day');
      dates.push({
        value: date.format('YYYY-MM-DD'),
        label: date.format('ddd, MMM D'),
        date,
      });
    }
    return dates;
  }, []);

  // 切换日期
  const handleDateChange = useCallback(
    (dateStr: string) => {
      const found = dateOptions.find((d) => d.value === dateStr);
      if (found) {
        setSelectedDate(found.date);
        setSelectedSlot(null);
      }
    },
    [dateOptions],
  );

  // 提交预约
  const handleSubmit = async () => {
    if (
      !selectedClient ||
      !selectedService ||
      !selectedStaff ||
      !selectedSlot ||
      !selectedServiceInfo
    ) {
      message.error('Please select client, service, staff and time slot');
      return;
    }

    setSubmitting(true);
    try {
      const startAt = dayjs(selectedSlot);
      const endAt = startAt.add(selectedServiceInfo.defaultDuration, 'minute');

      await createAppointment({
        id: generateUUID(),
        clientId: selectedClient,
        staffId: selectedStaff,
        startAt: startAt.toISOString(),
        createdAt: dayjs().toISOString(),
        cancelled: false,
        duration: selectedServiceInfo.defaultDuration * 60, // 转换为秒
        endAt: endAt.toISOString(),
        appointmentServices: [
          {
            id: selectedServiceInfo.id,
            name: selectedServiceInfo.name,
            defaultDuration: selectedServiceInfo.defaultDuration,
            defaultPrice: selectedServiceInfo.defaultPrice,
          },
        ],
      });
      message.success('Appointment created successfully');
      navigate('/appointments');
    } catch (error) {
      message.error('Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const loading =
    clientsLoading || servicesLoading || staffLoading || bookedLoading;

  return (
    <PageContainer
      header={{
        title: 'New Appointment',
        onBack: () => navigate('/appointments'),
        backIcon: <LeftOutlined />,
      }}
    >
      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          {/* Step 1: 选择客户 */}
          <Col xs={24} lg={6}>
            <Card title="1. Select Client" size="small">
              <Select
                style={{ width: '100%' }}
                placeholder="Search or choose a client"
                showSearch
                value={selectedClient}
                onChange={(val) => setSelectedClient(val)}
                filterOption={(input, option) =>
                  (option?.label as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={clientsData?.data?.map((c) => ({
                  value: c.id,
                  label:
                    c.name ||
                    [c.firstName, c.lastName].filter(Boolean).join(' ') ||
                    c.email ||
                    c.id,
                }))}
              />
              {selectedClientInfo && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">
                    {selectedClientInfo.email && (
                      <div>Email: {selectedClientInfo.email}</div>
                    )}
                    {selectedClientInfo.mobilePhone && (
                      <div>Phone: {selectedClientInfo.mobilePhone}</div>
                    )}
                  </Text>
                </div>
              )}
            </Card>
          </Col>

          {/* Step 2: 选择服务 */}
          <Col xs={24} lg={6}>
            <Card title="2. Select Service" size="small">
              <Select
                style={{ width: '100%' }}
                placeholder="Choose a service"
                value={selectedService}
                onChange={(val) => {
                  setSelectedService(val);
                  setSelectedSlot(null);
                }}
                options={servicesData?.data
                  ?.filter((s) => s.active && !s.addon)
                  .map((s) => ({
                    value: s.id,
                    label: (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{s.name}</span>
                        <Tag>{s.defaultDuration} min</Tag>
                      </div>
                    ),
                  }))}
              />
              {selectedServiceInfo && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">
                    Duration: {selectedServiceInfo.defaultDuration} minutes
                    <br />${selectedServiceInfo.defaultPrice}
                  </Text>
                </div>
              )}
            </Card>
          </Col>

          {/* Step 3: 选择员工 */}
          <Col xs={24} lg={6}>
            <Card title="3. Select Staff" size="small">
              <Select
                style={{ width: '100%' }}
                placeholder="Choose a staff member"
                value={selectedStaff}
                onChange={(val) => {
                  setSelectedStaff(val);
                  setSelectedSlot(null);
                }}
                options={staffData?.data
                  ?.filter((s) => s.active)
                  .map((s) => ({
                    value: s.id,
                    label:
                      s.displayName || s.name || `${s.firstName} ${s.lastName}`,
                  }))}
              />
            </Card>
          </Col>

          {/* Step 4: 选择时间 */}
          <Col xs={24} lg={6}>
            <Card title="4. Select Time" size="small">
              {!selectedClient || !selectedService || !selectedStaff ? (
                <Text type="secondary">
                  Please select client, service and staff first
                </Text>
              ) : (
                <>
                  {/* 日期选择器 */}
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Select Date:</Text>
                    <div
                      style={{
                        marginTop: 8,
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      {dateOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          size="small"
                          type={
                            selectedDate.isSame(opt.date, 'day')
                              ? 'primary'
                              : 'default'
                          }
                          onClick={() => handleDateChange(opt.value)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 时间区块选择器 */}
                  <div>
                    <Text strong>Available Times:</Text>
                    <Spin spinning={bookedLoading} size="small">
                      <div
                        style={{
                          marginTop: 8,
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                          maxHeight: 300,
                          overflowY: 'auto',
                        }}
                      >
                        {timeSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            size="small"
                            type={
                              selectedSlot &&
                              dayjs(selectedSlot).isSame(
                                slot.datetime,
                                'minute',
                              )
                                ? 'primary'
                                : 'default'
                            }
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot.datetime)}
                            style={
                              !slot.available ? { opacity: 0.4 } : undefined
                            }
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    </Spin>
                  </div>
                </>
              )}
            </Card>
          </Col>

          {/* 确认区域 */}
          <Col span={24}>
            <Card>
              <Space>
                <Button onClick={() => navigate('/appointments')}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={
                    !selectedClient ||
                    !selectedService ||
                    !selectedStaff ||
                    !selectedSlot
                  }
                >
                  Confirm Appointment
                </Button>
              </Space>
              {selectedSlot && selectedServiceInfo && selectedClientInfo && (
                <div style={{ marginTop: 16 }}>
                  <Text>
                    Appointment:{' '}
                    <strong>
                      {selectedClientInfo.name || selectedClientInfo.firstName}{' '}
                      - {selectedServiceInfo.name} at{' '}
                      {dayjs(selectedSlot).format('MMM D, HH:mm')}
                    </strong>
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </PageContainer>
  );
};

export default NewAppointment;
