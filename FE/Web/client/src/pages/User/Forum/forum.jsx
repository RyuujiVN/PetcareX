import {
	FaEllipsis,
	FaImage,
	FaRegComment,
	FaRegFaceSmile,
	FaRegThumbsUp,
	FaShareNodes,
} from 'react-icons/fa6'
import { IoAt } from 'react-icons/io5'
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Footer from '../../../components/layout/footer'
import Header from '../../../components/layout/header'
import styles from './forum.module.css'

const categoryTabs = [
	{ id: 'all', label: 'Tất cả' },
	{ id: 'kinh-nghiem-nuoi', label: 'Kinh nghiệm nuôi' },
	{ id: 'hoi-dap-bac-si', label: 'Hỏi đáp bác sĩ' },
	{ id: 'canh-bao-dich-benh', label: 'Cảnh báo dịch bệnh' },
]

const feedPosts = [
	{
		id: '1',
		author: 'Minh Anh',
		time: '2 giờ trước',
		tag: 'KINH NGHIỆM NUÔI',
		tagType: 'kinh-nghiem-nuoi',
		content:
			'Mọi người ơi, bé Corgi nhà mình dạo này kén ăn quá. Mình có thử đổi hạt sang loại này (hình bên dưới) thấy bé ăn ngon lành hẳn luôn. Có ai gặp tình trạng này chưa?',
		image: '/forum1.png',
		likes: 128,
		comments: 42,
		avatar: '/thanhThuy.png',
	},
	{
		id: '2',
		author: 'Dr. Thanh (Thú y)',
		time: '5 giờ trước',
		tag: 'CẢNH BÁO DỊCH BỆNH',
		tagType: 'canh-bao-dich-benh',
		content:
			'CẢNH BÁO: Đang có dấu hiệu bùng phát dịch Parvo tại khu vực Quận 7. Các chủ nuôi lưu ý kiểm tra lịch tiêm phòng của bé và hạn chế cho bé tiếp xúc với chó lạ tại công viên trong thời gian này.',
		likes: 352,
		comments: 15,
		avatarText: 'DR',
	},
	{
		id: '3',
		author: 'Trần Hoàng',
		time: '8 giờ trước',
		tag: 'HỎI ĐÁP BÁC SĨ',
		tagType: 'hoi-dap-bac-si',
		avatar: '/avatarMain.png',
	},
]

const topContributors = [
	{
		id: 'c1',
		name: 'Dr. Nguyễn Văn Chương',
		score: '1.2K Câu trả lời hữu ích',
		rank: '#1',
		avatar: '/bs1.png',
	},
	{
		id: 'c2',
		name: 'BS. Đỗ Hoàng Mạnh',
		score: '850 Bài viết',
		rank: '#2',
		avatar: '/bs2.png',
	},
	{
		id: 'c3',
		name: 'ThS. Lê Quang Đại',
		score: '620 Bài viết',
		rank: '#3',
		avatar: '/bs3.png',
	},
]

const featuredPosts = [
	{
		id: 'f1',
		heading: 'Thịnh hành trong Dinh dưỡng',
		title: 'Poodle nên ăn gì để bổ sung lợi khuẩn?',
		meta: '2.4k bài viết tuần này',
	},
	{
		id: 'f2',
		heading: 'Thịnh hành trong Huấn luyện',
		title: 'Corgi nên chơi thể thao nào?',
		meta: '1.8k bài viết tuần này',
	},
	{
		id: 'f3',
		heading: 'Thịnh hành trong Sức khỏe',
		title: 'Các loại vaccin cho Poodle?',
		meta: '950 bài viết tuần này',
	},
]

function Forum() {
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const composerRef = useRef(null)

	const activeTab = useMemo(() => {
		const tab = searchParams.get('tab') || 'all'
		return categoryTabs.some((item) => item.id === tab) ? tab : 'all'
	}, [searchParams])

	const selectedPost = searchParams.get('post')
	const isComposerOpen = searchParams.get('composer') === 'open'

	useEffect(() => {
		if (isComposerOpen && composerRef.current) {
			composerRef.current.focus()
		}
	}, [isComposerOpen])

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

	const visiblePosts = feedPosts.filter((post) => {
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
							<img src="/bs4.png" alt="avatar" className={styles.composeAvatar} />
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
								onClick={() => updateParams({ composer: 'open' })}
							>
								Đăng bài
							</button>
						</div>
					</div>

					<div className={styles.tabRow}>
						{categoryTabs.map((tab) => (
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
						{visiblePosts.map((post) => (
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

									{post.id === '1' ? (
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
										onClick={() => updateParams({ post: post.id })}
									/>
								) : null}

								{typeof post.likes === 'number' && typeof post.comments === 'number' ? (
									<footer className={styles.postFooter}>
										<button type="button" onClick={() => updateParams({ post: post.id })}>
											<FaRegThumbsUp /> {post.likes}
										</button>
										<button type="button" onClick={() => updateParams({ post: post.id })}>
											<FaRegComment /> {post.comments}
										</button>
										<button type="button" className={styles.shareBtn} onClick={() => updateParams({ post: post.id })}>
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
									onClick={() => updateParams({ post: String(index + 1) })}
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
