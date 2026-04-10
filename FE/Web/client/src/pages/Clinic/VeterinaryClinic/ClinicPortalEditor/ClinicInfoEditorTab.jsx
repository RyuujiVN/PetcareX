import { UploadOutlined } from '@ant-design/icons'
import { Button, Card, Col, Divider, Form, Input, Modal, Row, Space, Upload, message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../../hooks/Clinic/AuthContext'
import { uploadOneFileToCloudinary } from '../../../../services/cloudinaryService'
import { getCurrentAdminClinicId } from '../../../../utils/clinicIdentity'
import {
    buildClinicInfoContent,
    formatClinicOpenHours,
    getClinicInfoContent,
    saveClinicInfoContent,
} from '../../../../utils/storage/clinicInfoStorage'
import './clinicInfoEditorTab.css'

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
  const { t } = useTranslation('clinic')
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
      message.error(t('clinicEditor.messages.missingClinicIdEdit'))
      navigate('/clinic/appointments', { replace: true })
      return
    }

    const profileClinic = buildFallbackClinicFromProfile(userProfile)
    sourceClinicRef.current = profileClinic

    const nextData = getClinicInfoContent(targetClinicId, profileClinic)
    form.setFieldsValue(nextData)
    setSavedSnapshot(nextData)
    setLoadingInit(false)
  }, [form, navigate, t, targetClinicId, userProfile])

  useEffect(() => {
    if (!targetClinicId || !currentClinicId || deniedRef.current) return

    if (String(targetClinicId) !== String(currentClinicId)) {
      deniedRef.current = true
      message.error(t('clinicEditor.messages.permissionDenied'))
      navigate('/clinic/appointments', { replace: true })
    }
  }, [currentClinicId, navigate, t, targetClinicId])

  const handleUploadAvatar = async (file) => {
    try {
      setUploadingAvatar(true)
      const uploaded = await uploadOneFileToCloudinary(file)
      const nextUrl = uploaded?.url || uploaded?.file || ''

      if (!nextUrl) {
        throw new Error(t('clinicEditor.messages.avatarUrlMissing'))
      }

      form.setFieldValue('avatarUrl', nextUrl)
      message.success(t('clinicEditor.messages.avatarUploadSuccess'))
    } catch (error) {
      message.error(error?.message || t('clinicEditor.messages.avatarUploadFailed'))
    } finally {
      setUploadingAvatar(false)
    }

    return Upload.LIST_IGNORE
  }

  const handleSave = async () => {
    if (!targetClinicId) {
      message.error(t('clinicEditor.messages.missingClinicIdSave'))
      return
    }

    if (!currentClinicId || String(targetClinicId) !== String(currentClinicId)) {
      message.error(t('clinicEditor.messages.permissionDenied'))
      navigate('/clinic/appointments', { replace: true })
      return
    }

    try {
      const values = await form.validateFields()
      setSaving(true)

      const normalized = buildClinicInfoContent(values, sourceClinicRef.current)
      saveClinicInfoContent(targetClinicId, normalized, sourceClinicRef.current)

      setSavedSnapshot(normalized)
      message.success(t('clinicEditor.messages.saveSuccess'))
      window.location.reload()
    } catch (error) {
      if (!error?.errorFields) {
        message.error(error?.message || t('clinicEditor.messages.saveFailed'))
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
      title: t('clinicEditor.confirm.leaveTitle'),
      content: t('clinicEditor.confirm.leaveContent'),
      okText: t('clinicEditor.confirm.continueEditing'),
      cancelText: t('clinicEditor.confirm.discardChanges'),
      closable: false,
      maskClosable: false,
      onCancel: discardAndExit,
      onOk: () => {},
    })
  }

  return (
    <div className="clinic-selection-editor-page">
      <Card loading={loadingInit}>
        <Form form={form} layout="vertical" autoComplete="off">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={12} className="editor-full-width">
                <Form.Item
                  label={t('clinicEditor.fields.name')}
                  name="name"
                  rules={[
                    { required: true, message: t('clinicEditor.validation.nameRequired') },
                    { max: 120, message: t('clinicEditor.validation.nameMax') },
                  ]}
                >
                  <Input placeholder={t('clinicEditor.placeholders.name')} maxLength={120} />
                </Form.Item>

                <Form.Item
                  label={t('clinicEditor.fields.address')}
                  name="address"
                  rules={[
                    { required: true, message: t('clinicEditor.validation.addressRequired') },
                    { min: 5, message: t('clinicEditor.validation.addressMin') },
                    { max: 220, message: t('clinicEditor.validation.addressMax') },
                  ]}
                >
                  <Input placeholder={t('clinicEditor.placeholders.address')} maxLength={220} />
                </Form.Item>

                <Form.Item
                  label={t('clinicEditor.fields.phone')}
                  name="phone"
                  rules={[
                    { required: true, message: t('clinicEditor.validation.phoneRequired') },
                    {
                      pattern: /^(\+84|0)\d{9}$/,
                      message: t('clinicEditor.validation.phoneInvalid'),
                    },
                  ]}
                >
                  <Input placeholder={t('clinicEditor.placeholders.phone')} maxLength={12} />
                </Form.Item>

                <Row gutter={12}>
                  <Col xs={24} md={6}>
                    <Form.Item
                      label={t('clinicEditor.fields.openingTime')}
                      name="openingTime"
                      rules={[{ required: true, message: t('clinicEditor.validation.openingTimeRequired') }]}
                    >
                      <Input type="time" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      label={t('clinicEditor.fields.closingTime')}
                      name="closingTime"
                      rules={[{ required: true, message: t('clinicEditor.validation.closingTimeRequired') }]}
                    >
                      <Input type="time" />
                    </Form.Item>
                  </Col>
                </Row>
              </Space>
            </Col>

            <Col xs={24} lg={8}>
              <Card title={t('clinicEditor.preview.title')} className="clinic-preview-card">
                <div className="clinic-preview-image-wrap">
                  {draftSnapshot.avatarUrl ? (
                    <img src={draftSnapshot.avatarUrl} alt={draftSnapshot.name || t('clinicEditor.preview.avatarAlt')} className="clinic-preview-image" />
                  ) : (
                    <div className="clinic-preview-placeholder">{t('clinicEditor.preview.noImage')}</div>
                  )}
                </div>

                <div className="clinic-preview-content">
                  <h3>{draftSnapshot.name || t('clinicEditor.preview.defaultClinicName')}</h3>
                  <p>{draftSnapshot.address || t('clinicEditor.preview.defaultAddress')}</p>
                  <p>{previewTime || '08:00 - 20:00'}</p>
                  <p>{draftSnapshot.phone || t('clinicEditor.preview.defaultPhone')}</p>
                  <Col xs={24} md={6}>
                <Upload 
                    style={{marginLeft: 150}}
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleUploadAvatar}
                  disabled={uploadingAvatar}
                >
                  <Button icon={<UploadOutlined />} loading={uploadingAvatar}>
                    {t('clinicEditor.actions.uploadAvatar')}
                  </Button>
                </Upload>
                   </Col>
                </div>
              </Card>
            </Col>
          </Row>
        </Form>
      </Card>

      <div className="clinic-selection-editor-actions">
        <Button onClick={handleCancel}>{t('clinicEditor.actions.cancel')}</Button>
        <Button type="primary" onClick={handleSave} loading={saving}>
          {t('clinicEditor.actions.saveChanges')}
        </Button>
      </div>

      <Divider />
    </div>
  )
}
