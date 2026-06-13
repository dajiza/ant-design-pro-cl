import { Form, Input, Modal } from 'antd';
import React, { useEffect } from 'react';

interface ClientFormProps {
  visible: boolean;
  initialValues: API.ClientItem | null;
  submitting: boolean;
  onSubmit: (values: API.CreateClientParams | API.UpdateClientParams) => void;
  onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({
  visible,
  initialValues,
  submitting,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue({
          firstName: initialValues.firstName || '',
          lastName: initialValues.lastName || '',
          email: initialValues.email || '',
          mobilePhone: initialValues.mobilePhone || '',
          dob: initialValues.dob || undefined,
          pronoun: initialValues.pronoun || '',
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // convert dob to string if present
      if (values.dob) {
        values.dob = values.dob.format
          ? values.dob.format('YYYY-MM-DD')
          : values.dob;
      }
      onSubmit(values);
    } catch {
      // validation failed
    }
  };

  return (
    <Modal
      title={initialValues ? '编辑客户' : '新建客户'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="firstName" label="名">
          <Input />
        </Form.Item>
        <Form.Item name="lastName" label="姓">
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="邮箱"
          rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="mobilePhone" label="电话">
          <Input />
        </Form.Item>
        <Form.Item name="pronoun" label="代词">
          <Input placeholder="如: he/him, she/her, they/them" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ClientForm;
