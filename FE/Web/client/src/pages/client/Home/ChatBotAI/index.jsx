import React, { useState, useRef, useEffect } from "react";
import "./styles.css";
import { MessageCircle, Plus, Send, Loader } from "lucide-react";
import { CloseOutlined } from "@ant-design/icons";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { chatbotApi } from "../../../../data/client/api/chatbotApi";

export default function ChatBotAI() {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  const { roomId } = useParams();

  const [activeConversation, setActiveConversation] = useState(roomId);

  const handleNavigateRoom = (roomId) => {
    navigate(`/chatbot/${roomId}`);
    setActiveConversation(roomId);
  };

  useEffect(() => {
    const fetchRoomApi = async () => {
      try {
        const data = await chatbotApi.getAllRoom();

        setRooms(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchRoomApi();
  }, []);

  const handleDeleteConversation = (id) => {};

  const handleCreateNewConversation = () => {};

  return (
    <div>
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

                <CloseOutlined
                  className="delete-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                />
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
      </div>
    </div>
  );
}
