import { Form, Modal, Select } from 'antd';
import React from 'react';

interface StaffLocationModalProps {
  open: boolean;
  locations: API.LocationItem[];
  onCancel: () => void;
  onOk: (values: { locationId: string; active: boolean }) => void;
  loading?: boolean;
}

const StaffLocationModal: React.FC<StaffLocationModalProps> = ({
  open,
  locations,
  onCancel,
  onOk,
  loading,
}) => {
  const [form] = Form.useForm();

  return (
    <Modal
      title="分配门店"
      open={open}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={() => form.submit()}
      okText="确认"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onOk}
        initialValues={{ active: true }}
      >
        <Form.Item name="locationId" label="门店" rules={[{ required: true }]}>
          <Select
            placeholder="选择门店"
            options={locations.map((l) => ({
              value: l.id,
              label: l.name || l.id,
            }))}
          />
        </Form.Item>
        <Form.Item name="active" label="操作">
          <Select
            options={[
              { value: true, label: '分配到门店' },
              { value: false, label: '从门店移除' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StaffLocationModal;
