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

  type BusinessItem = {
    id: string;
    name: string;
    address?: Record<string, any> | null;
    allowLoginWithMultipleClients?: boolean | null;
    billingContactEmail?: string | null;
    custom?: Record<string, any> | null;
    customFields?: Record<string, any>[] | null;
    keys?: string[] | null;
    customBookingUrl?: string | null;
    phone?: string | null;
    showLocationHours?: boolean | null;
    tz?: string | null;
    website?: string | null;
  };

  type BusinessList = {
    data: BusinessItem[];
    total: number;
  };

  type ClientItem = {
    id: string;
    active: boolean;
    appointmentCount: number;
    createdAt: string;
    creditCardsOnFile?: Record<string, any>[] | null;
    currentAccountBalance: number;
    currentAccountUpdatedAt?: string | null;
    custom?: Record<string, any> | null;
    customFields?: Record<string, any>[] | null;
    keys?: string[] | null;
    dob?: string | null;
    email?: string | null;
    externalId?: string | null;
    firstName?: string | null;
    hasCardOnFile: boolean;
    lastName?: string | null;
    marketingSettings?: Record<string, any>[] | null;
    mergedIntoClientId?: string | null;
    mobilePhone?: string | null;
    name?: string | null;
    notes?: Record<string, any>[] | null;
    primaryLocation?: Record<string, any> | null;
    pronoun?: string | null;
    reminderSettings?: Record<string, any>[] | null;
    schedulingAlert?: string | null;
    tags?: Record<string, any>[] | null;
    updatedAt: string;
  };

  type ClientList = {
    data: ClientItem[];
    total: number;
  };

  type StaffItem = {
    id: string;
    email?: string | null;
    name: string;
    mobilePhone?: string | null;
    active: boolean;
    alternateId?: string | null;
    appRole?: Record<string, any> | null;
    appRoleId?: string | null;
    avatar?: string | null;
    bio?: string | null;
    createdAt?: string | null;
    displayName?: string | null;
    enabledForFutureLocations?: boolean | null;
    externalId?: string | null;
    externalNickname?: string | null;
    externallyBookable?: boolean | null;
    firstName?: string | null;
    lastName?: string | null;
    locationAbilities?: Record<string, any> | null;
    locationId?: string | null;
    locations?: Record<string, any>[] | null;
    nickname?: string | null;
    role?: { name: string } | null;
    staffRoleId?: string | null;
    suspended?: boolean | null;
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
    roomId?: string | null;
    equipmentId?: string | null;
    calComBookingId?: string | null;
    client?: Record<string, any> | null;
    location?: Record<string, any> | null;
    appointmentServices?: Record<string, any>[] | null;
  };

  type AppointmentTag = {
    id: string;
    name?: string;
  };

  type RescheduleAvailableDatesParams = {
    searchRangeLower: string;
    searchRangeUpper: string;
    tz?: string;
  };

  type RescheduleAvailableTimesParams = {
    date: string;
    tz?: string;
  };

  type SetNoteParams = {
    note?: string | null;
  };

  type AddTagsParams = {
    tagIds: string[];
  };

  type RemoveTagsParams = {
    tagIds: string[];
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
    categoryId?: string | null;
    custom?: Record<string, any> | null;
    customFields?: Record<string, any>[] | null;
    keys?: string[] | null;
    addons?: Record<string, any>[] | null;
    category?: Record<string, any> | null;
    description?: string | null;
    externalId?: string | null;
    serviceOptionGroups?: Record<string, any>[] | null;
    serviceOverrides?: Record<string, any> | null;
    serviceStatus?: Record<string, any> | null;
    sortPath?: Record<string, any> | null;
  };

  type ServiceCategoryItem = {
    id: string;
    name: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    services?: Record<string, any> | null;
    sortPath?: Record<string, any> | null;
  };

  type ServiceCategoryList = {
    data: ServiceCategoryItem[];
    total: number;
  };

  type ServiceList = {
    data: ServiceItem[];
    total: number;
  };

  type CreateAppointmentParams = {
    id?: string;
    clientId: string;
    staffId: string;
    startAt: string;
    createdAt?: string;
    cancelled: boolean;
    duration?: number;
    endAt?: string;
    appointmentServices?: ServiceItem[];
  };

  type RoomItem = {
    id: string;
    name: string;
    serviceId?: string | null;
    createdAt: string;
    updatedAt: string;
  };

  type RoomList = {
    data: RoomItem[];
    total: number;
  };

  type EquipmentItem = {
    id: string;
    name: string;
    serviceId?: string | null;
    createdAt: string;
    updatedAt: string;
  };

  type EquipmentList = {
    data: EquipmentItem[];
    total: number;
  };

  type LocationItem = {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    address?: {
      line1?: string | null;
      line2?: string | null;
      city?: string | null;
      country?: string | null;
      province?: string | null;
      state?: string | null;
      zip?: string | null;
    } | null;
    arrivalInstructions?: string | null;
    billingContactEmail?: string | null;
    businessName: string;
    contactEmail?: string | null;
    coordinates?: {
      lat?: number | null;
      lng?: number | null;
    } | null;
    externalId?: string | null;
    googlePlaceId?: string | null;
    hours?: Record<string, any>[] | null;
    isRemote: boolean;
    paymentOptions?: Record<string, any>[] | null;
    phone?: string | null;
    showLocationHours: boolean;
    tz: string;
    website?: string | null;
  };

  type LocationList = {
    data: LocationItem[];
    total: number;
  };

  // ===== Booking Session Types =====

  type BookingSessionState =
    | 'DRAFT'
    | 'SERVICES_SET'
    | 'CLIENT_SET'
    | 'TIME_SET'
    | 'STAFF_SET'
    | 'COMPLETED'
    | 'EXPIRED';

  type BookingSessionItem = {
    id: string;
    locationId: string;
    clientId: string | null;
    state: BookingSessionState;
    services: {
      serviceId: string;
      staffId: string | null;
      startTimeOffset: number;
      resources?: Record<string, any>[];
    }[];
    startAt: string | null;
    notes: string | null;
    clientMessage: string | null;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
  };

  // ===== Availability Types =====

  type AvailableSlot = {
    startAt: string;
    endAt: string;
    staffIds: string[];
  };

  type StaffAvailability = {
    staffId: string;
    staffName: string;
    availableSlots: AvailableSlot[];
  };

  type AvailableStaff = {
    staffId: string;
    staffName: string;
  };

  // ===== Cancellation Types =====

  type CancellationReason =
    | 'CLIENT_CANCEL'
    | 'CLIENT_LATE_CANCEL'
    | 'STAFF_CANCEL'
    | 'NO_SHOW'
    | 'MISTAKE'
    | 'MERGED'
    | 'OFFBOARDED'
    | 'VOIDED';

  type AppointmentState =
    | 'BOOKED'
    | 'CONFIRMED'
    | 'ARRIVED'
    | 'ACTIVE'
    | 'FINAL'
    | 'CANCELLED';
}
