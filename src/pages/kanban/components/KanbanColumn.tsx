import { Draggable, Droppable } from '@hello-pangea/dnd';
import { createStyles } from 'antd-style';
import React from 'react';
import AppointmentCard from './AppointmentCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KanbanColumnData {
  id: string;
  title: string;
  color: string;
  states: string[];
  appointments: API.AppointmentItem[];
  checkoutAmounts?: Record<string, number | null>;
  checkoutPendingSet?: Set<string>;
}

interface KanbanColumnProps {
  column: KanbanColumnData;
  isCompletedColumn?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FINAL_STATE = 'FINAL';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = createStyles(({ token, css }) => ({
  column: css`
    min-width: 280px;
    max-width: 280px;
    background: #f5f5f5;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 260px);
  `,
  header: css`
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  `,
  colorBar: css`
    width: 4px;
    height: 16px;
    border-radius: 2px;
    flex-shrink: 0;
  `,
  title: css`
    font-size: 14px;
    font-weight: 600;
    color: ${token.colorText};
    flex-shrink: 0;
  `,
  countBadge: css`
    background: ${token.colorBgTextHover || 'rgba(0,0,0,0.06)'};
    padding: 1px 8px;
    border-radius: 10px;
    font-size: 12px;
    color: ${token.colorTextSecondary};
    flex-shrink: 0;
  `,
  hint: css`
    margin-left: auto;
    font-size: 12px;
    color: ${token.colorPrimary || '#1677ff'};
    white-space: nowrap;
  `,
  droppableArea: css`
    padding: 8px 12px;
    flex: 1;
    overflow-y: auto;
    min-height: 80px;
    transition: background-color 0.2s;
  `,
  emptyState: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 80px;
    color: ${token.colorTextQuaternary || '#bfbfbf'};
    font-size: 14px;
  `,
}));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  isCompletedColumn = false,
}) => {
  const { styles } = useStyles();

  const {
    id,
    title,
    color,
    appointments,
    checkoutAmounts,
    checkoutPendingSet,
  } = column;

  return (
    <div
      className={styles.column}
      style={isCompletedColumn ? { border: '2px dashed #1677ff' } : undefined}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.colorBar} style={{ backgroundColor: color }} />
        <span className={styles.title}>{title}</span>
        <span className={styles.countBadge}>{appointments.length}</span>
        {isCompletedColumn && (
          <span className={styles.hint}>拖拽到此处结账</span>
        )}
      </div>

      {/* Droppable body */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={styles.droppableArea}
            style={{
              backgroundColor: snapshot.isDraggingOver
                ? 'rgba(22, 119, 255, 0.04)'
                : 'transparent',
            }}
          >
            {appointments.length === 0 ? (
              <div className={styles.emptyState}>暂无预约</div>
            ) : (
              appointments.map((appointment, index) => {
                const isFinal = appointment.state === FINAL_STATE;

                return (
                  <Draggable
                    key={appointment.id}
                    draggableId={appointment.id}
                    index={index}
                    isDragDisabled={isFinal}
                  >
                    {(dragProvided, dragSnapshot) => (
                      <AppointmentCard
                        appointment={appointment}
                        provided={dragProvided}
                        snapshot={dragSnapshot}
                        checkoutAmount={
                          checkoutAmounts?.[appointment.id] ?? undefined
                        }
                        isCheckoutPending={
                          checkoutPendingSet?.has(appointment.id) ?? false
                        }
                      />
                    )}
                  </Draggable>
                );
              })
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
