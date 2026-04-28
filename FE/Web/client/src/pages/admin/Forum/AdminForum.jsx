import { FlagOutlined } from '@ant-design/icons'
import { Dropdown, message, Modal, Select } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	FaEllipsis,
	FaFilter,
	FaImage,
	FaMagnifyingGlass,
	FaRegComment,
	FaRegThumbsUp,
	FaThumbsUp,
} from 'react-icons/fa6'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import ScrollToTopButton from '../../../components/common/ScrollToTopButton/ScrollToTopButton'
import {
	ADMIN_AUTH_STORAGE,
	CLIENT_AUTH_STORAGE,
	getAdminAuthItem,
} from '../../../constants/authStorage'
import { RoleEnum } from '../../../enum/role.enum'
import { useAuth } from '../../../hooks/client/AuthContext'
import { getClientInstance } from '../../../services/apiClient'
import {
	createGenericReportApi,
	reportCommentApi,
	reportPostApi,
} from '../../../services/forumReportService'
import {
	adminDeleteCommentApi,
	adminDeletePostApi,
	createCommentApi,
	createPostApi,
	deleteCommentApi,
	deletePostApi,
	getAllTopicsApi,
	getCommentsByPostIdApi,
	getPostsApi,
	getRepliesApi,
	likePostApi,
	unlikePostApi,
	updateCommentApi,
	updatePostApi,
} from '../../../services/forumService'
import { uploadUserImageApi, uploadUserImagesApi } from '../../../services/userService'
import ForumSearchBar from '../../client/User/Forum/ForumSearchBar'
import styles from './AdminForum.module.css'

const DEFAULT_COMPOSER_AVATAR = '/avatarMain.png'
const IMAGE_TOKEN_REGEX = /\[\[img:(.*?)\]\]/g
const TITLE_TOKEN_REGEX = /^\s*\[\[title:(.*?)\]\]\s*/i
const NO_TOPIC_TOKEN = '[[no-topic:1]]'
const NO_TOPIC_VALUE = 'no-topic'
const NO_TOPIC_FILTER_VALUE = 'none'
const FEATURED_POST_LIMIT = 3
const MAX_POST_IMAGES = 10

const TOPIC_TRANSLATION_KEYS = {
	'cham soc thu cung hang ngay': 'pages.forum.topics.dailyCare',
	'tiem phong va phong benh': 'pages.forum.topics.vaccinationAndPrevention',
	'tu van trieu chung': 'pages.forum.topics.symptomConsulting',
	'hau phau va phuc hoi': 'pages.forum.topics.postOpRecovery',
	'dinh duong thu y': 'pages.forum.topics.veterinaryNutrition',
	'kinh nghiem phong kham': 'pages.forum.topics.clinicExperience',
}

const normalizeTopicNameKey = (value = '') =>
	String(value || '')
		.trim()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()

const translateTopicName = (topicName, t, language) => {
	if (!topicName || !language?.startsWith('en')) return topicName
	const topicKey = normalizeTopicNameKey(topicName)
	const translationKey = TOPIC_TRANSLATION_KEYS[topicKey]
	if (!translationKey) return topicName
	return t(translationKey, { defaultValue: topicName })
}

const formatTimeAgo = (dateValue, t) => {
	if (!dateValue) return t('pages.forum.justNow')

	const created = new Date(dateValue).getTime()
	if (Number.isNaN(created)) return t('pages.forum.justNow')

	const diff = Date.now() - created
	const minute = 60 * 1000
	const hour = 60 * minute
	const day = 24 * hour

	if (diff < minute) return t('pages.forum.justNow')
	if (diff < hour) return t('pages.forum.minutesAgo', { count: Math.floor(diff / minute) })
	if (diff < day) return t('pages.forum.hoursAgo', { count: Math.floor(diff / hour) })
	return t('pages.forum.daysAgo', { count: Math.floor(diff / day) })
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

const getTopicDisplayName = (topic = {}, { language, t } = {}) => {
	const preferred = language?.startsWith('en')
		? topic?.nameEng || topic?.nameVn || topic?.name || ''
		: topic?.nameVn || topic?.nameEng || topic?.name || ''

	return translateTopicName(preferred, t, language)
}

const getPostEngagementScore = (post = {}) => Number(post.likes || 0) + Number(post.comments || 0)

const extractMediaFromContent = (rawContent = '') => {
	const hasNoTopicToken = rawContent.includes(NO_TOPIC_TOKEN)
	const normalizedContent = hasNoTopicToken ? rawContent.split(NO_TOPIC_TOKEN).join('').trim() : rawContent.trim()
	const matches = [...rawContent.matchAll(IMAGE_TOKEN_REGEX)]
	const images = matches
		.map((match) => match?.[1]?.trim())
		.filter((url) => Boolean(url))
	const firstImage = images[0] || null
	const withoutImageToken = normalizedContent.replace(IMAGE_TOKEN_REGEX, '').trim()
	const titleMatch = withoutImageToken.match(TITLE_TOKEN_REGEX)
	const title = titleMatch?.[1]?.trim() || ''
	const cleanContent = withoutImageToken.replace(TITLE_TOKEN_REGEX, '').trim()

	return {
		title,
		text: cleanContent,
		image: firstImage,
		images,
		isNoTopic: hasNoTopicToken,
	}
}

const attachPostToContent = ({ title, text, imageUrls = [], isNoTopic = false, t }) => {
	const normalizedTitle = title?.trim()
	const normalizedText = text.trim() || t('pages.forum.imagePlaceholder')
	const lines = []

	if (isNoTopic) {
		lines.push(NO_TOPIC_TOKEN)
	}

	if (normalizedTitle) {
		lines.push(`[[title:${normalizedTitle}]]`)
	}

	lines.push(normalizedText)

	imageUrls.filter(Boolean).forEach((imageUrl) => {
		lines.push(`[[img:${imageUrl}]]`)
	})

	if (lines.length === 0) {
		lines.push(t('pages.forum.imagePlaceholder'))
	}

	return lines.join('\n')
}

const attachCommentToContent = (text, imageUrl, t) => {
	const normalizedText = text.trim() || t('pages.forum.imagePlaceholder')
	if (!imageUrl) return normalizedText

	return `${normalizedText}\n[[img:${imageUrl}]]`
}

const toDataUrl = (file) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(String(reader.result || ''))
		reader.onerror = () => reject(new Error('image-read-error'))
		reader.readAsDataURL(file)
	})

const mapCommentToUi = (comment, t) => {
	const media = extractMediaFromContent(comment.content || '')

	return {
		id: comment.id,
		postId: comment.postId,
		parentId: comment.parentId,
		content: media.text,
		image: media.image,
		replyCount: Number(comment.replyCount || 0),
		createdAt: comment.createdAt,
		time: formatTimeAgo(comment.createdAt, t),
		user: {
			id: comment.user?.id,
			fullName: comment.user?.fullName || t('header.user.defaultName'),
			avatarUrl: comment.user?.avatarUrl || DEFAULT_COMPOSER_AVATAR,
			role: comment.user?.role || null,
		},
	}
}

const mapPostToUi = (post, t, language) => {
	const media = extractMediaFromContent(post.content || '')
	const topicName = getTopicDisplayName(post.topic, { language, t })
	const tagTypeName = getTopicDisplayName(post.topic, { language: 'vi', t })
	const isNoTopic = media.isNoTopic || !post.topic?.id

	return {
		id: post.id,
		authorId: post.author?.id,
		author: post.author?.fullName || t('header.user.defaultName'),
		title: media.title,
		content: media.text,
		image: media.image,
		images: media.images,
		time: formatTimeAgo(post.createdAt, t),
		tag: isNoTopic ? t('pages.forum.postTagDefault').toUpperCase() : (topicName || t('pages.forum.postTagDefault')).toUpperCase(),
		tagType: isNoTopic ? 'no-topic' : normalizeTagType(tagTypeName),
		likes: Number(post.likeCount || 0),
		comments: Number(post.commentCount || 0),
		createdAt: post.createdAt,
		avatar: post.author?.avatarUrl || DEFAULT_COMPOSER_AVATAR,
		liked: Boolean(post.liked),
		rawTopicId: isNoTopic ? null : post.topic?.id,
		actualTopicId: post.topic?.id || null,
		noTopicSelected: isNoTopic,
	}
}

const removeCommentFromThreads = (threads = [], commentId) => {
	const normalizedCommentId = String(commentId || '')
	if (!normalizedCommentId) {
		return {
			nextThreads: threads,
			removedCount: 0,
		}
	}

	let removedCount = 0
	const nextThreads = []

	threads.forEach((thread) => {
		if (String(thread?.main?.id || '') === normalizedCommentId) {
			removedCount += 1 + Number(thread?.replies?.length || 0)
			return
		}

		const replies = Array.isArray(thread?.replies) ? thread.replies : []
		const filteredReplies = replies.filter((reply) => String(reply?.id || '') !== normalizedCommentId)

		if (filteredReplies.length !== replies.length) {
			removedCount += 1
			nextThreads.push({
				...thread,
				replies: filteredReplies,
			})
			return
		}

		nextThreads.push(thread)
	})

	return {
		nextThreads,
		removedCount,
	}
}

function Forum() {
	const { t, i18n } = useTranslation(['admin', 'client'])
	const { userProfile } = useAuth()
	const location = useLocation()
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const composerRef = useRef(null)
	const feedScrollRef = useRef(null)
	const feedSavedScrollTopRef = useRef(0)
	const postHighlightTimeoutRef = useRef(null)
	const commentHighlightTimeoutRef = useRef(null)
	const processedRealtimeLikeNotifRef = useRef(new Set())
	const postImageInputRef = useRef(null)
	const commentImageInputRef = useRef(null)
	const replyImageInputRef = useRef(null)
	const editCommentImageInputRef = useRef(null)
	const [apiPosts, setApiPosts] = useState([])
	const [apiTopics, setApiTopics] = useState([])
	const [loadingPosts, setLoadingPosts] = useState(true)
	const [loadingTopics, setLoadingTopics] = useState(false)
	const [processingLikeId, setProcessingLikeId] = useState(null)
	const [composerAvatar, setComposerAvatar] = useState(DEFAULT_COMPOSER_AVATAR)
	const [currentUserId, setCurrentUserId] = useState(null)
	const [currentUserRole, setCurrentUserRole] = useState(null)
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
	const [editingComment, setEditingComment] = useState(null)
	const [uploadingEditCommentImage, setUploadingEditCommentImage] = useState(false)
	const [submittingEditComment, setSubmittingEditComment] = useState(false)
	const [reportingPost, setReportingPost] = useState(null)
	const [postReportReason, setPostReportReason] = useState('')
	const [postReportDetail, setPostReportDetail] = useState('')
	const [submittingPostReport, setSubmittingPostReport] = useState(false)
	const [reportingComment, setReportingComment] = useState(null)
	const [reportReason, setReportReason] = useState('')
	const [submittingReport, setSubmittingReport] = useState(false)
	const [selectedTopicFilter, setSelectedTopicFilter] = useState('all')
	const [searchKeyword, setSearchKeyword] = useState('')
	const [previewImageSrc, setPreviewImageSrc] = useState('')
	const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
	const [highlightedPostId, setHighlightedPostId] = useState('')
	const [highlightedCommentId, setHighlightedCommentId] = useState('')

	const filteredTopics = useMemo(() => {
		const mapped = apiTopics
			.map((topic) => ({
				id: String(topic.id),
				label: getTopicDisplayName(topic, { language: i18n.language, t }),
			}))
			.filter((item) => item.id && item.label)

		const unique = mapped.filter((item, index, arr) => arr.findIndex((value) => value.id === item.id) === index)

		return unique
	}, [apiTopics, i18n.language, t])

	const topicFilterOptions = useMemo(
		() => [
			{ label: t('pages.forum.topicFilter.all'), value: 'all' },
			{ label: t('pages.forum.topicFilter.none'), value: NO_TOPIC_FILTER_VALUE },
			...filteredTopics.map((topic) => ({
				label: topic.label,
				value: topic.id,
			})),
		],
		[filteredTopics, t],
	)

	const topicSelectOptions = useMemo(
		() => [
			{ value: NO_TOPIC_VALUE, label: t('pages.forum.topicSelect.noTopic') },
			...apiTopics
				.filter((topic) => topic.id && getTopicDisplayName(topic, { language: i18n.language, t }))
				.map((topic) => ({
					value: String(topic.id),
					label: getTopicDisplayName(topic, { language: i18n.language, t }),
				})),
		],
		[apiTopics, i18n.language, t],
	)

	const fallbackTopicId = useMemo(() => {
		const firstAvailableTopic = apiTopics.find(
			(topic) => topic.id && getTopicDisplayName(topic, { language: i18n.language, t }),
		)
		return firstAvailableTopic ? String(firstAvailableTopic.id) : null
	}, [apiTopics, i18n.language, t])

	const topicDropdownItems = useMemo(
		() =>
			topicFilterOptions.map((item) => ({
				key: String(item.value),
				label: item.label,
			})),
		[topicFilterOptions],
	)

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


	const selectedPostIdFromQuery = String(searchParams.get('postId') || searchParams.get('post') || '').trim()
	const selectedCommentIdFromQuery = String(searchParams.get('commentId') || '').trim()
	const isAnyOverlayOpen = Boolean(editingPost || editingComment || reportingComment || reportingPost)
	const postReportReasonOptions = useMemo(
		() => [
			{ value: 'spam', label: t('pages.forum.reportReason.spam', { defaultValue: 'Spam' }) },
			{ value: 'inappropriate', label: t('pages.forum.reportReason.inappropriate', { defaultValue: 'Nội dung không phù hợp' }) },
			{ value: 'misleading', label: t('pages.forum.reportReason.misleading', { defaultValue: 'Thông tin sai lệch' }) },
			{ value: 'other', label: t('pages.forum.reportReason.other', { defaultValue: 'Khác' }) },
		],
		[t],
	)

	const scrollElementIntoFeed = useCallback((element) => {
		if (!element) return

		const container = feedScrollRef.current
		if (!container || !container.contains(element)) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center' })
			return
		}

		const containerRect = container.getBoundingClientRect()
		const elementRect = element.getBoundingClientRect()
		const top = elementRect.top - containerRect.top + container.scrollTop - 24
		container.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' })
	}, [])

	const flashPostHighlight = useCallback((postId) => {
		setHighlightedPostId(String(postId))
		if (postHighlightTimeoutRef.current) {
			window.clearTimeout(postHighlightTimeoutRef.current)
		}
		postHighlightTimeoutRef.current = window.setTimeout(() => {
			setHighlightedPostId((prev) => (prev === String(postId) ? '' : prev))
		}, 1500)
	}, [])

	const flashCommentHighlight = useCallback((commentId) => {
		setHighlightedCommentId(String(commentId))
		if (commentHighlightTimeoutRef.current) {
			window.clearTimeout(commentHighlightTimeoutRef.current)
		}
		commentHighlightTimeoutRef.current = window.setTimeout(() => {
			setHighlightedCommentId((prev) => (prev === String(commentId) ? '' : prev))
		}, 1500)
	}, [])

	const clearForumTargetParams = useCallback(() => {
		const next = new URLSearchParams(searchParams)
		next.delete('post')
		next.delete('postId')
		next.delete('commentId')
		setSearchParams(next, { replace: true })
	}, [searchParams, setSearchParams])

	useEffect(() => {
		return () => {
			if (postHighlightTimeoutRef.current) {
				window.clearTimeout(postHighlightTimeoutRef.current)
			}
			if (commentHighlightTimeoutRef.current) {
				window.clearTimeout(commentHighlightTimeoutRef.current)
			}
		}
	}, [])

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
			const rawClientProfile = localStorage.getItem(CLIENT_AUTH_STORAGE.userInfoKey)
			const rawAdminProfile = getAdminAuthItem(ADMIN_AUTH_STORAGE.userInfoKey)
			const raw = rawClientProfile || rawAdminProfile
			if (!raw) return

			const userInfo = JSON.parse(raw)
			if (userInfo?.id) {
				setCurrentUserId(userInfo.id)
			}
			if (userInfo?.role) {
				setCurrentUserRole(String(userInfo.role).toUpperCase())
			}
			if (userInfo?.avatarUrl) {
				setComposerAvatar(userInfo.avatarUrl)
			}
		} catch {
			setComposerAvatar(DEFAULT_COMPOSER_AVATAR)
			setCurrentUserRole(null)
		}
	}, [])

	const uploadImage = async (file) => {
		const payload = await uploadUserImageApi(file)

		const fileUrl = payload?.file || payload?.data?.file
		if (!fileUrl) {
			throw new Error(t('pages.forum.uploadNoUrl'))
		}

		return fileUrl
	}

	const searchKeywordRef = useRef('')
	useEffect(() => {
		searchKeywordRef.current = searchKeyword
	}, [searchKeyword])

	const loadPosts = async ({ keyword } = {}) => {
		setLoadingPosts(true)
		try {
			const effectiveKeyword = keyword !== undefined ? keyword : searchKeywordRef.current
			const limit = effectiveKeyword ? 50 : 1000
			const data = await getPostsApi(getClientInstance(), {
				limit,
				keyword: effectiveKeyword,
			})
			setApiPosts(Array.isArray(data) ? data.map((item) => mapPostToUi(item, t, i18n.language)) : [])
		} catch (error) {
			message.error(error.message || t('pages.forum.loadPostsFailed'))
		} finally {
			setLoadingPosts(false)
		}
	}

	useEffect(() => {
		const loadInitialData = async () => {
			setLoadingTopics(true)
			try {
				const topics = await getAllTopicsApi(getClientInstance())
				setApiTopics(Array.isArray(topics) ? topics : [])
			} catch (error) {
				message.error(error.message || t('pages.forum.loadTopicsFailed'))
			} finally {
				setLoadingTopics(false)
			}

			await loadPosts()
		}

		loadInitialData()
	}, [])

	const didMountSearchRef = useRef(false)
	useEffect(() => {
		if (!didMountSearchRef.current) {
			didMountSearchRef.current = true
			return
		}
		loadPosts({ keyword: searchKeyword })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchKeyword])

	useEffect(() => {
		setApiPosts((prev) =>
			prev.map((post) => {
				const currentTopic = apiTopics.find(
					(topic) => String(topic?.id || '') === String(post?.actualTopicId || ''),
				)
				const topicName = getTopicDisplayName(currentTopic, { language: i18n.language, t })
				const tagTypeName = getTopicDisplayName(currentTopic, { language: 'vi', t })
				const isNoTopic = Boolean(post?.noTopicSelected || !post?.actualTopicId)

				return {
					...post,
					time: formatTimeAgo(post.createdAt, t),
					tag: isNoTopic
						? t('pages.forum.postTagDefault').toUpperCase()
						: (topicName || t('pages.forum.postTagDefault')).toUpperCase(),
					tagType: isNoTopic ? 'no-topic' : normalizeTagType(tagTypeName),
				}
			}),
		)

		setCommentsByPost((prev) => {
			const next = {}

			Object.entries(prev).forEach(([postId, value]) => {
				const threads = Array.isArray(value?.threads) ? value.threads : []
				next[postId] = {
					...value,
					threads: threads.map((thread) => ({
						...thread,
						main: thread?.main
							? {
								...thread.main,
								time: formatTimeAgo(thread.main.createdAt, t),
							}
							: thread?.main,
						replies: Array.isArray(thread?.replies)
							? thread.replies.map((reply) => ({
									...reply,
									time: formatTimeAgo(reply.createdAt, t),
							  }))
							: [],
					})),
				}
			})

			return next
		})
	}, [apiTopics, i18n.language, t])

	useEffect(() => {
		const container = feedScrollRef.current
		if (!container) return

		const saveScroll = () => {
			feedSavedScrollTopRef.current = container.scrollTop
		}

		container.addEventListener('scroll', saveScroll, { passive: true })
		return () => container.removeEventListener('scroll', saveScroll)
	}, [])

	useEffect(() => {
		const container = feedScrollRef.current
		const savedTop = feedSavedScrollTopRef.current
		if (!container || savedTop <= 0) return

		window.requestAnimationFrame(() => {
			container.scrollTop = savedTop
		})
	}, [i18n.language])

	useEffect(() => {
		if (!selectedPostIdFromQuery) return
		if (selectedTopicFilter !== 'all') {
			setSelectedTopicFilter('all')
		}
	}, [selectedPostIdFromQuery, selectedTopicFilter])

	const refreshSinglePost = useCallback((postId) => {
		const normalizedPostId = String(postId || '').trim()
		if (!normalizedPostId) return

		setApiPosts((prev) =>
			prev.map((post) =>
				String(post.id) === normalizedPostId
					? {
							...post,
							likes: (Number(post.likes) || 0) + 1,
					  }
					: post,
			),
		)
	}, [])

	useEffect(() => {
		const handleRealtimeLike = (event) => {
			const postId = String(event?.detail?.postId || '').trim()
			const notificationId = String(event?.detail?.notificationId || '').trim()

			if (!postId) return

			if (notificationId) {
				if (processedRealtimeLikeNotifRef.current.has(notificationId)) return
				processedRealtimeLikeNotifRef.current.add(notificationId)
				if (processedRealtimeLikeNotifRef.current.size > 500) {
					const oldest = processedRealtimeLikeNotifRef.current.values().next().value
					processedRealtimeLikeNotifRef.current.delete(oldest)
				}
			}

			refreshSinglePost(postId)
		}

		window.addEventListener('notif:postLiked', handleRealtimeLike)
		window.addEventListener('refreshPost', handleRealtimeLike)

		return () => {
			window.removeEventListener('notif:postLiked', handleRealtimeLike)
			window.removeEventListener('refreshPost', handleRealtimeLike)
		}
	}, [refreshSinglePost])

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
		const forumBasePath = location.pathname || '/forum'
		navigate(query ? `${forumBasePath}?${query}` : forumBasePath, { replace: Boolean(options.replace) })
	}

	const handleCreatePost = async () => {
		if (uploadingComposerImage) {
			message.warning(t('pages.forum.validation.uploadingImage'))
			return
		}

		if (!composerTitle.trim() && !composerText.trim() && composerImageFiles.length === 0) {
			message.warning(t('pages.forum.validation.emptyPost'))
			return
		}

		try {
			setSubmittingPost(true)
			let imageUrls = []

			if (composerImageFiles.length > 0) {
				setUploadingComposerImage(true)
				imageUrls = await uploadUserImagesApi(composerImageFiles)
			}

			const isNoTopicSelected = composerTopicId === NO_TOPIC_VALUE
			const resolvedTopicId = isNoTopicSelected ? fallbackTopicId : composerTopicId

			if (!resolvedTopicId) {
				message.error(t('pages.forum.validation.noTopicAvailable'))
				return
			}

			const createPayload = {
				topicId: resolvedTopicId,
				content: attachPostToContent({
					title: composerTitle,
					text: composerText,
					imageUrls,
					isNoTopic: isNoTopicSelected,
					t,
				}),
			}

			await createPostApi(getClientInstance(), createPayload)
			message.success(t('pages.forum.postSuccess'))
			setComposerText('')
			setComposerTitle('')
			setComposerTopicId(NO_TOPIC_VALUE)
			setComposerImageFiles([])
			setComposerImagePreviews([])
			setIsComposerModalOpen(false)
			await loadPosts()
		} catch (error) {
			message.error(error.message || t('pages.forum.postFailed'))
		} finally {
			setUploadingComposerImage(false)
			setSubmittingPost(false)
		}
	}

	const closeEditModal = () => {
		setEditingPost(null)
	}

	const isOwnPost = useCallback(
		(post) => {
			const postAuthorId = String(post?.authorId || '')
			const normalizedCurrentUserId = String(currentUserId || '')
			if (!postAuthorId || !normalizedCurrentUserId) return false

			return postAuthorId === normalizedCurrentUserId
		},
		[currentUserId],
	)

	const handleStartEditPost = (post) => {
		setMenuPostId(null)
		if (!isOwnPost(post)) {
			message.warning(t('pages.forum.validation.editOwnPostOnly'))
			return
		}

		setEditingPost({
			id: post.id,
			title: post.title || '',
			text: post.content || '',
			topicId: post.rawTopicId ? String(post.rawTopicId) : NO_TOPIC_VALUE,
			fallbackTopicId: post.actualTopicId ? String(post.actualTopicId) : fallbackTopicId,
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
			message.success(t('pages.forum.uploadPostImageSuccess'))
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
			message.error(
				error.message === 'image-read-error'
					? t('pages.forum.readImageFailed')
					: error.message || t('pages.forum.readImageFailed'),
			)
		} finally {
			setUploadingEditImage(false)
		}

		event.target.value = ''
	}

	const handleSaveEditedPost = async () => {
		if (!editingPost) return

		if (uploadingEditImage) {
			message.warning(t('pages.forum.validation.uploadingImage'))
			return
		}

		if (!editingPost.title.trim() && !editingPost.text.trim() && !editingPost.imagePreview) {
			message.warning(t('pages.forum.validation.emptyPost'))
			return
		}

		try {
			setSubmittingEditPost(true)
			const imageUrl = editingPost.imageUrl || null
			const isNoTopicSelected = editingPost.topicId === NO_TOPIC_VALUE
			const resolvedTopicId = isNoTopicSelected ? (editingPost.fallbackTopicId || fallbackTopicId) : editingPost.topicId

			if (!resolvedTopicId) {
				message.error(t('pages.forum.validation.noTopicAvailableForUpdate'))
				return
			}

			await updatePostApi(getClientInstance(), editingPost.id, {
				topicId: resolvedTopicId,
				content: attachPostToContent({
					title: editingPost.title,
					text: editingPost.text,
					imageUrls: imageUrl ? [imageUrl] : [],
					isNoTopic: isNoTopicSelected,
					t,
				}),
			})

			message.success(t('pages.forum.updatePostSuccess'))
			closeEditModal()
			await loadPosts()
		} catch (error) {
			message.error(error.message || t('pages.forum.updatePostFailed'))
		} finally {
			setSubmittingEditPost(false)
		}
	}

	const handleDeletePost = (post) => {
		setMenuPostId(null)
		const canDelete = isOwnPost(post) || isAdminMode
		if (!canDelete) {
			message.warning(t('pages.forum.validation.deleteOwnPostOnly'))
			return
		}

		Modal.confirm({
			title: t('pages.forum.confirmDelete.title'),
			content: t('pages.forum.confirmDelete.content'),
			okText: t('pages.forum.confirmDelete.okText'),
			cancelText: t('pages.forum.confirmDelete.cancelText'),
			okType: 'danger',
			centered: true,
			onOk: async () => {
				try {
					if (isAdminMode && !isOwnPost(post)) {
						await adminDeletePostApi(post.id)
					} else {
						await deletePostApi(getClientInstance(), post.id)
					}
					message.success(t('pages.forum.deleteSuccess'))
					if (expandedPostId === post.id) {
						setExpandedPostId(null)
						updateParams({ post: '', postId: '', commentId: '' })
					}
					await loadPosts()
				} catch (error) {
					message.error(error.message || t('pages.forum.deleteFailed'))
				}
			},
		})
	}

	const closePostReportModal = useCallback(() => {
		setReportingPost(null)
		setPostReportReason('')
		setPostReportDetail('')
		setSubmittingPostReport(false)
	}, [])

	const handleStartReportPost = useCallback(
		(post) => {
			setMenuPostId(null)
			if (isOwnPost(post)) {
				message.warning(t('pages.forum.validation.reportOtherPostOnly', { defaultValue: 'Bạn chỉ có thể báo cáo bài viết của người khác' }))
				return
			}

			setReportingPost({
				id: post.id,
				authorName: post.author || t('header.user.defaultName'),
				title: post.title || '',
				content: post.content || '',
			})
			setPostReportReason('')
			setPostReportDetail('')
		},
		[isOwnPost, t],
	)

	const handleSubmitPostReport = useCallback(async () => {
		if (!reportingPost?.id) return

		if (!String(postReportReason || '').trim()) {
			message.warning(
				t('pages.forum.validation.reportPostReasonRequired', {
					defaultValue: 'Vui lòng chọn lý do báo cáo bài viết',
				}),
			)
			return
		}

		setSubmittingPostReport(true)
		try {
			const normalizedReason = String(postReportReason || '').trim()
			const normalizedDetail = String(postReportDetail || '').trim()
			const payload = {
				reason: normalizedReason,
				detail: normalizedDetail || undefined,
			}

			try {
				await reportPostApi(getClientInstance(), reportingPost.id, payload)
				message.success(
					t('pages.forum.reportPostSuccess', {
						defaultValue: 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét bài viết này.',
					}),
				)
			} catch (error) {
				const status = Number(error?.response?.status || 0)
				if (status === 404 || status === 405) {
					try {
						await createGenericReportApi(getClientInstance(), {
							targetId: reportingPost.id,
							targetType: 'POST',
							reason: normalizedDetail
								? `${normalizedReason}: ${normalizedDetail}`
								: normalizedReason,
						})
						message.success(
							t('pages.forum.reportPostSuccess', {
								defaultValue: 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét bài viết này.',
							}),
						)
					} catch (fallbackError) {
						const fallbackStatus = Number(fallbackError?.response?.status || 0)
						if (fallbackStatus === 404 || fallbackStatus === 405) {
							console.info('[Forum] Report post deferred because backend endpoint is unavailable', {
								postId: reportingPost.id,
								payload,
							})
							message.success(
								t('pages.forum.reportPostRecorded', {
									defaultValue: 'Đã ghi nhận báo cáo của bạn',
								}),
							)
						} else {
							throw fallbackError
						}
					}
				} else {
					throw error
				}
			}

			closePostReportModal()
		} catch (error) {
			message.error(
				error?.message ||
					t('pages.forum.reportPostFailed', {
						defaultValue: 'Không thể gửi báo cáo bài viết. Vui lòng thử lại.',
					}),
			)
		} finally {
			setSubmittingPostReport(false)
		}
	}, [closePostReportModal, postReportDetail, postReportReason, reportingPost?.id, t])

	const handlePickComposerImage = async (event) => {
		const selectedFiles = Array.from(event.target.files || []).filter(Boolean)
		if (selectedFiles.length === 0) return

		const remainingSlots = MAX_POST_IMAGES - composerImageFiles.length
		if (remainingSlots <= 0) {
			message.warning(t('pages.forum.maxImages', { count: MAX_POST_IMAGES }))
			event.target.value = ''
			return
		}

		const acceptedFiles = selectedFiles.slice(0, remainingSlots)
		if (acceptedFiles.length < selectedFiles.length) {
			message.warning(t('pages.forum.maxImagesPerPost', { count: MAX_POST_IMAGES }))
		}

		try {
			const previews = await Promise.all(acceptedFiles.map((file) => toDataUrl(file)))
			setComposerImageFiles((prev) => [...prev, ...acceptedFiles])
			setComposerImagePreviews((prev) => [...prev, ...previews])
		} catch (error) {
			message.error(
				error.message === 'image-read-error'
					? t('pages.forum.readImageFailed')
					: error.message || t('pages.forum.readImageFailed'),
			)
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
			const response = nextLiked ? await likePostApi(getClientInstance(), post.id) : await unlikePostApi(getClientInstance(), post.id)
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
					message.success(t('pages.forum.likeSuccess', { author: post.author }))
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
			message.error(error.message || t('pages.forum.likeFailed'))
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
			const comments = await getCommentsByPostIdApi(getClientInstance(), postId, { limit: 1000 })
			const topComments = Array.isArray(comments) ? comments : []

			const commentThreads = await Promise.all(
				topComments.map(async (comment) => {
					let replies = []
					if (Number(comment.replyCount || 0) > 0) {
						const fetchedReplies = await getRepliesApi(getClientInstance(), { parentId: comment.id, limit: 1000 })
						if (Array.isArray(fetchedReplies) && fetchedReplies.length > 0) {
							replies = fetchedReplies.map((reply) => mapCommentToUi(reply, t))
						}
					}

					return {
						main: mapCommentToUi(comment, t),
						replies,
					}
				}),
			)

			setCommentsByPost((prev) => ({
				...prev,
				[postId]: commentThreads,
			}))
		} catch (error) {
			message.error(error.message || t('pages.forum.loadCommentsFailed'))
		} finally {
			setLoadingCommentsByPost((prev) => ({
				...prev,
				[postId]: false,
			}))
		}
	}

	useEffect(() => {
		if (!selectedPostIdFromQuery || loadingPosts) return

		const targetPost = apiPosts.find((post) => String(post.id) === selectedPostIdFromQuery)
		if (!targetPost) {
			clearForumTargetParams()
			return
		}

		let cancelled = false
		let commentPollTimer = null

		const scrollAndHighlightPost = () => {
			const postElement = document.getElementById(`forum-post-${selectedPostIdFromQuery}`)
			if (!postElement) return false

			scrollElementIntoFeed(postElement)
			flashPostHighlight(selectedPostIdFromQuery)
			return true
		}

		const handlePostOnlyNavigation = () => {
			window.requestAnimationFrame(() => {
				if (cancelled) return
				scrollAndHighlightPost()
				clearForumTargetParams()
			})
		}

		const handleCommentNavigation = async () => {
			setExpandedPostId(selectedPostIdFromQuery)

			if (!commentsByPost[selectedPostIdFromQuery] && !loadingCommentsByPost[selectedPostIdFromQuery]) {
				await loadCommentsForPost(selectedPostIdFromQuery)
			}

			if (cancelled) return

			let attempts = 0
			commentPollTimer = window.setInterval(() => {
				if (cancelled) {
					window.clearInterval(commentPollTimer)
					return
				}

				attempts += 1
				scrollAndHighlightPost()

				const commentElement = document.getElementById(
					`forum-comment-${selectedCommentIdFromQuery}`,
				)

				if (commentElement) {
					scrollElementIntoFeed(commentElement)
					flashCommentHighlight(selectedCommentIdFromQuery)
					window.clearInterval(commentPollTimer)
					clearForumTargetParams()
					return
				}

				if (attempts >= 12) {
					window.clearInterval(commentPollTimer)
					clearForumTargetParams()
				}
			}, 120)
		}

		if (!selectedCommentIdFromQuery) {
			handlePostOnlyNavigation()
		} else {
			void handleCommentNavigation()
		}

		return () => {
			cancelled = true
			if (commentPollTimer) {
				window.clearInterval(commentPollTimer)
			}
		}
	}, [
		apiPosts,
		clearForumTargetParams,
		commentsByPost,
		flashCommentHighlight,
		flashPostHighlight,
		loadingCommentsByPost,
		loadingPosts,
		scrollElementIntoFeed,
		selectedCommentIdFromQuery,
		selectedPostIdFromQuery,
	])

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
			message.success(t('pages.forum.uploadCommentImageSuccess'))
		} catch (error) {
			setCommentImageFile(null)
			setCommentImagePreview('')
			setCommentImageUrl('')
			message.error(
				error.message === 'image-read-error'
					? t('pages.forum.readImageFailed')
					: error.message || t('pages.forum.readImageFailed'),
			)
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
			message.success(t('pages.forum.uploadReplyImageSuccess'))
		} catch (error) {
			setReplyImageFile(null)
			setReplyImagePreview('')
			setReplyImageUrl('')
			message.error(
				error.message === 'image-read-error'
					? t('pages.forum.readImageFailed')
					: error.message || t('pages.forum.readImageFailed'),
			)
		} finally {
			setUploadingReplyImage(false)
		}

		event.target.value = ''
	}

	const handleCreateComment = async (postId) => {
		if (uploadingCommentImage) {
			message.warning(t('pages.forum.validation.commentImageUploading'))
			return
		}

		if (!commentText.trim() && !commentImageFile) {
			message.warning(t('pages.forum.validation.commentRequired'))
			return
		}

		try {
			setSubmittingComment(true)
			const imageUrl = commentImageUrl || null
			const createdComment = await createCommentApi(getClientInstance(), {
				postId,
				parentId: null,
				content: attachCommentToContent(commentText, imageUrl, t),
			})
			const mappedComment = mapCommentToUi(createdComment, t)
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
			message.error(error.message || t('pages.forum.createCommentFailed'))
		} finally {
			setSubmittingComment(false)
		}
	}

	const handleReplyComment = async () => {
		if (!replyingComment?.postId || !replyingComment?.parentId) return

		if (uploadingReplyImage) {
			message.warning(t('pages.forum.validation.replyImageUploading'))
			return
		}

		if (!replyText.trim() && !replyImageFile) {
			message.warning(t('pages.forum.validation.replyRequired'))
			return
		}

		try {
			setSubmittingReply(true)
			const imageUrl = replyImageUrl || null
			const createdReply = await createCommentApi(getClientInstance(), {
				postId: replyingComment.postId,
				parentId: replyingComment.parentId,
				content: attachCommentToContent(replyText, imageUrl, t),
				
			})

			const mappedReply = mapCommentToUi(createdReply, t)
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
			message.error(error.message || t('pages.forum.replyFailed'))
		} finally {
			setSubmittingReply(false)
		}
	}

	useEffect(() => {
		const profileUserId = String(userProfile?.id || '').trim()
		if (profileUserId) {
			setCurrentUserId(profileUserId)
		}

		const profileRole = String(userProfile?.role || '').trim().toUpperCase()
		if (profileRole) {
			setCurrentUserRole(profileRole)
		}

		if (userProfile?.avatarUrl) {
			setComposerAvatar(userProfile.avatarUrl)
		}
	}, [userProfile?.avatarUrl, userProfile?.id, userProfile?.role])

	const isAdminUser = currentUserRole === RoleEnum.ADMIN
	const isAdminPortalPath = location.pathname.startsWith('/admin/forum')
	const isAdminMode = isAdminUser && isAdminPortalPath

	const isCommentOwner = useCallback(
		(comment) => {
			const commentOwnerId = String(comment?.user?.id || '')
			const normalizedCurrentUserId = String(currentUserId || '')
			if (!commentOwnerId || !normalizedCurrentUserId) return false

			return commentOwnerId === normalizedCurrentUserId
		},
		[currentUserId],
	)

	const closeEditCommentModal = useCallback(() => {
		setEditingComment(null)
		setUploadingEditCommentImage(false)
		setSubmittingEditComment(false)
	}, [])

	const closeReportModal = useCallback(() => {
		setReportingComment(null)
		setReportReason('')
		setSubmittingReport(false)
	}, [])

	const handleStartEditComment = useCallback(
		(comment, postId) => {
			if (!isCommentOwner(comment)) {
				message.warning(t('pages.forum.validation.editOwnCommentOnly', { defaultValue: 'Bạn chỉ có thể chỉnh sửa bình luận của chính mình' }))
				return
			}

			setEditingComment({
				id: comment.id,
				postId,
				text: comment.content || '',
				imagePreview: comment.image || '',
				imageUrl: comment.image || '',
				existingImageUrl: comment.image || '',
			})
		},
		[isCommentOwner, t],
	)

	const handlePickEditCommentImage = useCallback(
		async (event) => {
			const file = event.target.files?.[0]
			if (!file) return

			setUploadingEditCommentImage(true)

			try {
				const preview = await toDataUrl(file)
				setEditingComment((prev) =>
					prev
						? {
								...prev,
								imagePreview: preview,
						  }
						: prev,
				)

				const uploadedUrl = await uploadImage(file)
				setEditingComment((prev) =>
					prev
						? {
								...prev,
								imageUrl: uploadedUrl,
						  }
						: prev,
				)
				message.success(t('pages.forum.uploadCommentImageSuccess'))
			} catch (error) {
				setEditingComment((prev) =>
					prev
						? {
								...prev,
								imagePreview: prev.existingImageUrl || '',
								imageUrl: prev.existingImageUrl || '',
						  }
						: prev,
				)
				message.error(
					error.message === 'image-read-error'
						? t('pages.forum.readImageFailed')
						: error.message || t('pages.forum.readImageFailed'),
				)
			} finally {
				setUploadingEditCommentImage(false)
			}

			event.target.value = ''
		},
		[t],
	)

	const handleSaveEditedComment = useCallback(async () => {
		if (!editingComment?.id || !editingComment?.postId) return

		if (uploadingEditCommentImage) {
			message.warning(t('pages.forum.validation.commentImageUploading'))
			return
		}

		if (!String(editingComment.text || '').trim() && !editingComment.imagePreview) {
			message.warning(t('pages.forum.validation.commentRequired'))
			return
		}

		try {
			setSubmittingEditComment(true)
			await updateCommentApi(getClientInstance(), editingComment.id, {
				content: attachCommentToContent(editingComment.text, editingComment.imageUrl || null, t),
			})

			setCommentsByPost((prev) => ({
				...prev,
				[editingComment.postId]: (prev[editingComment.postId] || []).map((thread) => {
					if (thread.main.id === editingComment.id) {
						return {
							...thread,
							main: {
								...thread.main,
								content: editingComment.text,
								image: editingComment.imageUrl || null,
								time: t('pages.forum.justNow'),
							},
						}
					}

					return {
						...thread,
						replies: (thread.replies || []).map((reply) =>
							reply.id === editingComment.id
								? {
									...reply,
									content: editingComment.text,
									image: editingComment.imageUrl || null,
									time: t('pages.forum.justNow'),
								  }
								: reply,
						),
					}
				}),
			}))

			message.success(t('pages.forum.updateCommentSuccess', { defaultValue: 'Cập nhật bình luận thành công' }))
			closeEditCommentModal()
		} catch (error) {
			message.error(error.message || t('pages.forum.updateCommentFailed', { defaultValue: 'Không thể cập nhật bình luận' }))
		} finally {
			setSubmittingEditComment(false)
		}
	}, [closeEditCommentModal, editingComment, t, uploadingEditCommentImage])

	const handleDeleteComment = useCallback(
		async (comment, postId) => {
			const canDelete = isCommentOwner(comment) || isAdminMode
			if (!canDelete) {
				message.warning(t('pages.forum.validation.deleteOwnCommentOnly', { defaultValue: 'Bạn không có quyền xóa bình luận này' }))
				return
			}

			Modal.confirm({
				title: t('pages.forum.confirmDeleteComment.title', { defaultValue: 'Xóa bình luận' }),
				content: t('pages.forum.confirmDeleteComment.content', { defaultValue: 'Bạn có chắc chắn muốn xóa bình luận này không?' }),
				okText: t('pages.forum.confirmDeleteComment.okText', { defaultValue: 'Xóa' }),
				cancelText: t('pages.forum.confirmDeleteComment.cancelText', { defaultValue: 'Hủy' }),
				okType: 'danger',
				centered: true,
				onOk: async () => {
					try {
						if (isAdminMode && !isCommentOwner(comment)) {
							await adminDeleteCommentApi(comment.id)
						} else {
							await deleteCommentApi(getClientInstance(), comment.id)
						}

						const currentThreads = commentsByPost[postId] || []
						const { nextThreads, removedCount } = removeCommentFromThreads(currentThreads, comment.id)

						if (removedCount > 0) {
							setCommentsByPost((prev) => ({
								...prev,
								[postId]: nextThreads,
							}))

							setApiPosts((prev) =>
								prev.map((item) =>
									item.id === postId
										? {
												...item,
												comments: Math.max(0, Number(item.comments || 0) - removedCount),
										  }
										: item,
								),
							)
						}

						if (replyingComment?.parentId === comment.id) {
							setReplyingComment(null)
							setReplyText('')
							setReplyImageFile(null)
							setReplyImagePreview('')
							setReplyImageUrl('')
						}

						if (editingComment?.id === comment.id) {
							closeEditCommentModal()
						}

						message.success(t('pages.forum.deleteCommentSuccess', { defaultValue: 'Đã xóa bình luận' }))
					} catch (error) {
						message.error(error.message || t('pages.forum.deleteCommentFailed', { defaultValue: 'Không thể xóa bình luận' }))
					}
				},
			})
		},
		[closeEditCommentModal, commentsByPost, editingComment?.id, isAdminMode, isCommentOwner, replyingComment?.parentId, t],
	)

	const handleSubmitCommentReport = useCallback(async () => {
		if (!reportingComment?.id) return

		if (!String(reportReason || '').trim()) {
			message.warning(t('pages.forum.validation.reportReasonRequired', { defaultValue: 'Vui lòng nhập nội dung tố cáo' }))
			return
		}

		setSubmittingReport(true)
		try {
			const normalizedReason = String(reportReason || '').trim()

			try {
				await reportCommentApi(getClientInstance(), reportingComment.id, {
					reason: normalizedReason,
				})
				message.success(
					t('pages.forum.reportCommentSuccess', {
						defaultValue: 'Cảm ơn bạn đã báo cáo bình luận. Chúng tôi sẽ xem xét sớm.',
					}),
				)
			} catch (error) {
				const status = Number(error?.response?.status || 0)
				if (status === 404 || status === 405) {
					try {
						await createGenericReportApi(getClientInstance(), {
							targetId: reportingComment.id,
							targetType: 'COMMENT',
							reason: normalizedReason,
						})
						message.success(
							t('pages.forum.reportCommentSuccess', {
								defaultValue: 'Cảm ơn bạn đã báo cáo bình luận. Chúng tôi sẽ xem xét sớm.',
							}),
						)
					} catch (fallbackError) {
						const fallbackStatus = Number(fallbackError?.response?.status || 0)
						if (fallbackStatus === 404 || fallbackStatus === 405) {
							message.warning(
								t('pages.forum.reportBackendUnavailable', {
									defaultValue: 'Backend hiện chưa hỗ trợ endpoint tố cáo bình luận. Vui lòng liên hệ quản trị viên.',
								}),
							)
						} else {
							throw fallbackError
						}
					}
				} else {
					throw error
				}
			}
			closeReportModal()
		} catch (error) {
			message.error(
				error?.message ||
					t('pages.forum.reportCommentFailed', {
						defaultValue: 'Không thể gửi báo cáo bình luận. Vui lòng thử lại.',
					}),
			)
		} finally {
			setSubmittingReport(false)
		}
	}, [closeReportModal, reportReason, reportingComment?.id, t])

	const handleCommentAction = useCallback(
		(action, comment, postId) => {
			if (action === 'edit') {
				handleStartEditComment(comment, postId)
				return
			}

			if (action === 'delete') {
				void handleDeleteComment(comment, postId)
				return
			}

			if (action === 'report') {
				setReportingComment({
					id: comment.id,
					postId,
					commentOwnerName: comment.user?.fullName || t('header.user.defaultName'),
					content: comment.content || '',
				})
				setReportReason('')
			}
		},
		[handleDeleteComment, handleStartEditComment, t],
	)

	const buildCommentMenuItems = useCallback(
		(comment) => {
			if (isCommentOwner(comment)) {
				return [
					{ key: 'edit', label: t('common.actions.edit') },
					{
						key: 'delete',
						label: isAdminMode ? t('pages.forum.actions.deleteAdmin') : t('common.actions.delete'),
						danger: true,
					},
				]
			}

			if (isAdminMode) {
				return [{ key: 'delete', label: t('pages.forum.actions.deleteAdmin'), danger: true }]
			}

			return [{ key: 'report', label: t('pages.forum.actions.reportComment', { defaultValue: 'Tố cáo bình luận' }) }]
		},
		[isAdminMode, isCommentOwner, t],
	)

	const renderCommentMenuButton = useCallback(
		(comment, postId) => {
			const menuItems = buildCommentMenuItems(comment)
			if (!menuItems.length) return null

			return (
				<Dropdown
					trigger={['click']}
					placement="bottomRight"
					menu={{
						items: menuItems,
						onClick: ({ key, domEvent }) => {
							domEvent?.stopPropagation?.()
							handleCommentAction(String(key), comment, postId)
						},
					}}
				>
					<button
						type="button"
						className={styles.commentMenuButton}
						onClick={(event) => event.stopPropagation()}
						aria-label={t('pages.forum.actions.commentOptionsAria', { defaultValue: 'Tùy chọn bình luận' })}
					>
						<FaEllipsis />
					</button>
				</Dropdown>
			)
		},
		[buildCommentMenuItems, handleCommentAction, t],
	)

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

		if (searchKeyword) {
			return filtered.map((post) => ({ ...post, isFeatured: false }))
		}

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
	}, [sourcePosts, selectedTopicFilter, featuredPostIds, searchKeyword])

	return (
		<div className={styles.pageRoot}>
			<main className={styles.pageWrap}>
				<section ref={feedScrollRef} className={styles.leftColumn}>
					<div className={styles.searchCard}>
						<ForumSearchBar
							value={searchKeyword}
							onSearch={setSearchKeyword}
							placeholder={t('pages.forum.search.placeholder')}
							ariaLabel={t('pages.forum.search.placeholder')}
						/>
						{searchKeyword ? (
							<div className={styles.searchStatusRow}>
								<span className={styles.searchActiveChip}>
									{t('pages.forum.search.activeLabel', { keyword: searchKeyword })}
								</span>
								<button
									type="button"
									className={styles.searchClearLink}
									onClick={() => setSearchKeyword('')}
								>
									{t('pages.forum.search.clear')}
								</button>
								{!loadingPosts ? (
									<span className={styles.searchResultCount}>
										{t('pages.forum.search.resultCount', { count: visiblePosts.length })}
									</span>
								) : null}
							</div>
						) : null}
					</div>
					<div className={styles.composeCard}>
						<div className={styles.composeTop}>
							<img src={composerAvatar} alt={t('pages.forum.avatarAlt')} className={styles.composeAvatar} />
							<textarea
								ref={composerRef}
								className={styles.composeInput}
								placeholder={t('pages.forum.placeholders.shareToday')}
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
										title={t('pages.forum.actions.selectTopicTitle')}
									>
										{t('pages.forum.topic')} <FaFilter style={{ marginLeft: 6 }} />
									</button>
								</Dropdown>
							</div>
						</div>
					</div>

					<div className={styles.feedList}>
						{loadingPosts ? <p className={styles.loadingText}>{t('pages.forum.loadingPosts')}</p> : null}
						{!loadingPosts && searchKeyword && visiblePosts.length === 0 ? (
							<div className={styles.searchEmptyState}>
								<FaMagnifyingGlass className={styles.searchEmptyIcon} aria-hidden="true" />
								<p className={styles.searchEmptyTitle}>
									{t('pages.forum.search.emptyTitle', { keyword: searchKeyword })}
								</p>
								<p className={styles.searchEmptyHint}>{t('pages.forum.search.emptyHint')}</p>
							</div>
						) : null}
						{visiblePosts.map((post) => (
							<article
								key={post.id}
								id={`forum-post-${post.id}`}
								className={`${styles.postCard} ${highlightedPostId === String(post.id) ? styles.selectedPost : ''}`}
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
															{post.isFeatured ? <span className={styles.featuredBadge}>{t('pages.forum.featured')}</span> : null}
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
												{isOwnPost(post) ? (
													<>
														<button type="button" className={styles.postMenuItem} onClick={() => handleStartEditPost(post)}>
															{t('common.actions.edit')}
														</button>
														<button
															type="button"
															className={`${styles.postMenuItem} ${styles.postMenuDanger}`}
															onClick={() => handleDeletePost(post)}
														>
																{isAdminMode ? t('pages.forum.actions.deleteAdmin') : t('common.actions.delete')}
														</button>
													</>
												) : (
														<>
															{isAdminMode ? (
																<button
																	type="button"
																	className={`${styles.postMenuItem} ${styles.postMenuDanger}`}
																	onClick={() => handleDeletePost(post)}
																>
																	{t('pages.forum.actions.deleteAdmin')}
																</button>
															) : null}
															<button type="button" className={styles.postMenuItem} onClick={() => handleStartReportPost(post)}>
																<FlagOutlined style={{ marginRight: 8 }} />
																{t('pages.forum.actions.reportPost', { defaultValue: 'Báo cáo bài viết' })}
															</button>
														</>
												)}
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
																		alt={t('pages.forum.postImageAlt', { index: index + 1 })}
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
											{post.liked ? <FaThumbsUp /> : <FaRegThumbsUp />} {post.likes}
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
											<img src={composerAvatar} alt={t('pages.forum.avatarAlt')} className={styles.commentAvatar} />
											<div className={styles.commentFormWrap}>
												<textarea
													value={commentText}
													onChange={(event) => setCommentText(event.target.value)}
													placeholder={t('pages.forum.placeholders.comment')}
													className={styles.commentInput}
												/>
												{commentImagePreview ? (
													<div className={styles.previewImageWrap}>
															<img src={commentImagePreview} alt={t('pages.forum.commentImagePreviewAlt')} className={styles.previewImage} />
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
															{t('pages.forum.actions.removeImage')}
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
														<FaImage /> {t('pages.forum.actions.image')}
													</button>
													<button
														type="button"
														onClick={() => handleCreateComment(post.id)}
																disabled={submittingComment || uploadingCommentImage}
													>
																{submittingComment ? t('pages.forum.actions.sending') : uploadingCommentImage ? t('pages.forum.actions.uploadingImage') : t('pages.forum.actions.send')}
													</button>
												</div>
											</div>
										</div>

										{loadingCommentsByPost[post.id] ? <p className={styles.loadingText}>{t('pages.forum.loadingComments')}</p> : null}

										<div className={styles.commentList}>
										{(commentsByPost[post.id] || []).map((thread) => (
											<div key={thread.main.id} className={styles.threadBlock}>
												
												<div
													id={`forum-comment-${thread.main.id}`}
													className={`${styles.mainCommentBlock} ${highlightedCommentId === String(thread.main.id) ? styles.targetComment : ''}`}
												>
													<img
														src={thread.main.user.avatarUrl}
														alt={thread.main.user.fullName}
														className={styles.commentAvatar}
													/>
												<div className={styles.commentRow}>
													<div className={styles.commentBubbleWrap}>
														<div className={styles.commentBubbleRow}>
														<div className={styles.commentBubble}>
															<strong>{thread.main.user.fullName}</strong>
															{thread.main.content ? <p>{thread.main.content}</p> : null}
															{thread.main.image ? (
																<img src={thread.main.image} alt="comment" className={styles.commentImage} />
															) : null}
														</div>
															{renderCommentMenuButton(thread.main, post.id)}
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
															{t('pages.forum.actions.reply')}
															</button>

														</div>
														{replyingComment?.parentId === thread.main.id && (
															<div className={styles.replyComposer}>
															<p>{t('pages.forum.replyingTo', { user: thread.main.user.fullName })}</p>

																<textarea
																	value={replyText}
																	onChange={(e) => setReplyText(e.target.value)}
																placeholder={t('pages.forum.placeholders.reply')}
																	className={styles.commentInput}
																/>

																{replyImagePreview && (
																	<div className={styles.previewImageWrap}>
																		<img
																			src={replyImagePreview}
																			alt={t('pages.forum.replyImagePreviewAlt')}
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
																			{t('pages.forum.actions.removeImage')}
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
																	<FaImage /> {t('pages.forum.actions.image')}
																	</button>

																	<button
																		type="button"
																		onClick={handleReplyComment}
																		disabled={submittingReply || uploadingReplyImage}
																	>
																		{submittingReply ? t('pages.forum.actions.sending') : uploadingReplyImage ? t('pages.forum.actions.uploadingImage') : t('pages.forum.actions.sendReply')}
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
																		{t('common.actions.cancel')}
																	</button>
																</div>
															</div>
														)}
													</div>
													</div>
												</div>

												{(thread.replies || []).map((reply) => (
													<div
														key={reply.id}
														id={`forum-comment-${reply.id}`}
														className={`${styles.replyCommentBlock} ${highlightedCommentId === String(reply.id) ? styles.targetComment : ''}`}
													>
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
																	<img src={reply.image} alt={t('pages.forum.replyImageAlt')} className={styles.commentImage} />
																) : null}
															</div>

															<div className={styles.commentMeta}>
																<span>{reply.time}</span>
																{renderCommentMenuButton(reply, post.id)}
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
			</main>

			<div
				className={`${styles.composerModalOverlay} ${isComposerModalOpen ? styles.open : ''}`}
				onClick={closeComposerModal}
			>
				<div
					className={`${styles.composerModal} ${isComposerModalOpen ? styles.open : ''}`}
					onClick={(e) => e.stopPropagation()}
				>
					<h3 style={{textAlign: 'center'}}>{t('pages.forum.createPostTitle')}</h3>
					<p style={{marginLeft: 3, fontWeight: 'bold'}}>{t('pages.forum.postTopic')}</p>
					<Select
						value={composerTopicId || NO_TOPIC_VALUE}
						onChange={(value) => setComposerTopicId(value)}
						className={styles.topicSelectAntd}
						placeholder={t('pages.forum.placeholders.choosePostTopic')}
						options={topicSelectOptions}
					/>

					<textarea
						value={composerText}
						onChange={(event) => setComposerText(event.target.value)}
						className={styles.composerModalInput}
						placeholder={t('pages.forum.placeholders.shareToday')}
					/>

					{composerImagePreviews.length > 0 ? (
						<div className={styles.previewImageWrap}>
							{composerImagePreviews.map((preview, index) => (
								<div key={`${preview}-${index}`} className={styles.previewImageItem}>
										<img src={preview} alt={t('pages.forum.postPreviewAlt', { index: index + 1 })} className={styles.previewImage} />
									<button
										type="button"
										onClick={() => {
											setComposerImageFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
											setComposerImagePreviews((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
										}}
										className={styles.removeImageBtn}
										disabled={uploadingComposerImage || submittingPost}
									>
										{t('pages.forum.actions.removeImage')}
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
							<FaImage /> {t('pages.forum.actions.chooseImage')}
						</button>
						<button type="button" onClick={handleCreatePost} disabled={submittingPost || loadingTopics || uploadingComposerImage}>
							{submittingPost ? t('pages.forum.actions.posting') : uploadingComposerImage ? t('pages.forum.actions.uploadingImage') : t('pages.forum.actions.post')}
						</button>
						<button
							type="button"
							onClick={closeComposerModal}
						>
							{t('common.actions.cancel')}
						</button>
					</div>
				</div>
			</div>

			{editingPost ? (
				<div className={`${styles.composerModalOverlay} ${styles.open}`} onClick={closeEditModal}>
					<div className={`${styles.composerModal} ${styles.open}`} onClick={(event) => event.stopPropagation()}>
						<h3>{t('pages.forum.editPostTitle')}</h3>
						<p style={{marginLeft: 3, fontWeight: 'bold'}}>{t('pages.forum.topic')}</p>
						<Select
							value={editingPost.topicId || NO_TOPIC_VALUE}
							onChange={(value) =>
								setEditingPost((prev) => (prev ? { ...prev, topicId: value } : prev))
							}
							className={styles.topicSelectAntd}
							placeholder={t('pages.forum.placeholders.chooseTopic')}
							options={topicSelectOptions}
						/>

						<textarea
							value={editingPost.text}
							onChange={(event) =>
								setEditingPost((prev) => (prev ? { ...prev, text: event.target.value } : prev))
							}
							className={styles.composerModalInput}
							placeholder={t('pages.forum.placeholders.editPost')}
						/>

						{editingPost.imagePreview ? (
							<div className={styles.previewImageWrap}>
								<img src={editingPost.imagePreview} alt={t('pages.forum.editPostPreviewAlt')} className={styles.previewImage} />
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
									{t('pages.forum.actions.removeImage')}
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
								<FaImage /> {t('pages.forum.actions.chooseAnotherImage')}
							</button>
							<button type="button" onClick={handleSaveEditedPost} disabled={submittingEditPost || loadingTopics || uploadingEditImage}>
								{submittingEditPost ? t('pages.forum.actions.saving') : uploadingEditImage ? t('pages.forum.actions.uploadingImage') : t('pages.forum.actions.saveEdit')}
							</button>
							<button type="button" onClick={closeEditModal} disabled={uploadingEditImage || submittingEditPost}>
								{t('common.actions.cancel')}
							</button>
						</div>
					</div>
				</div>
			) : null}

			{editingComment ? (
				<div className={`${styles.composerModalOverlay} ${styles.open}`} onClick={closeEditCommentModal}>
					<div className={`${styles.composerModal} ${styles.open}`} onClick={(event) => event.stopPropagation()}>
						<h3>{t('pages.forum.editCommentTitle', { defaultValue: 'Chỉnh sửa bình luận' })}</h3>

						<textarea
							value={editingComment.text}
							onChange={(event) =>
								setEditingComment((prev) => (prev ? { ...prev, text: event.target.value } : prev))
							}
							className={styles.composerModalInput}
							placeholder={t('pages.forum.placeholders.comment')}
						/>

						{editingComment.imagePreview ? (
							<div className={styles.previewImageWrap}>
								<img src={editingComment.imagePreview} alt={t('pages.forum.commentImagePreviewAlt')} className={styles.previewImage} />
								<button
									type="button"
									onClick={() =>
										setEditingComment((prev) =>
											prev
												? {
														...prev,
														imagePreview: '',
														imageUrl: '',
														existingImageUrl: '',
												  }
												: prev,
										)
									}
									className={styles.removeImageBtn}
									disabled={uploadingEditCommentImage || submittingEditComment}
								>
									{t('pages.forum.actions.removeImage')}
								</button>
							</div>
						) : null}

						<div className={styles.modalActionRow}>
							<input
								ref={editCommentImageInputRef}
								type="file"
								accept="image/*"
								onChange={handlePickEditCommentImage}
								hidden
							/>
							<button
								type="button"
								onClick={() => editCommentImageInputRef.current?.click()}
								disabled={uploadingEditCommentImage || submittingEditComment}
							>
								<FaImage /> {t('pages.forum.actions.chooseAnotherImage')}
							</button>
							<button
								type="button"
								onClick={handleSaveEditedComment}
								disabled={uploadingEditCommentImage || submittingEditComment}
							>
								{submittingEditComment
									? t('pages.forum.actions.saving', { defaultValue: 'Đang lưu...' })
									: uploadingEditCommentImage
										? t('pages.forum.actions.uploadingImage')
										: t('pages.forum.actions.saveEdit')}
							</button>
							<button
								type="button"
								onClick={closeEditCommentModal}
								disabled={uploadingEditCommentImage || submittingEditComment}
							>
								{t('common.actions.cancel')}
							</button>
						</div>
					</div>
				</div>
			) : null}

			{reportingPost ? (
				<Modal
					open
					onCancel={closePostReportModal}
					onOk={handleSubmitPostReport}
					okText={t('pages.forum.actions.submitReport', { defaultValue: 'Gửi báo cáo' })}
					cancelText={t('common.actions.cancel')}
					confirmLoading={submittingPostReport}
					okButtonProps={{
						disabled: !String(postReportReason || '').trim(),
					}}
					title={t('pages.forum.reportPostModalTitle', { defaultValue: 'Báo cáo bài viết' })}
					centered
				>
					<div className={styles.reportModalBody}>
						<p className={styles.reportMetaText}>
							{t('pages.forum.reportPostBy', {
								defaultValue: 'Bạn đang báo cáo bài viết của {{name}}',
								name: reportingPost.authorName,
							})}
						</p>

						{reportingPost.title || reportingPost.content ? (
							<p className={styles.reportPreviewText}>
								{reportingPost.title ? `${reportingPost.title}\n` : ''}
								{reportingPost.content}
							</p>
						) : null}

						<Select
							value={postReportReason || undefined}
							onChange={setPostReportReason}
							placeholder={t('pages.forum.placeholders.reportPostReason', {
								defaultValue: 'Chọn lý do báo cáo',
							})}
							options={postReportReasonOptions}
						/>

						<textarea
							className={styles.reportTextarea}
							value={postReportDetail}
							onChange={(event) => setPostReportDetail(event.target.value)}
							placeholder={t('pages.forum.placeholders.reportPostDetail', {
								defaultValue: 'Mô tả thêm (không bắt buộc)',
							})}
						/>
					</div>
				</Modal>
			) : null}

			{reportingComment ? (
				<Modal
					open
					onCancel={closeReportModal}
					onOk={handleSubmitCommentReport}
					okText={t('pages.forum.actions.submitReport', { defaultValue: 'Gửi tố cáo' })}
					cancelText={t('common.actions.cancel')}
					confirmLoading={submittingReport}
					okButtonProps={{
						disabled: !String(reportReason || '').trim(),
					}}
					style={{textAlign: 'center'}}
					centered
				>
					<div className={styles.reportModalBody}>
						<h3>{t('pages.forum.reportModalTitle', { defaultValue: 'TỐ CÁO BÌNH LUẬN' })}</h3>
						<p className={styles.reportMetaText}>
							{t('pages.forum.reportCommentBy', {
								defaultValue: 'Bạn đang tố cáo bình luận của {{name}}',
								name: reportingComment.commentOwnerName,
							})}
						</p>
						{reportingComment.content ? (
							<p className={styles.reportPreviewText}>{reportingComment.content}</p>
						) : null}
						<textarea
							className={styles.reportTextarea}
							value={reportReason}
							onChange={(event) => setReportReason(event.target.value)}
							placeholder={t('pages.forum.placeholders.reportReason', { defaultValue: 'Nhập nội dung tố cáo...' })}
						/>
					</div>
				</Modal>
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
				<img src={previewImageSrc} alt={t('pages.forum.previewImageAlt')} className={styles.previewModalImage} />
			</Modal>

			<ScrollToTopButton threshold={300} containerRef={feedScrollRef} />
		</div>
	)
}

export default Forum

