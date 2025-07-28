const express=require('express')
const http=require('http')
const path=require('path')
const app=express()
const {Server}=require('socket.io')
const mongoose=require('mongoose')

mongoose.connect('mongodb://127.0.0.1:27017/chatApp')
.then(() => console.log(' Local MongoDB connected'))
.catch((err) => console.log(' Local MongoDB error:', err));
const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model('Message', messageSchema);
const server=http.createServer(app)
const io= new Server(server)
const users={}




io.on("connection", (socket) => {
    console.log("A user connected");

socket.on('new-user', async (username) => {
  users[socket.id] = username;
  socket.broadcast.emit('user-joined', username);


  try {
    const messages = await Message.find().sort({ createdAt: 1 }).limit(5);
    messages.forEach(msg => {
      socket.emit('message', { username: msg.username, message: msg.message });
    });
  } catch (err) {
    console.log(' Error loading messages:', err);
  }
  io.emit('update-users',Object.values(users))
});

   socket.on('user-message', async ({ username, message }) => {
  io.emit('message', { username, message });

 
  try {
    const newMsg = new Message({ username, message });
    await newMsg.save();
  } catch (err) {
    console.log(' Error saving message:', err);
  }
});

socket.on('disconnect',()=>{
    const username=users[socket.id]
    if(username){
        
        socket.broadcast.emit('user-left',username)
        console.log(`${username}disconnected`)
        delete users[socket.id]
        io.emit('update-users',Object.values(users))
    }
})
});
app.use(express.static(path.resolve('./public')))

app.get('/',(req,res)=>{
    return res.sendFile(path.resolve("/public/index.html"))
})

server.listen(8000,()=>console.log('Server Started at port 8000'))
