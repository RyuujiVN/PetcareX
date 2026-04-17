import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./chatbot.css";
import "./ClinicChatBot.module.css";
import { MessageCircle, Plus } from "lucide-react";
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import { Dropdown, Input, Modal, message } from "antd";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  fetchCreateRoom,
  fetchDeleteRoom,
  fetchRooms,
  fetchRenameRoom,
} from "../../../redux/slices/roomSlice";
import chatSocket from "../../../socket/chatSocket";

const TITLE_PREVIEW_LIMIT = 28;

const resolveChatbotBasePath = (pathname = "") => {
  if (pathname === "/admin/chatbot" || pathname.startsWith("/admin/chatbot/")) return "/admin/chatbot";
  if (pathname === "/clinic/chatbot" || pathname.startsWith("/clinic/chatbot/")) return "/clinic/chatbot";
  if (pathname === "/veterinarian/chatbot" || pathname.startsWith("/veterinarian/chatbot/")) return "/veterinarian/chatbot";
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return "/chat";
  return "/chatbot";
};

const formatConversationTitle = (value, fallbackTitle) => {
  const full = (value || fallbackTitle).trim();

  if (full.length <= TITLE_PREVIEW_LIMIT) {
    return {
      full,
      short: full,
      isLong: false,
    };
  }

  return {
    full,
    short: `${full.slice(0, TITLE_PREVIEW_LIMIT)}...`,
    isLong: true,
  };
};

export default function ChatBotAI() {
  const dispatch = useDispatch();
  const { t } = useTranslation(["clinic", "client"]);
  const rooms = useSelector((state) => state.room.rooms || []);
  const navigate = useNavigate();
  const location = useLocation();

  const { roomId } = useParams();
  const activeConversation = roomId;
  const chatbotBasePath = useMemo(
    () => resolveChatbotBasePath(location.pathname),
    [location.pathname],
  );
  const buildChatPath = useCallback(
    (id) => (id ? `${chatbotBasePath}/${id}` : chatbotBasePath),
    [chatbotBasePath],
  );

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameRoomId, setRenameRoomId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [hoveredRoomId, setHoveredRoomId] = useState(null);
  const defaultRoomName = t("pages.chatbot.newConversationDefaultName");

  const handleNavigateRoom = (id) => {
    navigate(buildChatPath(id));
  };

  useEffect(() => {
    if (!chatSocket.connected) {
      chatSocket.connect();
    }

    const fetchRoomsData = async () => {
      try {
        await dispatch(fetchRooms()).unwrap();
      } catch (error) {
        message.error(error.message);
      }
    };

    fetchRoomsData();

    return () => {
      if (chatSocket.connected) {
        chatSocket.disconnect();
      }
    };
  }, [dispatch]);

  const handleCreateNewConversation = async () => {
    try {
      const created = await dispatch(
        fetchCreateRoom({ name: defaultRoomName }),
      ).unwrap();
      if (created?.id) {
        navigate(buildChatPath(created.id));
      }
    } catch (error) {
      message.error(error?.message || t("pages.chatbot.newRoomFailed"));
    }
  };

  const openRenameModal = (room) => {
    setRenameRoomId(room?.id);
    setRenameValue(room?.name || "");
    setIsRenameOpen(true);
  };

  const handleRenameOk = async () => {
    const name = renameValue.trim();
    if (!name) {
      message.warning(t("pages.chatbot.validation.emptyRoomName"));
      return;
    }

    try {
      await dispatch(
        fetchRenameRoom({
          id: renameRoomId,
          data: { name },
        }),
      ).unwrap();
      setIsRenameOpen(false);
      setRenameRoomId(null);
      setRenameValue("");
    } catch (error) {
      message.error(error?.message || t("pages.chatbot.renameFailed"));
    }
  };

  const handleRenameCancel = () => {
    setIsRenameOpen(false);
    setRenameRoomId(null);
    setRenameValue("");
  };

  const handleDeleteConversation = async (id) => {
    Modal.confirm({
      title: t("pages.chatbot.confirmDelete.title"),
      content: t("pages.chatbot.confirmDelete.content"),
      okText: t("pages.chatbot.confirmDelete.okText"),
      okButtonProps: { danger: true },
      cancelText: t("pages.chatbot.confirmDelete.cancelText"),
      onOk: async () => {
        try {
          await dispatch(fetchDeleteRoom({ id })).unwrap();
          if (String(activeConversation) === String(id)) {
            navigate(buildChatPath());
          }
        } catch (error) {
          message.error(error?.message || t("pages.chatbot.deleteFailed"));
        }
      },
    });
  };

  return (
    <div className="chatbot-container">
      <aside className="chatbot-sidebar">
        <button
          className="new-conversation-btn"
          onClick={handleCreateNewConversation}
        >
          <Plus size={20} />
          <span>{t("pages.chatbot.newConversationButton")}</span>
        </button>

        <div className="conversations-label">{t("pages.chatbot.recentHistory")}</div>

        <div className="conversations-list">
          {rooms.map((conv) =>
            (() => {
              const titleInfo = formatConversationTitle(conv.name, defaultRoomName);
              const isHovered = hoveredRoomId === conv.id;

              return (
                <div
                  key={conv.id}
                  className={`conversation-item ${activeConversation === conv.id ? "active" : ""}`}
                  onClick={() => handleNavigateRoom(conv.id)}
                >
                  <div className="conversation-info">
                    <p
                      className={`conversation-title ${titleInfo.isLong ? "is-long" : ""} ${isHovered ? "is-hovered" : ""}`}
                      title={titleInfo.full}
                      onMouseEnter={() => setHoveredRoomId(conv.id)}
                      onMouseLeave={() => setHoveredRoomId(null)}
                    >
                      <span>
                        {titleInfo.isLong && !isHovered
                          ? titleInfo.short
                          : titleInfo.full}
                      </span>
                    </p>
                  </div>

                  <div
                    className="conversation-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Dropdown
                      trigger={["click"]}
                      menu={{
                        items: [
                          {
                            key: "rename",
                            icon: <EditOutlined />,
                            label: t("pages.chatbot.actions.rename"),
                          },
                          {
                            key: "delete",
                            icon: <DeleteOutlined />,
                            label: t("pages.chatbot.actions.delete"),
                            danger: true,
                          },
                        ],
                        onClick: ({ key }) => {
                          if (key === "rename") openRenameModal(conv);
                          if (key === "delete")
                            handleDeleteConversation(conv.id);
                        },
                      }}
                    >
                      <button
                        type="button"
                        className="conversation-more-btn"
                        aria-label={t("pages.chatbot.actions.optionsAria")}
                      >
                        <EllipsisOutlined />
                      </button>
                    </Dropdown>
                  </div>
                </div>
              );
            })(),
          )}
        </div>
      </aside>

      <div className="chatbot-main">
        <header className="chatbot-header">
          <div className="header-content">
            <MessageCircle className="header-icon" size={24} />
            <h1>{t("pages.chatbot.assistantTitle")}</h1>
          </div>
        </header>

        <Outlet />
      </div>

      <Modal
        title={t("pages.chatbot.renameModal.title")}
        open={isRenameOpen}
        onOk={handleRenameOk}
        onCancel={handleRenameCancel}
        okText={t("pages.chatbot.renameModal.okText")}
        cancelText={t("pages.chatbot.renameModal.cancelText")}
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder={t("pages.chatbot.renameModal.placeholder")}
          maxLength={50}
          autoFocus
          onPressEnter={handleRenameOk}
        />
      </Modal>
    </div>
  );
}

