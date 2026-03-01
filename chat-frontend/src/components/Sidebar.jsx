function Sidebar({
  onlineUsers = [],
  rooms = [],
  currentRoom,
  setCurrentRoom,
   createRoom
}) {
  return (
   <div className="sidebar">

      {/* Rooms Section */}
      <div className="room-section">
        <h3>Rooms</h3>

        <div className="room-list">
          {rooms.map((room) => (
            <div
              key={room}
              className={`room-item ${
                currentRoom === room ? "active-room" : ""
              }`}
              onClick={() => setCurrentRoom(room)}
            >
              # {room}
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