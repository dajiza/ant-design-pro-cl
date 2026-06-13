import { PlusOutlined } from '@ant-design/icons';
// @ts-expect-error
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import ProTable from '@ant-design/pro-table';
import { Button } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  getClients,
  getDeposits,
  getLocations,
} from '@/services/ant-design-pro/api';
import CreateDepositModal from './components/CreateDepositModal';
import DepositDetailDrawer from './components/DepositDetailDrawer';
import DepositStatusTag from './components/DepositStatusTag';

type DepositOrderType = 'DEPOSIT' | 'PENALTY_AMOUNT' | 'OTHER';
type DepositStatus = 'INIT' | 'ING' | 'PAID' | 'CANCELED';

interface DepositOrder {
  id: string;
  locationId: string;
  clientId: string;
  amount: number;
  orderType: DepositOrderType;
  status: DepositStatus;
  title: string;
  memo: string | null;
  appointmentId: string | null;
  staffId: string | null;
  paymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusOptions: { label: string; value: DepositStatus }[] = [
  { label: 'Init', value: 'INIT' },
  { label: 'Pending', value: 'ING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Canceled', value: 'CANCELED' },
];

const orderTypeOptions: { label: string; value: DepositOrderType }[] = [
  { label: 'Deposit', value: 'DEPOSIT' },
  { label: 'Penalty', value: 'PENALTY_AMOUNT' },
  { label: 'Other', value: 'OTHER' },
];

const DepositsPage: React.FC = () => {
  // @ts-expect-error
  const actionRef = useRef<ActionType>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(
    null,
  );
  const [locations, setLocations] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [clientNames, setClientNames] = useState<Record<string, string>>({});

  useEffect(() => {
    getLocations({ limit: 100 }).then((res) => {
      setLocations(res.data.map((l) => ({ id: l.id, name: l.name })));
    });
  }, []);

  const columns: ProColumns<DepositOrder>[] = [
    {
      title: 'Title',
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Type',
      dataIndex: 'orderType',
      width: 100,
      valueEnum: Object.fromEntries(
        orderTypeOptions.map((o) => [o.value, { text: o.label }]),
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      width: 100,
      render: (_, record) => `$${(record.amount / 100).toFixed(2)}`,
    },
    {
      title: 'Client',
      dataIndex: 'clientId',
      width: 150,
      render: (_, record) => clientNames[record.clientId] || record.clientId,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 140,
      render: (_, record) => (
        <DepositStatusTag
          status={record.status}
          orderType={record.orderType}
          createdAt={record.createdAt}
        />
      ),
      valueEnum: Object.fromEntries(
        statusOptions.map((o) => [o.value, { text: o.label }]),
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 160,
      sorter: true,
    },
    {
      title: 'Actions',
      valueType: 'option',
      width: 80,
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          size="small"
          onClick={() => {
            setSelectedDepositId(record.id);
            setDrawerOpen(true);
          }}
        >
          Detail
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      {/* @ts-ignore ProComponents type mismatch */}
      <ProTable<DepositOrder>
        headerTitle="Deposits / Penalties"
        // @ts-expect-error ProComponents ref type mismatch
        actionRef={actionRef}
        rowKey="id"
        // @ts-expect-error ProComponents columns type mismatch
        columns={columns}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            New
          </Button>,
        ]}
        request={async (params) => {
          const res = await getDeposits({
            locationId: params.locationId,
            status: params.status,
            orderType: params.orderType,
            page: params.current,
            limit: params.pageSize,
          });

          // Resolve client names from deposit results
          const missingIds = res.data
            .map((d) => d.clientId)
            .filter((id) => id && !clientNames[id]);
          if (missingIds.length > 0) {
            const uniqueIds = [...new Set(missingIds)];
            const clientRes = await getClients({ limit: 100 });
            const newNames: Record<string, string> = {};
            for (const c of clientRes.data) {
              if (uniqueIds.includes(c.id)) {
                newNames[c.id] =
                  c.name ||
                  `${c.firstName || ''} ${c.lastName || ''}`.trim() ||
                  c.id;
              }
            }
            setClientNames((prev) => ({ ...prev, ...newNames }));
          }

          return {
            data: res.data,
            total: res.total,
            success: true,
          };
        }}
        pagination={{ defaultPageSize: 20 }}
        search={{
          filterType: 'light',
          defaultCollapsed: false,
        }}
      />

      <CreateDepositModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
        locations={locations}
      />

      <DepositDetailDrawer
        open={drawerOpen}
        depositId={selectedDepositId}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedDepositId(null);
        }}
        onRefresh={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
};

export default DepositsPage;
