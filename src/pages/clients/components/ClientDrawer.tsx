import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Badge,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Input,
  List,
  message,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
  createClientNote,
  deleteClientNote,
  getAppointments,
} from '@/services/ant-design-pro/api';

const { Text } = Typography;

interface ClientDrawerProps {
  open: boolean;
  client: API.ClientItem | null;
  onClose: () => void;
  onRefresh: () => void;
}

const ClientDrawer: React.FC<ClientDrawerProps> = ({
  open,
  client,
  onClose,
  onRefresh,
}) => {
  const [noteInput, setNoteInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<API.AppointmentItem[]>([]);
  const [appointmentsLoaded, setAppointmentsLoaded] = useState(false);

  if (!client) return null;

  const clientName =
    client.name ||
    `${client.firstName || ''} ${client.lastName || ''}`.trim() ||
    '-';

  const loadAppointments = async () => {
    if (appointmentsLoaded) return;
    try {
      const res = await getAppointments({ clientId: client.id, limit: 10 });
      setAppointments(res.data || []);
      setAppointmentsLoaded(true);
    } catch {
      message.error('加载预约记录失败');
    }
  };

  const handleAddNote = async () => {
    if (!noteInput.trim()) return;
    setLoading(true);
    try {
      await createClientNote(client.id, { text: noteInput.trim() });
      message.success('备注已添加');
      setNoteInput('');
      onRefresh();
    } catch (error: any) {
      message.error(`添加备注失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setLoading(true);
    try {
      await deleteClientNote(client.id, noteId);
      message.success('备注已删除');
      onRefresh();
    } catch (error: any) {
      message.error(`删除备注失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const notes = (client.notes || []) as any[];

  return (
    <Drawer
      title={clientName}
      open={open}
      onClose={onClose}
      width={520}
      afterOpenChange={(visible) => {
        if (visible) {
          setAppointmentsLoaded(false);
          loadAppointments();
        }
      }}
    >
      <Descriptions column={2} size="small">
        <Descriptions.Item label="状态">
          <Badge
            status={client.active ? 'success' : 'error'}
            text={client.active ? '活跃' : '停用'}
          />
        </Descriptions.Item>
        <Descriptions.Item label="邮箱">
          {client.email || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="电话">
          {client.mobilePhone || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="代词">
          {client.pronoun || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="余额">
          {client.currentAccountBalance
            ? `$${(client.currentAccountBalance / 100).toFixed(2)}`
            : '$0.00'}
        </Descriptions.Item>
        <Descriptions.Item label="预约数">
          {client.appointmentCount}
        </Descriptions.Item>
        <Descriptions.Item label="卡信息">
          {client.hasCardOnFile ? (
            <Tag color="green">有卡</Tag>
          ) : (
            <Tag>无卡</Tag>
          )}
        </Descriptions.Item>
        {client.externalId && (
          <Descriptions.Item label="外部 ID">
            {client.externalId}
          </Descriptions.Item>
        )}
        {client.schedulingAlert && (
          <Descriptions.Item label="调度警告" span={2}>
            <Text type="warning">{client.schedulingAlert}</Text>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="创建时间">
          {dayjs(client.createdAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {dayjs(client.updatedAt).format('YYYY-MM-DD HH:mm')}
        </Descriptions.Item>
      </Descriptions>

      <Divider>备注 ({notes.length})</Divider>
      {notes.length > 0 ? (
        <List
          size="small"
          dataSource={notes}
          renderItem={(note: any) => (
            <List.Item
              actions={[
                <Button
                  key="del"
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={loading}
                  onClick={() => handleDeleteNote(note.id)}
                />,
              ]}
            >
              <List.Item.Meta
                description={
                  <>
                    <Text>{note.text || note.content || '-'}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {note.createdAt
                        ? dayjs(note.createdAt).format('YYYY-MM-DD HH:mm')
                        : ''}
                    </Text>
                  </>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Text type="secondary">暂无备注</Text>
      )}
      <Space.Compact style={{ marginTop: 12, width: '100%' }}>
        <Input
          placeholder="输入备注内容"
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          onPressEnter={handleAddNote}
        />
        <Button
          icon={<PlusOutlined />}
          onClick={handleAddNote}
          loading={loading}
        >
          添加
        </Button>
      </Space.Compact>

      <Divider>最近预约</Divider>
      {appointments.length > 0 ? (
        <List
          size="small"
          dataSource={appointments}
          renderItem={(apt) => {
            const tz = (apt.location as any)?.tz || 'UTC';
            const startUtc = apt.startAt?.endsWith('Z')
              ? apt.startAt
              : `${apt.startAt}Z`;
            return (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <span>
                        {dayjs(startUtc).tz
                          ? dayjs(startUtc).format('YYYY-MM-DD HH:mm')
                          : apt.startAt}
                      </span>
                      <Tag
                        color={
                          apt.state === 'CANCELLED'
                            ? 'red'
                            : apt.state === 'FINAL'
                              ? 'default'
                              : apt.state === 'ACTIVE'
                                ? 'purple'
                                : 'blue'
                        }
                      >
                        {apt.state || '-'}
                      </Tag>
                    </Space>
                  }
                  description={
                    (apt.appointmentServices as any[])
                      ?.map((s: any) => s.name || s.serviceName)
                      .join(', ') || '-'
                  }
                />
              </List.Item>
            );
          }}
        />
      ) : appointmentsLoaded ? (
        <Text type="secondary">暂无预约记录</Text>
      ) : (
        <Text type="secondary">加载中...</Text>
      )}
    </Drawer>
  );
};

export default ClientDrawer;
