import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

function ChatWindow({ messages, currentUser, typingUser }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  return (
    <div className="chat-window">
      {messages.map((msg, index) => {
        const previousMessage = messages[index - 1];
        const isSameSender =
          previousMessage &&
          previousMessage.sender === msg.sender;

        return (
          <MessageBubble
            key={msg._id}
            msg={msg}
            isOwn={msg.sender === currentUser}
            isSameSender={isSameSender}
          />
        );
      })}

      {typingUser && (
        <div className="typing-indicator">
          {typingUser} is typing...
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

export default ChatWindow;