import React, { useState, useRef, useEffect } from 'react';
import './styles.css';
import { MessageCircle, Plus, Send, Loader } from 'lucide-react';
import { CloseOutlined } from '@ant-design/icons';
export default function ChatBotAI() {
  const [conversations, setConversations] = useState([
    { id: 1, title: 'LuLu bị biếng ăn', icon: '🐱', unread: 0 },
    { id: 2, title: 'Lịch tiêm phòng cho mèo', icon: '💉', unread: 0 },
    { id: 3, title: 'Dấu hiệu về rằng ở chó', icon: '🐶', unread: 0 },
    { id: 4, title: 'Thức ăn tốt nhất cho Corgi', icon: '🍖', unread: 0 },
  ]);

  const [activeConversation, setActiveConversation] = useState(1);

  const [messagesMap, setMessagesMap] = useState({
    1: [
      {
        id: 1,
        sender: 'user',
        content: 'Chào AI, LuLu nhà tôi đang biếng ăn, tôi nên làm gì?',
        timestamp: '09:41 AM',
      },
      {
        id: 2,
        sender: 'ai',
        content: 'Bạn hãy kiểm tra nhiệt độ, nước uống và môi trường nhé!',
        timestamp: '09:42 AM',
      },
    ],
  });

  const messages = messagesMap[activeConversation] || [];

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
useEffect(() => {
  window.scrollTo(0, 0);
}, []);
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeConversation]: [...(prev[activeConversation] || []), newMessage],
    }));

    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        content: 'Cảm ơn bạn! Tôi đang phân tích...',
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessagesMap((prev) => ({
        ...prev,
        [activeConversation]: [...(prev[activeConversation] || []), aiResponse],
      }));

      setIsLoading(false);
    }, 1000);
  };
const handleDeleteConversation = (id) => {
  const updated = conversations.filter((c) => c.id !== id);
  setConversations(updated);

  setMessagesMap((prev) => {
    const newMap = { ...prev };
    delete newMap[id];
    return newMap;
  });

  if (id === activeConversation) {
    if (updated.length > 0) {
      setActiveConversation(updated[0].id);
    } else {
      setActiveConversation(null);
    }
  }
};

const handleCreateNewConversation = () => {
  scrollToBottom();
   const newId =
  conversations.length > 0
    ? Math.max(...conversations.map((c) => c.id)) + 1
    : 1;

    setConversations([
      {
        id: newId,
        title: 'Cuộc trò chuyện mới',
        icon: '💬',
        unread: 0,
      },
      ...conversations
    ]);
    setActiveConversation(newId);
  };

  return (
    
      <div className="chatbot-container">
        <aside className="chatbot-sidebar">
          <button className="new-conversation-btn" onClick={handleCreateNewConversation}>
            <Plus size={20} />
            <span>Cuộc trò chuyện mới</span>
          </button>

          <div className="conversations-label">LỊCH SỬ GẦN ĐÂY</div>

          <div className="conversations-list">
            {conversations.map((conv) => (
              <div
              key={conv.id}
              className={`conversation-item ${activeConversation === conv.id ? 'active' : ''}`}
              onClick={() => setActiveConversation(conv.id)}
            >
              <span className="conversation-icon">{conv.icon}</span>

              <div className="conversation-info">
                <p className="conversation-title">{conv.title}</p>
                <p className="conversation-meta">2 phút trước</p>
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
<div className="messages-container">
  {messages.length === 0 ? (
    <div className="empty-state">
      <h2>Hôm nay bạn cần gì?</h2>
    </div>
  ) : (
    <>
      {messages.map((message) => (
        <div key={message.id} className={`message ${message.sender}`}>
          <div className="message-content">
            <div className="message-bubble">
              {message.content}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="message ai">
          <div className="message-content">
            <div className="message-bubble">
              Đang trả lời...
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
      
    </>
  )}
</div>

          <footer className="chatbot-footer">
            <div className="input-container">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập câu hỏi..."
                className="message-input"
              />

              <button
                onClick={handleSendMessage}
                className="send-btn"
                disabled={!inputValue.trim()}
              >
                <Send size={20} />
              </button>
            </div>

            <p className="footer-info">
              AI có thể sai. Hãy xác nhận với bác sĩ thú y.
            </p>
          </footer>
        </div>
      </div>
  );
}