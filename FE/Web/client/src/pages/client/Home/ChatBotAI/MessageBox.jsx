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
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "github-markdown-css/github-markdown-light.css";
import { addRoom, fetchRenameRoom } from "../../../../redux/slices/roomSlice";
import { uploadMultipleFilesToCloudinary } from "../../../../services/cloudinaryService";

const IMAGE_LINE_PREFIX = "[image]:";
const MAX_ROOM_NAME_LENGTH = 80;

const deriveRoomNameFromMessage = (text, imageCount = 0) => {
  const normalizedText = (text || "").replace(/\s+/g, " ").trim();

  if (normalizedText) {
    return normalizedText.slice(0, MAX_ROOM_NAME_LENGTH);
  }

  if (imageCount > 0) {
    return imageCount === 1 ? "Ảnh người dùng đã gửi" : `${imageCount} ảnh người dùng đã gửi`;
  }

  return "Cuộc trò chuyện mới";
};

const composeMessageContent = (text, imageUrls = []) => {
  const cleanText = text?.trim() || "";

  if (!imageUrls.length) {
    return cleanText;
  }

  const imageLines = imageUrls
    .map((url) => `${IMAGE_LINE_PREFIX} ${url}`)
    .join("\n");

  if (!cleanText) {
    return imageLines;
  }

  return `${cleanText}\n\n${imageLines}`;
};

const parseUserMessageContent = (content = "") => {
  const lines = String(content).split("\n");
  const imageUrls = [];
  const textLines = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith(IMAGE_LINE_PREFIX)) {
      const url = trimmed.slice(IMAGE_LINE_PREFIX.length).trim();
      if (url) {
        imageUrls.push(url);
      }
      return;
    }

    textLines.push(line);
  });

  return {
    text: textLines.join("\n").trim(),
    imageUrls,
  };
};

const MessageBox = () => {
  const messages = useSelector((state) => state.message.messages);
  const hasMoreMessage = useSelector((state) => state.message.hasMoreMessage);
  const rooms = useSelector((state) => state.room.rooms || []);
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
  const [pendingImages, setPendingImages] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef(null);
  const pendingImagesRef = useRef([]);

  const revokePreviewUrls = (images) => {
    images.forEach((item) => {
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
  };

  const resetPendingImages = () => {
    setPendingImages((prev) => {
      revokePreviewUrls(prev);
      return [];
    });
  };

  const handleSelectImages = (event) => {
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

    const mapped = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingImages((prev) => [...prev, ...mapped]);
    event.target.value = "";
  };

  const handleRemovePendingImage = (id) => {
    setPendingImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return prev.filter((item) => item.id !== id);
    });
  };

  const handleOpenFilePicker = () => {
    if (isAiLoading || isUploadingImages) return;
    fileInputRef.current?.click();
  };

  const handleSendMessage = async (value) => {
    const textContent = value.content?.trim() || "";
    const hasPendingImages = pendingImages.length > 0;

    if (isAiLoading || isUploadingImages || (!textContent && !hasPendingImages)) {
      return;
    }

    let imageUrls = [];

    if (hasPendingImages) {
      try {
        setIsUploadingImages(true);
        const uploadResult = await uploadMultipleFilesToCloudinary(
          pendingImages.map((item) => item.file),
        );
        imageUrls = uploadResult?.urls || [];
      } catch (error) {
        message.error(error?.message || "Upload anh that bai");
        setIsUploadingImages(false);
        return;
      }
    }

    const payload = {
      content: composeMessageContent(textContent, imageUrls),
      sendBy: "USER",
      roomId,
    };

    const suggestedRoomName = deriveRoomNameFromMessage(textContent, imageUrls.length);
    const currentRoom = rooms.find((room) => String(room.id) === String(roomId));

    if (
      roomId &&
      suggestedRoomName &&
      suggestedRoomName !== currentRoom?.name
    ) {
      dispatch(
        fetchRenameRoom({
          id: roomId,
          data: { name: suggestedRoomName },
        }),
      ).catch(() => {});
    }

    if (!payload.content) {
      setIsUploadingImages(false);
      return;
    }

    setIsAiLoading(true);
    setIsAiWaitingFirstToken(true);
    setIsUploadingImages(false);
    socket.emit("message", payload);
    form.resetFields(["content"]);
    resetPendingImages();
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
    };

    // Lắng nghe server trả room khi nhắn lần đầu chưa có room
    const serverResponseNewRoom = (data) => {
      dispatch(addRoom(data));
      navigate(`/chatbot/${data.id}`);
    };

    socket.on("aiResponse", onAiResponse);
    socket.on("serverResponseAIMessage", serverResponseAIMessage);
    socket.on("serverResponseMessage", onServerResponseMessage);
    socket.on("serverResponseRoom", onServerResponseRoom);
    socket.on("serverResponseNewRoom", serverResponseNewRoom);

    return () => {
      socket.off("aiResponse", onAiResponse);
      socket.off("serverResponseMessage", onServerResponseMessage);
      socket.off("serverResponseAIMessage", serverResponseAIMessage);
      socket.off("serverResponseRoom", onServerResponseRoom);
      socket.off("serverResponseNewRoom", serverResponseNewRoom);

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
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      revokePreviewUrls(pendingImagesRef.current);
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
            {messages.map((message) =>
              message?.sendBy === "USER" ? (() => {
                const parsedMessage = parseUserMessageContent(message.content);

                return (
                  <div key={message.id} className={`message user`}>
                    <div className="message-content">
                      {!!parsedMessage.text && (
                        <div className="message-bubble">{parsedMessage.text}</div>
                      )}
                      {!!parsedMessage.imageUrls.length && (
                        <div className="message-image-grid">
                          {parsedMessage.imageUrls.map((url) => (
                            <a
                              key={`${message.id}-${url}`}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="message-image-link"
                            >
                              <img
                                src={url}
                                alt="Anh nguoi dung da gui"
                                loading="lazy"
                                className="message-image"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <div className="markdown-body" key={message.id}>
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </Markdown>
                </div>
              ),
            )}

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

          {!!pendingImages.length && (
            <div className="inline-image-preview-list">
              {pendingImages.slice(0, 3).map((item) => (
                <div key={item.id} className="inline-image-preview-item">
                  <img src={item.previewUrl} alt="Preview" className="inline-image-preview" />
                  <button
                    type="button"
                    className="inline-image-remove"
                    onClick={() => handleRemovePendingImage(item.id)}
                    aria-label="Xoa anh"
                    disabled={isAiLoading || isUploadingImages}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {pendingImages.length > 3 && (
                <div className="inline-image-more">+{pendingImages.length - 3}</div>
              )}
            </div>
          )}

          <Form.Item name="content" style={{ flex: 1, marginBottom: 0}}>
            <Input
              ref={inputRef}
              placeholder="Nhập câu hỏi..."
              className="message-input"
              disabled={isAiLoading || isUploadingImages}
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