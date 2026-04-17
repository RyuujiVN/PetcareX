import { memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";

import "github-markdown-css/github-markdown-light.css";

const ChatMessage = memo(({ message }) => {
  const { t } = useTranslation(["admin", "client"]);
  if (!message) return null;

  if (message?.sendBy === "USER") {
    return (
      <div className="message user">
        <div className="message-content">
          <div className="message-bubble">{message.content}</div>

          {message.image && (
            <div className="message-image-grid">
              <a
                href={message.image}
                target="_blank"
                rel="noreferrer"
                className="message-image-link"
              >
                <img
                  src={message.image}
                  alt={t("pages.chatbot.messageBox.userImageAlt")}
                  loading="lazy"
                  className="message-image"
                />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="markdown-body">
      <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
    </div>
  );
});

export default ChatMessage;

