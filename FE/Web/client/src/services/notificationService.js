import { formatDateDDMMYYYY, formatTimeHHMM } from '../utils/dateTimeFormat';
import i18n from '../i18n';
import { getClientInstance } from './apiClient';

const DEFAULT_LIMIT = 120;

export const NOTIFICATION_FILTER = {
  ALL: 'ALL',
  UNREAD: 'UNREAD',
};

const normalizeText = (value) => String(value || '').trim();
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
  const target = notificationItem?.target || {};
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
    return resolveExamPortalPath(effectivePortal);
  }

  if (beType === 'COMMENT_REPLY') {
    return target?.postId ? `/forum?post=${target.postId}` : '/forum';
  }

  return null;
};

export const mapBeNotification = (raw) => {
  if (!raw || !raw.id) return null;

  const normalizedType = normalizeText(raw.type).toUpperCase();
  const base = {
    id: raw.id,
    createdAt: raw.createdAt || new Date().toISOString(),
    beType: normalizedType,
    target: raw.target || {},
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
              raw.target?.userName ||
              t('header.notifications.events.actorFallback', 'customer'),
          },
        ),
        description: buildAppointmentDescription(normalizedType, raw.target),
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
        description: buildAppointmentDescription(normalizedType, raw.target),
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
        description: buildAppointmentDescription(normalizedType, raw.target),
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
        description: buildAppointmentDescription(normalizedType, raw.target),
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
              raw.target?.petName ||
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
        description: raw.target?.petName
          ? t(
              'header.notifications.events.followUpReminderWithPetDescription',
              'It is time for a follow-up visit for {{petName}}.',
              { petName: raw.target.petName },
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
        type: 'forum-comment',
        title: t(
          'header.notifications.events.commentReplyTitle',
          'Someone replied to your comment',
        ),
        description:
          raw.target?.content ||
          t(
            'header.notifications.events.commentReplyFallbackDescription',
            'See details in forum.',
          ),
        href: raw.target?.postId ? `/forum?post=${raw.target.postId}` : '/forum',
      };

    default:
      return {
        ...base,
        type: 'system',
        title: t('header.notifications.events.defaultTitle', 'New notification'),
        description: '',
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
