import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import i18n from '../i18n';
import { getClientInstance } from '../services/apiClient';
import {
  getNotificationsApi,
  mapBeNotification,
  markAllNotificationsAsReadApi,
  markNotificationAsReadApi,
} from '../services/notificationService';

const SOCKET_BASE_URL =
  (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
const SOCKET_URL = `${SOCKET_BASE_URL}/notification`;

const MAX_STORED_NOTIFICATIONS = 200;
const REFRESH_INTERVAL_MS = 60000;
const RECONNECT_ATTEMPTS = 15;
const RECONNECT_DELAY_MS = 3000;
const RECONNECT_DELAY_MAX_MS = 15000;

const safeDateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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
      dedupMap.set(item.id, { ...item, isRead: Boolean(item.isRead || existing.isRead) });
      return;
    }

    dedupMap.set(existing.id, { ...existing, isRead: Boolean(existing.isRead || item.isRead) });
  });

  return Array.from(dedupMap.values())
    .sort((a, b) => {
      const first = safeDateValue(a?.createdAt)?.getTime() || 0;
      const second = safeDateValue(b?.createdAt)?.getTime() || 0;
      return second - first;
    })
    .slice(0, MAX_STORED_NOTIFICATIONS);
};

const isNotFoundNotificationError = (error) => {
  if (error?.response?.status === 404) return true;
  const message = String(error?.message || '').toLowerCase();
  return message.includes('không tìm thấy thông báo') || message.includes('khong tim thay thong bao');
};

const emitPostLikedRealtime = (notification) => {
  const postId = String(notification?.postId || notification?.target?.postId || '').trim();
  if (!postId || typeof window === 'undefined') return;

  const detail = {
    postId,
    notificationId: notification?.id || null,
  };

  window.dispatchEvent(new CustomEvent('notif:postLiked', { detail }));
  window.dispatchEvent(new CustomEvent('refreshPost', { detail }));
};

/**
 * Shared notification hook for all portals.
 * - Hydrates initial/history notifications from backend REST API.
 * - Subscribes realtime updates from the notification socket namespace.
 * - Syncs read/unread state back to backend with mark-one/mark-all APIs.
 */
export default function useNotificationSocket({
  storageKey,
  token,
  enabled = true,
  instance,
}) {
  const [notifications, setNotifications] = useState([]);
  const [latestIncomingNotification, setLatestIncomingNotification] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const storageKeyRef = useRef(storageKey || 'unknown');
  storageKeyRef.current = storageKey || 'unknown';
  const apiInstance = instance || getClientInstance();

  const refreshNotifications = useCallback(async () => {
    if (!enabled || !token) return;

    setLoading(true);
    try {
      const payload = await getNotificationsApi(apiInstance, {
        limit: MAX_STORED_NOTIFICATIONS,
      });

      setNotifications(Array.isArray(payload?.items) ? payload.items : []);
    } catch {
      // ignore fetch failures; socket stream still works
    } finally {
      setLoading(false);
    }
  }, [apiInstance, enabled, token]);

  useEffect(() => {
    if (!enabled || !token) {
      setNotifications([]);
      return undefined;
    }

    void refreshNotifications();

    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, token, refreshNotifications]);

  useEffect(() => {
    if (!enabled || !token) return undefined;

    const handleLanguageChanged = () => {
      void refreshNotifications();
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [enabled, token, refreshNotifications]);

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

      if (mapped?.type === 'forum-like') {
        emitPostLikedRealtime(mapped);
      }

      if (mapped?.type === 'appointment' && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notif:appointment', { detail: mapped }));
      }

      setLatestIncomingNotification(mapped);

      setNotifications((prev) => {
        return sortAndLimitNotifications([mapped, ...prev]);
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled, token]);

  const markAsRead = useCallback(async (id) => {
    if (!id) return;

    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );

    try {
      await markNotificationAsReadApi(apiInstance, id);
    } catch (error) {
      if (isNotFoundNotificationError(error)) return;
      void refreshNotifications();
    }
  }, [apiInstance, refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    const hasUnread = notifications.some((item) => !item.isRead);
    if (!hasUnread) return;

    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));

    try {
      await markAllNotificationsAsReadApi(apiInstance);
    } catch (error) {
      if (isNotFoundNotificationError(error)) return;
      void refreshNotifications();
    }
  }, [apiInstance, notifications, refreshNotifications]);

  const readIdSet = useMemo(() => {
    const ids = notifications.filter((item) => item?.isRead).map((item) => item.id);
    return new Set(ids);
  }, [notifications]);

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
    loading,
    refreshNotifications,
    latestIncomingNotification,
  };
}
