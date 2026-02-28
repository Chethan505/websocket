function Sidebar({
  onlineUsers = [],
  rooms = [],
  currentRoom,
  setCurrentRoom
}) {
  return (
    <div className="sidebar">
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
      </div>

      <h3 style={{ marginTop: "20px" }}>Online Users</h3>

      <div className="online-list">
        {onlineUsers.map((user) => (
          <div key={user.socketId} className="online-user">
            <span className="status-dot"></span>
            {user.username}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;