import {
  FileTextOutlined,
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
  Flex,
  Input,
  Row,
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

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return posts
    return posts.filter((post) => {
      const authorName = post?.author?.fullName?.toLowerCase() || ''
      const topicName = post?.topic?.nameVn?.toLowerCase() || ''
      const content = cleanContent(post?.content || '').toLowerCase()
      return (
        authorName.includes(keyword) ||
        topicName.includes(keyword) ||
        content.includes(keyword)
      )
    })
  }, [posts, search])

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
      render: (_, record) => {
        const authorName = record?.author?.fullName || ''
        const displayName = authorName || '—'
        const role = record?.author?.role
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
              <Typography.Text className="author-name">
                {displayName}
              </Typography.Text>
              <Tag className={ROLE_CLASSNAMES[role] || 'role-tag'}>
                {role ? getRoleLabel(role) : '—'}
              </Tag>
            </div>
          </Space>
        )
      },
    },
    {
      title: 'CHỦ ĐỀ',
      dataIndex: ['topic', 'nameVn'],
      key: 'topic',
      render: (value) => <Tag className="topic-tag">{value || '—'}</Tag>,
    },
    {
      title: 'NỘI DUNG',
      dataIndex: 'content',
      key: 'content',
      render: (value) => (
        <Typography.Paragraph
          className="post-content"
          ellipsis={{ rows: 2 }}
        >
          {cleanContent(value) || '—'}
        </Typography.Paragraph>
      ),
    },
    {
      title: 'BÌNH LUẬN',
      dataIndex: 'commentCount',
      key: 'commentCount',
      align: 'center',
      render: (value) => value ?? 0,
    },
    {
      title: 'LƯỢT THÍCH',
      dataIndex: 'likeCount',
      key: 'likeCount',
      align: 'center',
      render: (value) => value ?? 0,
    },
    {
      title: 'NGÀY ĐĂNG',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
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
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Danh sách bài đăng
            </Typography.Title>
            <Typography.Text type="secondary">
              Theo dõi bài viết mới nhất từ cộng đồng
            </Typography.Text>
          </div>
          <Input.Search
            className="posts-search"
            placeholder="Tìm theo tác giả, chủ đề, nội dung"
            allowClear
            enterButton={false}
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            onSearch={handleSearch}
            prefix={<SearchOutlined style={{ color: 'var(--admin-color-text-disabled)' }} />}
          />
        </Flex>

        <Table
          columns={columns}
          dataSource={filteredPosts}
          loading={loading}
          pagination={false}
          rowKey="id"
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
    </div>
  )
}
