// server/src/socket/socketManager.js
const { Server } = require('socket.io');
const registerRoomHandlers = require('./roomHandlers');

let io;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174", "https://tradenroll.web.app"], // Make sure this matches your client
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const onConnection = (socket) => {
    // Register handlers from other files
    registerRoomHandlers(io, socket);

    socket.on('disconnect', () => {
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
