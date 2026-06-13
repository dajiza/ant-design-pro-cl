import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Avatar, Button, message, Tabs, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  createStaff,
  getLocations,
  getStaff,
  getStaffRoles,
} from '@/services/ant-design-pro/api';
import StaffDrawer from './components/StaffDrawer';
import StaffFormModal from './components/StaffFormModal';

const StaffPage: React.FC = () => {
  const actionRef = useRef<any>(null);
  const roleActionRef = useRef<any>(null);

  const [selectedStaff, setSelectedStaff] = useState<API.StaffItem | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [roles, setRoles] = useState<API.StaffRoleItem[]>([]);
  const [locations, setLocations] = useState<API.LocationItem[]>([]);

  useEffect(() => {
    getStaffRoles({ limit: 100 })
      .then((r) => setRoles(r.data || []))
      .catch(() => {});
    getLocations({ limit: 100 })
      .then((r) => setLocations(r.data || []))
      .catch(() => {});
  }, []);

  const handleCreate = async (values: any) => {
    setLoading(true);
    try {
      await createStaff(values);
      message.success('员工创建成功');
      setCreateModalOpen(false);
      actionRef.current?.reload();
    } catch (error: any) {
      message.error(`创建失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const staffColumns: ProColumns<API.StaffItem>[] = [
    {
      title: '头像',
      dataIndex: 'avatar',
      search: false,
      width: 60,
      render: (_, record) => (
        <Avatar
          size="small"
          src={record.avatar}
          icon={<UserOutlined />}
          style={
            record.hexColor ? { backgroundColor: record.hexColor } : undefined
          }
        >
          {(record.firstName?.[0] || '?').toUpperCase()}
        </Avatar>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'name',
      render: (_, record) => record.displayName || record.name || '-',
      width: 120,
    },
    {
      title: '颜色',
      dataIndex: 'hexColor',
      search: false,
      width: 70,
      render: (_, record) =>
        record.hexColor ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                borderRadius: 4,
                backgroundColor: record.hexColor,
              }}
            />
            <span style={{ fontSize: 12, color: '#888' }}>
              {record.hexColor}
            </span>
          </div>
        ) : (
          '-'
        ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      search: false,
      width: 180,
    },
    {
      title: '手机',
      dataIndex: 'mobilePhone',
      search: false,
      width: 130,
    },
    {
      title: '角色',
      dataIndex: ['role', 'name'],
      search: false,
      width: 100,
    },
    {
      title: '门店',
      search: false,
      render: (_, record) => {
        const locs = (record.locations as any[]) || [];
        return locs.length > 0
          ? locs.map((l: any) => l.name || l.id).join(', ')
          : '-';
      },
      width: 150,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'active',
      valueEnum: {
        true: { text: '活跃', status: 'Success' },
        false: { text: '未激活', status: 'Default' },
      },
      width: 80,
      render: (_, record) => (
        <Tag color={record.active ? 'green' : 'default'}>
          {record.active ? '活跃' : '未激活'}
        </Tag>
      ),
    },
    {
      title: '停用',
      dataIndex: 'suspended',
      search: false,
      width: 80,
      render: (_, record) => (
        <Tag color={record.suspended ? 'red' : 'green'}>
          {record.suspended ? '已停用' : '正常'}
        </Tag>
      ),
    },
  ];

  const roleColumns: ProColumns<any>[] = [
    { title: 'ID', dataIndex: 'id', width: 350 },
    { title: '名称', dataIndex: 'name', width: 200 },
  ];

  return (
    <PageContainer>
      <Tabs
        items={[
          {
            key: 'staff',
            label: '员工',
            children: (
              <ProTable<API.StaffItem>
                headerTitle="员工列表"
                rowKey="id"
                actionRef={actionRef}
                toolBarRender={() => [
                  <Button
                    key="new"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalOpen(true)}
                  >
                    新建员工
                  </Button>,
                ]}
                request={async (params) => {
                  const response = await getStaff({
                    page: params.current,
                    limit: params.pageSize,
                    active:
                      params.active === 'true'
                        ? true
                        : params.active === 'false'
                          ? false
                          : undefined,
                    name: params.name || undefined,
                    email: params.email || undefined,
                  });
                  return {
                    data: response.data,
                    total: response.total,
                    success: true,
                  };
                }}
                columns={staffColumns}
                pagination={{ defaultPageSize: 10, showSizeChanger: true }}
                onRow={(record) => ({
                  onClick: () => {
                    setSelectedStaff(record);
                    setDrawerOpen(true);
                  },
                  style: { cursor: 'pointer' },
                })}
                search={{ labelWidth: 'auto' }}
              />
            ),
          },
          {
            key: 'roles',
            label: '角色',
            children: (
              <ProTable
                headerTitle="角色列表"
                rowKey="id"
                actionRef={roleActionRef}
                request={async (params) => {
                  const response = await getStaffRoles({
                    page: params.current,
                    limit: params.pageSize,
                  });
                  return {
                    data: response.data,
                    total: response.total,
                    success: true,
                  };
                }}
                columns={roleColumns}
                pagination={{ defaultPageSize: 10 }}
                search={false}
              />
            ),
          },
        ]}
      />

      <StaffDrawer
        open={drawerOpen}
        staff={selectedStaff}
        roles={roles}
        locations={locations}
        onClose={() => setDrawerOpen(false)}
        onRefresh={() => actionRef.current?.reload()}
      />

      <StaffFormModal
        open={createModalOpen}
        roles={roles}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreate}
        loading={loading}
      />
    </PageContainer>
  );
};

export default StaffPage;
