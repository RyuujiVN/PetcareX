import {
	FaEllipsis,
	FaImage,
	FaRegComment,
	FaRegThumbsUp,
} from 'react-icons/fa6'
import { message, Modal } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createComment, getReplies } from '../../../data/api/commentApi'
import { uploadUserImageApi } from '../../../data/api/user'
import {
	createPost,
	deletePost,
	getCommentsByPostId,
	getPosts,
	likePost,
	unlikePost,
	updatePost,
} from '../../../data/api/postApi'
import { getAllTopics } from '../../../data/api/topicApi'
import Header from '../../../components/layout/header'
import styles from './forum.module.css'

const DEFAULT_CATEGORY_TABS = [
	{ id: 'all', label: 'Tất cả' },
]

const DEFAULT_COMPOSER_AVATAR = '/avatarMain.png'
const IMAGE_TOKEN_REGEX = /\[\[img:(.*?)\]\]/g
const TITLE_TOKEN_REGEX = /^\s*\[\[title:(.*?)\]\]\s*/i

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

const extractMediaFromContent = (rawContent = '') => {
	const matches = [...rawContent.matchAll(IMAGE_TOKEN_REGEX)]
	const firstImage = matches[0]?.[1]?.trim() || null
	const withoutImageToken = rawContent.replace(IMAGE_TOKEN_REGEX, '').trim()
	const titleMatch = withoutImageToken.match(TITLE_TOKEN_REGEX)
	const title = titleMatch?.[1]?.trim() || ''
	const cleanContent = withoutImageToken.replace(TITLE_TOKEN_REGEX, '').trim()

	return {
		title,
		text: cleanContent,
		image: firstImage,
	}
}

const attachPostToContent = ({ title, text, imageUrl }) => {
	const normalizedTitle = title?.trim()
	const normalizedText = text.trim() || 'Hình ảnh'
	const lines = []

	if (normalizedTitle) {
		lines.push(`[[title:${normalizedTitle}]]`)
	}

	lines.push(normalizedText)

	if (imageUrl) {
		lines.push(`[[img:${imageUrl}]]`)
	}

	return lines.join('\n')
}

const attachCommentToContent = (text, imageUrl) => {
	const normalizedText = text.trim() || 'Hình ảnh'
	if (!imageUrl) return normalizedText

	return `${normalizedText}\n[[img:${imageUrl}]]`
}

const toDataUrl = (file) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(String(reader.result || ''))
		reader.onerror = () => reject(new Error('Không thể đọc file ảnh'))
		reader.readAsDataURL(file)
	})

const mapCommentToUi = (comment) => {
	const media = extractMediaFromContent(comment.content || '')

	return {
		id: comment.id,
		postId: comment.postId,
		parentId: comment.parentId,
		content: media.text,
		image: media.image,
		replyCount: Number(comment.replyCount || 0),
		createdAt: comment.createdAt,
		time: formatTimeAgo(comment.createdAt),
		user: {
			id: comment.user?.id,
			fullName: comment.user?.fullName || 'Người dùng',
			avatarUrl: comment.user?.avatarUrl || DEFAULT_COMPOSER_AVATAR,
		},
	}
}

const mapPostToUi = (post) => {
	const media = extractMediaFromContent(post.content || '')

	return {
		id: post.id,
		authorId: post.author?.id,
		author: post.author?.fullName || 'Người dùng',
		title: media.title,
		content: media.text,
		image: media.image,
		time: formatTimeAgo(post.createdAt),
		tag: (post.topic?.name || 'Bài viết').toUpperCase(),
		tagType: normalizeTagType(post.topic?.name),
		likes: Number(post.likeCount || 0),
		comments: Number(post.commentCount || 0),
		avatar: post.author?.avatarUrl || '/avatarMain.png',
		liked: Boolean(post.liked),
		rawTopicId: post.topic?.id,
	}
}

function Forum() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const composerRef = useRef(null)
	const postImageInputRef = useRef(null)
	const commentImageInputRef = useRef(null)
	const replyImageInputRef = useRef(null)
	const [apiPosts, setApiPosts] = useState([])
	const [apiTopics, setApiTopics] = useState([])
	const [loadingPosts, setLoadingPosts] = useState(false)
	const [loadingTopics, setLoadingTopics] = useState(false)
	const [processingLikeId, setProcessingLikeId] = useState(null)
	const [composerAvatar, setComposerAvatar] = useState(DEFAULT_COMPOSER_AVATAR)
	const [currentUserId, setCurrentUserId] = useState(null)
	const [isComposerModalOpen, setIsComposerModalOpen] = useState(false)
	const [composerText, setComposerText] = useState('')
	const [composerTitle, setComposerTitle] = useState('')
	const [composerTopicId, setComposerTopicId] = useState('')
	const [composerImageFile, setComposerImageFile] = useState(null)
	const [composerImagePreview, setComposerImagePreview] = useState('')
	const [submittingPost, setSubmittingPost] = useState(false)
	const [editingPost, setEditingPost] = useState(null)
	const [submittingEditPost, setSubmittingEditPost] = useState(false)
	const [menuPostId, setMenuPostId] = useState(null)
	const [expandedPostId, setExpandedPostId] = useState(null)
	const [commentsByPost, setCommentsByPost] = useState({})
	const [loadingCommentsByPost, setLoadingCommentsByPost] = useState({})
	const [commentText, setCommentText] = useState('')
	const [commentImageFile, setCommentImageFile] = useState(null)
	const [commentImagePreview, setCommentImagePreview] = useState('')
	const [submittingComment, setSubmittingComment] = useState(false)
	const [replyingComment, setReplyingComment] = useState(null)
	const [replyText, setReplyText] = useState('')
	const [replyImageFile, setReplyImageFile] = useState(null)
	const [replyImagePreview, setReplyImagePreview] = useState('')
	const [submittingReply, setSubmittingReply] = useState(false)

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
		const key = post.authorId || post.author

		if (!stats.has(key)) {
			stats.set(key, {
				id: key,
				name: post.author,
				avatar: post.avatar || DEFAULT_COMPOSER_AVATAR,
				count: 0,
			})
		}

		stats.get(key).count += 1
	})

	return Array.from(stats.values())
		.sort((a, b) => b.count - a.count)
		.slice(0, 5)
		.map((item, index) => ({
			...item,
			score: `${item.count} Bài viết`,
			rank: `#${index + 1}`,
		}))
}, [apiPosts])

const featuredPosts = useMemo(() => {
	return [...apiPosts]
		.sort((a, b) => {
			const scoreA = (a.likes || 0) + (a.comments || 0)
			const scoreB = (b.likes || 0) + (b.comments || 0)
			return scoreB - scoreA
		})
		.slice(0, 5)
		.map((post) => ({
			id: post.id,
			heading: `Thịnh hành trong ${post.tag}`,
			title: post.title || post.content || 'Bài viết mới',
			meta: `${post.likes || 0} lượt thích • ${post.comments || 0} bình luận`,
		}))
}, [apiPosts])


	const selectedPost = searchParams.get('post')
	const isComposerOpen = searchParams.get('composer') === 'open'

	useEffect(() => {
		if (isComposerOpen && composerRef.current) {
			composerRef.current.focus()
			setIsComposerModalOpen(true)
		}
	}, [isComposerOpen])

	useEffect(() => {
		try {
			const raw = localStorage.getItem('userInfo')
			if (!raw) return

			const userInfo = JSON.parse(raw)
			if (userInfo?.id) {
				setCurrentUserId(userInfo.id)
			}
			if (userInfo?.avatarUrl) {
				setComposerAvatar(userInfo.avatarUrl)
			}
		} catch {
			setComposerAvatar(DEFAULT_COMPOSER_AVATAR)
		}
	}, [])

	useEffect(() => {
		if (!composerTopicId && apiTopics.length > 0) {
			setComposerTopicId(apiTopics[0].id)
		}
	}, [apiTopics, composerTopicId])

	const uploadImage = async (file) => {
		const payload = await uploadUserImageApi(file)

		const fileUrl = payload?.file || payload?.data?.file
		if (!fileUrl) {
			throw new Error('Không nhận được URL ảnh từ server')
		}

		return fileUrl
	}

	const loadPosts = async () => {
		setLoadingPosts(true)
		try {
			const data = await getPosts({ limit: 1000 })
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
		if (!composerTitle.trim() && !composerText.trim() && !composerImageFile) {
			message.warning('Vui lòng nhập nội dung hoặc chọn ảnh trước khi đăng')
			return
		}

		if (!composerTopicId) {
			message.warning('Chưa có chủ đề để đăng bài')
			return
		}

		try {
			setSubmittingPost(true)
			const imageUrl = composerImageFile ? await uploadImage(composerImageFile) : null
			await createPost({
				topicId: composerTopicId,
				content: attachPostToContent({
					title: composerTitle,
					text: composerText,
					imageUrl,
				}),
			})
			message.success('Đăng bài thành công')
			setComposerText('')
			setComposerTitle('')
			setComposerImageFile(null)
			setComposerImagePreview('')
			setIsComposerModalOpen(false)
			updateParams({ composer: '' })
			await loadPosts()
		} catch (error) {
			message.error(error.message || 'Đăng bài thất bại')
		} finally {
			setSubmittingPost(false)
		}
	}

	const closeEditModal = () => {
		setEditingPost(null)
	}

	const handleStartEditPost = (post) => {
		setMenuPostId(null)
		if (!currentUserId || post.authorId !== currentUserId) {
			message.warning('Bạn chỉ có thể chỉnh sửa bài viết của chính mình')
			return
		}

		setEditingPost({
			id: post.id,
			title: post.title || '',
			text: post.content || '',
			topicId: post.rawTopicId || composerTopicId || '',
			imageFile: null,
			imagePreview: post.image || '',
			existingImageUrl: post.image || '',
		})
	}

	const handlePickEditImage = async (event) => {
		const file = event.target.files?.[0]
		if (!file) return

		try {
			const preview = await toDataUrl(file)
			setEditingPost((prev) =>
				prev
					? {
							...prev,
							imageFile: file,
							imagePreview: preview,
					  }
					: prev,
			)
		} catch (error) {
			message.error(error.message || 'Không thể đọc ảnh đã chọn')
		}

		event.target.value = ''
	}

	const handleSaveEditedPost = async () => {
		if (!editingPost) return

		if (!editingPost.title.trim() && !editingPost.text.trim() && !editingPost.imagePreview) {
			message.warning('Bài viết không được để trống hoàn toàn')
			return
		}

		if (!editingPost.topicId) {
			message.warning('Vui lòng chọn chủ đề cho bài viết')
			return
		}

		try {
			setSubmittingEditPost(true)
			const imageUrl = editingPost.imageFile
				? await uploadImage(editingPost.imageFile)
				: editingPost.existingImageUrl || null

			await updatePost(editingPost.id, {
				topicId: editingPost.topicId,
				content: attachPostToContent({
					title: editingPost.title,
					text: editingPost.text,
					imageUrl,
				}),
			})

			message.success('Cập nhật bài viết thành công')
			closeEditModal()
			await loadPosts()
		} catch (error) {
			message.error(error.message || 'Không thể cập nhật bài viết')
		} finally {
			setSubmittingEditPost(false)
		}
	}

	const handleDeletePost = (post) => {
		setMenuPostId(null)
		if (!currentUserId || post.authorId !== currentUserId) {
			message.warning('Bạn chỉ có thể xóa bài viết của chính mình')
			return
		}

		Modal.confirm({
			title: 'Xóa bài viết',
			content: 'Bạn có chắc chắn muốn xóa bài viết này không?',
			okText: 'Xóa',
			cancelText: 'Hủy',
			okType: 'danger',
			centered: true,
			onOk: async () => {
				try {
					await deletePost(post.id)
					message.success('Đã xóa bài viết')
					if (expandedPostId === post.id) {
						setExpandedPostId(null)
						updateParams({ post: '' })
					}
					await loadPosts()
				} catch (error) {
					message.error(error.message || 'Không thể xóa bài viết')
				}
			},
		})
	}

	const handlePickComposerImage = async (event) => {
		const file = event.target.files?.[0]
		if (!file) return

		setComposerImageFile(file)
		try {
			const preview = await toDataUrl(file)
			setComposerImagePreview(preview)
		} catch (error) {
			message.error(error.message || 'Không thể đọc ảnh đã chọn')
		}

		event.target.value = ''
	}

	const handleToggleLike = async (post) => {
		setProcessingLikeId(post.id)
		try {
			const isLiking = !post.liked
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

			if (isLiking) {
				if (post.authorId && post.authorId !== currentUserId) {
					message.success(`Đã thích bài viết của ${post.author}`)
				} else {
					message.success('Đã thích bài viết')
				}
			}
		} catch (error) {
			message.error(error.message || 'Không thể cập nhật lượt thích')
		} finally {
			setProcessingLikeId(null)
		}
	}

	const loadCommentsForPost = async (postId) => {
		setLoadingCommentsByPost((prev) => ({
			...prev,
			[postId]: true,
		}))

		try {
			const comments = await getCommentsByPostId(postId, { limit: 1000 })
			const topComments = Array.isArray(comments) ? comments : []

			const commentThreads = await Promise.all(
				topComments.map(async (comment) => {
					let replies = []
					if (Number(comment.replyCount || 0) > 0) {
						const fetchedReplies = await getReplies({ parentId: comment.id, limit: 1000 })
						if (Array.isArray(fetchedReplies) && fetchedReplies.length > 0) {
							replies = fetchedReplies.map(mapCommentToUi)
						}
					}

					return {
						main: mapCommentToUi(comment),
						replies,
					}
				}),
			)

			setCommentsByPost((prev) => ({
				...prev,
				[postId]: commentThreads,
			}))
		} catch (error) {
			message.error(error.message || 'Không thể tải bình luận')
		} finally {
			setLoadingCommentsByPost((prev) => ({
				...prev,
				[postId]: false,
			}))
		}
	}

	const handleOpenComments = async (post) => {
		const isOpening = expandedPostId !== post.id
		if (!isOpening) {
			setExpandedPostId(null)
			setReplyingComment(null)
			updateParams({ post: '' })
			return
		}

		setExpandedPostId(post.id)
		setReplyingComment(null)
		updateParams({ post: post.id })

		if (!commentsByPost[post.id]) {
			await loadCommentsForPost(post.id)
		}
	}

	const handlePickCommentImage = async (event) => {
		const file = event.target.files?.[0]
		if (!file) return

		setCommentImageFile(file)
		try {
			setCommentImagePreview(await toDataUrl(file))
		} catch (error) {
			message.error(error.message || 'Không thể đọc ảnh đã chọn')
		}

		event.target.value = ''
	}

	const handlePickReplyImage = async (event) => {
		const file = event.target.files?.[0]
		if (!file) return

		setReplyImageFile(file)
		try {
			setReplyImagePreview(await toDataUrl(file))
		} catch (error) {
			message.error(error.message || 'Không thể đọc ảnh đã chọn')
		}

		event.target.value = ''
	}

	const handleCreateComment = async (postId) => {
		if (!commentText.trim() && !commentImageFile) {
			message.warning('Vui lòng nhập bình luận hoặc chọn ảnh')
			return
		}

		try {
			setSubmittingComment(true)
			const imageUrl = commentImageFile ? await uploadImage(commentImageFile) : null
			const createdComment = await createComment({
				postId,
				parentId: null,
				content: attachCommentToContent(commentText, imageUrl),
			})

			message.success('Bình luận thành công')
			const mappedComment = mapCommentToUi(createdComment)
			setCommentsByPost((prev) => ({
				...prev,
				[postId]: [
					{
						main: mappedComment,
						replies: [],
					},
					...(prev[postId] || []),
				],
			}))

			setCommentText('')
			setCommentImageFile(null)
			setCommentImagePreview('')
			setApiPosts((prev) =>
				prev.map((item) =>
					item.id === postId
						? {
								...item,
								comments: item.comments + 1,
						  }
						: item,
				),
			)
		} catch (error) {
			message.error(error.message || 'Không thể tạo bình luận')
		} finally {
			setSubmittingComment(false)
		}
	}

	const handleReplyComment = async () => {
		if (!replyingComment?.postId || !replyingComment?.parentId) return

		if (!replyText.trim() && !replyImageFile) {
			message.warning('Vui lòng nhập reply hoặc chọn ảnh')
			return
		}

		try {
			setSubmittingReply(true)
			const imageUrl = replyImageFile ? await uploadImage(replyImageFile) : null
			const createdReply = await createComment({
				postId: replyingComment.postId,
				parentId: replyingComment.parentId,
				content: attachCommentToContent(replyText, imageUrl),
				
			})

			const mappedReply = mapCommentToUi(createdReply)
			setCommentsByPost((prev) => ({
				...prev,
				[replyingComment.postId]: (prev[replyingComment.postId] || []).map((item) =>
					item.main.id === replyingComment.parentId
						? {
								...item,
								replies: [mappedReply, ...(item.replies || [])]
						  }
						: item,
				),
			}))

			setReplyingComment(null)
			setReplyText('')
			setReplyImageFile(null)
			setReplyImagePreview('')
			setApiPosts((prev) =>
				prev.map((item) =>
					item.id === createdReply.postId
						? {
								...item,
								comments: item.comments + 1,
						  }
						: item,
				),
			)
			message.success('Reply thành công')
		} catch (error) {
			message.error(error.message || 'Không thể reply bình luận')
		} finally {
			setSubmittingReply(false)
		}
	}

	const sourcePosts = apiPosts

	useEffect(() => {
		if (menuPostId === null) return undefined

		const closeMenu = () => setMenuPostId(null)
		window.addEventListener('click', closeMenu)

		return () => window.removeEventListener('click', closeMenu)
	}, [menuPostId])

	const visiblePosts = sourcePosts.filter((post) => {
		if (activeTab === 'all') return true
		return post.tagType === activeTab
	})

	return (
		<div className={styles.pageRoot}>
			<Header />

			<main className={styles.pageWrap}>
				<section className={styles.leftColumn}>
					{/* <div className={styles.composeCard}>
						<div className={styles.composeTop}>
							<img src={composerAvatar} alt="avatar" className={styles.composeAvatar} />
							<textarea
								ref={composerRef}
								className={styles.composeInput}
								placeholder="Bạn muốn chia sẻ điều gì về thú cưng hôm nay?"
								readOnly
								onClick={() => {
									setIsComposerModalOpen(true)
									updateParams({ composer: 'open' })
								}}
							/>
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
					</div> */}
					<div className={styles.headerPage}>
						<div className={styles.composeCard}>
						<div className={styles.composeTop}>
							<img src={composerAvatar} alt="avatar" className={styles.composeAvatar} />
							<textarea
								ref={composerRef}
								className={styles.composeInput}
								placeholder="Bạn muốn chia sẻ điều gì về thú cưng hôm nay?"
								readOnly
								onClick={() => {
									setIsComposerModalOpen(true)
									updateParams({ composer: 'open' })
								}}
							/>
						</div>
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
						{loadingPosts ? <p className={styles.loadingText}>Đang tải bài viết...</p> : null}
						{visiblePosts.map((post) => (
							<article
								key={post.id}
								className={`${styles.postCard} ${selectedPost === post.id ? styles.selectedPost : ''}`}
							>
								<header className={styles.postHeader}>
									<div className={styles.postAuthorWrap}> 
										{post.avatarText ? (
											
											<span className={styles.avatarText}>{post.avatarText} </span>
										) : (
											<img src={post.avatar} alt={post.author} className={styles.postAvatar} />
										)}

										<div>
											<div className={styles.postNameRow}>
												<h3 style={{fontSize: 15}}>{post.author}</h3>
												{post.title ? <span className={styles.postTitleInline}>{post.title}</span> : null}
												<p>{post.time}</p>
											</div>
												<span className={`${styles.postTag} ${styles[post.tagType]}`}>{post.tag}</span>
										</div>
									</div>

									<div className={styles.postMenuWrap}>
										<button
											type="button"
											className={styles.moreButton}
											onClick={(event) => {
												event.stopPropagation()
												setMenuPostId((prev) => (prev === post.id ? null : post.id))
											}}
										>
											<FaEllipsis />
										</button>

										{menuPostId === post.id ? (
											<div className={styles.postMenu} onClick={(event) => event.stopPropagation()}>
												<button type="button" className={styles.postMenuItem} onClick={() => handleStartEditPost(post)}>
													Chỉnh sửa
												</button>
												<button
													type="button"
													className={`${styles.postMenuItem} ${styles.postMenuDanger}`}
													onClick={() => handleDeletePost(post)}
												>
													Xóa
												</button>
											</div>
										) : null}
									</div>
								</header>

								{post.content ? <p className={styles.postContent}>{post.content}</p> : null}

								{post.image ? (
									<div className={styles.postImageFrame} onClick={() => handleOpenComments(post)}>
										<img
											src={post.image}
											alt="Bài viết"
											className={styles.postImage}
										/>
									</div>
								) : null}

								{typeof post.likes === 'number' && typeof post.comments === 'number' ? (
									<footer className={styles.postFooter}>
										<button
											type="button"
											onClick={() => handleToggleLike(post)}
											disabled={processingLikeId === post.id}
											className={post.liked ? styles.likedBtn : ''}
										>
											<FaRegThumbsUp /> {post.likes}
										</button>
										<button type="button" onClick={() => handleOpenComments(post)}>
											<FaRegComment /> {post.comments}
										</button>
										{/* <button type="button" className={styles.shareBtn} onClick={() => handleOpenComments(post)}>
											<FaShareNodes />
										</button> */}
									</footer>
								) : null}

								{expandedPostId === post.id ? (
									<section className={styles.commentSection}>
										<div className={styles.commentComposer}>
											<img src={composerAvatar} alt="avatar" className={styles.commentAvatar} />
											<div className={styles.commentFormWrap}>
												<textarea
													value={commentText}
													onChange={(event) => setCommentText(event.target.value)}
													placeholder="Viết bình luận..."
													className={styles.commentInput}
												/>
												{commentImagePreview ? (
													<div className={styles.previewImageWrap}>
														<img src={commentImagePreview} alt="preview" className={styles.previewImage} />
														<button
															type="button"
															onClick={() => {
																setCommentImageFile(null)
																setCommentImagePreview('')
															}}
															className={styles.removeImageBtn}
														>
															Gỡ ảnh
														</button>
													</div>
												) : null}
												<div className={styles.commentActionRow}>
													<input
														ref={commentImageInputRef}
														type="file"
														accept="image/*"
														onChange={handlePickCommentImage}
														hidden
													/>
													<button type="button" onClick={() => commentImageInputRef.current?.click()}>
														<FaImage /> Ảnh
													</button>
													<button
														type="button"
														onClick={() => handleCreateComment(post.id)}
														disabled={submittingComment}
													>
														{submittingComment ? 'Đang gửi...' : 'Gửi'}
													</button>
												</div>
											</div>
										</div>

										{loadingCommentsByPost[post.id] ? <p className={styles.loadingText}>Đang tải bình luận...</p> : null}

										<div className={styles.commentList}>
										{(commentsByPost[post.id] || []).map((thread) => (
											<div key={thread.main.id} className={styles.threadBlock}>
												
												<div className={styles.mainCommentBlock}>
													<img
														src={thread.main.user.avatarUrl}
														alt={thread.main.user.fullName}
														className={styles.commentAvatar}
													/>

													<div className={styles.commentBubbleWrap}>
														<div className={styles.commentBubble}>
															<strong>{thread.main.user.fullName}</strong>
															{thread.main.content ? <p>{thread.main.content}</p> : null}
															{thread.main.image ? (
																<img src={thread.main.image} alt="comment" className={styles.commentImage} />
															) : null}
														</div>

														<div className={styles.commentMeta}>
															<span>{thread.main.time}</span>

															<button
																type="button"
																onClick={() => {
																	setReplyingComment({
																		postId: post.id,
																		parentId: thread.main.id,
																		toUser: thread.main.user.fullName,
																	})
																	setReplyText(`@${thread.main.user.fullName} `)
																	setReplyImageFile(null)
																	setReplyImagePreview('')
																}}
															>
																Reply
															</button>
														</div>

														{replyingComment?.parentId === thread.main.id && (
															<div className={styles.replyComposer}>
																<p>Đang reply cho {thread.main.user.fullName}</p>

																<textarea
																	value={replyText}
																	onChange={(e) => setReplyText(e.target.value)}
																	placeholder="Viết reply..."
																	className={styles.commentInput}
																/>

																{replyImagePreview && (
																	<div className={styles.previewImageWrap}>
																		<img
																			src={replyImagePreview}
																			alt="reply preview"
																			className={styles.previewImage}
																		/>

																		<button
																			type="button"
																			onClick={() => {
																				setReplyImageFile(null)
																				setReplyImagePreview('')
																			}}
																			className={styles.removeImageBtn}
																		>
																			Gỡ ảnh
																		</button>
																	</div>
																)}

																<div className={styles.commentActionRow}>
																	<input
																		ref={replyImageInputRef}
																		type="file"
																		accept="image/*"
																		onChange={handlePickReplyImage}
																		hidden
																	/>

																	<button
																		type="button"
																		onClick={() => replyImageInputRef.current?.click()}
																	>
																		<FaImage /> Ảnh
																	</button>

																	<button
																		type="button"
																		onClick={handleReplyComment}
																		disabled={submittingReply}
																	>
																		{submittingReply ? 'Đang gửi...' : 'Gửi reply'}
																	</button>

																	<button
																		type="button"
																		onClick={() => {
																			setReplyingComment(null)
																			setReplyText('')
																			setReplyImageFile(null)
																			setReplyImagePreview('')
																		}}
																	>
																		Hủy
																	</button>
																</div>
															</div>
														)}
													</div>
												</div>

												{(thread.replies || []).map((reply) => (
													<div key={reply.id} className={styles.replyCommentBlock}>
														<img
															src={reply.user.avatarUrl}
															alt={reply.user.fullName}
															className={styles.commentAvatar}
														/>

														<div className={styles.commentBubbleWrap}>
															<div className={styles.replyBubble}>
																<strong>{reply.user.fullName}</strong>
																{reply.content ? <p>{reply.content}</p> : null}
																{reply.image ? (
																	<img src={reply.image} alt="reply" className={styles.commentImage} />
																) : null}
															</div>

															<div className={styles.commentMeta}>
																<span>{reply.time}</span>
															</div>
														</div>
													</div>
												))}
											</div>
										))}
										</div>

										{replyingComment?.postId === post.id ? (
											<div className={styles.replyComposer}>
												<p>Đang reply cho {replyingComment.toUser}</p>
												<textarea
													value={replyText}
													onChange={(event) => setReplyText(event.target.value)}
													placeholder="Viết reply..."
													className={styles.commentInput}
												/>
												{replyImagePreview ? (
													<div className={styles.previewImageWrap}>
														<img src={replyImagePreview} alt="reply preview" className={styles.previewImage} />
														<button
															type="button"
															onClick={() => {
																setReplyImageFile(null)
																setReplyImagePreview('')
															}}
															className={styles.removeImageBtn}
														>
															Gỡ ảnh
														</button>
													</div>
												) : null}
												<div className={styles.commentActionRow}>
													<input
														ref={replyImageInputRef}
														type="file"
														accept="image/*"
														onChange={handlePickReplyImage}
														hidden
													/>
													<button type="button" onClick={() => replyImageInputRef.current?.click()}>
														<FaImage /> Ảnh
													</button>
													<button type="button" onClick={handleReplyComment} disabled={submittingReply}>
														{submittingReply ? 'Đang gửi...' : 'Gửi reply'}
													</button>
													<button
														type="button"
														onClick={() => {
															setReplyingComment(null)
															setReplyText('')
															setReplyImageFile(null)
															setReplyImagePreview('')
														}}
													>
														Hủy
													</button>
												</div>
											</div>
										) : null}
									</section>
								) : null}
							</article>
						))}
					</div>
				</section>

				<aside className={styles.rightColumn}>
					<div className={styles.rightColumnSticky}>
						<section className={styles.sideCard}>
							<header className={styles.sideTitle}>
								<h2 style={{fontSize: 16}}>Người đóng góp hàng đầu</h2>
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
											<strong style={{fontSize: 15, fontWeight: 'bold'}}>{item.name}</strong>
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
								<h2 style={{fontSize: 16}}>Bài viết nổi bật</h2>
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
										<strong style={{fontSize: 15, fontWeight: 'bold'}}>{item.title}</strong>
										<small>{item.meta}</small>
									</button>
								))}
							</div>
						</section>
					</div>
				</aside>
			</main>

			{isComposerModalOpen ? (
				<div className={styles.composerModalOverlay} onClick={() => setIsComposerModalOpen(false)}>
					<div className={styles.composerModal} onClick={(event) => event.stopPropagation()}>
						<h3>Tạo bài viết mới</h3>
						<p style={{marginLeft: 3, fontWeight: 'bold'}}>Tiêu đề bài viết</p>
						<select
							value={composerTopicId}
							onChange={(event) => setComposerTopicId(event.target.value)}
							className={styles.topicSelect}
						>
							{apiTopics.map((topic) => (
								<option key={topic.id} value={topic.id}>
									{topic.name}
								</option>
							))}
						</select>

						<textarea
							value={composerText}
							onChange={(event) => setComposerText(event.target.value)}
							className={styles.composerModalInput}
							placeholder="Bạn muốn chia sẻ điều gì về thú cưng hôm nay?"
						/>

						{composerImagePreview ? (
							<div className={styles.previewImageWrap}>
								<img src={composerImagePreview} alt="post preview" className={styles.previewImage} />
								<button
									type="button"
									onClick={() => {
										setComposerImageFile(null)
										setComposerImagePreview('')
									}}
									className={styles.removeImageBtn}
								>
									Gỡ ảnh
								</button>
							</div>
						) : null}

						<div className={styles.modalActionRow}>
							<input
								ref={postImageInputRef}
								type="file"
								accept="image/*"
								onChange={handlePickComposerImage}
								hidden
							/>
							<button type="button" onClick={() => postImageInputRef.current?.click()}>
								<FaImage /> Chọn ảnh
							</button>
							<button type="button" onClick={handleCreatePost} disabled={submittingPost || loadingTopics}>
								{submittingPost ? 'Đang đăng...' : 'Đăng bài'}
							</button>
							<button
								type="button"
								onClick={() => {
									setIsComposerModalOpen(false)
									updateParams({ composer: '' })
								}}
							>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}

			{editingPost ? (
				<div className={styles.composerModalOverlay} onClick={closeEditModal}>
					<div className={styles.composerModal} onClick={(event) => event.stopPropagation()}>
						<h3>Chỉnh sửa bài viết</h3>
						<p style={{marginLeft: 3, fontWeight: 'bold'}}>Chủ đề</p>
						<select
							value={editingPost.topicId}
							onChange={(event) =>
								setEditingPost((prev) => (prev ? { ...prev, topicId: event.target.value } : prev))
							}
							className={styles.topicSelect}
						>
							{apiTopics.map((topic) => (
								<option key={topic.id} value={topic.id}>
									{topic.name}
								</option>
							))}
						</select>

						<textarea
							value={editingPost.text}
							onChange={(event) =>
								setEditingPost((prev) => (prev ? { ...prev, text: event.target.value } : prev))
							}
							className={styles.composerModalInput}
							placeholder="Bạn muốn chỉnh sửa điều gì trong bài viết?"
						/>

						{editingPost.imagePreview ? (
							<div className={styles.previewImageWrap}>
								<img src={editingPost.imagePreview} alt="edit post preview" className={styles.previewImage} />
								<button
									type="button"
									onClick={() =>
										setEditingPost((prev) =>
											prev
												? {
														...prev,
														imageFile: null,
														imagePreview: '',
														existingImageUrl: '',
												  }
												: prev,
										)
									}
									className={styles.removeImageBtn}
								>
									Gỡ ảnh
								</button>
							</div>
						) : null}

						<div className={styles.modalActionRow}>
							<input
								ref={postImageInputRef}
								type="file"
								accept="image/*"
								onChange={handlePickEditImage}
								hidden
							/>
							<button type="button" onClick={() => postImageInputRef.current?.click()}>
								<FaImage /> Chọn ảnh khác
							</button>
							<button type="button" onClick={handleSaveEditedPost} disabled={submittingEditPost || loadingTopics}>
								{submittingEditPost ? 'Đang lưu...' : 'Lưu chỉnh sửa'}
							</button>
							<button type="button" onClick={closeEditModal}>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	)
}

export default Forum
