// server/src/services/roomService.js
const Player = require('../models/Player');
const Room = require('../models/Room');

const gameRooms = {}; // This object will store the state of all active games

const createRoom = (hostSocketId, hostPlayerName) => {
  const room = new Room(hostSocketId, hostPlayerName);
  gameRooms[room.id] = room;
  return room;
};

const getRoomById = (roomId) => gameRooms[roomId];

const addPlayerToRoom = (roomId, socketId, playerName, color) => {
  const room = gameRooms[roomId];
  if (!room) return null;
  // Prevent duplicate players with the same socketId
  if (room.players.some(p => p.id === socketId)) {
    return room;
  }
  // Enforce color uniqueness
  if (color && room.players.some(p => p.color === color)) {
    return 'color_taken';
  }
  // First player to join is the host
  const isHost = room.players.length === 0;
  const player = { id: socketId, name: playerName, isHost, color };
  room.addPlayer(player);
  // Print player list after
  const joinedPlayer = room.players.find(p => p.name === playerName);
  if (joinedPlayer) {
  }
  return room;
};

const removePlayerFromRoom = (socketId) => {
  for (const roomId in gameRooms) {
    const room = gameRooms[roomId];
    const player = room.players.find(p => p.id === socketId);
    if (player) {
      room.removePlayer(socketId);
      // If room is empty after removal, delete it
      if (room.players.length === 0) {
        delete gameRooms[roomId];
      }
      return room;
    }
  }
  return null;
};

const updateRoomSettings = (roomId, newSettings) => {
  const room = gameRooms[roomId];
  if (!room) return null;
  room.updateSettings(newSettings);
  return room;
};

const startGame = (roomId) => {
  const room = gameRooms[roomId];
  if (!room) return null;
  room.gameState = 'in-progress';
  return room;
};

module.exports = {
  createRoom,
  getRoomById,
  addPlayerToRoom,
  removePlayerFromRoom,
  updateRoomSettings,
  startGame,
};
