import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

import { FaPaw } from "react-icons/fa";
import { FiCamera } from "react-icons/fi";
import Header from '../../default/header';

export default function AddPet() {
  const navigate = useNavigate();

  const [avatar, setAvatar] = useState(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [owner, setOwner] = useState('');

  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ avatar, name, species, breed, gender, birthday, weight, color, owner });
  };

  return (
    
    <div className="addpet-container">
      <div className="addpet-header-bar">
        <Header/>
        <div className="header-left">
          <FaPaw size={28} color="#13ECDA" />
          <h2 className="logo-name-small">PetcareX</h2>
        </div>
      </div>

      <div className="addpet-card">
        <div className="addpet-header">
          <h1 className="addpet-title">Thêm thú cưng mới</h1>
          <p className="addpet-subtitle">
            Vui lòng nhập đầy đủ thông tin để khởi tạo hồ sơ y tế cho thú cưng của bạn.
          </p>
        </div>

        <form className="addpet-form" onSubmit={handleSubmit}>

          <div className="form-group upload-group">
            <label className="form-label">Ảnh đại diện thú cưng</label>
            <div
              className="upload-box"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              {avatar ? (
                <img src={avatar} className="avatar-preview" alt="preview" />
              ) : (
                <>
                  <FiCamera size={36} color="#13ECDA" />
                  <p className="upload-text">Tải lên hình ảnh thú cưng của bạn</p>
                  <button
                    type="button"
                    className="choose-file-button"
                  >
                    Chọn tệp tin
                  </button>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden-file-input"
              onChange={handleFileChange}
            />
          </div>

          <div className="basic-info-section">
            <h2 className="section-title-small">Thông tin cơ bản</h2>
            <div className="grid-two-column">
            <div className="column">
              <div className="form-group">
                <label className="form-label">Tên thú cưng</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Buddy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Giống</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Poodle, Golden Retriever"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ngày sinh / Tuổi</label>
                <input
                  type="date"
                  className="form-input"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Màu lông / Đặc điểm nhận dạng</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Có đốm đen ở tai"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            </div>

            {/* right column */}
            <div className="column">
              <div className="form-group">
                <label className="form-label">Loài</label>
                <select
                  className="form-input"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                >
                  <option value="">Chọn loài</option>
                  <option value="dog">Chó</option>
                  <option value="cat">Mèo</option>
                  <option value="bird">Chim</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Giới tính</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={gender === 'male'}
                      onChange={(e) => setGender(e.target.value)}
                    /> Đực
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={gender === 'female'}
                      onChange={(e) => setGender(e.target.value)}
                    /> Cái
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cân nặng (kg)</label>
                <input
                  type="number"
                  className="form-input"
                  step="0.1"
                  placeholder="0.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tên chủ thú cưng</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Trương Công Thành"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </div>
            </div>
            </div>
          </div>

          <div className="button-group">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate(-1)}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="submit-button"
            >
              Thêm thú cưng mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
