import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import type {
  DatesSetArg,
  EventClickArg,
  EventDropArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import type {} from '@fullcalendar/resource'; // Import for type augmentation
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useIntl } from '@umijs/max';
import {
  Button,
  DatePicker,
  Input,
  Modal,
  message,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { createStyles } from 'antd-style';
import dayjs from 'dayjs';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createAppointment,
  getAppointments,
  getAppointmentsByDateRange,
  getClients,
  getEquipment,
  getEquipmentByService,
  getRooms,
  getRoomsByService,
  getServices,
  getStaff,
  updateAppointment,
} from '@/services/ant-design-pro/api';

const { Text } = Typography;

const useStyles = createStyles(({ token }) => ({
  calendarContainer: {
    padding: 24,
    background: token.colorBgContainer,
    borderRadius: token.borderRadius,
    '.fc': {
      '--fc-border-color': token.colorBorderSecondary,
      '--fc-button-bg-color': token.colorPrimary,
      '--fc-button-border-color': token.colorPrimary,
      '--fc-button-hover-bg-color': token.colorPrimaryHover,
      '--fc-button-hover-border-color': token.colorPrimaryHover,
      '--fc-button-active-bg-color': token.colorPrimaryActive,
      '--fc-button-active-border-color': token.colorPrimaryActive,
      '--fc-today-bg-color': token.colorPrimaryBg,
      '--fc-neutral-bg-color': token.colorBgLayout,
      '--fc-page-bg-color': token.colorBgContainer,
      '--fc-highlight-color': token.colorPrimaryBg,
      // Resource column header styles
      '.fc-col-header-cell-cushion': {
        fontSize: 11,
        fontWeight: 500,
      },
      '.fc-scrollgrid-sync-inner': {
        fontSize: 11,
      },
      // Resource name in column header
      '.fc-timegrid-axis': {
        fontSize: 11,
      },
      '.fc-col-header-cell': {
        fontSize: 11,
        '.fc-col-header-cell-cushion': {
          fontSize: 11,
          wordBreak: 'break-all',
        },
      },
      '.fc-datagrid-cell': {
        '.fc-datagrid-cell-main': {
          fontSize: 11,
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      },
      // Resource title in header
      '.fc-resource': {
        fontSize: 11,
        fontWeight: 500,
      },
    },
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 500,
  },
  filterBar: {
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewBar: {
    marginBottom: 16,
    padding: '12px 16px',
    background: '#e6f4ff',
    borderRadius: 8,
    border: '1px solid #91caff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlotsContainer: {
    marginTop: 8,
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    maxHeight: 300,
    overflowY: 'auto',
  },
}));

// Check if time ranges overlap
const isTimeOverlapping = (
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean => {
  return start1 < end2 && start2 < end1;
};

// Generate time slots for a given date
const generateTimeSlots = (
  date: dayjs.Dayjs,
  serviceDuration: number,
  bookedAppointments: API.AppointmentItem[],
  roomAppointments: API.AppointmentItem[] = [],
  equipmentAppointments: API.AppointmentItem[] = [],
  selectedRoom?: string,
  selectedEquipment?: string,
) => {
  const slots: { time: string; available: boolean; datetime: Date }[] = [];
  const startHour = 8;
  const endHour = 22;
  const slotDuration = 30;

  const startOfDay = date.hour(startHour).minute(0).second(0);
  const endOfDay = date.hour(endHour).minute(0).second(0);

  let currentSlot = startOfDay;
  while (currentSlot.isBefore(endOfDay)) {
    const slotStart = currentSlot.toDate();
    const slotEnd = currentSlot.add(serviceDuration, 'minute').toDate();

    // Check staff availability
    const isStaffBooked = bookedAppointments.some((apt) => {
      const aptStart = new Date(apt.startAt);
      const aptEnd = apt.endAt
        ? new Date(apt.endAt)
        : new Date(aptStart.getTime() + (apt.duration || 3600) * 1000);
      return isTimeOverlapping(slotStart, slotEnd, aptStart, aptEnd);
    });

    // Check room availability
    const isRoomBooked =
      selectedRoom &&
      roomAppointments.some((apt) => {
        if (apt.roomId !== selectedRoom) return false;
        const aptStart = new Date(apt.startAt);
        const aptEnd = apt.endAt
          ? new Date(apt.endAt)
          : new Date(aptStart.getTime() + (apt.duration || 3600) * 1000);
        return isTimeOverlapping(slotStart, slotEnd, aptStart, aptEnd);
      });

    // Check equipment availability
    const isEquipmentBooked =
      selectedEquipment &&
      equipmentAppointments.some((apt) => {
        if (apt.equipmentId !== selectedEquipment) return false;
        const aptStart = new Date(apt.startAt);
        const aptEnd = apt.endAt
          ? new Date(apt.endAt)
          : new Date(aptStart.getTime() + (apt.duration || 3600) * 1000);
        return isTimeOverlapping(slotStart, slotEnd, aptStart, aptEnd);
      });

    const isPast = slotStart < new Date();

    slots.push({
      time: currentSlot.format('HH:mm'),
      available:
        !isStaffBooked && !isRoomBooked && !isEquipmentBooked && !isPast,
      datetime: slotStart,
    });
    currentSlot = currentSlot.add(slotDuration, 'minute');
  }

  return slots;
};

// Generate UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Service selection type for multi-service appointments
interface ServiceSelection {
  id: string; // Temporary ID
  serviceId: string; // Service ID
  staffId: string; // Staff ID
  roomId?: string; // Room ID (optional)
  equipmentId?: string; // Equipment ID (optional)
  duration: number; // Duration in minutes
}

// Preview event item for multi-service preview
interface PreviewEventItem {
  id: string;
  serviceIndex: number;
  start: Date;
  end: Date;
  serviceId: string;
  staffId: string;
  roomId?: string;
  equipmentId?: string;
}

// Conflict check result for each service
interface ServiceConflict {
  serviceIndex: number;
  hasConflict: boolean;
  staff: boolean;
  room: boolean;
  equipment: boolean;
}

const AppointmentCalendar: React.FC = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const calendarRef = useRef<FullCalendar>(null);

  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<API.StaffItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [allRooms, setAllRooms] = useState<API.RoomItem[]>([]);
  const [allEquipment, setAllEquipment] = useState<API.EquipmentItem[]>([]);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string | null>(
    null,
  );
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState<
    string | null
  >(null);
  const [events, setEvents] = useState<any[]>([]);
  const [currentStart, setCurrentStart] = useState<string | null>(null);
  const [currentEnd, setCurrentEnd] = useState<string | null>(null);

  // Resource type for column view: 'none' | 'room' | 'staff' | 'equipment'
  const [resourceType, setResourceType] = useState<
    'none' | 'room' | 'staff' | 'equipment'
  >('room');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [clickedDate, setClickedDate] = useState<dayjs.Dayjs | null>(null);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<API.AppointmentItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState<dayjs.Dayjs | null>(null);
  const [editStaffId, setEditStaffId] = useState<string | undefined>();
  const [editRoomId, setEditRoomId] = useState<string | undefined>();
  const [editEquipmentId, setEditEquipmentId] = useState<string | undefined>();
  const [editNotes, setEditNotes] = useState<string>('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Form state
  const [clients, setClients] = useState<API.ClientItem[]>([]);
  const [services, setServices] = useState<API.ServiceItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | undefined>();
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [selectedStaff, setSelectedStaff] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [bookedAppointments, setBookedAppointments] = useState<
    API.AppointmentItem[]
  >([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Room and Equipment state
  const [rooms, setRooms] = useState<API.RoomItem[]>([]);
  const [equipment, setEquipment] = useState<API.EquipmentItem[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | undefined>();
  const [selectedEquipment, setSelectedEquipment] = useState<
    string | undefined
  >();
  const [resourceLoading, setResourceLoading] = useState(false);
  const [roomAppointments, setRoomAppointments] = useState<
    API.AppointmentItem[]
  >([]);
  const [equipmentAppointments, setEquipmentAppointments] = useState<
    API.AppointmentItem[]
  >([]);

  // Multi-service selection state
  const [serviceSelections, setServiceSelections] = useState<
    ServiceSelection[]
  >([]);
  const [serviceResources, setServiceResources] = useState<
    Map<
      string,
      {
        rooms: API.RoomItem[];
        equipment: API.EquipmentItem[];
        loading: boolean;
      }
    >
  >(new Map());

  // Preview events state (supports multiple preview events)
  const [previewEvents, setPreviewEvents] = useState<PreviewEventItem[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewConflicts, setPreviewConflicts] = useState<{
    hasConflict: boolean;
    staff: boolean;
    room: boolean;
    equipment: boolean;
    staffOverlap: boolean;
  }>({
    hasConflict: false,
    staff: false,
    room: false,
    equipment: false,
    staffOverlap: false,
  });

  // Multi-service conflicts (for future use)
  const [serviceConflicts, setServiceConflicts] = useState<ServiceConflict[]>(
    [],
  );

  // Legacy single preview event (for backward compatibility)
  const [previewEvent, setPreviewEvent] = useState<{
    start: Date;
    end: Date;
    resourceId?: string;
  } | null>(null);
  const [legacyPreviewConflicts, setLegacyPreviewConflicts] = useState<{
    hasConflict: boolean;
    staff: boolean;
    room: boolean;
    equipment: boolean;
    staffOverlap: boolean;
  }>({
    hasConflict: false,
    staff: false,
    room: false,
    equipment: false,
    staffOverlap: false,
  });

  // Check preview event conflicts
  const checkPreviewConflicts = useCallback(
    (preview: typeof previewEvent) => {
      if (!preview || !selectedStaff) {
        setPreviewConflicts({
          hasConflict: false,
          staff: false,
          room: false,
          equipment: false,
          staffOverlap: false,
        });
        return;
      }

      const previewStart = preview.start;
      const previewEnd = preview.end;
      const STAFF_OVERLAP_BUFFER = 30 * 60 * 1000; // 30 minutes in milliseconds

      // Check staff conflicts (with 30min buffer)
      const staffConflict = bookedAppointments.some((apt) => {
        const aptStart = new Date(apt.startAt);
        const aptEnd = apt.endAt
          ? new Date(apt.endAt)
          : new Date(aptStart.getTime() + (apt.duration || 3600) * 1000);

        // For staff, allow 30 minutes overlap at start and end
        const adjustedPreviewStart = new Date(
          previewStart.getTime() + STAFF_OVERLAP_BUFFER,
        );
        const adjustedPreviewEnd = new Date(
          previewEnd.getTime() - STAFF_OVERLAP_BUFFER,
        );

        // If the appointment is shorter than 60 minutes, no overlap is allowed
        if (adjustedPreviewEnd <= adjustedPreviewStart) {
          return isTimeOverlapping(previewStart, previewEnd, aptStart, aptEnd);
        }
        return isTimeOverlapping(
          adjustedPreviewStart,
          adjustedPreviewEnd,
          aptStart,
          aptEnd,
        );
      });

      // Check room conflicts (no overlap allowed)
      const roomConflict =
        selectedRoom &&
        roomAppointments.some((apt) => {
          if (apt.roomId !== selectedRoom) return false;
          const aptStart = new Date(apt.startAt);
          const aptEnd = apt.endAt
            ? new Date(apt.endAt)
            : new Date(aptStart.getTime() + (apt.duration || 3600) * 1000);
          return isTimeOverlapping(previewStart, previewEnd, aptStart, aptEnd);
        });

      // Check equipment conflicts (no overlap allowed)
      const equipmentConflict =
        selectedEquipment &&
        equipmentAppointments.some((apt) => {
          if (apt.equipmentId !== selectedEquipment) return false;
          const aptStart = new Date(apt.startAt);
          const aptEnd = apt.endAt
            ? new Date(apt.endAt)
            : new Date(aptStart.getTime() + (apt.duration || 3600) * 1000);
          return isTimeOverlapping(previewStart, previewEnd, aptStart, aptEnd);
        });

      // Check if there's any overlap with existing events on the calendar
      const eventsConflict = events.some((evt) => {
        if (evt.id === 'preview-appointment') return false;
        const evtStart = new Date(evt.start);
        const evtEnd = new Date(evt.end);

        // Check based on resource type
        if (resourceType === 'staff' && evt.resourceId === selectedStaff) {
          // For staff, use the same 30min buffer logic
          const adjustedPreviewStart = new Date(
            previewStart.getTime() + STAFF_OVERLAP_BUFFER,
          );
          const adjustedPreviewEnd = new Date(
            previewEnd.getTime() - STAFF_OVERLAP_BUFFER,
          );
          if (adjustedPreviewEnd <= adjustedPreviewStart) {
            return isTimeOverlapping(
              previewStart,
              previewEnd,
              evtStart,
              evtEnd,
            );
          }
          return isTimeOverlapping(
            adjustedPreviewStart,
            adjustedPreviewEnd,
            evtStart,
            evtEnd,
          );
        } else if (resourceType === 'room' && evt.resourceId === selectedRoom) {
          return isTimeOverlapping(previewStart, previewEnd, evtStart, evtEnd);
        } else if (
          resourceType === 'equipment' &&
          evt.resourceId === selectedEquipment
        ) {
          return isTimeOverlapping(previewStart, previewEnd, evtStart, evtEnd);
        }
        return false;
      });

      const hasConflict =
        staffConflict || roomConflict || equipmentConflict || eventsConflict;

      setPreviewConflicts({
        hasConflict,
        staff: staffConflict || eventsConflict,
        room: !!roomConflict,
        equipment: !!equipmentConflict,
        staffOverlap: staffConflict, // This indicates if staff has any overlap (even allowed)
      });
    },
    [
      selectedStaff,
      selectedRoom,
      selectedEquipment,
      bookedAppointments,
      roomAppointments,
      equipmentAppointments,
      events,
      resourceType,
    ],
  );

  // Check conflicts when preview event changes
  useEffect(() => {
    if (previewEvent) {
      checkPreviewConflicts(previewEvent);
    } else {
      setPreviewConflicts({
        hasConflict: false,
        staff: false,
        room: false,
        equipment: false,
        staffOverlap: false,
      });
    }
  }, [previewEvent, checkPreviewConflicts]);

  // Check conflicts for multi-service preview events
  useEffect(() => {
    if (previewEvents.length === 0) {
      setServiceConflicts([]);
      return;
    }

    const STAFF_OVERLAP_BUFFER = 30 * 60 * 1000; // 30 minutes in milliseconds
    const conflicts: ServiceConflict[] = [];

    previewEvents.forEach((pe, index) => {
      const previewStart = pe.start;
      const previewEnd = pe.end;

      // Check staff conflicts (with 30min buffer)
      const staffConflict = events.some((evt) => {
        if (evt.id?.startsWith('preview-')) return false;
        const evtStart = new Date(evt.start);
        const evtEnd = new Date(evt.end);

        // Check if this event belongs to the same staff
        const evtStaffId = evt.extendedProps?.appointment?.staffId;
        if (evtStaffId !== pe.staffId) return false;

        // For staff, allow 30 minutes overlap
        const adjustedPreviewStart = new Date(
          previewStart.getTime() + STAFF_OVERLAP_BUFFER,
        );
        const adjustedPreviewEnd = new Date(
          previewEnd.getTime() - STAFF_OVERLAP_BUFFER,
        );

        if (adjustedPreviewEnd <= adjustedPreviewStart) {
          return isTimeOverlapping(previewStart, previewEnd, evtStart, evtEnd);
        }
        return isTimeOverlapping(
          adjustedPreviewStart,
          adjustedPreviewEnd,
          evtStart,
          evtEnd,
        );
      });

      // Check room conflicts (no overlap allowed)
      const roomConflict =
        pe.roomId &&
        events.some((evt) => {
          if (evt.id?.startsWith('preview-')) return false;
          const evtStart = new Date(evt.start);
          const evtEnd = new Date(evt.end);
          const evtRoomId = evt.extendedProps?.appointment?.roomId;
          if (evtRoomId !== pe.roomId) return false;
          return isTimeOverlapping(previewStart, previewEnd, evtStart, evtEnd);
        });

      // Check equipment conflicts (no overlap allowed)
      const equipmentConflict =
        pe.equipmentId &&
        events.some((evt) => {
          if (evt.id?.startsWith('preview-')) return false;
          const evtStart = new Date(evt.start);
          const evtEnd = new Date(evt.end);
          const evtEquipmentId = evt.extendedProps?.appointment?.equipmentId;
          if (evtEquipmentId !== pe.equipmentId) return false;
          return isTimeOverlapping(previewStart, previewEnd, evtStart, evtEnd);
        });

      // Check conflicts with other preview events (same staff/room/equipment)
      const internalConflict = previewEvents.some((otherPe, otherIndex) => {
        if (index === otherIndex) return false;

        // Check staff overlap (with buffer)
        if (otherPe.staffId === pe.staffId) {
          const adjustedStart = new Date(
            previewStart.getTime() + STAFF_OVERLAP_BUFFER,
          );
          const adjustedEnd = new Date(
            previewEnd.getTime() - STAFF_OVERLAP_BUFFER,
          );
          if (adjustedEnd <= adjustedStart) {
            return isTimeOverlapping(
              previewStart,
              previewEnd,
              otherPe.start,
              otherPe.end,
            );
          }
          return isTimeOverlapping(
            adjustedStart,
            adjustedEnd,
            otherPe.start,
            otherPe.end,
          );
        }

        // Check room overlap (no buffer)
        if (otherPe.roomId && otherPe.roomId === pe.roomId) {
          return isTimeOverlapping(
            previewStart,
            previewEnd,
            otherPe.start,
            otherPe.end,
          );
        }

        // Check equipment overlap (no buffer)
        if (otherPe.equipmentId && otherPe.equipmentId === pe.equipmentId) {
          return isTimeOverlapping(
            previewStart,
            previewEnd,
            otherPe.start,
            otherPe.end,
          );
        }

        return false;
      });

      conflicts.push({
        serviceIndex: index,
        hasConflict:
          staffConflict ||
          !!roomConflict ||
          !!equipmentConflict ||
          internalConflict,
        staff: staffConflict || internalConflict,
        room: !!roomConflict,
        equipment: !!equipmentConflict,
      });
    });

    setServiceConflicts(conflicts);
  }, [previewEvents, events]);

  // Resources for calendar columns based on resourceType
  const calendarResources = useMemo(() => {
    switch (resourceType) {
      case 'none':
        return []; // No resource columns
      case 'staff':
        return staffList.map((staff) => ({
          id: staff.id,
          title:
            staff.displayName ||
            staff.name ||
            `${staff.firstName || ''} ${staff.lastName || ''}`.trim() ||
            staff.email,
        }));
      case 'equipment':
        return allEquipment.map((eq) => ({
          id: eq.id,
          title: eq.name,
        }));
      case 'room':
      default:
        return allRooms.map((room) => ({
          id: room.id,
          title: room.name,
        }));
    }
  }, [resourceType, staffList, allEquipment, allRooms]);

  // Get resource ID from appointment based on resourceType
  const getResourceIdFromAppointment = useCallback(
    (appointment: API.AppointmentItem) => {
      switch (resourceType) {
        case 'none':
          return undefined;
        case 'staff':
          return appointment.staffId;
        case 'equipment':
          return appointment.equipmentId || undefined;
        case 'room':
        default:
          return appointment.roomId || undefined;
      }
    },
    [resourceType],
  );

  // Multi-service management functions
  const addServiceSelection = useCallback(() => {
    const newSelection: ServiceSelection = {
      id: generateUUID(),
      serviceId: '',
      staffId: '',
      roomId: undefined,
      equipmentId: undefined,
      duration: 0,
    };
    setServiceSelections((prev) => [...prev, newSelection]);
  }, []);

  const removeServiceSelection = useCallback((id: string) => {
    setServiceSelections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateServiceSelection = useCallback(
    (id: string, updates: Partial<ServiceSelection>) => {
      setServiceSelections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
    },
    [],
  );

  // Calculate total duration of all services
  const totalServicesDuration = useMemo(() => {
    return serviceSelections.reduce((sum, s) => sum + s.duration, 0);
  }, [serviceSelections]);

  // Check if all services are valid (have service and staff selected)
  const allServicesValid = useMemo(() => {
    if (serviceSelections.length === 0) return false;
    return serviceSelections.every((s) => s.serviceId && s.staffId);
  }, [serviceSelections]);

  // Load resources (rooms, equipment) for a specific service
  const loadServiceResources = useCallback(
    async (selectionId: string, serviceId: string) => {
      if (!serviceId) {
        setServiceResources((prev) => {
          const newMap = new Map(prev);
          newMap.delete(selectionId);
          return newMap;
        });
        return;
      }

      setServiceResources((prev) => {
        const newMap = new Map(prev);
        newMap.set(selectionId, { rooms: [], equipment: [], loading: true });
        return newMap;
      });

      try {
        const [roomsRes, equipmentRes] = await Promise.all([
          getRoomsByService(serviceId).catch(() => []) as Promise<
            API.RoomItem[]
          >,
          getEquipmentByService(serviceId).catch(() => []) as Promise<
            API.EquipmentItem[]
          >,
        ]);

        setServiceResources((prev) => {
          const newMap = new Map(prev);
          newMap.set(selectionId, {
            rooms: Array.isArray(roomsRes) ? roomsRes : [],
            equipment: Array.isArray(equipmentRes) ? equipmentRes : [],
            loading: false,
          });
          return newMap;
        });
      } catch (error) {
        console.error('Failed to load service resources', error);
        setServiceResources((prev) => {
          const newMap = new Map(prev);
          newMap.set(selectionId, { rooms: [], equipment: [], loading: false });
          return newMap;
        });
      }
    },
    [],
  );

  // Fetch staff list
  const fetchStaffList = async () => {
    try {
      const response = await getStaff({ limit: 50 });
      setStaffList(response.data.filter((staff) => staff.active));
    } catch (error) {
      message.error('Failed to load staff');
    }
  };

  // Fetch all rooms for filter
  const fetchAllRooms = async () => {
    try {
      const response = await getRooms({ limit: 100 });
      setAllRooms(response.data);
    } catch (error) {
      console.error('Failed to load rooms', error);
    }
  };

  // Fetch all equipment for filter
  const fetchAllEquipment = async () => {
    try {
      const response = await getEquipment({ limit: 100 });
      setAllEquipment(response.data);
    } catch (error) {
      console.error('Failed to load equipment', error);
    }
  };

  // Fetch appointments by date range
  const fetchAppointments = async (start: string, end: string) => {
    try {
      const response = await getAppointmentsByDateRange({
        startDate: start,
        endDate: end,
      });

      let filteredData = response.data;
      if (selectedStaffId) {
        filteredData = filteredData.filter(
          (apt) => apt.staffId === selectedStaffId,
        );
      }
      if (selectedRoomFilter) {
        filteredData = filteredData.filter(
          (apt) => apt.roomId === selectedRoomFilter,
        );
      }
      if (selectedEquipmentFilter) {
        filteredData = filteredData.filter(
          (apt) => apt.equipmentId === selectedEquipmentFilter,
        );
      }

      const calendarEvents = filteredData.map((appointment) => {
        const clientName =
          appointment.client?.name ||
          [appointment.client?.firstName, appointment.client?.lastName]
            .filter(Boolean)
            .join(' ') ||
          'No Client';

        // Get staff name from staffList by staffId
        const staff = staffList.find((s) => s.id === appointment.staffId);
        const staffName =
          staff?.displayName ||
          staff?.name ||
          [staff?.firstName, staff?.lastName].filter(Boolean).join(' ') ||
          'Unknown Staff';

        const serviceName = appointment.appointmentServices
          ?.map((service) => service.name)
          .join(', ');
        return {
          id: appointment.id,
          title: `${clientName} - ${staffName} - ${serviceName}`,
          start: appointment.startAt,
          end:
            appointment.endAt ||
            new Date(
              new Date(appointment.startAt).getTime() +
                (appointment.duration || 3600) * 1000,
            ).toISOString(),
          backgroundColor: appointment.cancelled ? '#ff4d4f' : undefined,
          borderColor: appointment.cancelled ? '#ff4d4f' : undefined,
          resourceId: getResourceIdFromAppointment(appointment),
          extendedProps: {
            appointment,
          },
        };
      });
      setEvents(calendarEvents);
    } catch (error) {
      message.error('Failed to load appointments');
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchStaffList(),
        fetchAllRooms(),
        fetchAllEquipment(),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  // Reload appointments when filters or resourceType change
  useEffect(() => {
    if (currentStart && currentEnd) {
      setLoading(true);
      fetchAppointments(currentStart, currentEnd).finally(() =>
        setLoading(false),
      );
    }
  }, [
    selectedStaffId,
    selectedRoomFilter,
    selectedEquipmentFilter,
    resourceType,
  ]);

  // Handle dates change (navigation)
  const handleDatesSet = useCallback(
    async (arg: DatesSetArg) => {
      const start = arg.startStr;
      const end = arg.endStr;

      if (start !== currentStart || end !== currentEnd) {
        setCurrentStart(start);
        setCurrentEnd(end);
        setLoading(true);
        await fetchAppointments(start, end);
        setLoading(false);
      }
    },
    [currentStart, currentEnd, selectedStaffId],
  );

  // Handle event drag and drop
  const handleEventDrop = async (arg: EventDropArg) => {
    const { event, revert, newResource, oldResource } = arg;
    const appointmentId = event.id;
    const newStart = event.start?.toISOString();
    const newEnd = event.end?.toISOString();

    // Get the new resource from event.getResources() as fallback
    const resources = event.getResources();
    const newResourceId = newResource?.id || resources[0]?.id || null;
    const oldResourceId = oldResource?.id;

    // Get appointment info for confirmation
    const appointment = event.extendedProps.appointment as
      | API.AppointmentItem
      | undefined;
    const clientName =
      appointment?.client?.name ||
      [appointment?.client?.firstName, appointment?.client?.lastName]
        .filter(Boolean)
        .join(' ') ||
      'Client';

    // Get the new time range
    const newStartDate = newStart ? new Date(newStart) : null;
    const newEndDate = newEnd
      ? new Date(newEnd)
      : newStartDate
        ? new Date(
            newStartDate.getTime() + (appointment?.duration || 3600) * 1000,
          )
        : null;

    // Check for conflicts with existing appointments
    const checkConflicts = (): {
      hasConflict: boolean;
      conflictType: string;
      conflictDetails: string;
    } => {
      if (!newStartDate || !newEndDate) {
        return { hasConflict: false, conflictType: '', conflictDetails: '' };
      }

      // Get all events from the calendar (excluding the current one being dragged)
      const otherEvents = events.filter((e) => e.id !== appointmentId);

      // Check based on resource type
      const conflicts: string[] = [];

      // Staff overlap check: allow 30 minutes overlap at start and end
      const STAFF_OVERLAP_BUFFER = 30 * 60 * 1000; // 30 minutes in milliseconds

      const isStaffTimeOverlapping = (
        start1: Date,
        end1: Date,
        start2: Date,
        end2: Date,
      ): boolean => {
        // For staff, shrink the new appointment time by 30 minutes on each side
        // This allows 30 minutes overlap at the beginning and end
        const adjustedStart1 = new Date(
          start1.getTime() + STAFF_OVERLAP_BUFFER,
        );
        const adjustedEnd1 = new Date(end1.getTime() - STAFF_OVERLAP_BUFFER);
        // If the appointment is shorter than 60 minutes, no overlap is allowed
        if (adjustedEnd1 <= adjustedStart1) {
          return isTimeOverlapping(start1, end1, start2, end2);
        }
        return isTimeOverlapping(adjustedStart1, adjustedEnd1, start2, end2);
      };

      // 1. Check current resource type (the columns being displayed)
      if (newResourceId) {
        const sameResourceEvents = otherEvents.filter(
          (e) => e.resourceId === newResourceId,
        );
        const overlapCheck =
          resourceType === 'staff' ? isStaffTimeOverlapping : isTimeOverlapping;
        const hasConflict = sameResourceEvents.some((e) => {
          const eStart = new Date(e.start);
          const eEnd = new Date(e.end);
          return overlapCheck(newStartDate, newEndDate, eStart, eEnd);
        });
        if (hasConflict) {
          const resourceLabel =
            resourceType === 'staff'
              ? 'Staff'
              : resourceType === 'equipment'
                ? 'Equipment'
                : 'Room';
          conflicts.push(resourceLabel);
        }
      }

      // 2. Also check other resource types if the appointment has them
      // Check staff conflict (if not already checked and appointment has staffId)
      if (resourceType !== 'staff' && appointment?.staffId) {
        const staffEvents = otherEvents.filter((e) => {
          const apt = e.extendedProps?.appointment as
            | API.AppointmentItem
            | undefined;
          return apt?.staffId === appointment.staffId;
        });
        const hasConflict = staffEvents.some((e) => {
          const eStart = new Date(e.start);
          const eEnd = new Date(e.end);
          return isStaffTimeOverlapping(newStartDate, newEndDate, eStart, eEnd);
        });
        if (hasConflict) conflicts.push('Staff');
      }

      // Check room conflict (if not already checked and appointment has roomId)
      if (resourceType !== 'room' && appointment?.roomId) {
        const roomEvents = otherEvents.filter((e) => {
          const apt = e.extendedProps?.appointment as
            | API.AppointmentItem
            | undefined;
          return apt?.roomId === appointment.roomId;
        });
        const hasConflict = roomEvents.some((e) => {
          const eStart = new Date(e.start);
          const eEnd = new Date(e.end);
          return isTimeOverlapping(newStartDate, newEndDate, eStart, eEnd);
        });
        if (hasConflict) conflicts.push('Room');
      }

      // Check equipment conflict (if not already checked and appointment has equipmentId)
      if (resourceType !== 'equipment' && appointment?.equipmentId) {
        const equipmentEvents = otherEvents.filter((e) => {
          const apt = e.extendedProps?.appointment as
            | API.AppointmentItem
            | undefined;
          return apt?.equipmentId === appointment.equipmentId;
        });
        const hasConflict = equipmentEvents.some((e) => {
          const eStart = new Date(e.start);
          const eEnd = new Date(e.end);
          return isTimeOverlapping(newStartDate, newEndDate, eStart, eEnd);
        });
        if (hasConflict) conflicts.push('Equipment');
      }

      // 3. If dragging to a new resource, check if that resource is available
      if (
        resourceType === 'staff' &&
        newResourceId &&
        newResourceId !== appointment?.staffId
      ) {
        // Check if the new staff has any appointments at this time
        const staffEvents = otherEvents.filter((e) => {
          const apt = e.extendedProps?.appointment as
            | API.AppointmentItem
            | undefined;
          return apt?.staffId === newResourceId;
        });
        const hasConflict = staffEvents.some((e) => {
          const eStart = new Date(e.start);
          const eEnd = new Date(e.end);
          return isStaffTimeOverlapping(newStartDate, newEndDate, eStart, eEnd);
        });
        if (hasConflict && !conflicts.includes('Staff'))
          conflicts.push('Staff (new)');
      }

      if (
        resourceType === 'room' &&
        newResourceId &&
        newResourceId !== appointment?.roomId
      ) {
        const roomEvents = otherEvents.filter((e) => {
          const apt = e.extendedProps?.appointment as
            | API.AppointmentItem
            | undefined;
          return apt?.roomId === newResourceId;
        });
        const hasConflict = roomEvents.some((e) => {
          const eStart = new Date(e.start);
          const eEnd = new Date(e.end);
          return isTimeOverlapping(newStartDate, newEndDate, eStart, eEnd);
        });
        if (hasConflict && !conflicts.includes('Room'))
          conflicts.push('Room (new)');
      }

      if (
        resourceType === 'equipment' &&
        newResourceId &&
        newResourceId !== appointment?.equipmentId
      ) {
        const equipmentEvents = otherEvents.filter((e) => {
          const apt = e.extendedProps?.appointment as
            | API.AppointmentItem
            | undefined;
          return apt?.equipmentId === newResourceId;
        });
        const hasConflict = equipmentEvents.some((e) => {
          const eStart = new Date(e.start);
          const eEnd = new Date(e.end);
          return isTimeOverlapping(newStartDate, newEndDate, eStart, eEnd);
        });
        if (hasConflict && !conflicts.includes('Equipment'))
          conflicts.push('Equipment (new)');
      }

      return {
        hasConflict: conflicts.length > 0,
        conflictType: conflicts.join(', '),
        conflictDetails: `Conflicts with existing appointments in: ${conflicts.join(', ')}`,
      };
    };

    // Check for conflicts first
    const conflictResult = checkConflicts();

    if (conflictResult.hasConflict) {
      message.error(
        intl.formatMessage(
          {
            id: 'calendar.moveConflict',
            defaultMessage: 'Cannot move appointment: {conflict}',
          },
          { conflict: conflictResult.conflictDetails },
        ),
      );
      revert();
      return;
    }

    // Get resource names based on type
    const getResourceName = (resourceId: string | null | undefined) => {
      if (!resourceId) return '-';
      switch (resourceType) {
        case 'staff': {
          const staff = staffList.find((s) => s.id === resourceId);
          return (
            staff?.displayName ||
            staff?.name ||
            `${staff?.firstName || ''} ${staff?.lastName || ''}`.trim() ||
            '-'
          );
        }
        case 'equipment':
          return allEquipment.find((e) => e.id === resourceId)?.name || '-';
        case 'room':
        default:
          return allRooms.find((r) => r.id === resourceId)?.name || '-';
      }
    };

    const oldResourceName =
      getResourceName(oldResourceId) ||
      getResourceName(
        resourceType === 'staff'
          ? appointment?.staffId
          : resourceType === 'equipment'
            ? appointment?.equipmentId
            : appointment?.roomId,
      );
    const newResourceName = getResourceName(newResourceId);

    // Build update payload based on resource type
    const getUpdatePayload = (): {
      startAt?: string;
      endAt?: string;
      staffId?: string;
      roomId?: string | null;
      equipmentId?: string | null;
    } => {
      const base = {
        startAt: newStart,
        endAt: newEnd,
      };
      switch (resourceType) {
        case 'staff':
          return { ...base, staffId: newResourceId || undefined };
        case 'equipment':
          return { ...base, equipmentId: newResourceId };
        case 'room':
        default:
          return { ...base, roomId: newResourceId };
      }
    };

    // Get resource type label
    const resourceTypeLabel =
      resourceType === 'staff'
        ? 'Staff'
        : resourceType === 'equipment'
          ? 'Equipment'
          : 'Room';

    // Show confirmation modal
    Modal.confirm({
      title: intl.formatMessage({
        id: 'calendar.moveConfirm.title',
        defaultMessage: 'Move Appointment',
      }),
      content: intl.formatMessage(
        {
          id: 'calendar.moveConfirm.contentWithResource',
          defaultMessage:
            'Move appointment for {client} to {date} at {time}?\n{resourceType}: {oldResource} → {newResource}',
        },
        {
          client: clientName,
          date: dayjs(newStart).format('YYYY-MM-DD'),
          time: dayjs(newStart).format('HH:mm'),
          resourceType: resourceTypeLabel,
          oldResource: oldResourceName,
          newResource: newResourceName,
        },
      ),
      okText: intl.formatMessage({
        id: 'common.confirm',
        defaultMessage: 'Confirm',
      }),
      cancelText: intl.formatMessage({
        id: 'common.cancel',
        defaultMessage: 'Cancel',
      }),
      onOk: async () => {
        try {
          await updateAppointment(appointmentId, getUpdatePayload());
          message.success(
            intl.formatMessage({
              id: 'calendar.moveSuccess',
              defaultMessage: 'Appointment moved successfully',
            }),
          );

          // Refresh calendar to ensure data is in sync
          if (currentStart && currentEnd) {
            fetchAppointments(currentStart, currentEnd);
          }
        } catch (error) {
          message.error(
            intl.formatMessage({
              id: 'calendar.moveFailed',
              defaultMessage: 'Failed to move appointment',
            }),
          );
          revert(); // Revert the drag on error
          // Refresh to restore original position
          if (currentStart && currentEnd) {
            fetchAppointments(currentStart, currentEnd);
          }
        }
      },
      onCancel: () => {
        revert(); // Revert the drag if user cancels
      },
    });
  };

  // Handle calendar click - open modal
  const handleDateClick = async (arg: { date: Date; dateStr: string }) => {
    const clicked = dayjs(arg.date);
    setClickedDate(clicked);
    setSelectedDate(clicked);
    setSelectedSlot(null);
    setSelectedClient(undefined);
    setSelectedService(undefined);
    setSelectedStaff(undefined);
    setBookedAppointments([]);
    setModalVisible(true);
    setModalLoading(true);

    try {
      const [clientsRes, servicesRes] = await Promise.all([
        getClients({ page: 1, limit: 100 }),
        getServices({ page: 1, limit: 100 }),
      ]);
      setClients(clientsRes.data);
      setServices(servicesRes.data.filter((s) => s.active && !s.addon));
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle event click - open edit modal
  const handleEventClick = (arg: EventClickArg) => {
    const appointment = arg.event.extendedProps
      .appointment as API.AppointmentItem;
    setSelectedAppointment(appointment);
    setIsEditing(false);
    setEditDate(dayjs(appointment.startAt));
    setEditStaffId(appointment.staffId);
    setEditRoomId(appointment.roomId || undefined);
    setEditEquipmentId(appointment.equipmentId || undefined);
    setEditNotes(appointment.notes || '');
    setEditModalVisible(true);
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setEditModalVisible(false);
    setSelectedAppointment(null);
    setIsEditing(false);
    setEditDate(null);
    setEditStaffId(undefined);
    setEditRoomId(undefined);
    setEditEquipmentId(undefined);
    setEditNotes('');
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedAppointment) return;

    setEditSubmitting(true);
    try {
      await updateAppointment(selectedAppointment.id, {
        startAt: editDate?.toISOString(),
        staffId: editStaffId,
        roomId: editRoomId,
        equipmentId: editEquipmentId,
        notes: editNotes,
      });
      message.success('Appointment updated successfully');
      handleEditModalClose();

      // Refresh calendar
      if (currentStart && currentEnd) {
        fetchAppointments(currentStart, currentEnd);
      }
    } catch (error) {
      message.error('Failed to update appointment');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle cancel appointment
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await updateAppointment(selectedAppointment.id, {
        cancelled: true,
      });
      message.success('Appointment cancelled successfully');
      handleEditModalClose();

      // Refresh calendar
      if (currentStart && currentEnd) {
        fetchAppointments(currentStart, currentEnd);
      }
    } catch (error) {
      message.error('Failed to cancel appointment');
    }
  };

  // Fetch booked appointments when staff and date selected
  useEffect(() => {
    if (selectedStaff && selectedDate) {
      setSlotsLoading(true);
      const startDateStr = selectedDate.startOf('day').toISOString();
      const endDateStr = selectedDate.endOf('day').toISOString();

      getAppointments({
        staffId: selectedStaff,
        startDate: startDateStr,
        endDate: endDateStr,
        limit: 100,
      })
        .then((res) => {
          setBookedAppointments(res.data);
        })
        .finally(() => {
          setSlotsLoading(false);
        });
    }
  }, [selectedStaff, selectedDate]);

  // Load rooms and equipment when service is selected
  useEffect(() => {
    if (selectedService) {
      setResourceLoading(true);
      setSelectedRoom(undefined);
      setSelectedEquipment(undefined);

      Promise.all([
        getRoomsByService(selectedService).catch(() => []),
        getEquipmentByService(selectedService).catch(() => []),
      ])
        .then(([roomsData, equipmentData]) => {
          setRooms(roomsData);
          setEquipment(equipmentData);
        })
        .finally(() => {
          setResourceLoading(false);
        });
    } else {
      setRooms([]);
      setEquipment([]);
      setSelectedRoom(undefined);
      setSelectedEquipment(undefined);
    }
  }, [selectedService]);

  // Fetch room appointments when room and date selected
  useEffect(() => {
    if (selectedRoom && selectedDate) {
      const startDateStr = selectedDate.startOf('day').toISOString();
      const endDateStr = selectedDate.endOf('day').toISOString();

      getAppointments({
        roomId: selectedRoom,
        startDate: startDateStr,
        endDate: endDateStr,
        limit: 100,
      })
        .then((res) => {
          setRoomAppointments(res.data);
        })
        .catch(() => {
          setRoomAppointments([]);
        });
    } else {
      setRoomAppointments([]);
    }
  }, [selectedRoom, selectedDate]);

  // Fetch equipment appointments when equipment and date selected
  useEffect(() => {
    if (selectedEquipment && selectedDate) {
      const startDateStr = selectedDate.startOf('day').toISOString();
      const endDateStr = selectedDate.endOf('day').toISOString();

      getAppointments({
        equipmentId: selectedEquipment,
        startDate: startDateStr,
        endDate: endDateStr,
        limit: 100,
      })
        .then((res) => {
          setEquipmentAppointments(res.data);
        })
        .catch(() => {
          setEquipmentAppointments([]);
        });
    } else {
      setEquipmentAppointments([]);
    }
  }, [selectedEquipment, selectedDate]);

  // Get selected service info (for legacy single-service mode)
  const selectedServiceInfo = useMemo(() => {
    if (!selectedService) return null;
    return services.find((s) => s.id === selectedService);
  }, [selectedService, services]);

  // Generate time slots - supports both single and multi-service modes
  const timeSlots = useMemo(() => {
    // Multi-service mode: use total duration
    if (serviceSelections.length > 0) {
      return generateTimeSlots(
        selectedDate,
        totalServicesDuration,
        bookedAppointments,
        roomAppointments,
        equipmentAppointments,
        undefined, // In multi-service mode, rooms are per-service
        undefined, // In multi-service mode, equipment are per-service
      );
    }
    // Legacy single-service mode
    if (!selectedServiceInfo) return [];
    return generateTimeSlots(
      selectedDate,
      selectedServiceInfo.defaultDuration,
      bookedAppointments,
      roomAppointments,
      equipmentAppointments,
      selectedRoom,
      selectedEquipment,
    );
  }, [
    selectedDate,
    selectedServiceInfo,
    bookedAppointments,
    roomAppointments,
    equipmentAppointments,
    selectedRoom,
    selectedEquipment,
    serviceSelections,
    totalServicesDuration,
  ]);

  // Submit appointment - supports multi-service creation
  const handleSubmit = async () => {
    // Multi-service mode
    if (serviceSelections.length > 0) {
      if (!selectedClient || !selectedSlot || !allServicesValid) {
        message.error(
          intl.formatMessage({
            id: 'calendar.error.selectRequired',
            defaultMessage: 'Please select client, services, staff and time',
          }),
        );
        return;
      }

      // Check for conflicts
      const hasAnyConflict = serviceConflicts.some((c) => c.hasConflict);
      if (hasAnyConflict) {
        message.error(
          intl.formatMessage({
            id: 'calendar.error.hasConflicts',
            defaultMessage:
              'Some services have time conflicts. Please adjust and try again.',
          }),
        );
        return;
      }

      setSubmitting(true);
      try {
        // Build appointment data directly from serviceSelections and selectedSlot
        // This ensures appointments are created even without preview mode
        let currentTime = dayjs(selectedSlot);
        const appointmentsToCreate = serviceSelections.map((selection) => {
          const serviceInfo = services.find(
            (s) => s.id === selection.serviceId,
          );
          if (!serviceInfo) return null;

          const startTime = currentTime.toDate();
          const endTime = currentTime
            .add(serviceInfo.defaultDuration, 'minute')
            .toDate();

          // Move to next service start time
          currentTime = dayjs(endTime);

          return {
            clientId: selectedClient,
            staffId: selection.staffId,
            startAt: startTime.toISOString(),
            cancelled: false,
            duration: serviceInfo.defaultDuration * 60,
            endAt: endTime.toISOString(),
            roomId: selection.roomId || null,
            equipmentId: selection.equipmentId || null,
            appointmentServices: [
              {
                id: serviceInfo.id,
                name: serviceInfo.name,
                defaultDuration: serviceInfo.defaultDuration,
                defaultPrice: serviceInfo.defaultPrice,
                active: true,
                addon: false,
                createdAt: serviceInfo.createdAt || new Date().toISOString(),
                updatedAt: serviceInfo.updatedAt || new Date().toISOString(),
              },
            ],
          };
        });

        // Filter out null entries and create appointments
        const validAppointments = appointmentsToCreate.filter(Boolean);
        if (validAppointments.length === 0) {
          message.error(
            intl.formatMessage({
              id: 'calendar.error.noValidServices',
              defaultMessage: 'No valid services to create appointments',
            }),
          );
          setSubmitting(false);
          return;
        }

        const results = await Promise.all(
          validAppointments.map((data) => createAppointment(data)),
        );

        const successCount = results.filter(Boolean).length;
        message.success(
          intl.formatMessage(
            {
              id: 'calendar.success.appointmentsCreated',
              defaultMessage: '{count} appointment(s) created successfully',
            },
            { count: successCount },
          ),
        );

        setModalVisible(false);
        setServiceSelections([]);
        setPreviewEvents([]);

        // Refresh calendar
        if (currentStart && currentEnd) {
          fetchAppointments(currentStart, currentEnd);
        }
      } catch (error) {
        message.error(
          intl.formatMessage({
            id: 'calendar.error.createFailed',
            defaultMessage: 'Failed to create appointments',
          }),
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Legacy single-service mode
    if (
      !selectedClient ||
      !selectedService ||
      !selectedStaff ||
      !selectedSlot ||
      !selectedServiceInfo
    ) {
      message.error('Please select client, service, staff and time slot');
      return;
    }

    // Check if room is required (rooms available for this service)
    if (rooms.length > 0 && !selectedRoom) {
      message.error('Please select a room');
      return;
    }

    // Check if equipment is required (equipment available for this service)
    if (equipment.length > 0 && !selectedEquipment) {
      message.error('Please select equipment');
      return;
    }

    setSubmitting(true);
    try {
      const startAt = dayjs(selectedSlot);
      const endAt = startAt.add(selectedServiceInfo.defaultDuration, 'minute');

      await createAppointment({
        clientId: selectedClient,
        staffId: selectedStaff,
        startAt: startAt.toISOString(),
        cancelled: false,
        duration: selectedServiceInfo.defaultDuration * 60,
        endAt: endAt.toISOString(),
        roomId: selectedRoom || null,
        equipmentId: selectedEquipment || null,
        appointmentServices: [
          {
            id: selectedServiceInfo.id,
            name: selectedServiceInfo.name,
            defaultDuration: selectedServiceInfo.defaultDuration,
            defaultPrice: selectedServiceInfo.defaultPrice,
            active: true,
            addon: false,
            createdAt:
              selectedServiceInfo.createdAt || new Date().toISOString(),
            updatedAt:
              selectedServiceInfo.updatedAt || new Date().toISOString(),
          },
        ],
      });
      message.success('Appointment created successfully');
      setModalVisible(false);

      // Refresh calendar
      if (currentStart && currentEnd) {
        fetchAppointments(currentStart, currentEnd);
      }
    } catch (error) {
      message.error('Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedClient(undefined);
    setSelectedService(undefined);
    setSelectedStaff(undefined);
    setSelectedRoom(undefined);
    setSelectedEquipment(undefined);
    setSelectedSlot(null);
    setPreviewEvent(null);
    setIsPreviewMode(false);
    // Reset multi-service state
    setServiceSelections([]);
    setPreviewEvents([]);
    setPreviewConflicts({
      hasConflict: false,
      staff: false,
      room: false,
      equipment: false,
      staffOverlap: false,
    });
  };

  // Handle preview on calendar - supports multiple services
  const handlePreviewOnCalendar = useCallback(() => {
    // Check for multi-service mode
    if (serviceSelections.length > 0) {
      if (!selectedSlot || !allServicesValid) {
        message.warning(
          intl.formatMessage({
            id: 'calendar.preview.selectRequired',
            defaultMessage: 'Please select services, staff and time first',
          }),
        );
        return;
      }

      // Generate preview events for each service (consecutive times)
      const previewEventsList: PreviewEventItem[] = [];
      let currentTime = dayjs(selectedSlot);

      serviceSelections.forEach((selection, index) => {
        const serviceInfo = services.find((s) => s.id === selection.serviceId);
        if (!serviceInfo) return;

        const endTime = currentTime.add(serviceInfo.defaultDuration, 'minute');

        // Determine resource ID based on resource type
        let resourceId: string | undefined;
        switch (resourceType) {
          case 'staff':
            resourceId = selection.staffId;
            break;
          case 'room':
            resourceId = selection.roomId;
            break;
          case 'equipment':
            resourceId = selection.equipmentId;
            break;
          default:
            resourceId = undefined;
        }

        previewEventsList.push({
          id: `preview-${index}`,
          serviceIndex: index,
          start: currentTime.toDate(),
          end: endTime.toDate(),
          serviceId: selection.serviceId,
          staffId: selection.staffId,
          roomId: selection.roomId,
          equipmentId: selection.equipmentId,
        });

        // Next service starts immediately after this one
        currentTime = endTime;
      });

      setPreviewEvents(previewEventsList);
      setIsPreviewMode(true);
      setModalVisible(false);
      return;
    }

    // Legacy single-service mode
    if (!selectedSlot || !selectedServiceInfo || !selectedStaff) {
      message.warning(
        intl.formatMessage({
          id: 'calendar.preview.selectRequired',
          defaultMessage: 'Please select staff, service and time first',
        }),
      );
      return;
    }

    const start = dayjs(selectedSlot);
    const end = start.add(selectedServiceInfo.defaultDuration, 'minute');

    // Get resource ID based on current resource type
    let resourceId: string | undefined;
    switch (resourceType) {
      case 'staff':
        resourceId = selectedStaff;
        break;
      case 'room':
        resourceId = selectedRoom || undefined;
        break;
      case 'equipment':
        resourceId = selectedEquipment || undefined;
        break;
      case 'none':
      default:
        resourceId = undefined;
    }

    // If viewing by resource but no specific resource selected, use the first available
    if (!resourceId && resourceType !== 'none') {
      if (resourceType === 'staff' && staffList.length > 0) {
        resourceId = staffList[0].id;
      } else if (resourceType === 'room' && allRooms.length > 0) {
        resourceId = allRooms[0].id;
      } else if (resourceType === 'equipment' && allEquipment.length > 0) {
        resourceId = allEquipment[0].id;
      }
    }

    setPreviewEvent({
      start: start.toDate(),
      end: end.toDate(),
      resourceId,
    });
    setIsPreviewMode(true);
    setModalVisible(false);
  }, [
    selectedSlot,
    selectedServiceInfo,
    selectedStaff,
    selectedRoom,
    selectedEquipment,
    resourceType,
    staffList,
    allRooms,
    allEquipment,
    intl,
    serviceSelections,
    allServicesValid,
    services,
  ]);

  // Handle preview event drop
  const handlePreviewEventDrop = (arg: EventDropArg) => {
    // Check if this is a preview event
    if (arg.event.id !== 'preview-appointment') {
      handleEventDrop(arg);
      return;
    }

    const { event, revert } = arg;
    const newStart = event.start;
    const newEnd = event.end;

    if (!newStart || !newEnd) {
      revert();
      return;
    }

    // Get the new resource from the event
    const resources = event.getResources();
    const newResourceId = resources[0]?.id;

    // Update preview event using functional update
    setPreviewEvent((prev) => {
      if (!prev) return null;
      return {
        start: newStart,
        end: newEnd,
        resourceId: newResourceId || prev.resourceId,
      };
    });

    // Update selected slot and date
    setSelectedSlot(newStart);
    setSelectedDate(dayjs(newStart));

    // Update selected resource based on resource type
    if (newResourceId) {
      if (resourceType === 'staff') {
        setSelectedStaff(newResourceId);
      } else if (resourceType === 'room') {
        setSelectedRoom(newResourceId);
      } else if (resourceType === 'equipment') {
        setSelectedEquipment(newResourceId);
      }
    }
  };

  // Confirm preview appointment - supports multi-service
  const handleConfirmPreview = useCallback(async () => {
    console.log('handleConfirmPreview called', {
      previewEventsLength: previewEvents.length,
      previewEvent: previewEvent,
      selectedClient,
      serviceConflicts,
    });

    // Multi-service mode: create appointments directly
    if (previewEvents.length > 0) {
      // Ensure client is selected before creating appointments (clientId is required)
      if (!selectedClient) {
        message.error(
          intl.formatMessage({
            id: 'calendar.error.selectClientFirst',
            defaultMessage: 'Please select a client',
          }),
        );
        return;
      }

      const clientId = selectedClient;

      if (serviceConflicts.some((c) => c.hasConflict)) {
        message.error(
          intl.formatMessage({
            id: 'calendar.error.hasConflicts',
            defaultMessage: 'Some services have time conflicts',
          }),
        );
        return;
      }

      console.log('Creating appointments for previewEvents:', previewEvents);
      setSubmitting(true);
      try {
        const results = await Promise.all(
          previewEvents.map(async (pe) => {
            const serviceInfo = services.find((s) => s.id === pe.serviceId);
            if (!serviceInfo) return null;

            const appointmentData = {
              clientId,
              staffId: pe.staffId,
              startAt: pe.start.toISOString(),
              cancelled: false,
              duration: serviceInfo.defaultDuration * 60,
              endAt: pe.end.toISOString(),
              roomId: pe.roomId || null,
              equipmentId: pe.equipmentId || null,
              appointmentServices: [
                {
                  id: serviceInfo.id,
                  name: serviceInfo.name,
                  defaultDuration: serviceInfo.defaultDuration,
                  defaultPrice: serviceInfo.defaultPrice,
                  active: true,
                  addon: false,
                  createdAt: serviceInfo.createdAt || new Date().toISOString(),
                  updatedAt: serviceInfo.updatedAt || new Date().toISOString(),
                },
              ],
            };
            console.log('Creating appointment:', appointmentData);
            return createAppointment(appointmentData);
          }),
        );

        const successCount = results.filter(Boolean).length;
        console.log(
          'Creation results:',
          results,
          'success count:',
          successCount,
        );
        message.success(
          intl.formatMessage(
            {
              id: 'calendar.success.appointmentsCreated',
              defaultMessage: '{count} appointment(s) created successfully',
            },
            { count: successCount },
          ),
        );

        setPreviewEvents([]);
        setServiceSelections([]);
        setIsPreviewMode(false);

        // Refresh calendar
        if (currentStart && currentEnd) {
          fetchAppointments(currentStart, currentEnd);
        }
      } catch (error) {
        console.error('Error creating appointments:', error);
        message.error(
          intl.formatMessage({
            id: 'calendar.error.createFailed',
            defaultMessage: 'Failed to create appointments',
          }),
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Legacy single-service mode: return to modal for confirmation
    if (!previewEvent) return;
    setSelectedDate(dayjs(previewEvent.start));
    setSelectedSlot(previewEvent.start);
    setModalVisible(true);
    setIsPreviewMode(false);
  }, [
    previewEvents,
    previewEvent,
    selectedClient,
    serviceConflicts,
    services,
    currentStart,
    currentEnd,
    fetchAppointments,
    intl,
  ]);

  // Cancel preview
  const handleCancelPreview = () => {
    setPreviewEvent(null);
    setPreviewEvents([]);
    setIsPreviewMode(false);
  };

  // Combine calendar events with preview events (supports multiple)
  const displayEvents = useMemo(() => {
    const allEvents = [...events];
    const clientName =
      clients.find((c) => c.id === selectedClient)?.name ||
      [
        clients.find((c) => c.id === selectedClient)?.firstName,
        clients.find((c) => c.id === selectedClient)?.lastName,
      ]
        .filter(Boolean)
        .join(' ') ||
      'Client';

    // Handle multi-service preview events
    if (previewEvents.length > 0) {
      previewEvents.forEach((pe, index) => {
        const serviceInfo = services.find((s) => s.id === pe.serviceId);
        const staff = staffList.find((s) => s.id === pe.staffId);
        const staffName =
          staff?.displayName ||
          staff?.name ||
          [staff?.firstName, staff?.lastName].filter(Boolean).join(' ') ||
          'Staff';
        const serviceName = serviceInfo?.name || 'Service';

        // Check for conflicts for this specific service
        const conflict = serviceConflicts.find((c) => c.serviceIndex === index);
        const hasConflict = conflict?.hasConflict || false;

        // Determine resource ID
        let resourceId: string | undefined;
        switch (resourceType) {
          case 'staff':
            resourceId = pe.staffId;
            break;
          case 'room':
            resourceId = pe.roomId;
            break;
          case 'equipment':
            resourceId = pe.equipmentId;
            break;
          default:
            resourceId = undefined;
        }

        const eventColor = hasConflict ? '#ff4d4f' : '#1677ff';
        const eventBorderColor = hasConflict ? '#ff4d4f' : '#1677ff';

        allEvents.push({
          id: pe.id,
          title: `${clientName} - ${staffName} - ${serviceName} (Preview)`,
          start: pe.start.toISOString(),
          end: pe.end.toISOString(),
          backgroundColor: eventColor,
          borderColor: eventBorderColor,
          resourceId,
          classNames: [
            'preview-event',
            hasConflict ? 'preview-event-conflict' : 'preview-event-ok',
          ],
          editable: true,
          extendedProps: {
            serviceIndex: index,
            serviceId: pe.serviceId,
            staffId: pe.staffId,
            roomId: pe.roomId,
            equipmentId: pe.equipmentId,
          },
        });
      });
    }
    // Handle legacy single preview event
    else if (previewEvent) {
      const staff = staffList.find((s) => s.id === selectedStaff);
      const staffName =
        staff?.displayName ||
        staff?.name ||
        [staff?.firstName, staff?.lastName].filter(Boolean).join(' ') ||
        'Staff';
      const serviceName = selectedServiceInfo?.name || 'Service';

      const eventColor = previewConflicts.hasConflict ? '#ff4d4f' : '#1677ff';
      const eventBorderColor = previewConflicts.hasConflict
        ? '#ff4d4f'
        : '#1677ff';

      allEvents.push({
        id: 'preview-appointment',
        title: `${clientName} - ${staffName} - ${serviceName} (Preview)`,
        start: previewEvent.start.toISOString(),
        end: previewEvent.end.toISOString(),
        backgroundColor: eventColor,
        borderColor: eventBorderColor,
        resourceId: previewEvent.resourceId,
        classNames: [
          'preview-event',
          previewConflicts.hasConflict
            ? 'preview-event-conflict'
            : 'preview-event-ok',
        ],
        editable: true,
      });
    }
    return allEvents;
  }, [
    events,
    previewEvent,
    previewEvents,
    selectedClient,
    selectedStaff,
    selectedServiceInfo,
    staffList,
    clients,
    previewConflicts,
    serviceConflicts,
    services,
    resourceType,
  ]);

  if (loading && staffList.length === 0) {
    return (
      <PageContainer>
        <div className={styles.loadingContainer}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'pages.appointment.calendar.title',
        defaultMessage: 'Appointment Calendar',
      })}
    >
      <div className={styles.filterBar}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            handleDateClick({
              date: new Date(),
              dateStr: dayjs().format('YYYY-MM-DD'),
            })
          }
        >
          {intl.formatMessage({
            id: 'calendar.createAppointment',
            defaultMessage: 'Create Appointment',
          })}
        </Button>
        <Space size="middle">
          <Space>
            <span>
              {intl.formatMessage({
                id: 'calendar.viewBy',
                defaultMessage: 'View by',
              })}
              :
            </span>
            <Select
              style={{ width: 120 }}
              value={resourceType}
              onChange={setResourceType}
              options={[
                {
                  value: 'none',
                  label: intl.formatMessage({
                    id: 'calendar.viewByNone',
                    defaultMessage: 'None',
                  }),
                },
                {
                  value: 'room',
                  label: intl.formatMessage({
                    id: 'calendar.viewByRoom',
                    defaultMessage: 'Room',
                  }),
                },
                {
                  value: 'staff',
                  label: intl.formatMessage({
                    id: 'calendar.viewByStaff',
                    defaultMessage: 'Staff',
                  }),
                },
                {
                  value: 'equipment',
                  label: intl.formatMessage({
                    id: 'calendar.viewByEquipment',
                    defaultMessage: 'Equipment',
                  }),
                },
              ]}
            />
          </Space>
          <Space>
            <span>
              {intl.formatMessage({
                id: 'calendar.filter.staff',
                defaultMessage: 'Staff',
              })}
              :
            </span>
            <Select
              style={{ width: 150 }}
              placeholder={intl.formatMessage({
                id: 'calendar.filter.allStaff',
                defaultMessage: 'All Staff',
              })}
              allowClear
              value={selectedStaffId}
              onChange={setSelectedStaffId}
              options={staffList.map((staff) => ({
                value: staff.id,
                label:
                  staff.displayName ||
                  staff.name ||
                  `${staff.firstName || ''} ${staff.lastName || ''}`.trim() ||
                  staff.email,
              }))}
            />
          </Space>
          <Space>
            <span>
              {intl.formatMessage({
                id: 'calendar.filter.room',
                defaultMessage: 'Room',
              })}
              :
            </span>
            <Select
              style={{ width: 150 }}
              placeholder={intl.formatMessage({
                id: 'calendar.filter.allRooms',
                defaultMessage: 'All Rooms',
              })}
              allowClear
              value={selectedRoomFilter}
              onChange={setSelectedRoomFilter}
              options={allRooms.map((room) => ({
                value: room.id,
                label: room.name,
              }))}
            />
          </Space>
          <Space>
            <span>
              {intl.formatMessage({
                id: 'calendar.filter.equipment',
                defaultMessage: 'Equipment',
              })}
              :
            </span>
            <Select
              style={{ width: 150 }}
              placeholder={intl.formatMessage({
                id: 'calendar.filter.allEquipment',
                defaultMessage: 'All Equipment',
              })}
              allowClear
              value={selectedEquipmentFilter}
              onChange={setSelectedEquipmentFilter}
              options={allEquipment.map((eq) => ({
                value: eq.id,
                label: eq.name,
              }))}
            />
          </Space>
        </Space>
      </div>

      {/* Preview Mode Confirmation Bar - supports multiple services */}
      {(previewEvent || previewEvents.length > 0) && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            background:
              previewConflicts.hasConflict ||
              serviceConflicts.some((c) => c.hasConflict)
                ? '#fff2f0'
                : '#e6f4ff',
            borderRadius: 8,
            border: `1px solid ${previewConflicts.hasConflict || serviceConflicts.some((c) => c.hasConflict) ? '#ffccc7' : '#91caff'}`,
          }}
        >
          {/* Multi-service preview */}
          {previewEvents.length > 0 && (
            <>
              <div style={{ marginBottom: 8 }}>
                <Text
                  strong
                  style={{
                    color: serviceConflicts.some((c) => c.hasConflict)
                      ? '#ff4d4f'
                      : '#1677ff',
                  }}
                >
                  {intl.formatMessage(
                    {
                      id: 'calendar.preview.multiTitle',
                      defaultMessage: 'Preview Mode - {count} Service(s)',
                    },
                    { count: previewEvents.length },
                  )}
                  :{' '}
                </Text>
                <Text>
                  {dayjs(previewEvents[0]?.start).format('YYYY-MM-DD HH:mm')} -{' '}
                  {dayjs(previewEvents[previewEvents.length - 1]?.end).format(
                    'HH:mm',
                  )}{' '}
                  (
                  {intl.formatMessage({
                    id: 'calendar.preview.totalDuration',
                    defaultMessage: 'Total',
                  })}
                  : {totalServicesDuration} min)
                </Text>
              </div>

              {/* Show each service with its status */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                {previewEvents.map((pe, index) => {
                  const serviceInfo = services.find(
                    (s) => s.id === pe.serviceId,
                  );
                  const staff = staffList.find((s) => s.id === pe.staffId);
                  const conflict = serviceConflicts.find(
                    (c) => c.serviceIndex === index,
                  );

                  return (
                    <Tag
                      key={pe.id}
                      color={conflict?.hasConflict ? 'error' : 'success'}
                      style={{ padding: '4px 8px' }}
                    >
                      {index + 1}. {serviceInfo?.name || 'Service'} (
                      {dayjs(pe.start).format('HH:mm')}-
                      {dayjs(pe.end).format('HH:mm')}){' - '}
                      {staff?.displayName || staff?.name || 'Staff'}
                      {conflict?.hasConflict && ' ⚠️'}
                    </Tag>
                  );
                })}
              </div>

              {serviceConflicts.some((c) => c.hasConflict) && (
                <Text type="danger">
                  {intl.formatMessage({
                    id: 'calendar.preview.someConflicts',
                    defaultMessage:
                      'Some services have time conflicts. Please adjust and try again.',
                  })}
                </Text>
              )}
            </>
          )}

          {/* Legacy single-service preview */}
          {previewEvent && previewEvents.length === 0 && (
            <>
              <Text
                strong
                style={{
                  color: previewConflicts.hasConflict ? '#ff4d4f' : '#1677ff',
                }}
              >
                {intl.formatMessage({
                  id: 'calendar.preview.title',
                  defaultMessage: 'Preview Mode',
                })}
                :{' '}
              </Text>
              <Text>
                {dayjs(previewEvent.start).format('YYYY-MM-DD HH:mm')} -{' '}
                {dayjs(previewEvent.end).format('HH:mm')}
              </Text>
              {previewConflicts.hasConflict && (
                <div style={{ marginTop: 4 }}>
                  <Text type="danger">
                    {intl.formatMessage({
                      id: 'calendar.preview.conflict',
                      defaultMessage: 'Time conflict detected',
                    })}
                    :
                  </Text>
                  {previewConflicts.staff && !previewConflicts.staffOverlap && (
                    <Tag color="error" style={{ marginLeft: 4 }}>
                      Staff
                    </Tag>
                  )}
                  {previewConflicts.staffOverlap && (
                    <Tag color="warning" style={{ marginLeft: 4 }}>
                      Staff (30min overlap)
                    </Tag>
                  )}
                  {previewConflicts.room && (
                    <Tag color="error" style={{ marginLeft: 4 }}>
                      Room
                    </Tag>
                  )}
                  {previewConflicts.equipment && (
                    <Tag color="error" style={{ marginLeft: 4 }}>
                      Equipment
                    </Tag>
                  )}
                </div>
              )}
              {!previewConflicts.hasConflict && (
                <Text type="success" style={{ marginLeft: 12 }}>
                  {intl.formatMessage({
                    id: 'calendar.preview.available',
                    defaultMessage: 'Time slot available',
                  })}
                </Text>
              )}
            </>
          )}

          <div
            style={{
              marginTop: 12,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            <Button onClick={handleCancelPreview}>
              {intl.formatMessage({
                id: 'common.cancel',
                defaultMessage: 'Cancel',
              })}
            </Button>
            <Button
              type="primary"
              onClick={handleConfirmPreview}
              disabled={
                previewConflicts.hasConflict ||
                serviceConflicts.some((c) => c.hasConflict)
              }
            >
              {intl.formatMessage({
                id: 'calendar.preview.confirmAndCreate',
                defaultMessage: 'Confirm & Create',
              })}
            </Button>
          </div>
        </div>
      )}

      <div className={styles.calendarContainer}>
        <FullCalendar
          ref={calendarRef}
          key={resourceType} // Force re-render when resourceType changes
          plugins={
            resourceType === 'none'
              ? [timeGridPlugin, dayGridPlugin, interactionPlugin]
              : [resourceTimeGridPlugin, dayGridPlugin, interactionPlugin]
          }
          initialView={
            resourceType === 'none' ? 'timeGridWeek' : 'resourceTimeGridWeek'
          }
          datesAboveResources={resourceType !== 'none'}
          resources={resourceType === 'none' ? undefined : calendarResources}
          headerToolbar={
            resourceType === 'none'
              ? {
                  left: 'prev,next today',
                  center: 'title',
                  right: 'timeGridDay,timeGridWeek,dayGridMonth',
                }
              : {
                  left: 'prev,next today',
                  center: 'title',
                  right:
                    'resourceTimeGridDay,resourceTimeGridWeek,dayGridMonth',
                }
          }
          events={displayEvents}
          datesSet={handleDatesSet}
          eventDrop={handlePreviewEventDrop}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={true}
          droppable={true}
          selectable={true}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          height="auto"
          eventContent={(arg) => {
            const event = arg.event;
            const start = event.start;
            const end = event.end;
            const appointment = event.extendedProps.appointment as
              | API.AppointmentItem
              | undefined;

            // Calculate buffer zones for staff view
            const isStaffView = resourceType === 'staff';
            const bufferMinutes = 30;
            const totalDuration =
              start && end ? (end.getTime() - start.getTime()) / 60000 : 60;
            const bufferPercent =
              totalDuration > 0
                ? Math.min((bufferMinutes / totalDuration) * 100, 50)
                : 0;

            return (
              <div
                style={{
                  padding: '2px 4px',
                  fontSize: '12px',
                  overflow: 'hidden',
                  height: '100%',
                  position: 'relative',
                }}
              >
                {/* Top buffer zone - light green overlay */}
                {isStaffView && totalDuration > bufferMinutes * 2 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: `${bufferPercent}%`,
                      backgroundColor: 'rgba(134, 239, 172, 0.5)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {/* Bottom buffer zone - light green overlay */}
                {isStaffView && totalDuration > bufferMinutes * 2 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${bufferPercent}%`,
                      backgroundColor: 'rgba(134, 239, 172, 0.5)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                <div
                  style={{
                    fontWeight: 500,
                    color: '#fff',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {event.title}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    opacity: 0.8,
                    color: '#fff',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {arg.timeText}
                </div>
                {isStaffView && totalDuration > bufferMinutes * 2 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      right: 4,
                      fontSize: '9px',
                      opacity: 0.7,
                      fontStyle: 'italic',
                      color: '#fff',
                      zIndex: 1,
                    }}
                  >
                    ±30min
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* Create Appointment Modal */}
      <Modal
        title={intl.formatMessage({
          id: 'calendar.modal.createAppointment',
          defaultMessage: 'Create Appointment',
        })}
        open={modalVisible}
        onCancel={handleModalClose}
        width={700}
        footer={[
          <Button key="cancel" onClick={handleModalClose}>
            {intl.formatMessage({
              id: 'common.cancel',
              defaultMessage: 'Cancel',
            })}
          </Button>,
          <Button
            key="preview"
            onClick={handlePreviewOnCalendar}
            disabled={
              !selectedClient ||
              serviceSelections.length === 0 ||
              !allServicesValid ||
              !selectedSlot
            }
          >
            {intl.formatMessage({
              id: 'calendar.modal.previewOnCalendar',
              defaultMessage: 'Preview on Calendar',
            })}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleSubmit}
            disabled={
              !selectedClient ||
              serviceSelections.length === 0 ||
              !allServicesValid ||
              !selectedSlot
            }
          >
            {intl.formatMessage({
              id: 'calendar.modal.confirm',
              defaultMessage: 'Confirm',
            })}
          </Button>,
        ]}
      >
        <Spin spinning={modalLoading}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Date Picker */}
            <div>
              <Text strong>
                {intl.formatMessage({
                  id: 'calendar.modal.date',
                  defaultMessage: 'Date',
                })}
              </Text>
              <DatePicker
                style={{ width: '100%', marginTop: 4 }}
                value={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date || dayjs());
                  setSelectedSlot(null);
                }}
                disabledDate={(current) =>
                  current && current < dayjs().startOf('day')
                }
                format="YYYY-MM-DD dddd"
              />
            </div>

            {/* Client Select */}
            <div>
              <Text strong>
                {intl.formatMessage({
                  id: 'calendar.modal.client',
                  defaultMessage: 'Client',
                })}
              </Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                placeholder={intl.formatMessage({
                  id: 'calendar.modal.selectClient',
                  defaultMessage: 'Select client',
                })}
                showSearch
                value={selectedClient}
                onChange={setSelectedClient}
                filterOption={(input, option) =>
                  (option?.label as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={clients.map((c) => ({
                  value: c.id,
                  label:
                    c.name ||
                    [c.firstName, c.lastName].filter(Boolean).join(' ') ||
                    c.email ||
                    c.id,
                }))}
              />
            </div>

            {/* Services Section - Multi-service support */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text strong>
                  {intl.formatMessage({
                    id: 'calendar.modal.services',
                    defaultMessage: 'Services',
                  })}
                </Text>
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={addServiceSelection}
                >
                  {intl.formatMessage({
                    id: 'calendar.modal.addService',
                    defaultMessage: 'Add Service',
                  })}
                </Button>
              </div>

              {serviceSelections.length === 0 ? (
                <div
                  style={{
                    padding: 16,
                    background: '#f5f5f5',
                    borderRadius: 4,
                    textAlign: 'center',
                  }}
                >
                  <Text type="secondary">
                    {intl.formatMessage({
                      id: 'calendar.modal.noServices',
                      defaultMessage: 'Click "Add Service" to add services',
                    })}
                  </Text>
                </div>
              ) : (
                <Space
                  direction="vertical"
                  style={{ width: '100%' }}
                  size="small"
                >
                  {serviceSelections.map((selection, index) => {
                    const serviceInfo = services.find(
                      (s) => s.id === selection.serviceId,
                    );
                    const serviceRooms =
                      serviceResources.get(selection.id)?.rooms || [];
                    const serviceEquipment =
                      serviceResources.get(selection.id)?.equipment || [];
                    const resourceLoad =
                      serviceResources.get(selection.id)?.loading || false;

                    return (
                      <div
                        key={selection.id}
                        style={{
                          padding: 12,
                          background: '#fafafa',
                          borderRadius: 4,
                          border: '1px solid #e8e8e8',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                          }}
                        >
                          <Tag color="blue">
                            {intl.formatMessage({
                              id: 'calendar.modal.serviceNumber',
                              defaultMessage: `Service ${index + 1}`,
                            })}
                          </Tag>
                          {serviceSelections.length > 1 && (
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<CloseOutlined />}
                              onClick={() =>
                                removeServiceSelection(selection.id)
                              }
                            />
                          )}
                        </div>

                        <Space
                          direction="vertical"
                          style={{ width: '100%' }}
                          size="small"
                        >
                          {/* Service Select */}
                          <Select
                            style={{ width: '100%' }}
                            placeholder={intl.formatMessage({
                              id: 'calendar.modal.selectService',
                              defaultMessage: 'Select service',
                            })}
                            value={selection.serviceId || undefined}
                            onChange={(val) => {
                              const selectedServiceData = services.find(
                                (s) => s.id === val,
                              );
                              updateServiceSelection(selection.id, {
                                serviceId: val,
                                duration:
                                  selectedServiceData?.defaultDuration || 0,
                                staffId: '',
                                roomId: undefined,
                                equipmentId: undefined,
                              });
                              // Load resources for this service
                              loadServiceResources(selection.id, val);
                            }}
                            options={services.map((s) => ({
                              value: s.id,
                              label: (
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <span>{s.name}</span>
                                  <Tag>{s.defaultDuration} min</Tag>
                                </div>
                              ),
                            }))}
                          />

                          {/* Staff Select */}
                          <Select
                            style={{ width: '100%' }}
                            placeholder={intl.formatMessage({
                              id: 'calendar.modal.selectStaff',
                              defaultMessage: 'Select staff',
                            })}
                            value={selection.staffId || undefined}
                            onChange={(val) => {
                              updateServiceSelection(selection.id, {
                                staffId: val,
                              });
                            }}
                            options={staffList.map((s) => ({
                              value: s.id,
                              label:
                                s.displayName ||
                                s.name ||
                                `${s.firstName || ''} ${s.lastName || ''}`.trim(),
                            }))}
                          />

                          {/* Room Select - only show if service has rooms */}
                          {selection.serviceId && serviceRooms.length > 0 && (
                            <Select
                              style={{ width: '100%' }}
                              placeholder={intl.formatMessage({
                                id: 'calendar.modal.selectRoom',
                                defaultMessage: 'Select room (optional)',
                              })}
                              value={selection.roomId || undefined}
                              onChange={(val) => {
                                updateServiceSelection(selection.id, {
                                  roomId: val,
                                });
                              }}
                              allowClear
                              loading={resourceLoad}
                              options={serviceRooms.map((r) => ({
                                value: r.id,
                                label: r.name,
                              }))}
                            />
                          )}

                          {/* Equipment Select - only show if service has equipment */}
                          {selection.serviceId &&
                            serviceEquipment.length > 0 && (
                              <Select
                                style={{ width: '100%' }}
                                placeholder={intl.formatMessage({
                                  id: 'calendar.modal.selectEquipment',
                                  defaultMessage: 'Select equipment (optional)',
                                })}
                                value={selection.equipmentId || undefined}
                                onChange={(val) => {
                                  updateServiceSelection(selection.id, {
                                    equipmentId: val,
                                  });
                                }}
                                allowClear
                                loading={resourceLoad}
                                options={serviceEquipment.map((e) => ({
                                  value: e.id,
                                  label: e.name,
                                }))}
                              />
                            )}

                          {/* Duration display */}
                          {selection.duration > 0 && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {intl.formatMessage({
                                id: 'calendar.modal.duration',
                                defaultMessage: 'Duration',
                              })}
                              : {selection.duration} min
                            </Text>
                          )}
                        </Space>
                      </div>
                    );
                  })}
                </Space>
              )}

              {/* Total duration */}
              {serviceSelections.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    padding: 8,
                    background: '#e6f7ff',
                    borderRadius: 4,
                  }}
                >
                  <Text strong>
                    {intl.formatMessage({
                      id: 'calendar.modal.totalDuration',
                      defaultMessage: 'Total Duration',
                    })}
                    : {totalServicesDuration} min
                  </Text>
                </div>
              )}
            </div>

            {/* Time Slot Select */}
            {selectedClient &&
              serviceSelections.length > 0 &&
              allServicesValid && (
                <div>
                  <Text strong>
                    {intl.formatMessage({
                      id: 'calendar.modal.startTime',
                      defaultMessage: 'Start Time',
                    })}
                  </Text>
                  <Spin spinning={slotsLoading} size="small">
                    <div className={styles.timeSlotsContainer}>
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          size="small"
                          type={
                            selectedSlot &&
                            dayjs(selectedSlot).isSame(slot.datetime, 'minute')
                              ? 'primary'
                              : 'default'
                          }
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot.datetime)}
                          style={!slot.available ? { opacity: 0.4 } : undefined}
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  </Spin>
                </div>
              )}

            {/* Summary */}
            {selectedSlot && serviceSelections.length > 0 && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: '#f5f5f5',
                  borderRadius: 4,
                }}
              >
                <Text>
                  {intl.formatMessage({
                    id: 'calendar.modal.summary',
                    defaultMessage: 'Summary',
                  })}
                  :{' '}
                  <strong>
                    {selectedDate.format('MMM D')} at{' '}
                    {dayjs(selectedSlot).format('HH:mm')} -{' '}
                    {serviceSelections.length} service(s),{' '}
                    {totalServicesDuration} min total
                  </strong>
                </Text>
              </div>
            )}
          </Space>
        </Spin>
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal
        title={
          isEditing
            ? intl.formatMessage({
                id: 'calendar.modal.editAppointment',
                defaultMessage: 'Edit Appointment',
              })
            : intl.formatMessage({
                id: 'calendar.modal.appointmentDetails',
                defaultMessage: 'Appointment Details',
              })
        }
        open={editModalVisible}
        onCancel={handleEditModalClose}
        width={500}
        footer={
          selectedAppointment?.cancelled
            ? [
                <Button key="close" onClick={handleEditModalClose}>
                  {intl.formatMessage({
                    id: 'common.close',
                    defaultMessage: 'Close',
                  })}
                </Button>,
              ]
            : [
                <Button key="close" onClick={handleEditModalClose}>
                  {intl.formatMessage({
                    id: 'common.close',
                    defaultMessage: 'Close',
                  })}
                </Button>,
                isEditing ? (
                  <Button key="cancelEdit" onClick={() => setIsEditing(false)}>
                    {intl.formatMessage({
                      id: 'common.cancel',
                      defaultMessage: 'Cancel',
                    })}
                  </Button>
                ) : (
                  <Button
                    key="edit"
                    type="primary"
                    onClick={() => setIsEditing(true)}
                  >
                    {intl.formatMessage({
                      id: 'calendar.modal.edit',
                      defaultMessage: 'Edit',
                    })}
                  </Button>
                ),
                isEditing ? (
                  <Button
                    key="save"
                    type="primary"
                    loading={editSubmitting}
                    onClick={handleSaveEdit}
                  >
                    {intl.formatMessage({
                      id: 'common.save',
                      defaultMessage: 'Save',
                    })}
                  </Button>
                ) : (
                  <Button
                    key="cancelAppt"
                    danger
                    onClick={handleCancelAppointment}
                  >
                    {intl.formatMessage({
                      id: 'calendar.modal.cancelAppointment',
                      defaultMessage: 'Cancel Appointment',
                    })}
                  </Button>
                ),
              ]
        }
      >
        {selectedAppointment && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* Client - Read only */}
            <div>
              <Text strong>
                {intl.formatMessage({
                  id: 'calendar.modal.client',
                  defaultMessage: 'Client',
                })}
                :{' '}
              </Text>
              <Text>
                {selectedAppointment.client?.name ||
                  [
                    selectedAppointment.client?.firstName,
                    selectedAppointment.client?.lastName,
                  ]
                    .filter(Boolean)
                    .join(' ') ||
                  'N/A'}
              </Text>
            </div>

            {/* Service - Read only */}
            <div>
              <Text strong>
                {intl.formatMessage({
                  id: 'calendar.modal.service',
                  defaultMessage: 'Service',
                })}
                :{' '}
              </Text>
              <Text>
                {selectedAppointment.appointmentServices
                  ?.map((s) => s.name)
                  .join(', ') || 'N/A'}
              </Text>
            </div>

            {/* Date & Time - Editable */}
            <div>
              <Text strong>
                {intl.formatMessage({
                  id: 'calendar.modal.dateTime',
                  defaultMessage: 'Date & Time',
                })}
              </Text>
              {isEditing ? (
                <DatePicker
                  style={{ width: '100%', marginTop: 4 }}
                  showTime={{ format: 'HH:mm', minuteStep: 15 }}
                  value={editDate}
                  onChange={(date) => setEditDate(date)}
                  format="YYYY-MM-DD HH:mm"
                  disabledDate={(current) =>
                    current && current < dayjs().startOf('day')
                  }
                />
              ) : (
                <div style={{ marginTop: 4 }}>
                  <Text>
                    {dayjs(selectedAppointment.startAt).format(
                      'YYYY-MM-DD HH:mm',
                    )}
                    {selectedAppointment.duration &&
                      ` (${Math.round(selectedAppointment.duration / 60)} min)`}
                  </Text>
                </div>
              )}
            </div>

            {/* Staff - Editable */}
            <div>
              <Text strong>
                {intl.formatMessage({
                  id: 'calendar.modal.staff',
                  defaultMessage: 'Staff',
                })}
              </Text>
              {isEditing ? (
                <Select
                  style={{ width: '100%', marginTop: 4 }}
                  value={editStaffId}
                  onChange={setEditStaffId}
                  options={staffList.map((s) => ({
                    value: s.id,
                    label:
                      s.displayName ||
                      s.name ||
                      `${s.firstName || ''} ${s.lastName || ''}`.trim(),
                  }))}
                />
              ) : (
                <div style={{ marginTop: 4 }}>
                  <Text>
                    {(() => {
                      const staff = staffList.find(
                        (s) => s.id === selectedAppointment.staffId,
                      );
                      return (
                        staff?.displayName ||
                        staff?.name ||
                        [staff?.firstName, staff?.lastName]
                          .filter(Boolean)
                          .join(' ') ||
                        'N/A'
                      );
                    })()}
                  </Text>
                </div>
              )}
            </div>

            {/* Room - Editable */}
            <div>
              <Text strong>
                {intl.formatMessage({
                  id: 'calendar.modal.room',
                  defaultMessage: 'Room',
                })}
              </Text>
              {isEditing ? (
                <Select
                  style={{ width: '100%', marginTop: 4 }}
                  value={editRoomId}
                  onChange={setEditRoomId}
                  allowClear
                  placeholder={intl.formatMessage({
                    id: 'calendar.modal.selectRoom',
                    defaultMessage: 'Select room',
                  })}
                  options={allRooms.map((r) => ({
                    value: r.id,
                    label: r.name,
                  }))}
                />
              ) : (
                <div style={{ marginTop: 4 }}>
                  <Text>
                    {(() => {
                      const room = allRooms.find(
                        (r) => r.id === selectedAppointment.roomId,
                      );
                      return room?.name || '-';
                    })()}
                  </Text>
                </div>
              )}
            </div>

            {/* Equipment - Editable */}
            <div>
              <Text strong>
                {intl.formatMessage({
                  id: 'calendar.modal.equipment',
                  defaultMessage: 'Equipment',
                })}
              </Text>
              {isEditing ? (
                <Select
                  style={{ width: '100%', marginTop: 4 }}
                  value={editEquipmentId}
                  onChange={setEditEquipmentId}
                  allowClear
                  placeholder={intl.formatMessage({
                    id: 'calendar.modal.selectEquipment',
                    defaultMessage: 'Select equipment',
                  })}
                  options={allEquipment.map((e) => ({
                    value: e.id,
                    label: e.name,
                  }))}
                />
              ) : (
                <div style={{ marginTop: 4 }}>
                  <Text>
                    {(() => {
                      const eq = allEquipment.find(
                        (e) => e.id === selectedAppointment.equipmentId,
                      );
                      return eq?.name || '-';
                    })()}
                  </Text>
                </div>
              )}
            </div>

            {/* Notes - Editable */}
            <div>
              <Text strong>
                {intl.formatMessage({
                  id: 'calendar.modal.notes',
                  defaultMessage: 'Notes',
                })}
              </Text>
              {isEditing ? (
                <Input.TextArea
                  style={{ marginTop: 4 }}
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder={intl.formatMessage({
                    id: 'calendar.modal.notesPlaceholder',
                    defaultMessage: 'Enter notes...',
                  })}
                />
              ) : (
                <div style={{ marginTop: 4 }}>
                  <Text>{selectedAppointment.notes || '-'}</Text>
                </div>
              )}
            </div>

            {/* Cancelled warning */}
            {selectedAppointment.cancelled && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: '#fff2f0',
                  borderRadius: 4,
                  color: '#ff4d4f',
                }}
              >
                <Text type="danger">
                  {intl.formatMessage({
                    id: 'calendar.modal.cancelled',
                    defaultMessage: 'This appointment has been cancelled',
                  })}
                </Text>
              </div>
            )}

            {/* Cal.com sync status */}
            <div style={{ marginTop: 16 }}>
              <Text strong>
                {intl.formatMessage({
                  id: 'calendar.modal.calComSync',
                  defaultMessage: 'Cal.com Sync',
                })}
                :{' '}
              </Text>
              {selectedAppointment.calComBookingId ? (
                <Tag color="green">
                  {intl.formatMessage({
                    id: 'calendar.modal.synced',
                    defaultMessage: 'Synced',
                  })}
                </Tag>
              ) : (
                <Tag color="default">
                  {intl.formatMessage({
                    id: 'calendar.modal.notSynced',
                    defaultMessage: 'Not Synced',
                  })}
                </Tag>
              )}
            </div>
          </Space>
        )}
      </Modal>
    </PageContainer>
  );
};

export default AppointmentCalendar;
