import {
  CameraOutlined,
  CalendarOutlined,
  UserOutlined
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
import { useNavigate } from "react-router-dom";
import "./styles.css";
import Header from "../../default/header";
import dayjs from "dayjs";

export default function PetProfile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [petData, setPetData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPetData();
  }, []);

  const fetchPetData = async () => {
    try {
      setLoading(true);

      const petInfo = JSON.parse(localStorage.getItem("petInfo"));

      if (petInfo) {
        setPetData(petInfo);

        form.setFieldsValue({
          petName: petInfo.petName,
          species: petInfo.species,
          breed: petInfo.breed,
          gender: petInfo.gender,
          birthDate: dayjs(petInfo.birthDate),
          age: petInfo.age,
          weight: petInfo.weight,
          features: petInfo.features,
          owner: petInfo.owner
        });

        setImagePreview(petInfo.avatar);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setImagePreview(reader.result);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (values) => {
    try {
      setLoading(true);

      const updateData = {
        ...values,
        birthDate: values.birthDate.format("YYYY-MM-DD"),
        avatar: imagePreview
      };

      localStorage.setItem("petInfo", JSON.stringify(updateData));

      message.success("Cập nhật thông tin thú cưng thành công!");
    } catch (error) {
      message.error("Cập nhật thất bại!");
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
                {petData?.breed} • {petData?.age} tuổi • {petData?.weight} kg
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

            {/* Tên thú cưng + Loài */}
            <div className="form-row">

              <Form.Item
                label="Tên thú cưng"
                name="petName"
                className="form-col"
                rules={[{ required: true, message: "Nhập tên thú cưng" }]}
              >
                <Input size="large" placeholder="Lu Lu" />
              </Form.Item>

              <Form.Item
                label="Loài"
                name="species"
                className="form-col"
                rules={[{ required: true }]}
              >
                <Select
                  size="large"
                  options={[
                    { label: "Mèo nhà", value: "Mèo nhà" },
                    { label: "Chó", value: "Chó" },
                    { label: "Khác", value: "Khác" }
                  ]}
                />
              </Form.Item>

            </div>

            {/* Giống + Giới tính */}
            <div className="form-row">

              <Form.Item
                label="Giống"
                name="breed"
                className="form-col"
              >
                <Input size="large" placeholder="Mèo Anh lông ngắn" />
              </Form.Item>

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

            {/* Ngày sinh + Cân nặng */}
            <div className="form-row">

              <Form.Item
                label="Ngày sinh"
                name="birthDate"
                className="form-col"
                rules={[{ required: true }]}
              >
                <DatePicker
                  size="large"
                  style={{ width: "100%" }}
                  suffixIcon={<CalendarOutlined />}
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

            {/* Tuổi */}
            <div className="form-row single">
              <Form.Item
                label="Tuổi"
                name="age"
                rules={[{ required: true }]}
              >
                <InputNumber
                  size="large"
                  min={0}
                  max={30}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </div>

            {/* Đặc điểm */}
            <Form.Item
              label="Màu lông / Đặc điểm nhận dạng"
              name="features"
            >
              <Input.TextArea
                rows={4}
                placeholder="Có đốm đen ở tai"
              />
            </Form.Item>

            {/* Chủ thú cưng */}
            <Form.Item
              label="Tên chủ thú cưng"
              name="owner"
              rules={[{ required: true }]}
            >
              <Input
                prefix={<UserOutlined />}
                size="large"
                placeholder="Trương Công Thành"
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