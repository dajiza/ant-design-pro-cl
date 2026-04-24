import { PageContainer } from '@ant-design/pro-components';
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import {
  Button,
  DatePicker,
  Descriptions,
  Modal,
  message,
  Select,
  Space,
  Spin,
  Tag,
} from 'antd';
import { createStyles } from 'antd-style';
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
import {
  cancelAppointment,
  getAppointmentsByDateRange,
  getLocations,
  getStaff,
  updateAppointmentState,
} from '@/services/ant-design-pro/api';
import AppointmentStateBadge from '../components/AppointmentStateBadge';

dayjs.extend(utc);
dayjs.extend(timezone);

type StaffItem = API.StaffItem;
type AppointmentItem = API.AppointmentItem;
type LocationItem = API.LocationItem;

const useStyles = createStyles(({ token }) => ({
  calendarContainer: {
    padding: 24,
    background: token.colorBgContainer,
    borderRadius: token.borderRadius,
    '.fc': {
      '--fc-border-color': token.colorBorderSecondary,
      '--fc-button-bg-color': token.colorPrimary,
      '--fc-button-border-color': token.colorPrimary,
      '--fc-button-hover-bg-color': token.colorPrimaryHover,
      '--fc-button-hover-border-color': token.colorPrimaryHover,
      '--fc-button-active-bg-color': token.colorPrimaryActive,
      '--fc-button-active-border-color': token.colorPrimaryActive,
      '--fc-today-bg-color': token.colorPrimaryBg,
      '--fc-neutral-bg-color': token.colorBgLayout,
      '--fc-page-bg-color': token.colorBgContainer,
      '--fc-highlight-color': token.colorPrimaryBg,
    },
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 500,
  },
  filterBar: {
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}));

const stateColors: Record<string, string> = {
  BOOKED: '#1677ff',
  CONFIRMED: '#52c41a',
  ARRIVED: '#faad14',
  ACTIVE: '#722ed1',
  FINAL: '#8c8c8c',
  CANCELLED: '#ff4d4f',
};

const AppointmentCalendar: React.FC = () => {
  const { styles } = useStyles();
  const calendarRef = useRef<FullCalendar>(null);

  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [locationList, setLocationList] = useState<LocationItem[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [events, setEvents] = useState<any[]>([]);
  const [currentStart, setCurrentStart] = useState<string | null>(null);
  const [currentEnd, setCurrentEnd] = useState<string | null>(null);
  const [calendarReady, setCalendarReady] = useState(false);

  const currentTimezone: string | undefined = locationList[0]?.tz || undefined;

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStaffList = async () => {
    try {
      const response = await getStaff({ limit: 100 });
      setStaffList(response.data.filter((s: StaffItem) => s.active));
    } catch {
      message.error('获取员工列表失败');
    }
  };

  const fetchLocationList = async () => {
    try {
      const response = await getLocations({ limit: 100 });
      setLocationList(response.data || []);
    } catch {
      message.error('获取门店列表失败');
    }
  };

  const getStaffName = (staffId: string | null | undefined): string => {
    if (!staffId) return '未分配';
    const staff = staffList.find((s) => s.id === staffId);
    return (
      staff?.displayName ||
      staff?.name ||
      `${staff?.firstName || ''} ${staff?.lastName || ''}`.trim() ||
      '未知'
    );
  };

  const fetchAppointments = async (start: string, end: string) => {
    try {
      const response = await getAppointmentsByDateRange({
        startDate: start,
        endDate: end,
        locationId: selectedLocationId || undefined,
      });
      const calendarEvents: any[] = [];
      (response.data || []).forEach((apt: AppointmentItem) => {
        const clientName =
          apt.client?.name ||
          `${(apt.client as any)?.firstName || ''} ${(apt.client as any)?.lastName || ''}`.trim() ||
          '未知客户';
        const state = apt.state || 'BOOKED';
        const bg = apt.cancelled ? '#ff4d4f' : stateColors[state] || '#1677ff';
        const startUtc = apt.startAt.endsWith('Z')
          ? apt.startAt
          : `${apt.startAt}Z`;
        const endUtc = apt.endAt?.endsWith('Z')
          ? apt.endAt
          : apt.endAt
            ? `${apt.endAt}Z`
            : null;
        const startLocal = dayjs(startUtc)
          .tz(currentTimezone)
          .format('YYYY-MM-DDTHH:mm:ss');
        const endLocal = endUtc
          ? dayjs(endUtc).tz(currentTimezone).format('YYYY-MM-DDTHH:mm:ss')
          : null;
        const services = (apt.appointmentServices as any[]) || [];

        if (services.length === 0) {
          calendarEvents.push({
            id: apt.id,
            title: clientName,
            start: startLocal,
            end: endLocal,
            backgroundColor: bg,
            borderColor: bg,
            resourceId: null,
            extendedProps: { appointment: apt, clientName },
          });
        } else {
          services.forEach((svc: any, idx: number) => {
            calendarEvents.push({
              id: `${apt.id}_svc_${idx}`,
              title: `${clientName} - ${svc.name || '服务'}`,
              start: startLocal,
              end: endLocal,
              backgroundColor: bg,
              borderColor: bg,
              resourceId: svc.staffId || null,
              extendedProps: {
                appointment: apt,
                clientName,
                serviceName: svc.name || '服务',
              },
            });
          });
        }
      });
      setEvents(calendarEvents);
    } catch {
      message.error('获取预约数据失败');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStaffList(), fetchLocationList()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (locationList.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locationList[0].id);
    }
    if (currentTimezone) setCalendarReady(true);
  }, [locationList, currentTimezone]);

  useEffect(() => {
    if (currentStart && currentEnd && staffList.length > 0) {
      setLoading(true);
      fetchAppointments(currentStart, currentEnd).finally(() =>
        setLoading(false),
      );
    }
  }, [selectedLocationId, staffList.length]);

  const handleDatesSet = useCallback(
    async (arg: DatesSetArg) => {
      const { startStr, endStr } = arg;
      if (startStr !== currentStart || endStr !== currentEnd) {
        setCurrentStart(startStr);
        setCurrentEnd(endStr);
        setLoading(true);
        await fetchAppointments(startStr, endStr);
        setLoading(false);
      }
    },
    [currentStart, currentEnd, staffList],
  );

  const handleEventClick = (arg: EventClickArg) => {
    setSelectedAppointment(
      arg.event.extendedProps.appointment as AppointmentItem,
    );
    setDetailModalOpen(true);
  };

  const handleStateChange = async (id: string, state: string) => {
    setActionLoading(true);
    try {
      await updateAppointmentState(id, state as any);
      message.success('状态更新成功');
      setDetailModalOpen(false);
      if (currentStart && currentEnd)
        fetchAppointments(currentStart, currentEnd);
    } catch (error: any) {
      message.error(`状态更新失败: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(true);
    try {
      await cancelAppointment(id, {
        reason: 'STAFF_CANCEL',
        notifyClient: true,
        notes: '',
      });
      message.success('预约已取消');
      setDetailModalOpen(false);
      if (currentStart && currentEnd)
        fetchAppointments(currentStart, currentEnd);
    } catch (error: any) {
      message.error(`取消失败: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getNextState = (
    state?: string,
  ): { state: string; label: string } | null => {
    switch (state) {
      case 'BOOKED':
        return { state: 'CONFIRMED', label: '确认' };
      case 'CONFIRM':
        return { state: 'ARRIVED', label: '已到达' };
      case 'ARRIVED':
        return { state: 'ACTIVE', label: '开始服务' };
      case 'ACTIVE':
        return { state: 'FINAL', label: '完成结账' };
      default:
        return null;
    }
  };

  const calendarResources = useMemo(
    () =>
      staffList.map((s) => ({
        id: s.id,
        title:
          s.displayName ||
          s.name ||
          `${s.firstName || ''} ${s.lastName || ''}`.trim() ||
          s.email,
      })),
    [staffList],
  );

  const apt = selectedAppointment;
  const next = apt ? getNextState(apt.state) : null;
  const canAct = apt && !apt.cancelled && apt.state !== 'FINAL';

  return (
    <PageContainer title="预约日历">
      <div className={styles.filterBar}>
        <Space>
          <Button onClick={() => calendarRef.current?.getApi().today()}>
            今天
          </Button>
          <DatePicker
            placeholder="选择日期"
            onChange={(d) =>
              d && calendarRef.current?.getApi().gotoDate(d.toDate())
            }
            format="YYYY-MM-DD"
          />
        </Space>
        <Space>
          {currentTimezone && <Tag color="blue">{currentTimezone}</Tag>}
          {locationList.length > 1 && (
            <>
              <span>门店:</span>
              <Select
                style={{ width: 180 }}
                value={selectedLocationId}
                onChange={setSelectedLocationId}
                options={locationList.map((loc) => ({
                  value: loc.id,
                  label: loc.name || loc.id,
                }))}
              />
            </>
          )}
        </Space>
      </div>

      <div className={styles.calendarContainer}>
        {calendarReady && currentTimezone && (
          <FullCalendar
            ref={calendarRef}
            plugins={[
              resourceTimeGridPlugin,
              timeGridPlugin,
              dayGridPlugin,
              interactionPlugin,
            ]}
            initialView="resourceTimeGridWeek"
            resources={calendarResources}
            datesAboveResources
            headerToolbar={{
              left: 'prev,next',
              center: 'title',
              right: 'resourceTimeGridDay,resourceTimeGridWeek,dayGridMonth',
            }}
            events={events}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            selectable
            timeZone="local"
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            allDaySlot={false}
            height="auto"
            eventContent={(arg) => {
              const { clientName, serviceName } = arg.event.extendedProps;
              return (
                <div
                  style={{
                    padding: '2px 4px',
                    fontSize: '12px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {clientName}
                  </div>
                  <div
                    style={{ fontSize: '11px', opacity: 0.9, color: '#fff' }}
                  >
                    {serviceName}
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>

      <Modal
        title={
          <Space>
            预约详情
            {apt && (
              <AppointmentStateBadge
                state={apt.state}
                cancelled={apt.cancelled}
              />
            )}
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
          ...(canAct && next
            ? [
                <Button
                  key="state"
                  type="primary"
                  loading={actionLoading}
                  onClick={() => handleStateChange(apt!.id, next.state)}
                >
                  {next.label}
                </Button>,
              ]
            : []),
          ...(canAct
            ? [
                <Button
                  key="cancel"
                  danger
                  loading={actionLoading}
                  onClick={() => handleCancel(apt!.id)}
                >
                  取消预约
                </Button>,
              ]
            : []),
        ]}
      >
        {apt && (
          <>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="客户">
                {apt.client?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="门店">
                {(apt.location as any)?.name || apt.locationId || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="开始">
                {dayjs(apt.startAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="时长">
                {apt.duration ? `${Math.round(apt.duration / 60)} min` : '-'}
              </Descriptions.Item>
            </Descriptions>
            {(apt.appointmentServices as any[])?.length > 0 && (
              <>
                <div style={{ marginTop: 8, fontWeight: 500 }}>服务</div>
                {(apt.appointmentServices as any[]).map(
                  (svc: any, i: number) => (
                    <div
                      key={svc.serviceId || i}
                      style={{
                        padding: '4px 0',
                        borderBottom: '1px solid #f0f0f0',
                      }}
                    >
                      {svc.name || svc.serviceName || '-'} |{' '}
                      {svc.duration ? `${svc.duration} min` : '-'}
                      {svc.price
                        ? ` | $${(svc.price.amount / 100).toFixed(2)}`
                        : ''}
                    </div>
                  ),
                )}
              </>
            )}
            {apt.notes && (
              <div style={{ marginTop: 8 }}>
                <strong>备注:</strong> {apt.notes}
              </div>
            )}
          </>
        )}
      </Modal>
    </PageContainer>
  );
};

export default AppointmentCalendar;
