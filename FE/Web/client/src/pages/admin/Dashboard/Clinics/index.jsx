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
  Divider,
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
import { createClinicApi, deleteClinicApi, getClinicListApi } from '../../../../data/admin/api/clinicApi'
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
      const data = await getClinicListApi(page, pageSize, keyword)
      const meta = data?.meta || {}
      setClinicList(data.items || [])
      setPagination({
        current: meta.currentPage || page,
        pageSize: meta.itemsPerPage || pageSize,
        total: meta.totalItems || 0,
      })
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách phòng khám')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClinics(1, pagination.pageSize, '')
  }, [fetchClinics, pagination.pageSize])

  const handleView = (clinic) => {
    setSelectedClinic(clinic)
    setViewModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteClinicApi(id)
      message.success('Xóa phòng khám thành công')
      const nextPage = clinicList.length === 1 && pagination.current > 1
        ? pagination.current - 1
        : pagination.current
      fetchClinics(nextPage, pagination.pageSize, search.trim())
    } catch (error) {
      message.error(error.message || 'Không thể xóa phòng khám')
    }
  }

  const handleDeleteWithConfirm = (clinic) => {
    Modal.confirm({
      centered: true,
      title: 'Xác nhận xóa phòng khám',
      icon: <InfoCircleOutlined style={{ color: 'var(--admin-color-warning)' }} />,
      content: `Bạn có chắc muốn xóa phòng khám "${clinic?.name || 'này'}" không?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
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
      await createClinicApi({
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
      message.success('Thêm phòng khám thành công')
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

  const columns = [
    {
      title: 'TÊN PHÒNG KHÁM',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <Avatar style={{ backgroundColor: 'var(--admin-color-brand-primary)' }}>
            {getAbbreviation(text)}
          </Avatar>
          <Typography.Text className="clinic-name-ellipsis" title={text || ''}>
            {text || '—'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'SỐ ĐIỆN THOẠI',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'ĐỊA CHỈ',
      dataIndex: 'address',
      key: 'address',
      render: (value) => (
        <Typography.Text className="clinic-address-ellipsis" title={value || ''}>
          {value || '—'}
        </Typography.Text>
      ),
    },
    // {
    //   title: 'NGÀY TẠO',
    //   dataIndex: 'createdAt',
    //   key: 'createdAt',
    //   render: (date) => formatDate(date),
    // },
    {
      title: 'EMAIL',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'deleted',
      key: 'deleted',
      width: 150,
      align: 'center',
      render: (deleted) => (
        <Tag className={deleted ? 'status-tag status-tag--inactive' : 'status-tag status-tag--active'} style={{ marginTop: 7 }}>
          {deleted ? 'Dừng hoạt động' : 'Hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'THAO TÁC',
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
            <Statistic title="Tổng số phòng khám" value={total} />
          </Card>
        </Col>
      </Row>

      {/* ── Header bảng ── */}
      <Card className="table-card">
        <Flex justify="space-between" align="center" className="section-header">
          <div className="section-title">
            <Typography.Title level={4} style={{ marginRight: 165 }}>
              Danh sách phòng khám
            </Typography.Title>
            <Typography.Text type="secondary">
              Quản lý các phòng khám mới đăng ký và đang hoạt động
            </Typography.Text>
          </div>
          <div className="table-actions">
            <Input
              className="clinics-search"
              placeholder="Tìm theo tên phòng khám hoặc SĐT"
              allowClear
              value={search}
              onChange={handleSearchChange}
              onPressEnter={(event) => handleSearch(event.target.value)}
              prefix={<SearchOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm phòng khám
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
            Hiển thị {start}-{end} trên {total} phòng khám
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
        title="Thêm phòng khám mới"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={handleAddSubmit}
        okText="Thêm phòng khám"
        cancelText="Hủy"
        confirmLoading={addLoading}
        width={620}
        destroyOnClose
        className="add-clinic-modal"
      >
        <Form
          form={addForm}
          layout="vertical"
          requiredMark={false}
          className="add-clinic-form"
        >
          <Divider orientation="left" plain>
            <Space>
              <MedicineBoxOutlined />
              Thông tin phòng khám
            </Space>
          </Divider>

          <Form.Item
            name="clinicName"
            label="Tên phòng khám"
            rules={[{ required: true, message: 'Vui lòng nhập tên phòng khám' }]}
          >
            <Input
              prefix={<MedicineBoxOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
              placeholder="VD: Phòng khám thú y ABC"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="clinicEmail"
                label="Email phòng khám"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
                  placeholder="clinic@email.com"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="clinicPhone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập SĐT' },
                  { pattern: /^0\d{9}$/, message: 'SĐT phải gồm 10 chữ số, bắt đầu bằng 0' },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
                  placeholder="0901234567"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="clinicAddress"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input placeholder="VD: 123 Nguyễn Văn Linh, Đà Nẵng" />
          </Form.Item>

          <Form.Item name="clinicDescription" label="Mô tả">
            <Input.TextArea
              rows={3}
              placeholder="Mô tả ngắn về phòng khám (không bắt buộc)"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Divider orientation="left" plain>
            <Space>
              <UserOutlined />
              Tài khoản quản trị phòng khám
            </Space>
          </Divider>

          <Form.Item
            name="adminFullName"
            label="Họ và tên quản trị"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
              placeholder="VD: Nguyễn Văn A"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="adminEmail"
                label="Email đăng nhập"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không hợp lệ' },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
                  placeholder="admin@email.com"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="adminPassword"
                label="Mật khẩu"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ── Modal xem chi tiết phòng khám ── */}
      <Modal
        title="Chi tiết phòng khám"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        width={720}
        centered
      >
        <Descriptions column={1} size="middle" bordered className="clinic-detail-descriptions">
          <Descriptions.Item label="Tên phòng khám">
            {selectedClinic?.name || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {selectedClinic?.email || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            {selectedClinic?.phone || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">
            {selectedClinic?.address || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả">
            {selectedClinic?.description || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {selectedClinic?.deleted ? 'Dừng hoạt động' : 'Hoạt động'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {formatDate(selectedClinic?.createdAt)}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  )
}