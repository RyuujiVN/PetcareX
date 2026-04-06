import { getAppointmentStatusLabel, getServiceLabel } from '../../../utils/enumLabel';
import { getMyAppointmentsApi } from './appointmentApi';
import { getReplies } from './commentApi';
import { getCommentsByPostId, getPosts } from './postApi';

const MAX_APPOINTMENTS = 120;
const MAX_FORUM_POSTS = 120;
const MAX_OWN_POSTS_SCAN = 10;
const MAX_COMMENTS_PER_POST = 40;
const MAX_REPLIES_PER_COMMENT = 30;
const MAX_REPLY_THREADS_PER_POST = 12;
const MAX_NOTIFICATIONS = 120;

const IMAGE_TOKEN_REGEX = /\[\[img:(.*?)\]\]/g;
const TITLE_TOKEN_REGEX = /^\s*\[\[title:(.*?)\]\]\s*/i;

const normalizeText = (value) => String(value || '').trim();

const safeDateValue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const formatAppointmentDateTime = (appointmentDate, appointmentTime) => {
  const dateText = normalizeText(appointmentDate);
  const timeText = normalizeText(appointmentTime);

  if (!dateText || !timeText) return null;

  const date = safeDateValue(`${dateText}T${timeText}`);
  return date ? date.toISOString() : null;
};

const buildPostPreview = (content = '') => {
  const withoutImageToken = String(content || '').replace(IMAGE_TOKEN_REGEX, '').trim();
  const withoutTitleToken = withoutImageToken.replace(TITLE_TOKEN_REGEX, '').trim();

  if (!withoutTitleToken) {
    return 'Bai viet co hinh anh';
  }

  if (withoutTitleToken.length <= 110) {
    return withoutTitleToken;
  }

  return `${withoutTitleToken.slice(0, 110).trim()}...`;
};

const buildCommentPreview = (content = '') => {
  const cleaned = String(content || '').replace(IMAGE_TOKEN_REGEX, '').trim();
  if (!cleaned) return 'Da gui hinh anh';

  if (cleaned.length <= 100) return cleaned;
  return `${cleaned.slice(0, 100).trim()}...`;
};

const buildAppointmentNotifications = (appointments = []) => {
  return appointments
    .map((appointment) => {
      const appointmentDate = normalizeText(appointment?.appointmentDate);
      const appointmentTime = normalizeText(appointment?.appointmentTime);
      const status = normalizeText(appointment?.status);

      if (!appointmentDate || !appointmentTime || !status) return null;

      const createdAt = formatAppointmentDateTime(appointmentDate, appointmentTime) || new Date().toISOString();
      const petName = normalizeText(appointment?.pet?.name) || 'Thu cung';
      const clinicName = normalizeText(appointment?.clinic?.name) || 'Phong kham';
      const serviceLabel = getServiceLabel(appointment?.service, normalizeText(appointment?.service) || 'Dich vu kham');
      const statusLabel = getAppointmentStatusLabel(status, status);

      return {
        id: `appointment-${appointment.id}-${status}-${appointmentDate}-${appointmentTime}`,
        type: 'appointment',
        title: `${statusLabel}: ${petName}`,
        description: `${appointmentDate} ${appointmentTime} - ${serviceLabel} tai ${clinicName}`,
        createdAt,
        href: '/appointments',
      };
    })
    .filter(Boolean);
};

const buildLikeCountNotifications = ({ ownPosts, previousLikeSnapshot }) => {
  const nextLikeSnapshot = { ...(previousLikeSnapshot || {}) };
  const notifications = [];
  const hasSnapshotHistory = Object.keys(previousLikeSnapshot || {}).length > 0;

  ownPosts.forEach((post) => {
    const postId = normalizeText(post?.id);
    if (!postId) return;

    const currentLikeCount = Number(post?.likeCount || 0);
    const previousLikeCount = Number(previousLikeSnapshot?.[postId] ?? currentLikeCount);
    nextLikeSnapshot[postId] = currentLikeCount;

    if (!hasSnapshotHistory) return;
    if (currentLikeCount <= previousLikeCount) return;

    const delta = currentLikeCount - previousLikeCount;
    notifications.push({
      id: `forum-like-${postId}-${currentLikeCount}`,
      type: 'forum-like',
      title: `Bai viet cua ban co them ${delta} luot thich`,
      description: buildPostPreview(post?.content),
      createdAt: new Date().toISOString(),
      href: `/forum?post=${postId}`,
    });
  });

  return { notifications, nextLikeSnapshot };
};

const buildCommentAndReplyNotifications = async ({ ownPosts, userId }) => {
  const interactionNotifications = [];

  const commentTasks = ownPosts
    .filter((post) => Number(post?.commentCount || 0) > 0)
    .slice(0, MAX_OWN_POSTS_SCAN)
    .map(async (post) => {
      const postId = normalizeText(post?.id);
      if (!postId) return;

      const comments = await getCommentsByPostId(postId, { limit: MAX_COMMENTS_PER_POST });
      if (!Array.isArray(comments) || comments.length === 0) return;

      const replyTasks = [];
      let replyThreadCount = 0;

      comments.forEach((comment) => {
        const commentAuthorId = normalizeText(comment?.user?.id);
        const commentId = normalizeText(comment?.id);

        if (commentId && commentAuthorId && commentAuthorId !== userId) {
          interactionNotifications.push({
            id: `forum-comment-${commentId}`,
            type: 'forum-comment',
            title: `${normalizeText(comment?.user?.fullName) || 'Nguoi dung'} da binh luan bai viet cua ban`,
            description: buildCommentPreview(comment?.content),
            createdAt: normalizeText(comment?.createdAt) || new Date().toISOString(),
            href: `/forum?post=${postId}`,
            avatarUrl: normalizeText(comment?.user?.avatarUrl),
          });
        }

        const replyCount = Number(comment?.replyCount || 0);
        if (!commentId || replyCount <= 0 || replyThreadCount >= MAX_REPLY_THREADS_PER_POST) return;

        replyThreadCount += 1;

        replyTasks.push(
          getReplies({
            parentId: commentId,
            limit: MAX_REPLIES_PER_COMMENT,
          }).then((replies) => ({ replies, comment }))
        );
      });

      const replyResults = await Promise.allSettled(replyTasks);
      replyResults.forEach((result) => {
        if (result.status !== 'fulfilled') return;

        const { replies, comment } = result.value;
        if (!Array.isArray(replies) || replies.length === 0) return;

        replies.forEach((reply) => {
          const replyId = normalizeText(reply?.id);
          const replyAuthorId = normalizeText(reply?.user?.id);
          if (!replyId || !replyAuthorId || replyAuthorId === userId) return;

          const isReplyToCurrentUser = normalizeText(comment?.user?.id) === userId;
          interactionNotifications.push({
            id: `forum-reply-${replyId}`,
            type: 'forum-reply',
            title: isReplyToCurrentUser
              ? `${normalizeText(reply?.user?.fullName) || 'Nguoi dung'} da phan hoi binh luan cua ban`
              : `${normalizeText(reply?.user?.fullName) || 'Nguoi dung'} da phan hoi trong bai viet cua ban`,
            description: buildCommentPreview(reply?.content),
            createdAt: normalizeText(reply?.createdAt) || new Date().toISOString(),
            href: `/forum?post=${postId}`,
            avatarUrl: normalizeText(reply?.user?.avatarUrl),
          });
        });
      });
    });

  await Promise.allSettled(commentTasks);
  return interactionNotifications;
};

const sortAndLimitNotifications = (items = []) => {
  const dedupMap = new Map();

  items.forEach((item) => {
    if (!item?.id) return;

    const existing = dedupMap.get(item.id);
    if (!existing) {
      dedupMap.set(item.id, item);
      return;
    }

    const existingTime = safeDateValue(existing.createdAt)?.getTime() || 0;
    const currentTime = safeDateValue(item.createdAt)?.getTime() || 0;

    if (currentTime > existingTime) {
      dedupMap.set(item.id, item);
    }
  });

  return Array.from(dedupMap.values())
    .sort((a, b) => {
      const first = safeDateValue(a?.createdAt)?.getTime() || 0;
      const second = safeDateValue(b?.createdAt)?.getTime() || 0;
      return second - first;
    })
    .slice(0, MAX_NOTIFICATIONS);
};

export const loadClientNotifications = async ({ userId, previousLikeSnapshot = {} }) => {
  const normalizedUserId = normalizeText(userId);

  if (!normalizedUserId) {
    return {
      items: [],
      nextLikeSnapshot: previousLikeSnapshot,
      hasPartialFailure: false,
    };
  }

  const [appointmentResult, postsResult] = await Promise.allSettled([
    getMyAppointmentsApi(1, MAX_APPOINTMENTS),
    getPosts({ limit: MAX_FORUM_POSTS }),
  ]);

  let hasPartialFailure = false;
  let appointmentNotifications = [];
  let ownPosts = [];

  if (appointmentResult.status === 'fulfilled') {
    const appointmentPayload = appointmentResult.value;
    const appointmentItems = Array.isArray(appointmentPayload?.items) ? appointmentPayload.items : [];
    appointmentNotifications = buildAppointmentNotifications(appointmentItems);
  } else {
    hasPartialFailure = true;
  }

  if (postsResult.status === 'fulfilled') {
    const posts = Array.isArray(postsResult.value) ? postsResult.value : [];
    ownPosts = posts
      .filter((post) => normalizeText(post?.author?.id) === normalizedUserId)
      .slice(0, MAX_OWN_POSTS_SCAN);
  } else {
    hasPartialFailure = true;
  }

  const { notifications: likeNotifications, nextLikeSnapshot } = buildLikeCountNotifications({
    ownPosts,
    previousLikeSnapshot,
  });

  let commentAndReplyNotifications = [];
  try {
    commentAndReplyNotifications = await buildCommentAndReplyNotifications({
      ownPosts,
      userId: normalizedUserId,
    });
  } catch {
    hasPartialFailure = true;
  }

  const items = sortAndLimitNotifications([
    ...appointmentNotifications,
    ...likeNotifications,
    ...commentAndReplyNotifications,
  ]);

  return {
    items,
    nextLikeSnapshot,
    hasPartialFailure,
  };
};
