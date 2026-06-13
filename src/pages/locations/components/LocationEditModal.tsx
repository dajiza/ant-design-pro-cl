import { Form, Input, InputNumber, Modal } from 'antd';
import React, { useEffect } from 'react';

interface LocationEditModalProps {
  open: boolean;
  location: API.LocationItem | null;
  onCancel: () => void;
  onOk: (values: API.UpdateLocationParams) => void;
  loading?: boolean;
}

const LocationEditModal: React.FC<LocationEditModalProps> = ({
  open,
  location,
  onCancel,
  onOk,
  loading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && location) {
      form.setFieldsValue({
        latitude: location.coordinates?.lat ?? undefined,
        longitude: location.coordinates?.lng ?? undefined,
        externalId: location.externalId ?? undefined,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, location]);

  const handleSubmit = (values: any) => {
    const params: API.UpdateLocationParams = {};
    if (values.latitude !== undefined || values.longitude !== undefined) {
      params.coordinates = {
        latitude: values.latitude ?? 0,
        longitude: values.longitude ?? 0,
      };
    }
    if (values.externalId !== undefined) {
      params.externalId = values.externalId;
    }
    onOk(params);
  };

  return (
    <Modal
      title="编辑门店信息"
      open={open}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={() => form.submit()}
      okText="保存"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="latitude" label="纬度">
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="longitude" label="经度">
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="externalId" label="外部ID">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LocationEditModal;
