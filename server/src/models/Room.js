// server/src/models/Room.js
class Room {
  constructor(players = []) {
    this.id = `game-${Math.random().toString(36).substr(2, 6)}`;
    this.players = players;
    this.gameState = 'waiting'; // 'waiting', 'in-progress', 'finished'
  }
}

module.exports = Room;
