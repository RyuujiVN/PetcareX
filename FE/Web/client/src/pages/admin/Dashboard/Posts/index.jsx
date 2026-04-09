import {
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LikeOutlined,
  MessageOutlined,
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
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getRoleLabel } from '../../../../constants/veterinaryLabels'
import { getPostListApi } from '../../../../data/admin/api/postApi'
import './style.css'

const DEFAULT_LIMIT = 20

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

const cleanContent = (content) => {
  if (!content) return ''
  return content
    .replace(/^Chủ đề:\s*.*\n?/i, '')
    .replace(/\[\[title:.*?\]\]/gi, '')
    .replace(/\[\[img:.*?\]\]/gi, '')
    .trim()
}

const ROLE_CLASSNAMES = {
  ADMIN: 'role-tag role-tag--admin',
  ADMIN_CLINIC: 'role-tag role-tag--clinic',
  VETERINARIAN: 'role-tag role-tag--vet',
  CUSTOMER: 'role-tag role-tag--customer',
}

export default function Posts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('ALL')
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)

  const postsRef = useRef([])

  useEffect(() => {
    postsRef.current = posts
  }, [posts])

  const loadPosts = useCallback(async ({ reset = false } = {}) => {
    const currentPosts = postsRef.current
    const lastPostTime = reset
      ? undefined
      : currentPosts[currentPosts.length - 1]?.createdAt

    if (reset) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const data = await getPostListApi(DEFAULT_LIMIT, lastPostTime)
      const incoming = Array.isArray(data) ? data : []

      setPosts((prev) => {
        if (reset) return incoming
        const map = new Map(prev.map((item) => [item.id, item]))
        incoming.forEach((item) => {
          if (!map.has(item.id)) {
            map.set(item.id, item)
          }
        })
        return Array.from(map.values())
      })
      setHasMore(incoming.length === DEFAULT_LIMIT)
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách bài đăng')
    } finally {
      if (reset) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }, [])

  useEffect(() => {
    loadPosts({ reset: true })
  }, [loadPosts])

  const handleSearch = (value) => {
    setSearch(value)
  }

  const handleViewPost = (post) => {
    setSelectedPost(post)
    setViewModalOpen(true)
  }

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((item) => item.id !== postId))
    message.success('Đã xóa bài đăng khỏi danh sách hiển thị')
  }

  const handleDeleteWithConfirm = (post) => {
    Modal.confirm({
      centered: true,
      title: 'Xác nhận xóa bài đăng',
      icon: <InfoCircleOutlined style={{ color: 'var(--admin-color-warning)' }} />,
      content: 'Bạn có chắc muốn xóa bài đăng này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        handleDeletePost(post.id)
      },
    })
  }

  const topicOptions = useMemo(() => {
    const topicMap = new Map()
    posts.forEach((post) => {
      const topicName = post?.topic?.nameVn?.trim()
      if (topicName) topicMap.set(topicName, topicName)
    })

    const dynamicOptions = Array.from(topicMap.values())
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map((topic) => ({
        value: topic,
        label: topic,
      }))

    return [
      { value: 'ALL', label: 'Tất cả' },
      ...dynamicOptions,
    ]
  }, [posts])

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return posts.filter((post) => {
      const authorName = post?.author?.fullName?.toLowerCase() || ''
      const topicName = post?.topic?.nameVn?.toLowerCase() || ''
      const content = cleanContent(post?.content || '').toLowerCase()
      const matchKeyword = !keyword || (
        authorName.includes(keyword) ||
        topicName.includes(keyword) ||
        content.includes(keyword)
      )

      const rawTopic = post?.topic?.nameVn?.trim() || ''
      const matchTopic = topicFilter === 'ALL'
        ? true
        : topicFilter === 'NO_TOPIC'
          ? !rawTopic
          : rawTopic === topicFilter

      return matchKeyword && matchTopic
    })
  }, [posts, search, topicFilter])

  const stats = useMemo(() => {
    return posts.reduce(
      (acc, post) => {
        acc.totalLikes += post?.likeCount || 0
        acc.totalComments += post?.commentCount || 0
        return acc
      },
      {
        totalPosts: posts.length,
        totalLikes: 0,
        totalComments: 0,
      },
    )
  }, [posts])

  const columns = [
    {
      title: 'TÁC GIẢ',
      key: 'author',
      width: 250,
      render: (_, record) => {
        const authorName = record?.author?.fullName || ''
        const displayName = authorName || '—'
        return (
          <Space size={12} className="author-cell">
            <Avatar
              src={record?.author?.avatarUrl || undefined}
              icon={!record?.author?.avatarUrl && !authorName ? <UserOutlined /> : null}
              className="post-author-avatar"
            >
              {!record?.author?.avatarUrl && authorName
                ? getAbbreviation(authorName)
                : null}
            </Avatar>
            <div className="author-meta">
              <Typography.Text className="author-name" title={displayName}>
                {displayName}
              </Typography.Text>
            </div>
          </Space>
        )
      },
    },
    {
      title: 'VAI TRÒ',
      key: 'role',
      width: 170,
      align: 'center',
      render: (_, record) => {
        const role = record?.author?.role
        return (
          <Tag className={ROLE_CLASSNAMES[role] || 'role-tag'}>
            {role ? getRoleLabel(role) : 'Không'}
          </Tag>
        )
      },
    },
    {
      title: 'NỘI DUNG',
      dataIndex: 'content',
      key: 'content',
      render: (value) => (
        <Typography.Paragraph
          className="post-content"
          ellipsis={{ rows: 1 }}
          title={cleanContent(value) || ''}
        >
          {cleanContent(value) || '—'}
        </Typography.Paragraph>
      ),
    },
    {
      title: 'NGÀY ĐĂNG',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date) => formatDate(date),
    },
    {
      title: 'THAO TÁC',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space className="table-action-group">
          <Button
            type="text"
            className="table-action-btn table-action-btn--view"
            icon={<EyeOutlined />}
            onClick={() => handleViewPost(record)}
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

  const totalFiltered = filteredPosts.length
  const totalLoaded = posts.length

  return (
    <div className="posts-page">
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card className="stat-card stat-card--post">
            <div className="stat-card__icon stat-card__icon--post">
              <FileTextOutlined />
            </div>
            <Statistic title="Bài đăng đã tải" value={stats.totalPosts} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stat-card stat-card--like">
            <div className="stat-card__icon stat-card__icon--like">
              <LikeOutlined />
            </div>
            <Statistic title="Tổng lượt thích" value={stats.totalLikes} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stat-card stat-card--comment">
            <div className="stat-card__icon stat-card__icon--comment">
              <MessageOutlined />
            </div>
            <Statistic title="Tổng bình luận" value={stats.totalComments} />
          </Card>
        </Col>
      </Row>

      <Card className="table-card">
        <Flex justify="space-between" align="center" className="section-header">
          <div className="section-title">
            <Typography.Title level={4} style={{ margin: 0 }}>
              Danh sách bài đăng
            </Typography.Title>
            <Typography.Text type="secondary">
              Theo dõi bài viết mới nhất từ cộng đồng
            </Typography.Text>
          </div>
          <div className="posts-table-actions">
            <Input
              className="posts-search"
              placeholder="Tìm theo tác giả, chủ đề, nội dung"
              allowClear
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              onPressEnter={(event) => handleSearch(event.target.value)}
              prefix={<SearchOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
            />
            <Select
              size='large'
              className="posts-topic"
              options={topicOptions}
              value={topicFilter}
              onChange={setTopicFilter}
              placeholder="Lọc theo chủ đề"
            />
          </div>
        </Flex>

        <Table
          columns={columns}
          dataSource={filteredPosts}
          loading={loading}
          pagination={false}
          rowKey="id"
          tableLayout="fixed"
        />

        <Flex justify="space-between" align="center" className="pagination-bar">
          <Typography.Text>
            Hiển thị {totalFiltered} / {totalLoaded} bài đã tải
          </Typography.Text>
          <div className="load-more-actions">
            {hasMore ? (
              <Button
                type="primary"
                onClick={() => loadPosts({ reset: false })}
                loading={loadingMore}
                disabled={loading}
              >
                Tải thêm
              </Button>
            ) : (
              <Typography.Text type="secondary">
                Đã tải hết dữ liệu
              </Typography.Text>
            )}
          </div>
        </Flex>
      </Card>

      <Modal
        title="Chi tiết bài đăng"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        width={720}
        centered
      >
        <Descriptions bordered column={1} size="middle" className="post-detail-descriptions">
          <Descriptions.Item label="Tác giả">
            {selectedPost?.author?.fullName || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            {selectedPost?.author?.role ? getRoleLabel(selectedPost.author.role) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Chủ đề">
            {selectedPost?.topic?.nameVn || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày đăng">
            {formatDate(selectedPost?.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Lượt thích">
            {selectedPost?.likeCount ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="Bình luận">
            {selectedPost?.commentCount ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="Nội dung">
            <Typography.Text className="post-detail-content">
              {cleanContent(selectedPost?.content || '') || '—'}
            </Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  )
}
