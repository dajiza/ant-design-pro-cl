import { request } from '@umijs/max';
import { Form, Input, InputNumber, Modal, message, Select, Spin } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import { getClients } from '@/services/ant-design-pro/api';

interface CreateDepositModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  locations: { id: string; name: string }[];
}

type DepositOrderType = 'DEPOSIT' | 'PENALTY_AMOUNT' | 'OTHER';

const orderTypeOptions: { label: string; value: DepositOrderType }[] = [
  { label: 'Deposit', value: 'DEPOSIT' },
  { label: 'Penalty', value: 'PENALTY_AMOUNT' },
  { label: 'Other', value: 'OTHER' },
];

const CreateDepositModal: React.FC<CreateDepositModalProps> = ({
  open,
  onClose,
  onSuccess,
  locations,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Client search state
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const clientSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedLocationId = Form.useWatch('locationId', form);

  const handleClientSearch = useCallback(
    (value: string) => {
      if (clientSearchTimer.current) clearTimeout(clientSearchTimer.current);
      if (!value || value.length < 2) {
        setClients([]);
        setClientSearchLoading(false);
        return;
      }
      setClientSearchLoading(true);
      clientSearchTimer.current = setTimeout(async () => {
        try {
          const params: any = { name: value, limit: 20 };
          if (selectedLocationId) params.locationId = selectedLocationId;
          const r = await getClients(params);
          setClients(r.data || []);
        } catch {
          setClients([]);
        } finally {
          setClientSearchLoading(false);
        }
      }, 300);
    },
    [selectedLocationId],
  );

  // When location changes, clear selected client
  const handleLocationChange = () => {
    form.setFieldsValue({ clientId: undefined });
    setSelectedClient(null);
    setClients([]);
  };

  const clientOptions = [
    ...(selectedClient && !clients.find((c) => c.id === selectedClient.id)
      ? [
          {
            value: selectedClient.id,
            label:
              selectedClient.name ||
              `${selectedClient.firstName || ''} ${selectedClient.lastName || ''}`.trim(),
          },
        ]
      : []),
    ...clients.map((c) => ({
      value: c.id,
      label:
        c.name ||
        `${c.firstName || ''} ${c.lastName || ''}`.trim() ||
        c.email ||
        c.id,
    })),
  ];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await request('/api/v1/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          ...values,
          amount: Math.round(values.amount * 100),
        },
      });

      message.success('Order created');
      form.resetFields();
      setSelectedClient(null);
      setClients([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.data?.message) {
        message.error(err.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedClient(null);
    setClients([]);
    onClose();
  };

  return (
    <Modal
      title="Create Deposit / Penalty"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      destroyOnClose
      width={520}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="locationId"
          label="Location"
          rules={[{ required: true }]}
        >
          <Select
            placeholder="Select location"
            showSearch
            optionFilterProp="label"
            onChange={handleLocationChange}
          >
            {locations.map((l) => (
              <Select.Option key={l.id} value={l.id} label={l.name}>
                {l.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="clientId" label="Client" rules={[{ required: true }]}>
          <Select
            placeholder={
              selectedLocationId
                ? 'Type to search clients...'
                : 'Select a location first'
            }
            showSearch
            filterOption={false}
            onSearch={handleClientSearch}
            notFoundContent={
              clientSearchLoading ? <Spin size="small" /> : 'No results'
            }
            options={clientOptions}
            disabled={!selectedLocationId}
            onChange={(value) => {
              const c = clients.find((item) => item.id === value);
              if (c) setSelectedClient(c);
            }}
          />
        </Form.Item>
        <Form.Item name="orderType" label="Type" rules={[{ required: true }]}>
          <Select placeholder="Select type" options={orderTypeOptions} />
        </Form.Item>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input placeholder="e.g. Appointment Deposit - 2026/06/01" />
        </Form.Item>
        <Form.Item
          name="amount"
          label="Amount (USD)"
          rules={[{ required: true }]}
        >
          <InputNumber
            prefix="$"
            min={0.01}
            step={0.01}
            precision={2}
            style={{ width: '100%' }}
            placeholder="0.00"
          />
        </Form.Item>
        <Form.Item name="memo" label="Memo">
          <Input.TextArea rows={2} placeholder="Optional notes" />
        </Form.Item>
        <Form.Item name="appointmentId" label="Appointment ID (optional)">
          <Input placeholder="Link to an existing appointment" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateDepositModal;
