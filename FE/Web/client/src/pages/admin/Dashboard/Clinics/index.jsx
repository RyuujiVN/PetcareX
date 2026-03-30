import { useCallback, useEffect, useState } from 'react'
import {
  Row, Col, Card, Statistic, Table, Tag, Button, Space,
  Typography, Avatar, Pagination, Flex, Popconfirm, message,
} from 'antd'
import {
  PlusOutlined, EyeOutlined, DeleteOutlined,
  MedicineBoxOutlined, UserOutlined, FileTextOutlined,
} from '@ant-design/icons'
import { getClinicListApi, deleteClinicApi } from '../../../../data/admin/api/clinicApi'
import './style.css'

/**
 * Lấy 2 chữ cái viết tắt từ tên phòng khám.
 */
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

/**
 * Format ngày sang dd/MM/yyyy.
 */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleView = (id) => {
    // TODO: điều hướng đến trang chi tiết phòng khám
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
    // TODO: mở modal hoặc điều hướng trang thêm phòng khám
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
    </div>
  )
}
