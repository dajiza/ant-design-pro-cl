import { Modal, message, Radio, Select, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

dayjs.extend(utc);
dayjs.extend(timezone);

import {
  getRescheduleAvailableDates,
  getRescheduleAvailableTimes,
} from '@/services/ant-design-pro/api';

interface RescheduleServiceItem {
  serviceId: string;
  serviceName?: string;
  staffId?: string;
  startAt: string;
}

export interface RescheduleResult {
  startAt?: string;
  services?: { serviceId: string; startAt: string; staffId?: string }[];
}

interface RescheduleModalProps {
  open: boolean;
  appointmentId: string | null;
  appointmentServices?: RescheduleServiceItem[];
  employeeId?: string | null;
  locationTz?: string;
  onCancel: () => void;
  onOk: (result: RescheduleResult) => void;
  loading?: boolean;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  open,
  appointmentId,
  appointmentServices = [],
  employeeId,
  locationTz = 'UTC',
  onCancel,
  onOk,
  loading,
}) => {
  const isMultiService = appointmentServices.length > 1;
  const [mode, setMode] = useState<'whole' | 'per-service'>('whole');

  // shared state
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<API.StaffAvailability[]>([]);
  const [fetchingDates, setFetchingDates] = useState(false);
  const [fetchingTimes, setFetchingTimes] = useState(false);

  // whole mode
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // per-service mode
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const [serviceTimeMap, setServiceTimeMap] = useState<Record<string, string>>(
    {},
  );

  // reset on open
  useEffect(() => {
    if (open && appointmentId) {
      setMode('whole');
      setSelectedDate(null);
      setSelectedTime(null);
      setTimeSlots([]);
      setServiceTimeMap({});
      setActiveServiceIndex(0);
      setFetchingDates(true);
      const today = dayjs().format('YYYY-MM-DD');
      const upper = dayjs().add(30, 'day').format('YYYY-MM-DD');
      getRescheduleAvailableDates(appointmentId, {
        searchRangeLower: today,
        searchRangeUpper: upper,
      })
        .then((dates) => setAvailableDates(dates || []))
        .catch(() => message.error('获取可用日期失败'))
        .finally(() => setFetchingDates(false));
    }
  }, [open, appointmentId]);

  const fetchTimes = useCallback(
    async (date: string) => {
      if (!appointmentId) return;
      setFetchingTimes(true);
      setTimeSlots([]);
      try {
        const slots = await getRescheduleAvailableTimes(appointmentId, {
          date,
        });
        setTimeSlots(slots || []);
      } catch {
        message.error('获取可用时间失败');
      } finally {
        setFetchingTimes(false);
      }
    },
    [appointmentId],
  );

  const timeOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const seen = new Set<string>();
    (timeSlots || []).forEach((staff) => {
      (staff.availableSlots || []).forEach((slot) => {
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
  }, [timeSlots, locationTz]);

  const dateOptions = availableDates.map((d) => ({
    value: d,
    label: dayjs(d).format('YYYY-MM-DD (ddd)'),
  }));

  // whole mode: date select
  const handleWholeDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    fetchTimes(date);
  };

  // per-service: date select resets all service times
  const handlePerServiceDateSelect = (date: string) => {
    setSelectedDate(date);
    setServiceTimeMap({});
    setActiveServiceIndex(0);
    fetchTimes(date);
  };

  // per-service: select time for active service
  const handlePerServiceTimeSelect = (time: string) => {
    const svc = appointmentServices[activeServiceIndex];
    if (!svc) return;
    const updated = { ...serviceTimeMap, [svc.serviceId]: time };
    setServiceTimeMap(updated);
    // auto advance to next service
    const nextIndex = activeServiceIndex + 1;
    if (nextIndex < appointmentServices.length) {
      setActiveServiceIndex(nextIndex);
    }
  };

  // per-service: re-select a previously completed service
  const handleReselectService = (index: number) => {
    const cleared = { ...serviceTimeMap };
    for (let i = index; i < appointmentServices.length; i++) {
      delete cleared[appointmentServices[i].serviceId];
    }
    setServiceTimeMap(cleared);
    setActiveServiceIndex(index);
  };

  const allServicesHaveTime = appointmentServices.every(
    (s) => serviceTimeMap[s.serviceId],
  );

  const handleOk = () => {
    if (mode === 'whole' && selectedTime) {
      onOk({ startAt: selectedTime });
    } else if (mode === 'per-service' && allServicesHaveTime) {
      onOk({
        services: appointmentServices.map((svc) => ({
          serviceId: svc.serviceId,
          startAt: serviceTimeMap[svc.serviceId],
          ...(svc.staffId ? { staffId: svc.staffId } : {}),
        })),
      });
    }
  };

  const canSubmit = mode === 'whole' ? !!selectedTime : allServicesHaveTime;

  return (
    <Modal
      title="改期预约"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okButtonProps={{ disabled: !canSubmit }}
      confirmLoading={loading}
      okText="确认改期"
    >
      {/* mode selector for multi-service */}
      {isMultiService && (
        <div style={{ marginBottom: 16 }}>
          <Radio.Group
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setSelectedTime(null);
              setServiceTimeMap({});
              setActiveServiceIndex(0);
            }}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="whole">整体改期</Radio.Button>
            <Radio.Button value="per-service">逐个服务改期</Radio.Button>
          </Radio.Group>
          <div style={{ marginTop: 4, color: '#888', fontSize: 12 }}>
            {mode === 'whole'
              ? '所有服务一起移动到新时间'
              : '为每个服务分别设置新的开始时间'}
          </div>
        </div>
      )}

      {/* date selector */}
      <Spin spinning={fetchingDates}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>选择日期</div>
          <Select
            style={{ width: '100%' }}
            placeholder="选择可用日期"
            options={dateOptions}
            value={selectedDate}
            onChange={
              mode === 'per-service'
                ? handlePerServiceDateSelect
                : handleWholeDateSelect
            }
          />
        </div>
      </Spin>

      {/* whole mode: single time selector */}
      {selectedDate && mode === 'whole' && (
        <Spin spinning={fetchingTimes}>
          <div>
            <div style={{ marginBottom: 8 }}>选择时间</div>
            <Select
              style={{ width: '100%' }}
              placeholder="选择可用时间"
              options={timeOptions}
              value={selectedTime}
              onChange={setSelectedTime}
            />
          </div>
        </Spin>
      )}

      {/* per-service mode: sequential time selection */}
      {selectedDate && mode === 'per-service' && (
        <>
          {appointmentServices.map((svc, index) => {
            const isCompleted = !!serviceTimeMap[svc.serviceId];
            const isActive = index === activeServiceIndex && !isCompleted;
            const isPending = index > activeServiceIndex;

            return (
              <div
                key={svc.serviceId}
                style={{
                  marginBottom: 12,
                  padding: 12,
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
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>
                    {index + 1}/{appointmentServices.length}{' '}
                    {svc.serviceName || svc.serviceId}
                  </span>
                  {isCompleted && (
                    <span>
                      <Tag color="green">
                        {dayjs(serviceTimeMap[svc.serviceId])
                          .tz(locationTz)
                          .format('HH:mm')}
                      </Tag>
                      <a
                        onClick={() => handleReselectService(index)}
                        style={{ fontSize: 12 }}
                      >
                        重选
                      </a>
                    </span>
                  )}
                  {isPending && <Tag>待选择</Tag>}
                </div>

                {isActive && (
                  <Spin spinning={fetchingTimes}>
                    <div style={{ marginTop: 8 }}>
                      <Select
                        style={{ width: '100%' }}
                        placeholder="选择可用时间"
                        options={timeOptions}
                        value={undefined}
                        onChange={handlePerServiceTimeSelect}
                      />
                    </div>
                  </Spin>
                )}
              </div>
            );
          })}
        </>
      )}
    </Modal>
  );
};

export default RescheduleModal;
