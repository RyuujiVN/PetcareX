import {
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
  Card,
  Avatar,
  Space,
  Spin,
  Radio,
  DatePicker
} from "antd";

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getUserProfileApi } from "../../../data/api/user";
import {
  getBreedsBySpeciesApi,
  getMyPetsApi,
  getPetSpeciesApi,
  updatePetApi,
} from "../../../data/api/petApi";

import dayjs from "dayjs";

import "./styles.css";
import Header from "../../../components/layout/header";

export default function PetProfile() {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [petData, setPetData] = useState(null);
  const [ownerName, setOwnerName] = useState("");
  const [speciesList, setSpeciesList] = useState([]);
  const [breedList, setBreedList] = useState([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState("");
  const [currentPetId, setCurrentPetId] = useState("");

  const navigate = useNavigate();

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
      const res = await getUserProfileApi();
      setOwnerName(res.data?.fullName || "");
    } catch (error) {
      message.warning("Không lấy được thông tin người dùng");
    }
  };

  const fetchSpecies = async () => {
    try {
      const speciesData = await getPetSpeciesApi();
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);
    } catch (error) {
      message.error(error.message || "Không thể tải danh sách loài");
    }
  };

  const fetchBreedsBySpecies = async (speciesId) => {
    try {
      const breedsData = await getBreedsBySpeciesApi(speciesId);
      setBreedList(Array.isArray(breedsData) ? breedsData : []);
    } catch (error) {
      message.error(error.message || "Không thể tải danh sách giống");
    }
  };

  const fetchPetData = async () => {
    try {
      setLoading(true);

      const petIdFromQuery = searchParams.get("id");
      const pets = await getMyPetsApi();
      const petList = Array.isArray(pets) ? pets : [];

      const petInfo = petIdFromQuery
        ? petList.find((item) => item.id === petIdFromQuery)
        : petList[0];

      if (!petInfo) {
        message.warning("Chưa có thú cưng");
        return;
      }

      const speciesId = petInfo.breed?.speciesId || "";
      setCurrentPetId(petInfo.id || "");
      setSelectedSpeciesId(speciesId);

      const mappedPetData = {
        id: petInfo.id,
        petName: petInfo.name || "",
        species: speciesId,
        breed: petInfo.breed?.name || "",
        gender: petInfo.gender ? "Đực" : "Cái",
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
    } catch (error) {
      message.error(error.message || "Không thể tải thông tin thú cưng!");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (values) => {
    if (!currentPetId) {
      message.error("Không tìm thấy thú cưng để cập nhật");
      return;
    }

    const matchedBreed =
      breedList.find(
        (item) => (item.name || "").toLowerCase() === (values.breed || "").trim().toLowerCase(),
      ) || breedList[0];

    if (!matchedBreed?.id) {
      message.warning("Vui lòng chọn giống hợp lệ");
      return;
    }

    try {
      setLoading(true);

      const updatePayload = {
        name: values.petName,
        breedId: matchedBreed.id,
        gender: values.gender === "Đực",
        dateOfBirth: values.birthDate ? values.birthDate.format("YYYY-MM-DD") : null,
        weight: Number(values.weight),
        note: values.features,
      };

      if (imagePreview && imagePreview.startsWith("http")) {
        updatePayload.avatar = imagePreview;
      }

      await updatePetApi(currentPetId, updatePayload);

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
        avatar: imagePreview,
      }));

      message.success("Cập nhật thông tin thú cưng thành công!");
      navigate(-1);
    } catch (error) {
      message.error(error.message || "Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    fetchPetData();
    message.info("Đã hủy thay đổi");
    navigate(-1);
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

      <Header />

      <div className="profile-wrapper">

        <div className="profile-header">

          <h2 className="profile-title">Thông tin thú cưng</h2>

          <div className="profile-avatar-section">

            <div className="profile-avatar-container">

              <Avatar
                size={120}
                src={imagePreview}
                icon={<UserOutlined />}
                className="profile-avatar"
              />

              <label htmlFor="avatar-upload" className="avatar-upload-btn">
                <CameraOutlined />
              </label>

              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />

            </div>

            <div className="profile-info-header">

              <h2 className="profile-name">
                {petData?.petName || "Tên thú cưng"}
              </h2>

              <p className="profile-subtitle">

                {petAge
                  ? `${petAge} tuổi • ${petData?.weight || 0} kg`
                  : "• tuổi • kg"}

              </p>

            </div>

          </div>

        </div>

        <Card className="profile-form-card">

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
            requiredMark={false}
          >

            <div className="form-row">

              <Form.Item
                label="Tên thú cưng"
                name="petName"
                className="form-col"
                rules={[{ required: true, message: "Nhập tên thú cưng" }]}
              >
                <Input size="large" />
              </Form.Item>

              <Form.Item
                label="Loài"
                name="species"
                className="form-col"
                rules={[{ required: true }]}
              >
                <Select
                  size="large"
                  options={speciesList.map((item) => ({
                    label: item.name,
                    value: item.id,
                  }))}
                  onChange={(value) => setSelectedSpeciesId(value)}
                />
              </Form.Item>

            </div>

            <div className="form-row">

              <Form.Item
                label="Giống"
                name="breed"
                className="form-col"
              >
                <Input
                  size="large"
                  list="profile-breed-suggestion-list"
                />
              </Form.Item>

              <datalist id="profile-breed-suggestion-list">
                {breedList.map((item) => (
                  <option key={item.id} value={item.name} />
                ))}
              </datalist>

              <Form.Item
                label="Giới tính"
                name="gender"
                className="form-col"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Radio value="Đực">Đực</Radio>
                  <Radio value="Cái">Cái</Radio>
                </Radio.Group>
              </Form.Item>

            </div>

            <div className="form-row">

              <Form.Item
                label="Tuổi thú cưng"
                name="birthDate"
                rules={[{ required: true, message: "Chọn ngày sinh" }]}
              >

                <DatePicker
                  size="large"
                  style={{ width: "100%" }}
                  suffixIcon={<CalendarOutlined />}
                  placeholder="Chọn ngày sinh"

                  format={(value) => {
                    if (!value) return "";
                    const age = dayjs().diff(value, "year");
                    return `${age} tuổi`;
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
                label="Cân nặng (kg)"
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
              label="Màu lông / Đặc điểm"
              name="features"
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <Form.Item
              label="Tên chủ thú cưng"
              name="owner"
              rules={[{ required: true }]}
            >
              <Input
                prefix={<UserOutlined />}
                size="large"
              />
            </Form.Item>

            <Form.Item className="form-buttons">

              <Space style={{ width: "100%", gap: "12px" }}>

                <Button
                  size="large"
                  className="btn-cancel"
                  onClick={handleCancel}
                >
                  Hủy
                </Button>

                <Button
                  type="primary"
                  size="large"
                  className="btn-submit"
                  htmlType="submit"
                  loading={loading}
                >
                  Lưu thay đổi
                </Button>

              </Space>

            </Form.Item>

          </Form>

        </Card>

      </div>

    </div>

  );

}

