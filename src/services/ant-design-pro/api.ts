// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取当前的用户 GET /api/v1/dynamo-auth/me */
export async function currentUser(options?: { [key: string]: any }) {
  return request<API.CurrentUser>('/api/v1/dynamo-auth/me', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 发送验证码 POST /api/v1/dynamo-auth/send-code */
export async function sendCode(body: API.SendCodeParams, options?: { [key: string]: any }) {
  return request<API.SendCodeResult>('/api/v1/dynamo-auth/send-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 验证码登录 POST /api/v1/dynamo-auth/verify-code */
export async function verifyCode(body: API.VerifyCodeParams, options?: { [key: string]: any }) {
  return request<API.VerifyCodeResult>('/api/v1/dynamo-auth/verify-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 密码登录 POST /api/v1/dynamo-auth/login-with-password */
export async function loginWithPassword(body: API.LoginWithPasswordParams, options?: { [key: string]: any }) {
  return request<API.LoginResult>('/api/v1/dynamo-auth/login-with-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 重置密码 POST /api/v1/dynamo-auth/reset-password-with-code */
export async function resetPasswordWithCode(body: API.ResetPasswordParams, options?: { [key: string]: any }) {
  return request<API.LoginResult>('/api/v1/dynamo-auth/reset-password-with-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 修改密码 POST /api/v1/dynamo-auth/change-password */
export async function changePassword(body: API.ChangePasswordParams, options?: { [key: string]: any }) {
  return request<{ success: boolean }>('/api/v1/dynamo-auth/change-password', {
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
    active?: boolean;
    name?: string;
    email?: string;
    locationId?: string;
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

/** 创建客户 POST /api/v1/clients */
export async function createClient(data: API.CreateClientParams, options?: { [key: string]: any }) {
  return request<API.ClientItem>('/api/v1/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 更新客户 PATCH /api/v1/clients/:id */
export async function updateClient(id: string, data: API.UpdateClientParams, options?: { [key: string]: any }) {
  return request<API.ClientItem>(`/api/v1/clients/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 创建客户备注 POST /api/v1/clients/:id/notes */
export async function createClientNote(id: string, data: { text: string }, options?: { [key: string]: any }) {
  return request<API.ClientItem>(`/api/v1/clients/${id}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 删除客户备注 DELETE /api/v1/clients/:id/notes/:noteId */
export async function deleteClientNote(id: string, noteId: string, options?: { [key: string]: any }) {
  return request(`/api/v1/clients/${id}/notes/${noteId}`, {
    method: 'DELETE',
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
  return request<API.ServiceCategoryList>('/api/v1/service-categories', {
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
    active?: boolean;
    name?: string;
    email?: string;
    locationId?: string;
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

/** 创建员工 POST /api/v1/staff */
export async function createStaff(data: API.CreateStaffParams, options?: { [key: string]: any }) {
  return request<API.StaffItem>('/api/v1/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 更新员工 PATCH /api/v1/staff/:id */
export async function updateStaff(id: string, data: API.UpdateStaffParams, options?: { [key: string]: any }) {
  return request<API.StaffItem>(`/api/v1/staff/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 分配/取消门店 PATCH /api/v1/staff/:id/location */
export async function updateStaffLocation(id: string, data: API.UpdateStaffLocationParams, options?: { [key: string]: any }) {
  return request<{ staffId: string; locationId: string; active: boolean }>(`/api/v1/staff/${id}/location`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 获取员工角色列表 GET /api/staff-roles */
export async function getStaffRoles(params?: { page?: number; limit?: number }, options?: { [key: string]: any }) {
  return request<API.StaffRoleList>('/api/v1/staff-roles', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
}

/** 获取员工角色详情 GET /api/staff-roles/:id */
export async function getStaffRole(id: string, options?: { [key: string]: any }) {
  return request<API.StaffRoleItem>(`/api/staff-roles/${id}`, {
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
    employeeId?: string;
    locationId?: string;
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
    employeeId?: string | null;
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
    employeeId?: string | null;
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
  return request<API.LocationList>('/api/v1/locations', {
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
  data: {
    locationId: string;
    clientId?: string;
    services?: { serviceId: string; staffId?: string; employeeId?: string; startTimeOffset?: number; addons?: { serviceId: string; staffId?: string }[] }[];
    notes?: string;
    clientMessage?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.BookingSessionItem>('/api/v1/booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
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

/** 更新预约会话 PATCH /api/v1/booking/:id */
export async function bookingUpdateSession(
  sessionId: string,
  data: {
    clientId?: string;
    services?: { serviceId: string; staffId?: string; employeeId?: string; startTimeOffset?: number; startAt?: string; addons?: { serviceId: string; staffId?: string }[] }[];
    startAt?: string;
    notes?: string;
    clientMessage?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.BookingSessionItem>(`/api/v1/booking/${sessionId}`, {
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
    employeeId?: string;
    searchRangeLower?: string;
    searchRangeUpper?: string;
    sessionId?: string;
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
    employeeId?: string;
    sessionId?: string;
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
    employeeId?: string;
    sessionId?: string;
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
  data: {
    startAt?: string;
    staffId?: string;
    employeeId?: string;
    services?: { serviceId: string; startAt: string; staffId?: string }[];
  },
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

/** 结账 POST /api/v1/appointments/:id/checkout */
export async function checkoutAppointment(
  id: string,
  data: API.CheckoutRequest,
  options?: { [key: string]: any },
) {
  return request<API.CheckoutResponse>(
    `/api/v1/appointments/${id}/checkout`,
    {
      method: 'POST',
      data,
      ...(options || {}),
    },
  );
}

// ===== Location API =====

/** 编辑门店信息 PATCH /api/v1/locations/:id */
export async function updateLocation(id: string, data: API.UpdateLocationParams, options?: { [key: string]: any }) {
  return request<API.LocationItem>(`/api/v1/locations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 编辑门店营业时间 PATCH /api/v1/locations/:id/hours */
export async function updateLocationHours(id: string, hours: API.LocationHoursInput[], options?: { [key: string]: any }) {
  return request<API.LocationItem>(`/api/v1/locations/${id}/hours`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data: { hours },
    ...(options || {}),
  });
}

// ===== Service Category API =====

/** 创建服务分类 POST /api/v1/service-categories */
export async function createServiceCategory(data: API.CreateServiceCategoryParams, options?: { [key: string]: any }) {
  return request<API.ServiceCategoryItem>('/api/v1/service-categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 更新服务分类 PATCH /api/v1/service-categories/:id */
export async function updateServiceCategory(id: string, data: API.UpdateServiceCategoryParams, options?: { [key: string]: any }) {
  return request<API.ServiceCategoryItem>(`/api/v1/service-categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

// ===== Service API =====

/** 创建服务 POST /api/v1/services */
export async function createService(data: API.CreateServiceParams, options?: { [key: string]: any }) {
  return request<API.ServiceItem>('/api/v1/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 更新服务 PATCH /api/v1/services/:id */
export async function updateService(id: string, data: API.UpdateServiceParams, options?: { [key: string]: any }) {
  return request<API.ServiceItem>(`/api/v1/services/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 激活服务 POST /api/v1/services/:id/activate */
export async function activateService(id: string, data: API.ActivateServiceParams, options?: { [key: string]: any }) {
  return request<{ serviceId: string; locationId: string; active: boolean }>(`/api/v1/services/${id}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 停用服务 POST /api/v1/services/:id/deactivate */
export async function deactivateService(id: string, data: API.ActivateServiceParams, options?: { [key: string]: any }) {
  return request<{ serviceId: string; locationId: string; active: boolean }>(`/api/v1/services/${id}/deactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

// ===== Service Overlap Config API =====

/** 获取服务默认 overlap 配置 GET /api/v1/services/:id/overlap-config */
export async function getOverlapConfig(serviceId: string, options?: { [key: string]: any }) {
  return request<API.OverlapConfig | null>(`/api/v1/services/${serviceId}/overlap-config`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取服务 location 覆盖 overlap 配置 GET /api/v1/services/:id/overlap-config/:locationId */
export async function getOverlapConfigForLocation(serviceId: string, locationId: string, options?: { [key: string]: any }) {
  return request<API.OverlapConfig | null>(`/api/v1/services/${serviceId}/overlap-config/${locationId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建/更新服务默认 overlap 配置 PUT /api/v1/services/:id/overlap-config */
export async function upsertOverlapConfig(serviceId: string, data: { staffFreeHead: number; staffFreeTail: number }, options?: { [key: string]: any }) {
  return request<API.OverlapConfig>(`/api/v1/services/${serviceId}/overlap-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 创建/更新服务 location 覆盖 overlap 配置 PUT /api/v1/services/:id/overlap-config/:locationId */
export async function upsertOverlapConfigForLocation(serviceId: string, locationId: string, data: { staffFreeHead: number; staffFreeTail: number }, options?: { [key: string]: any }) {
  return request<API.OverlapConfig>(`/api/v1/services/${serviceId}/overlap-config/${locationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 删除服务 location 覆盖 overlap 配置 DELETE /api/v1/services/:id/overlap-config/:locationId */
export async function deleteOverlapConfigForLocation(serviceId: string, locationId: string, options?: { [key: string]: any }) {
  return request(`/api/v1/services/${serviceId}/overlap-config/${locationId}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

// ===== Shift API =====

/** 获取排班列表 GET /api/v1/shifts */
export async function getShifts(params?: { page?: number; limit?: number }, options?: { [key: string]: any }) {
  return request<API.ShiftList>('/api/v1/shifts', {
    method: 'GET',
    params: { page: params?.page || 1, limit: params?.limit || 100 },
    ...(options || {}),
  });
}

/** 获取排班详情 GET /api/v1/shifts/:id */
export async function getShift(id: string, options?: { [key: string]: any }) {
  return request<API.ShiftItem>(`/api/v1/shifts/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 按员工+门店查询排班 GET /api/v1/shifts/staff/:staffId/location/:locationId */
export async function getShiftsByStaffAndLocation(staffId: string, locationId: string, options?: { [key: string]: any }) {
  return request<API.ShiftItem[]>(`/api/v1/shifts/staff/${staffId}/location/${locationId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建排班 POST /api/v1/shifts */
export async function createShift(data: API.CreateShiftParams, options?: { [key: string]: any }) {
  return request<API.ShiftItem>('/api/v1/shifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 取消发布排班 POST /api/v1/shifts/unpublish */
export async function unpublishShift(data: API.UnpublishShiftParams, options?: { [key: string]: any }) {
  return request('/api/v1/shifts/unpublish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

// ===== Timeblock API =====

/** 获取时间块列表 GET /api/v1/timeblocks */
export async function getTimeblocks(params?: API.TimeblockListParams, options?: { [key: string]: any }) {
  const query: Record<string, any> = {};
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  if (params?.locationId) query.locationId = params.locationId;
  if (params?.staffId) query.staffId = params.staffId;
  // 同时传入 startDate + endDate 时后端忽略分页，返回全部匹配数据
  if (params?.startDate) query.startDate = params.startDate;
  if (params?.endDate) query.endDate = params.endDate;
  return request<API.TimeblockList>('/api/v1/timeblocks', {
    method: 'GET',
    params: query,
    ...(options || {}),
  });
}

/** 获取时间块详情 GET /api/v1/timeblocks/:id */
export async function getTimeblock(id: string, options?: { [key: string]: any }) {
  return request<API.TimeblockItem>(`/api/v1/timeblocks/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建时间块 POST /api/v1/timeblocks */
export async function createTimeblock(data: API.CreateTimeblockParams, options?: { [key: string]: any }) {
  return request<API.TimeblockItem>('/api/v1/timeblocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 删除时间块 DELETE /api/v1/timeblocks/:id */
export async function deleteTimeblock(id: string, options?: { [key: string]: any }) {
  return request(`/api/v1/timeblocks/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

// ===== Employee API =====

/** 获取员工列表 GET /api/v1/employees */
export async function getEmployees(
  params: {
    page?: number;
    limit?: number;
    active?: boolean;
    name?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.EmployeeList>('/api/v1/employees', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 创建员工 POST /api/v1/employees */
export async function createEmployee(data: API.CreateEmployeeParams, options?: { [key: string]: any }) {
  return request<API.EmployeeItem>('/api/v1/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 更新员工 PATCH /api/v1/employees/:id */
export async function updateEmployee(id: string, data: API.UpdateEmployeeParams, options?: { [key: string]: any }) {
  return request<API.EmployeeItem>(`/api/v1/employees/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 删除员工 DELETE /api/v1/employees/:id */
export async function deleteEmployee(id: string, options?: { [key: string]: any }) {
  return request<void>(`/api/v1/employees/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

// ===== Deposit API =====

/** 创建押金/违约金订单 POST /api/v1/deposits */
export async function createDeposit(data: API.CreateDepositParams, options?: { [key: string]: any }) {
  return request<API.DepositOrder>('/api/v1/deposits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}

/** 查询押金列表 GET /api/v1/deposits */
export async function getDeposits(params: API.DepositListParams, options?: { [key: string]: any }) {
  return request<API.DepositListResponse>('/api/v1/deposits', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
}

/** 获取押金详情 GET /api/v1/deposits/:id */
export async function getDepositDetail(id: string, options?: { [key: string]: any }) {
  return request<API.DepositDetailResponse>(`/api/v1/deposits/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 生成支付链接 POST /api/v1/deposits/:id/payment-link */
export async function generatePaymentLink(id: string, options?: { [key: string]: any }) {
  return request<API.DepositPayment>(`/api/v1/deposits/${id}/payment-link`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** 取消押金订单 POST /api/v1/deposits/:id/cancel */
export async function cancelDeposit(id: string, data?: { staffId?: string }, options?: { [key: string]: any }) {
  return request<API.DepositOrder>(`/api/v1/deposits/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: data || {},
    ...(options || {}),
  });
}

/** 手动更新押金状态 PATCH /api/v1/deposits/:id/status */
export async function updateDepositStatus(id: string, data: { status: API.DepositStatus; staffId?: string }, options?: { [key: string]: any }) {
  return request<API.DepositOrder>(`/api/v1/deposits/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
    ...(options || {}),
  });
}
