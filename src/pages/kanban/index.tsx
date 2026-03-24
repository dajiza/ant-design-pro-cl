import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import { Card, Tag, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';

const { Title } = Typography;

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

const initialColumns: Column[] = [
  {
    id: 'todo',
    title: '待办',
    color: '#1890ff',
    tasks: [
      {
        id: '1',
        title: '设计登录页面',
        description: '完成用户登录界面设计',
        priority: 'high',
      },
      {
        id: '2',
        title: '编写API文档',
        description: '整理后端接口文档',
        priority: 'medium',
      },
    ],
  },
  {
    id: 'inProgress',
    title: '进行中',
    color: '#faad14',
    tasks: [
      {
        id: '3',
        title: '开发用户模块',
        description: '实现用户增删改查',
        priority: 'high',
      },
    ],
  },
  {
    id: 'done',
    title: '已完成',
    color: '#52c41a',
    tasks: [
      {
        id: '4',
        title: '项目初始化',
        description: '搭建基础框架',
        priority: 'low',
      },
    ],
  },
  {
    id: 'archived',
    title: '已归档',
    color: '#8c8c8c',
    tasks: [],
  },
];

const useStyles = createStyles(({ token, css }) => ({
  container: css`
    padding: 24px;
    min-height: calc(100vh - 200px);
  `,
  board: css`
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 16px;
  `,
  column: css`
    min-width: 300px;
    max-width: 300px;
    background: ${token.colorBgContainer};
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 280px);
  `,
  columnHeader: css`
    padding: 16px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  columnTitle: css`
    margin: 0 !important;
    font-size: 16px !important;
  `,
  taskCount: css`
    background: ${token.colorBgTextHover};
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
  taskList: css`
    padding: 12px;
    flex: 1;
    overflow-y: auto;
    min-height: 100px;
  `,
  taskCard: css`
    margin-bottom: 12px;
    cursor: grab;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

    &:last-child {
      margin-bottom: 0;
    }

    &:active {
      cursor: grabbing;
    }
  `,
  taskTitle: css`
    font-weight: 500;
    margin-bottom: 8px;
  `,
  taskDescription: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
    margin-bottom: 8px;
  `,
  priorityTag: css`
    font-size: 11px;
  `,
  placeholder: css`
    padding: 16px;
    text-align: center;
    color: ${token.colorTextQuaternary};
    font-size: 14px;
  `,
}));

const priorityConfig = {
  high: { color: 'red', text: '高' },
  medium: { color: 'orange', text: '中' },
  low: { color: 'blue', text: '低' },
};

const Kanban: React.FC = () => {
  const { styles } = useStyles();
  const [columns, setColumns] = useState<Column[]>(initialColumns);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    // 拖出看板区域
    if (!destination) return;

    // 位置没变
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const newColumns = [...columns];
    const sourceColumn = newColumns.find(
      (col) => col.id === source.droppableId,
    );
    const destColumn = newColumns.find(
      (col) => col.id === destination.droppableId,
    );

    if (!sourceColumn || !destColumn) return;

    // 从源列移除任务
    const [movedTask] = sourceColumn.tasks.splice(source.index, 1);

    // 添加到目标列
    destColumn.tasks.splice(destination.index, 0, movedTask);

    setColumns(newColumns);
  };

  return (
    <div className={styles.container}>
      <Title level={4} style={{ marginBottom: 24 }}>
        任务看板
      </Title>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={styles.board}>
          {columns.map((column) => (
            <div key={column.id} className={styles.column}>
              <div className={styles.columnHeader}>
                <div
                  style={{
                    width: 4,
                    height: 16,
                    backgroundColor: column.color,
                    borderRadius: 2,
                  }}
                />
                <Title level={5} className={styles.columnTitle}>
                  {column.title}
                </Title>
                <span className={styles.taskCount}>{column.tasks.length}</span>
              </div>
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={styles.taskList}
                    style={{
                      backgroundColor: snapshot.isDraggingOver
                        ? 'rgba(0,0,0,0.02)'
                        : 'transparent',
                    }}
                  >
                    {column.tasks.length === 0 ? (
                      <div className={styles.placeholder}>拖拽任务到这里</div>
                    ) : (
                      column.tasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={styles.taskCard}
                              size="small"
                              style={{
                                opacity: snapshot.isDragging ? 0.8 : 1,
                              }}
                            >
                              <div className={styles.taskTitle}>
                                {task.title}
                              </div>
                              {task.description && (
                                <div className={styles.taskDescription}>
                                  {task.description}
                                </div>
                              )}
                              <Tag
                                className={styles.priorityTag}
                                color={priorityConfig[task.priority].color}
                              >
                                {priorityConfig[task.priority].text}
                              </Tag>
                            </Card>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default Kanban;
