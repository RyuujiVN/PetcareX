import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Form, Input, message } from "antd";
import { Pause, Plus, Send, X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  addMessage,
  editAiMessage,
  fetchMessageInRoom,
  fetchOldMessageInRoom,
} from "../../../../redux/slices/messageSlice";
import { Spin } from "antd";
import { addRoom } from "../../../../redux/slices/roomSlice";
import ChatMessage from "./ChatMessage";
import chatSocket from "../../../../socket/chatSocket";
import { uploadOneFileResize } from "../../../../services/cloudinaryService";
import { BsRobot } from "react-icons/bs";
import { useTranslation } from "react-i18next";

const resolveChatbotBasePath = (pathname = "") => {
  if (pathname === "/admin/chatbot" || pathname.startsWith("/admin/chatbot/")) return "/admin/chatbot";
  if (pathname === "/clinic/chatbot" || pathname.startsWith("/clinic/chatbot/")) return "/clinic/chatbot";
  if (pathname === "/veterinarian/chatbot" || pathname.startsWith("/veterinarian/chatbot/")) return "/veterinarian/chatbot";
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return "/chat";
  return "/chatbot";
};

const TypingIndicator = () => {
  return (
    <div className="typing-indicator" aria-hidden>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="typing-indicator-dot"
          style={{ animationDelay: `${index * 0.2}s` }}
        />
      ))}
    </div>
  );
};

const MessageBox = () => {
  const { t } = useTranslation(["client"]);
  const messages = useSelector((state) => state.message.messages);
  const hasMoreMessage = useSelector((state) => state.message.hasMoreMessage);
  const [isLoadingMore, setIsLoadingMore] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { roomId } = useParams();
  const chatbotBasePath = useMemo(
    () => resolveChatbotBasePath(location.pathname),
    [location.pathname],
  );
  const buildChatPath = useCallback(
    (id) => (id ? `${chatbotBasePath}/${id}` : chatbotBasePath),
    [chatbotBasePath],
  );

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
      message.warning(t("pages.home.chatbot.messageBox.validation.imageOnly"));
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
      message.error(error?.message || t("pages.home.chatbot.messageBox.uploadFailed"));
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
    chatSocket.emit("message", payload);
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

    chatSocket.emit("stopStream", payload);

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

        chatSocket.emit("joinRoom", { roomId });
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
      if (!roomId) navigate(buildChatPath(data.roomId));

      dispatch(addMessage(data));
      scrollToBottom();
    };

    // Lắng nghe server trả về roomId khi tạo room lần đầu
    const onServerResponseRoom = (data) => {
      if (!roomId && data?.roomId) {
        navigate(buildChatPath(data.roomId));
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
      navigate(buildChatPath(data.id));
    };

    // Lắng nghe lỗi từ backend
    const onServerResponseError = (errorData) => {
      const errMsg =
          errorData?.message || t("pages.home.chatbot.messageBox.genericError");
      message.error(errMsg);
      setIsAiLoading(false);
      setIsAiWaitingFirstToken(false);
    };

    chatSocket.on("aiResponse", onAiResponse);
    chatSocket.on("serverResponseAIMessage", serverResponseAIMessage);
    chatSocket.on("serverResponseMessage", onServerResponseMessage);
    chatSocket.on("serverResponseRoom", onServerResponseRoom);
    chatSocket.on("serverResponseNewRoom", serverResponseNewRoom);
    chatSocket.on("serverResponseError", onServerResponseError);

    return () => {
      chatSocket.off("aiResponse", onAiResponse);
      chatSocket.off("serverResponseMessage", onServerResponseMessage);
      chatSocket.off("serverResponseAIMessage", serverResponseAIMessage);
      chatSocket.off("serverResponseRoom", onServerResponseRoom);
      chatSocket.off("serverResponseNewRoom", serverResponseNewRoom);
      chatSocket.off("serverResponseError", onServerResponseError);

      if (roomId) {
        chatSocket.emit("leaveRoom", { roomId });
      }
    };
  }, [roomId, dispatch, navigate, buildChatPath]);

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
  }, [roomId, messages, dispatch, hasMoreMessage]);

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
            <h2>{t("pages.home.chatbot.messageBox.emptyState")}</h2>
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
                <span>{t("pages.home.chatbot.messageBox.loadingOldMessages")}</span>
              </div>
            )}
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isAiWaitingFirstToken && (
              <div className="message ai">
                <div className="typing-avatar">
                  <BsRobot size={16} />
                </div>
                <div className="message-content">
                  <TypingIndicator />
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
                  alt={t("pages.home.chatbot.messageBox.previewAlt")}
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
                  aria-label={t("pages.home.chatbot.messageBox.removeImage")}
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
            title={t("pages.home.chatbot.messageBox.attachImage")}
            aria-label={t("pages.home.chatbot.messageBox.attachImage")}
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
              placeholder={t("pages.home.chatbot.messageBox.inputPlaceholder")}
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
                title={t("pages.home.chatbot.messageBox.aiResponding")}
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
                title={
                  isUploadingImages
                    ? t("pages.home.chatbot.messageBox.uploadingImage")
                    : t("pages.home.chatbot.messageBox.send")
                }
              >
                <Send size={20} />
              </button>
            )}
          </Form.Item>
        </Form>

        <p className="footer-info">
          {isUploadingImages
            ? t("pages.home.chatbot.messageBox.uploadingImageLong")
            : t("pages.home.chatbot.messageBox.disclaimer")}
        </p>
      </div>
    </div>
  );
};

export default MessageBox;
