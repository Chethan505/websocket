function MessageBubble({ msg, isOwn, isSameSender }) {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`message-wrapper ${isOwn ? "own" : ""} ${
        isSameSender ? "grouped" : ""
      }`}
    >
      <div className={`message-bubble ${isOwn ? "own-bubble" : ""}`}>
        {!isOwn && !isSameSender && (
          <div className="message-sender">{msg.sender}</div>
        )}

        <div className="message-text">{msg.message}</div>

        <div className="message-time">
          {msg.createdAt ? formatTime(msg.createdAt) : ""}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;