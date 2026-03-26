import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import type {
  DatesSetArg,
  EventClickArg,
  EventDropArg,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
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

  // Reload appointments when filters change
  useEffect(() => {
    if (currentStart && currentEnd) {
      setLoading(true);
      fetchAppointments(currentStart, currentEnd).finally(() =>
        setLoading(false),
      );
    }
  }, [selectedStaffId, selectedRoomFilter, selectedEquipmentFilter]);

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
    const { event, revert } = arg;
    const appointmentId = event.id;
    const newStart = event.start?.toISOString();
    const newEnd = event.end?.toISOString();

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

    // Show confirmation modal
    Modal.confirm({
      title: intl.formatMessage({
        id: 'calendar.moveConfirm.title',
        defaultMessage: 'Move Appointment',
      }),
      content: intl.formatMessage(
        {
          id: 'calendar.moveConfirm.content',
          defaultMessage: 'Move appointment for {client} to {date} at {time}?',
        },
        {
          client: clientName,
          date: dayjs(newStart).format('YYYY-MM-DD'),
          time: dayjs(newStart).format('HH:mm'),
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
          await updateAppointment(appointmentId, {
            startAt: newStart,
            endAt: newEnd,
          });
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

  // Get selected service info
  const selectedServiceInfo = useMemo(() => {
    if (!selectedService) return null;
    return services.find((s) => s.id === selectedService);
  }, [selectedService, services]);

  // Generate time slots
  const timeSlots = useMemo(() => {
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
  ]);

  // Submit appointment
  const handleSubmit = async () => {
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
    setSelectedSlot(null);
  };

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
      <div className={styles.calendarContainer}>
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth',
          }}
          events={events}
          datesSet={handleDatesSet}
          eventDrop={handleEventDrop}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={true}
          droppable={true}
          selectable={true}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          height="auto"
          eventContent={(arg) => (
            <div
              style={{
                padding: '2px 4px',
                fontSize: '12px',
                overflow: 'hidden',
              }}
            >
              <div style={{ fontWeight: 500 }}>{arg.event.title}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>
                {arg.timeText}
              </div>
            </div>
          )}
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
        width={600}
        footer={[
          <Button key="cancel" onClick={handleModalClose}>
            {intl.formatMessage({
              id: 'common.cancel',
              defaultMessage: 'Cancel',
            })}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleSubmit}
            disabled={
              !selectedClient ||
              !selectedService ||
              !selectedStaff ||
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

            {/* Service Select */}
            <div>
              <Text strong>
                {intl.formatMessage({
                  id: 'calendar.modal.service',
                  defaultMessage: 'Service',
                })}
              </Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                placeholder={intl.formatMessage({
                  id: 'calendar.modal.selectService',
                  defaultMessage: 'Select service',
                })}
                value={selectedService}
                onChange={(val) => {
                  setSelectedService(val);
                  setSelectedSlot(null);
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
            </div>

            {/* Staff Select */}
            <div>
              <Text strong>
                {intl.formatMessage({
                  id: 'calendar.modal.staff',
                  defaultMessage: 'Staff',
                })}
              </Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                placeholder={intl.formatMessage({
                  id: 'calendar.modal.selectStaff',
                  defaultMessage: 'Select staff',
                })}
                value={selectedStaff}
                onChange={(val) => {
                  setSelectedStaff(val);
                  setSelectedSlot(null);
                  setBookedAppointments([]); // Clear booked appointments when staff changes
                }}
                options={staffList.map((s) => ({
                  value: s.id,
                  label:
                    s.displayName ||
                    s.name ||
                    `${s.firstName || ''} ${s.lastName || ''}`.trim(),
                }))}
              />
            </div>

            {/* Room Select */}
            {selectedService && rooms.length > 0 && (
              <div>
                <Text strong>
                  {intl.formatMessage({
                    id: 'calendar.modal.room',
                    defaultMessage: 'Room',
                  })}
                </Text>
                <Spin spinning={resourceLoading} size="small">
                  <Select
                    style={{ width: '100%', marginTop: 4 }}
                    placeholder={intl.formatMessage({
                      id: 'calendar.modal.selectRoom',
                      defaultMessage: 'Select room',
                    })}
                    value={selectedRoom}
                    onChange={(val) => {
                      setSelectedRoom(val);
                      setSelectedSlot(null);
                    }}
                    allowClear
                    options={rooms.map((r) => ({
                      value: r.id,
                      label: r.name,
                    }))}
                  />
                </Spin>
              </div>
            )}

            {/* Equipment Select */}
            {selectedService && equipment.length > 0 && (
              <div>
                <Text strong>
                  {intl.formatMessage({
                    id: 'calendar.modal.equipment',
                    defaultMessage: 'Equipment',
                  })}
                </Text>
                <Spin spinning={resourceLoading} size="small">
                  <Select
                    style={{ width: '100%', marginTop: 4 }}
                    placeholder={intl.formatMessage({
                      id: 'calendar.modal.selectEquipment',
                      defaultMessage: 'Select equipment',
                    })}
                    value={selectedEquipment}
                    onChange={(val) => {
                      setSelectedEquipment(val);
                      setSelectedSlot(null);
                    }}
                    allowClear
                    options={equipment.map((e) => ({
                      value: e.id,
                      label: e.name,
                    }))}
                  />
                </Spin>
              </div>
            )}

            {/* Time Slot Select */}
            {selectedClient && selectedService && selectedStaff && (
              <div>
                <Text strong>
                  {intl.formatMessage({
                    id: 'calendar.modal.time',
                    defaultMessage: 'Time',
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
            {selectedSlot && selectedServiceInfo && (
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
                    {selectedServiceInfo.name}
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
