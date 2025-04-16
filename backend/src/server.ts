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
let onlineUsers: {ID: number, userName: string, socketID: string}[] = [];

function printOnlineUsers() {
  console.log('----------------------------')
  console.log('🟢 Online Users:');
  onlineUsers.forEach(user => console.log(`- ${user.ID}. ${user.userName} -- ${user.socketID}`));
  console.log('----------------------------')
}

io.on("connection", (socket) => {

  console.log("A user connected:", socket.id);

  socket.on('register-user', (id, username) => {
    if (!onlineUsers.find(user => user.ID === id)) {
      onlineUsers.push({ ID: id, userName: username, socketID: socket.id });
    }
    printOnlineUsers();
  })

  socket.on("globalMessage", (msg) => {
    io.emit("globalMessage", msg);
  });

  socket.on('send-friend-request', ({ toUsername, fromUsername, fromID }) => {
    const targetsocketID = onlineUsers.find(user => user.userName === toUsername)?.socketID;
    if (targetsocketID) io.to(targetsocketID).emit('receive-friend-request', {fromUsername, fromID});
  });

  socket.on('accept-friend-request', ({ toID, fromID }) => {
    const targetsocketID = onlineUsers.find(user => user.ID === toID)?.socketID;
    const fromUsername = onlineUsers.find(user => user.ID === fromID)?.userName;
    if (targetsocketID) io.to(targetsocketID).emit('accepted-friend-request', {fromID, fromUsername});
  });

  socket.on('remove-friend', (fromID, toID) => {
    const targetsocketID = onlineUsers.find(user => user.ID === toID)?.socketID;
    if (targetsocketID) io.to(targetsocketID).emit('removed-friend', fromID);
  })

  socket.on('send-pm', (friendID, userID, userName) => {
    const targetsocketID = onlineUsers.find(user => user.ID === friendID)?.socketID;
    if (targetsocketID) io.to(targetsocketID).emit('receive-pm', userID, userName);
  })

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter(user => user.socketID !== socket.id);
    printOnlineUsers();
  });
});

// Start HTTP server instead of app.listen
httpServer.listen(port, () => {
  console.log(`Server + Socket.IO listening on port ${port}`);
});
