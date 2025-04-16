import app from "./app";
import { connectDB } from "./config/db";
import { createServer } from "http";
import { Server } from "socket.io";

const port = 3000;

// create http server with express app
const httpServer = createServer(app);

// create socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // adjust this if needed for security
  },
});

// db connection
connectDB();

// socket functionality
const onlineUsers = new Map<number, {socketID: string, userName: string}>(); // id -> socket.id, username

io.on("connection", (socket) => {

  console.log("A user connected:", socket.id);

  socket.on("globalMessage", (msg) => {
    io.emit("globalMessage", msg);
  });

  socket.on('register-user', (id: number, userName: string) => {
    onlineUsers.set(id, {socketID: socket.id, userName: userName});
  });

  socket.on('send-friend-request', ({ toID, fromUsername, fromID }) => {
    const targetSocketId = onlineUsers.get(toID)?.socketID;
    if (targetSocketId) {
      io.to(targetSocketId).emit('receive-friend-request', { fromUsername, fromID });
    }
  });

  socket.on('accept-friend-request', ({ to, from }) => {
    const requesterSocketId = onlineUsers.get(to)?.socketID;
    if (requesterSocketId) {
      io.to(requesterSocketId).emit('friend-request-accepted', { from });
    }
  });

  socket.on("disconnect", () => {
    for (let [user, key] of onlineUsers.entries()) {
        if (key.socketID === socket.id) onlineUsers.delete(user);
    }
    console.log("User disconnected:", socket.id);
  });
});

// Start HTTP server instead of app.listen
httpServer.listen(port, () => {
  console.log(`Server + Socket.IO listening on port ${port}`);
});
