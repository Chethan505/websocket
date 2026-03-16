import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";

function MessageInput({ sendMessage }) {

  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef = useRef(null);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  const onEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
  };

   const sendFile = async (file) => {

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    socket.emit("room-message", {
      sender: currentUser,
      file: data.fileUrl
    });

  };

  // close emoji panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="message-input">

      {showEmoji && (
        <div className="emoji-panel" ref={emojiRef}>
          <EmojiPicker onEmojiClick={onEmojiClick}/>
        </div>
      )}

      <button
        className="emoji-btn"
        onClick={() => setShowEmoji(prev => !prev)}
      >
        😊
      </button>

      <input
        type="text"
        value={text}
        placeholder="Type a message..."
        onChange={(e)=>setText(e.target.value)}
        onKeyDown={(e)=>{
          if(e.key==="Enter"){
            handleSend();
          }
        }}
      />

      <button
        className="send-btn"
        onClick={handleSend}
      >
        Send
      </button>

    </div>
  );
}

export default MessageInput;