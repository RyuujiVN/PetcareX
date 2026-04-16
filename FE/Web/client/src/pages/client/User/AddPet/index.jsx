import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './styles.css';

import { ManOutlined, WomanOutlined } from "@ant-design/icons";
import { message, Modal, Radio, Select } from 'antd';
import { FiCamera } from "react-icons/fi";
import {
  createPetApi,
  getBreedLabel,
  getBreedsBySpeciesApi,
  getPetSpeciesApi,
  getSpeciesLabel,
  uploadPetAvatarApi,
} from '../../../../services/petService';
import { getClientInstance } from '../../../../services/apiClient';

export default function AddPet() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fileInputRef = useRef();

  const calculateAgeFromDate = (dateValue) => {
    if (!dateValue) {
      return '';
    }

    const today = new Date();
    const birthDate = new Date(dateValue);

    if (Number.isNaN(birthDate.getTime())) {
      return '';
    }

    let totalMonths =
      (today.getFullYear() - birthDate.getFullYear()) * 12 +
      (today.getMonth() - birthDate.getMonth());

    if (today.getDate() < birthDate.getDate()) {
      totalMonths -= 1;
    }

    if (totalMonths < 0) {
      return '';
    }

    if (totalMonths < 24) {
      return t('pages.addPet.age.months', { count: totalMonths });
    }

    return t('pages.addPet.age.years', { count: Math.floor(totalMonths / 12) });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatar(URL.createObjectURL(file));
    setUploadingAvatar(true);
    setHasUnsavedChanges(true);

    try {
      const uploadRes = await uploadPetAvatarApi(file);
      const nextAvatarUrl = uploadRes?.file || '';

      if (!nextAvatarUrl) {
        throw new Error(t('pages.addPet.uploadNoUrl'));
      }

      setUploadedAvatarUrl(nextAvatarUrl);
      message.success(t('pages.addPet.uploadSuccess'));
    } catch (error) {
      setAvatarFile(null);
      setAvatar(null);
      setUploadedAvatarUrl('');
      message.error(error.message || t('pages.addPet.uploadFailed'));
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };


  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        setLoadingMeta(true);
        const speciesData = await getPetSpeciesApi(getClientInstance());
        setSpeciesList(Array.isArray(speciesData) ? speciesData : []);
      } catch (error) {
        message.error(error.message || t('pages.addPet.loadSpeciesFailed'));
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
        const breedsData = await getBreedsBySpeciesApi(getClientInstance(), species);
        const nextBreeds = Array.isArray(breedsData) ? breedsData : [];
        setBreedList(nextBreeds);

        if (nextBreeds.length > 0) {
          setBreed(nextBreeds[0] || '');
        }
      } catch (error) {
        message.error(error.message || t('pages.addPet.loadBreedFailed'));
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchBreeds();
  }, [species]);

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (uploadingAvatar) {
      message.warning(t('pages.addPet.validation.avatarUploading'));
      return;
    }

    if (!name || !species || !breed || !gender || !birthday || !weight) {
      message.warning(t('pages.addPet.validation.requiredFields'));
      return;
    }

    const matchedBreed = breedList.find((item) => item === breed) || '';

    if (!matchedBreed) {
      message.warning(t('pages.addPet.validation.invalidBreed'));
      return;
    }

    let avatarUrl = uploadedAvatarUrl || '';

    if (!avatarUrl && avatar && avatar.startsWith('http')) {
      avatarUrl = avatar;
    }

    if (!avatarUrl) {
      message.warning(t('pages.addPet.validation.avatarRequired'));
      return;
    }

    const payload = {
      name: name.trim(),
      species,
      breed: matchedBreed,
      gender: gender === 'male',
      dateOfBirth: birthday,
      weight: Number(weight),
      avatar: avatarUrl,
      note: color,
    };

    try {
      setSubmitting(true);
      await createPetApi(getClientInstance(), payload);
      message.success(t('pages.addPet.createSuccess'));
      setHasUnsavedChanges(false);
      navigate(-1);
    } catch (error) {
      message.error(error.message || t('pages.addPet.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!hasUnsavedChanges) {
      navigate(-1);
      return;
    }

    Modal.confirm({
      title: t('pages.addPet.confirmLeave.title'),
      content: t('pages.addPet.confirmLeave.content'),
      okText: t('pages.addPet.confirmLeave.okText'),
      cancelText: t('pages.addPet.confirmLeave.cancelText'),
      centered: true,
      onOk: async () => {
        await handleSubmit();
      },
      onCancel: () => {
        setHasUnsavedChanges(false);
        navigate(-1);
      },
    });
  };

  const requiredLabel = (text) => (
    <>
      <span className="required-mark">*</span> {text}
    </>
  );

  return (
    
    <div className="addPets-container">
      <div className="addPets-card">
        <div className="addPets-header">
          <h1 className="addPets-title">{t('pages.addPet.header.title')}</h1>
          <p className="addPets-subtitle">
            {t('pages.addPet.header.subtitle')}
          </p>
        </div>

        <form className="addPets-form" onSubmit={handleSubmit}>

          <div className="form-groups upload-group">
            <label className="form-labels" style={{fontWeight: 'bold'}}>{requiredLabel(t('pages.addPet.fields.avatarLabel'))}</label>
            <div
              className="upload-box"
              onClick={() => {
                if (uploadingAvatar || submitting) return;
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
            >
              {avatar ? (
                <img src={avatar} className="avatar-preview" alt="preview" />
              ) : (
                <>
                  <FiCamera size={36} color="var(--c-13ecda)" />
                  <p className="upload-text">
                    {uploadingAvatar ? t('pages.addPet.uploadingImage') : t('pages.addPet.uploadHint')}
                  </p>
                  <button
                    type="button"
                    className="choose-file-button"
                    disabled={uploadingAvatar || submitting}
                  >
                    {t('pages.addPet.chooseFile')}
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
              disabled={uploadingAvatar || submitting}
            />
          </div>

          <div className="basic-info-section">
            <h2 className="section-title-small">{t('pages.addPet.sections.basicInfo')}</h2>
            <div className="grid-two-column">
            <div className="form-groups">
              <label className="form-labels">{requiredLabel(t('pages.addPet.fields.petName'))}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('pages.addPet.placeholders.petName')}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            <div className="form-groups">
              <label className="form-labels">{requiredLabel(t('pages.addPet.fields.species'))}</label>
              <Select
                style={{ width: '100%' }} 
                value={species || undefined}
                onChange={(value) => {
                  setSpecies(value);
                  setHasUnsavedChanges(true);
                }}
                placeholder={t('pages.addPet.placeholders.species')}
                loading={loadingMeta}
                className="form-input"
                options={speciesList.map(item => ({
                  label: getSpeciesLabel(item),
                  value: item
                }))}
              />
            </div>

            <div className="form-groups">
              <label className="form-labels">{requiredLabel(t('pages.addPet.fields.breed'))}</label>
              <Select
                style={{ width: '100%', height: '100%' }}
                value={breed || undefined}
                onChange={(value) => {
                  setBreed(value);
                  setHasUnsavedChanges(true);
                }}
                placeholder={t('pages.addPet.placeholders.breed')}
                loading={loadingMeta}
                disabled={!species}
                options={breedList.map(item => ({
                  label: getBreedLabel(item, species),
                  value: item
                }))}
              />
            </div>

            <div className="form-groups">
              <label className="form-labels">{requiredLabel(t('pages.addPet.fields.gender'))}</label>
              <Radio.Group
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="gender-radio-group"
              >
                <Radio.Button value="male" className="gender-radio">
                  <span className="gender-radio-content">
                    <ManOutlined />
                    <span>{t('pages.addPet.gender.male')}</span>
                  </span>
                </Radio.Button>

                <Radio.Button value="female" className="gender-radio">
                  <span className="gender-radio-content">
                    <WomanOutlined />
                    <span>{t('pages.addPet.gender.female')}</span>
                  </span>
                </Radio.Button>
              </Radio.Group>
            </div>

            <div className="form-groups">
            <label className="form-labels">{requiredLabel(t('pages.addPet.fields.birthday'))}</label>
            <input
              type="date"
              className="form-input date-input"
              value={birthday}
              max={new Date().toISOString().split('T')[0]} 
              onChange={(e) => {
                setBirthday(e.target.value);
                setHasUnsavedChanges(true);
              }}
            />
          </div>

            <div className="form-groups">
              <label className="form-labels">{t('pages.addPet.fields.age')}</label>
              <input
                type="text"
                className="form-input age-display"
                value={calculateAgeFromDate(birthday)}
                readOnly
              />
            </div>

            <div className="form-groups">
              <label className="form-labels">{t('pages.addPet.fields.features')}</label>
              <input
                type="text"
                className="form-input"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

            <div className="form-groups">
              <label className="form-labels">{requiredLabel(t('pages.addPet.fields.weight'))}</label>
              <input
                type="number"
                className="form-input"
                step="0.1"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>

          </div>
          </div>

          <div className="button-group">
            <button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
              disabled={submitting || uploadingAvatar}
            >
              {t('pages.addPet.actions.cancel')}
            </button>
            <button
                type="submit"
                className="submit-button"
                disabled={submitting || uploadingAvatar}
              >
                {submitting ? (
                  <>
                    <span className="spinner"></span> {t('pages.addPet.actions.saving')}
                  </>
                ) : uploadingAvatar ? (
                  t('pages.addPet.actions.uploading')
                ) : (
                  t('pages.addPet.actions.submit')
                )}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}
