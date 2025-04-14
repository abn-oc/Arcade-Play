import app from "./app";
import { connectDB } from "./config/db";
import { createServer } from "http";
import { Server } from "socket.io";

const port = 3000;

// Create HTTP server with Express app
const httpServer = createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // adjust this if needed for security
  },
});

// DB connection
connectDB();

// Socket.IO logic
const onlineUsers = new Map<string, string>(); // username -> socket.id

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Example: handle a global message event
  socket.on("globalMessage", (data) => {
    console.log("Global message received:", data);
    // Broadcast to all clients (including sender)
    io.emit("globalMessage", data);
  });

  socket.on('register-user', (username: string) => {
    onlineUsers.set(username, socket.id);
  });

  socket.on('send-friend-request', ({ to, from }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('receive-friend-request', { from });
    }
  });

  socket.on('accept-friend-request', ({ to, from }) => {
    const requesterSocketId = onlineUsers.get(to);
    if (requesterSocketId) {
      io.to(requesterSocketId).emit('friend-request-accepted', { from });
    }
  });

  socket.on("disconnect", () => {
    for (let [user, id] of onlineUsers.entries()) {
        if (id === socket.id) onlineUsers.delete(user);
    }
    console.log("User disconnected:", socket.id);
  });
});

// Start HTTP server instead of app.listen
httpServer.listen(port, () => {
  console.log(`Server + Socket.IO listening on port ${port}`);
});
