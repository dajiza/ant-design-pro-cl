import { Form, Input, Modal, Select, Switch } from 'antd';
import React, { useEffect } from 'react';

interface ServiceFormModalProps {
  open: boolean;
  service?: API.ServiceItem | null;
  categories: API.ServiceCategoryItem[];
  onCancel: () => void;
  onOk: (values: any) => void;
  loading?: boolean;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  open,
  service,
  categories,
  onCancel,
  onOk,
  loading,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!service;

  useEffect(() => {
    if (open && service) {
      form.setFieldsValue({
        name: service.name,
        categoryId: service.categoryId,
        addon: service.addon,
        description: service.description,
        externalId: service.externalId,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, service]);

  return (
    <Modal
      title={isEdit ? '编辑服务' : '新建服务'}
      open={open}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={() => form.submit()}
      okText={isEdit ? '保存' : '创建'}
    >
      <Form form={form} layout="vertical" onFinish={onOk}>
        <Form.Item name="name" label="服务名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="categoryId"
          label="服务分类"
          rules={[{ required: true }]}
        >
          <Select
            placeholder="选择分类"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Form.Item>
        <Form.Item name="addon" label="附加服务" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="externalId" label="外部ID">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ServiceFormModal;
