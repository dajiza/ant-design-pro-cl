// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取当前的用户 GET /api/v1/auth/me */
export async function currentUser(options?: { [key: string]: any }) {
  return request<API.CurrentUser>('/api/v1/auth/me', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 退出登录接口 POST /api/v1/auth/logout */
export async function outLogin(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/v1/auth/logout', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 登录接口 POST /api/v1/auth/email/login */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  return request<API.LoginResult>('/api/v1/auth/email/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 注册接口 POST /api/v1/auth/email/register */
export async function register(body: API.RegisterParams, options?: { [key: string]: any }) {
  return request<void>('/api/v1/auth/email/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/notices */
export async function getNotices(options?: { [key: string]: any }) {
  return request<API.NoticeIconList>('/api/notices', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取规则列表 GET /api/rule */
export async function rule(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.RuleList>('/api/rule', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 更新规则 PUT /api/rule */
export async function updateRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'update',
      ...(options || {}),
    },
  });
}

/** 新建规则 POST /api/rule */
export async function addRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'post',
      ...(options || {}),
    },
  });
}

/** 删除规则 DELETE /api/rule */
export async function removeRule(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/rule', {
    method: 'POST',
    data: {
      method: 'delete',
      ...(options || {}),
    },
  });
}

/** 获取客户列表 GET /api/v1/clients */
export async function getClients(
  params: {
    page?: number;
    limit?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ClientList>('/api/v1/clients', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取单个客户 GET /api/v1/clients/:id */
export async function getClient(id: string, options?: { [key: string]: any }) {
  return request<API.ClientItem>(`/api/v1/clients/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取员工列表 GET /api/v1/staff */
export async function getStaff(
  params: {
    page?: number;
    limit?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.StaffList>('/api/v1/staff', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取单个员工 GET /api/v1/staff/:id */
export async function getStaffMember(id: string, options?: { [key: string]: any }) {
  return request<API.StaffItem>(`/api/v1/staff/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取预约列表 GET /api/v1/appointments */
export async function getAppointments(
  params: {
    page?: number;
    limit?: number;
    staffId?: string;
    roomId?: string;
    equipmentId?: string;
    startDate?: string;
    endDate?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.AppointmentList>('/api/v1/appointments', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取预约日历数据 GET /api/v1/appointments (按日期范围获取所有预约) */
export async function getAppointmentsByDateRange(
  params: {
    startDate: string;
    endDate: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.AppointmentList>('/api/v1/appointments', {
    method: 'GET',
    params: {
      startDate: params.startDate,
      endDate: params.endDate,
    },
    ...(options || {}),
  });
}

/** 获取单个预约 GET /api/v1/appointments/:id */
export async function getAppointment(id: string, options?: { [key: string]: any }) {
  return request<API.AppointmentItem>(`/api/v1/appointments/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取服务列表 GET /api/v1/services */
export async function getServices(
  params: {
    page?: number;
    limit?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ServiceList>('/api/v1/services', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取单个服务 GET /api/v1/services/:id */
export async function getService(id: string, options?: { [key: string]: any }) {
  return request<API.ServiceItem>(`/api/v1/services/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建预约 POST /api/v1/appointments */
export async function createAppointment(
  body: {
    id?: string;
    clientId: string;
    staffId: string;
    startAt: string;
    cancelled: boolean;
    duration?: number;
    endAt?: string;
    roomId?: string | null;
    equipmentId?: string | null;
    appointmentServices?: API.ServiceItem[];
  },
  options?: { [key: string]: any },
) {
  return request<API.AppointmentItem>('/api/v1/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新预约 PATCH /api/v1/appointments/:id */
export async function updateAppointment(
  id: string,
  body: {
    cancelled?: boolean;
    startAt?: string;
    endAt?: string;
    staffId?: string;
    roomId?: string | null;
    equipmentId?: string | null;
    notes?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.AppointmentItem>(`/api/v1/appointments/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取房间列表 GET /api/v1/rooms */
export async function getRooms(
  params: {
    page?: number;
    limit?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.RoomList>('/api/v1/rooms', {
    method: 'GET',
    params: {
      page: params.page || 1,
      limit: params.limit || 10,
    },
    ...(options || {}),
  });
}

/** 获取单个房间 GET /api/v1/rooms/:id */
export async function getRoom(id: string, options?: { [key: string]: any }) {
  return request<API.RoomItem>(`/api/v1/rooms/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建房间 POST /api/v1/rooms */
export async function createRoom(
  body: {
    name: string;
    serviceId?: string | null;
  },
  options?: { [key: string]: any },
) {
  return request<API.RoomItem>('/api/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新房间 PATCH /api/v1/rooms/:id */
export async function updateRoom(
  id: string,
  body: {
    name?: string;
    serviceId?: string | null;
  },
  options?: { [key: string]: any },
) {
  return request<API.RoomItem>(`/api/v1/rooms/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除房间 DELETE /api/v1/rooms/:id */
export async function deleteRoom(id: string, options?: { [key: string]: any }) {
  return request<void>(`/api/v1/rooms/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 根据服务ID获取房间 GET /api/v1/rooms/service/:serviceId */
export async function getRoomsByService(serviceId: string, options?: { [key: string]: any }) {
  return request<API.RoomItem[]>(`/api/v1/rooms/service/${serviceId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取设备列表 GET /api/v1/equipment */
export async function getEquipment(
  params: {
    page?: number;
    limit?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.EquipmentList>('/api/v1/equipment', {
    method: 'GET',
    params: {
      page: params.page || 1,
      limit: params.limit || 10,
    },
    ...(options || {}),
  });
}

/** 获取单个设备 GET /api/v1/equipment/:id */
export async function getEquipmentItem(id: string, options?: { [key: string]: any }) {
  return request<API.EquipmentItem>(`/api/v1/equipment/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建设备 POST /api/v1/equipment */
export async function createEquipment(
  body: {
    name: string;
    serviceId?: string | null;
  },
  options?: { [key: string]: any },
) {
  return request<API.EquipmentItem>('/api/v1/equipment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新设备 PATCH /api/v1/equipment/:id */
export async function updateEquipment(
  id: string,
  body: {
    name?: string;
    serviceId?: string | null;
  },
  options?: { [key: string]: any },
) {
  return request<API.EquipmentItem>(`/api/v1/equipment/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除设备 DELETE /api/v1/equipment/:id */
export async function deleteEquipment(id: string, options?: { [key: string]: any }) {
  return request<void>(`/api/v1/equipment/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 根据服务ID获取设备 GET /api/v1/equipment/service/:serviceId */
export async function getEquipmentByService(serviceId: string, options?: { [key: string]: any }) {
  return request<API.EquipmentItem[]>(`/api/v1/equipment/service/${serviceId}`, {
    method: 'GET',
    ...(options || {}),
  });
}
