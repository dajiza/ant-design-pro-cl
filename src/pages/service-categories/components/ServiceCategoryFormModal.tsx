import { Form, Input, Modal } from 'antd';
import React, { useEffect } from 'react';

interface ServiceCategoryFormModalProps {
  open: boolean;
  category?: API.ServiceCategoryItem | null;
  onCancel: () => void;
  onOk: (values: any) => void;
  loading?: boolean;
}

const ServiceCategoryFormModal: React.FC<ServiceCategoryFormModalProps> = ({
  open,
  category,
  onCancel,
  onOk,
  loading,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!category;

  useEffect(() => {
    if (open && category) {
      form.setFieldsValue({
        name: category.name,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, category]);

  return (
    <Modal
      title={isEdit ? '编辑分类' : '新建分类'}
      open={open}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={() => form.submit()}
      okText={isEdit ? '保存' : '创建'}
    >
      <Form form={form} layout="vertical" onFinish={onOk}>
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入分类名称' }]}
        >
          <Input placeholder="请输入分类名称" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ServiceCategoryFormModal;
