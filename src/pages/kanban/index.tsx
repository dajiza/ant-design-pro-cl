import { PageContainer } from '@ant-design/pro-components';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { DatePicker, message, Select, Spin } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAppointments,
  getLocations,
  updateAppointmentState,
} from '@/services/ant-design-pro/api';
import CheckoutModal from './components/CheckoutModal';
import KanbanColumn, { type KanbanColumnData } from './components/KanbanColumn';

dayjs.extend(utc);
dayjs.extend(timezone);

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface ColumnDef {
  id: string;
  title: string;
  color: string;
  states: string[];
}

const COLUMN_DEFS: ColumnDef[] = [
  {
    id: 'booked',
    title: '已预约',
    color: '#1677ff',
    states: ['BOOKED', 'CONFIRMED'],
  },
  { id: 'arrived', title: '已到达', color: '#faad14', states: ['ARRIVED'] },
  { id: 'active', title: '进行中', color: '#52c41a', states: ['ACTIVE'] },
  { id: 'completed', title: '已完成', color: '#722ed1', states: ['FINAL'] },
];

/** Map a state string to its column id */
function stateToColumnId(state: string): string | null {
  for (const col of COLUMN_DEFS) {
    if (col.states.includes(state)) return col.id;
  }
  return null;
}

/**
 * Strict linear state machine (must match backend):
 * BOOKED → CONFIRMED → ARRIVED → ACTIVE → FINAL (via checkout only)
 * Each state can also transition to CANCELLED (via cancel endpoint only).
 */
const VALID_NEXT_STATE: Record<string, string | null> = {
  BOOKED: 'CONFIRMED',
  CONFIRMED: 'ARRIVED',
  ARRIVED: 'ACTIVE',
  ACTIVE: null, // → FINAL via checkout only
  FINAL: null,
  CANCELLED: null,
};

/** Column order index for forward-only check */
const COLUMN_ORDER = ['booked', 'arrived', 'active', 'completed'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Kanban: React.FC = () => {
  // ---- filters ----
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedLocationId, setSelectedLocationId] = useState<
    string | undefined
  >(undefined);
  const [locations, setLocations] = useState<API.LocationItem[]>([]);

  // ---- data ----
  const [appointments, setAppointments] = useState<API.AppointmentItem[]>([]);
  const [loading, setLoading] = useState(false);

  // ---- checkout ----
  const [checkoutAppointment, setCheckoutAppointment] =
    useState<API.AppointmentItem | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  // ---- checkout tracking ----
  const [checkoutAmounts, setCheckoutAmounts] = useState<
    Record<string, number | null>
  >({});
  const [checkoutPendingSet, setCheckoutPendingSet] = useState<Set<string>>(
    new Set(),
  );

  // =========================
  // Fetch locations (once)
  // =========================
  useEffect(() => {
    getLocations({ limit: 100 })
      .then((res) => {
        const list = res?.data ?? [];
        setLocations(list);
      })
      .catch(() => {
        message.error('获取门店列表失败');
      });
  }, []);

  // =========================
  // Fetch appointments
  // =========================
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      // Use the location's timezone for date boundaries, not browser timezone
      const loc = selectedLocationId
        ? locations.find((l) => l.id === selectedLocationId)
        : locations[0];
      const tz = (loc as any)?.tz || 'UTC';

      // Interpret the selected calendar date in the location's timezone
      // (NOT a timezone conversion — we want "May 18" to mean "May 18 at this location")
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const startOfDay = dayjs
        .tz(dateStr, tz)
        .startOf('day')
        .utc()
        .format('YYYY-MM-DDTHH:mm:ss[Z]');
      const endOfDay = dayjs
        .tz(dateStr, tz)
        .endOf('day')
        .utc()
        .format('YYYY-MM-DDTHH:mm:ss[Z]');

      const res = await getAppointments({
        startDate: startOfDay,
        endDate: endOfDay,
        locationId: selectedLocationId,
        limit: 500,
      });

      setAppointments(res?.data ?? []);
    } catch {
      message.error('获取预约数据失败');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedLocationId, locations]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // =========================
  // Build columns
  // =========================
  const columns: KanbanColumnData[] = useMemo(() => {
    const grouped: Record<string, API.AppointmentItem[]> = {};
    for (const col of COLUMN_DEFS) {
      grouped[col.id] = [];
    }

    for (const apt of appointments) {
      // Skip cancelled appointments
      if (apt.cancelled) continue;
      const colId = stateToColumnId(apt.state || '');
      if (colId) {
        grouped[colId].push(apt);
      }
    }

    return COLUMN_DEFS.map((def) => ({
      id: def.id,
      title: def.title,
      color: def.color,
      states: def.states,
      appointments: grouped[def.id],
      checkoutAmounts,
      checkoutPendingSet,
    }));
  }, [appointments, checkoutAmounts, checkoutPendingSet]);

  // =========================
  // Total appointment count
  // =========================
  const totalCount = useMemo(
    () => columns.reduce((sum, col) => sum + col.appointments.length, 0),
    [columns],
  );

  // =========================
  // Drag & Drop handler
  // =========================
  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;

      // Dropped outside the board
      if (!destination) return;

      // No position change
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      const sourceColId = source.droppableId;
      const destColId = destination.droppableId;

      // No actual column change → reorder within same column (ignore for now)
      if (sourceColId === destColId) return;

      // Find the appointment
      const apt = appointments.find((a) => a.id === draggableId);
      if (!apt) return;

      // Dragging to "completed" column → open checkout modal
      if (destColId === 'completed') {
        setCheckoutAppointment(apt);
        setCheckoutModalOpen(true);
        return;
      }

      // Only allow dragging forward (not backward)
      const sourceIdx = COLUMN_ORDER.indexOf(sourceColId);
      const destIdx = COLUMN_ORDER.indexOf(destColId);
      if (destIdx <= sourceIdx) {
        message.warning('只能向前拖拽预约状态');
        return;
      }

      // Get the next valid state from the appointment's current state
      const currentState = apt.state || '';
      const nextState = VALID_NEXT_STATE[currentState];
      if (!nextState) {
        message.warning('该预约状态无法变更');
        return;
      }

      // Optimistic update
      const prevState = apt.state;
      setAppointments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, state: nextState } : a)),
      );

      try {
        await updateAppointmentState(apt.id, nextState as API.AppointmentState);
      } catch {
        message.error('状态更新失败，已恢复');
        setAppointments((prev) =>
          prev.map((a) => (a.id === apt.id ? { ...a, state: prevState } : a)),
        );
      }
    },
    [appointments],
  );

  // =========================
  // Checkout handlers
  // =========================
  const handleCheckoutSuccess = useCallback((res: API.CheckoutResponse) => {
    const aptId = res?.appointment?.id;
    const totalAmount = res?.order?.totalAmount ?? null;

    if (aptId) {
      // Update local state to FINAL
      setAppointments((prev) =>
        prev.map((a) => (a.id === aptId ? { ...a, state: 'FINAL' } : a)),
      );

      // Record checkout amount
      if (totalAmount != null) {
        setCheckoutAmounts((prev) => ({ ...prev, [aptId]: totalAmount }));
      }

      // Track if payment is still pending (no credit card payment captured)
      const hasPayment = res?.payment != null;
      if (!hasPayment) {
        setCheckoutPendingSet((prev) => new Set(prev).add(aptId));
      }
    }

    message.success('结账成功');
  }, []);

  const handleCheckoutClose = useCallback(() => {
    setCheckoutModalOpen(false);
    setCheckoutAppointment(null);
    // Refresh data to ensure consistency
    fetchAppointments();
  }, [fetchAppointments]);

  // =========================
  // Render
  // =========================
  return (
    <PageContainer>
      {/* Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <DatePicker
          value={selectedDate}
          onChange={(date) => date && setSelectedDate(date)}
          allowClear={false}
        />
        {locations.length > 1 && (
          <Select
            style={{ width: 200 }}
            placeholder="选择门店"
            allowClear
            value={selectedLocationId}
            onChange={(val) => setSelectedLocationId(val)}
            options={locations.map((loc) => ({
              value: loc.id,
              label: loc.name,
            }))}
          />
        )}
        <span style={{ color: '#999', fontSize: 13 }}>
          共 {totalCount} 个预约
        </span>
      </div>

      {/* Board */}
      <Spin spinning={loading}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div
            style={{
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              paddingBottom: 16,
            }}
          >
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                isCompletedColumn={col.id === 'completed'}
              />
            ))}
          </div>
        </DragDropContext>
      </Spin>

      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutModalOpen}
        appointment={checkoutAppointment}
        onClose={handleCheckoutClose}
        onSuccess={handleCheckoutSuccess}
      />
    </PageContainer>
  );
};

export default Kanban;
