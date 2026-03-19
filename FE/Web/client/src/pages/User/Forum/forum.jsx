import {
	FaEllipsis,
	FaImage,
	FaRegComment,
	FaRegFaceSmile,
	FaRegThumbsUp,
	FaShareNodes,
} from 'react-icons/fa6'
import { IoAt } from 'react-icons/io5'
import { message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createComment } from '../../../data/api/commentApi'
import {
	createPost,
	getCommentsByPostId,
	getPosts,
	likePost,
	unlikePost,
} from '../../../data/api/postApi'
import { getAllTopics } from '../../../data/api/topicApi'
import Footer from '../../../components/layout/footer'
import Header from '../../../components/layout/header'
import styles from './forum.module.css'

const DEFAULT_CATEGORY_TABS = [
	{ id: 'all', label: 'Tất cả' },
]

const DEFAULT_COMPOSER_AVATAR = '/avatarMain.png'

const formatTimeAgo = (dateValue) => {
	if (!dateValue) return 'Vừa xong'

	const created = new Date(dateValue).getTime()
	if (Number.isNaN(created)) return 'Vừa xong'

	const diff = Date.now() - created
	const minute = 60 * 1000
	const hour = 60 * minute
	const day = 24 * hour

	if (diff < minute) return 'Vừa xong'
	if (diff < hour) return `${Math.floor(diff / minute)} phút trước`
	if (diff < day) return `${Math.floor(diff / hour)} giờ trước`
	return `${Math.floor(diff / day)} ngày trước`
}

const normalizeTagType = (topicName = '') => {
	const normalized = topicName.toLowerCase()
	if (normalized.includes('kinh nghiệm') || normalized.includes('kinh nghiem')) return 'kinh-nghiem-nuoi'
	if (normalized.includes('bác sĩ') || normalized.includes('bac si') || normalized.includes('hỏi đáp') || normalized.includes('hoi dap')) {
		return 'hoi-dap-bac-si'
	}
	if (normalized.includes('cảnh báo') || normalized.includes('canh bao') || normalized.includes('dịch bệnh') || normalized.includes('dich benh')) {
		return 'canh-bao-dich-benh'
	}
	return 'kinh-nghiem-nuoi'
}

const mapPostToUi = (post) => ({
	id: post.id,
	author: post.author?.fullName || 'Người dùng',
	time: formatTimeAgo(post.createdAt),
	tag: (post.topic?.name || 'Bài viết').toUpperCase(),
	tagType: normalizeTagType(post.topic?.name),
	content: post.content,
	image: null,
	likes: Number(post.likeCount || 0),
	comments: Number(post.commentCount || 0),
	avatar: post.author?.avatarUrl || '/avatarMain.png',
	liked: Boolean(post.liked),
	rawTopicId: post.topic?.id,
})

function Forum() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const composerRef = useRef(null)
	const [apiPosts, setApiPosts] = useState([])
	const [apiTopics, setApiTopics] = useState([])
	const [loadingPosts, setLoadingPosts] = useState(false)
	const [loadingTopics, setLoadingTopics] = useState(false)
	const [processingLikeId, setProcessingLikeId] = useState(null)
	const [composerAvatar, setComposerAvatar] = useState(DEFAULT_COMPOSER_AVATAR)

	const forumTabs = useMemo(() => {
		const mapped = apiTopics
			.map((topic) => ({
				id: normalizeTagType(topic.name),
				label: topic.name,
			}))
			.filter((item) => item.id)

		const unique = mapped.filter((item, index, arr) => arr.findIndex((value) => value.id === item.id) === index)

		if (!unique.length) {
			return DEFAULT_CATEGORY_TABS
		}

		return [DEFAULT_CATEGORY_TABS[0], ...unique]
	}, [apiTopics])

	const activeTab = useMemo(() => {
		const tab = searchParams.get('tab') || 'all'
		return forumTabs.some((item) => item.id === tab) ? tab : 'all'
	}, [forumTabs, searchParams])

	const topContributors = useMemo(() => {
		const stats = new Map()

		apiPosts.forEach((post) => {
			const key = `${post.author}-${post.avatar}`
			const current = stats.get(key) || {
				name: post.author,
				avatar: post.avatar,
				count: 0,
			}

			current.count += 1
			stats.set(key, current)
		})

		return Array.from(stats.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 3)
			.map((item, index) => ({
				id: `${item.name}-${index}`,
				name: item.name,
				score: `${item.count} Bài viết`,
				rank: `#${index + 1}`,
				avatar: item.avatar || DEFAULT_COMPOSER_AVATAR,
			}))
	}, [apiPosts])

	const featuredPosts = useMemo(() => {
		return [...apiPosts]
			.sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
			.slice(0, 3)
			.map((post) => ({
				id: post.id,
				heading: `Thịnh hành trong ${post.tag}`,
				title: post.content || 'Bài viết mới trong cộng đồng',
				meta: `${post.likes} lượt thích • ${post.comments} bình luận`,
			}))
	}, [apiPosts])

	const selectedPost = searchParams.get('post')
	const isComposerOpen = searchParams.get('composer') === 'open'

	useEffect(() => {
		if (isComposerOpen && composerRef.current) {
			composerRef.current.focus()
		}
	}, [isComposerOpen])

	useEffect(() => {
		try {
			const raw = localStorage.getItem('userInfo')
			if (!raw) return

			const userInfo = JSON.parse(raw)
			if (userInfo?.avatarUrl) {
				setComposerAvatar(userInfo.avatarUrl)
			}
		} catch {
			setComposerAvatar(DEFAULT_COMPOSER_AVATAR)
		}
	}, [])

	const loadPosts = async () => {
		setLoadingPosts(true)
		try {
			const data = await getPosts({ limit: 20 })
			setApiPosts(Array.isArray(data) ? data.map(mapPostToUi) : [])
		} catch (error) {
			message.error(error.message || 'Không thể tải danh sách bài viết')
		} finally {
			setLoadingPosts(false)
		}
	}

	useEffect(() => {
		const loadInitialData = async () => {
			setLoadingTopics(true)
			try {
				const topics = await getAllTopics()
				setApiTopics(Array.isArray(topics) ? topics : [])
			} catch (error) {
				message.error(error.message || 'Không thể tải chủ đề')
			} finally {
				setLoadingTopics(false)
			}

			await loadPosts()
		}

		loadInitialData()
	}, [])

	const updateParams = (nextValues) => {
		const next = new URLSearchParams(searchParams)
		Object.entries(nextValues).forEach(([key, value]) => {
			if (!value) {
				next.delete(key)
			} else {
				next.set(key, value)
			}
		})
		navigate(`/forum?${next.toString()}`)
	}

	const handleCreatePost = async () => {
		const content = window.prompt('Nhập nội dung bài viết')
		if (!content || !content.trim()) return

		const topicId = apiTopics[0]?.id
		if (!topicId) {
			message.warning('Chưa có chủ đề để đăng bài')
			return
		}

		try {
			await createPost({
				topicId,
				content: content.trim(),
			})
			message.success('Đăng bài thành công')
			await loadPosts()
		} catch (error) {
			message.error(error.message || 'Đăng bài thất bại')
		}
	}

	const handleToggleLike = async (post) => {
		setProcessingLikeId(post.id)
		try {
			const response = post.liked ? await unlikePost(post.id) : await likePost(post.id)
			setApiPosts((prev) =>
				prev.map((item) =>
					item.id === post.id
						? {
								...item,
								likes: response?.likeCount ?? item.likes,
								liked: response?.liked ?? !item.liked,
						  }
						: item,
				),
			)
		} catch (error) {
			message.error(error.message || 'Không thể cập nhật lượt thích')
		} finally {
			setProcessingLikeId(null)
		}
	}

	const handleOpenComments = async (post) => {
		updateParams({ post: post.id })
		try {
			const comments = await getCommentsByPostId(post.id, { limit: 10 })
			const count = Array.isArray(comments) ? comments.length : 0
			message.info(`Bài viết có ${count} bình luận gần nhất`)
		} catch (error) {
			message.error(error.message || 'Không thể tải bình luận')
		}
	}

	const handleCreateComment = async (post) => {
		const content = window.prompt('Nhập bình luận của bạn')
		if (!content || !content.trim()) return

		try {
			await createComment({
				postId: post.id,
				parentId: null,
				content: content.trim(),
			})
			message.success('Bình luận thành công')
			setApiPosts((prev) =>
				prev.map((item) =>
					item.id === post.id
						? {
								...item,
								comments: item.comments + 1,
						  }
						: item,
				),
			)
		} catch (error) {
			message.error(error.message || 'Không thể tạo bình luận')
		}
	}

	const sourcePosts = apiPosts

	const visiblePosts = sourcePosts.filter((post) => {
		if (activeTab === 'all') return true
		return post.tagType === activeTab
	})

	return (
		<div className={styles.pageRoot}>
			<Header />

			<main className={styles.pageWrap}>
				<section className={styles.leftColumn}>
					<div className={styles.composeCard}>
						<div className={styles.composeTop}>
							<img src={composerAvatar} alt="avatar" className={styles.composeAvatar} />
							<textarea
								ref={composerRef}
								className={styles.composeInput}
								placeholder="Bạn muốn chia sẻ điều gì về thú cưng hôm nay?"
								readOnly
							/>
						</div>

						<div className={styles.composeBottom}>
							<div className={styles.composeActions}>
								<button type="button" onClick={() => updateParams({ composer: 'open' })}>
									<FaImage />
								</button>
								<button type="button" onClick={() => updateParams({ composer: 'open' })}>
									<FaRegFaceSmile />
								</button>
								<button type="button" onClick={() => updateParams({ composer: 'open' })}>
									<IoAt />
								</button>
							</div>

							<button
								type="button"
								className={styles.postButton}
								onClick={handleCreatePost}
								disabled={loadingPosts || loadingTopics}
							>
								Đăng bài
							</button>
						</div>
					</div>

					<div className={styles.tabRow}>
						{forumTabs.map((tab) => (
							<button
								key={tab.id}
								type="button"
								className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
								onClick={() => updateParams({ tab: tab.id, post: '', composer: '' })}
							>
								{tab.label}
							</button>
						))}
					</div>

					<div className={styles.feedList}>
						{visiblePosts.map((post, index) => (
							<article
								key={post.id}
								className={`${styles.postCard} ${selectedPost === post.id ? styles.selectedPost : ''}`}
							>
								<header className={styles.postHeader}>
									<div className={styles.postAuthorWrap}>
										{post.avatarText ? (
											<span className={styles.avatarText}>{post.avatarText}</span>
										) : (
											<img src={post.avatar} alt={post.author} className={styles.postAvatar} />
										)}

										<div>
											<h3>{post.author}</h3>
											<p>{post.time}</p>
										</div>
									</div>

									{index === 0 ? (
										<button type="button" className={styles.moreButton}>
											<FaEllipsis />
										</button>
									) : null}
								</header>

								<span className={`${styles.postTag} ${styles[post.tagType]}`}>{post.tag}</span>

								{post.content ? <p className={styles.postContent}>{post.content}</p> : null}

								{post.image ? (
									<img
										src={post.image}
										alt="Bài viết"
										className={styles.postImage}
										onClick={() => handleOpenComments(post)}
									/>
								) : null}

								{typeof post.likes === 'number' && typeof post.comments === 'number' ? (
									<footer className={styles.postFooter}>
										<button type="button" onClick={() => handleToggleLike(post)} disabled={processingLikeId === post.id}>
											<FaRegThumbsUp /> {post.likes}
										</button>
										<button type="button" onClick={() => handleCreateComment(post)} disabled={loadingPosts}>
											<FaRegComment /> {post.comments}
										</button>
										<button type="button" className={styles.shareBtn} onClick={() => handleOpenComments(post)}>
											<FaShareNodes />
										</button>
									</footer>
								) : null}
							</article>
						))}
					</div>
				</section>

				<aside className={styles.rightColumn}>
					<section className={styles.sideCard}>
						<header className={styles.sideTitle}>
							<h2>Người đóng góp hàng đầu</h2>
						</header>

						<div className={styles.rankList}>
							{topContributors.map((item) => (
								<button
									key={item.id}
									type="button"
									className={styles.rankItem}
									onClick={() => navigate('/profile')}
								>
									<img src={item.avatar} alt={item.name} />
									<span>
										<strong>{item.name}</strong>
										<small>{item.score}</small>
									</span>
									<em>{item.rank}</em>
								</button>
							))}
						</div>

						<button type="button" className={styles.sideAction} onClick={() => navigate('/profile')}>
							Xem tất cả bảng xếp hạng
						</button>
					</section>

					<section className={styles.sideCard}>
						<header className={styles.sideTitle}>
							<h2>Bài viết nổi bật</h2>
						</header>

						<div className={styles.featureList}>
							{featuredPosts.map((item, index) => (
								<button
									key={item.id}
									type="button"
									className={styles.featureItem}
									onClick={() => updateParams({ post: item.id || String(index + 1) })}
								>
									<p>{item.heading}</p>
									<strong>{item.title}</strong>
									<small>{item.meta}</small>
								</button>
							))}
						</div>
					</section>
				</aside>
			</main>

			<Footer />
		</div>
	)
}

export default Forum
