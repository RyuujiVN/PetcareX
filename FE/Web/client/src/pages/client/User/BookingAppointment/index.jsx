import {
    ClockCircleOutlined,
    EnvironmentOutlined,
    ExperimentOutlined,
    MoonOutlined,
    SmileOutlined,
    SunOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Avatar, Card, Col, Form, Input, message, Row, Select, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSpecialtyLabel } from '../../../../constants/veterinaryLabels';
import { useAuth } from '../../../../hooks/client/AuthContext';
import { getClientInstance } from '../../../../services/apiClient';
import {
    APPOINTMENT_STATUS,
    createAppointmentApi,
    getMyAppointmentsApi,
    SERVICE_OPTIONS,
} from '../../../../services/appointmentService';
import { getClinicByIdApi, getClinicListApi } from '../../../../services/clinicService';
import { getBreedLabel, getMyPetsApi } from '../../../../services/petService';
import { getVeterinarianByClinicApi } from '../../../../services/veterinarianService';
import './styles.css';

const TIME_SLOT_GROUPS = [
  {
    key: 'morning',
    labelKey: 'pages.booking.timeSlots.morning',
    icon: SunOutlined,
    times: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'],
  },
  {
    key: 'afternoon',
    labelKey: 'pages.booking.timeSlots.afternoon',
    icon: MoonOutlined,
    times: ['14:00', '14:30', '24:00', '15:30', '23:00', '23:30'],
  },
];

const WORKING_SLOTS = TIME_SLOT_GROUPS.flatMap((group) => group.times);
const BOOKING_MIN_LEAD_HOURS = 3;

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toDateTimeValue = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}:00`);

const getLeadTimeThreshold = () =>
  new Date(Date.now() + BOOKING_MIN_LEAD_HOURS * 60 * 60 * 1000);

const getAppointmentDateLabel = (dateValue, locale = 'vi-VN') => {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString(locale);
};

export default function BookingAppointment() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [showSummary, setShowSummary] = useState(false);
  const location = useLocation();
  const { userProfile } = useAuth();
  const today = useMemo(() => new Date(), []);
  const serviceOptions = useMemo(() => {
    if (Array.isArray(SERVICE_OPTIONS)) {
      return SERVICE_OPTIONS.map((item) => ({
        label: t(`enums.service.${item}`, { defaultValue: item }),
        value: item,
      }));
    }

    if (SERVICE_OPTIONS && typeof SERVICE_OPTIONS === 'object') {
      return Object.entries(SERVICE_OPTIONS).map(([key, label]) => ({
        label: t(`enums.service.${key}`, { defaultValue: label }),
        value: key,
      }));
    }

    return [];
  }, [t]);

  const dateLocale = i18n.language?.startsWith('en') ? 'en-US' : 'vi-VN';

  const serviceLabelByKey = useMemo(() => {
    return serviceOptions.reduce((acc, item) => {
      acc[item.value] = item.label;
      return acc;
    }, {});
  }, [serviceOptions]);

  const preselectedClinicId = useMemo(() => {
    const clinicIdFromState =
      location.state?.selectedClinicId ||
      (location.state?.clinic?.id ? String(location.state.clinic.id) : '');

    return clinicIdFromState || sessionStorage.getItem('selectedClinicId') || '';
  }, [location.state]);

  const [selectedPet, setSelectedPet] = useState(null);
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pets, setPets] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [clinicDetail, setClinicDetail] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);

  const service = Form.useWatch('service', form);
  const clinicId = Form.useWatch('clinicId', form);
  const doctorId = Form.useWatch('doctorId', form);
  const selectedDate = Form.useWatch('selectedDate', form);
  const selectedTime = Form.useWatch('selectedTime', form);

  const selectedClinic = useMemo(
    () => clinicDetail || clinics.find((item) => String(item.id) === String(clinicId)) || null,
    [clinicDetail, clinicId, clinics],
  );

  const selectedDoctor = useMemo(
    () => doctors.find((item) => String(item.userId) === String(doctorId)) || null,
    [doctorId, doctors],
  );

  const selectedDoctorName = selectedDoctor?.user?.fullName || '';

  const unavailableTimes = useMemo(() => {
    if (!selectedDoctor || !selectedDate) {
      return new Set();
    }

    const booked = myAppointments
      .filter((item) => item.veterinarian?.user?.id === selectedDoctor.userId)
      .filter((item) => formatDate(new Date(item.appointmentDate)) === selectedDate)
      .filter((item) => item.status !== APPOINTMENT_STATUS.CANCELLED)
      .map((item) => (item.appointmentTime || '').slice(0, 5));

    return new Set(booked);
  }, [myAppointments, selectedDate, selectedDoctor]);

  const leadTimeHiddenSlots = useMemo(() => {
    if (!selectedDate) {
      return new Set();
    }

    const leadTimeThreshold = getLeadTimeThreshold();
    return new Set(
      WORKING_SLOTS.filter((slot) => toDateTimeValue(selectedDate, slot) < leadTimeThreshold),
    );
  }, [selectedDate]);

  const fetchPets = async () => {
    const data = await getMyPetsApi(getClientInstance());
    const petList = Array.isArray(data) ? data : [];
    setPets(petList);
    if (petList.length > 0) {
      setSelectedPet((prev) => prev || petList[0]);
    }
  };

  const fetchClinics = async () => {
    const res = await getClinicListApi(getClientInstance(), 1, 50);
    const clinicList = Array.isArray(res?.items) ? res.items : [];
    setClinics(clinicList);
    if (clinicList.length > 0) {
      const hasPreselectedClinic = preselectedClinicId
        ? clinicList.some((item) => String(item.id) === String(preselectedClinicId))
        : false;

      if (hasPreselectedClinic) {
        form.setFieldValue('clinicId', String(preselectedClinicId));
        return;
      }

      const currentClinicId = form.getFieldValue('clinicId');
      if (!currentClinicId) {
        form.setFieldValue('clinicId', clinicList[0].id);
      }
    }
  };

  const fetchAppointments = async () => {
    const res = await getMyAppointmentsApi(getClientInstance(), 1, 200);
    setMyAppointments(Array.isArray(res?.items) ? res.items : []);
  };

  const fetchDoctorsByClinic = async (nextClinicId) => {
    if (!nextClinicId) {
      setDoctors([]);
      form.setFieldValue('doctorId', '');
      return;
    }

    const res = await getVeterinarianByClinicApi(getClientInstance(), nextClinicId, 1, 50);
    const doctorList = Array.isArray(res?.items) ? res.items : [];
    setDoctors(doctorList);

    const currentDoctorId = form.getFieldValue('doctorId');
    const currentDoctorExists = doctorList.some(
      (item) => String(item.userId) === String(currentDoctorId),
    );

    if (doctorList.length > 0) {
      form.setFieldValue('doctorId', currentDoctorExists ? currentDoctorId : doctorList[0].userId);
    } else {
      form.setFieldValue('doctorId', '');
    }
  };

  const fetchClinicById = async (nextClinicId) => {
    if (!nextClinicId) {
      setClinicDetail(null);
      return;
    }

    const detail = await getClinicByIdApi(getClientInstance(), nextClinicId);
    setClinicDetail(detail || null);
  };

  const bootstrapData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchPets(), fetchClinics(), fetchAppointments()]);
    } catch (error) {
      message.error(error.message || t('pages.booking.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrapData();
  }, []);

  useEffect(() => {
    if (preselectedClinicId) {
      form.setFieldValue('clinicId', String(preselectedClinicId));
    }
  }, [form, preselectedClinicId]);

  useEffect(() => {
    if (!clinicId) {
      return;
    }

    Promise.all([fetchDoctorsByClinic(clinicId), fetchClinicById(clinicId)]).catch((error) => {
      message.error(error.message || t('pages.booking.loadClinicDoctorFailed'));
    });
  }, [clinicId]);

  useEffect(() => {
    if (!selectedTime) {
      return;
    }

    const selectedDateTime = toDateTimeValue(selectedDate, selectedTime);
    const isPast = selectedDateTime < new Date();
    if (isPast || unavailableTimes.has(selectedTime) || leadTimeHiddenSlots.has(selectedTime)) {
      form.setFieldValue('selectedTime', '');
    }
  }, [form, leadTimeHiddenSlots, selectedDate, selectedTime, unavailableTimes]);

  const getWeeks = (year, month) => {
    const lastDay = new Date(year, month + 1, 0);
    const weeks = [];
    let week = new Array(7).fill(null);

    for (let d = 1; d <= lastDay.getDate(); d += 1) {
      const date = new Date(year, month, d);
      const weekday = date.getDay();
      week[weekday] = d;
      if (weekday === 6 || d === lastDay.getDate()) {
        weeks.push(week);
        week = new Array(7).fill(null);
      }
    }

    return weeks;
  };

  const isPastDay = (year, month, day) => {
    const compareDate = new Date(year, month, day, 0, 0, 0, 0);
    const nowDate = new Date();
    const todayStart = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate(),
      0,
      0,
      0,
      0,
    );

    return compareDate < todayStart;
  };

  const prevMonth = () => {
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const targetMonthStart = new Date(calendarYear, calendarMonth - 1, 1);

    if (targetMonthStart < currentMonthStart) {
      return;
    }

    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((prev) => prev - 1);
      return;
    }

    setCalendarMonth((prev) => prev - 1);
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((prev) => prev + 1);
      return;
    }

    setCalendarMonth((prev) => prev + 1);
  };

  const handlePetClick = (pet) => {
    setSelectedPet(pet);
  };

  const handleAddPet = () => {
    navigate('/add-pet');
  }

  const validateSymptoms = (_, value) => {
    if (!value || !String(value).trim()) {
      return Promise.reject(new Error(t('pages.booking.validation.symptomsRequired')));
    }
    return Promise.resolve();
  };

  const validateDateNotPast = (_, value) => {
    if (!value) {
      return Promise.reject(new Error(t('pages.booking.validation.dateRequired')));
    }

    const pickedDate = new Date(`${value}T00:00:00`);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (pickedDate < todayStart) {
      return Promise.reject(new Error(t('pages.booking.validation.dateInPast')));
    }

    return Promise.resolve();
  };

  const validateSelectedTime = (_, value) => {
    if (!value) {
      return Promise.reject(new Error(t('pages.booking.validation.timeRequired')));
    }

    if (!selectedDate) {
      return Promise.reject(new Error(t('pages.booking.validation.selectDateFirst')));
    }

    const selectedDateTime = toDateTimeValue(selectedDate, value);
    if (selectedDateTime < new Date()) {
      return Promise.reject(new Error(t('pages.booking.validation.dateInPast')));
    }

    if (selectedDateTime < getLeadTimeThreshold()) {
      return Promise.reject(
        new Error(
          t('pages.booking.validation.minLeadTime', {
            hours: BOOKING_MIN_LEAD_HOURS,
            defaultValue: `Bạn cần đặt lịch trước ít nhất ${BOOKING_MIN_LEAD_HOURS} tiếng`,
          }),
        ),
      );
    }

    if (unavailableTimes.has(value)) {
      return Promise.reject(new Error(t('pages.booking.validation.timeUnavailable')));
    }

    return Promise.resolve();
  };

  const handleOpenSummary = async () => {
    if (!selectedPet?.id) {
      message.warning(t('pages.booking.validation.petRequired'));
      return;
    }

    try {
      await form.validateFields([
        'service',
        'clinicId',
        'doctorId',
        'symptoms',
        'selectedDate',
        'selectedTime',
      ]);
    } catch {
      return;
    }

    setShowSummary(true);
  };

  const handleConfirm = async () => {
    if (!selectedPet?.id) {
      message.warning(t('pages.booking.validation.petRequired'));
      return;
    }

    let values;
    try {
      values = await form.validateFields([
        'service',
        'clinicId',
        'doctorId',
        'symptoms',
        'selectedDate',
        'selectedTime',
      ]);
    } catch {
      return;
    }

    const payload = {
      petId: selectedPet.id,
      veterinarianId: values.doctorId,
      clinicId: values.clinicId,
      appointmentDate: values.selectedDate,
      appointmentTime: values.selectedTime,
      service: values.service,
      note: values.symptoms.trim(),
    };

    try {
      setSubmitting(true);
      const created = await createAppointmentApi(getClientInstance(), payload);

      const appointmentData = {
        petName: created?.pet?.name || selectedPet.name,
        doctorName: created?.veterinarian?.user?.fullName || selectedDoctorName,
        time: `${values.selectedTime} ${new Date(values.selectedDate).toLocaleDateString(dateLocale)}`,
        service: serviceLabelByKey[values.service] || values.service,
        clinic: created?.clinic?.name || selectedClinic?.name || '',
        appointmentId: created?.id,
      };

      setShowSummary(false);
      setSubmitting(false);
      navigate('/success-booking', { state: { appointmentData } });

      // Run auxiliary tasks in the background so success navigation is immediate.
      void fetchAppointments().catch(() => undefined);
    } catch (error) {
      message.error(error.message || t('pages.booking.submitFailed'));
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-page">
      <header className="dashboard-header">
        <h1 style={{marginRight: '46%', paddingTop: 30}}>{t('pages.booking.greeting', { name: userProfile?.fullName || t('pages.booking.defaultUserName') })}</h1>
        <p style={{marginRight: '48%', paddingTop: 20}}>{t('pages.booking.subtitle')}</p>
      </header>
      <Spin spinning={loading}>
        <div className="booking-content">
          <div className="form-column">
            <section className="step">
              <h2><span className="step-number">1</span> {t('pages.booking.steps.choosePet')}</h2>
              <div className="pet-list"
               onMouseDown={(e) => {
                  const slider = e.currentTarget;
                  slider.isDown = true;
                  slider.startX = e.pageX;
                  slider.scrollLeftStart = slider.scrollLeft;
                  slider.style.cursor = 'grabbing';
                }}

                onMouseLeave={(e) => {
                  const slider = e.currentTarget;
                  slider.isDown = false;
                  slider.style.cursor = 'grab';
                }}

                onMouseUp={(e) => {
                  const slider = e.currentTarget;
                  slider.isDown = false;
                  slider.style.cursor = 'grab';
                }}

                onMouseMove={(e) => {
                  const slider = e.currentTarget;
                  if (!slider.isDown) return;

                  e.preventDefault();

                  const dx = e.pageX - slider.startX;

                  slider.scrollLeft = slider.scrollLeftStart - dx * 1.5;
                }} 
            >

                 <article
                  className="pet-card add-new"
                  onClick={() => handleAddPet()}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="add-text" style={{ color: 'var(--color-brand-primary)' }}>
                    {t('pages.booking.addNewPet')}
                  </span>
                </article>
                {pets.map((p) => (
                  <div
                    key={p.id}
                    className={`pet-card ${selectedPet?.id === p.id ? 'selected' : ''}`}
                    onClick={() => handlePetClick(p)}
                  >
                    {selectedPet?.id === p.id && <span className="check">✓</span>}
                    <img src={p.avatar} alt={p.name} />
                    <div className="info">
                      <span className="name">{p.name}</span>
                      <span className="sub">{getBreedLabel(p.breed, p.species)}</span>
                    </div>
                  </div>
                ))}
               
              </div>
            </section>

            <Form
              form={form}
              layout="vertical"
              initialValues={{
                service: serviceOptions[0]?.value || undefined,
                clinicId: preselectedClinicId || undefined,
                doctorId: undefined,
                symptoms: '',
                selectedDate: formatDate(today),
                selectedTime: '',
              }}
            >

            <section className="step">
              <h2>
                <span className="step-number">2</span> {t('pages.booking.steps.serviceClinic')}
              </h2>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={<span style={{ color: 'var(--color-text-primary)', padding: 2, fontSize: 16 }}>{t('pages.booking.form.serviceLabel')}</span>}
                    name="service"
                    rules={[{ required: true, message: t('pages.booking.validation.serviceRequired') }]}
                  >
                    <Select
                      size="large"
                      options={serviceOptions}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={<span style={{ color: 'var(--color-text-primary)', padding: 2, fontSize: 16 }}>{t('pages.booking.form.clinicLabel')}</span>}
                    name="clinicId"
                    rules={[{ required: true, message: t('pages.booking.validation.clinicRequired') }]}
                  >
                    <Select
                      size="large"
                      disabled={Boolean(preselectedClinicId)}
                      options={clinics.map((item) => ({
                        label: item.name,
                        value: item.id,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </section>

            <section className="step">
              <h2>
                <span className="step-number">3</span> {t('pages.booking.steps.chooseDoctor')}
              </h2>

              <Row gutter={16} align="middle">
                <Col span={12}>
                  <Form.Item
                    label={<span style={{ color: 'var(--color-text-primary)', padding: 2, fontSize: 16 }}>{t('common.labels.doctor')}</span>}
                    name="doctorId"
                    rules={[{ required: true, message: t('pages.booking.validation.doctorRequired') }]}
                  >
                    <Select
                      size="large"
                      style={{marginBottom: 20}}
                      options={doctors.map((item) => ({
                        label: item.user?.fullName,
                        value: item.userId,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Card
                    style={{ borderRadius: 12 }}
                    bodyStyle={{ display: 'flex', alignItems: 'center', gap: 16 }}
                  >
                    <Avatar
                      size={64}
                      src={selectedDoctor?.user?.avatarUrl || '/bs1.png'}
                    />

                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>
                        {selectedDoctorName || t('pages.booking.notSelectedDoctor')}
                      </div>

                      <div style={{ color: 'var(--color-text-secondary)' }}>
                        {selectedDoctor?.specialty ? t(`enums.veterinarySpecialty.${selectedDoctor.specialty}`, { defaultValue: getSpecialtyLabel(selectedDoctor.specialty, 'vi') }) : t('pages.booking.noSpecialty')}
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
              <div style={{ marginTop: 16 }}>
                <Form.Item
                  label={<span style={{ color: 'var(--color-text-primary)', padding: 2, fontSize: 16 }}>{t('common.labels.symptom')}</span>}
                  name="symptoms"
                  rules={[{ validator: validateSymptoms }]}
                >
                  <Input.TextArea
                    placeholder={t('pages.booking.form.symptomPlaceholder')}
                    rows={4}
                  />
                </Form.Item>
              </div>
            </section>

            <section className="step">
              <div className="step-heading-row">
                <h2><span className="step-number">4</span> {t('pages.booking.steps.chooseDateTime')}</h2>
                <div className="lead-time-note">
                  {t('pages.booking.leadTimeNotice', {
                    hours: BOOKING_MIN_LEAD_HOURS,
                    defaultValue: `Lưu ý: Bạn cần đặt lịch trước ít nhất ${BOOKING_MIN_LEAD_HOURS} tiếng.`,
                  })}
                </div>
              </div>
              <div className="date-time-selector">
                <div className="calendar">
                  <div className="month-header" style={{color: 'var(--color-text-primary)'}}>
                    <button onClick={prevMonth}>&lt;</button>
                    <span>{t('pages.booking.calendar.monthLabel', { month: calendarMonth + 1, year: calendarYear })}</span>
                    <button onClick={nextMonth}>&gt;</button>
                  </div>
                  <table style={{color: 'var(--color-text-primary)'}}>
                    <thead>
                      <tr >
                        <th>{t('pages.booking.calendar.days.sun')}</th>
                        <th>{t('pages.booking.calendar.days.mon')}</th>
                        <th>{t('pages.booking.calendar.days.tue')}</th>
                        <th>{t('pages.booking.calendar.days.wed')}</th>
                        <th>{t('pages.booking.calendar.days.thu')}</th>
                        <th>{t('pages.booking.calendar.days.fri')}</th>
                        <th>{t('pages.booking.calendar.days.sat')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getWeeks(calendarYear, calendarMonth).map((week, i) => (
                        <tr key={i}>
                          {week.map((day, j) => {
                            const currentDate = day
                              ? `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                              : '';
                            const isSelected = day && selectedDate === currentDate;
                            const disabled = day && isPastDay(calendarYear, calendarMonth, day);

                            return (
                              <td
                                key={j}
                                className={`${isSelected ? 'selected-day' : ''} ${disabled ? 'disabled-day' : ''}`}
                                onClick={() => {
                                  if (day && !disabled) {
                                    form.setFieldValue('selectedDate', currentDate);
                                  }
                                }}
                              >
                                {day || ''}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="time-slots" style={{color: 'var(--color-text-primary)'}}>
                  {TIME_SLOT_GROUPS.map((group) => (
                    <section key={group.key} className="time-slot-group">
                      <div className="time-slot-group-title">
                        <group.icon className="time-slot-icon" aria-hidden />
                        <span>{t(group.labelKey)}</span>
                      </div>

                      <div className="slots-grid">
                        {group.times.map((timeValue) => {
                          const inPast = toDateTimeValue(selectedDate, timeValue) < new Date();
                          const isBooked = unavailableTimes.has(timeValue);
                          const isBlockedByLeadTime = leadTimeHiddenSlots.has(timeValue);
                          const disabled = inPast || isBooked || isBlockedByLeadTime;

                          return (
                            <div
                              key={timeValue}
                              className={`slot ${selectedTime === timeValue ? 'selected' : ''} ${disabled ? 'disabled-slot' : ''}`}
                              onClick={() => {
                                if (!disabled) {
                                  form.setFieldValue('selectedTime', timeValue);
                                }
                              }}
                            >
                              {timeValue}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
              <Form.Item
                name="selectedDate"
                rules={[{ validator: validateDateNotPast }]}
                hidden
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="selectedTime"
                dependencies={["selectedDate", "doctorId"]}
                rules={[{ validator: validateSelectedTime }]}
                hidden
              >
                <Input />
              </Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            className="btn-confirm"
            type="button"
            disabled={submitting || loading}
            onClick={handleOpenSummary}
            style={{ width: '200px', border: '1px solid var(--color-brand-primary)' , padding: '10px', borderRadius:'10px', backgroundColor: 'var(--color-brand-primary)', color: 'var(--color-surface-card)' }}
          >
            {t('common.actions.confirm')}
          </button>
        </div>
            </section>
            </Form>
          </div>
        </div>
      </Spin>
      {showSummary && (
  <div className="summary-overlay">
    <div className="summary-modal">
      <h3>{t('pages.booking.summary.title')}</h3>
      {selectedPet && (
        <div className="summary-line">
          <span className="icon" aria-hidden>
            <SmileOutlined />
          </span>
          <div className="text">
            <div className="label">{t('pages.booking.summary.pet')}</div>
            <div className="value">
              {selectedPet.name} ({getBreedLabel(selectedPet.breed, selectedPet.species)})
            </div>
          </div>
        </div>
      )}

      <div className="summary-line">
        <span className="icon" aria-hidden>
          <ExperimentOutlined />
        </span>
        <div className="text">
          <div className="label">{t('pages.booking.summary.service')}</div>
          <div className="value">{serviceLabelByKey[service] || service}</div>
        </div>
      </div>

      <div className="summary-line">
        <span className="icon" aria-hidden>
          <UserOutlined />
        </span>
        <div className="text">
          <div className="label">{t('pages.booking.summary.doctor')}</div>
          <div className="value">{selectedDoctorName || t('pages.booking.summary.notSelected')}</div>
        </div>
      </div>

      <div className="summary-line">
        <span className="icon" aria-hidden>
          <EnvironmentOutlined />
        </span>
        <div className="text">
          <div className="label">{t('pages.booking.summary.clinic')}</div>
          <div className="value">{selectedClinic?.name || t('pages.booking.summary.notSelected')}</div>
        </div>
      </div>

      <div className="summary-line">
        <span className="icon" aria-hidden>
          <ClockCircleOutlined />
        </span>
        <div className="text">
          <div className="label">{t('pages.booking.summary.time')}</div>
          <div className="value">
            {selectedTime || t('pages.booking.summary.notSelectedTime')}, {getAppointmentDateLabel(selectedDate, dateLocale)}
          </div>
        </div>
      </div>

      <div className="modal-actions">
        <button
          className="btn-cancels"
          type="button"
          disabled={submitting}
          onClick={() => setShowSummary(false)}
        >
          {t('common.actions.back')}
        </button>

        <button
          className="btn-confirms"
          type="button"
          disabled={submitting}
          onClick={handleConfirm}
        >
          {submitting ? t('pages.booking.submitting') : t('pages.booking.confirmBooking')}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

