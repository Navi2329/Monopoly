// server/src/socket/roomHandlers.js
const roomService = require('../services/roomService');

module.exports = (io, socket) => {
  const createPrivateGame = ({ playerName }) => {
    const newRoom = roomService.createRoom(socket.id, playerName);
    if (newRoom) {
      socket.join(newRoom.id);
      socket.emit('gameCreated', newRoom);
      console.log(`Player ${playerName} (${socket.id}) created and joined room ${newRoom.id}`);
    }
  };

  const handleDisconnect = () => {
    // In the future, you can add logic here to remove the player
    // from any room they were in. For now, we just log it.
  };

  socket.on('createPrivateGame', createPrivateGame);
  socket.on('disconnect', handleDisconnect);
};
