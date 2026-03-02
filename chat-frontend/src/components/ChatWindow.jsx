import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";


// messages

function ChatWindow({ messages, currentUser, typingUser, currentRoom }) {
  
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    
  }, [messages, typingUser]

);

  return (
    
    <div className="chat-window">
      <div className="chat-header">
        #{currentRoom}
      </div>
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