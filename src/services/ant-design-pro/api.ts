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

/** 获取商家列表 GET /api/v1/business */
export async function getBusinesses(options?: { [key: string]: any }) {
  return request<API.BusinessList>('/api/v1/business', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取单个商家 GET /api/v1/business/:id */
export async function getBusiness(id: string, options?: { [key: string]: any }) {
  return request<API.BusinessItem>(`/api/v1/business/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取服务分类列表 GET /api/service-categories */
export async function getServiceCategories(
  params?: {
    page?: number;
    limit?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ServiceCategoryList>('/api/service-categories', {
    method: 'GET',
    params: {
      page: params?.page || 1,
      limit: params?.limit || 10,
    },
    ...(options || {}),
  });
}

/** 获取单个服务分类 GET /api/service-categories/:id */
export async function getServiceCategory(id: string, options?: { [key: string]: any }) {
  return request<API.ServiceCategoryItem>(`/api/service-categories/${id}`, {
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
    locationId?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.AppointmentList>('/api/v1/appointments', {
    method: 'GET',
    params: {
      startDate: params.startDate,
      endDate: params.endDate,
      locationId: params.locationId,
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

/** 获取地点列表 GET /api/v1/locations */
export async function getLocations(
  params?: {
    page?: number;
    limit?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.LocationList>('/api/locations', {
    method: 'GET',
    params: {
      page: params?.page || 1,
      limit: params?.limit || 100,
    },
    ...(options || {}),
  });
}

/** 获取单个地点 GET /api/v1/locations/:id */
export async function getLocation(id: string, options?: { [key: string]: any }) {
  return request<API.LocationItem>(`/api/locations/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

// ===== Booking Session API =====

/** 创建预约会话 POST /api/v1/booking */
export async function bookingCreate(
  locationId: string,
  options?: { [key: string]: any },
) {
  return request<API.BookingSessionItem>('/api/v1/booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { locationId },
    ...(options || {}),
  });
}

/** 获取预约会话 GET /api/v1/booking/:id */
export async function bookingGetSession(
  id: string,
  options?: { [key: string]: any },
) {
  return request<API.BookingSessionItem>(`/api/v1/booking/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 添加服务到会话 POST /api/v1/booking/:id/services */
export async function bookingAddService(
  sessionId: string,
  data: { serviceId: string; staffId?: string; startTimeOffset?: number },
  options?: { [key: string]: any },
) {
  return request<API.BookingSessionItem>(`/api/v1/booking/${sessionId}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 移除服务 DELETE /api/v1/booking/:id/services/:index */
export async function bookingRemoveService(
  sessionId: string,
  index: number,
  options?: { [key: string]: any },
) {
  return request<API.BookingSessionItem>(`/api/v1/booking/${sessionId}/services/${index}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 设置客户 PATCH /api/v1/booking/:id/client */
export async function bookingSetClient(
  sessionId: string,
  clientId: string,
  options?: { [key: string]: any },
) {
  return request<API.BookingSessionItem>(`/api/v1/booking/${sessionId}/client`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { clientId },
    ...(options || {}),
  });
}

/** 设置开始时间 PATCH /api/v1/booking/:id/time */
export async function bookingSetTime(
  sessionId: string,
  startAt: string,
  options?: { [key: string]: any },
) {
  return request<API.BookingSessionItem>(`/api/v1/booking/${sessionId}/time`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { startAt },
    ...(options || {}),
  });
}

/** 设置员工 PATCH /api/v1/booking/:id/staff */
export async function bookingSetStaff(
  sessionId: string,
  data: { serviceIndex: number; staffId: string },
  options?: { [key: string]: any },
) {
  return request<API.BookingSessionItem>(`/api/v1/booking/${sessionId}/staff`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 完成预约 POST /api/v1/booking/:id/complete */
export async function bookingComplete(
  sessionId: string,
  options?: { [key: string]: any },
) {
  return request<API.BookingSessionItem>(`/api/v1/booking/${sessionId}/complete`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** 放弃会话 DELETE /api/v1/booking/:id */
export async function bookingAbandon(
  sessionId: string,
  options?: { [key: string]: any },
) {
  return request(`/api/v1/booking/${sessionId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

// ===== Availability API =====

/** 获取可预约日期 GET /api/v1/availability/dates */
export async function getAvailableDates(
  params: {
    locationId: string;
    serviceId: string;
    staffId?: string;
    searchRangeLower?: string;
    searchRangeUpper?: string;
  },
  options?: { [key: string]: any },
) {
  return request<string[]>('/api/v1/availability/dates', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 获取可用时段 GET /api/v1/availability/times */
export async function getAvailableTimes(
  params: {
    locationId: string;
    serviceId: string;
    date: string;
    staffId?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.StaffAvailability[]>('/api/v1/availability/times', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** 获取可用员工 GET /api/v1/availability/staff */
export async function getAvailableStaff(
  params: {
    locationId: string;
    serviceId: string;
    startAt: string;
    durationMinutes?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.AvailableStaff[]>('/api/v1/availability/staff', {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

// ===== Appointment Actions API =====

/** 取消预约 POST /api/v1/appointments/:id/cancel */
export async function cancelAppointment(
  id: string,
  data: { reason: API.CancellationReason; notifyClient?: boolean; notes?: string },
  options?: { [key: string]: any },
) {
  return request<API.AppointmentItem>(`/api/v1/appointments/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 恢复预约 POST /api/v1/appointments/:id/restore */
export async function restoreAppointment(
  id: string,
  options?: { [key: string]: any },
) {
  return request<API.AppointmentItem>(`/api/v1/appointments/${id}/restore`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** 改期预约 POST /api/v1/appointments/:id/reschedule */
export async function rescheduleAppointment(
  id: string,
  data: { startAt: string; staffId?: string },
  options?: { [key: string]: any },
) {
  return request<API.AppointmentItem>(`/api/v1/appointments/${id}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 设置预约备注 PATCH /api/v1/appointments/:id/note */
export async function setAppointmentNote(id: string, data: API.SetNoteParams, options?: { [key: string]: any }) {
  return request<API.AppointmentItem>(`/api/v1/appointments/${id}/note`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 添加预约标签 POST /api/v1/appointments/:id/tags */
export async function addAppointmentTags(id: string, data: API.AddTagsParams, options?: { [key: string]: any }) {
  return request<API.AppointmentItem>(`/api/v1/appointments/${id}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 移除预约标签 DELETE /api/v1/appointments/:id/tags */
export async function removeAppointmentTags(id: string, data: API.RemoveTagsParams, options?: { [key: string]: any }) {
  return request<API.AppointmentItem>(`/api/v1/appointments/${id}/tags`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 改期-查可用日期 POST /api/v1/appointments/:id/reschedule/available-dates */
export async function getRescheduleAvailableDates(id: string, data: API.RescheduleAvailableDatesParams, options?: { [key: string]: any }) {
  return request<string[]>(`/api/v1/appointments/${id}/reschedule/available-dates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 改期-查可用时间 POST /api/v1/appointments/:id/reschedule/available-times */
export async function getRescheduleAvailableTimes(id: string, data: API.RescheduleAvailableTimesParams, options?: { [key: string]: any }) {
  return request<API.StaffAvailability[]>(`/api/v1/appointments/${id}/reschedule/available-times`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 从预约创建 Booking POST /api/v1/appointments/:id/create-booking */
export async function createBookingFromAppointment(id: string, options?: { [key: string]: any }) {
  return request(`/api/v1/appointments/${id}/create-booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(options || {}),
  });
}

/** 删除预约 DELETE /api/v1/appointments/:id */
export async function deleteAppointment(id: string, options?: { [key: string]: any }) {
  return request(`/api/v1/appointments/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 更新预约状态 PATCH /api/v1/appointments/:id/state */
export async function updateAppointmentState(
  id: string,
  state: API.AppointmentState,
  options?: { [key: string]: any },
) {
  return request<API.AppointmentItem>(`/api/v1/appointments/${id}/state`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { state },
    ...(options || {}),
  });
}
