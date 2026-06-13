import { Form, Modal, Select } from 'antd';
import React, { useEffect } from 'react';

interface ServiceActivateModalProps {
  open: boolean;
  mode: 'activate' | 'deactivate';
  locations: API.LocationItem[];
  onCancel: () => void;
  onOk: (values: { locationId: string }) => void;
  loading?: boolean;
}

const ServiceActivateModal: React.FC<ServiceActivateModalProps> = ({
  open,
  mode,
  locations,
  onCancel,
  onOk,
  loading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open]);

  return (
    <Modal
      title={mode === 'activate' ? '激活服务' : '停用服务'}
      open={open}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={() => form.submit()}
      okText={mode === 'activate' ? '激活' : '停用'}
    >
      <Form form={form} layout="vertical" onFinish={onOk}>
        <Form.Item
          name="locationId"
          label="选择门店"
          rules={[{ required: true }]}
        >
          <Select
            placeholder="选择门店"
            options={locations.map((l) => ({ value: l.id, label: l.name }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ServiceActivateModal;
