import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

import { FaPaw } from "react-icons/fa";
import { FiCamera, FiCalendar } from "react-icons/fi";
import Header from '../../default/header';
import { message } from 'antd';
import {
  createPetApi,
  getBreedsBySpeciesApi,
  getPetSpeciesApi,
  uploadPetAvatarApi,
} from '../../api/petApi';

export default function AddPet() {
  const navigate = useNavigate();

  const [avatar, setAvatar] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [owner, setOwner] = useState('');
  const [speciesList, setSpeciesList] = useState([]);
  const [breedList, setBreedList] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef();
  const dateInputRef = useRef();

  const calculateAgeFromDate = (dateValue) => {
    if (!dateValue) {
      return '';
    }

    const today = new Date();
    const birthDate = new Date(dateValue);

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return `${Math.max(age, 0)} tuổi`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handlePickBirthday = () => {
    if (!dateInputRef.current) {
      return;
    }

    if (typeof dateInputRef.current.showPicker === 'function') {
      dateInputRef.current.showPicker();
      return;
    }

    dateInputRef.current.click();
  };
  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        setLoadingMeta(true);
        const speciesData = await getPetSpeciesApi();
        setSpeciesList(Array.isArray(speciesData) ? speciesData : []);
      } catch (error) {
        message.error(error.message || 'Không thể tải danh sách loài');
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchSpecies();
  }, []);

  useEffect(() => {
    if (!species) {
      setBreedList([]);
      setBreed('');
      return;
    }

    const fetchBreeds = async () => {
      try {
        setLoadingMeta(true);
        const breedsData = await getBreedsBySpeciesApi(species);
        const nextBreeds = Array.isArray(breedsData) ? breedsData : [];
        setBreedList(nextBreeds);

        if (nextBreeds.length > 0) {
          setBreed(nextBreeds[0].name || '');
        }
      } catch (error) {
        message.error(error.message || 'Không thể tải danh sách giống');
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchBreeds();
  }, [species]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !species || !breed || !gender || !birthday || !weight) {
      message.warning('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const matchedBreed =
      breedList.find(
        (item) => (item.name || '').toLowerCase() === breed.trim().toLowerCase(),
      ) || breedList[0];

    if (!matchedBreed?.id) {
      message.warning('Vui lòng chọn giống hợp lệ theo loài đã chọn');
      return;
    }

    let avatarUrl = '';

    try {
      if (avatarFile) {
        const uploadRes = await uploadPetAvatarApi(avatarFile);
        avatarUrl = uploadRes?.file || '';
      } else if (avatar && avatar.startsWith('http')) {
        avatarUrl = avatar;
      }
    } catch (error) {
      message.error(error.message || 'Không thể tải ảnh thú cưng');
      return;
    }

    if (!avatarUrl) {
      message.warning('Vui lòng tải ảnh đại diện thú cưng');
      return;
    }

    const payload = {
      name: name.trim(),
      breedId: matchedBreed.id,
      gender: gender === 'male',
      dateOfBirth: birthday,
      weight: Number(weight),
      avatar: avatarUrl,
      note: color,
    };

    try {
      setSubmitting(true);
      await createPetApi(payload);
      message.success('Thêm thú cưng mới thành công');
      navigate(-1);
    } catch (error) {
      message.error(error.message || 'Không thể thêm thú cưng');
    } finally {
      setSubmitting(false);
    }
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
                  list="breed-suggestion-list"
                  disabled={loadingMeta || !species}
                />
                <datalist id="breed-suggestion-list">
                  {breedList.map((item) => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label">Ngày sinh / Tuổi</label>
                <div className="date-age-input-wrapper">
                  <input
                    type="text"
                    className="form-input date-age-display"
                    value={calculateAgeFromDate(birthday)}
                    placeholder="Chọn ngày sinh để hiển thị tuổi"
                    readOnly
                  />
                  <button
                    type="button"
                    className="date-picker-button"
                    onClick={handlePickBirthday}
                    aria-label="Chọn ngày sinh"
                  >
                    <FiCalendar size={18} />
                  </button>
                  <input
                    type="date"
                    ref={dateInputRef}
                    className="hidden-date-input"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>
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
                  disabled={loadingMeta}
                >
                  <option value="">Chọn loài</option>
                  {speciesList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
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
              disabled={submitting}
            >
              {submitting ? 'Đang lưu...' : 'Thêm thú cưng mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}