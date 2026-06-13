import { ColorPicker, Form, Input, Modal, Select } from 'antd';
import React, { useEffect } from 'react';

interface StaffFormModalProps {
  open: boolean;
  staff?: API.StaffItem | null;
  roles: API.StaffRoleItem[];
  onCancel: () => void;
  onOk: (values: any) => void;
  loading?: boolean;
}

const StaffFormModal: React.FC<StaffFormModalProps> = ({
  open,
  staff,
  roles,
  onCancel,
  onOk,
  loading,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!staff;

  useEffect(() => {
    if (open && staff) {
      form.setFieldsValue({
        firstName: staff.firstName,
        lastName: staff.lastName,
        nickname: staff.nickname,
        email: staff.email,
        mobilePhone: staff.mobilePhone,
        bio: staff.bio,
        roleId: staff.staffRoleId,
        externalNickname: staff.externalNickname,
        hexColor: staff.hexColor,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, staff]);

  return (
    <Modal
      title={isEdit ? '编辑员工' : '新建员工'}
      open={open}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={() => form.submit()}
      okText={isEdit ? '保存' : '创建'}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          const { hexColor, ...rest } = values;
          onOk({
            ...rest,
            hexColor: hexColor?.toHexString?.() ?? hexColor,
          });
        }}
      >
        <Form.Item name="firstName" label="名" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="lastName" label="姓">
          <Input />
        </Form.Item>
        <Form.Item name="nickname" label="昵称">
          <Input />
        </Form.Item>
        <Form.Item name="email" label="邮箱" rules={[{ type: 'email' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="mobilePhone" label="手机">
          <Input />
        </Form.Item>
        <Form.Item name="bio" label="简介">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="roleId" label="角色" rules={[{ required: true }]}>
          <Select
            placeholder="选择角色"
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
          />
        </Form.Item>
        <Form.Item name="hexColor" label="标识颜色">
          <ColorPicker format="hex" showText />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StaffFormModal;
