import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

import { FaPaw } from "react-icons/fa";
import { FiCamera } from "react-icons/fi";
import Header from '../../../components/layout/header';
import { message, Radio, Select } from 'antd';
import {
  createPetApi,
  getBreedsBySpeciesApi,
  getPetSpeciesApi,
  uploadPetAvatarApi,
} from '../../../data/api/petApi';

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
    
    <div className="addPets-container">
      <div className="addPets-header-bar">
        <Header/>
        <div className="header-left">
          <FaPaw size={28} color="var(--c-13ecda)" />
          <h2 className="logo-name-small">PetcareX</h2>
        </div>
      </div>

      <div className="addPets-card">
        <div className="addPets-header">
          <h1 className="addPets-title">Thêm thú cưng mới</h1>
          <p className="addPets-subtitle">
            Vui lòng nhập đầy đủ thông tin để khởi tạo hồ sơ y tế cho thú cưng của bạn.
          </p>
        </div>

        <form className="addPets-form" onSubmit={handleSubmit}>

          <div className="form-groups upload-group">
            <label className="form-labels">Ảnh đại diện thú cưng</label>
            <div
              className="upload-box"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              {avatar ? (
                <img src={avatar} className="avatar-preview" alt="preview" />
              ) : (
                <>
                  <FiCamera size={36} color="var(--c-13ecda)" />
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
            <div className="form-groups">
              <label className="form-labels">Tên thú cưng</label>
              <input
                type="text"
                className="form-input"
                placeholder="VD: Buddy"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-groups">
              <label className="form-labels">Loài</label>
              <Select
                style={{ width: '100%' }} 
                value={species || undefined}
                onChange={(value) => setSpecies(value)}
                placeholder="Chọn loài"
                loading={loadingMeta}
                className="form-input"
                options={speciesList.map(item => ({
                  label: item.name,
                  value: item.id
                }))}
              />
            </div>

            <div className="form-groups">
              <label className="form-labels">Giống</label>
              <Select
                style={{ width: '100%', height: '100%' }}
                value={breed || undefined}
                onChange={(value) => setBreed(value)}
                placeholder="Chọn giống"
                loading={loadingMeta}
                disabled={!species}
                options={breedList.map(item => ({
                  label: item.name,
                  value: item.id
                }))}
              />
            </div>

            <div className="form-groups">
              <label className="form-labels">Giới tính</label>
              <Radio.Group
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="gender-radio-group"
              >
                <Radio.Button value="male" className="gender-radio">
                  Đực
                </Radio.Button>

                <Radio.Button value="female" className="gender-radio">
                  Cái
                </Radio.Button>
              </Radio.Group>
            </div>

            <div className="form-groups">
            <label className="form-labels">Ngày sinh</label>
            <input
              type="date"
              className="form-input date-input"
              value={birthday}
              max={new Date().toISOString().split('T')[0]} 
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

            <div className="form-groups">
              <label className="form-labels">Tuổi</label>
              <input
                type="text"
                className="form-input age-display"
                value={calculateAgeFromDate(birthday)}
                readOnly
              />
            </div>

            <div className="form-groups">
              <label className="form-labels">Màu lông / Đặc điểm</label>
              <input
                type="text"
                className="form-input"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>

            <div className="form-groups">
              <label className="form-labels">Cân nặng (kg)</label>
              <input
                type="number"
                className="form-input"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
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
                {submitting ? (
                  <>
                    <span className="spinner"></span> Đang lưu...
                  </>
                ) : (
                  'Thêm thú cưng mới'
                )}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}

