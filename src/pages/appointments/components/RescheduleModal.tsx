import { Modal, message, Select, Spin } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import {
  getRescheduleAvailableDates,
  getRescheduleAvailableTimes,
} from '@/services/ant-design-pro/api';

interface RescheduleModalProps {
  open: boolean;
  appointmentId: string | null;
  onCancel: () => void;
  onOk: (startAt: string) => void;
  loading?: boolean;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  open,
  appointmentId,
  onCancel,
  onOk,
  loading,
}) => {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<API.StaffAvailability[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [fetchingDates, setFetchingDates] = useState(false);
  const [fetchingTimes, setFetchingTimes] = useState(false);

  useEffect(() => {
    if (open && appointmentId) {
      setFetchingDates(true);
      setSelectedDate(null);
      setSelectedTime(null);
      setTimeSlots([]);
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

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
    if (!appointmentId) return;
    setFetchingTimes(true);
    getRescheduleAvailableTimes(appointmentId, { date })
      .then((slots) => setTimeSlots(slots || []))
      .catch(() => message.error('获取可用时间失败'))
      .finally(() => setFetchingTimes(false));
  };

  const timeOptions: { value: string; label: string }[] = [];
  const seen = new Set<string>();
  (timeSlots || []).forEach((staff) => {
    (staff.availableSlots || []).forEach((slot) => {
      const time = dayjs(slot.startAt).format('HH:mm');
      if (!seen.has(time)) {
        seen.add(time);
        timeOptions.push({
          value: slot.startAt,
          label: `${time} - ${staff.staffName}`,
        });
      }
    });
  });

  const dateOptions = availableDates.map((d) => ({
    value: d,
    label: dayjs(d).format('YYYY-MM-DD (ddd)'),
  }));

  return (
    <Modal
      title="改期预约"
      open={open}
      onCancel={onCancel}
      onOk={() => selectedTime && onOk(selectedTime)}
      okButtonProps={{ disabled: !selectedTime }}
      confirmLoading={loading}
      okText="确认改期"
    >
      <Spin spinning={fetchingDates}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>选择日期</div>
          <Select
            style={{ width: '100%' }}
            placeholder="选择可用日期"
            options={dateOptions}
            value={selectedDate}
            onChange={handleDateSelect}
          />
        </div>
      </Spin>
      {selectedDate && (
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
    </Modal>
  );
};

export default RescheduleModal;
