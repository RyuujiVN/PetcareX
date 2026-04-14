import { formatDateDDMMYYYY, formatTimeHHMM } from '../utils/dateTimeFormat';
import i18n from '../i18n';
import { getClientInstance } from './apiClient';

const DEFAULT_LIMIT = 120;

export const NOTIFICATION_FILTER = {
  ALL: 'ALL',
  UNREAD: 'UNREAD',
};

const normalizeText = (value) => String(value || '').trim();
const normalizeId = (value) => {
  const text = normalizeText(value);
  return text || null;
};
const pickFirstText = (...values) => {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) return normalized;
  }

  return '';
};
const toObject = (value) => (value && typeof value === 'object' ? value : {});
const t = (key, defaultValue, options = {}) =>
  i18n.t(key, { defaultValue, ...options });

const safeDateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatNotificationDate = (value) =>
  formatDateDDMMYYYY(value, normalizeText(value));

const formatNotificationTime = (value) =>
  formatTimeHHMM(value, normalizeText(value));

const buildNotificationTarget = (rawTarget) => {
  const target = toObject(rawTarget);

  return {
    ...target,
    appointmentId: normalizeId(target?.appointmentId || target?.appointment?.id),
    postId: normalizeId(target?.postId || target?.post?.id),
    commentId: normalizeId(
      target?.commentId || target?.comment?.id || target?.replyId || target?.parentCommentId,
    ),
  };
};

const resolveSenderName = (raw = {}, target = {}) =>
  pickFirstText(
    raw?.senderName,
    target?.senderName,
    target?.authorName,
    target?.actorName,
    target?.userName,
    target?.sender?.fullName,
    target?.author?.fullName,
    target?.user?.fullName,
  );

const resolveSenderAvatar = (raw = {}, target = {}) =>
  pickFirstText(
    raw?.senderAvatar,
    target?.senderAvatar,
    target?.authorAvatar,
    target?.actorAvatar,
    target?.userAvatar,
    target?.sender?.avatarUrl,
    target?.author?.avatarUrl,
    target?.user?.avatarUrl,
  );

const resolveForumInteractionType = (beType, target = {}) => {
  const normalizedBeType = normalizeText(beType).toUpperCase();
  const hint = [
    normalizedBeType,
    target?.actionType,
    target?.eventType,
    target?.notificationType,
    target?.interactionType,
  ]
    .map((value) => normalizeText(value).toLowerCase())
    .join(' ');

  if (hint.includes('like')) return 'forum-like';
  if (hint.includes('reply')) return 'forum-reply';
  if (hint.includes('comment')) return 'forum-comment';

  if (normalizedBeType === 'COMMENT_REPLY') return 'forum-reply';
  if (normalizedBeType.includes('LIKE')) return 'forum-like';
  if (normalizedBeType.includes('REPLY')) return 'forum-reply';
  if (normalizedBeType.includes('COMMENT')) return 'forum-comment';

  return null;
};

const buildForumHref = (target = {}, forumInteractionType = null) => {
  const postId = normalizeId(target?.postId);
  const commentId = normalizeId(target?.commentId);

  if (!postId) return '/forum';
  if (forumInteractionType === 'forum-like') return `/forum?postId=${postId}`;
  if (commentId) return `/forum?postId=${postId}&commentId=${commentId}`;

  return `/forum?postId=${postId}`;
};

const buildAppointmentDescription = (beType, target = {}) => {
  const dateText = formatNotificationDate(target?.appointmentDate);
  const timeText = formatNotificationTime(target?.appointmentTime);

  if (beType === 'APPOINTMENT_BOOKED') {
    return t(
      'header.notifications.events.appointmentBookedDescription',
      'Date {{date}} at {{time}}',
      {
        date: dateText,
        time: timeText,
      },
    );
  }

  if (beType === 'APPOINTMENT_CANCELLED') {
    return t(
      'header.notifications.events.appointmentCancelledDescription',
      'The appointment on {{date}} at {{time}} has been canceled.',
      {
        date: dateText,
        time: timeText,
      },
    );
  }

  if (beType === 'APPOINTMENT_REMINDER') {
    return t(
      'header.notifications.events.appointmentReminderDescription',
      'You have an appointment on {{date}} at {{time}}.',
      {
        date: dateText,
        time: timeText,
      },
    );
  }

  if (beType === 'APPOINTMENT_STATUS_UPDATED_BY_CLIENT') {
    return t(
      'header.notifications.events.appointmentStatusUpdatedByClientDescription',
      'Customer updated appointment status for {{date}} at {{time}}.',
      {
        date: dateText,
        time: timeText,
      },
    );
  }

  return '';
};

const normalizePortal = (portal) => {
  const normalized = normalizeText(portal).toLowerCase();
  if (normalized === 'clinic') return 'clinic';
  if (normalized === 'veterinarian' || normalized === 'vet') return 'veterinarian';
  return 'client';
};

const resolveAppointmentPortalPath = (portal) => {
  if (portal === 'clinic') return '/clinic/appointments';
  if (portal === 'veterinarian') return '/veterinarian/appointments';
  return '/appointments';
};

const resolveExamPortalPath = (portal) => {
  if (portal === 'clinic') return '/clinic/exam-slips';
  if (portal === 'veterinarian') return '/veterinarian/exam-forms';
  return '/appointments';
};

export const resolveNotificationHref = (notificationItem, portal = 'client') => {
  const effectivePortal = normalizePortal(portal);
  const beType = normalizeText(notificationItem?.beType).toUpperCase();
  const target = buildNotificationTarget(notificationItem?.target);
  const forumInteractionType = resolveForumInteractionType(beType, target);
  const href = normalizeText(notificationItem?.href);

  if (href) {
    if (href === '/appointments') {
      return resolveAppointmentPortalPath(effectivePortal);
    }

    return href;
  }

  if (beType.startsWith('APPOINTMENT')) {
    return resolveAppointmentPortalPath(effectivePortal);
  }

  if (beType === 'AI_DIAGNOSIS') {
    if (effectivePortal === 'client' && target?.appointmentId) {
      return `/appointments?openDiagnosis=${target.appointmentId}`;
    }

    return resolveExamPortalPath(effectivePortal);
  }

  if (forumInteractionType) {
    return buildForumHref(target, forumInteractionType);
  }

  return null;
};

export const mapBeNotification = (raw) => {
  if (!raw || !raw.id) return null;

  const normalizedType = normalizeText(raw.type).toUpperCase();
  const target = buildNotificationTarget(raw.target);
  const senderName = resolveSenderName(raw, target);
  const senderAvatar = resolveSenderAvatar(raw, target);
  const forumInteractionType = resolveForumInteractionType(normalizedType, target);
  const fallbackTitle = pickFirstText(raw?.title, raw?.message, target?.title);
  const fallbackDescription = pickFirstText(raw?.description, target?.description, target?.content);
  const base = {
    id: raw.id,
    createdAt: raw.createdAt || new Date().toISOString(),
    beType: normalizedType,
    target,
    appointmentId: target?.appointmentId,
    postId: target?.postId,
    commentId: target?.commentId,
    senderName: senderName || null,
    senderAvatar: senderAvatar || null,
    avatarUrl: senderAvatar || null,
    isRead: Boolean(raw.isRead),
    href: null,
  };

  switch (normalizedType) {
    case 'APPOINTMENT_BOOKED':
      return {
        ...base,
        type: 'appointment',
        title: t(
          'header.notifications.events.appointmentBookedTitle',
          'New appointment from {{name}}',
          {
            name:
              target?.userName ||
              t('header.notifications.events.actorFallback', 'customer'),
          },
        ),
        description: buildAppointmentDescription(normalizedType, target),
        href: '/appointments',
      };

    case 'APPOINTMENT_CANCELLED':
      return {
        ...base,
        type: 'appointment',
        title: t(
          'header.notifications.events.appointmentCancelledTitle',
          'Appointment canceled',
        ),
        description: buildAppointmentDescription(normalizedType, target),
        href: '/appointments',
      };

    case 'APPOINTMENT_REMINDER':
      return {
        ...base,
        type: 'system',
        title: t(
          'header.notifications.events.appointmentReminderTitle',
          'Appointment reminder',
        ),
        description: buildAppointmentDescription(normalizedType, target),
        href: '/appointments',
      };

    case 'APPOINTMENT_STATUS_UPDATED_BY_CLIENT':
      return {
        ...base,
        type: 'appointment',
        title: t(
          'header.notifications.events.appointmentStatusUpdatedByClientTitle',
          'Customer updated appointment status',
        ),
        description: buildAppointmentDescription(normalizedType, target),
        href: '/appointments',
      };

    case 'AI_DIAGNOSIS':
      return {
        ...base,
        type: 'ai-diagnosis',
        title: t(
          'header.notifications.events.aiDiagnosisTitle',
          'AI diagnosis result for {{petName}}',
          {
            petName:
              target?.petName ||
              t('header.notifications.events.petFallback', 'pet'),
          },
        ),
        description: t(
          'header.notifications.events.aiDiagnosisDescription',
          'AI health analysis is ready.',
        ),
        href: '/appointments',
      };

    case 'FOLLOW_UP_REMINDER':
      return {
        ...base,
        type: 'system',
        title: t(
          'header.notifications.events.followUpReminderTitle',
          'Follow-up reminder',
        ),
        description: target?.petName
          ? t(
              'header.notifications.events.followUpReminderWithPetDescription',
              'It is time for a follow-up visit for {{petName}}.',
              { petName: target.petName },
            )
          : t(
              'header.notifications.events.followUpReminderDescription',
              'You have an upcoming follow-up appointment.',
            ),
        href: '/appointments',
      };

    case 'COMMENT_REPLY':
      return {
        ...base,
        type: forumInteractionType || 'forum-reply',
        title: t(
          'header.notifications.events.commentReplyTitle',
          'Someone replied to your comment',
        ),
        description:
          fallbackDescription ||
          t(
            'header.notifications.events.commentReplyFallbackDescription',
            'See details in forum.',
          ),
        href: buildForumHref(target, forumInteractionType || 'forum-reply'),
      };

    default:
      if (forumInteractionType) {
        return {
          ...base,
          type: forumInteractionType,
          title:
            fallbackTitle ||
            t('header.notifications.events.defaultTitle', 'New notification'),
          description:
            fallbackDescription ||
            t(
              'header.notifications.events.commentReplyFallbackDescription',
              'See details in forum.',
            ),
          href: buildForumHref(target, forumInteractionType),
        };
      }

      return {
        ...base,
        type: 'system',
        title:
          fallbackTitle ||
          t('header.notifications.events.defaultTitle', 'New notification'),
        description: fallbackDescription,
      };
  }
};

const normalizeNotificationList = (items = [], limit = DEFAULT_LIMIT) => {
  const dedupMap = new Map();

  items.forEach((item) => {
    const mapped = mapBeNotification(item);
    if (!mapped?.id) return;

    const existing = dedupMap.get(mapped.id);
    if (!existing) {
      dedupMap.set(mapped.id, mapped);
      return;
    }

    const existingTime = safeDateValue(existing.createdAt)?.getTime() || 0;
    const currentTime = safeDateValue(mapped.createdAt)?.getTime() || 0;

    if (currentTime >= existingTime) {
      dedupMap.set(mapped.id, mapped);
    }
  });

  return Array.from(dedupMap.values())
    .sort((a, b) => {
      const left = safeDateValue(a?.createdAt)?.getTime() || 0;
      const right = safeDateValue(b?.createdAt)?.getTime() || 0;
      return right - left;
    })
    .slice(0, limit);
};

export const getNotificationsApi = async (
  instance,
  { limit = DEFAULT_LIMIT, filter = NOTIFICATION_FILTER.ALL, createdAt } = {},
) => {
  const normalizedFilter =
    normalizeText(filter).toUpperCase() === NOTIFICATION_FILTER.UNREAD
      ? NOTIFICATION_FILTER.UNREAD
      : NOTIFICATION_FILTER.ALL;

  const response = await instance.get('/notification', {
    params: {
      limit,
      filter: normalizedFilter,
      ...(createdAt ? { createdAt } : {}),
    },
  });

  const payload = response?.data || {};
  const rawItems = Array.isArray(payload?.data) ? payload.data : [];

  return {
    items: normalizeNotificationList(rawItems, limit),
    totalUnread: Number(payload?.totalUnread || 0),
  };
};

export const markNotificationAsReadApi = async (instance, notificationId) => {
  if (!notificationId) return null;

  const response = await instance.patch(`/notification/mark-one/${notificationId}`);
  return response?.data;
};

export const markAllNotificationsAsReadApi = async (instance) => {
  const response = await instance.patch('/notification/mark-all');
  return response?.data;
};

export const loadClientNotifications = async ({
  instance = getClientInstance(),
  limit = DEFAULT_LIMIT,
  filter = NOTIFICATION_FILTER.ALL,
  previousLikeSnapshot = {},
} = {}) => {
  const payload = await getNotificationsApi(instance, { limit, filter });

  return {
    items: payload.items,
    totalUnread: payload.totalUnread,
    nextLikeSnapshot: previousLikeSnapshot,
    hasPartialFailure: false,
  };
};
