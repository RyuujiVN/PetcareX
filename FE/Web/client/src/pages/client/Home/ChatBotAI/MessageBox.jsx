import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Input, message } from "antd";
import { Pause, Plus, Send, X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  addMessage,
  editAiMessage,
  fetchMessageInRoom,
  fetchOldMessageInRoom,
} from "../../../../redux/slices/messageSlice";
import socket from "../../../../socket/socket";
import { Spin } from "antd";
import { addRoom } from "../../../../redux/slices/roomSlice";
import { uploadOneFileResize } from "../../../../data/shared/api/cloudinaryUploadFetch";
import ChatMessage from "./ChatMessage";

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
  const [isAiWaitingFirstToken, setIsAiWaitingFirstToken] = useState(false);
  const [pendingImages, setPendingImages] = useState(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef(null);
  const pendingImageRef = useRef([]);

  const revokePreviewUrl = (image) => {
    if (image?.previewUrl) {
      URL.revokeObjectURL(image.previewUrl);
    }
  };

  const handleSelectImages = async (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const invalidFile = files.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      message.warning("Chi duoc chon file anh");
      event.target.value = "";
      return;
    }

    const file = files[0];
    const previewUrl = URL.createObjectURL(file);

    const fileObj = {
      id: "temp",
      file,
      previewUrl,
      url: null,
    };

    setPendingImages(fileObj);

    try {
      setIsUploadingImages(true);
      const uploadResult = await uploadOneFileResize(file);

      setPendingImages((prev) =>
        prev
          ? {
              ...prev,
              url: uploadResult?.url || uploadResult?.file || null,
            }
          : prev,
      );
    } catch (error) {
      revokePreviewUrl(fileObj);
      setPendingImages(null);
      message.error(error?.message || "Upload anh that bai");
    } finally {
      setIsUploadingImages(false);
      event.target.value = "";
    }
  };

  const handleRemovePendingImage = () => {
    setPendingImages((prev) => {
      revokePreviewUrl(prev);
      return null;
    });
  };

  const handleOpenFilePicker = () => {
    if (isAiLoading || isUploadingImages) return;
    fileInputRef.current?.click();
  };

  const handleSendMessage = async (value) => {
    const textContent = value.content?.trim() || "";

    // if (isAiLoading || !textContent) {
    //   return;
    // }

    if (!textContent) return;

    const payload = {
      content: textContent,
      sendBy: "USER",
      roomId: roomId,
    };

    if (pendingImages) payload.image = pendingImages.url;

    setIsAiLoading(true);
    setIsAiWaitingFirstToken(true);
    socket.emit("message", payload);
    form.resetFields(["content"]);
    handleRemovePendingImage();
    scrollToBottom();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStopStream = () => {
    if (!roomId || !isAiLoading) return;

    const lastMessage = messages[messages.length - 1];

    const payload = {
      roomId: roomId,
      content: lastMessage.content,
      sendBy: "AI",
    };

    socket.emit("stopStream", payload);

    setIsAiLoading(false);
    setIsAiWaitingFirstToken(false);

    inputRef.current?.focus(); // focus lại input
  };

  // Chạy lần đầu
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
      if (data?.type === "done" || data?.type === "stopped") {
        setIsAiLoading(false);
        return;
      }

      // Đã bắt đầu stream token => tắt loading chờ phản hồi ban đầu
      setIsAiWaitingFirstToken(false);

      const payload = {
        type: "AI_STREAMING",
        data: data?.token,
      };

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
      inputRef.current?.focus(); // focus lại input
    };

    // Lắng nghe server trả room khi nhắn lần đầu chưa có room
    const serverResponseNewRoom = (data) => {
      dispatch(addRoom(data));
      navigate(`/chatbot/${data.id}`);
    };

    // Lắng nghe lỗi từ backend
    const onServerResponseError = (errorData) => {
      const errMsg =
        errorData?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.";
      message.error(errMsg);
      setIsAiLoading(false);
      setIsAiWaitingFirstToken(false);
    };

    socket.on("aiResponse", onAiResponse);
    socket.on("serverResponseAIMessage", serverResponseAIMessage);
    socket.on("serverResponseMessage", onServerResponseMessage);
    socket.on("serverResponseRoom", onServerResponseRoom);
    socket.on("serverResponseNewRoom", serverResponseNewRoom);
    socket.on("serverResponseError", onServerResponseError);

    return () => {
      socket.off("aiResponse", onAiResponse);
      socket.off("serverResponseMessage", onServerResponseMessage);
      socket.off("serverResponseAIMessage", serverResponseAIMessage);
      socket.off("serverResponseRoom", onServerResponseRoom);
      socket.off("serverResponseNewRoom", serverResponseNewRoom);
      socket.off("serverResponseError", onServerResponseError);

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

  useEffect(() => {
    pendingImageRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      revokePreviewUrl(pendingImageRef.current);
    };
  }, []);

  return (
    <div className="chatbox-layout">
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
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isAiWaitingFirstToken && (
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

      <div className="chatbot-input-dock">
        {pendingImages && (
          <div style={{ marginBottom: 8 }}>
            <div className="inline-image-preview-list">
              <div
                key={pendingImages?.id}
                className="inline-image-preview-item"
              >
                <img
                  src={pendingImages?.previewUrl}
                  alt="Preview"
                  className="inline-image-preview"
                />
                {isUploadingImages && (
                  <div className="inline-image-upload-overlay">
                    <Spin size="small" />
                  </div>
                )}
                <button
                  type="button"
                  className="inline-image-remove"
                  onClick={() => handleRemovePendingImage(pendingImages?.id)}
                  aria-label="Xoa anh"
                  disabled={isAiLoading || isUploadingImages}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </div>
        )}

        <Form
          form={form}
          className="input-container"
          onFinish={handleSendMessage}
        >
          <button
            type="button"
            className="attach-btn"
            onClick={handleOpenFilePicker}
            title="Them anh"
            aria-label="Them anh"
            disabled={isAiLoading || isUploadingImages}
          >
            <Plus size={20} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleSelectImages}
          />

          <Form.Item name="content" style={{ flex: 1, marginBottom: 0 }}>
            <Input
              ref={inputRef}
              placeholder="Nhập câu hỏi..."
              className="message-input"
              disabled={isAiLoading}
              readOnly={isAiLoading}
              onKeyDown={(e) => {
                if (isAiLoading) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            {isAiLoading ? (
              <button
                type="button"
                className="send-btn"
                style={{ padding: 0 }}
                title="AI đang trả lời"
                onClick={handleStopStream}
              >
                <Pause size={20} />
              </button>
            ) : (
              <button
                type="submit"
                className="send-btn"
                style={{ padding: 0 }}
                disabled={isUploadingImages}
                title={isUploadingImages ? "Dang tai anh..." : "Gui"}
              >
                <Send size={20} />
              </button>
            )}
          </Form.Item>
        </Form>

        <p className="footer-info">
          {isUploadingImages
            ? "Dang tai anh len..."
            : "Thông tin từ AI chỉ mang tính tham khảo. Hãy hỏi bác sĩ thú y để được tư vấn chính xác."}
        </p>
      </div>
    </div>
  );
};

export default MessageBox;
