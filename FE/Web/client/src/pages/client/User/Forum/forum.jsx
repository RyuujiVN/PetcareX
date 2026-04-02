import {
	FaEllipsis,
	FaFilter,
	FaImage,
	FaRegComment,
	FaRegThumbsUp,
} from 'react-icons/fa6'
import { Dropdown, message, Modal, Select } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createComment, getReplies } from '../../../../data/client/api/commentApi'
import { CLIENT_AUTH_STORAGE } from '../../../../constants/authStorage'
import { uploadUserImagesApi, uploadUserImageApi } from '../../../../data/client/api/user'
import {
	createPost,
	deletePost,
	getCommentsByPostId,
	getPosts,
	likePost,
	unlikePost,
	updatePost,
} from '../../../../data/client/api/postApi'
import { getAllTopics } from '../../../../data/client/api/topicApi'
import styles from './forum.module.css'

const DEFAULT_COMPOSER_AVATAR = '/avatarMain.png'
const IMAGE_TOKEN_REGEX = /\[\[img:(.*?)\]\]/g
const TITLE_TOKEN_REGEX = /^\s*\[\[title:(.*?)\]\]\s*/i
const NO_TOPIC_VALUE = 'no-topic'
const NO_TOPIC_FILTER_VALUE = 'none'
const FEATURED_POST_LIMIT = 3
const MAX_POST_IMAGES = 10

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

const getTopicDisplayName = (topic = {}) => topic?.nameVn || topic?.nameEng || topic?.name || ''

const getPostEngagementScore = (post = {}) => Number(post.likes || 0) + Number(post.comments || 0)

const extractMediaFromContent = (rawContent = '') => {
	const matches = [...rawContent.matchAll(IMAGE_TOKEN_REGEX)]
	const images = matches
		.map((match) => match?.[1]?.trim())
		.filter((url) => Boolean(url))
	const firstImage = images[0] || null
	const withoutImageToken = rawContent.replace(IMAGE_TOKEN_REGEX, '').trim()
	const titleMatch = withoutImageToken.match(TITLE_TOKEN_REGEX)
	const title = titleMatch?.[1]?.trim() || ''
	const cleanContent = withoutImageToken.replace(TITLE_TOKEN_REGEX, '').trim()

	return {
		title,
		text: cleanContent,
		image: firstImage,
		images,
	}
}

const attachPostToContent = ({ title, text, imageUrls = [] }) => {
	const normalizedTitle = title?.trim()
	const normalizedText = text.trim() || 'Hình ảnh'
	const lines = []

	if (normalizedTitle) {
		lines.push(`[[title:${normalizedTitle}]]`)
	}

	lines.push(normalizedText)

	imageUrls.filter(Boolean).forEach((imageUrl) => {
		lines.push(`[[img:${imageUrl}]]`)
	})

	if (lines.length === 0) {
		lines.push('Hình ảnh')
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
	const topicName = getTopicDisplayName(post.topic)

	return {
		id: post.id,
		authorId: post.author?.id,
		author: post.author?.fullName || 'Người dùng',
		title: media.title,
		content: media.text,
		image: media.image,
		images: media.images,
		time: formatTimeAgo(post.createdAt),
		tag: (topicName || 'Bài viết').toUpperCase(),
		tagType: normalizeTagType(topicName),
		likes: Number(post.likeCount || 0),
		comments: Number(post.commentCount || 0),
		createdAt: post.createdAt,
		avatar: post.author?.avatarUrl || DEFAULT_COMPOSER_AVATAR,
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
	const [composerTopicId, setComposerTopicId] = useState(NO_TOPIC_VALUE)
	const [composerImageFiles, setComposerImageFiles] = useState([])
	const [composerImagePreviews, setComposerImagePreviews] = useState([])
	const [uploadingComposerImage, setUploadingComposerImage] = useState(false)
	const [submittingPost, setSubmittingPost] = useState(false)
	const [editingPost, setEditingPost] = useState(null)
	const [uploadingEditImage, setUploadingEditImage] = useState(false)
	const [submittingEditPost, setSubmittingEditPost] = useState(false)
	const [menuPostId, setMenuPostId] = useState(null)
	const [expandedPostId, setExpandedPostId] = useState(null)
	const [commentsByPost, setCommentsByPost] = useState({})
	const [loadingCommentsByPost, setLoadingCommentsByPost] = useState({})
	const [commentText, setCommentText] = useState('')
	const [commentImageFile, setCommentImageFile] = useState(null)
	const [commentImagePreview, setCommentImagePreview] = useState('')
	const [commentImageUrl, setCommentImageUrl] = useState('')
	const [uploadingCommentImage, setUploadingCommentImage] = useState(false)
	const [submittingComment, setSubmittingComment] = useState(false)
	const [replyingComment, setReplyingComment] = useState(null)
	const [replyText, setReplyText] = useState('')
	const [replyImageFile, setReplyImageFile] = useState(null)
	const [replyImagePreview, setReplyImagePreview] = useState('')
	const [replyImageUrl, setReplyImageUrl] = useState('')
	const [uploadingReplyImage, setUploadingReplyImage] = useState(false)
	const [submittingReply, setSubmittingReply] = useState(false)
	const [selectedTopicFilter, setSelectedTopicFilter] = useState('all')
	const [previewImageSrc, setPreviewImageSrc] = useState('')
	const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)

	const filteredTopics = useMemo(() => {
		const mapped = apiTopics
			.map((topic) => ({
				id: String(topic.id),
				label: getTopicDisplayName(topic),
			}))
			.filter((item) => item.id && item.label)

		const unique = mapped.filter((item, index, arr) => arr.findIndex((value) => value.id === item.id) === index)

		return unique
	}, [apiTopics])

	const topicFilterOptions = useMemo(
		() => [
			{ label: 'Tất cả chủ đề', value: 'all' },
			{ label: 'Không chủ đề', value: NO_TOPIC_FILTER_VALUE },
			...filteredTopics.map((topic) => ({
				label: topic.label,
				value: topic.id,
			})),
		],
		[filteredTopics],
	)

	const topicSelectOptions = useMemo(
		() => [
			{ value: NO_TOPIC_VALUE, label: 'Không chọn chủ đề' },
			...apiTopics
				.filter((topic) => topic.id && getTopicDisplayName(topic))
				.map((topic) => ({
					value: String(topic.id),
					label: getTopicDisplayName(topic),
				})),
		],
		[apiTopics],
	)

	const topicDropdownItems = useMemo(
		() =>
			topicFilterOptions.map((item) => ({
				key: String(item.value),
				label: item.label,
			})),
		[topicFilterOptions],
	)

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
		.slice(0, 3)
		.map((item, index) => ({
			...item,
			score: `${item.count} Bài viết`,
			rank: `#${index + 1}`,
		}))
}, [apiPosts])

	const featuredPostIds = useMemo(() => {
		return new Set(
			[...apiPosts]
				.sort((a, b) => {
					const scoreDiff = getPostEngagementScore(b) - getPostEngagementScore(a)
					if (scoreDiff !== 0) return scoreDiff

					const dateDiff = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
					if (!Number.isNaN(dateDiff) && dateDiff !== 0) return dateDiff

					return Number(b.id || 0) - Number(a.id || 0)
				})
				.slice(0, FEATURED_POST_LIMIT)
				.map((post) => post.id),
		)
	}, [apiPosts])


	const selectedPost = searchParams.get('post')
	const isAnyOverlayOpen = Boolean(editingPost)

	const closeComposerModal = () => {
		setIsComposerModalOpen(false)
	}

	useEffect(() => {
		if (!isAnyOverlayOpen) return undefined

		const { body, documentElement } = document
		const previousOverflow = body.style.overflow
		const previousPaddingRight = body.style.paddingRight
		const scrollbarWidth = window.innerWidth - documentElement.clientWidth

		body.style.overflow = 'hidden'
		if (scrollbarWidth > 0) {
			body.style.paddingRight = `${scrollbarWidth}px`
		}

		return () => {
			body.style.overflow = previousOverflow
			body.style.paddingRight = previousPaddingRight
		}
	}, [isAnyOverlayOpen])

	useEffect(() => {
		try {
			const raw = localStorage.getItem(CLIENT_AUTH_STORAGE.userInfoKey)
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

	const updateParams = (nextValues, options = {}) => {
		const next = new URLSearchParams(searchParams)
		Object.entries(nextValues).forEach(([key, value]) => {
			if (!value) {
				next.delete(key)
			} else {
				next.set(key, value)
			}
		})
		const query = next.toString()
		navigate(query ? `/forum?${query}` : '/forum', { replace: Boolean(options.replace) })
	}

	const handleCreatePost = async () => {
		if (uploadingComposerImage) {
			message.warning('Ảnh đang được tải lên, vui lòng đợi')
			return
		}

		if (!composerTitle.trim() && !composerText.trim() && composerImageFiles.length === 0) {
			message.warning('Vui lòng nhập nội dung hoặc chọn ảnh trước khi đăng')
			return
		}

		try {
			setSubmittingPost(true)
			let imageUrls = []

			if (composerImageFiles.length > 0) {
				setUploadingComposerImage(true)
				imageUrls = await uploadUserImagesApi(composerImageFiles)
			}

			await createPost({
				topicId: composerTopicId === NO_TOPIC_VALUE ? null : composerTopicId,
				content: attachPostToContent({
					title: composerTitle,
					text: composerText,
					imageUrls,
				}),
			})
			message.success('Đăng bài thành công')
			setComposerText('')
			setComposerTitle('')
			setComposerTopicId(NO_TOPIC_VALUE)
			setComposerImageFiles([])
			setComposerImagePreviews([])
			setIsComposerModalOpen(false)
			await loadPosts()
		} catch (error) {
			message.error(error.message || 'Đăng bài thất bại')
		} finally {
			setUploadingComposerImage(false)
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
			topicId: post.rawTopicId ? String(post.rawTopicId) : NO_TOPIC_VALUE,
			imageFile: null,
			imagePreview: post.image || '',
			imageUrl: post.image || '',
			existingImageUrl: post.image || '',
		})
	}

	const handlePickEditImage = async (event) => {
		const file = event.target.files?.[0]
		if (!file) return

		setUploadingEditImage(true)

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

			const uploadedUrl = await uploadImage(file)
			setEditingPost((prev) =>
				prev
					? {
							...prev,
							imageUrl: uploadedUrl,
					  }
					: prev,
			)
			message.success('Tải ảnh bài viết thành công')
		} catch (error) {
			setEditingPost((prev) =>
				prev
					? {
							...prev,
							imageFile: null,
							imagePreview: prev.existingImageUrl || '',
							imageUrl: prev.existingImageUrl || '',
					  }
					: prev,
			)
			message.error(error.message || 'Không thể đọc ảnh đã chọn')
		} finally {
			setUploadingEditImage(false)
		}

		event.target.value = ''
	}

	const handleSaveEditedPost = async () => {
		if (!editingPost) return

		if (uploadingEditImage) {
			message.warning('Ảnh đang được tải lên, vui lòng đợi')
			return
		}

		if (!editingPost.title.trim() && !editingPost.text.trim() && !editingPost.imagePreview) {
			message.warning('Bài viết không được để trống hoàn toàn')
			return
		}

		try {
			setSubmittingEditPost(true)
			const imageUrl = editingPost.imageUrl || null

			await updatePost(editingPost.id, {
				topicId: editingPost.topicId === NO_TOPIC_VALUE ? null : editingPost.topicId,
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
		const selectedFiles = Array.from(event.target.files || []).filter(Boolean)
		if (selectedFiles.length === 0) return

		const remainingSlots = MAX_POST_IMAGES - composerImageFiles.length
		if (remainingSlots <= 0) {
			message.warning(`Bạn chỉ có thể chọn tối đa ${MAX_POST_IMAGES} ảnh`)
			event.target.value = ''
			return
		}

		const acceptedFiles = selectedFiles.slice(0, remainingSlots)
		if (acceptedFiles.length < selectedFiles.length) {
			message.warning(`Chỉ nhận tối đa ${MAX_POST_IMAGES} ảnh cho mỗi bài viết`)
		}

		try {
			const previews = await Promise.all(acceptedFiles.map((file) => toDataUrl(file)))
			setComposerImageFiles((prev) => [...prev, ...acceptedFiles])
			setComposerImagePreviews((prev) => [...prev, ...previews])
		} catch (error) {
			message.error(error.message || 'Không thể đọc ảnh đã chọn')
		}

		event.target.value = ''
	}

	const handleToggleLike = async (post) => {
		const nextLiked = !post.liked
		const nextLikes = Math.max(0, post.likes + (nextLiked ? 1 : -1))

		setApiPosts((prev) =>
			prev.map((item) =>
				item.id === post.id
					? {
							...item,
							likes: nextLikes,
							liked: nextLiked,
					  }
					: item,
			),
		)

		setProcessingLikeId(post.id)
		try {
			const response = nextLiked ? await likePost(post.id) : await unlikePost(post.id)
			setApiPosts((prev) =>
				prev.map((item) =>
					item.id === post.id
						? {
								...item,
								likes: response?.likeCount ?? item.likes,
								liked: response?.liked ?? item.liked,
						  }
						: item,
				),
			)

			if (nextLiked) {
				if (post.authorId && post.authorId !== currentUserId) {
					message.success(`Đã thích bài viết của ${post.author}`)
				}
			}
		} catch (error) {
			setApiPosts((prev) =>
				prev.map((item) =>
					item.id === post.id
						? {
								...item,
								likes: post.likes,
								liked: post.liked,
						  }
						: item,
				),
			)
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
			setCommentText('')
			setCommentImageFile(null)
			setCommentImagePreview('')
			setCommentImageUrl('')
			setReplyImageUrl('')
			return
		}

		setExpandedPostId(post.id)
		setReplyingComment(null)
		setCommentText('')
		setCommentImageFile(null)
		setCommentImagePreview('')
		setCommentImageUrl('')
		setReplyImageUrl('')

		if (!commentsByPost[post.id]) {
			await loadCommentsForPost(post.id)
		}
	}

	const handlePreviewPostImage = (imageSrc) => {
		if (!imageSrc) return
		setPreviewImageSrc(imageSrc)
		setIsPreviewModalOpen(true)
	}

	const handlePickCommentImage = async (event) => {
		const file = event.target.files?.[0]
		if (!file) return

		setCommentImageFile(file)
		setUploadingCommentImage(true)
		try {
			setCommentImagePreview(await toDataUrl(file))
			const uploadedUrl = await uploadImage(file)
			setCommentImageUrl(uploadedUrl)
			message.success('Tải ảnh bình luận thành công')
		} catch (error) {
			setCommentImageFile(null)
			setCommentImagePreview('')
			setCommentImageUrl('')
			message.error(error.message || 'Không thể đọc ảnh đã chọn')
		} finally {
			setUploadingCommentImage(false)
		}

		event.target.value = ''
	}

	const handlePickReplyImage = async (event) => {
		const file = event.target.files?.[0]
		if (!file) return

		setReplyImageFile(file)
		setUploadingReplyImage(true)
		try {
			setReplyImagePreview(await toDataUrl(file))
			const uploadedUrl = await uploadImage(file)
			setReplyImageUrl(uploadedUrl)
			message.success('Tải ảnh phản hồi thành công')
		} catch (error) {
			setReplyImageFile(null)
			setReplyImagePreview('')
			setReplyImageUrl('')
			message.error(error.message || 'Không thể đọc ảnh đã chọn')
		} finally {
			setUploadingReplyImage(false)
		}

		event.target.value = ''
	}

	const handleCreateComment = async (postId) => {
		if (uploadingCommentImage) {
			message.warning('Ảnh bình luận đang được tải lên, vui lòng đợi')
			return
		}

		if (!commentText.trim() && !commentImageFile) {
			message.warning('Vui lòng nhập bình luận hoặc chọn ảnh')
			return
		}

		try {
			setSubmittingComment(true)
			const imageUrl = commentImageUrl || null
			const createdComment = await createComment({
				postId,
				parentId: null,
				content: attachCommentToContent(commentText, imageUrl),
			})
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
			setCommentImageUrl('')
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

		if (uploadingReplyImage) {
			message.warning('Ảnh phản hồi đang được tải lên, vui lòng đợi')
			return
		}

		if (!replyText.trim() && !replyImageFile) {
			message.warning('Vui lòng nhập reply hoặc chọn ảnh')
			return
		}

		try {
			setSubmittingReply(true)
			const imageUrl = replyImageUrl || null
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
			setReplyImageUrl('')
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

	const visiblePosts = useMemo(() => {
		const filtered = sourcePosts.filter((post) => {
			if (selectedTopicFilter === 'all') return true
			if (selectedTopicFilter === NO_TOPIC_FILTER_VALUE) return !post.rawTopicId
			return String(post.rawTopicId) === selectedTopicFilter
		})

		const prioritizedFeatured = [...filtered]
			.filter((post) => featuredPostIds.has(post.id))
			.sort((a, b) => {
				const scoreDiff = getPostEngagementScore(b) - getPostEngagementScore(a)
				if (scoreDiff !== 0) return scoreDiff

				const dateDiff = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
				if (!Number.isNaN(dateDiff) && dateDiff !== 0) return dateDiff

				return Number(b.id || 0) - Number(a.id || 0)
			})

		const normalPosts = [...filtered]
			.filter((post) => !featuredPostIds.has(post.id))
			.sort((a, b) => {
				const dateDiff = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
				if (!Number.isNaN(dateDiff) && dateDiff !== 0) return dateDiff

				return Number(b.id || 0) - Number(a.id || 0)
			})

		return [...prioritizedFeatured, ...normalPosts].map((post, index) => ({
			...post,
			isFeatured: index < FEATURED_POST_LIMIT && featuredPostIds.has(post.id),
		}))
	}, [sourcePosts, selectedTopicFilter, featuredPostIds])

	return (
		<div className={styles.pageRoot}>
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
								onClick={() => {
									if (isComposerModalOpen) return
									setIsComposerModalOpen(true)
								}}
							/>
							<div className={styles.composeActions}>
								<Dropdown
									trigger={['click']}
									placement="bottomRight"
									menu={{
										items: topicDropdownItems,
										selectable: true,
										selectedKeys: [selectedTopicFilter],
										onClick: ({ key }) => setSelectedTopicFilter(String(key)),
									}}
								>
									<button
										type="button"
										className={styles.topicFilterIconBtn}
										title="Chọn chủ đề"
									>
										Chủ đề <FaFilter style={{ marginLeft: 6 }} />
									</button>
								</Dropdown>
							</div>
						</div>
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
													<div className={styles.postTagRow}>
														<span className={`${styles.postTag} ${styles[post.tagType]}`}>{post.tag}</span>
														{post.isFeatured ? <span className={styles.featuredBadge}>Nổi bật</span> : null}
													</div>
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

								{post.images?.length ? (
									<div className={styles.postImageGrid}>
										{post.images.map((imageUrl, index) => (
											<button
												key={`${post.id}-${imageUrl}-${index}`}
												type="button"
												className={styles.postImageFrame}
												onClick={(event) => {
													event.stopPropagation()
													handlePreviewPostImage(imageUrl)
												}}
											>
												<img
													src={imageUrl}
													alt={`Bài viết ${index + 1}`}
													className={styles.postImage}
													loading="lazy"
													decoding="async"
												/>
											</button>
										))}
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
																setCommentImageUrl('')
															}}
															className={styles.removeImageBtn}
															disabled={uploadingCommentImage}
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
															<button
																type="button"
																onClick={() => commentImageInputRef.current?.click()}
																disabled={uploadingCommentImage || submittingComment}
															>
														<FaImage /> Ảnh
													</button>
													<button
														type="button"
														onClick={() => handleCreateComment(post.id)}
																disabled={submittingComment || uploadingCommentImage}
													>
																{submittingComment ? 'Đang gửi...' : uploadingCommentImage ? 'Đang tải ảnh...' : 'Gửi'}
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
																	setReplyImageUrl('')
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
																				setReplyImageUrl('')
																			}}
																			className={styles.removeImageBtn}
																			disabled={uploadingReplyImage}
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
																		disabled={uploadingReplyImage || submittingReply}
																	>
																		<FaImage /> Ảnh
																	</button>

																	<button
																		type="button"
																		onClick={handleReplyComment}
																		disabled={submittingReply || uploadingReplyImage}
																	>
																		{submittingReply ? 'Đang gửi...' : uploadingReplyImage ? 'Đang tải ảnh...' : 'Gửi reply'}
																	</button>

																	<button
																		type="button"
																		onClick={() => {
																			setReplyingComment(null)
																			setReplyText('')
																			setReplyImageFile(null)
																			setReplyImagePreview('')
																			setReplyImageUrl('')
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
								<h2 style={{fontSize: 16, fontWeight: 'bold'}}>Người đóng góp hàng đầu</h2>
							</header>
							<div className={styles.rankList}>
								{topContributors.map((item) => (
									<button
										key={item.id}
										className={styles.rankItem}
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

							<button type="button" className={styles.sideAction} onClick={() => navigate('/user/profile')}>
								Xem tất cả bảng xếp hạng
							</button>
						</section>

					</div>
				</aside>
			</main>

			<div
				className={`${styles.composerModalOverlay} ${isComposerModalOpen ? styles.open : ''}`}
				onClick={closeComposerModal}
			>
				<div
					className={`${styles.composerModal} ${isComposerModalOpen ? styles.open : ''}`}
					onClick={(e) => e.stopPropagation()}
				>
					<h3 style={{textAlign: 'center'}}>Tạo bài viết mới</h3>
					<p style={{marginLeft: 3, fontWeight: 'bold'}}>Chủ đề bài viết</p>
					<Select
						value={composerTopicId || NO_TOPIC_VALUE}
						onChange={(value) => setComposerTopicId(value)}
						className={styles.topicSelectAntd}
						placeholder="Chọn chủ đề bài viết"
						options={topicSelectOptions}
					/>

					<textarea
						value={composerText}
						onChange={(event) => setComposerText(event.target.value)}
						className={styles.composerModalInput}
						placeholder="Bạn muốn chia sẻ điều gì về thú cưng hôm nay?"
					/>

					{composerImagePreviews.length > 0 ? (
						<div className={styles.previewImageWrap}>
							{composerImagePreviews.map((preview, index) => (
								<div key={`${preview}-${index}`} className={styles.previewImageItem}>
									<img src={preview} alt={`post preview ${index + 1}`} className={styles.previewImage} />
									<button
										type="button"
										onClick={() => {
											setComposerImageFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
											setComposerImagePreviews((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
										}}
										className={styles.removeImageBtn}
										disabled={uploadingComposerImage || submittingPost}
									>
										Gỡ ảnh
									</button>
								</div>
							))}
						</div>
					) : null}

					<div className={styles.modalActionRow}>
						<input
							ref={postImageInputRef}
							type="file"
							accept="image/*"
							multiple
							onChange={handlePickComposerImage}
							hidden
						/>
						<button
							type="button"
							onClick={() => postImageInputRef.current?.click()}
							disabled={uploadingComposerImage || submittingPost}
						>
							<FaImage /> Chọn ảnh
						</button>
						<button type="button" onClick={handleCreatePost} disabled={submittingPost || loadingTopics || uploadingComposerImage}>
							{submittingPost ? 'Đang đăng...' : uploadingComposerImage ? 'Đang tải ảnh...' : 'Đăng bài'}
						</button>
						<button
							type="button"
							onClick={closeComposerModal}
						>
							Hủy
						</button>
					</div>
				</div>
			</div>

			{editingPost ? (
				<div className={styles.composerModalOverlay} onClick={closeEditModal}>
					<div className={styles.composerModal} onClick={(event) => event.stopPropagation()}>
						<h3>Chỉnh sửa bài viết</h3>
						<p style={{marginLeft: 3, fontWeight: 'bold'}}>Chủ đề</p>
						<Select
							value={editingPost.topicId || NO_TOPIC_VALUE}
							onChange={(value) =>
								setEditingPost((prev) => (prev ? { ...prev, topicId: value } : prev))
							}
							className={styles.topicSelectAntd}
							placeholder="Chọn chủ đề"
							options={topicSelectOptions}
						/>

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
																	imageUrl: '',
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
							<button
								type="button"
								onClick={() => postImageInputRef.current?.click()}
								disabled={uploadingEditImage || submittingEditPost}
							>
								<FaImage /> Chọn ảnh khác
							</button>
							<button type="button" onClick={handleSaveEditedPost} disabled={submittingEditPost || loadingTopics || uploadingEditImage}>
								{submittingEditPost ? 'Đang lưu...' : uploadingEditImage ? 'Đang tải ảnh...' : 'Lưu chỉnh sửa'}
							</button>
							<button type="button" onClick={closeEditModal} disabled={uploadingEditImage || submittingEditPost}>
								Hủy
							</button>
						</div>
					</div>
				</div>
			) : null}

			<Modal
				open={isPreviewModalOpen}
				onCancel={() => {
					setIsPreviewModalOpen(false)
					setPreviewImageSrc('')
				}}
				footer={null}
				centered
				width={900}
			>
				<img src={previewImageSrc} alt="preview" className={styles.previewModalImage} />
			</Modal>
		</div>
	)
}

export default Forum
