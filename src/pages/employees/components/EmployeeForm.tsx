import { useIntl } from '@umijs/max';
import { Form, Input, Modal } from 'antd';
import React, { useEffect } from 'react';

interface EmployeeFormProps {
  visible: boolean;
  initialValues?: API.EmployeeItem | null;
  submitting: boolean;
  onSubmit: (
    values: API.CreateEmployeeParams | API.UpdateEmployeeParams,
  ) => void;
  onCancel: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  visible,
  initialValues,
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
          firstName: initialValues.firstName,
          lastName: initialValues.lastName,
          mobilePhone: initialValues.mobilePhone,
          email: initialValues.email,
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
              id: 'pages.employee.editEmployee',
              defaultMessage: 'Edit Employee',
            })
          : intl.formatMessage({
              id: 'pages.employee.addEmployee',
              defaultMessage: 'Add Employee',
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
          name="firstName"
          label={intl.formatMessage({
            id: 'pages.employee.firstName',
            defaultMessage: 'First Name',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'pages.employee.firstNameRequired',
                defaultMessage: 'Please enter first name',
              }),
            },
          ]}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.employee.firstNamePlaceholder',
              defaultMessage: 'Enter first name',
            })}
          />
        </Form.Item>

        <Form.Item
          name="lastName"
          label={intl.formatMessage({
            id: 'pages.employee.lastName',
            defaultMessage: 'Last Name',
          })}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.employee.lastNamePlaceholder',
              defaultMessage: 'Enter last name',
            })}
          />
        </Form.Item>

        <Form.Item
          name="mobilePhone"
          label={intl.formatMessage({
            id: 'pages.employee.mobilePhone',
            defaultMessage: 'Phone',
          })}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.employee.mobilePhonePlaceholder',
              defaultMessage: 'Enter phone number',
            })}
          />
        </Form.Item>

        <Form.Item
          name="email"
          label={intl.formatMessage({
            id: 'pages.employee.email',
            defaultMessage: 'Email',
          })}
        >
          <Input
            placeholder={intl.formatMessage({
              id: 'pages.employee.emailPlaceholder',
              defaultMessage: 'Enter email address',
            })}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EmployeeForm;
