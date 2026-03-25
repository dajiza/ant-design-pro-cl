// @ts-ignore
/* eslint-disable */

declare namespace API {
  type CurrentUser = {
    id?: number;
    name?: string;
    avatar?: string;
    userid?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    signature?: string;
    title?: string;
    group?: string;
    tags?: { key?: string; label?: string }[];
    notifyCount?: number;
    unreadCount?: number;
    country?: string;
    access?: string;
    role?: { id?: number };
    geographic?: {
      province?: { label?: string; key?: string };
      city?: { label?: string; key?: string };
    };
    address?: string;
    phone?: string;
  };

  type LoginResult = {
    token?: string;
    refreshToken?: string;
    tokenExpires?: number;
    user?: CurrentUser;
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
  };

  type RuleListItem = {
    key?: number;
    disabled?: boolean;
    href?: string;
    avatar?: string;
    name?: string;
    owner?: string;
    desc?: string;
    callNo?: number;
    status?: number;
    updatedAt?: string;
    createdAt?: string;
    progress?: number;
  };

  type RuleList = {
    data?: RuleListItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type FakeCaptcha = {
    code?: number;
    status?: string;
  };

  type LoginParams = {
    email?: string;
    password?: string;
    autoLogin?: boolean;
    type?: string;
  };

  type RegisterParams = {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  };

  type ErrorResponse = {
    /** 业务约定的错误码 */
    errorCode: string;
    /** 业务上的错误信息 */
    errorMessage?: string;
    /** 业务上的请求是否成功 */
    success?: boolean;
  };

  type NoticeIconList = {
    data?: NoticeIconItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type NoticeIconItemType = 'notification' | 'message' | 'event';

  type NoticeIconItem = {
    id?: string;
    extra?: string;
    key?: string;
    read?: boolean;
    avatar?: string;
    title?: string;
    status?: string;
    datetime?: string;
    description?: string;
    type?: NoticeIconItemType;
  };

  type ClientItem = {
    id: string;
    active: boolean;
    appointmentCount: number;
    createdAt: string;
    currentAccountBalance: number;
    email?: string | null;
    firstName?: string | null;
    hasCardOnFile: boolean;
    lastName?: string | null;
    mobilePhone?: string | null;
    name?: string | null;
    updatedAt: string;
  };

  type ClientList = {
    data: ClientItem[];
    total: number;
  };

  type StaffItem = {
    id: string;
    email: string;
    name: string;
    mobilePhone: string;
    active: boolean;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
    suspended?: boolean | null;
    nickname?: string | null;
    role?: { name: string } | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };

  type StaffList = {
    data: StaffItem[];
    total: number;
  };

  type AppointmentItem = {
    id: string;
    startAt: string;
    createdAt: string;
    cancelled: boolean;
    staffId: string;
    clientId?: string | null;
    locationId?: string | null;
    endAt?: string | null;
    duration?: number | null;
    state?: string | null;
    notes?: string | null;
    clientMessage?: string | null;
    bookedByType?: string | null;
    isRecurring?: boolean | null;
    isRemote?: boolean | null;
    isGroupedAppointment?: boolean | null;
    notifyClientCreate?: boolean | null;
    notifyClientCancel?: boolean | null;
    orderId?: string | null;
    pendingFormCount?: number | null;
    manageUrl?: string | null;
    client?: Record<string, any> | null;
    staff?: Record<string, any> | null;
    location?: Record<string, any> | null;
    appointmentServices?: Record<string, any>[] | null;
  };

  type AppointmentList = {
    data: AppointmentItem[];
    total: number;
  };

  type ServiceItem = {
    id: string;
    name: string;
    active: boolean;
    addon: boolean;
    createdAt: string;
    updatedAt: string;
    defaultDuration: number;
    defaultPrice: number;
    locationId?: string | null;
    categoryId?: string | null;
    description?: string | null;
  };

  type ServiceList = {
    data: ServiceItem[];
    total: number;
  };

  type CreateAppointmentParams = {
    id: string;
    clientId: string;
    staffId: string;
    startAt: string;
    createdAt: string;
    cancelled: boolean;
    duration?: number;
    endAt?: string;
    appointmentServices?: ServiceItem[];
  };
}
