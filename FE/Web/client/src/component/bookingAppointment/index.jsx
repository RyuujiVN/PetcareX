import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import Header from '../../default/header';
import Footer from '../../default/footer';

export default function BookingAppointment() {
  const navigate = useNavigate();


  const [selectedPet, setSelectedPet] = useState(null);
  const [service, setService] = useState('Khám sức khỏe định kỳ');
  const [clinic, setClinic] = useState('PetCar - Lê Duẩn');
  const [doctor, setDoctor] = useState('BS. Đặng Hoàng Nam');
  const [symptoms, setSymptoms] = useState('');
  const [selectedDate, setSelectedDate] = useState('2024-05-20');
  const [selectedTime, setSelectedTime] = useState('09:00 AM');
  const [calendarYear, setCalendarYear] = useState(2024);
  const [calendarMonth, setCalendarMonth] = useState(4);

  const pets = [
    { id: 1, name: 'LuLu', subtitle: 'Mèo Anh lông ngắn', avatar: './public/lulu.png' },
    { id: 2, name: 'Bắp', subtitle: 'Poodle', avatar: './public/meomeo.png' }
  ];

  // calendar helpers
  function getWeeks(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks = [];
    let week = new Array(7).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const weekday = date.getDay();
      week[weekday] = d;
      if (weekday === 6 || d === lastDay.getDate()) {
        weeks.push(week);
        week = new Array(7).fill(null);
      }
    }
    return weeks;
  }
  function prevMonth() {
    let m = calendarMonth - 1;
    let y = calendarYear;
    if (m < 0) { m = 11; y -= 1; }
    setCalendarMonth(m);
    setCalendarYear(y);
  }
  function nextMonth() {
    let m = calendarMonth + 1;
    let y = calendarYear;
    if (m > 11) { m = 0; y += 1; }
    setCalendarMonth(m);
    setCalendarYear(y);
  }

  const times = ['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM'];

  function handlePetClick(p) {
    setSelectedPet(p);
  }

  function handleConfirm() {
    alert('Đã xác nhận đặt lịch!');
  }

  return (
    <div className="booking-page">
      <Header />
       <header className="dashboard-header">
        <h1>Chào mừng trở lại, Công Thành!</h1>
        <p>Cùng dành những điều tuyệt vời nhất cho các “bạn cưng” của bạn ngày hôm nay</p>
      </header>
      <div className="booking-content">
        <div className="form-column">
          <section className="step">
            <h2><span className="step-number">1</span> Chọn thú cưng của bạn</h2>
            <div className="pet-list">
              {pets.map(p => (
                <div
                  key={p.id}
                  className={`pet-card ${selectedPet?.id === p.id ? 'selected' : ''}`}
                  onClick={() => handlePetClick(p)}
                >
                  {selectedPet?.id === p.id && <span className="check">✓</span>}
                  <img src={p.avatar} alt={p.name} />
                  <div className="info">
                    <span className="name">{p.name}</span>
                    <span className="sub">{p.subtitle}</span>
                  </div>
                </div>
              ))}
              {/* <div className="pet-card add-new">
                <span> Thêm thú cưng</span>
              </div> */}
              <article className="pet-card add-new" onClick={() => navigate('/add-pet')} style={{cursor: 'pointer'}}>
                  <span className="add-text">Thêm thú cưng mới</span>
              </article>
            </div>
          </section>

          <section className="step">
            <h2><span className="step-number">2</span> Dịch vụ & Phòng khám</h2>
            <div className="row row-inline">
              <div className="field-col">
                <label>Chọn dịch vụ</label>
                <select value={service} onChange={e => setService(e.target.value)}>
                  <option>Khám sức khỏe định kỳ</option>
                  <option>Tiêm phòng</option>
                  <option>Chẩn đoán bệnh</option>
                </select>
              </div>
              <div className="field-col">
                <label>Phòng khám gần bạn</label>
                <select value={clinic} onChange={e => setClinic(e.target.value)}>
                  <option>PetCar - Lê Duẩn</option>
                  <option>PetCar - Nguyễn Huệ</option>
                </select>
              </div>
            </div>
          </section>

          <section className="step">
            <h2><span className="step-number">3</span> Chọn Bác sĩ chuyên khoa</h2>
            <div className="row row-inline">
              <div className="field-col">
                <label>Bác sĩ</label>
                <select value={doctor} onChange={e => setDoctor(e.target.value)}>
                  <option>BS. Đặng Hoàng Nam</option>
                  <option>BS. Nguyễn Thị Mai</option>
                </select>
              </div>
              <div className="field-col doctor-card">
                <div className="card-content">
                  <img src="./public/bs1.png" alt="BS. Đặng Hoàng Nam" />
                  <div className="info">
                    <strong>BS. Đặng Hoàng Nam</strong>
                    <span>Chuyên khoa nội tiết & tiêu hóa</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <label>Triệu chứng</label>
              <textarea
                placeholder="Ghi triệu chứng của thú cưng"
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
              />
            </div>
          </section>

          <section className="step">
            <h2><span className="step-number">4</span> Chọn ngày & Giờ hẹn</h2>
            <div className="date-time-selector">
              <div className="calendar">
                <div className="month-header">
                  <button onClick={prevMonth}>&lt;</button>
                  <span>Tháng {calendarMonth+1}, {calendarYear}</span>
                  <button onClick={nextMonth}>&gt;</button>
                </div>
                <table>
                  <thead>
                    <tr>
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
                          const isSelected = day && selectedDate.endsWith(`-${String(day).padStart(2,'0')}`);
                          return (
                            <td
                              key={j}
                              className={isSelected ? 'selected-day' : ''}
                              onClick={() => {
                                if (day) {
                                  const d = String(day).padStart(2,'0');
                                  const m = String(calendarMonth+1).padStart(2,'0');
                                  setSelectedDate(`${calendarYear}-${m}-${d}`);
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
              <div className="time-slots">
                {times.map(t => (
                  <div
                    key={t}
                    className={`slot ${selectedTime === t ? 'selected' : ''}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </div>
                ))}
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
                  <div className="value">{selectedPet.name} ({selectedPet.subtitle})</div>
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
                <div className="value">{doctor}</div>
              </div>
            </div>
            <div className="summary-line">
              <span className="icon">⏰</span>
              <div className="text">
                <div className="label">THỜI GIAN</div>
                <div className="value">{selectedTime}, {new Date(selectedDate).toLocaleDateString('vi-VN')}</div>
              </div>
            </div>
            <hr />
            <button className="btn-confirm" onClick={handleConfirm}>
              Xác nhận đặt lịch →
            </button>
            <p className="footnote">Bằng cách nhấn xác nhận, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của PetCar.</p>
          </div>
        </aside>
      </div>
      <Footer />
    </div>
  );
}