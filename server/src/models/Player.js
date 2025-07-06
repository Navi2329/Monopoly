// server/src/models/Player.js
class Player {
  constructor(id, name, isHost = false) {
    this.id = id;
    this.name = name;
    this.isHost = isHost;
  }
}

module.exports = Player;
