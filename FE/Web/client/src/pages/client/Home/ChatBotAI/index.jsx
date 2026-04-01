import React, { useEffect, useState } from "react";
import "./styles.css";
import { MessageCircle, Plus } from "lucide-react";
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import { Dropdown, Input, Modal, message } from "antd";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import socket from "../../../../socket/socket";
import {
  fetchCreateRoom,
  fetchDeleteRoom,
  fetchRooms,
  fetchRenameRoom,
} from "../../../../redux/slices/roomSlice";

export default function ChatBotAI() {
  const dispatch = useDispatch();
  const rooms = useSelector((state) => state.room.rooms || []);
  const navigate = useNavigate();

  const { roomId } = useParams();
  const activeConversation = roomId;

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameRoomId, setRenameRoomId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

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
        fetchCreateRoom({ name: "Cuộc trò chuyện mới" }),
      ).unwrap();
      if (created?.id) {
        navigate(`/chatbot/${created.id}`);
      }
    } catch (error) {
      message.error(error?.message || "Không thể tạo cuộc trò chuyện mới");
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
      message.warning("Tên phòng không được để trống");
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
      message.error(error?.message || "Đổi tên phòng chat thất bại");
    }
  };

  const handleRenameCancel = () => {
    setIsRenameOpen(false);
    setRenameRoomId(null);
    setRenameValue("");
  };

  const handleDeleteConversation = async (id) => {
    Modal.confirm({
      title: "Xoá cuộc trò chuyện?",
      content: "Bạn có chắc muốn xoá cuộc trò chuyện này không?",
      okText: "Xoá",
      okButtonProps: { danger: true },
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await dispatch(fetchDeleteRoom({ id })).unwrap();
          if (String(activeConversation) === String(id)) {
            navigate(`/chatbot`);
          }
        } catch (error) {
          message.error(error?.message || "Xoá phòng chat thất bại");
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
          <span>Cuộc trò chuyện mới</span>
        </button>

        <div className="conversations-label">LỊCH SỬ GẦN ĐÂY</div>

        <div className="conversations-list">
          {rooms.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${activeConversation === conv.id ? "active" : ""}`}
              onClick={() => handleNavigateRoom(conv.id)}
            >
              <div className="conversation-info">
                <p className="conversation-title">{conv.name}</p>
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
                        label: "Sửa tên",
                      },
                      {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        label: "Xoá",
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
                    aria-label="Tùy chọn"
                  >
                    <EllipsisOutlined />
                  </button>
                </Dropdown>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="chatbot-main">
        <header className="chatbot-header">
          <div className="header-content">
            <MessageCircle className="header-icon" size={24} />
            <h1>Trợ lý AI PetCareX</h1>
          </div>
        </header>

        <Outlet />
      </div>

      <Modal
        title="Sửa tên cuộc trò chuyện"
        open={isRenameOpen}
        onOk={handleRenameOk}
        onCancel={handleRenameCancel}
        okText="Lưu"
        cancelText="Huỷ"
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder="Nhập tên cuộc trò chuyện"
          maxLength={50}
          autoFocus
          onPressEnter={handleRenameOk}
        />
      </Modal>
    </div>
  );
}
