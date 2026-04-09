import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import { Dropdown, Input, Modal, message } from "antd";
import { MessageCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import {
  fetchCreateRoom,
  fetchDeleteRoom,
  fetchRenameRoom,
  fetchRooms,
} from "../../../../redux/slices/roomSlice";
import socket from "../../../../socket/chatSocket";
import "./styles.css";

const TITLE_PREVIEW_LIMIT = 28;

const formatConversationTitle = (value, t) => {
  const full = (value || t('pages.home.chatbot.newConversationDefaultName')).trim();

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
  const rooms = useSelector((state) => state.room.rooms || []);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { roomId } = useParams();
  const activeConversation = roomId;

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameRoomId, setRenameRoomId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [hoveredRoomId, setHoveredRoomId] = useState(null);

  const handleNavigateRoom = (id) => {
    navigate(`/chatbot/${id}`);
  };

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
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
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [dispatch]);

  const handleCreateNewConversation = async () => {
    try {
      const created = await dispatch(
        fetchCreateRoom({ name: t('pages.home.chatbot.newConversationDefaultName') }),
      ).unwrap();
      if (created?.id) {
        navigate(`/chatbot/${created.id}`);
      }
    } catch (error) {
      message.error(error?.message || t('pages.home.chatbot.newRoomFailed'));
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
      message.warning(t('pages.home.chatbot.validation.emptyRoomName'));
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
      message.error(error?.message || t('pages.home.chatbot.renameFailed'));
    }
  };

  const handleRenameCancel = () => {
    setIsRenameOpen(false);
    setRenameRoomId(null);
    setRenameValue("");
  };

  const handleDeleteConversation = async (id) => {
    Modal.confirm({
      title: t('pages.home.chatbot.confirmDelete.title'),
      content: t('pages.home.chatbot.confirmDelete.content'),
      okText: t('pages.home.chatbot.confirmDelete.okText'),
      okButtonProps: { danger: true },
      cancelText: t('pages.home.chatbot.confirmDelete.cancelText'),
      onOk: async () => {
        try {
          await dispatch(fetchDeleteRoom({ id })).unwrap();
          if (String(activeConversation) === String(id)) {
            navigate(`/chatbot`);
          }
        } catch (error) {
          message.error(error?.message || t('pages.home.chatbot.deleteFailed'));
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
          <span>{t('pages.home.chatbot.newConversationButton')}</span>
        </button>

        <div className="conversations-label">{t('pages.home.chatbot.recentHistory')}</div>

        <div className="conversations-list">
          {rooms.map((conv) => (
            (() => {
              const titleInfo = formatConversationTitle(conv.name, t);
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
                      <span>{titleInfo.isLong && !isHovered ? titleInfo.short : titleInfo.full}</span>
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
                            label: t('pages.home.chatbot.actions.rename'),
                          },
                          {
                            key: "delete",
                            icon: <DeleteOutlined />,
                            label: t('pages.home.chatbot.actions.delete'),
                            danger: true,
                          },
                        ],
                        onClick: ({ key }) => {
                          if (key === "rename") openRenameModal(conv);
                          if (key === "delete") handleDeleteConversation(conv.id);
                        },
                      }}
                    >
                      <button
                        type="button"
                        className="conversation-more-btn"
                        aria-label={t('pages.home.chatbot.actions.optionsAria')}
                      >
                        <EllipsisOutlined />
                      </button>
                    </Dropdown>
                  </div>
                </div>
              );
            })()
          ))}
        </div>
      </aside>

      <div className="chatbot-main">
        <header className="chatbot-header">
          <div className="header-content">
            <MessageCircle className="header-icon" size={24} />
            <h1>{t('pages.home.chatbot.assistantTitle')}</h1>
          </div>
        </header>

        <Outlet />
      </div>

      <Modal
        title={t('pages.home.chatbot.renameModal.title')}
        open={isRenameOpen}
        onOk={handleRenameOk}
        onCancel={handleRenameCancel}
        okText={t('pages.home.chatbot.renameModal.okText')}
        cancelText={t('pages.home.chatbot.renameModal.cancelText')}
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder={t('pages.home.chatbot.renameModal.placeholder')}
          maxLength={50}
          autoFocus
          onPressEnter={handleRenameOk}
        />
      </Modal>
    </div>
  );
}