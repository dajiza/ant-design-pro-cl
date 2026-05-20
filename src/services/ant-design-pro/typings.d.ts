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

  type CreateClientParams = {
    firstName?: string;
    lastName?: string;
    email?: string;
    mobilePhone?: string;
    dob?: string;
    pronoun?: string;
  };

  type UpdateClientParams = {
    firstName?: string;
    lastName?: string;
    email?: string;
    mobilePhone?: string;
    dob?: string;
    pronoun?: string;
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
    hexColor?: string | null;
  };

  type StaffList = {
    data: StaffItem[];
    total: number;
  };

  type CreateStaffParams = {
    firstName: string;
    roleId: string;
    lastName?: string;
    nickname?: string;
    email?: string;
    mobilePhone?: string;
    bio?: string;
    externalNickname?: string;
    hexColor?: string;
  };

  type UpdateStaffParams = {
    firstName?: string;
    lastName?: string;
    nickname?: string;
    email?: string;
    mobilePhone?: string;
    bio?: string;
    externalNickname?: string;
    roleId?: string;
    enabledForFutureLocations?: boolean;
    hexColor?: string;
  };

  type UpdateStaffLocationParams = {
    locationId: string;
    active: boolean;
  };

  type StaffRoleItem = {
    id: string;
    name: string;
  };

  type StaffRoleList = {
    data: StaffRoleItem[];
    total: number;
  };

  type AppointmentItem = {
    id: string;
    startAt: string;
    createdAt: string;
    cancelled: boolean;
    staffId: string;
    employeeId?: string | null;
    employee?: { id: string; firstName: string; lastName: string | null } | null;
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

  type ServiceCategoryItem = {
    id: string;
    name: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    services?: Record<string, any> | null;
    sortPath?: Record<string, any> | null;
  };

  type CreateAppointmentParams = {
    id?: string;
    clientId: string;
    staffId: string;
    employeeId?: string | null;
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
      employeeId?: string | null;
      startTimeOffset: number;
      startAt?: string | null;
      endAt?: string | null;
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
    compressedSlots?: AvailableSlot[];
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

  // ===== Location Hours Types =====
  type LocationHoursInput = {
    open: boolean;
    start: { hour: number; min: number };
    finish: { hour: number; min: number };
  };

  type UpdateLocationParams = {
    coordinates?: { latitude: number; longitude: number };
    externalId?: string;
  };

  // ===== Service Category Types =====
  type ServiceCategoryItem = {
    id: string;
    name: string;
    active: boolean;
    sortPath?: string | null;
    services?: Record<string, any> | null;
    createdAt: string;
    updatedAt: string;
  };

  type ServiceCategoryList = {
    data: ServiceCategoryItem[];
    hasNextPage: boolean;
  };

  type CreateServiceCategoryParams = {
    name: string;
  };

  type UpdateServiceCategoryParams = {
    name?: string;
  };

  // ===== Service Types =====
  type ServiceItem = {
    id: string;
    name: string;
    active: boolean;
    addon: boolean;
    description?: string | null;
    externalId?: string | null;
    categoryId: string;
    category: { id: string; name: string };
    defaultDuration: number;
    defaultPrice: number;
    sortPath: string;
    custom?: Record<string, any>;
    customFields?: Record<string, any>[];
    serviceStatus?: { active: boolean; bookable: boolean };
    serviceOverrides?: Record<string, any>;
    serviceOptionGroups?: Record<string, any>[];
    addons?: Record<string, any>[];
    createdAt: string;
    updatedAt: string;
  };

  type ServiceList = {
    data: ServiceItem[];
    total: number;
  };

  type CreateServiceParams = {
    name: string;
    categoryId: string;
    addon?: boolean;
    description?: string;
    externalId?: string;
  };

  type UpdateServiceParams = {
    name?: string;
    categoryId?: string;
    addon?: boolean;
    description?: string;
    externalId?: string;
    customFields?: { key: string; textValue?: string; booleanValue?: boolean; integerValue?: number; floatValue?: number }[];
  };

  type ActivateServiceParams = {
    locationId: string;
  };

  // ===== Overlap Config Types =====
  type OverlapConfig = {
    id: string;
    serviceId: string;
    locationId: string | null;
    staffFreeHead: number;
    staffFreeTail: number;
    createdAt: string;
    updatedAt: string;
  };

  // ===== Shift Types =====
  type ShiftItem = {
    id: string;
    available: boolean;
    day?: number | null;
    clockIn?: string | null;
    clockOut?: string | null;
    locationId: string;
    bookingInterval?: number | null;
    recurrence?: string | null;
    recurrenceEnd?: string | null;
    recurrenceInterval?: number | null;
    recurrenceStart?: string | null;
    resourceId?: string | null;
    staffId?: string | null;
    unavailableReason?: string | null;
  };

  type ShiftList = {
    data: ShiftItem[];
    hasNextPage: boolean;
  };

  type CreateShiftParams = {
    staffId: string;
    locationId: string;
    available: boolean;
    day?: number | null;
    clockIn: string;
    clockOut: string;
    bookingInterval?: number | null;
    recurrence?: string | null;
    recurrenceEnd?: string | null;
    recurrenceInterval?: number | null;
    recurrenceStart?: string | null;
    resourceId?: string | null;
    unavailableReason?: string | null;
  };

  type UnpublishShiftParams = {
    staffId: string;
    locationId: string;
    day: number;
    startIso8601: string;
    endIso8601?: string;
  };

  // ===== Timeblock Types =====
  type TimeblockItem = {
    id: string;
    cancelled?: boolean | null;
    duration: number;
    endAt: string;
    location: { id: string; name?: string };
    reason?: 'BUSINESS' | 'PERSONAL' | null;
    staff: { id: string; firstName?: string; lastName?: string; displayName?: string };
    staffId: string;
    startAt: string;
    title?: string | null;
  };

  type TimeblockList = {
    data: TimeblockItem[];
    total: number;
  };

  type CreateTimeblockParams = {
    staffId: string;
    locationId: string;
    startTime: string;
    duration: number;
    title?: string;
    reason?: 'BUSINESS' | 'PERSONAL';
    recurring?: {
      frequency: string;
      interval: number;
      endAfter?: { count?: number; datetime?: string };
    };
  };

  // ===== Employee Types =====

  type EmployeeItem = {
    id: string;
    firstName: string;
    lastName?: string | null;
    mobilePhone?: string | null;
    email?: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  };

  type EmployeeList = {
    data: EmployeeItem[];
    total: number;
  };

  type CreateEmployeeParams = {
    firstName: string;
    lastName?: string;
    mobilePhone?: string;
    email?: string;
  };

  type UpdateEmployeeParams = {
    firstName?: string;
    lastName?: string | null;
    mobilePhone?: string | null;
    email?: string | null;
    active?: boolean;
  };

  type CheckoutRequest = {
    staffId: string;
    notifyClient?: boolean;
    gratuity?: { amount: number; staffId: string };
    products?: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      sellerId?: string;
    }>;
    discount?: {
      amount?: number;
      percentage?: number;
      reason?: string;
    };
    taxAmount?: number;
    payment?: {
      method: 'SQUARE_CARD' | 'MANUAL_CASH' | 'MANUAL_OTHER';
      amount: number;
      sourceId?: string;
      currency?: string;
    };
  };

  type CheckoutResponse = {
    appointment: API.AppointmentItem;
    order: {
      id: string;
      number: string | null;
      appointmentId: string;
      state: string;
      clientId: string | null;
      locationId: string | null;
      staffId: string | null;
      gratuityStaffId: string | null;
      note: string | null;
      initialSubtotal: number;
      initialDiscountAmount: number;
      initialFeeAmount: number;
      initialGratuityAmount: number;
      initialTaxAmount: number;
      initialTotal: number;
      currentSubtotal: number;
      currentDiscountAmount: number;
      currentFeeAmount: number;
      currentGratuityAmount: number;
      currentTaxAmount: number;
      currentTotal: number;
      refundAmount: number;
      lineGroups: any | null;
      paymentGroups: any | null;
    };
    payment: {
      id: string;
      amount: number;
      currency: string;
      method: string;
      source: string;
      status: string;
      squarePaymentId: string | null;
      cardBrand: string | null;
      cardLast4: string | null;
      refundAmount: number;
    } | null;
  };
}
