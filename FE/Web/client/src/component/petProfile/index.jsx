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
import { useNavigate } from "react-router-dom";
import { getUserProfileApi } from "../../api/user";

import dayjs from "dayjs";

import "./styles.css";
import Header from "../../default/header";

export default function PetProfile() {

  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [petData, setPetData] = useState(null);
  const [ownerName, setOwnerName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchPetData();
  }, [ownerName]);

  // lấy tên chủ thú cưng
  const fetchUser = async () => {
    try {
      const res = await getUserProfileApi();
      setOwnerName(res.data.fullName);
    } catch (error) {
      console.log("Không lấy được user");
    }
  };

  // load dữ liệu pet
  const fetchPetData = () => {

    try {

      setLoading(true);

      const petInfo = JSON.parse(localStorage.getItem("petInfo"));

      if (petInfo) {

        let age = null;

        if (petInfo.birthDate) {
          age = dayjs().diff(dayjs(petInfo.birthDate), "year");
        }

        setPetData(petInfo);

        form.setFieldsValue({
          petName: petInfo.petName || "",
          species: petInfo.species || "",
          breed: petInfo.breed || "",
          gender: petInfo.gender || "",
          birthDate: petInfo.birthDate ? dayjs(petInfo.birthDate) : null,
          age: age,
          weight: petInfo.weight || "",
          features: petInfo.features || "",
          owner: petInfo.owner || ownerName
        });

        setImagePreview(petInfo.avatar || null);

      } else {

        form.setFieldsValue({
          owner: ownerName
        });

      }

    } catch (error) {

      message.error("Không thể tải thông tin thú cưng!");

    } finally {

      setLoading(false);

    }

  };

  const calculateAge = (birthDate) => {

    if (!birthDate) return;

    const age = dayjs().diff(birthDate, "year");

    form.setFieldsValue({
      age: age
    });

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

  const handleSubmit = (values) => {

    try {

      setLoading(true);

      const updateData = {
        petName: values.petName,
        species: values.species,
        breed: values.breed,
        gender: values.gender,
        birthDate: values.birthDate
          ? values.birthDate.format("YYYY-MM-DD")
          : null,
        weight: values.weight,
        features: values.features,
        owner: values.owner,
        avatar: imagePreview
      };

      localStorage.setItem("petInfo", JSON.stringify(updateData));

      setPetData(updateData);

      message.success("Cập nhật thông tin thú cưng thành công!");

      navigate(-1);

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
                  options={[
                    { label: "Mèo", value: "Mèo" },
                    { label: "Chó", value: "Chó" },
                    { label: "Khác", value: "Khác" }
                  ]}
                />
              </Form.Item>

            </div>

            <div className="form-row">

              <Form.Item
                label="Giống"
                name="breed"
                className="form-col"
              >
                <Input size="large" />
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