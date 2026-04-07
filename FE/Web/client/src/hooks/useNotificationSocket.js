import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_BASE_URL =
  (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
const SOCKET_URL = `${SOCKET_BASE_URL}/notification`;

const MAX_STORED_NOTIFICATIONS = 200;
const MAX_STORED_READ_IDS = 500;
const RECONNECT_ATTEMPTS = 15;
const RECONNECT_DELAY_MS = 3000;
const RECONNECT_DELAY_MAX_MS = 15000;

const readStorageJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

/**
 * Maps a raw BE notification entity to a display-friendly shape
 * used by all layout notification panels.
 */
export const mapBeNotification = (raw) => {
  if (!raw || !raw.id) return null;

  const base = {
    id: raw.id,
    createdAt: raw.createdAt,
    senderType: raw.senderType,
    beType: raw.type,
    target: raw.target,
  };

  switch (raw.type) {
    case 'APPOINTMENT_BOOKED':
      return {
        ...base,
        type: 'appointment',
        title: `Lịch hẹn mới từ ${raw.target?.userName || 'khách hàng'}`,
        description: `Ngày ${raw.target?.appointmentDate || ''} lúc ${raw.target?.appointmentTime || ''}`,
        href: null,
      };

    case 'APPOINTMENT_CANCELLED':
      return {
        ...base,
        type: 'appointment',
        title: 'Lịch hẹn đã bị hủy',
        description: `Lịch hẹn ngày ${raw.target?.appointmentDate || ''} lúc ${raw.target?.appointmentTime || ''} đã bị hủy.`,
        href: null,
      };

    case 'APPOINTMENT_REMINDER':
      return {
        ...base,
        type: 'system',
        title: 'Nhắc nhở lịch hẹn',
        description: `Bạn có lịch hẹn vào ngày ${raw.target?.appointmentDate || ''} lúc ${raw.target?.appointmentTime || ''}.`,
        href: null,
      };

    case 'AI_DIAGNOSIS':
      return {
        ...base,
        type: 'ai-diagnosis',
        title: `Kết quả chẩn đoán AI cho ${raw.target?.petName || 'thú cưng'}`,
        description: 'Kết quả phân tích sức khỏe từ AI đã sẵn sàng.',
        href: '/appointments',
      };

    case 'FOLLOW_UP_REMINDER':
      return {
        ...base,
        type: 'system',
        title: 'Nhắc nhở tái khám',
        description: raw.target?.petName
          ? `Đã đến lịch tái khám cho ${raw.target.petName}.`
          : 'Bạn có lịch tái khám sắp tới.',
        href: '/appointments',
      };

    case 'COMMENT_REPLY':
      return {
        ...base,
        type: 'forum-comment',
        title: 'Có người trả lời bình luận của bạn',
        description: raw.target?.content || 'Xem chi tiết trong diễn đàn.',
        href: raw.target?.postId ? `/forum?post=${raw.target.postId}` : '/forum',
      };

    default:
      return {
        ...base,
        type: 'system',
        title: 'Thông báo mới',
        description: '',
        href: null,
      };
  }
};

/**
 * Custom hook that manages a Socket.io connection to the BE notification
 * gateway, persists received notifications in localStorage, and exposes
 * read/unread management helpers.
 *
 * @param {object}  options
 * @param {string}  options.storageKey  - localStorage prefix (unique per role/user)
 * @param {string}  options.token       - JWT access token for the WebSocket handshake
 * @param {boolean} [options.enabled]   - set to false to skip connecting (default true)
 */
export default function useNotificationSocket({ storageKey, token, enabled = true }) {
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;

  // ── Load persisted data when storageKey changes ──
  useEffect(() => {
    if (!storageKey) return;

    const items = readStorageJson(`${storageKey}:items`, []);
    const stored = readStorageJson(`${storageKey}:read`, []);

    setNotifications(Array.isArray(items) ? items : []);
    setReadIds(Array.isArray(stored) ? stored : []);
  }, [storageKey]);

  // ── Socket connection ──
  useEffect(() => {
    if (!enabled || !token) return;

    const socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket'],
      auth: { accessToken: token },
      reconnection: true,
      reconnectionAttempts: RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY_MS,
      reconnectionDelayMax: RECONNECT_DELAY_MAX_MS,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[useNotificationSocket] ✅ Connected (key=${storageKeyRef.current})`, socket.id);
      setConnected(true);
    });
    socket.on('disconnect', () => {
      console.log(`[useNotificationSocket] ❌ Disconnected (key=${storageKeyRef.current})`);
      setConnected(false);
    });

    socket.on('severSendNotification', (data) => {
      console.log(`[useNotificationSocket] 📩 Nhận notification (key=${storageKeyRef.current}):`, data);
      const mapped = mapBeNotification(data);
      if (!mapped) return;

      setNotifications((prev) => {
        if (prev.some((n) => n.id === mapped.id)) return prev;

        const next = [mapped, ...prev].slice(0, MAX_STORED_NOTIFICATIONS);
        const key = storageKeyRef.current;
        if (key) {
          try {
            localStorage.setItem(`${key}:items`, JSON.stringify(next));
          } catch { /* quota exceeded – non-critical */ }
        }
        return next;
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled, token]);

  // ── Persist helpers ──
  const persistReadIds = useCallback(
    (nextIds) => {
      if (!storageKey) return;
      try {
        localStorage.setItem(
          `${storageKey}:read`,
          JSON.stringify(nextIds.slice(-MAX_STORED_READ_IDS)),
        );
      } catch { /* non-critical */ }
    },
    [storageKey],
  );

  const markAsRead = useCallback(
    (id) => {
      if (!id) return;
      setReadIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        persistReadIds(next);
        return next;
      });
    },
    [persistReadIds],
  );

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const allIds = notifications.map((n) => n.id);
      const merged = Array.from(new Set([...prev, ...allIds]));
      persistReadIds(merged);
      return merged;
    });
  }, [notifications, persistReadIds]);

  const readIdSet = useMemo(() => new Set(readIds), [readIds]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIdSet.has(n.id)).length,
    [notifications, readIdSet],
  );

  return {
    notifications,
    readIdSet,
    unreadCount,
    markAsRead,
    markAllAsRead,
    connected,
  };
}
