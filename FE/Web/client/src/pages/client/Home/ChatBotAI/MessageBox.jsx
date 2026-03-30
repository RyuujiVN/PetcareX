import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Input } from "antd";
import { Send } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  addMessage,
  editAiMessage,
  fetchMessageInRoom,
  fetchOldMessageInRoom,
} from "../../../../redux/slices/messageSlice";
import socket from "../../../../socket/socket";
import { Spin } from "antd";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "github-markdown-css/github-markdown-light.css";

const MessageBox = () => {
  const messages = useSelector((state) => state.message.messages);
  const hasMoreMessage = useSelector((state) => state.message.hasMoreMessage);
  const [isLoadingMore, setIsLoadingMore] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { roomId } = useParams();

  const messagesEndRef = useRef();
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSendMessage = (value) => {
    const content = value?.content?.trim();
    value.sendBy = "USER";
    if (!content) return;

    setIsAiLoading(true);
    socket.emit("message", { ...value, roomId, content });
    form.resetFields(["content"]);
    scrollToBottom();

    inputRef.current?.focus(); // focus lại input
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Chạy lần đầy
  useEffect(() => {
    const init = async () => {
      if (roomId) {
        setIsLoadingMore(true);

        const query = {
          limit: 10,
        };

        await dispatch(fetchMessageInRoom({ roomId, query }));

        setIsLoadingMore(false);

        socket.emit("joinRoom", { roomId });
      }
    };

    // Lấy danh sách message trong room lần đầu
    init();

    // Lắng nghe AI response stream về
    const onAiResponse = (data) => {
      if (data?.type === "done") return;

      const payload = {
        type: "AI_STREAMING",
        data: data?.token,
      };

      setIsAiLoading(false);
      dispatch(editAiMessage(payload));
    };

    // Lắng nghe server response về
    const onServerResponseMessage = (data) => {
      if (!roomId) navigate(`/chatbot/${data.roomId}`);

      dispatch(addMessage(data));
      scrollToBottom();
    };

    // Lắng nghe server trả về roomId khi tạo room lần đầu
    const onServerResponseRoom = (data) => {
      if (!roomId && data?.roomId) {
        navigate(`/chatbot/${data.roomId}`);
      }
    };

    // Lắng nghe server trả answer cuối của AI
    const serverResponseAIMessage = (data) => {
      const payload = {
        type: "AI_ANWSER",
        data: data,
      };

      dispatch(editAiMessage(payload));
    };

    socket.on("aiResponse", onAiResponse);
    socket.on("serverResponseAIMessage", serverResponseAIMessage);
    socket.on("serverResponseMessage", onServerResponseMessage);
    socket.on("serverResponseRoom", onServerResponseRoom);

    return () => {
      socket.off("aiResponse", onAiResponse);
      socket.off("serverResponseMessage", onServerResponseMessage);
      socket.off("serverResponseAIMessage", serverResponseAIMessage);
      socket.off("serverResponseRoom", onServerResponseRoom);
      if (roomId) {
        socket.emit("leaveRoom", { roomId });
      }
    };
  }, [roomId, dispatch, navigate]);

  // Bắt sự kiện khi cuộn lên đầu thì sẽ loading tiếp tin nhắn cũ
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = async () => {
      if (container.scrollTop === 0 && hasMoreMessage) {
        setIsLoadingMore(true);
        const firstMessage = messages[0];
        const query = {
          limit: 10,
          createdAt: firstMessage?.createdAt,
        };
        await dispatch(fetchOldMessageInRoom({ roomId, query }));
        setIsLoadingMore(false);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [roomId, messages, dispatch]);

  // Cuộn xuống cuối khi lần đầu vào room
  useEffect(() => {
    if (messages.length <= 10) {
      scrollToBottom();
    }
  }, [roomId, messages]);

  return (
    <>
      <div className="messages-container" ref={messagesContainerRef}>
        {!roomId ? (
          <div className="empty-state">
            <h2>Hôm nay bạn cần gì?</h2>
          </div>
        ) : (
          <>
            {isLoadingMore && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 0",
                }}
              >
                <Spin size="middle" />
                <span>Đang tải tin nhắn cũ...</span>
              </div>
            )}
            {messages.map((message) =>
              message?.sendBy === "USER" ? (
                <div key={message.id} className={`message user`}>
                  <div className="message-content">
                    <div className="message-bubble">{message.content}</div>
                  </div>
                </div>
              ) : (
                <div className="markdown-body" key={message.id}>
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </Markdown>
                </div>
              ),
            )}

            {isAiLoading && (
              <div className="message ai">
                <div className="message-content">
                  <div className="message-bubble loading">
                    <span>Đang trả lời...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <footer className="chatbot-footer">
        <Form
          form={form}
          className="input-container"
          onFinish={handleSendMessage}
        >
          <Form.Item name="content" style={{ flex: 1, marginBottom: 0 }}>
            <Input
              ref={inputRef}
              placeholder="Nhập câu hỏi..."
              className="message-input"
            />
          </Form.Item>

          <Form.Item>
            <button type="submit" className="send-btn" style={{ padding: 0 }}>
              <Send size={20} />
            </button>
          </Form.Item>
        </Form>

        <p className="footer-info">
          AI có thể sai. Hãy xác nhận với bác sĩ thú y.
        </p>
      </footer>
    </>
  );
};

export default MessageBox;