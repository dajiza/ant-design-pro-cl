import type {
  DraggableProvided,
  DraggableStateSnapshot,
} from '@hello-pangea/dnd';
import { Card } from 'antd';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import React, { useMemo } from 'react';

dayjs.extend(utc);
dayjs.extend(timezone);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppointmentCardProps {
  appointment: API.AppointmentItem;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  checkoutAmount?: number | null;
  isCheckoutPending?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** State -> left border color */
const STATE_BORDER_COLOR: Record<string, string> = {
  BOOKED: '#1677ff',
  CONFIRMED: '#1677ff',
  ARRIVED: '#faad14',
  ACTIVE: '#52c41a',
  FINAL: '#722ed1',
};

/** Extract client display name */
function getClientName(record: API.AppointmentItem): string {
  return (
    record.client?.name ||
    `${record.client?.firstName || ''} ${record.client?.lastName || ''}`.trim() ||
    '未知客户'
  );
}

/** Format startAt to HH:mm using location timezone */
function formatTime(startAt: string, tz?: string | null): string {
  const utcStr = startAt.endsWith('Z') ? startAt : `${startAt}Z`;
  return dayjs(utcStr)
    .tz(tz || 'UTC')
    .format('HH:mm');
}

/** Extract unique staff names from appointmentServices */
function getStaffNames(
  services: Record<string, any>[] | null | undefined,
): string[] {
  if (!services || services.length === 0) return [];
  const seen = new Set<string>();
  const names: string[] = [];
  for (const svc of services) {
    const name = svc.staffName || svc.staff?.name;
    if (name && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

/** Extract service names from appointmentServices */
function getServiceNames(
  services: Record<string, any>[] | null | undefined,
): string[] {
  if (!services || services.length === 0) return [];
  return services.map((svc) => svc.name || svc.serviceName).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  provided,
  snapshot,
  checkoutAmount,
  isCheckoutPending,
}) => {
  const borderColor = STATE_BORDER_COLOR[appointment.state || ''] || '#d9d9d9';
  const tz = (appointment.location as any)?.tz || null;
  const isCancelled = appointment.cancelled;
  const isFinal = appointment.state === 'FINAL';

  const clientName = useMemo(() => getClientName(appointment), [appointment]);
  const time = useMemo(
    () => formatTime(appointment.startAt, tz),
    [appointment.startAt, tz],
  );
  const serviceNames = useMemo(
    () => getServiceNames(appointment.appointmentServices),
    [appointment.appointmentServices],
  );
  const staffNames = useMemo(
    () => getStaffNames(appointment.appointmentServices),
    [appointment.appointmentServices],
  );

  return (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      size="small"
      style={{
        ...provided.draggableProps.style,
        borderLeft: `3px solid ${borderColor}`,
        cursor: 'grab',
        opacity: isCancelled ? 0.5 : snapshot.isDragging ? 0.8 : 1,
        marginBottom: 8,
      }}
    >
      <div style={{ fontWeight: 500, marginBottom: 4 }}>{clientName}</div>
      <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{time}</div>
      {serviceNames.length > 0 && (
        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
          {serviceNames.join(' + ')}
        </div>
      )}
      {staffNames.length > 0 && (
        <div style={{ fontSize: 12, color: '#999' }}>
          {staffNames.join(', ')}
        </div>
      )}
      {isFinal && checkoutAmount != null && (
        <div style={{ marginTop: 6, fontSize: 12 }}>
          {isCheckoutPending ? (
            <span style={{ color: '#faad14' }}>{'⚠'} 待收款</span>
          ) : (
            <span style={{ color: '#52c41a' }}>
              {'✓'} 已结账 ${(checkoutAmount / 100).toFixed(2)}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

export default AppointmentCard;
