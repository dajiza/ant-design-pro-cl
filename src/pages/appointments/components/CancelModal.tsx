import { Form, Input, Modal, Select, Switch } from 'antd';
import React from 'react';

const cancellationReasons = [
  { value: 'CLIENT_CANCEL', label: '客户取消' },
  { value: 'CLIENT_LATE_CANCEL', label: '客户迟到取消' },
  { value: 'STAFF_CANCEL', label: '员工取消' },
  { value: 'NO_SHOW', label: '客户未到' },
  { value: 'MISTAKE', label: '操作失误' },
  { value: 'MERGED', label: '合并预约' },
  { value: 'OFFBOARDED', label: '员工离职' },
  { value: 'VOIDED', label: '作废' },
];

interface CancelModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (values: {
    reason: string;
    notes?: string;
    notifyClient: boolean;
  }) => void;
  loading?: boolean;
}

const CancelModal: React.FC<CancelModalProps> = ({
  open,
  onCancel,
  onOk,
  loading,
}) => {
  const [form] = Form.useForm();

  return (
    <Modal
      title="取消预约"
      open={open}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={() => form.submit()}
      okButtonProps={{ danger: true }}
      okText="确认取消"
    >
      <Form
        form={form}
        onFinish={onOk}
        layout="vertical"
        initialValues={{ reason: 'CLIENT_CANCEL', notifyClient: true }}
      >
        <Form.Item name="reason" label="取消原因" rules={[{ required: true }]}>
          <Select options={cancellationReasons} />
        </Form.Item>
        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="notifyClient" label="通知客户" valuePropName="checked">
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CancelModal;
