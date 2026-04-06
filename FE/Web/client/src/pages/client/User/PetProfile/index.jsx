import {
  ManOutlined,
  WomanOutlined,
  CameraOutlined,
  UserOutlined,
  CalendarOutlined
} from "@ant-design/icons";

import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Modal,
  Card,
  Space,
  Spin,
  Radio,
  DatePicker
} from "antd";

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { getUserProfileApi } from "../../../../services/userService";
import { getClientInstance } from "../../../../services/apiClient";
import {
  getBreedLabel,
  getPetByIdApi,
  getBreedsBySpeciesApi,
  getMyPetsApi,
  getPetSpeciesApi,
  getSpeciesLabel,
  uploadPetAvatarApi,
  updatePetApi,
} from "../../../../services/petService";

import dayjs from "dayjs";

import "./styles.css";

export default function PetProfile() {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState('');
  const [petData, setPetData] = useState(null);
  const [ownerName, setOwnerName] = useState("");
  const [speciesList, setSpeciesList] = useState([]);
  const [breedList, setBreedList] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState("");
  const [currentPetId, setCurrentPetId] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const navigate = useNavigate();

  const normalizeGenderValue = (gender) => {
    if (typeof gender === "string") {
      const normalized = gender.trim().toLowerCase();
      if (["male", "duc", "đực", "true", "1"].includes(normalized)) {
        return "Đực";
      }
      if (["female", "cai", "cái", "false", "0"].includes(normalized)) {
        return "Cái";
      }
    }

    return gender ? "Đực" : "Cái";
  };

  useEffect(() => {
    fetchUser();
    fetchSpecies();
  }, []);

  useEffect(() => {
    fetchPetData();
  }, []);

  useEffect(() => {
    if (!selectedSpeciesId) {
      setBreedList([]);
      return;
    }

    fetchBreedsBySpecies(selectedSpeciesId);
  }, [selectedSpeciesId]);

  useEffect(() => {
    if (!ownerName) {
      return;
    }

    form.setFieldValue("owner", ownerName);
    setPetData((prev) => (prev ? { ...prev, owner: prev.owner || ownerName } : prev));
  }, [ownerName, form]);

  const fetchUser = async () => {
    try {
      const res = await getUserProfileApi(getClientInstance());
      setOwnerName(res.data?.fullName || "");
    } catch (error) {
      message.warning(t('pages.petProfile.loadUserFailed'));
    }
  };

  const fetchSpecies = async () => {
    try {
      const speciesData = await getPetSpeciesApi(getClientInstance());
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);
    } catch (error) {
      message.error(error.message || t('pages.petProfile.loadSpeciesFailed'));
    }
  };

  const fetchBreedsBySpecies = async (speciesId) => {
    try {
      const breedsData = await getBreedsBySpeciesApi(getClientInstance(), speciesId);
      setBreedList(Array.isArray(breedsData) ? breedsData : []);
    } catch (error) {
      message.error(error.message || t('pages.petProfile.loadBreedFailed'));
    }
  };

  const fetchPetData = async () => {
    try {
      setLoading(true);

      const petIdFromQuery = searchParams.get("id");
      let petInfo = null;

      if (petIdFromQuery) {
        try {
          petInfo = await getPetByIdApi(getClientInstance(), petIdFromQuery);
        } catch (error) {
          petInfo = null;
        }
      }

      if (!petInfo) {
        const pets = await getMyPetsApi(getClientInstance());
        const petList = Array.isArray(pets) ? pets : [];
        petInfo = petIdFromQuery
          ? petList.find((item) => item.id === petIdFromQuery)
          : petList[0];
      }

      if (!petInfo) {
        message.warning(t('pages.petProfile.noPet'));
        return;
      }

      const speciesValue = petInfo.species || "";
      setCurrentPetId(petInfo.id || "");
      setSelectedSpeciesId(speciesValue);

      const mappedPetData = {
        id: petInfo.id,
        petName: petInfo.name || "",
        species: speciesValue,
        breed: petInfo.breed || "",
        gender: normalizeGenderValue(petInfo.gender),
        birthDate: petInfo.dateOfBirth || null,
        weight: petInfo.weight ? Number(petInfo.weight) : "",
        features: petInfo.note || "",
        owner: ownerName,
        avatar: petInfo.avatar || null,
      };

      setPetData(mappedPetData);

      form.setFieldsValue({
        petName: mappedPetData.petName,
        species: mappedPetData.species || undefined,
        breed: mappedPetData.breed,
        gender: mappedPetData.gender,
        birthDate: mappedPetData.birthDate ? dayjs(mappedPetData.birthDate) : null,
        weight: mappedPetData.weight,
        features: mappedPetData.features,
        owner: mappedPetData.owner,
      });

      setImagePreview(mappedPetData.avatar);
      setUploadedAvatarUrl(mappedPetData.avatar || '');
      setHasUnsavedChanges(false);
    } catch (error) {
      message.error(error.message || t('pages.petProfile.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);

    try {
      const uploadResult = await uploadPetAvatarApi(file);
      const nextAvatarUrl = uploadResult?.file || '';

      if (!nextAvatarUrl) {
        throw new Error(t('pages.petProfile.uploadNoUrl'));
      }

      setUploadedAvatarUrl(nextAvatarUrl);
      message.success(t('pages.petProfile.uploadSuccess'));
    } catch (error) {
      setImagePreview(petData?.avatar || null);
      setUploadedAvatarUrl(petData?.avatar || '');
      message.error(error.message || t('pages.petProfile.uploadFailed'));
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (values) => {
    if (uploadingAvatar) {
      message.warning(t('pages.petProfile.validation.avatarUploading'));
      return;
    }

    if (!currentPetId) {
      message.error(t('pages.petProfile.validation.petNotFound'));
      return;
    }

    const matchedBreed =
      breedList.find((item) => item === values.breed) ||
      breedList.find((item) => String(item).toLowerCase() === String(values.breed || "").trim().toLowerCase()) ||
      "";

    if (!matchedBreed) {
      message.warning(t('pages.petProfile.validation.invalidBreed'));
      return;
    }

    try {
      setLoading(true);

      const avatarUrl = uploadedAvatarUrl || petData?.avatar || "";

      const updatePayload = {
        name: values.petName,
        species: values.species,
        breed: matchedBreed,
        gender: values.gender === "Đực",
        dateOfBirth: values.birthDate ? values.birthDate.format("YYYY-MM-DD") : null,
        weight: Number(values.weight),
        note: values.features,
        avatar: avatarUrl,
      };

      await updatePetApi(getClientInstance(), currentPetId, updatePayload);

      setPetData((prev) => ({
        ...prev,
        petName: values.petName,
        species: values.species,
        breed: values.breed,
        gender: values.gender,
        birthDate: updatePayload.dateOfBirth,
        weight: Number(values.weight),
        features: values.features,
        owner: values.owner,
        avatar: avatarUrl,
      }));

      setHasUnsavedChanges(false);

      message.success(t('pages.petProfile.updateSuccess'));
      navigate(-1);
    } catch (error) {
      message.error(error.message || t('pages.petProfile.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!hasUnsavedChanges) {
      navigate(-1);
      return;
    }

    Modal.confirm({
      title: t('pages.petProfile.confirmCancel.title'),
      content: t('pages.petProfile.confirmCancel.content'),
      okText: t('pages.petProfile.confirmCancel.okText'),
      cancelText: t('pages.petProfile.confirmCancel.cancelText'),
      centered: true,
      onOk: () => {
        message.info(t('pages.petProfile.confirmCancel.successInfo'));
        navigate(-1);
      },
    });
  };

  if (loading && !petData) {
    return (
      <div className="profile-loading">
        <Spin size="large" />
      </div>
    );
  }

  const petAge = petData?.birthDate
    ? dayjs().diff(dayjs(petData.birthDate), "year")
    : null;

  return (

    <div className="profile-container">

      <div className="profile-wrapper">

        {/* <div className="profile-header"> */}
          <div className="profile-avatar-section">

            <div
              className={`profile-cover ${imagePreview ? "has-cover-image" : "no-cover-image"}`}
              style={
                imagePreview
                  ? {
                      backgroundImage: `linear-gradient(120deg, rgba(13, 26, 53, 0.3) 8%, rgba(40, 93, 170, 0.26) 62%, rgba(116, 160, 220, 0.22) 100%), url(${imagePreview})`,
                    }
                  : undefined
              }
            >

              {!imagePreview && (
                <div className="profile-cover-placeholder">
                  <UserOutlined />
                </div>
              )}

              <label
                htmlFor="avatar-upload"
                className="cover-upload-btn"
                style={{
                  opacity: uploadingAvatar || loading ? 0.5 : 1,
                  pointerEvents: uploadingAvatar || loading ? "none" : "auto",
                }}
              >
                <CameraOutlined />
              </label>

              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploadingAvatar || loading}
                style={{ display: "none" }}
              />

            </div>

            <div className="profile-info-header">

              <h2 className="profile-name">
                {petData?.petName || t('pages.petProfile.defaultPetName')}
              </h2>
            </div>

          {/* </div> */}

        </div>

        <Card className="profile-form-card">

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={() => setHasUnsavedChanges(true)}
            autoComplete="off"
            requiredMark={false}
          >

            <div className="form-row">

              <Form.Item
                label={t('pages.petProfile.fields.petName')}
                name="petName"
                className="form-col"
                rules={[{ required: true, message: t('pages.petProfile.validation.petNameRequired') }]}
              >
                <Input size="large" />
              </Form.Item>

              <Form.Item
                label={t('pages.petProfile.fields.species')}
                name="species"
                className="form-col"
                rules={[{ required: true }]}
              >
                <Select
                  size="large"
                  options={speciesList.map((item) => ({
                    label: getSpeciesLabel(item),
                    value: item,
                  }))}
                  onChange={(value) => setSelectedSpeciesId(value)}
                />
              </Form.Item>

            </div>

            <div className="form-row">

              <Form.Item
                label={t('pages.petProfile.fields.breed')}
                name="breed"
                className="form-col"
                rules={[{ required: true, message: t('pages.petProfile.validation.breedRequired') }]}
              >
                <Select
                  size="large"
                  showSearch
                  placeholder={t('pages.petProfile.placeholders.breed')}
                  className="pet-breed-select"
                  options={breedList.map((item) => ({
                    label: getBreedLabel(item, selectedSpeciesId),
                    value: item,
                  }))}
                  filterOption={(input, option) =>
                    String(option?.label || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>

              <Form.Item
                label={t('pages.petProfile.fields.gender')}
                name="gender"
                className="form-col"
                rules={[{ required: true }]}
              >
                <Radio.Group className="pet-gender-group">
                  <Radio.Button value="Đực" className="pet-gender-btn">
                    <span className="pet-gender-content">
                      <ManOutlined />
                      <span>{t('pages.petProfile.gender.male')}</span>
                    </span>
                  </Radio.Button>
                  <Radio.Button value="Cái" className="pet-gender-btn ">
                    <span className="pet-gender-content">
                      <WomanOutlined />
                      <span>{t('pages.petProfile.gender.female')}</span>
                    </span>
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

            </div>

            <div className="form-row">

              <Form.Item
                label={t('pages.petProfile.fields.age')}
                name="birthDate"
                rules={[{ required: true, message: t('pages.petProfile.validation.birthDateRequired') }]}
              >

                <DatePicker
                  size="large"
                  style={{ width: "100%" }}
                  suffixIcon={<CalendarOutlined />}
                  placeholder={t('pages.petProfile.placeholders.birthDate')}

                  format={(value) => {
                    if (!value) return "";
                    const age = dayjs().diff(value, "year");
                    return t('pages.petProfile.age.years', { count: age });
                  }}

                  onChange={(date) => {
                    if (!date) return;

                    const age = dayjs().diff(date, "year");

                    form.setFieldsValue({
                      age: age
                    });
                  }}

                />

              </Form.Item>

              <Form.Item
                label={t('pages.petProfile.fields.weight')}
                name="weight"
                className="form-col"
                rules={[{ required: true }]}
              >
                <InputNumber
                  size="large"
                  min={1}
                  max={100}
                  style={{ width: "100%" }}
                />
              </Form.Item>

            </div>

            <Form.Item
              label={t('pages.petProfile.fields.features')}
              name="features"
            >
              <Input.TextArea rows={4} />
            </Form.Item>
            
            <Form.Item className="form-buttons">

              <Space style={{ width: "100%", gap: "12px" }}>

                <Button
                  size="large"
                  className="btn-cancel"
                  onClick={handleCancel}
                  disabled={loading || uploadingAvatar}
                >
                  {t('pages.petProfile.actions.cancel')}
                </Button>

                <Button
                  type="primary"
                  size="large"
                  className="btn-submit"
                  htmlType="submit"
                  loading={loading}
                  disabled={loading || uploadingAvatar}
                >
                  {uploadingAvatar ? t('pages.petProfile.actions.uploading') : t('pages.petProfile.actions.save')}
                </Button>

              </Space>

            </Form.Item>

          </Form>

        </Card>

      </div>

    </div>

  );

}
