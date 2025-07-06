// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Enable Cross-Origin Resource Sharing

const server = http.createServer(app);

// Initialize a new instance of socket.io by passing the http server object[8]
// Configure CORS to allow connections from your React client's origin
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your React app's address
    methods: ["GET", "POST"]
  }
});

const gameRooms = {}; // This object will store the state of all active games

// Listen for incoming connections from clients[5, 7]
io.on('connection', (socket) => {
  console.log(`⚡: User connected: ${socket.id}`);

  // Handler for creating a private game
  socket.on('createPrivateGame', ({ playerName }) => {
    // Generate a simple unique ID for the room
    const roomId = `game-${Math.random().toString(36).substr(2, 6)}`;
    socket.join(roomId);

    // Initialize the game state for the new room
    gameRooms[roomId] = {
      id: roomId,
      players: [{ id: socket.id, name: playerName, isHost: true }],
      gameState: 'waiting', // Can be 'waiting', 'in-progress', 'finished'
    };

    // Send confirmation and game data back to the creator
    socket.emit('gameCreated', gameRooms[roomId]);
    console.log(`Player ${playerName} (${socket.id}) created and joined room ${roomId}`);
  });
  
  // Handler for when a user disconnects
  socket.on('disconnect', () => {
    console.log('🔥: A user disconnected:', socket.id);
    // Future logic: Remove player from any room they were in
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
