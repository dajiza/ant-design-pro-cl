import { DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

interface TimeblockCreateModalProps {
  open: boolean;
  staffList: API.StaffItem[];
  locations: API.LocationItem[];
  onCancel: () => void;
  onOk: (values: any) => void;
  loading?: boolean;
}

const TimeblockCreateModal: React.FC<TimeblockCreateModalProps> = ({
  open,
  staffList,
  locations,
  onCancel,
  onOk,
  loading,
}) => {
  const [form] = Form.useForm();
  const [showRecurring, setShowRecurring] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setShowRecurring(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload: any = {
        staffId: values.staffId,
        locationId: values.locationId,
        startTime: values.startTime.toISOString(),
        duration: values.duration, // 单位：分钟
        title: values.title || undefined,
        reason: values.reason || undefined,
      };

      if (showRecurring && values.frequency) {
        const recurring: any = {
          frequency: values.frequency,
          interval: values.interval || 1,
        };
        if (values.endAfterCount) {
          recurring.endAfter = { count: values.endAfterCount };
        } else if (values.endAfterDatetime) {
          recurring.endAfter = {
            datetime: values.endAfterDatetime.toISOString(),
          };
        }
        payload.recurring = recurring;
      }

      onOk(payload);
    } catch {
      // form validation failed, ignore
    }
  };

  return (
    <Modal
      title="新建时间块"
      open={open}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={handleSubmit}
      okText="创建"
    >
      <Form form={form} layout="vertical">
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
              label:
                s.displayName ||
                [s.firstName, s.lastName].filter(Boolean).join(' ') ||
                s.id,
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
          name="startTime"
          label="开始时间"
          rules={[{ required: true, message: '请选择开始时间' }]}
        >
          <DatePicker
            showTime
            style={{ width: '100%' }}
            format="YYYY-MM-DD HH:mm"
          />
        </Form.Item>
        <Form.Item
          name="duration"
          label="时长（分钟）"
          rules={[{ required: true, message: '请输入时长' }]}
        >
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            placeholder="输入分钟数"
          />
        </Form.Item>
        <Form.Item name="title" label="标题">
          <Input placeholder="可选" />
        </Form.Item>
        <Form.Item name="reason" label="原因">
          <Select
            placeholder="可选"
            allowClear
            options={[
              { value: 'BUSINESS', label: '商务' },
              { value: 'PERSONAL', label: '个人' },
            ]}
          />
        </Form.Item>

        <Form.Item>
          <a onClick={() => setShowRecurring(!showRecurring)}>
            {showRecurring ? '收起重复设置' : '展开重复设置'}
          </a>
        </Form.Item>

        {showRecurring && (
          <>
            <Form.Item name="frequency" label="重复频率">
              <Select
                placeholder="选择频率"
                allowClear
                options={[
                  { value: 'WEEKLY', label: '每周' },
                  { value: 'MONTHLY', label: '每月' },
                  { value: 'YEARLY', label: '每年' },
                ]}
              />
            </Form.Item>
            <Form.Item name="interval" label="间隔" initialValue={1}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endAfterCount" label="重复次数">
              <InputNumber
                min={1}
                style={{ width: '100%' }}
                placeholder="次数"
              />
            </Form.Item>
            <Form.Item name="endAfterDatetime" label="结束时间">
              <DatePicker
                showTime
                style={{ width: '100%' }}
                format="YYYY-MM-DD HH:mm"
                placeholder="选择结束时间"
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default TimeblockCreateModal;
