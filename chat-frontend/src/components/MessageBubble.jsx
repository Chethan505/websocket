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
      className={`message-wrapper ${isOwn ? "own" : ""} ${isSameSender ? "grouped" : ""
        }`}
    >
      <div className={`message-bubble ${isOwn ? "own-bubble" : ""}`}>
        {!isOwn && !isSameSender && (
          <div className="message-sender">{msg.sender}</div>
        )}

        {msg.type === "image" && msg.fileUrl ? (
          <img
            src={msg.fileUrl}
            alt="img"
            style={{ maxWidth: "200px", borderRadius: "8px" }}
          />
        ) : msg.type === "audio" && msg.fileUrl ? (
          <audio controls src={msg.fileUrl}></audio>
        ) : msg.fileUrl ? (
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download   // ✅ FORCE DOWNLOAD
            className="file-link"
          >
            📄 {msg.fileName || "Download File"}
          </a>
        ) : (
          <div className="message-text">{msg.message}</div>
        )}

        <div className="message-time">
          {msg.createdAt ? formatTime(msg.createdAt) : ""}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;