import React, { useState } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Button,
  Space,
  Divider,
  Input,
  Popconfirm,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  LoginOutlined,
  PlayCircleOutlined,
  DollarOutlined,
  CloseCircleOutlined,
  UndoOutlined,
  ScheduleOutlined,
  DeleteOutlined,
  PlusOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import AppointmentStateBadge from './AppointmentStateBadge';
import CancelModal from './CancelModal';
import RescheduleModal from './RescheduleModal';
import {
  updateAppointmentState,
  cancelAppointment,
  restoreAppointment,
  rescheduleAppointment,
  setAppointmentNote,
  addAppointmentTags,
  removeAppointmentTags,
  createBookingFromAppointment,
  deleteAppointment,
  updateAppointment,
} from '@/services/ant-design-pro/api';

const { Text, Link } = Typography;

interface AppointmentDrawerProps {
  open: boolean;
  appointment: API.AppointmentItem | null;
  onClose: () => void;
  onRefresh: () => void;
}

const AppointmentDrawer: React.FC<AppointmentDrawerProps> = ({
  open,
  appointment,
  onClose,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [editNote, setEditNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showNoteEdit, setShowNoteEdit] = useState(false);

  if (!appointment) return null;

  const clientName =
    appointment.client?.name ||
    `${(appointment.client as any)?.firstName || ''} ${(appointment.client as any)?.lastName || ''}`.trim() ||
    '未知客户';
  const locationName = (appointment.location as any)?.name || appointment.locationId || '-';
  const locationTz = (appointment.location as any)?.tz || 'UTC';
  const startTime = dayjs(appointment.startAt).format('YYYY-MM-DD HH:mm');
  const endTime = appointment.endAt ? dayjs(appointment.endAt).format('HH:mm') : '-';
  const durationMinutes = appointment.duration ? Math.round(appointment.duration / 60) : '-';
  const canAct = !appointment.cancelled && appointment.state !== 'FINAL';

  const getNextStates = (): { state: string; label: string; icon: React.ReactNode }[] => {
    switch (appointment.state) {
      case 'BOOKED':
        return [{ state: 'CONFIRMED', label: '确认', icon: <CheckCircleOutlined /> }];
      case 'CONFIRMED':
        return [{ state: 'ARRIVED', label: '已到达', icon: <LoginOutlined /> }];
      case 'ARRIVED':
        return [{ state: 'ACTIVE', label: '开始服务', icon: <PlayCircleOutlined /> }];
      case 'ACTIVE':
        return [{ state: 'FINAL', label: '完成结账', icon: <DollarOutlined /> }];
      default:
        return [];
    }
  };

  const handleStateChange = async (state: string) => {
    setLoading(true);
    try {
      await updateAppointmentState(appointment!.id, state as any);
      message.success('状态更新成功');
      onRefresh();
    } catch (error: any) {
      message.error(`状态更新失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (values: { reason: string; notes?: string; notifyClient: boolean }) => {
    setLoading(true);
    try {
      await cancelAppointment(appointment!.id, values);
      message.success('预约已取消');
      setCancelModalOpen(false);
      onRefresh();
    } catch (error: any) {
      message.error(`取消失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await restoreAppointment(appointment!.id);
      message.success('预约已恢复');
      onRefresh();
    } catch (error: any) {
      message.error(`恢复失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (startAt: string) => {
    setLoading(true);
    try {
      await rescheduleAppointment(appointment!.id, { startAt });
      message.success('预约已改期');
      setRescheduleModalOpen(false);
      onRefresh();
    } catch (error: any) {
      message.error(`改期失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    setLoading(true);
    try {
      await setAppointmentNote(appointment!.id, { note: editNote });
      message.success('备注已保存');
      setShowNoteEdit(false);
      onRefresh();
    } catch (error: any) {
      message.error(`保存备注失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    setLoading(true);
    try {
      await addAppointmentTags(appointment!.id, { tagIds: [tagInput.trim()] });
      message.success('标签已添加');
      setTagInput('');
      onRefresh();
    } catch (error: any) {
      message.error(`添加标签失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    setLoading(true);
    try {
      await removeAppointmentTags(appointment!.id, { tagIds: [tagId] });
      message.success('标签已移除');
      onRefresh();
    } catch (error: any) {
      message.error(`移除标签失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteAppointment(appointment!.id);
      message.success('预约已删除');
      onClose();
      onRefresh();
    } catch (error: any) {
      message.error(`删除失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async () => {
    setLoading(true);
    try {
      await createBookingFromAppointment(appointment!.id);
      message.success('Booking 已创建');
      onRefresh();
    } catch (error: any) {
      message.error(`创建 Booking 失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStates = getNextStates();

  return (
    <>
      <Drawer
        title={
          <Space>
            <span>预约详情</span>
            <AppointmentStateBadge state={appointment.state} cancelled={appointment.cancelled} />
          </Space>
        }
        open={open}
        onClose={onClose}
        width={520}
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="客户">{clientName}</Descriptions.Item>
          <Descriptions.Item label="门店">{locationName}</Descriptions.Item>
          <Descriptions.Item label="开始时间">{startTime}</Descriptions.Item>
          <Descriptions.Item label="结束时间">{endTime}</Descriptions.Item>
          <Descriptions.Item label="时长">
            {durationMinutes} 分钟
          </Descriptions.Item>
          <Descriptions.Item label="时区">{locationTz}</Descriptions.Item>
          <Descriptions.Item label="来源">{appointment.bookedByType || '-'}</Descriptions.Item>
          {appointment.orderId && (
            <Descriptions.Item label="订单">{appointment.orderId}</Descriptions.Item>
          )}
        </Descriptions>

        {appointment.appointmentServices && (appointment.appointmentServices as any[]).length > 0 && (
          <>
            <Divider>服务列表</Divider>
            {(appointment.appointmentServices as any[]).map((svc: any, i: number) => (
              <Descriptions key={i} column={3} size="small" style={{ marginBottom: 8 }}>
                <Descriptions.Item label="服务">
                  {svc.name || svc.serviceName || svc.serviceId}
                </Descriptions.Item>
                <Descriptions.Item label="时长">
                  {svc.duration || svc.totalDuration || '-'} 分钟
                </Descriptions.Item>
                <Descriptions.Item label="价格">
                  {svc.price ? `$${(svc.price.amount / 100).toFixed(2)}` : '-'}
                </Descriptions.Item>
              </Descriptions>
            ))}
          </>
        )}

        {appointment.clientMessage && (
          <>
            <Divider>客户留言</Divider>
            <Text type="secondary">{appointment.clientMessage}</Text>
          </>
        )}

        <Divider>备注</Divider>
        {showNoteEdit ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input.TextArea rows={2} value={editNote} onChange={(e) => setEditNote(e.target.value)} />
            <Space>
              <Button type="primary" onClick={handleSaveNote} loading={loading}>
                保存备注
              </Button>
              <Button onClick={() => setShowNoteEdit(false)}>取消</Button>
            </Space>
          </Space>
        ) : (
          <div>
            <Text type="secondary">{appointment.notes || '无备注'}</Text>
            <Button
              type="link"
              size="small"
              onClick={() => {
                setEditNote(appointment.notes || '');
                setShowNoteEdit(true);
              }}
            >
              编辑
            </Button>
          </div>
        )}

        <Divider>标签</Divider>
        <Space wrap style={{ marginBottom: 8 }}>
          {((appointment as any).tags || []).map((tag: any) => (
            <Tag key={tag.id || tag} closable onClose={() => handleRemoveTag(tag.id || tag)}>
              {tag.name || tag.id || tag}
            </Tag>
          ))}
        </Space>
        <Space.Compact>
          <Input
            placeholder="输入标签 ID"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            style={{ width: 200 }}
          />
          <Button icon={<PlusOutlined />} onClick={handleAddTag} loading={loading}>
            添加
          </Button>
        </Space.Compact>

        <Divider>操作</Divider>
        <Space wrap>
          {nextStates.map(({ state, label, icon }) => (
            <Button
              key={state}
              type="primary"
              icon={icon}
              onClick={() => handleStateChange(state)}
              loading={loading}
            >
              {label}
            </Button>
          ))}
          {canAct && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => setCancelModalOpen(true)}
            >
              取消预约
            </Button>
          )}
          {appointment.cancelled && (
            <Button icon={<UndoOutlined />} onClick={handleRestore} loading={loading}>
              恢复预约
            </Button>
          )}
          {canAct && (
            <Button
              icon={<ScheduleOutlined />}
              onClick={() => setRescheduleModalOpen(true)}
            >
              改期
            </Button>
          )}
          <Button icon={<RocketOutlined />} onClick={handleCreateBooking} loading={loading}>
            创建 Booking
          </Button>
          <Popconfirm title="确认删除此预约？" onConfirm={handleDelete}>
            <Button danger icon={<DeleteOutlined />} loading={loading}>
              删除
            </Button>
          </Popconfirm>
        </Space>

        {appointment.manageUrl && (
          <>
            <Divider>管理链接</Divider>
            <Link href={appointment.manageUrl} target="_blank">
              客户自助管理
            </Link>
          </>
        )}

        <Divider style={{ marginBottom: 8 }} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          ID: {appointment.id} | 创建于: {dayjs(appointment.createdAt).format('YYYY-MM-DD HH:mm')}
        </Text>
      </Drawer>

      <CancelModal
        open={cancelModalOpen}
        onCancel={() => setCancelModalOpen(false)}
        onOk={handleCancel}
        loading={loading}
      />
      <RescheduleModal
        open={rescheduleModalOpen}
        appointmentId={appointment.id}
        onCancel={() => setRescheduleModalOpen(false)}
        onOk={handleReschedule}
        loading={loading}
      />
    </>
  );
};

export default AppointmentDrawer;
