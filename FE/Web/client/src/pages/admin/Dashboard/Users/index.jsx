import {
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  Col,
  Flex,
  Input,
  Pagination,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { getRoleLabel } from '../../../../constants/veterinaryLabels'
import { deleteUserApi, getUserListApi } from '../../../../data/admin/api/userApi'
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

const ROLE_CLASSNAMES = {
  ADMIN: 'role-tag role-tag--admin',
  ADMIN_CLINIC: 'role-tag role-tag--clinic',
  VETERINARIAN: 'role-tag role-tag--vet',
  CUSTOMER: 'role-tag role-tag--customer',
}

export default function Users() {
  const [userList, setUserList] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [stats, setStats] = useState({ totalUsers: 0 })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const fetchUsers = useCallback(async (page, pageSize, keyword = '') => {
    setLoading(true)
    try {
      const data = await getUserListApi(page, pageSize, keyword)
      setUserList(data.items || [])
      setPagination({
        current: data.meta.currentPage,
        pageSize: data.meta.itemsPerPage,
        total: data.meta.totalItems,
      })
      if (!keyword) {
        setStats({ totalUsers: data.meta.totalItems || 0 })
      }
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize)
  }, [])

  const handlePageChange = (page, pageSize) => {
    fetchUsers(page, pageSize, search)
  }

  const handleSearch = (value) => {
    const keyword = value.trim()
    setSearch(keyword)
    fetchUsers(1, pagination.pageSize, keyword)
  }

  const handleSearchChange = (event) => {
    const nextValue = event.target.value
    setSearch(nextValue)
    if (!nextValue) {
      fetchUsers(1, pagination.pageSize, '')
    }
  }

  const handleDelete = async (userId) => {
    try {
      await deleteUserApi(userId)
      message.success('Đã cập nhật trạng thái người dùng')
      setStats((prev) => ({
        totalUsers: prev.totalUsers > 0 ? prev.totalUsers - 1 : 0,
      }))
      const nextPage = userList.length === 1 && pagination.current > 1
        ? pagination.current - 1
        : pagination.current
      fetchUsers(nextPage, pagination.pageSize, search)
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật trạng thái người dùng')
    }
  }

  const columns = [
    {
      title: 'TÊN NGƯỜI DÙNG',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text, record) => (
        <Space>
          <Avatar
            src={record.avatarUrl || undefined}
            style={{ backgroundColor: 'var(--admin-color-brand-primary)' }}
          >
            {!record.avatarUrl ? getAbbreviation(text) : null}
          </Avatar>
          <span>{text || '—'}</span>
        </Space>
      ),
    },
    {
      title: 'SỐ ĐIỆN THOẠI',
      dataIndex: 'phone',
      key: 'phone',
      render: (value) => value || '—',
    },
    {
      title: 'ĐỊA CHỈ',
      dataIndex: 'address',
      key: 'address',
      render: (value) => value || '—',
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
      render: (value) => value || '—',
    },
    {
      title: 'VAI TRÒ',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag className={ROLE_CLASSNAMES[role] || 'role-tag'}>
          {getRoleLabel(role)}
        </Tag>
      ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'deleted',
      key: 'deleted',
      render: (deleted) => (
        <Tag className={deleted ? 'status-tag status-tag--inactive' : 'status-tag status-tag--active'}>
          {deleted ? 'Dừng hoạt động' : 'Hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Bạn có chắc muốn dừng hoạt động người dùng này?"
            okText="Dừng hoạt động"
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
    <div className="users-page">
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card className="stat-card stat-card--user">
            <div className="stat-card__icon stat-card__icon--user">
              <UserOutlined />
            </div>
            <Statistic title="Tổng số người dùng" value={stats.totalUsers} />
          </Card>
        </Col>
      </Row>

      <Card className="table-card">
        <Flex justify="space-between" align="center" className="section-header">
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Danh sách người dùng
            </Typography.Title>
            <Typography.Text type="secondary">
              Quản lý tài khoản đăng ký trong hệ thống
            </Typography.Text>
          </div>
          <Input.Search
            className="users-search"
            placeholder="Tìm kiếm theo tên hoặc email"
            allowClear
            enterButton={false}
            value={search}
            onChange={handleSearchChange}
            onSearch={handleSearch}
            prefix={<SearchOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
          />
        </Flex>

        <Table
          columns={columns}
          dataSource={userList}
          loading={loading}
          pagination={false}
          rowKey="id"
        />

        <Flex justify="space-between" align="center" className="pagination-bar">
          <Typography.Text>
            Hiển thị {start}-{end} trên {total} người dùng
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
