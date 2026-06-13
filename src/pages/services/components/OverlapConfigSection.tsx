import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Divider,
  Form,
  InputNumber,
  Modal,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import {
  deleteOverlapConfigForLocation,
  getOverlapConfig,
  getOverlapConfigForLocation,
  upsertOverlapConfig,
  upsertOverlapConfigForLocation,
} from '@/services/ant-design-pro/api';

const { Text } = Typography;

interface OverlapConfigSectionProps {
  serviceId: string;
  locations: API.LocationItem[];
}

const OverlapConfigSection: React.FC<OverlapConfigSectionProps> = ({
  serviceId,
  locations,
}) => {
  const [defaultConfig, setDefaultConfig] = useState<API.OverlapConfig | null>(
    null,
  );
  const [locationOverrides, setLocationOverrides] = useState<
    API.OverlapConfig[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 默认配置表单
  const [defaultForm] = Form.useForm();
  const [headValue, setHeadValue] = useState(0);
  const [tailValue, setTailValue] = useState(0);

  // Location 覆盖 Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<API.OverlapConfig | null>(
    null,
  );
  const [modalForm] = Form.useForm();
  const [modalSaving, setModalSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const config = await getOverlapConfig(serviceId);
      setDefaultConfig(config);
      setHeadValue(config?.staffFreeHead ?? 0);
      setTailValue(config?.staffFreeTail ?? 0);
      defaultForm.setFieldsValue({
        staffFreeHead: config?.staffFreeHead ?? 0,
        staffFreeTail: config?.staffFreeTail ?? 0,
      });

      // 加载所有 location 的覆盖
      const overrides: API.OverlapConfig[] = [];
      for (const loc of locations) {
        try {
          const locConfig = await getOverlapConfigForLocation(
            serviceId,
            loc.id,
          );
          if (locConfig) {
            overrides.push(locConfig);
          }
        } catch {
          // 忽略单个 location 查询失败
        }
      }
      setLocationOverrides(overrides);
    } catch (error: any) {
      message.error(`加载配置失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [serviceId, locations, defaultForm]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSaveDefault = async () => {
    setSaving(true);
    try {
      const result = await upsertOverlapConfig(serviceId, {
        staffFreeHead: headValue,
        staffFreeTail: tailValue,
      });
      setDefaultConfig(result);
      message.success('默认配置已保存');
    } catch (error: any) {
      message.error(`保存失败: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingConfig(null);
    modalForm.resetFields();
    modalForm.setFieldsValue({ staffFreeHead: 0, staffFreeTail: 0 });
    setModalOpen(true);
  };

  const handleOpenEditModal = (config: API.OverlapConfig) => {
    setEditingConfig(config);
    modalForm.setFieldsValue({
      locationId: config.locationId,
      staffFreeHead: config.staffFreeHead,
      staffFreeTail: config.staffFreeTail,
    });
    setModalOpen(true);
  };

  const handleModalOk = async () => {
    const values = await modalForm.validateFields();
    const targetLocationId = editingConfig?.locationId || values.locationId;
    if (!targetLocationId) {
      message.error('请选择 Location');
      return;
    }

    setModalSaving(true);
    try {
      await upsertOverlapConfigForLocation(serviceId, targetLocationId, {
        staffFreeHead: values.staffFreeHead,
        staffFreeTail: values.staffFreeTail,
      });
      message.success(editingConfig ? '覆盖配置已更新' : '覆盖配置已添加');
      setModalOpen(false);
      loadConfig();
    } catch (error: any) {
      message.error(`操作失败: ${error.message}`);
    } finally {
      setModalSaving(false);
    }
  };

  const handleDelete = async (config: API.OverlapConfig) => {
    try {
      await deleteOverlapConfigForLocation(serviceId, config.locationId!);
      message.success('覆盖配置已删除');
      loadConfig();
    } catch (error: any) {
      message.error(`删除失败: ${error.message}`);
    }
  };

  // 过滤掉已有覆盖的 location
  const availableLocations = locations.filter(
    (loc) =>
      !locationOverrides.some((o) => o.locationId === loc.id) ||
      editingConfig?.locationId === loc.id,
  );

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return '默认';
    return locations.find((l) => l.id === locationId)?.name || locationId;
  };

  const columns = [
    {
      title: 'Location',
      dataIndex: 'locationId',
      key: 'locationId',
      render: (id: string) => getLocationName(id),
    },
    {
      title: 'Free Head (分钟)',
      dataIndex: 'staffFreeHead',
      key: 'staffFreeHead',
    },
    {
      title: 'Free Tail (分钟)',
      dataIndex: 'staffFreeTail',
      key: 'staffFreeTail',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: API.OverlapConfig) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditModal(record)}
          />
          <Popconfirm
            title="确定删除此覆盖配置？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Divider>时间压缩配置</Divider>
      <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Space align="center">
              <Text>Free Head:</Text>
              <InputNumber
                min={0}
                max={120}
                value={headValue}
                onChange={(v) => setHeadValue(v ?? 0)}
                addonAfter="分钟"
                style={{ width: 160 }}
                disabled={loading}
              />
            </Space>
          </div>
          <div>
            <Space align="center">
              <Text>Free Tail:</Text>
              <InputNumber
                min={0}
                max={120}
                value={tailValue}
                onChange={(v) => setTailValue(v ?? 0)}
                addonAfter="分钟"
                style={{ width: 160 }}
                disabled={loading}
              />
              <Button
                type="primary"
                size="small"
                onClick={handleSaveDefault}
                loading={saving}
              >
                保存
              </Button>
            </Space>
          </div>
        </Space>
      </div>

      <Divider>Location 覆盖</Divider>
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={handleOpenAddModal}
        style={{ marginBottom: 12 }}
        disabled={availableLocations.length === 0}
      >
        添加覆盖
      </Button>
      <Table
        dataSource={locationOverrides}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        loading={loading}
      />

      <Modal
        title={editingConfig ? '编辑 Location 覆盖' : '添加 Location 覆盖'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        confirmLoading={modalSaving}
        destroyOnClose
      >
        <Form form={modalForm} layout="vertical">
          {!editingConfig && (
            <Form.Item
              name="locationId"
              label="Location"
              rules={[{ required: true, message: '请选择 Location' }]}
            >
              <Select placeholder="选择 Location">
                {availableLocations.map((loc) => (
                  <Select.Option key={loc.id} value={loc.id}>
                    {loc.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item
            name="staffFreeHead"
            label="Free Head (分钟)"
            rules={[{ required: true, message: '请输入 Free Head' }]}
          >
            <InputNumber min={0} max={120} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="staffFreeTail"
            label="Free Tail (分钟)"
            rules={[{ required: true, message: '请输入 Free Tail' }]}
          >
            <InputNumber min={0} max={120} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default OverlapConfigSection;
