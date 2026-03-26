import { useIntl } from '@umijs/max';
import { Form, Input, Modal, Select } from 'antd';
import React, { useEffect } from 'react';

interface RoomFormProps {
  visible: boolean;
  initialValues?: API.RoomItem | null;
  services: API.ServiceItem[];
  submitting: boolean;
  onSubmit: (values: { name: string; serviceId?: string | null }) => void;
  onCancel: () => void;
}

const RoomForm: React.FC<RoomFormProps> = ({
  visible,
  initialValues,
  services,
  submitting,
  onSubmit,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue({
          name: initialValues.name,
          serviceId: initialValues.serviceId,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialValues, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
  };

  return (
    <Modal
      title={
        initialValues
          ? intl.formatMessage({
              id: 'pages.room.editRoom',
              defaultMessage: 'Edit Room',
            })
          : intl.formatMessage({
              id: 'pages.room.addRoom',
              defaultMessage: 'Add Room',
            })
      }
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={intl.formatMessage({
            id: 'pages.room.name',
            defaultMessage: 'Room Name',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'pages.room.nameRequired',
                defaultMessage: 'Please enter room name',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.room.namePlaceholder',
              defaultMessage: 'Enter room name',
            })}
          />
        </Form.Item>

        <Form.Item
          name="serviceId"
          label={intl.formatMessage({
            id: 'pages.room.service',
            defaultMessage: 'Service',
          })}
        >
          <Select
            allowClear
            showSearch
            placeholder={intl.formatMessage({
              id: 'pages.room.servicePlaceholder',
              defaultMessage: 'Select service',
            })}
            filterOption={(input, option) =>
              (option?.label as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
            options={services.map((s) => ({
              value: s.id,
              label: s.name,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoomForm;
