// server/src/services/roomService.js
const Player = require('../models/Player');
const Room = require('../models/Room');

const gameRooms = {}; // This object will store the state of all active games

const createRoom = (hostSocketId, hostPlayerName) => {
  const host = new Player(hostSocketId, hostPlayerName, true);
  const room = new Room([host]);
  
  gameRooms[room.id] = room;
  
  return room;
};

// Future functions would go here:
// const getRoomById = (roomId) => gameRooms[roomId];
// const addPlayerToRoom = (roomId, socketId, playerName) => { ... };
// const removePlayerFromRoom = (socketId) => { ... };

module.exports = {
  createRoom,
};
