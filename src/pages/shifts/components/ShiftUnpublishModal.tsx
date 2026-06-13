import { Form, Input, Modal, Select } from 'antd';
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

interface ShiftUnpublishModalProps {
  open: boolean;
  staffList: API.StaffItem[];
  locations: API.LocationItem[];
  defaultLocationId?: string;
  onCancel: () => void;
  onOk: (values: any) => void;
  loading?: boolean;
}

const ShiftUnpublishModal: React.FC<ShiftUnpublishModalProps> = ({
  open,
  staffList,
  locations,
  defaultLocationId,
  onCancel,
  onOk,
  loading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        locationId: defaultLocationId || undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, defaultLocationId]);

  return (
    <Modal
      title="取消发布排班"
      open={open}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={() => form.submit()}
      okText="确认取消发布"
      width={480}
    >
      <Form form={form} layout="vertical" onFinish={onOk}>
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
          name="startIso8601"
          label="开始时间"
          rules={[{ required: true, message: '请输入开始时间' }]}
        >
          <Input placeholder="例如 09:00:00" />
        </Form.Item>

        <Form.Item name="endIso8601" label="结束时间(可选)">
          <Input placeholder="例如 17:00:00" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ShiftUnpublishModal;
