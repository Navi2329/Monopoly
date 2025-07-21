// server/src/models/Room.js
class Room {
  constructor(hostId, hostName, settings = {}) {
    this.id = `game-${Math.random().toString(36).substr(2, 6)}`;
    this.hostId = hostId; // socket id of the host
    this.hostName = hostName; // name of the host
    this.players = []; // array of { id, name, isHost, color, money }
    this.settings = settings; // room/game settings (editable by host)
    this.gameState = 'waiting'; // 'waiting', 'in-progress', 'finished'

    // Game state properties
    this.turnIndex = 0;
    this.roundNumber = 1;
    this.playerPositions = {}; // { playerId: position }
    this.playerMoney = {}; // { playerId: money }
    this.playerStatuses = {}; // { playerId: 'jail' | { status: 'vacation', vacationStartRound: number } }
    this.playerJailCards = {}; // { playerId: number of jail cards }
    this.playerJailRounds = {}; // { playerId: number of rounds in jail }
    this.playerDoublesCount = {}; // { playerId: consecutive doubles count }
    this.propertyOwnership = {}; // { propertyName: { owner: playerId, ownerName: string, ownerColor: string, houses: number, hotel: boolean, mortgaged: boolean } }
    this.lastDiceRoll = null; // { dice1, dice2, total, playerId }
    this.gameLog = []; // Array of log entries
    this.collectedMoney = {}; // { playerId: amount } for vacation cash
    this.vacationCash = 0; // Total money collected for vacation

    // Property data from classic map
    this.propertyData = {
      // Brazil set
      'Salvador': { type: 'property', set: 'Brazil', price: 60, rent: [2, 10, 30, 90, 160, 250], buildCost: 50 },
      'Rio': { type: 'property', set: 'Brazil', price: 60, rent: [4, 20, 60, 180, 320, 450], buildCost: 50 },
      // Airport
      'TLV Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
      // Israel set
      'Tel Aviv': { type: 'property', set: 'Israel', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50 },
      'Haifa': { type: 'property', set: 'Israel', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50 },
      'Jerusalem': { type: 'property', set: 'Israel', price: 120, rent: [8, 40, 100, 300, 450, 600], buildCost: 50 },
      // Italy set
      'Venice': { type: 'property', set: 'Italy', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100 },
      'Milan': { type: 'property', set: 'Italy', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 50 },
      'Rome': { type: 'property', set: 'Italy', price: 160, rent: [12, 60, 180, 500, 700, 900], buildCost: 100 },
      // Airport
      'MUC Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
      // Germany set
      'Frankfurt': { type: 'property', set: 'Germany', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100 },
      'Munich': { type: 'property', set: 'Germany', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100 },
      'Berlin': { type: 'property', set: 'Germany', price: 200, rent: [16, 80, 220, 600, 800, 1000], buildCost: 100 },
      // China set
      'Shenzhen': { type: 'property', set: 'China', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150 },
      'Beijing': { type: 'property', set: 'China', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150 },
      'Shanghai': { type: 'property', set: 'China', price: 240, rent: [20, 100, 300, 750, 925, 1100], buildCost: 150 },
      // Airport
      'CDG Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
      // France set
      'Lyon': { type: 'property', set: 'France', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150 },
      'Toulouse': { type: 'property', set: 'France', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150 },
      'Paris': { type: 'property', set: 'France', price: 280, rent: [24, 120, 360, 850, 1025, 1200], buildCost: 150 },
      // UK set
      'Liverpool': { type: 'property', set: 'UK', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200 },
      'Manchester': { type: 'property', set: 'UK', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200 },
      'London': { type: 'property', set: 'UK', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], buildCost: 200 },
      // Airport
      'JFK Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
      // USA set
      'California': { type: 'property', set: 'USA', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], buildCost: 200 },
      'New York': { type: 'property', set: 'USA', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], buildCost: 200 },
      // Companies
      'Electric Company': { type: 'company', set: 'Company', price: 150, rent: [4, 10] },
      'Water Company': { type: 'company', set: 'Company', price: 150, rent: [4, 10] }
    };

    // Initialize default settings
    this.settings = {
      allowAuction: true,
      vacationCash: true,
      doubleRentOnFullSet: false, // x2 rent for full set
      noRentInPrison: false,      // don't collect rent if owner is in jail
      mortgage: false,            // allow mortgaging
      evenBuild: false,           // enforce even build
      startingMoney: 1500,        // starting cash
      randomizePlayerOrder: false,// randomize player order
      ...settings
    };
  }

  addPlayer(player) {
    // player: { id, name, isHost, color }
    if (!this.players.find(p => p.id === player.id)) {
      // Only set isHost to false if not already set
      const isHost = player.isHost === true;
      const newPlayer = { ...player, isHost, money: this.settings.startingMoney };
      this.players.push(newPlayer);

      // Initialize player state
      this.playerPositions[player.id] = 0; // Start at position 0
      this.playerMoney[player.id] = this.settings.startingMoney;
      this.playerStatuses[player.id] = null;
      this.playerJailCards[player.id] = 0;
      this.playerJailRounds[player.id] = 0;
      this.playerDoublesCount[player.id] = 0;
      this.collectedMoney[player.id] = 0;
    }
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    // If host leaves, assign new host if possible
    if (this.hostId === playerId && this.players.length > 0) {
      this.hostId = this.players[0].id;
      this.players[0].isHost = true;
    }

    // Clean up player state
    delete this.playerPositions[playerId];
    delete this.playerMoney[playerId];
    delete this.playerStatuses[playerId];
    delete this.playerJailCards[playerId];
    delete this.playerJailRounds[playerId];
    delete this.playerDoublesCount[playerId];
    delete this.collectedMoney[playerId];

    // Remove player from property ownership
    for (const propertyName in this.propertyOwnership) {
      if (this.propertyOwnership[propertyName].owner === playerId) {
        delete this.propertyOwnership[propertyName];
      }
    }
  }

  setHost(playerId) {
    this.hostId = playerId;
    this.players.forEach(p => {
      p.isHost = (p.id === playerId);
    });
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  getPlayerList() {
    return this.players.map(({ id, name, isHost, color, money }) => ({ id, name, isHost, color, money }));
  }

  startGame() {
    // Randomize player order if enabled
    if (this.settings.randomizePlayerOrder) {
      for (let i = this.players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.players[i], this.players[j]] = [this.players[j], this.players[i]];
      }
    }
    this.turnIndex = 0;
    this.gameState = 'in-progress';
    // Set all player states
    this.players.forEach(player => {
      this.playerPositions[player.id] = 0;
      this.playerStatuses[player.id] = null;
      this.playerJailCards[player.id] = 0;
      this.playerJailRounds[player.id] = 0;
      this.playerDoublesCount[player.id] = 0;
      this.playerMoney[player.id] = this.settings.startingMoney;
    });
  }

  // Game logic methods
  rollDice(playerId, devDice1, devDice2) {
    if (this.gameState !== 'in-progress') return null;
    if (this.players[this.turnIndex].id !== playerId) return null;

    const currentPlayer = this.players[this.turnIndex];
    // Use dev dice if provided, otherwise use random dice
    const dice1 = devDice1 && devDice2 ? devDice1 : Math.floor(Math.random() * 6) + 1;
    const dice2 = devDice1 && devDice2 ? devDice2 : Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    const isDoubles = dice1 === dice2;

    this.lastDiceRoll = { dice1, dice2, total, playerId: currentPlayer.id };

    // Handle jail logic
    if (this.playerStatuses[currentPlayer.id] === 'jail') {
      if (isDoubles) {
        // Get out of jail with doubles - move player and end turn immediately
        this.playerStatuses[currentPlayer.id] = null;
        this.playerJailRounds[currentPlayer.id] = 0;
        this.playerDoublesCount[currentPlayer.id] = 0;
        this.movePlayer(currentPlayer.id, total);
        const turnResult = this.advanceTurn(); // End turn immediately after escaping jail
        this.lastDiceRoll = null; // Reset dice roll for the new player's turn
        return { dice1, dice2, total, isDoubles, action: 'jail-escape', turnResult };
      } else {
        // Stay in jail
        this.playerJailRounds[currentPlayer.id]++;
        if (this.playerJailRounds[currentPlayer.id] >= 3) {
          // Auto-release after 3 turns
          this.playerStatuses[currentPlayer.id] = null;
          this.playerJailRounds[currentPlayer.id] = 0;
          return { dice1, dice2, total: 0, isDoubles: false, action: 'jail-auto-release' };
        } else {
          return { dice1, dice2, total: 0, isDoubles: false, action: 'jail-stay' };
        }
      }
    }

    // Normal movement
    const result = this.movePlayer(currentPlayer.id, total);

    // Handle doubles
    if (isDoubles) {
      this.playerDoublesCount[currentPlayer.id]++;

      if (this.playerDoublesCount[currentPlayer.id] >= 3) {
        // Go to jail for 3 doubles - turn ends immediately
        this.playerPositions[currentPlayer.id] = 10;
        this.playerStatuses[currentPlayer.id] = 'jail';
        this.playerJailRounds[currentPlayer.id] = 0;
        this.playerDoublesCount[currentPlayer.id] = 0;
        const turnResult = this.advanceTurn();
        this.lastDiceRoll = null; // Reset dice roll for the new player's turn
        return { dice1, dice2, total, isDoubles, action: 'jail', position: 10, turnResult };
      }
      // If doubles but less than 3, don't advance turn - player gets another roll after clicking End Turn
    } else {
      this.playerDoublesCount[currentPlayer.id] = 0;
      // Don't advance turn automatically - player must click End Turn
    }

    // Check for special spaces that end turn immediately
    if (result.action === 'jail' || result.action === 'vacation') {
      const turnResult = this.advanceTurn(); // End turn immediately for Go to Jail or Vacation
      this.lastDiceRoll = null; // Reset dice roll for the new player's turn
      return { dice1, dice2, total, isDoubles, action: result.action, position: result.position, turnResult };
    }

    return { dice1, dice2, total, isDoubles, action: result.action, position: result.position };
  }

  movePlayer(playerId, spaces) {
    const currentPos = this.playerPositions[playerId] || 0;
    let newPos = (currentPos + spaces) % 40;
    let passedStart = false;

    if (currentPos + spaces >= 40) {
      passedStart = true;
      // Award money for passing START
      this.playerMoney[playerId] += 200;
    }

    this.playerPositions[playerId] = newPos;

    // Handle special spaces
    let action = null;
    if (newPos === 30) { // Go to jail
      // Do NOT move player or set status yet; handle in two-step flow
      action = 'go-to-jail';
      // Return position 30 so the client can animate the move
      return { action, position: 30 };
    } else if (newPos === 20) { // Vacation
      // console.log(`[ROOM] Player ${playerId} landed on vacation in round ${this.roundNumber}`);
      this.playerStatuses[playerId] = { status: 'vacation', vacationStartRound: this.roundNumber };
      // console.log(`[ROOM] Set vacation status for player ${playerId}:`, JSON.stringify(this.playerStatuses[playerId]));
      // Clear dice state when player goes on vacation
      // this.lastDiceRoll = null; // <-- Removed: dice roll should remain until turn advances
      this.playerDoublesCount[playerId] = 0;
      // console.log(`[ROOM] Cleared dice state for player ${playerId} going on vacation`);
      action = 'vacation';
    } else if (newPos === 0 && passedStart) {
      // Landed on START - extra bonus
      this.playerMoney[playerId] += 100; // Additional $100 for landing
      action = 'start';
    }

    return { action, position: newPos };
  }

  advanceTurn() {
    let attempts = 0;
    const totalPlayers = this.players.length;
    let vacationEvents = [];
    let vacationReturnEvents = [];
    let orderedEvents = [];
    let maxAttempts = totalPlayers * 10; // Prevent infinite loop

    const shouldResetVacation = (playerId) => {
      const status = this.playerStatuses[playerId];
      return status && typeof status === 'object' && status.status === 'vacation' && this.roundNumber >= status.vacationStartRound + 1;
    };

    const startingTurnIndex = this.turnIndex;
    let firstLoop = true;
    let roundJustIncremented = false;
    while (attempts < maxAttempts) {
      const previousTurnIndex = this.turnIndex;
      this.turnIndex = (this.turnIndex + 1) % totalPlayers;
      attempts++;
      // Round increment and log
      if (this.turnIndex === 0 && previousTurnIndex !== 0) {
        this.roundNumber++;
        roundJustIncremented = true;
        // Only log for rounds 2 and above
        if (this.roundNumber > 1) {
          orderedEvents.push({ type: 'round-start', message: `Round ${this.roundNumber} started.` });
        }
      }
      firstLoop = false;
      const playerId = this.players[this.turnIndex].id;
      // If player just returned from vacation, log it and clear the flag
      if (
        this.playerStatuses[playerId] &&
        typeof this.playerStatuses[playerId] === 'object' &&
        this.playerStatuses[playerId].justReturnedFromVacation
      ) {
        vacationReturnEvents.push({
          type: 'vacation-return-log',
          playerId,
          message: `${this.players.find(p => p.id === playerId)?.name || playerId} returned from vacation and can roll again!`
        });
        delete this.playerStatuses[playerId].justReturnedFromVacation;
      }
      if (this.playerStatuses[playerId] && typeof this.playerStatuses[playerId] === 'object' && this.playerStatuses[playerId].status === 'vacation') {
        // If the round just incremented, ensure the round-start event is the first for this round
        if (roundJustIncremented) {
          roundJustIncremented = false; // Only do this once per round increment
        }
        orderedEvents.push({ type: 'vacation-skip', playerId });
        if (shouldResetVacation(playerId)) {
          this.playerStatuses[playerId] = { justReturnedFromVacation: true };
        }
        continue;
      } else {
        break;
      }
    }
    return { vacationEvents, vacationReturnEvents, orderedEvents };
  }

  buyProperty(playerId, propertyName, price) {
    if (this.propertyOwnership[propertyName]) {
      console.log('[DEBUG] buyProperty: Property already owned:', propertyName);
      return false; // Already owned
    }

    // Always get the latest player object for color
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      console.log('[DEBUG] buyProperty: Player not found:', playerId);
      return false;
    }
    if (this.playerMoney[playerId] < price) {
      console.log('[DEBUG] buyProperty: Not enough money for player', playerId, 'to buy', propertyName);
      return false;
    }

    this.playerMoney[playerId] -= price;
    this.propertyOwnership[propertyName] = {
      owner: playerId,
      ownerName: player.name,
      ownerColor: player.color, // Always use current color
      houses: 0,
      hotel: false,
      mortgaged: false
    };

    console.log('[DEBUG] Room.buyProperty propertyOwnership:', this.propertyOwnership);
    return true;
  }

  payRent(playerId, propertyName) {
    const property = this.propertyOwnership[propertyName];
    if (!property || property.owner === playerId) return 0;
    const owner = this.players.find(p => p.id === property.owner);
    if (!owner) return 0;
    // No rent if owner is in jail and setting enabled
    if (this.settings.noRentInPrison && this.playerStatuses[owner.id] === 'jail') return 0;
    // No rent if mortgaged
    if (property.mortgaged) return 0;
    let rent = this.calculateRent(propertyName);
    if (this.playerMoney[playerId] < rent) {
      rent = this.playerMoney[playerId];
    }
    this.playerMoney[playerId] -= rent;
    this.playerMoney[property.owner] += rent;
    return rent;
  }

  calculateRent(propertyName) {
    const property = this.propertyOwnership[propertyName];
    if (!property) return 0;
    const data = this.propertyData[propertyName];
    if (!data) return 0;
    if (property.mortgaged) return 0;
    if (data.type === 'airport') {
      const ownerAirports = Object.keys(this.propertyOwnership).filter(prop =>
        this.propertyOwnership[prop].owner === property.owner &&
        this.propertyData[prop]?.type === 'airport'
      ).length;
      return data.rent[Math.min(ownerAirports - 1, data.rent.length - 1)] || 0;
    }
    if (data.type === 'company') {
      const ownerCompanies = Object.keys(this.propertyOwnership).filter(prop =>
        this.propertyOwnership[prop].owner === property.owner &&
        this.propertyData[prop]?.type === 'company'
      ).length;
      const multiplier = data.rent[Math.min(ownerCompanies - 1, data.rent.length - 1)] || 0;
      // Use dice roll value for company rent
      const diceValue = this.lastDiceRoll && this.lastDiceRoll.playerId ? this.lastDiceRoll.total : 0;
      return multiplier * diceValue;
    }
    if (data.type === 'property') {
      // Double rent for full set (no houses/hotels) if enabled
      if (this.settings.doubleRentOnFullSet && !property.hotel && property.houses === 0) {
        const set = data.set;
        const setProps = Object.keys(this.propertyData).filter(
          k => this.propertyData[k].set === set && this.propertyData[k].type === 'property'
        );
        const ownsAll = setProps.every(
          k => this.propertyOwnership[k] && this.propertyOwnership[k].owner === property.owner && !this.propertyOwnership[k].mortgaged
        );
        if (ownsAll) {
          return data.rent[0] * 2;
        }
      }
      if (property.hotel) {
        return data.rent[5];
      } else if (property.houses > 0) {
        return data.rent[property.houses];
      } else {
        return data.rent[0];
      }
    }
    return 0;
  }

  addGameLog(entry) {
    this.gameLog.push({ ...entry, timestamp: Date.now() });
  }

  getPropertyData(propertyName) {
    return this.propertyData[propertyName];
  }

  isPropertyAvailable(propertyName) {
    return !this.propertyOwnership[propertyName] && this.propertyData[propertyName];
  }

  getPropertyPrice(propertyName) {
    const data = this.propertyData[propertyName];
    return data ? data.price : 0;
  }

  // Add this method to the Room class
  getGameState() {
    const gameState = {
      playerPositions: this.playerPositions,
      lastDiceRoll: this.lastDiceRoll,
      playerStatuses: this.playerStatuses,
      turnIndex: this.turnIndex,
      roundNumber: this.roundNumber,
      specialAction: null, // or set as needed
      playerMoney: this.playerMoney,
      currentTurnSocketId: this.players[this.turnIndex]?.id || null,
      propertyOwnership: this.propertyOwnership,
      playerJailCards: this.playerJailCards,
      playerJailRounds: this.playerJailRounds,
      vacationCash: this.vacationCash,
      gameLog: this.gameLog,
      // add more fields if needed
    };
    // console.log(`[ROOM] getGameState: propertyOwnership:`, JSON.stringify(gameState.propertyOwnership));
    return gameState;
  }

  // Mortgage/unmortgage property
  mortgageProperty(playerId, propertyName) {
    if (!this.settings.mortgage) return false;
    const property = this.propertyOwnership[propertyName];
    if (!property || property.owner !== playerId) return false;
    if (property.mortgaged) return false;
    if (property.houses > 0 || property.hotel) return false;
    property.mortgaged = true;
    this.playerMoney[playerId] += Math.floor(this.propertyData[propertyName].price / 2);
    return true;
  }
  unmortgageProperty(playerId, propertyName) {
    if (!this.settings.mortgage) return false;
    const property = this.propertyOwnership[propertyName];
    if (!property || property.owner !== playerId) return false;
    if (!property.mortgaged) return false;
    // Must have enough money
    const cost = Math.ceil(this.propertyData[propertyName].price * 0.6);
    if (this.playerMoney[playerId] < cost) return false;
    property.mortgaged = false;
    this.playerMoney[playerId] -= cost;
    return true;
  }

  // Even build enforcement for houses/hotels
  canBuildHouse(playerId, propertyName) {
    if (!this.settings.evenBuild) return true;
    const property = this.propertyOwnership[propertyName];
    if (!property || property.owner !== playerId) return false;
    const data = this.propertyData[propertyName];
    if (!data || data.type !== 'property') return false;
    const set = data.set;
    const setProps = Object.keys(this.propertyData).filter(
      k => this.propertyData[k].set === set && this.propertyData[k].type === 'property'
    );
    const houseCounts = setProps.map(k => this.propertyOwnership[k]?.houses || 0);
    const minHouses = Math.min(...houseCounts);
    return property.houses <= minHouses;
  }
  canDestroyHouse(playerId, propertyName) {
    if (!this.settings.evenBuild) return true;
    const property = this.propertyOwnership[propertyName];
    if (!property || property.owner !== playerId) return false;
    const data = this.propertyData[propertyName];
    if (!data || data.type !== 'property') return false;
    const set = data.set;
    const setProps = Object.keys(this.propertyData).filter(
      k => this.propertyData[k].set === set && this.propertyData[k].type === 'property'
    );
    const houseCounts = setProps.map(k => this.propertyOwnership[k]?.houses || 0);
    const maxHouses = Math.max(...houseCounts);
    return property.houses >= maxHouses;
  }
}

module.exports = Room;
