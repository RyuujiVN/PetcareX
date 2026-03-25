import React, { useEffect, useMemo, useState } from 'react';
import { message, Spin } from 'antd';
import { Select, Card, Avatar, Row, Col, Input, Form } from 'antd';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  MoonOutlined,
  SmileOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles.css';
import { useAuth } from '../../../../hooks/client/AuthContext';
import { getMyPetsApi } from '../../../../data/client/api/petApi';
import { getClinicByIdApi, getClinicListApi } from '../../../../data/client/api/clinicApi';
import { getVeterinarianByClinicApi } from '../../../../data/client/api/veterinarianApi';
import {
  APPOINTMENT_STATUS,
  createAppointmentApi,
  getMyAppointmentsApi,
  SERVICE_OPTIONS,
} from '../../../../data/client/api/appointmentApi';
import { getBreedLabel } from '../../../../data/client/api/petApi';

const TIME_SLOT_GROUPS = [
  {
    key: 'morning',
    label: 'Buổi sáng',
    icon: SunOutlined,
    times: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'],
  },
  {
    key: 'afternoon',
    label: 'Buổi chiều',
    icon: MoonOutlined,
    times: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
  },
];

const WORKING_SLOTS = TIME_SLOT_GROUPS.flatMap((group) => group.times);

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toDateTimeValue = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}:00`);

const getAppointmentDateLabel = (dateValue) => {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleDateString('vi-VN');
};

export default function BookingAppointment() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [showSummary, setShowSummary] = useState(false);
  const location = useLocation();
  const { userProfile } = useAuth();
  const today = useMemo(() => new Date(), []);
  const serviceOptions = useMemo(() => {
    if (Array.isArray(SERVICE_OPTIONS)) {
      return SERVICE_OPTIONS.map((item) => ({
        label: item,
        value: item,
      }));
    }

    if (SERVICE_OPTIONS && typeof SERVICE_OPTIONS === 'object') {
      return Object.entries(SERVICE_OPTIONS).map(([key, label]) => ({
        label,
        value: key,
      }));
    }

    return [];
  }, []);

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
      .filter((item) => item.status !== APPOINTMENT_STATUS.CANCELED)
      .map((item) => (item.appointmentTime || '').slice(0, 5));

    return new Set(booked);
  }, [myAppointments, selectedDate, selectedDoctor]);

  const fetchPets = async () => {
    const data = await getMyPetsApi();
    const petList = Array.isArray(data) ? data : [];
    setPets(petList);
    if (petList.length > 0) {
      setSelectedPet((prev) => prev || petList[0]);
    }
  };

  const fetchClinics = async () => {
    const res = await getClinicListApi(1, 50);
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
    const res = await getMyAppointmentsApi(1, 200);
    setMyAppointments(Array.isArray(res?.items) ? res.items : []);
  };

  const fetchDoctorsByClinic = async (nextClinicId) => {
    if (!nextClinicId) {
      setDoctors([]);
      form.setFieldValue('doctorId', '');
      return;
    }

    const res = await getVeterinarianByClinicApi(nextClinicId, 1, 50);
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

    const detail = await getClinicByIdApi(nextClinicId);
    setClinicDetail(detail || null);
  };

  const bootstrapData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchPets(), fetchClinics(), fetchAppointments()]);
    } catch (error) {
      message.error(error.message || 'Không thể tải dữ liệu đặt lịch');
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
      message.error(error.message || 'Không thể tải dữ liệu phòng khám và bác sĩ');
    });
  }, [clinicId]);

  useEffect(() => {
    if (!selectedTime) {
      return;
    }

    const selectedDateTime = toDateTimeValue(selectedDate, selectedTime);
    const isPast = selectedDateTime < new Date();
    if (isPast || unavailableTimes.has(selectedTime)) {
      form.setFieldValue('selectedTime', '');
    }
  }, [form, selectedDate, selectedTime, unavailableTimes]);

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
      return Promise.reject(new Error('Vui lòng nhập triệu chứng'));
    }
    return Promise.resolve();
  };

  const validateDateNotPast = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Vui lòng chọn ngày hẹn'));
    }

    const pickedDate = new Date(`${value}T00:00:00`);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    if (pickedDate < todayStart) {
      return Promise.reject(new Error('Không thể đặt lịch trong quá khứ'));
    }

    return Promise.resolve();
  };

  const validateSelectedTime = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('Vui lòng chọn giờ hẹn'));
    }

    if (!selectedDate) {
      return Promise.reject(new Error('Vui lòng chọn ngày hẹn trước'));
    }

    const selectedDateTime = toDateTimeValue(selectedDate, value);
    if (selectedDateTime < new Date()) {
      return Promise.reject(new Error('Không thể đặt lịch trong quá khứ'));
    }

    if (unavailableTimes.has(value)) {
      return Promise.reject(new Error('Khung giờ này đã có lịch, vui lòng chọn giờ khác'));
    }

    return Promise.resolve();
  };

  const handleOpenSummary = async () => {
    if (!selectedPet?.id) {
      message.warning('Vui lòng chọn thú cưng');
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
      message.warning('Vui lòng chọn thú cưng');
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
      const created = await createAppointmentApi(payload);
      await fetchAppointments();

      const appointmentData = {
        petName: created?.pet?.name || selectedPet.name,
        doctorName: created?.veterinarian?.user?.fullName || selectedDoctorName,
        time: `${values.selectedTime} ${new Date(values.selectedDate).toLocaleDateString('vi-VN')}`,
        service: serviceLabelByKey[values.service] || values.service,
        clinic: created?.clinic?.name || selectedClinic?.name || '',
        appointmentId: created?.id,
      };

      navigate('/success-booking', { state: { appointmentData } });
    } catch (error) {
      message.error(error.message || 'Đặt lịch thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-page">
      <header className="dashboard-header">
        <h1 style={{marginRight: '46%', paddingTop: 30}}>Chào, {userProfile?.fullName || 'bạn'}!</h1>
        <p style={{marginRight: '48%', paddingTop: 20}}>Cùng dành những điều tuyệt vời nhất cho các “bạn cưng” của bạn ngày hôm nay</p>
      </header>
      <Spin spinning={loading || submitting}>
        <div className="booking-content">
          <div className="form-column">
            <section className="step">
              <h2><span className="step-number">1</span> Chọn thú cưng của bạn</h2>
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
                    Thêm thú cưng mới
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
                <span className="step-number">2</span> Dịch vụ & Phòng khám
              </h2>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label={<span style={{ color: 'var(--color-text-primary)', padding: 2, fontSize: 16 }}>Chọn dịch vụ</span>}
                    name="service"
                    rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}
                  >
                    <Select
                      style={{ width: '100%', height: '70%' }}
                      options={serviceOptions}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={<span style={{ color: 'var(--color-text-primary)', padding: 2, fontSize: 16 }}>Phòng khám gần bạn</span>}
                    name="clinicId"
                    rules={[{ required: true, message: 'Vui lòng chọn phòng khám' }]}
                  >
                    <Select
                      style={{ width: '100%', height: '70%' }}
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
                <span className="step-number">3</span> Chọn Bác sĩ chuyên khoa
              </h2>

              <Row gutter={16} align="middle">
                <Col span={12}>
                  <Form.Item
                    label={<span style={{ color: 'var(--color-text-primary)', padding: 2, fontSize: 16 }}>Bác sĩ</span>}
                    name="doctorId"
                    rules={[{ required: true, message: 'Vui lòng chọn bác sĩ' }]}
                  >
                    <Select
                      style={{ width: '100%', marginBottom: 60 }}
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
                        {selectedDoctorName || 'Chưa chọn bác sĩ'}
                      </div>

                      <div style={{ color: 'var(--color-text-secondary)' }}>
                        {selectedDoctor?.specialty || 'Chưa có chuyên môn'}
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
              <div style={{ marginTop: 16 }}>
                <Form.Item
                  label={<span style={{ color: 'var(--color-text-primary)', padding: 2, fontSize: 16 }}>Triệu chứng</span>}
                  name="symptoms"
                  rules={[{ validator: validateSymptoms }]}
                >
                  <Input.TextArea
                    placeholder="Ghi triệu chứng của thú cưng"
                    rows={4}
                  />
                </Form.Item>
              </div>
            </section>

            <section className="step">
              <h2><span className="step-number">4</span> Chọn ngày & Giờ hẹn</h2>
              <div className="date-time-selector">
                <div className="calendar">
                  <div className="month-header" style={{color: 'var(--color-text-primary)'}}>
                    <button onClick={prevMonth}>&lt;</button>
                    <span>Tháng {calendarMonth + 1}, {calendarYear}</span>
                    <button onClick={nextMonth}>&gt;</button>
                  </div>
                  <table style={{color: 'var(--color-text-primary)'}}>
                    <thead>
                      <tr >
                        <th>CN</th>
                        <th>T2</th>
                        <th>T3</th>
                        <th>T4</th>
                        <th>T5</th>
                        <th>T6</th>
                        <th>T7</th>
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
                        <span >{group.label}</span>
                      </div>

                      <div className="slots-grid">
                        {group.times.map((timeValue) => {
                          const inPast = toDateTimeValue(selectedDate, timeValue) < new Date();
                          const isBooked = unavailableTimes.has(timeValue);
                          const disabled = inPast || isBooked;

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
            onClick={handleOpenSummary}
            style={{ width: '200px', border: '1px solid var(--color-brand-primary)' , padding: '10px', borderRadius:'10px', backgroundColor: 'var(--color-brand-primary)', color: 'var(--color-surface-card)' }}
          >
            Xác nhận
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
      <h3>Tóm tắt lịch hẹn</h3>
      {selectedPet && (
        <div className="summary-line">
          <span className="icon" aria-hidden>
            <SmileOutlined />
          </span>
          <div className="text">
            <div className="label">THÚ CƯNG</div>
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
          <div className="label">DỊCH VỤ</div>
          <div className="value">{serviceLabelByKey[service] || service}</div>
        </div>
      </div>

      <div className="summary-line">
        <span className="icon" aria-hidden>
          <UserOutlined />
        </span>
        <div className="text">
          <div className="label">BÁC SĨ</div>
          <div className="value">{selectedDoctorName || 'Chưa chọn'}</div>
        </div>
      </div>

      <div className="summary-line">
        <span className="icon" aria-hidden>
          <EnvironmentOutlined />
        </span>
        <div className="text">
          <div className="label">PHÒNG KHÁM</div>
          <div className="value">{selectedClinic?.name || 'Chưa chọn'}</div>
        </div>
      </div>

      <div className="summary-line">
        <span className="icon" aria-hidden>
          <ClockCircleOutlined />
        </span>
        <div className="text">
          <div className="label">THỜI GIAN</div>
          <div className="value">
            {selectedTime || 'Chưa chọn giờ'}, {getAppointmentDateLabel(selectedDate)}
          </div>
        </div>
      </div>

      <div className="modal-actions">
        <button
          className="btn-cancels"
          onClick={() => setShowSummary(false)}
        >
          Quay lại
        </button>

        <button
          className="btn-confirms"
          onClick={handleConfirm}
        >
          Xác nhận đặt lịch
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}


