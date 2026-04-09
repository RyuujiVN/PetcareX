import {
  DeleteOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  LockOutlined,
  MailOutlined,
  MedicineBoxOutlined,
  PhoneOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  Form,
  Input,
  Modal,
  Pagination,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClinicApi, deleteClinicApi, getClinicListApi } from '../../../../services/clinicService'
import { getAdminInstance } from '../../../../services/apiClient'
import './style.css'

const getAbbreviation = (name) => {
  if (!name) return ''
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
const formatDate = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export default function Clinics() {
  const { t } = useTranslation('admin')
  const noDataText = t('common.noData')
  const [clinicList, setClinicList] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [loading, setLoading] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [addForm] = Form.useForm()

  const fetchClinics = useCallback(async (page, pageSize, keyword = '') => {
    setLoading(true)
    try {
      const data = await getClinicListApi(getAdminInstance(), page, pageSize, keyword)
      const meta = data?.meta || {}
      setClinicList(data.items || [])
      setPagination({
        current: meta.currentPage || page,
        pageSize: meta.itemsPerPage || pageSize,
        total: meta.totalItems || 0,
      })
    } catch (error) {
      message.error(error.message || t('clinics.messages.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchClinics(1, pagination.pageSize, '')
  }, [fetchClinics, pagination.pageSize])

  const handleView = (clinic) => {
    setSelectedClinic(clinic)
    setViewModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteClinicApi(getAdminInstance(), id)
      message.success(t('clinics.messages.deleteSuccess'))
      const nextPage = clinicList.length === 1 && pagination.current > 1
        ? pagination.current - 1
        : pagination.current
      fetchClinics(nextPage, pagination.pageSize, search.trim())
    } catch (error) {
      message.error(error.message || t('clinics.messages.deleteFailed'))
    }
  }

  const handleDeleteWithConfirm = (clinic) => {
    Modal.confirm({
      centered: true,
      title: t('clinics.confirmDelete.title'),
      icon: <InfoCircleOutlined style={{ color: 'var(--admin-color-warning)' }} />,
      content: t('clinics.confirmDelete.content', {
        name: clinic?.name || t('common.thisItem'),
      }),
      okText: t('clinics.confirmDelete.ok'),
      okType: 'danger',
      cancelText: t('clinics.confirmDelete.cancel'),
      onOk: async () => {
        await handleDelete(clinic.id)
      },
    })
  }

  const handleAdd = () => {
    addForm.resetFields()
    setAddModalOpen(true)
  }

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields()
      setAddLoading(true)
      await createClinicApi(getAdminInstance(), {
        clinic: {
          name: values.clinicName,
          email: values.clinicEmail,
          phone: values.clinicPhone,
          address: values.clinicAddress,
          description: values.clinicDescription || '',
          avatarUrl: '',
        },
        admin: {
          fullName: values.adminFullName,
          email: values.adminEmail,
          password: values.adminPassword,
        },
      })
      message.success(t('clinics.messages.createSuccess'))
      setAddModalOpen(false)
      fetchClinics(1, pagination.pageSize, search.trim())
    } catch (error) {
      if (error.message) {
        message.error(error.message)
      }
    } finally {
      setAddLoading(false)
    }
  }

  const handlePageChange = (page, pageSize) => {
    fetchClinics(page, pageSize, search.trim())
  }

  const handleSearch = (value) => {
    const keyword = value.trim()
    setSearch(value)
    fetchClinics(1, pagination.pageSize, keyword)
  }

  const handleSearchChange = (event) => {
    const nextValue = event.target.value
    setSearch(nextValue)
    if (!nextValue.trim()) {
      fetchClinics(1, pagination.pageSize, '')
    }
  }

  const requiredLabel = (label) => (
    <span className="required-label">
      <span className="required-asterisk">*</span>
      {label}
    </span>
  )

  const columns = [
    {
      title: t('clinics.table.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <Avatar style={{ backgroundColor: 'var(--admin-color-brand-primary)' }}>
            {getAbbreviation(text)}
          </Avatar>
          <Typography.Text className="clinic-name-ellipsis" title={text || ''}>
            {text || noDataText}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: t('clinics.table.columns.phone'),
      dataIndex: 'phone',
      key: 'phone',
      render: (value) => value || noDataText,
    },
    {
      title: t('clinics.table.columns.address'),
      dataIndex: 'address',
      key: 'address',
      render: (value) => (
        <Typography.Text className="clinic-address-ellipsis" title={value || ''}>
          {value || noDataText}
        </Typography.Text>
      ),
    },
    {
      title: t('clinics.table.columns.email'),
      dataIndex: 'email',
      key: 'email',
      render: (value) => value || noDataText,
    },
    {
      title: t('clinics.table.columns.status'),
      dataIndex: 'deleted',
      key: 'deleted',
      width: 150,
      align: 'center',
      render: (deleted) => (
        <Tag className={deleted ? 'status-tag status-tag--inactive' : 'status-tag status-tag--active'} style={{ marginTop: 7 }}>
          {deleted ? t('clinics.status.deleted') : t('clinics.status.active')}
        </Tag>
      ),
    },
    {
      title: t('clinics.table.columns.action'),
      key: 'action',
      width: 110,
      align: 'center',
      render: (_, record) => (
        <Space className="table-action-group">
          <Button
            type="text"
            className="table-action-btn table-action-btn--view"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          />
          <Button
            type="text"
            danger
            className="table-action-btn table-action-btn--delete"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteWithConfirm(record)}
          />
        </Space>
      ),
    },
  ]

  const { current, pageSize, total } = pagination
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1
  const end = Math.min(current * pageSize, total)

  return (
    <div className="clinics-page">
      {/* ── Thống kê ── */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card className="stat-card stat-card--clinic">
            <div className="stat-card__icon stat-card__icon--clinic">
              <MedicineBoxOutlined />
            </div>
            <Statistic title={t('clinics.stats.totalClinics')} value={total} />
          </Card>
        </Col>
      </Row>

      {/* ── Header bảng ── */}
      <Card className="table-card">
        <Flex justify="space-between" align="center" className="section-header">
          <div className="section-title">
            <Typography.Title level={4} style={{ marginRight: 165 }}>
              {t('clinics.page.title')}
            </Typography.Title>
            <Typography.Text type="secondary">
              {t('clinics.page.subtitle')}
            </Typography.Text>
          </div>
          <div className="table-actions">
            <Input
              className="clinics-search"
              placeholder={t('clinics.search.placeholder')}
              allowClear
              value={search}
              onChange={handleSearchChange}
              onPressEnter={(event) => handleSearch(event.target.value)}
              prefix={<SearchOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              {t('clinics.actions.addClinic')}
            </Button>
          </div>
        </Flex>

        {/* ── Bảng danh sách ── */}
        <Table
          columns={columns}
          dataSource={clinicList}
          loading={loading}
          pagination={false}
          rowKey="id"
        />

        {/* ── Phân trang ── */}
        <Flex justify="space-between" align="center" className="pagination-bar">
          <Typography.Text>
            {t('clinics.pagination.summary', { start, end, total })}
          </Typography.Text>
          <Pagination
            current={current}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </Flex>
      </Card>

      {/* ── Modal thêm phòng khám ── */}
      <Modal
        title={t('clinics.addModal.title')}
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={handleAddSubmit}
        okText={t('clinics.addModal.ok')}
        cancelText={t('clinics.addModal.cancel')}
        confirmLoading={addLoading}
        width={960}
        destroyOnClose
        centered
        className="add-clinic-modal"
      >
        <Form
          form={addForm}
          layout="vertical"
          requiredMark={false}
          className="add-clinic-form"
        >
          <Row gutter={[16, 16]} className="clinic-form-columns">
            <Col xs={24} lg={12}>
              <div className="add-clinic-form-section">
                <div className="add-clinic-section-title">
                  <MedicineBoxOutlined />
                  {t('clinics.addModal.sections.clinicInfo')}
                </div>

                <Form.Item
                  name="clinicName"
                  label={requiredLabel(t('clinics.addModal.labels.clinicName'))}
                  rules={[{ required: true, message: t('clinics.addModal.validation.clinicNameRequired') }]}
                >
                  <Input
                    prefix={<MedicineBoxOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
                    placeholder={t('clinics.addModal.placeholders.clinicName')}
                  />
                </Form.Item>

                <Form.Item
                  name="clinicEmail"
                  label={requiredLabel(t('clinics.addModal.labels.clinicEmail'))}
                  rules={[
                    { required: true, message: t('clinics.addModal.validation.emailRequired') },
                    { type: 'email', message: t('clinics.addModal.validation.invalidEmail') },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
                    placeholder={t('clinics.addModal.placeholders.clinicEmail')}
                  />
                </Form.Item>

                <Form.Item
                  name="clinicPhone"
                  label={requiredLabel(t('clinics.addModal.labels.clinicPhone'))}
                  rules={[
                    { required: true, message: t('clinics.addModal.validation.phoneRequired') },
                    { pattern: /^0\d{9}$/, message: t('clinics.addModal.validation.phoneInvalid') },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
                    placeholder={t('clinics.addModal.placeholders.clinicPhone')}
                  />
                </Form.Item>

                <Form.Item
                  name="clinicAddress"
                  label={requiredLabel(t('clinics.addModal.labels.clinicAddress'))}
                  rules={[{ required: true, message: t('clinics.addModal.validation.addressRequired') }]}
                >
                  <Input placeholder={t('clinics.addModal.placeholders.clinicAddress')} />
                </Form.Item>

                <Form.Item name="clinicDescription" label={t('clinics.addModal.labels.clinicDescription')} className="clinic-description-item">
                  <Input.TextArea
                    rows={1}
                    placeholder={t('clinics.addModal.placeholders.clinicDescription')}
                    showCount
                    maxLength={500}
                  />
                </Form.Item>
              </div>
            </Col>

            <Col xs={24} lg={12}>
              <div className="add-clinic-form-section">
                <div className="add-clinic-section-title">
                  <UserOutlined />
                  {t('clinics.addModal.sections.adminInfo')}
                </div>

                <Form.Item
                  name="adminFullName"
                  label={requiredLabel(t('clinics.addModal.labels.adminFullName'))}
                  rules={[{ required: true, message: t('clinics.addModal.validation.adminNameRequired') }]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
                    placeholder={t('clinics.addModal.placeholders.adminFullName')}
                  />
                </Form.Item>

                <Form.Item
                  name="adminEmail"
                  label={requiredLabel(t('clinics.addModal.labels.adminEmail'))}
                  rules={[
                    { required: true, message: t('clinics.addModal.validation.adminEmailRequired') },
                    { type: 'email', message: t('clinics.addModal.validation.invalidEmail') },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
                    placeholder={t('clinics.addModal.placeholders.adminEmail')}
                  />
                </Form.Item>

                <Form.Item
                  name="adminPassword"
                  label={requiredLabel(t('clinics.addModal.labels.adminPassword'))}
                  rules={[
                    { required: true, message: t('clinics.addModal.validation.passwordRequired') },
                    { min: 6, message: t('clinics.addModal.validation.passwordMin') },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
                    placeholder={t('clinics.addModal.placeholders.adminPassword')}
                  />
                </Form.Item>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ── Modal xem chi tiết phòng khám ── */}
      <Modal
        title={t('clinics.detailModal.title')}
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        width={720}
        centered
      >
        <Descriptions column={1} size="middle" bordered className="clinic-detail-descriptions">
          <Descriptions.Item label={t('clinics.detailModal.labels.clinicName')}>
            {selectedClinic?.name || noDataText}
          </Descriptions.Item>
          <Descriptions.Item label={t('clinics.detailModal.labels.email')}>
            {selectedClinic?.email || noDataText}
          </Descriptions.Item>
          <Descriptions.Item label={t('clinics.detailModal.labels.phone')}>
            {selectedClinic?.phone || noDataText}
          </Descriptions.Item>
          <Descriptions.Item label={t('clinics.detailModal.labels.address')}>
            {selectedClinic?.address || noDataText}
          </Descriptions.Item>
          <Descriptions.Item label={t('clinics.detailModal.labels.description')}>
            {selectedClinic?.description || noDataText}
          </Descriptions.Item>
          <Descriptions.Item label={t('clinics.detailModal.labels.status')}>
            {selectedClinic?.deleted ? t('clinics.status.deleted') : t('clinics.status.active')}
          </Descriptions.Item>
          <Descriptions.Item label={t('clinics.detailModal.labels.createdAt')}>
            {formatDate(selectedClinic?.createdAt) || noDataText}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  )
}