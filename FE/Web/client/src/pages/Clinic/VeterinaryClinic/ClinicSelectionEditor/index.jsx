import { UploadOutlined } from '@ant-design/icons'
import { Button, Card, Col, Divider, Form, Input, Modal, Row, Space, Typography, Upload, message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  buildClinicInfoContent,
  formatClinicOpenHours,
  getClinicInfoContent,
  saveClinicInfoContent,
} from '../../../../data/client/utils/clinicInfoStorage'
import { uploadOneFileToCloudinary } from '../../../../data/shared/api/cloudinaryUploadFetch'
import { useAuth } from '../../../../hooks/Clinic/AuthContext'
import { getCurrentAdminClinicId } from '../../../../utils/clinicIdentity'
import './styles.css'

const { Title, Text } = Typography

const buildFallbackClinicFromProfile = (profile) => {
  const clinicInfo =
    profile?.clinicInfo ||
    profile?.clinic ||
    profile?.adminClinic?.clinic ||
    profile?.veterinarian?.clinic ||
    null

  return {
    avatarUrl: clinicInfo?.avatarUrl || profile?.avatarUrl || '',
    name: clinicInfo?.name || profile?.clinicName || '',
    address: clinicInfo?.address || profile?.address || '',
    phone: clinicInfo?.phone || profile?.phone || '',
  }
}

export default function ClinicSelectionEditor() {
  const [form] = Form.useForm()
  const { clinicId: clinicIdParam = '' } = useParams()
  const navigate = useNavigate()
  const { userProfile } = useAuth()

  const [loadingInit, setLoadingInit] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savedSnapshot, setSavedSnapshot] = useState(() => buildClinicInfoContent())

  const deniedRef = useRef(false)
  const sourceClinicRef = useRef({})

  const targetClinicId = String(clinicIdParam || '').trim()
  const currentClinicId = useMemo(() => getCurrentAdminClinicId(userProfile), [userProfile])
  const watchedValues = Form.useWatch([], form)

  const draftSnapshot = useMemo(
    () => buildClinicInfoContent(watchedValues || {}, sourceClinicRef.current),
    [watchedValues],
  )

  const previewTime = useMemo(
    () => formatClinicOpenHours(draftSnapshot),
    [draftSnapshot.openingTime, draftSnapshot.closingTime, draftSnapshot.openingDays],
  )

  const isDirty = useMemo(
    () => JSON.stringify(draftSnapshot) !== JSON.stringify(savedSnapshot),
    [draftSnapshot, savedSnapshot],
  )

  useEffect(() => {
    if (!targetClinicId) {
      message.error('Thiếu clinicId để chỉnh sửa thông tin phòng khám.')
      navigate('/clinic/appointments', { replace: true })
      return
    }

    const profileClinic = buildFallbackClinicFromProfile(userProfile)
    sourceClinicRef.current = profileClinic

    const nextData = getClinicInfoContent(targetClinicId, profileClinic)
    form.setFieldsValue(nextData)
    setSavedSnapshot(nextData)
    setLoadingInit(false)
  }, [form, navigate, targetClinicId, userProfile])

  useEffect(() => {
    if (!targetClinicId || !currentClinicId || deniedRef.current) return

    if (String(targetClinicId) !== String(currentClinicId)) {
      deniedRef.current = true
      message.error('Bạn chỉ có thể chỉnh sửa thông tin của phòng khám đang đăng nhập.')
      navigate('/clinic/appointments', { replace: true })
    }
  }, [currentClinicId, navigate, targetClinicId])

  const handleUploadAvatar = async (file) => {
    try {
      setUploadingAvatar(true)
      const uploaded = await uploadOneFileToCloudinary(file)
      const nextUrl = uploaded?.url || uploaded?.file || ''

      if (!nextUrl) {
        throw new Error('Không nhận được URL ảnh từ server')
      }

      form.setFieldValue('avatarUrl', nextUrl)
      message.success('Tải ảnh đại diện thành công')
    } catch (error) {
      message.error(error?.message || 'Không thể tải ảnh đại diện')
    } finally {
      setUploadingAvatar(false)
    }

    return Upload.LIST_IGNORE
  }

  const handleSave = async () => {
    if (!targetClinicId) {
      message.error('Thiếu clinicId để lưu dữ liệu.')
      return
    }

    if (!currentClinicId || String(targetClinicId) !== String(currentClinicId)) {
      message.error('Không có quyền chỉnh sửa phòng khám này.')
      navigate('/clinic/appointments', { replace: true })
      return
    }

    try {
      const values = await form.validateFields()
      setSaving(true)

      const normalized = buildClinicInfoContent(values, sourceClinicRef.current)
      saveClinicInfoContent(targetClinicId, normalized, sourceClinicRef.current)

      setSavedSnapshot(normalized)
      message.success('Lưu thành công')
      window.location.reload()
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || 'Không thể lưu thông tin phòng khám')
      }
    } finally {
      setSaving(false)
    }
  }

  const discardAndExit = () => {
    navigate('/clinic/appointments')
  }

  const handleCancel = () => {
    if (!isDirty) {
      discardAndExit()
      return
    }

    Modal.confirm({
      title: 'Xác nhận',
      content: 'Bạn có muốn tiếp tục chỉnh sửa hay hủy bỏ thay đổi?',
      okText: 'Tiếp tục chỉnh sửa',
      cancelText: 'Hủy bỏ thay đổi',
      closable: false,
      maskClosable: false,
      onCancel: discardAndExit,
      onOk: () => {},
    })
  }

  return (
    <div className="clinic-selection-editor-page">
      <div className="clinic-selection-editor-header">
        <Title level={2}>Chỉnh Sửa Thông Tin Phòng Khám</Title>
        <Text type="secondary">Clinic ID: {targetClinicId}</Text>
      </div>

      <Card loading={loadingInit}>
        <Form form={form} layout="vertical" autoComplete="off">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={12} className="editor-full-width">
                <Form.Item
                  label="Tên phòng khám"
                  name="name"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên phòng khám' },
                    { max: 120, message: 'Tên phòng khám tối đa 120 ký tự' },
                  ]}
                >
                  <Input placeholder="Nhập tên phòng khám" maxLength={120} />
                </Form.Item>

                <Form.Item
                  label="Địa chỉ"
                  name="address"
                  rules={[
                    { required: true, message: 'Vui lòng nhập địa chỉ' },
                    { min: 5, message: 'Địa chỉ cần ít nhất 5 ký tự' },
                    { max: 220, message: 'Địa chỉ tối đa 220 ký tự' },
                  ]}
                >
                  <Input placeholder="Nhập địa chỉ phòng khám" maxLength={220} />
                </Form.Item>

                <Form.Item
                  label="Số điện thoại"
                  name="phone"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                    {
                      pattern: /^(\+84|0)\d{9}$/,
                      message: 'Số điện thoại không hợp lệ (ví dụ: 0912345678 hoặc +84912345678)',
                    },
                  ]}
                >
                  <Input placeholder="Nhập số điện thoại" maxLength={12} />
                </Form.Item>

                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Ngày mở cửa"
                      name="openingDays"
                      rules={[
                        { required: true, message: 'Vui lòng nhập ngày mở cửa' },
                        { max: 80, message: 'Ngày mở cửa tối đa 80 ký tự' },
                      ]}
                    >
                      <Input placeholder="Ví dụ: Thứ 2 - Chủ nhật" maxLength={80} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      label="Giờ mở cửa"
                      name="openingTime"
                      rules={[{ required: true, message: 'Vui lòng nhập giờ mở cửa' }]}
                    >
                      <Input type="time" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      label="Giờ đóng cửa"
                      name="closingTime"
                      rules={[{ required: true, message: 'Vui lòng nhập giờ đóng cửa' }]}
                    >
                      <Input type="time" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="URL ảnh đại diện"
                  name="avatarUrl"
                  rules={[{ required: true, message: 'Vui lòng tải ảnh đại diện phòng khám' }]}
                >
                  <Input placeholder="URL ảnh đại diện phòng khám" />
                </Form.Item>

                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleUploadAvatar}
                  disabled={uploadingAvatar}
                >
                  <Button icon={<UploadOutlined />} loading={uploadingAvatar}>
                    Tải ảnh đại diện
                  </Button>
                </Upload>
              </Space>
            </Col>

            <Col xs={24} lg={8}>
              <Card title="Xem trước card phòng khám" className="clinic-preview-card">
                <div className="clinic-preview-image-wrap">
                  {draftSnapshot.avatarUrl ? (
                    <img src={draftSnapshot.avatarUrl} alt={draftSnapshot.name || 'Clinic avatar'} className="clinic-preview-image" />
                  ) : (
                    <div className="clinic-preview-placeholder">Chưa có ảnh</div>
                  )}
                </div>

                <div className="clinic-preview-content">
                  <h3>{draftSnapshot.name || 'Tên phòng khám'}</h3>
                  <p>{draftSnapshot.address || 'Địa chỉ phòng khám'}</p>
                  <p>{previewTime || '08:00 - 20:00 (Thứ 2 - Chủ nhật)'}</p>
                  <p>{draftSnapshot.phone || 'Số điện thoại'}</p>
                </div>
              </Card>
            </Col>
          </Row>
        </Form>
      </Card>

      <div className="clinic-selection-editor-actions">
        <Button onClick={handleCancel}>Hủy</Button>
        <Button type="primary" onClick={handleSave} loading={saving}>
          Lưu thay đổi
        </Button>
      </div>

      <Divider />

      <Text type="secondary">
        Dữ liệu được lưu riêng theo clinicId với key localStorage clinicInfo_{'{'}clinicId{'}'}.
      </Text>
    </div>
  )
}
