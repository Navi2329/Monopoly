// server/src/socket/socketManager.js
const { Server } = require('socket.io');
const registerRoomHandlers = require('./roomHandlers');

let io;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174"], // Allow both ports
      methods: ["GET", "POST"]
    }
  });

  const onConnection = (socket) => {
    console.log(`⚡: User connected: ${socket.id}`);

    // Register handlers from other files
    registerRoomHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log('🔥: A user disconnected:', socket.id);
      // Disconnect logic is now handled within roomHandlers
    });
  };

  io.on('connection', onConnection);

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
}

module.exports = { init, getIo };
