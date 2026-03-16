import React, { useEffect, useMemo, useState } from 'react';
import { message, Spin } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles.css';
import Header from '../../default/header';
import Footer from '../../default/footer';
import { useAuth } from '../../context/AuthContext';
import { getMyPetsApi } from '../../api/petApi';
import { getClinicByIdApi, getClinicListApi } from '../../api/clinicApi';
import { getVeterinarianByClinicApi } from '../../api/veterinarianApi';
import {
  APPOINTMENT_STATUS,
  createAppointmentApi,
  getMyAppointmentsApi,
  SERVICE_OPTIONS,
} from '../../api/appointmentApi';

const WORKING_SLOTS = ['08:00', '09:00', '10:30', '13:30', '15:00', '16:30'];

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
  const location = useLocation();
  const { userProfile } = useAuth();
  const today = useMemo(() => new Date(), []);

  const preselectedClinicId = useMemo(() => {
    const clinicIdFromState =
      location.state?.selectedClinicId ||
      (location.state?.clinic?.id ? String(location.state.clinic.id) : '');

    return clinicIdFromState || sessionStorage.getItem('selectedClinicId') || '';
  }, [location.state]);

  const [selectedPet, setSelectedPet] = useState(null);
  const [service, setService] = useState(SERVICE_OPTIONS[0]);
  const [clinicId, setClinicId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [selectedTime, setSelectedTime] = useState('');
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [pets, setPets] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [clinicDetail, setClinicDetail] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);

  const selectedClinic = useMemo(
    () => clinicDetail || clinics.find((item) => item.id === clinicId) || null,
    [clinicDetail, clinicId, clinics],
  );

  const selectedDoctor = useMemo(
    () => doctors.find((item) => item.userId === doctorId) || null,
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
        setClinicId(String(preselectedClinicId));
        return;
      }

      setClinicId((prev) => prev || clinicList[0].id);
    }
  };

  const fetchAppointments = async () => {
    const res = await getMyAppointmentsApi(1, 200);
    setMyAppointments(Array.isArray(res?.items) ? res.items : []);
  };

  const fetchDoctorsByClinic = async (nextClinicId) => {
    if (!nextClinicId) {
      setDoctors([]);
      setDoctorId('');
      return;
    }

    const res = await getVeterinarianByClinicApi(nextClinicId, 1, 50);
    const doctorList = Array.isArray(res?.items) ? res.items : [];
    setDoctors(doctorList);
    if (doctorList.length > 0) {
      setDoctorId(doctorList[0].userId);
    } else {
      setDoctorId('');
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
      setClinicId(String(preselectedClinicId));
    }
  }, [preselectedClinicId]);

  useEffect(() => {
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
      setSelectedTime('');
    }
  }, [selectedDate, selectedTime, unavailableTimes]);

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

  const handleShowMyPets = async () => {
    try {
      setLoading(true);
      await fetchPets();
      message.success('Đã cập nhật danh sách thú cưng mới nhất');
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật danh sách thú cưng');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPet?.id) {
      message.warning('Vui lòng chọn thú cưng');
      return;
    }

    if (!clinicId || !doctorId) {
      message.warning('Vui lòng chọn phòng khám và bác sĩ');
      return;
    }

    if (!selectedDate || !selectedTime) {
      message.warning('Vui lòng chọn ngày và giờ hẹn');
      return;
    }

    if (!symptoms.trim()) {
      message.warning('Vui lòng nhập ghi chú triệu chứng');
      return;
    }

    const chosenDateTime = toDateTimeValue(selectedDate, selectedTime);
    if (chosenDateTime < new Date()) {
      message.warning('Không thể đặt lịch trong quá khứ');
      return;
    }

    if (unavailableTimes.has(selectedTime)) {
      message.warning('Khung giờ này đã có lịch, vui lòng chọn giờ khác');
      return;
    }

    const payload = {
      petId: selectedPet.id,
      veterinarianId: doctorId,
      clinicId,
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      service,
      note: symptoms.trim(),
    };

    try {
      setSubmitting(true);
      const created = await createAppointmentApi(payload);
      await fetchAppointments();

      const appointmentData = {
        petName: created?.pet?.name || selectedPet.name,
        doctorName: created?.veterinarian?.user?.fullName || selectedDoctorName,
        time: `${selectedTime} ${new Date(selectedDate).toLocaleDateString('vi-VN')}`,
        service,
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
      <Header />
      <header className="dashboard-header">
        <h1 style={{marginRight: '40%'}}>Chào mừng trở lại, {userProfile?.fullName || 'bạn'}!</h1>
        <p style={{marginRight: '60%'}}>Cùng dành những điều tuyệt vời nhất cho các “bạn cưng” của bạn ngày hôm nay</p>
      </header>
      <Spin spinning={loading || submitting}>
        <div className="booking-content">
          <div className="form-column">
            <section className="step">
              <h2><span className="step-number">1</span> Chọn thú cưng của bạn</h2>
              <div className="pet-list">
                {pets.map((p) => (
                  <div
                    key={p.id}
                    className={`pet-card ${selectedPet?.id === p.id ? 'selected' : ''}`}
                    onClick={() => handlePetClick(p)}
                  >
                    {selectedPet?.id === p.id && <span className="check">✓</span>}
                    <img src={p.avatar || '/gaugau.png'} alt={p.name} />
                    <div className="info">
                      <span className="name">{p.name}</span>
                      <span className="sub">{p.breed?.name || 'Chưa có giống'}</span>
                    </div>
                  </div>
                ))}
                <article
                  className="pet-card add-new"
                  onClick={() => handleAddPet()}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="add-text">Thêm thú cưng mới</span>
                </article>
              </div>
            </section>

            <section className="step">
              <h2><span className="step-number">2</span> Dịch vụ & Phòng khám</h2>
              <div className="row row-inline">
                <div className="field-col">
                  <label>Chọn dịch vụ</label>
                  <select value={service} onChange={(e) => setService(e.target.value)}>
                    {SERVICE_OPTIONS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className="field-col">
                  <label>Phòng khám gần bạn</label>
                  <select
                    value={clinicId}
                    onChange={(e) => setClinicId(e.target.value)}
                    disabled={Boolean(preselectedClinicId)}
                  >
                    {clinics.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="step">
              <h2><span className="step-number">3</span> Chọn Bác sĩ chuyên khoa</h2>
              <div className="row row-inline">
                <div className="field-col">
                  <label>Bác sĩ</label>
                  <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                    {doctors.map((item) => (
                      <option key={item.userId} value={item.userId}>{item.user?.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="field-col doctor-card">
                  <div className="card-content">
                    <img src={selectedDoctor?.user?.avatarUrl || '/bs1.png'} alt={selectedDoctorName || 'Bác sĩ'} />
                    <div className="info">
                      <strong>{selectedDoctorName || 'Chưa chọn bác sĩ'}</strong>
                      <span>{selectedDoctor?.specialty || 'Chưa có chuyên môn'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                <label>Triệu chứng</label>
                <textarea
                  placeholder="Ghi triệu chứng của thú cưng"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  style={{ color:'#333' }}
                />
              </div>
            </section>

            <section className="step">
              <h2><span className="step-number">4</span> Chọn ngày & Giờ hẹn</h2>
              <div className="date-time-selector">
                <div className="calendar">
                  <div className="month-header" style={{color: '#333'}}>
                    <button onClick={prevMonth}>&lt;</button>
                    <span>Tháng {calendarMonth + 1}, {calendarYear}</span>
                    <button onClick={nextMonth}>&gt;</button>
                  </div>
                  <table style={{color: '#333'}}>
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
                                    setSelectedDate(currentDate);
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
                <div className="time-slots" style={{color: '#333'}}>
                  {WORKING_SLOTS.map((timeValue) => {
                    const inPast = toDateTimeValue(selectedDate, timeValue) < new Date();
                    const isBooked = unavailableTimes.has(timeValue);
                    const disabled = inPast || isBooked;

                    return (
                      <div
                        key={timeValue}
                        className={`slot ${selectedTime === timeValue ? 'selected' : ''} ${disabled ? 'disabled-slot' : ''}`}
                        onClick={() => {
                          if (!disabled) {
                            setSelectedTime(timeValue);
                          }
                        }}
                      >
                        {timeValue}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          <aside className="summary-column">
            <div className="summary-card">
              <h3>Tóm tắt lịch hẹn</h3>
              <p>Vui lòng kiểm tra kỹ thông tin</p>
              {selectedPet && (
                <div className="summary-line">
                  <span className="icon">🐾</span>
                  <div className="text">
                    <div className="label">THÚ CƯNG</div>
                    <div className="value">{selectedPet.name} ({selectedPet.breed?.name || 'Chưa có giống'})</div>
                  </div>
                </div>
              )}
              <div className="summary-line">
                <span className="icon">🩺</span>
                <div className="text">
                  <div className="label">DỊCH VỤ</div>
                  <div className="value">{service}</div>
                </div>
              </div>
              <div className="summary-line">
                <span className="icon">👨‍⚕️</span>
                <div className="text">
                  <div className="label">BÁC SĨ</div>
                  <div className="value">{selectedDoctorName || 'Chưa chọn'}</div>
                </div>
              </div>
              <div className="summary-line">
                <span className="icon">🏥</span>
                <div className="text">
                  <div className="label">PHÒNG KHÁM</div>
                  <div className="value">{selectedClinic?.name || 'Chưa chọn'}</div>
                </div>
              </div>
              <div className="summary-line">
                <span className="icon">⏰</span>
                <div className="text">
                  <div className="label">THỜI GIAN</div>
                  <div className="value">{selectedTime || 'Chưa chọn giờ'}, {getAppointmentDateLabel(selectedDate)}</div>
                </div>
              </div>
              <hr />
              <button className="btn-confirm" onClick={handleConfirm}>
                Xác nhận đặt lịch →
              </button>
              <p className="footnote">Khung giờ mờ là giờ đã qua hoặc đã có lịch đặt.</p>
            </div>
          </aside>
        </div>
      </Spin>

      <Footer />
    </div>
  );
}
