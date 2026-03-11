import React, { useState, useRef, useEffect } from 'react';
import './styles.css';
import { MessageCircle, Plus, Send, Loader } from 'lucide-react';

export default function ChatBotAI() {
  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: 'LuLu bị biếng ăn',
      icon: '🐱',
      unread: 0,
    },
    {
      id: 2,
      title: 'Lịch tiêm phòng cho mèo',
      icon: '💉',
      unread: 0,
    },
    {
      id: 3,
      title: 'Dấu hiệu về rằng ở chó',
      icon: '🐶',
      unread: 0,
    },
    {
      id: 4,
      title: 'Thức ăn hót tốt nhất cho Corgi',
      icon: '🍖',
      unread: 0,
    },
  ]);
 
  const [activeConversation, setActiveConversation] = useState(1);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'user',
      content:
        'Chào Thành! Tại sao petcare AI. Hôm nay tôi có thể giúp gì cho sức khỏe của các bạn nhỏ nhà mình không?',
      timestamp: '09:41 AM',
    },
    {
      id: 2,
      sender: 'ai',
      content:
        'Chào AI, chỉ cho LuLu nhà tôi là gì đó lỳ biếng ăn, chỉ năn mỗi chút. Tôi nên làm gì?',
      timestamp: '09:42 AM',
    },
    {
      id: 3,
      sender: 'ai',
      content: (
        <div>
          <p>
            Tình trạng biếng ăn khi theo lộ độ ở chó có thể do nhiều nguyên nhân. Bạn hãy kiểm tra
            giúp tôi chẩu hiệu sau nhé:
          </p>
          <ul className="check-list">
            <li>✓ Kiểm tra nhiệt độ: Mũi LuLu có khô hơng không?</li>
            <li>✓ Kiểm tra nước: Nước có màu hơng nhạt hay tái/đỏ rực?</li>
            <li>✓ Thay đổi môi trường: Gần đây có sự thay đổi nào về thức ăn chó ở không?</li>
          </ul>
          <p className="highlight">
            Lưu ý: Nếu LuLu bị bỏra quá 24h bằm nôn mửa, hãy đưa thú y ngay lập tức.
          </p>
        </div>
      ),
      timestamp: '09:43 AM',
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'user',
        content: inputValue,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([...messages, newMessage]);
      setInputValue('');
      setIsLoading(true);

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          sender: 'ai',
          content: 'Cảm ơn bạn đã chia sẻ! Tôi đang phân tích thông tin của bạn...',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleCreateNewConversation = () => {
    const newId = Math.max(...conversations.map((c) => c.id)) + 1;
    setConversations([
      ...conversations,
      {
        id: newId,
        title: 'Cuộc trò chuyện mới',
        icon: '💬',
        unread: 0,
      },
    ]);
    setActiveConversation(newId);
    setMessages([]);
  };

  return (
    <div className="chatbot-container">
      {/* Sidebar */}
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
              onClick={() => {
                setActiveConversation(conv.id);
                setMessages([]);
              }}
            >
              <span className="conversation-icon">{conv.icon}</span>
              <div className="conversation-info">
                <p className="conversation-title">{conv.title}</p>
                <p className="conversation-meta">2 phút trước</p>
              </div>
              {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="chatbot-main">
        {/* Header */}
        <header className="chatbot-header">
          <div className="header-content">
            <MessageCircle className="header-icon" size={24} />
            <h1>Trợ lý AI PetCar</h1>
          </div>
          <div className="header-actions">
            <button className="action-btn">⋮</button>
          </div>
        </header>

        {/* Messages Container */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <MessageCircle size={48} />
              <h2>Bắt đầu cuộc trò chuyện</h2>
              <p>Hỏi tôi về sức khỏe thú cưng của bạn</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.sender}`}>
                  {message.sender === 'ai' && (
                    <div className="message-avatar">
                      <span>🤖</span>
                    </div>
                  )}
                  <div className="message-content">
                    <div className="message-bubble">{message.content}</div>
                    <span className="message-timestamp">{message.timestamp}</span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message ai">
                  <div className="message-avatar">
                    <span>🤖</span>
                  </div>
                  <div className="message-content">
                    <div className="message-bubble loading">
                      <Loader size={20} className="spinner" />
                      <span>Chờ phản hồi...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <footer className="chatbot-footer">
          <div className="input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Nhập câu hỏi của bạn về sức khỏe thú cưng..."
              className="message-input"
            />
            <button onClick={handleSendMessage} className="send-btn" disabled={!inputValue.trim()}>
              <Send size={20} />
            </button>
          </div>
          <p className="footer-info">
            PetCar AI có thể mắc lỗi. Hãy xác thực thông tin quan trọng với bác sĩ thú y.
          </p>
        </footer>
      </div>
    </div>
  );
}
