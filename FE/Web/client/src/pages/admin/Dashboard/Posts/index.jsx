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
import { useTranslation } from 'react-i18next'
import { getPostListApi } from '../../../../services/forumService'
import { getAdminInstance } from '../../../../services/apiClient'
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
  const { t } = useTranslation('admin')
  const noDataText = t('common.noData')
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

  const getRoleLabelByLocale = (role) => {
    const normalizedRole = String(role || '').trim().toUpperCase()
    if (!normalizedRole) return t('users.role.none')
    return t(`users.role.${normalizedRole}`, { defaultValue: t('users.role.none') })
  }

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
      const data = await getPostListApi(getAdminInstance(), DEFAULT_LIMIT, lastPostTime)
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
      message.error(error.message || t('posts.messages.fetchFailed'))
    } finally {
      if (reset) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }, [t])

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
    message.success(t('posts.messages.deleteSuccess'))
  }

  const handleDeleteWithConfirm = (post) => {
    Modal.confirm({
      centered: true,
      title: t('posts.confirmDelete.title'),
      icon: <InfoCircleOutlined style={{ color: 'var(--admin-color-warning)' }} />,
      content: t('posts.confirmDelete.content'),
      okText: t('posts.confirmDelete.ok'),
      okType: 'danger',
      cancelText: t('posts.confirmDelete.cancel'),
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
      { value: 'ALL', label: t('posts.filters.all') },
      ...dynamicOptions,
    ]
  }, [posts, t])

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
      title: t('posts.table.columns.author'),
      key: 'author',
      width: 250,
      render: (_, record) => {
        const authorName = record?.author?.fullName || ''
        const displayName = authorName || noDataText
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
      title: t('posts.table.columns.role'),
      key: 'role',
      width: 170,
      align: 'center',
      render: (_, record) => {
        const role = record?.author?.role
        return (
          <Tag className={ROLE_CLASSNAMES[role] || 'role-tag'}>
            {getRoleLabelByLocale(role)}
          </Tag>
        )
      },
    },
    {
      title: t('posts.table.columns.content'),
      dataIndex: 'content',
      key: 'content',
      render: (value) => (
        <Typography.Paragraph
          className="post-content"
          ellipsis={{ rows: 1 }}
          title={cleanContent(value) || ''}
        >
          {cleanContent(value) || noDataText}
        </Typography.Paragraph>
      ),
    },
    {
      title: t('posts.table.columns.postedDate'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date) => formatDate(date),
    },
    {
      title: t('posts.table.columns.action'),
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
            <Statistic title={t('posts.stats.loadedPosts')} value={stats.totalPosts} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stat-card stat-card--like">
            <div className="stat-card__icon stat-card__icon--like">
              <LikeOutlined />
            </div>
            <Statistic title={t('posts.stats.totalLikes')} value={stats.totalLikes} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="stat-card stat-card--comment">
            <div className="stat-card__icon stat-card__icon--comment">
              <MessageOutlined />
            </div>
            <Statistic title={t('posts.stats.totalComments')} value={stats.totalComments} />
          </Card>
        </Col>
      </Row>

      <Card className="table-card">
        <Flex justify="space-between" align="center" className="section-header">
          <div className="section-title">
            <Typography.Title level={4} style={{ margin: 0 }}>
              {t('posts.page.title')}
            </Typography.Title>
            <Typography.Text type="secondary">
              {t('posts.page.subtitle')}
            </Typography.Text>
          </div>
          <div className="posts-table-actions">
            <Input
              className="posts-search"
              placeholder={t('posts.search.placeholder')}
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
              placeholder={t('posts.filters.topicPlaceholder')}
            />
          </div>
        </Flex>

        <Table
          columns={columns}
          dataSource={filteredPosts}
          loading={loading}
          pagination={false}
          locale={{ emptyText: t('posts.states.empty') }}
          rowKey="id"
          tableLayout="fixed"
        />

        <Flex justify="space-between" align="center" className="pagination-bar">
          <Typography.Text>
            {t('posts.pagination.summary', { filtered: totalFiltered, loaded: totalLoaded })}
          </Typography.Text>
          <div className="load-more-actions">
            {hasMore ? (
              <Button
                type="primary"
                onClick={() => loadPosts({ reset: false })}
                loading={loadingMore}
                disabled={loading}
              >
                {t('posts.actions.loadMore')}
              </Button>
            ) : (
              <Typography.Text type="secondary">
                {t('posts.states.allDataLoaded')}
              </Typography.Text>
            )}
          </div>
        </Flex>
      </Card>

      <Modal
        title={t('posts.detailModal.title')}
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        width={720}
        centered
      >
        <Descriptions bordered column={1} size="middle" className="post-detail-descriptions">
          <Descriptions.Item label={t('posts.detailModal.labels.author')}>
            {selectedPost?.author?.fullName || noDataText}
          </Descriptions.Item>
          <Descriptions.Item label={t('posts.detailModal.labels.role')}>
            {getRoleLabelByLocale(selectedPost?.author?.role)}
          </Descriptions.Item>
          <Descriptions.Item label={t('posts.detailModal.labels.topic')}>
            {selectedPost?.topic?.nameVn || noDataText}
          </Descriptions.Item>
          <Descriptions.Item label={t('posts.detailModal.labels.postedDate')}>
            {formatDate(selectedPost?.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label={t('posts.detailModal.labels.likes')}>
            {selectedPost?.likeCount ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label={t('posts.detailModal.labels.comments')}>
            {selectedPost?.commentCount ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label={t('posts.detailModal.labels.content')}>
            <Typography.Text className="post-detail-content">
              {cleanContent(selectedPost?.content || '') || noDataText}
            </Typography.Text>
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  )
}
