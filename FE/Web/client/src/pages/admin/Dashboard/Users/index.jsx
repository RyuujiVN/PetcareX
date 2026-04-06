import {
  DeleteOutlined,
  EyeOutlined,
  InfoCircleOutlined,
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
  Input,
  Select,
  Pagination,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Modal,
  message,
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRoleLabel } from '../../../../constants/veterinaryLabels'
import { deleteUserApi, getUserListApi } from '../../../../services/userService'
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

const ROLE_CLASSNAMES = {
  ADMIN: 'role-tag role-tag--admin',
  ADMIN_CLINIC: 'role-tag role-tag--clinic',
  VETERINARIAN: 'role-tag role-tag--vet',
  CUSTOMER: 'role-tag role-tag--customer',
  USER: 'role-tag role-tag--customer',
}

const USER_ROLE_FILTERS = {
  ALL: 'ALL',
  CUSTOMER: 'CUSTOMER',
  VETERINARIAN: 'VETERINARIAN',
  NO_ROLE: 'NO_ROLE',
}

const normalizeRole = (role) => String(role || '').trim().toUpperCase()

const isCustomerRole = (role) => {
  const normalized = normalizeRole(role)
  return normalized === 'CUSTOMER' || normalized === 'USER'
}

const isVeterinarianRole = (role) => normalizeRole(role) === 'VETERINARIAN'

const isNoRole = (role) => !normalizeRole(role)

const fetchAllUsersByKeyword = async (keyword = '') => {
  const limit = 100
  let page = 1
  let totalPages = 1
  const items = []

  while (page <= totalPages) {
    const response = await getUserListApi(getAdminInstance(), page, limit, keyword)
    const data = response?.data
    const currentItems = data?.items || []
    const meta = data?.meta || {}
    items.push(...currentItems)
    totalPages = meta.totalPages || 1
    page += 1
  }

  return items
}

export default function Users() {
  const [allUsers, setAllUsers] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  })
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalVeterinarians: 0,
  })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState(USER_ROLE_FILTERS.ALL)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const buildRoleStats = useCallback((items) => {
    return items.reduce(
      (acc, user) => {
        if (isCustomerRole(user?.role)) acc.totalCustomers += 1
        if (isVeterinarianRole(user?.role)) acc.totalVeterinarians += 1
        return acc
      },
      { totalCustomers: 0, totalVeterinarians: 0 },
    )
  }, [])

  const fetchUsers = useCallback(async (keyword = '') => {
    setLoading(true)
    try {
      const items = await fetchAllUsersByKeyword(keyword)
      setAllUsers(items)
      setPagination((prev) => ({
        ...prev,
        current: 1,
      }))
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRoleStats = useCallback(async () => {
    try {
      const items = await fetchAllUsersByKeyword('')
      setStats(buildRoleStats(items))
    } catch (error) {
      message.error(error.message || 'Không thể tải thống kê người dùng')
    }
  }, [buildRoleStats])

  useEffect(() => {
    fetchUsers('')
    fetchRoleStats()
  }, [fetchUsers, fetchRoleStats])

  const roleFilteredUsers = useMemo(() => {
    if (roleFilter === USER_ROLE_FILTERS.CUSTOMER) {
      return allUsers.filter((item) => isCustomerRole(item?.role))
    }

    if (roleFilter === USER_ROLE_FILTERS.VETERINARIAN) {
      return allUsers.filter((item) => isVeterinarianRole(item?.role))
    }

    if (roleFilter === USER_ROLE_FILTERS.NO_ROLE) {
      return allUsers.filter((item) => isNoRole(item?.role))
    }

    return allUsers
  }, [allUsers, roleFilter])

  const pagedUsers = useMemo(() => {
    const startIndex = (pagination.current - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    return roleFilteredUsers.slice(startIndex, endIndex)
  }, [pagination.current, pagination.pageSize, roleFilteredUsers])

  const roleFilterOptions = [
    { value: USER_ROLE_FILTERS.ALL, label: 'Tất cả' },
    { value: USER_ROLE_FILTERS.CUSTOMER, label: 'Khách hàng' },
    { value: USER_ROLE_FILTERS.VETERINARIAN, label: 'Bác sĩ' },
  ]

  const handlePageChange = (page, pageSize) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize,
    }))
  }

  const handleSearch = (value) => {
    const keyword = value.trim()
    setSearch(value)
    fetchUsers(keyword)
  }

  const handleSearchChange = (event) => {
    const nextValue = event.target.value
    setSearch(nextValue)
    if (!nextValue) {
      fetchUsers('')
    }
  }

  const handleRoleFilter = (nextRole) => {
    setRoleFilter(nextRole)
    setPagination((prev) => ({
      ...prev,
      current: 1,
    }))
  }

  const handleDelete = async (userId) => {
    try {
      await deleteUserApi(getAdminInstance(), userId)
      message.success('Đã cập nhật trạng thái người dùng')
      const keyword = search.trim()
      await Promise.all([fetchUsers(keyword), fetchRoleStats()])
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật trạng thái người dùng')
    }
  }

  const handleDeleteWithConfirm = (record) => {
    Modal.confirm({
      centered: true,
      title: 'Xác nhận dừng hoạt động',
      icon: <InfoCircleOutlined style={{ color: 'var(--admin-color-warning)' }} />,
      content: `Bạn có chắc muốn dừng hoạt động tài khoản "${record?.fullName || 'này'}" không?`,
      okText: 'Dừng hoạt động',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        await handleDelete(record.id)
      },
    })
  }

  const handleViewUser = (record) => {
    setSelectedUser(record)
    setViewModalOpen(true)
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
          <Typography.Text className="user-name-ellipsis" title={text || ''}>
            {text || '—'}
          </Typography.Text>
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
      render: (value) => (
        <Typography.Text className="user-address-ellipsis" title={value || ''}>
          {value || '—'}
        </Typography.Text>
      ),
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
      width: 150,
      align: 'center',
      render: (role) => (
        <Tag className={ROLE_CLASSNAMES[role] || 'role-tag'}>
          {role ? getRoleLabel(role) : 'Không'}
        </Tag>
      ),
    },
    {
      title: 'TRẠNG THÁI',
      dataIndex: 'deleted',
      key: 'deleted',
      width: 150,
      align: 'center',
      render: (deleted) => (
        <Tag className={deleted ? 'status-tag status-tag--inactive' : 'status-tag status-tag--active'} style={{ marginTop: 7}}>
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
            onClick={() => handleViewUser(record)}
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

  const { current, pageSize } = pagination
  const total = roleFilteredUsers.length
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1
  const end = Math.min(current * pageSize, total)

  return (
    <div className="users-page">
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card className="stat-card stat-card--user">
            <div className="stat-card__icon stat-card__icon--user">
              <UserOutlined />
            </div>
            <Statistic title="Tổng số người dùng" value={stats.totalCustomers} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card className="stat-card stat-card--vet">
            <div className="stat-card__icon stat-card__icon--vet">
              <UserOutlined />
            </div>
            <Statistic title="Tổng số bác sĩ" value={stats.totalVeterinarians} />
          </Card>
        </Col>
      </Row>

      <Card className="table-card">
        <Flex justify="space-between" align="center" className="section-header">
          <div className="section-title">
            <Typography.Title level={4} style={{ margin: 0 }}>
              Danh sách người dùng
            </Typography.Title>
            <Typography.Text type="secondary">
              Quản lý tài khoản đăng ký trong hệ thống
            </Typography.Text>
          </div>
          <div className="users-table-actions">
            <Input
              className="users-search"
              placeholder="Tìm kiếm theo tên hoặc email"
              allowClear
              value={search}
              onChange={handleSearchChange}
              onPressEnter={(event) => handleSearch(event.target.value)}
              prefix={<SearchOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
            />
            <Select
              size = 'large'
              className="users-role-filter-select"
              options={roleFilterOptions}
              value={roleFilter}
              onChange={handleRoleFilter}
              placeholder="Lọc theo vai trò"
            />
          </div>
        </Flex>

        <Table
          columns={columns}
          dataSource={pagedUsers}
          loading={loading}
          pagination={false}
          rowKey="id"
          scroll={{ x: 1180 }}
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

      <Modal
        title="Chi tiết người dùng"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        width={720}
        centered
      >
        <Descriptions bordered column={1} size="middle" className="user-detail-descriptions">
          <Descriptions.Item label="Họ và tên">
            {selectedUser?.fullName || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {selectedUser?.email || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            {selectedUser?.phone || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">
            {selectedUser?.address || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            {selectedUser?.role ? getRoleLabel(selectedUser.role) : 'Không'}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            {selectedUser?.deleted ? 'Dừng hoạt động' : 'Hoạt động'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">
            {formatDate(selectedUser?.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày cập nhật">
            {formatDate(selectedUser?.updatedAt)}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  )
}
