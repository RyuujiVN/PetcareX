import { ScheduleOutlined } from "@ant-design/icons";
import { Avatar, Button, Empty, Form, List, Spin, Typography } from "antd";
import { BsRobot } from "react-icons/bs";
import { FaRegCommentDots, FaRegThumbsUp, FaReply } from "react-icons/fa6";
import { IoMdNotificationsOutline } from "react-icons/io";
import styles from "./UnifiedNotificationPanel.module.css";

const resolveForumActionType = (notificationItem) => {
  const type = String(notificationItem?.type || "").toLowerCase();
  const beType = String(notificationItem?.beType || "").toUpperCase();

  if (type.includes("like") || beType.includes("LIKE")) return "like";
  if (type.includes("reply") || beType.includes("REPLY")) return "reply";
  if (type.includes("comment") || beType.includes("COMMENT")) return "comment";

  return null;
};

const getForumActionIcon = (actionType) => {
  if (actionType === "like") {
    return <FaRegThumbsUp size={11} color="#ffffff" />;
  }

  if (actionType === "reply") {
    return <FaReply size={10} color="#ffffff" />;
  }

  return <FaRegCommentDots size={11} color="#ffffff" />;
};

const getForumActionBadgeColor = (actionType) => {
  if (actionType === "like") return "#1877f2";
  return "#42b883";
};

const formatSyncTime = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "--:--";

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getNotificationIcon = (notificationItem) => {
  const type = String(notificationItem?.type || "").toLowerCase();
  const beType = String(notificationItem?.beType || "").toUpperCase();
  const forumActionType = resolveForumActionType(notificationItem);

  if (type === "ai-diagnosis" || beType === "AI_DIAGNOSIS") {
    return (
      <span className={`${styles.typeIcon} ${styles.typeIconAi}`}>
        <BsRobot />
      </span>
    );
  }

  if (
    beType === "APPOINTMENT_BOOKED" ||
    beType === "APPOINTMENT_REMINDER" ||
    beType === "FOLLOW_UP_REMINDER" ||
    type === "appointment"
  ) {
    return (
      <span className={`${styles.typeIcon} ${styles.typeIconAppointment}`}>
        <ScheduleOutlined />
      </span>
    );
  }

  if (forumActionType) {
    const senderName = String(notificationItem?.senderName || "").trim();
    const avatarUrl =
      notificationItem?.senderAvatar || notificationItem?.avatarUrl || undefined;

    return (
      <div className={styles.avatarWrap}>
        <Avatar src={avatarUrl} size={40}>
          {senderName?.[0]?.toUpperCase()}
        </Avatar>
        <span
          className={styles.forumBadge}
          style={{ background: getForumActionBadgeColor(forumActionType) }}
        >
          {getForumActionIcon(forumActionType)}
        </span>
      </div>
    );
  }

  const typeIconClass =
    type === "forum-like"
      ? styles.typeIconForumLike
      : type === "forum-comment" || type === "forum-reply"
        ? styles.typeIconForum
        : "";

  return (
    <span className={`${styles.typeIcon} ${typeIconClass}`}>
      <IoMdNotificationsOutline />
    </span>
  );
};

export default function UnifiedNotificationPanel({
  title,
  refreshLabel,
  markReadLabel,
  allLabel,
  unreadLabel,
  emptyLabel,
  syncedAtLabel,
  forumActorFallbackLabel,
  notifications,
  readIdSet,
  unreadCount,
  loading,
  filterMode,
  onFilterModeChange,
  onRefresh,
  onMarkAllRead,
  onItemClick,
  formatTimeAgo,
  buildForumActionText,
  lastSyncedAt,
}) {
  const safeReadIdSet = readIdSet instanceof Set ? readIdSet : new Set();

  const filteredNotifications =
    filterMode === "unread"
      ? notifications.filter((item) => !safeReadIdSet.has(item.id))
      : notifications;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Typography.Title level={5} className={styles.headerTitle}>
          {title}
        </Typography.Title>

        <div className={styles.actions}>
          <Button size="small" onClick={() => void onRefresh?.()}>
            {refreshLabel}
          </Button>
          <Button
            size="small"
            type="primary"
            ghost
            disabled={unreadCount === 0}
            onClick={() => void onMarkAllRead?.()}
          >
            {markReadLabel}
          </Button>
        </div>
      </div>

      <Form layout="inline" className={styles.filterForm}>
        <Form.Item className={styles.filterItem}>
          <Button
            size="small"
            type={filterMode === "all" ? "primary" : "default"}
            onClick={() => onFilterModeChange?.("all")}
          >
            {allLabel}
          </Button>
        </Form.Item>
        <Form.Item className={styles.filterItem}>
          <Button
            size="small"
            type={filterMode === "unread" ? "primary" : "default"}
            onClick={() => onFilterModeChange?.("unread")}
          >
            {unreadLabel}
          </Button>
        </Form.Item>
      </Form>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>
            <Spin />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className={styles.empty}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyLabel} />
          </div>
        ) : (
          <List
            className={styles.list}
            dataSource={filteredNotifications}
            renderItem={(item) => {
              const isUnread = !safeReadIdSet.has(item.id);
              const forumActionType = resolveForumActionType(item);
              const isForumNotification = Boolean(forumActionType);
              const actorName =
                String(item?.senderName || "").trim() || forumActorFallbackLabel;

              return (
                <List.Item key={item.id} className={styles.listItem}>
                  <button
                    type="button"
                    className={`${styles.item} ${isUnread ? styles.itemUnread : ""}`}
                    onClick={() => onItemClick?.(item)}
                  >
                    {getNotificationIcon(item)}

                    <span className={styles.itemText}>
                      {isForumNotification && typeof buildForumActionText === "function" ? (
                        <span className={`${styles.itemTitle} ${styles.itemTitleInline}`}>
                          <strong>{actorName}</strong> {buildForumActionText(item, forumActionType)}
                        </span>
                      ) : (
                        <span className={styles.itemTitle}>{item.title}</span>
                      )}

                      {item.description ? (
                        <span
                          className={`${styles.itemDescription} ${isForumNotification ? styles.itemDescriptionQuote : ""}`}
                        >
                          {isForumNotification ? `"${item.description}"` : item.description}
                        </span>
                      ) : null}

                      <span className={styles.itemTime}>
                        {formatTimeAgo ? formatTimeAgo(item.createdAt) : ""}
                      </span>
                    </span>

                    {isUnread ? <span className={styles.unreadDot} /> : null}
                  </button>
                </List.Item>
              );
            }}
          />
        )}
      </div>

      <Typography.Text className={styles.syncText} type="secondary">
        {syncedAtLabel}: {formatSyncTime(lastSyncedAt)}
      </Typography.Text>
    </div>
  );
}
