import { Form, Modal, Switch, TimePicker } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect } from 'react';

const DAY_ORDER = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DAY_LABELS: Record<string, string> = {
  MONDAY: '周一',
  TUESDAY: '周二',
  WEDNESDAY: '周三',
  THURSDAY: '周四',
  FRIDAY: '周五',
  SATURDAY: '周六',
  SUNDAY: '周日',
};

interface LocationHoursModalProps {
  open: boolean;
  hours: API.LocationHoursInput[];
  onCancel: () => void;
  onOk: (hours: API.LocationHoursInput[]) => void;
  loading?: boolean;
}

const LocationHoursModal: React.FC<LocationHoursModalProps> = ({
  open,
  hours,
  onCancel,
  onOk,
  loading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      const values: any = {};
      DAY_ORDER.forEach((day) => {
        const entry = hours.find((h: any) => h.day === day);
        values[`${day}_open`] = entry?.open ?? false;
        values[`${day}_start`] = entry?.start
          ? dayjs().hour(entry.start.hour).minute(entry.start.min).second(0)
          : dayjs().hour(9).minute(0).second(0);
        values[`${day}_finish`] = entry?.finish
          ? dayjs().hour(entry.finish.hour).minute(entry.finish.min).second(0)
          : dayjs().hour(17).minute(0).second(0);
      });
      form.setFieldsValue(values);
    }
  }, [open, hours]);

  const handleSubmit = () => {
    form.validateFields().then((values: any) => {
      const result: API.LocationHoursInput[] = DAY_ORDER.map((day) => {
        const start: dayjs.Dayjs = values[`${day}_start`];
        const finish: dayjs.Dayjs = values[`${day}_finish`];
        return {
          open: values[`${day}_open`] ?? false,
          start: {
            hour: start.hour(),
            min: start.minute(),
          },
          finish: {
            hour: finish.hour(),
            min: finish.minute(),
          },
        };
      });
      onOk(result);
    });
  };

  return (
    <Modal
      title="编辑营业时间"
      open={open}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={handleSubmit}
      okText="保存"
      width={560}
    >
      <Form form={form} layout="vertical">
        {DAY_ORDER.map((day) => (
          <div
            key={day}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ width: 50, fontWeight: 500 }}>{DAY_LABELS[day]}</div>
            <Form.Item name={`${day}_open`} valuePropName="checked" noStyle>
              <Switch checkedChildren="营业" unCheckedChildren="休息" />
            </Form.Item>
            <Form.Item name={`${day}_start`} noStyle>
              <TimePicker format="HH:mm" allowClear={false} />
            </Form.Item>
            <span>~</span>
            <Form.Item name={`${day}_finish`} noStyle>
              <TimePicker format="HH:mm" allowClear={false} />
            </Form.Item>
          </div>
        ))}
      </Form>
    </Modal>
  );
};

export default LocationHoursModal;
