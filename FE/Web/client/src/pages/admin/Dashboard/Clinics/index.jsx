import {
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  LockOutlined,
  MailOutlined,
  MedicineBoxOutlined,
  PhoneOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Row,
  Space,
  Statistic, Table, Tag,
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
  const [addForm] = Form.useForm()

  // TODO: gọi API lấy số liệu thống kê
  const [stats] = useState({
    totalClinics: 0,
    totalUsers: 0,
    totalPosts: 0,
  })

  const fetchClinics = useCallback(async (page, pageSize) => {
    setLoading(true)
    try {
      const data = await getClinicListApi(page, pageSize)
      setClinicList(data.items || [])
      setPagination({
        current: data.meta.currentPage,
        pageSize: data.meta.itemsPerPage,
        total: data.meta.totalItems,
      })
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách phòng khám')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClinics(pagination.current, pagination.pageSize)
  }, [])

  const handleView = (id) => {
    //Điều hướng đến trang chi tiết phòng khám
  }

  const handleDelete = async (id) => {
    try {
      await deleteClinicApi(id)
      message.success('Xóa phòng khám thành công')
      fetchClinics(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error(error.message || 'Không thể xóa phòng khám')
    }
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
      fetchClinics(1, pagination.pageSize)
    } catch (error) {
      if (error.message) {
        message.error(error.message)
      }
    } finally {
      setAddLoading(false)
    }
  }

  const handlePageChange = (page, pageSize) => {
    fetchClinics(page, pageSize)
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
          <span>{text}</span>
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
    },
    {
      title: 'NGÀY TẠO',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
    },
    {
      title: 'EMAIL',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'deleted',
      key: 'deleted',
      render: (deleted) => {
        if (deleted) {
          return <Tag color="error">Dừng hoạt động</Tag>
        }
        return <Tag color="success">Hoạt động</Tag>
      },
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id)}
          />
          <Popconfirm
            title="Bạn có chắc muốn xóa phòng khám này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
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
            <Statistic title="Tổng số phòng khám" value={stats.totalClinics} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stat-card stat-card--user">
            <div className="stat-card__icon stat-card__icon--user">
              <UserOutlined />
            </div>
            <Statistic title="Tổng số người dùng" value={stats.totalUsers} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stat-card stat-card--post">
            <div className="stat-card__icon stat-card__icon--post">
              <FileTextOutlined />
            </div>
            <Statistic title="Tổng số bài đăng" value={stats.totalPosts} />
          </Card>
        </Col>
      </Row>

      {/* ── Header bảng ── */}
      <Card className="table-card">
        <Flex justify="space-between" align="center" className="section-header">
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Danh sách phòng khám
            </Typography.Title>
            <Typography.Text type="secondary">
              Quản lý các phòng khám mới đăng ký và đang hoạt động
            </Typography.Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm phòng khám
          </Button>
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
    </div>
  )
}