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
let TicTacToeRooms: {code: string, player1ID: number, player2ID: number | null, gameTable: string[], turn: number}[] = [];

function printOnlineUsers() {
  console.log('----------------------------')
  console.log('🟢 Online Users:');
  onlineUsers.forEach(user => console.log(`- ${user.ID}. ${user.userName} -- ${user.socketID}`));
  console.log('----------------------------')
}

function printRooms() {
  console.log('----------------------------')
  console.log('🎮 Game Rooms:');
  TicTacToeRooms.forEach(room => console.log(`- ${room.code}. ${room.player1ID} - ${room.player2ID}`));
  console.log('----------------------------')
}

function checkWin(board: string[]): boolean {
  const winPatterns = [
    // Rows
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    // Columns
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    // Diagonals
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of winPatterns) {
    if (
      board[a] !== '' &&
      board[a] === board[b] &&
      board[b] === board[c]
    ) {
      return true;
    }
  }

  return false;
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

  socket.on('create-room-tictactoe', (userID) => {
    // Helper function to generate a random 6-letter code
    function generateCode(length = 6) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  
    // Ensure code is unique
    let code: string;
    do {
      code = generateCode();
    } while (TicTacToeRooms.some(room => room.code === code));
  
    // Add new room
    TicTacToeRooms.push({
      code,
      player1ID: userID,
      player2ID: null,
      gameTable: Array(9).fill(''),
      turn: 0,
    });
    printRooms();
    // Optionally emit back the room code to the client
    io.to(socket.id).emit('room-created-tictactoe', code);
    // const targetsocketID = onlineUsers.find(user => user.socketID === socket.id)?.socketID;
    // const room = TicTacToeRooms.find(rom => rom.code === code);
    // if (targetsocketID && room) io.to(targetsocketID).emit('room-update', room.gameTable, room.player1ID, p1userName, room.player2ID, p2userName);
  
  });
  

  socket.on('join-room-tictactoe', (code, userID) => {
    const room = TicTacToeRooms.find(room => room.code === code);

    if (room && (room.player1ID === userID || room.player2ID === userID)) {
      return;
    }

    if (room && room.player1ID === null && room.player2ID !== userID) {
      room.player1ID = userID;
      const targetID = room.player2ID;
      const targetsocketID = onlineUsers.find(user => user.ID === targetID)?.socketID;
      const p1userName = onlineUsers.find(user => user.ID === room.player1ID)?.userName;
      const p2userName = onlineUsers.find(user => user.ID === room.player2ID)?.userName;
      if (targetsocketID) io.to(targetsocketID).emit('room-update', room.gameTable, room.player1ID, p1userName, room.player2ID, p2userName);
    }
    else if (room && room.player2ID === null && room.player1ID !== userID) {
      room.player2ID = userID;
      const targetID = room.player1ID;
      const targetsocketID = onlineUsers.find(user => user.ID === targetID)?.socketID;
      const p1userName = onlineUsers.find(user => user.ID === room.player1ID)?.userName;
      const p2userName = onlineUsers.find(user => user.ID === room.player2ID)?.userName;
      if (targetsocketID) io.to(targetsocketID).emit('room-update', room.gameTable, room.player1ID, p1userName, room.player2ID, p2userName);
    }
    else if (!room) {
      io.to(socket.id).emit('invalid-code');
    }
    printRooms();
  })

  socket.on('tictactoe-move', (code, userID, position) => {
    const room = TicTacToeRooms.find(room => room.code === code);
    if (room) {
      room.gameTable[position] = room.turn % 2 == 0 ? 'X' : 'O';

      if (checkWin(room.gameTable)) {
        const winnerSocket = onlineUsers.find(user => user.ID === userID)?.socketID;
        if (winnerSocket) io.to(winnerSocket).emit('tictactoe-win');
        const loserID = userID == room.player1ID ? room.player2ID : room.player1ID;
        const loserSocket = onlineUsers.find(user => user.ID === loserID)?.socketID;
        if (loserSocket) io.to(loserSocket).emit('tictactoe-lose');
      }

      room.turn = room.turn + 1;

      const p1userName = onlineUsers.find(user => user.ID === room.player1ID)?.userName;
      const p2userName = onlineUsers.find(user => user.ID === room.player2ID)?.userName;

      let targetsocketID = onlineUsers.find(user => user.ID === room.player1ID)?.socketID;
      if (targetsocketID) io.to(targetsocketID).emit('room-update', room.gameTable, room.player1ID, p1userName, room.player2ID, p2userName, room.turn);
      targetsocketID = onlineUsers.find(user => user.ID === room.player2ID)?.socketID;
      if (targetsocketID) io.to(targetsocketID).emit('room-update', room.gameTable, room.player1ID, p1userName, room.player2ID, p2userName, room.turn);
    }
  })

  // explain
  socket.on('reconnect-room', (userID) => {
    const room = TicTacToeRooms.find(room => room.player1ID === userID || room.player2ID === userID);
    if (room) {
      const p1userName = onlineUsers.find(user => user.ID === room.player1ID)?.userName;
      const p2userName = onlineUsers.find(user => user.ID === room.player2ID)?.userName;  
      io.to(socket.id).emit('room-update', room.gameTable, room.player1ID, p1userName, room.player2ID, p2userName, room.turn);
      const otherUserID = userID === room.player1ID ? room.player2ID : room.player1ID;
      const targetSocketID = onlineUsers.find(user => user.ID === otherUserID)?.socketID;
      if (targetSocketID)
        io.to(targetSocketID).emit('room-update', room.gameTable, room.player1ID, p1userName, room.player2ID, p2userName, room.turn);
    }
  }
);

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter(user => user.socketID !== socket.id);
    printOnlineUsers();
  });
});

// Start HTTP server instead of app.listen
httpServer.listen(port, () => {
  console.log(`Server + Socket.IO listening on port ${port}`);
});
