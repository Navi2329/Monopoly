// server/src/services/roomService.js
const Player = require('../models/Player');
const Room = require('../models/Room');
const botService = require('./botService');

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
  
  // Check if player with this name already exists in the game (reconnection scenario)
  const existingPlayer = room.players.find(p => p.name === playerName);
  
  if (existingPlayer) {
    // Check if they're currently disconnected or this is a different socket ID
    const connectionData = room.playerConnections[existingPlayer.id];
    if (!connectionData || connectionData.status === 'disconnected' || existingPlayer.id !== socketId) {
      // This is a reconnection - don't add a new player, handle reconnection
      return 'reconnection_required';
    }
  }
  
  // Enforce color uniqueness (only if color is provided)
  if (color && room.players.some(p => p.color === color)) {
    return 'color_taken';
  }
  
  // Check if game has started - if so, add as spectator
  if (room.gameState === 'in-progress') {
    const spectator = { id: socketId, name: playerName, isHost: false, color: null, isSpectator: true };
    room.addSpectator(spectator);
    return { room, isSpectator: true };
  }
  
  // First player to join is the host
  const isHost = room.players.length === 0;
  const player = { id: socketId, name: playerName, isHost, color };
  room.addPlayer(player);
  
  // If this is the first player and there's no host, make them the host
  if (isHost || (!room.hostId && !room.hostName)) {
    room.hostId = socketId;
    room.hostName = playerName;
    player.isHost = true;
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

const handlePlayerDisconnect = (socketId) => {
  for (const roomId in gameRooms) {
    const room = gameRooms[roomId];
    const player = room.players.find(p => p.id === socketId);
    if (player) {
      room.handlePlayerDisconnect(socketId);
      return room;
    }
  }
  return null;
};

const handlePlayerReconnect = (roomId, playerName, newSocketId) => {
  const room = gameRooms[roomId];
  if (!room) return null;
  
  // Find the disconnected player by name
  const disconnectedPlayer = room.players.find(p => 
    p.name === playerName && 
    room.playerConnections[p.id]?.status === 'disconnected'
  );
  
  if (disconnectedPlayer) {
    const oldSocketId = disconnectedPlayer.id;
    const reconnected = room.handlePlayerReconnect(oldSocketId, newSocketId);
    return reconnected ? room : null;
  }
  
  return null;
};

const getAllRooms = () => {
  const roomList = [];
  for (const roomId in gameRooms) {
    const room = gameRooms[roomId];
    // Only show rooms that are not in game or have space for players
    if (room.gameState !== 'in_game' || room.players.length < room.settings.maxPlayers) {
      // Create a clean room object without circular references
      const cleanRoomData = {
        id: room.id,
        name: room.name || `Room ${room.id}`,
        hostName: room.hostName,
        playerCount: room.players.length,
        maxPlayers: room.settings.maxPlayers,
        gameState: room.gameState,
        settings: {
          mapType: room.settings.mapType,
          startingMoney: room.settings.startingMoney,
          turnTimeLimit: room.settings.turnTimeLimit
        }
      };
      roomList.push(cleanRoomData);
    }
  }
  return roomList;
};

const getRoomByPlayerId = (socketId) => {
  for (const roomId in gameRooms) {
    const room = gameRooms[roomId];
    if (room.players.find(p => p.id === socketId) || room.playerConnections[socketId]) {
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
  room.startGame();
  return room;
};

const deleteRoom = (roomId) => {
  if (gameRooms[roomId]) {
    // console.log(`[DEBUG] Deleting empty room: ${roomId}`);
    delete gameRooms[roomId];
    return true;
  }
  return false;
};

const checkAndCleanupEmptyRoom = (roomId) => {
  const room = gameRooms[roomId];
  if (room && room.players.length === 0) {
    // console.log(`[DEBUG] Room ${roomId} is empty, scheduling cleanup`);
    // Clean up bots when room is deleted
    botService.removeAllBots(roomId);
    // Delete the room after a short delay to ensure all socket operations complete
    setTimeout(() => {
      if (gameRooms[roomId] && gameRooms[roomId].players.length === 0) {
        deleteRoom(roomId);
      }
    }, 1000);
  }
};

const addBotToRoom = (roomId, difficulty = 'medium') => {
  const room = gameRooms[roomId];
  if (!room) return null;
  
  // Check if bots are allowed
  if (!room.areBotsAllowed()) {
    return 'bots_not_allowed';
  }
  
  // Check if room is full
  if (room.players.length >= (room.settings.maxPlayers || 8)) {
    return 'room_full';
  }
  
  // Check if game has started
  if (room.gameState === 'in-progress') {
    return 'game_started';
  }
  
  // Get available colors
  const availableColors = room.getAvailableBotColors();
  if (availableColors.length === 0) {
    return 'no_colors_available';
  }
  
  // Create bot
  const bot = botService.createBot(roomId, difficulty);
  if (!bot) {
    return 'no_bot_names_available';
  }
  
  // Assign color
  bot.color = availableColors[0];
  
  // Add bot to room
  room.addBot(bot);
  
  return room;
};

const removeBotFromRoom = (roomId, botId) => {
  const room = gameRooms[roomId];
  if (!room) return null;
  
  // Remove from bot service
  botService.removeBot(roomId, botId);
  
  // Remove from room
  const removedBot = room.removeBot(botId);
  
  return removedBot ? room : null;
};

module.exports = {
  createRoom,
  getRoomById,
  addPlayerToRoom,
  removePlayerFromRoom,
  handlePlayerDisconnect,
  handlePlayerReconnect,
  getAllRooms,
  getRoomByPlayerId,
  updateRoomSettings,
  startGame,
  deleteRoom,
  checkAndCleanupEmptyRoom,
  addBotToRoom,
  removeBotFromRoom,
};
