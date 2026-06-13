import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  TimePicker,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect } from 'react';

const DAY_OPTIONS = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
];

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
];

interface ShiftCreateModalProps {
  open: boolean;
  staffList: API.StaffItem[];
  locations: API.LocationItem[];
  defaultLocationId?: string;
  prefill?: { staffId?: string; day?: number } | null;
  onCancel: () => void;
  onOk: (values: any) => void;
  loading?: boolean;
}

const ShiftCreateModal: React.FC<ShiftCreateModalProps> = ({
  open,
  staffList,
  locations,
  defaultLocationId,
  prefill,
  onCancel,
  onOk,
  loading,
}) => {
  const [form] = Form.useForm();
  const available = Form.useWatch('available', form) ?? true;

  useEffect(() => {
    if (open) {
      const initialValues: any = {
        available: true,
        locationId: defaultLocationId || undefined,
        staffId: prefill?.staffId || undefined,
        day: prefill?.day ?? undefined,
      };
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [open, prefill, defaultLocationId]);

  const handleFinish = (values: any) => {
    const payload = {
      ...values,
      clockIn: values.clockIn
        ? dayjs(values.clockIn).format('HH:mm:ss')
        : undefined,
      clockOut: values.clockOut
        ? dayjs(values.clockOut).format('HH:mm:ss')
        : undefined,
      recurrenceStart: values.recurrenceStart
        ? dayjs(values.recurrenceStart).format('YYYY-MM-DD')
        : undefined,
      recurrenceEnd: values.recurrenceEnd
        ? dayjs(values.recurrenceEnd).format('YYYY-MM-DD')
        : undefined,
    };
    onOk(payload);
  };

  return (
    <Modal
      title="新建排班"
      open={open}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={() => form.submit()}
      okText="创建"
      width={560}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="staffId"
          label="员工"
          rules={[{ required: true, message: '请选择员工' }]}
        >
          <Select
            placeholder="选择员工"
            showSearch
            optionFilterProp="label"
            options={staffList.map((s) => ({
              value: s.id,
              label: s.displayName || s.name || s.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="locationId"
          label="门店"
          rules={[{ required: true, message: '请选择门店' }]}
        >
          <Select
            placeholder="选择门店"
            options={locations.map((l) => ({
              value: l.id,
              label: l.name || l.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="day"
          label="星期"
          rules={[{ required: true, message: '请选择星期' }]}
        >
          <Select placeholder="选择星期" options={DAY_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="clockIn"
          label="上班时间"
          rules={[{ required: true, message: '请选择上班时间' }]}
        >
          <TimePicker format="HH:mm" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="clockOut"
          label="下班时间"
          rules={[{ required: true, message: '请选择下班时间' }]}
        >
          <TimePicker format="HH:mm" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="available" label="可用" valuePropName="checked">
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>

        {!available && (
          <Form.Item name="unavailableReason" label="不可用原因">
            <Input.TextArea rows={2} placeholder="请输入不可用原因" />
          </Form.Item>
        )}

        <Form.Item name="bookingInterval" label="预约间隔(分钟)">
          <InputNumber min={1} style={{ width: '100%' }} placeholder="可选" />
        </Form.Item>

        <Form.Item name="recurrence" label="重复">
          <Select
            placeholder="选择重复方式"
            allowClear
            options={RECURRENCE_OPTIONS}
          />
        </Form.Item>

        <Form.Item name="recurrenceInterval" label="重复间隔">
          <InputNumber min={1} style={{ width: '100%' }} placeholder="可选" />
        </Form.Item>

        <Form.Item name="recurrenceStart" label="重复开始日期">
          <DatePicker style={{ width: '100%' }} placeholder="选择开始日期" />
        </Form.Item>

        <Form.Item name="recurrenceEnd" label="重复结束日期">
          <DatePicker style={{ width: '100%' }} placeholder="选择结束日期" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ShiftCreateModal;
