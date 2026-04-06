import { memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import "github-markdown-css/github-markdown-light.css";

const ChatMessage = memo(({ message }) => {
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
                  alt="Anh nguoi dung da gui"
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
