import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";

function MessageInput({ sendMessage, socket, currentUser, currentRoom }) {

  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFile, setSelectedFile] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const emojiRef = useRef(null);
  const fileRef = useRef();

  const handleSend = async () => {
    if (selectedFile.length === 0 && fileRef.current) {
      fileRef.current.value = "";
    }

    // ✅ FILE SEND
    if (selectedFile.length > 0) {
      try {
        for (let file of selectedFile) {

          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("http://localhost:8000/api/upload", {
            method: "POST",
            body: formData
          });

          const data = await res.json();

          const type = file.type.startsWith("image")
            ? "image"
            : file.type.startsWith("audio")
              ? "audio"
              : "file";

          socket.emit("file-message", {
            sender: currentUser,
            type,
            fileUrl: data.fileUrl,
            fileName: data.fileName || file.name,
            room: currentRoom,
            createdAt: new Date()
          });

          sendMessage({
            sender: currentUser,
            type,
            fileUrl: data.fileUrl,
            fileName: data.fileName || selectedFile.name,
            room: currentRoom,
            createdAt: new Date()
          });
        }

        setSelectedFile([]);
        setFileInputKey(Date.now());
        

        if (fileRef.current) {
          fileRef.current.value = "";
        }

      } catch (err) {
        console.error("Upload error:", err);
      }

      return;
    }

    // ✅ TEXT SEND
    if (text.trim()) {
      sendMessage(text);
      setText("");
    }
  };

  const onEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="message-input">

      {showEmoji && (
        <div className="emoji-panel" ref={emojiRef}>
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}

      <button onClick={() => setShowEmoji(prev => !prev)}>
        😊
      </button>

      <label className="file-btn">
        📎
        <input
          key={fileInputKey}
          type="file"
          multiple   // ✅ ADD THIS
          hidden
          ref={fileRef}
          onChange={(e) => {
            const files = Array.from(e.target.files);
            setSelectedFile(files);
          }}
        />
      </label>

      {selectedFile.length > 0 && (
        <div className="file-preview">
          {selectedFile.map((file, index) => (
            <div key={file.name + file.size} className="file-item">
              📄 {file.name}
              <button
                onClick={() => {
                  setSelectedFile(prev => {
                    const updated = prev.filter((_, i) => i !== index);

                    // ✅ Reset input ONLY if all files removed
                    if (updated.length === 0) {
                      setFileInputKey(Date.now());
                    }

                    return updated;
                  });
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        type="text"
        value={text}
        placeholder="Type a message..."
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSend();
        }}
      />

      <button onClick={handleSend}>
        Send
      </button>

    </div>
  );
}

export default MessageInput;