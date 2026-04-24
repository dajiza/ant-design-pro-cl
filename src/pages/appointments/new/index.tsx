import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  message,
  Select,
  Space,
} from 'antd';
import React, { useEffect, useState } from 'react';
import {
  createAppointment,
  getClients,
  getLocations,
  getServices,
  getStaff,
} from '@/services/ant-design-pro/api';

const NewAppointment: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<API.LocationItem[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<API.ServiceItem[]>([]);
  const [staffList, setStaffList] = useState<API.StaffItem[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      getLocations({ limit: 100 }).then((r) => setLocations(r.data || [])),
      getClients({ limit: 100 }).then((r: any) => setClients(r.data || [])),
      getServices({ limit: 100 }).then((r) =>
        setServices((r.data || []).filter((s: any) => s.active)),
      ),
      getStaff({ limit: 100 }).then((r) =>
        setStaffList(r.data.filter((s: API.StaffItem) => s.active)),
      ),
    ]).catch(() => message.error('加载数据失败'));
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const appointmentServices = (values.serviceIds || []).map(
        (serviceId: string, index: number) => {
          const staffKey = `staff_${index}`;
          return {
            serviceId,
            staffId: values[staffKey] || undefined,
          };
        },
      );

      await createAppointment({
        clientId: values.clientId,
        locationId: values.locationId,
        startAt: values.startAt.toISOString(),
        cancelled: false,
        appointmentServices,
        notes: values.notes,
        clientMessage: values.clientMessage,
      } as any);
      message.success('预约创建成功');
      history.push('/appointments');
    } catch (error: any) {
      message.error(`创建失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleServicesChange = (ids: string[]) => {
    setSelectedServices(ids);
  };

  return (
    <PageContainer title="新建预约">
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Divider>基本信息</Divider>
          <Form.Item
            name="locationId"
            label="门店"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="选择门店"
              options={locations.map((l) => ({
                value: l.id,
                label: l.name || l.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="clientId" label="客户" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="搜索客户"
              filterOption={(input, option) =>
                (option?.label || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={clients.map((c: any) => ({
                value: c.id,
                label:
                  c.name ||
                  `${c.firstName || ''} ${c.lastName || ''}`.trim() ||
                  c.email ||
                  c.id,
              }))}
            />
          </Form.Item>

          <Divider>服务和员工</Divider>
          <Form.Item
            name="serviceIds"
            label="服务"
            rules={[{ required: true }]}
          >
            <Select
              mode="multiple"
              placeholder="选择服务"
              onChange={handleServicesChange}
              options={services.map((s) => ({
                value: s.id,
                label: `${s.name || s.id} (${s.defaultDuration ? `${s.defaultDuration / 60}min` : '-'})`,
              }))}
            />
          </Form.Item>

          {selectedServices.map((serviceId, index) => {
            const svc = services.find((s) => s.id === serviceId);
            return (
              <Form.Item
                key={serviceId}
                name={`staff_${index}`}
                label={`${svc?.name || '服务'} - 员工`}
              >
                <Select
                  allowClear
                  placeholder="选择员工（可选）"
                  options={staffList.map((s) => ({
                    value: s.id,
                    label:
                      s.displayName ||
                      s.name ||
                      `${s.firstName || ''} ${s.lastName || ''}`.trim(),
                  }))}
                />
              </Form.Item>
            );
          })}

          <Divider>时间</Divider>
          <Form.Item
            name="startAt"
            label="开始时间"
            rules={[{ required: true }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Divider>其他</Divider>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="clientMessage" label="客户留言">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建预约
              </Button>
              <Button onClick={() => history.push('/appointments')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default NewAppointment;
