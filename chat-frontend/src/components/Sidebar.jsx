function Sidebar({
  onlineUsers = [],
  rooms = [],
  currentRoom,
  setCurrentRoom,
  createRoom,
  currentUser,
  deleteRoom
}) {
  return (
    <div className="sidebar">

      {/* Rooms Section */}
      <div className="room-section">
        <h3>Rooms</h3>

        <div className="room-list">
          {rooms.map((roomObj) => (
            <div
              key={roomObj.roomName}
              className={`room-item ${currentRoom === roomObj.roomName ? "active-room" : ""
                }`}
              onClick={() => setCurrentRoom(roomObj.roomName)}
            >
              <span># {roomObj.roomName}</span>

              {roomObj.owner === currentUser &&
                roomObj.roomName !== "global" && (
                  <span
                    className="delete-room-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRoom(roomObj.roomName);
                    }}
                  >
                    🗑
                  </span>
                )}

            </div>
          ))}



          <div className="create-room-btn" onClick={createRoom}>
            + Create Room
          </div>
        </div>
      </div>

      {/* Online Section */}
      <div className="online-section">
        <h3>Online Users</h3>

        <div className="online-list">
          {onlineUsers.map((user) => (
            <div key={user.socketId} className="online-user">
              <span className="status-dot"></span>
              {user.username}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Sidebar;