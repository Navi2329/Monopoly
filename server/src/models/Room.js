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
    
    // Trade system
    this.trades = {}; // { tradeId: tradeData }
    this.tradeCounter = 0; // For generating unique trade IDs

    // Bankruptcy and vote-kick system
    this.bankruptedPlayers = new Set(); // Set of player IDs who are bankrupt
    this.votekickedPlayers = new Set(); // Set of player IDs who are vote-kicked
    this.activeVoteKick = null; // { targetPlayerId, votes: Set(), startTime, endTime }
    this.voteKickTimer = null; // Timer reference for auto-kick

    // Property data from classic map
    this.propertyData = {
      // Brazil set
      'Salvador': { type: 'property', set: 'Brazil', price: 60, rent: [2, 10, 30, 90, 160, 250], buildCost: 50, hotelCost: 250 },
      'Rio': { type: 'property', set: 'Brazil', price: 60, rent: [4, 20, 60, 180, 320, 450], buildCost: 50, hotelCost: 250 },
      // Airport
      'TLV Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
      // Israel set
      'Tel Aviv': { type: 'property', set: 'Israel', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50, hotelCost: 250 },
      'Haifa': { type: 'property', set: 'Israel', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50, hotelCost: 250 },
      'Jerusalem': { type: 'property', set: 'Israel', price: 120, rent: [8, 40, 100, 300, 450, 600], buildCost: 50, hotelCost: 250 },
      // Italy set
      'Venice': { type: 'property', set: 'Italy', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100, hotelCost: 500 },
      'Milan': { type: 'property', set: 'Italy', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 50, hotelCost: 250 },
      'Rome': { type: 'property', set: 'Italy', price: 160, rent: [12, 60, 180, 500, 700, 900], buildCost: 100, hotelCost: 500 },
      // Airport
      'MUC Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
      // Germany set
      'Frankfurt': { type: 'property', set: 'Germany', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100, hotelCost: 500 },
      'Munich': { type: 'property', set: 'Germany', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100, hotelCost: 500 },
      'Berlin': { type: 'property', set: 'Germany', price: 200, rent: [16, 80, 220, 600, 800, 1000], buildCost: 100, hotelCost: 500 },
      // China set
      'Shenzhen': { type: 'property', set: 'China', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150, hotelCost: 750 },
      'Beijing': { type: 'property', set: 'China', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150, hotelCost: 750 },
      'Shanghai': { type: 'property', set: 'China', price: 240, rent: [20, 100, 300, 750, 925, 1100], buildCost: 150, hotelCost: 750 },
      // Airport
      'CDG Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
      // France set
      'Lyon': { type: 'property', set: 'France', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150, hotelCost: 750 },
      'Toulouse': { type: 'property', set: 'France', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150, hotelCost: 750 },
      'Paris': { type: 'property', set: 'France', price: 280, rent: [24, 120, 360, 850, 1025, 1200], buildCost: 150, hotelCost: 750 },
      // UK set
      'Liverpool': { type: 'property', set: 'UK', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200, hotelCost: 1000 },
      'Manchester': { type: 'property', set: 'UK', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200, hotelCost: 1000 },
      'London': { type: 'property', set: 'UK', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], buildCost: 200, hotelCost: 1000 },
      // Airport
      'JFK Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
      // USA set
      'California': { type: 'property', set: 'USA', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], buildCost: 200, hotelCost: 1000 },
      'New York': { type: 'property', set: 'USA', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], buildCost: 200, hotelCost: 1000 },
      // Companies
      'Electric Company': { type: 'company', set: 'Company', price: 150, rent: [4, 10] },
      'Water Company': { type: 'company', set: 'Company', price: 150, rent: [4, 10] }
    };

    this.settings = {
      allowAuction: false,
      vacationCash: false,
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
    // console.log('[DEBUG][ROUND] startGame setting roundNumber to 1, call stack:', new Error().stack);
    this.roundNumber = 1;
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
    // Prevent rolling if player is on vacation (must skip turn)
    const status = this.playerStatuses[currentPlayer.id];
    if (status && typeof status === 'object' && status.status === 'vacation') {
      return { action: 'vacation-skip-required' };
    }
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
      // console.log('[DEBUG][SERVER][rollDice] Doubles count for', currentPlayer.id, ':', this.playerDoublesCount[currentPlayer.id]);

      if (this.playerDoublesCount[currentPlayer.id] >= 3) {
        // Go to jail for 3 doubles - move player to jail, set status, and ADVANCE TURN
        this.playerPositions[currentPlayer.id] = 10;
        this.playerStatuses[currentPlayer.id] = 'jail';
        this.playerJailRounds[currentPlayer.id] = 0;
        this.playerDoublesCount[currentPlayer.id] = 0;
        const turnResult = this.advanceTurn();
        this.lastDiceRoll = null;
        return { dice1, dice2, total, isDoubles, action: 'jail-move', position: 10, turnResult };
      }
      // If doubles but less than 3, don't advance turn - player gets another roll after clicking End Turn
    } else {
      this.playerDoublesCount[currentPlayer.id] = 0;
      // console.log('[DEBUG][SERVER][rollDice] Doubles count reset for', currentPlayer.id);
      // Don't advance turn automatically - player must click End Turn
    }

    // Check for special spaces that end turn immediately
    if (result.action === 'jail') {
      // Move player to jail and set jail status, but do NOT end turn
      this.playerPositions[currentPlayer.id] = 10;
      this.playerStatuses[currentPlayer.id] = 'jail';
      this.playerJailRounds[currentPlayer.id] = 0;
      // Return special action for frontend to show End Turn button
      return { dice1, dice2, total, isDoubles, action: 'jail-move', position: 10, passedStart: result.passedStart };
    }
    // --- FIX: Handle Go to Jail (space 30) ---
    if (result.action === 'go-to-jail') {
      // Move player to jail and set jail status, but do NOT end turn
      this.playerPositions[currentPlayer.id] = 10;
      this.playerStatuses[currentPlayer.id] = 'jail';
      this.playerJailRounds[currentPlayer.id] = 0;
      // Return special action for frontend to show End Turn button
      return { dice1, dice2, total, isDoubles, action: 'jail-move', position: 10, passedStart: result.passedStart };
    }

    // For vacation, do NOT end turn automatically. Just return the action and let the frontend show End Turn/Skip.
    return { dice1, dice2, total, isDoubles, action: result.action, position: result.position, passedStart: result.passedStart };
  }

  movePlayer(playerId, spaces) {
    const currentPos = this.playerPositions[playerId] || 0;
    let newPos = (currentPos + spaces) % 40;
    let passedStart = false;

    if (currentPos + spaces >= 40) {
      passedStart = true;
      // Award money for passing START (but not landing on it)
      if (newPos !== 0) {
        this.playerMoney[playerId] += 200;
      }
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
      // Only return action: 'vacation' if landed on vacation.
      // The status will be set after End Turn is clicked.
      action = 'vacation';

      // If there's vacation cash, give it to the player who landed on vacation
      if (this.vacationCash > 0) {
        this.playerMoney[playerId] += this.vacationCash;
        this.vacationCash = 0;
        // Clear collected money for all players
        Object.keys(this.collectedMoney).forEach(playerId => {
          this.collectedMoney[playerId] = 0;
        });
      }
    } else if (newPos === 0) {
      // Landed on START - $300 bonus
      this.playerMoney[playerId] += 300;
      action = 'start';
    } else if (newPos === 4) { // Income Tax
      // Handle income tax (10% of cash or add to vacation cash)
      const currentMoney = this.playerMoney[playerId];
      const taxAmount = Math.floor(currentMoney * 0.1);

      // Always deduct from player's cash
      this.playerMoney[playerId] -= taxAmount;

      if (this.settings.vacationCash) {
        // Add to vacation cash
        this.vacationCash += taxAmount;
        this.collectedMoney[playerId] += taxAmount;
      }
      action = 'income-tax';
    } else if (newPos === 38) { // Luxury Tax
      // Handle luxury tax ($75 or add to vacation cash)
      const taxAmount = 75;

      // Always deduct from player's cash
      this.playerMoney[playerId] -= taxAmount;

      if (this.settings.vacationCash) {
        // Add to vacation cash
        this.vacationCash += taxAmount;
        this.collectedMoney[playerId] += taxAmount;
      }
      action = 'luxury-tax';
    }

    return { action, position: newPos, passedStart };
  }

  // Add a new method to handle vacation end turn
  handleVacationEndTurn(playerId) {
    // Only allow if player is not already on vacation
    const status = this.playerStatuses[playerId];
    if (status && typeof status === 'object' && status.status === 'vacation') return false;
    this.playerStatuses[playerId] = { status: 'vacation', vacationStartRound: this.roundNumber };
    const playerName = this.players.find(p => p.id === playerId)?.name || 'Player';
    this.addGameLog({ type: 'vacation', playerId, message: `${playerName} went on vacation!` });
    this.playerDoublesCount[playerId] = 0; // Reset doubles count
    return true;
  }

  // Modify advanceTurn to set vacation status after End Turn on vacation
  advanceTurn(sessionId, vacationEndTurnPlayerId = null) {
    // console.log('[DEBUG][VACATION] advanceTurn called with sessionId:', sessionId, 'vacationEndTurnPlayerId:', vacationEndTurnPlayerId);
    
    // FIRST: Cancel vote-kick if the current player (who is ending their turn) is the target
    const currentPlayerBeforeAdvance = this.players[this.turnIndex];
    if (this.activeVoteKick && currentPlayerBeforeAdvance && this.activeVoteKick.targetPlayerId === currentPlayerBeforeAdvance.id) {
      // console.log('[DEBUG SERVER] advanceTurn: cancelling vote-kick for player', currentPlayerBeforeAdvance.name, 'who is ending their turn');
      this.cancelVoteKick();
    }
    
    const totalPlayers = this.players.length;
    let orderedEvents = [];
    let vacationReturnEvents = [];
    let roundJustIncremented = false;
    let attempts = 0;
    let maxAttempts = totalPlayers * 2; // Prevent infinite loop, only need to check each player once per round

    // If vacationEndTurnPlayerId is provided, set vacation status for that player
    if (vacationEndTurnPlayerId) {
      // Only set vacation status if not already set
      const status = this.playerStatuses[vacationEndTurnPlayerId];
      if (!(status && typeof status === 'object' && status.status === 'vacation')) {
        this.handleVacationEndTurn(vacationEndTurnPlayerId);
      }
    }

    const shouldResetVacation = (playerId) => {
      const status = this.playerStatuses[playerId];
      // Only allow return after player has skipped their turn (status.justSkippedVacation)
      return status && typeof status === 'object' && status.status === 'vacation' && status.justSkippedVacation;
    };

    while (attempts < maxAttempts) {
      const prevTurnIndex = this.turnIndex;
      this.turnIndex = (this.turnIndex + 1) % totalPlayers;
      attempts++;
      // If we wrapped around, increment round and log
      if (this.turnIndex === 0 && prevTurnIndex !== 0) {
        const prevRound = this.roundNumber;
        this.roundNumber++;
        roundJustIncremented = true;
        orderedEvents.push({ type: 'round-start', message: `Round ${this.roundNumber} started.` });
      }
      const playerId = this.players[this.turnIndex].id;
      const playerName = this.players[this.turnIndex].name;
      
      // Skip bankrupt or vote-kicked players
      if (!this.canPlayerPlay(playerId)) {
        continue; // Skip this player and continue to next
      }
      
      const status = this.playerStatuses[playerId];
      // If player is on vacation
      if (status && typeof status === 'object' && status.status === 'vacation') {
        // If vacation is over (after player has skipped), clear vacation and let them roll
        if (shouldResetVacation(playerId)) {
          delete this.playerStatuses[playerId];
          vacationReturnEvents.push({
            type: 'vacation-return-log',
            playerId,
            message: `returned from vacation and can roll again!`
          });
          break; // Let this player roll
        } else {
          // Still on vacation, require skip, but only one skip per turn
          this.playerStatuses[playerId].justSkippedVacation = true;
          orderedEvents.push({
            type: 'vacation-skip',
            playerId,
            message: `${playerName} turn skipped. Still in vacation.`
          });
          break;
        }
      } else {
        // Not on vacation, let this player roll
        break;
      }
    }
    return { vacationEvents: [], vacationReturnEvents, orderedEvents, roundJustIncremented };
  }

  buyProperty(playerId, propertyName, price) {
    if (this.propertyOwnership[propertyName]) {
      // console.log('[DEBUG] buyProperty: Property already owned:', propertyName);
      return false; // Already owned
    }

    // Always get the latest player object for color
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      // console.log('[DEBUG] buyProperty: Player not found:', playerId);
      return false;
    }
    if (this.playerMoney[playerId] < price) {
      // console.log('[DEBUG] buyProperty: Not enough money for player', playerId, 'to buy', propertyName);
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
    // console.log('[DEBUG] buyProperty: Property bought:', propertyName, 'by', playerId);
    // console.log('[DEBUG] Room.buyProperty propertyOwnership:', this.propertyOwnership);
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
      // Double rent for full set (any house/hotel level) if enabled
      if (this.settings.doubleRentOnFullSet) {
        const set = data.set;
        const setProps = Object.keys(this.propertyData).filter(
          k => this.propertyData[k].set === set && this.propertyData[k].type === 'property'
        );
        const ownsAll = setProps.every(
          k => this.propertyOwnership[k] && this.propertyOwnership[k].owner === property.owner && !this.propertyOwnership[k].mortgaged
        );
        if (ownsAll) {
          if (property.hotel) {
            return data.rent[5] * 2;
          } else if (property.houses > 0) {
            return data.rent[property.houses] * 2;
          } else {
            return data.rent[0] * 2;
          }
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
      playersOrdered: this.players.map(p => ({ id: p.id, name: p.name, color: p.color, isBot: p.isBot, isOnline: p.isOnline })),
      trades: Object.values(this.trades),
      // Bankruptcy and vote-kick states
      bankruptedPlayers: Array.from(this.bankruptedPlayers),
      votekickedPlayers: Array.from(this.votekickedPlayers),
      activeVoteKick: this.activeVoteKick,
      // add more fields if needed
    };
    // console.log('[DEBUG SERVER] getGameState activeVoteKick:', this.activeVoteKick);
    // console.log('[DEBUG] getGameState propertyOwnership:', JSON.stringify(gameState.propertyOwnership));
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
    const houseCounts = setProps.map(k => {
      const p = this.propertyOwnership[k];
      if (p && p.hotel) return 5; // treat hotel as 5 for strict even build
      return p ? p.houses : 0;
    });
    const minHouses = Math.min(...houseCounts);
    // Only allow building if this property has the minimum number of houses
    if (property.hotel) return false;
    if (property.houses < 4) {
      return property.houses === minHouses;
    }
    // For hotel, all others must have 4 houses or a hotel
    if (property.houses === 4) {
      return setProps.every(k => {
        if (k === propertyName) return true;
        const p = this.propertyOwnership[k];
        return p && (p.houses === 4 || p.hotel);
      });
    }
    return false;
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

  // Sell property
  sellProperty(playerId, propertyName) {
    const property = this.propertyOwnership[propertyName];
    if (!property || property.owner !== playerId) return false;
    if (property.mortgaged) return false;
    if (property.houses > 0 || property.hotel) return false;
    const price = this.propertyData[propertyName]?.price || 0;
    if (!price) return false;
    delete this.propertyOwnership[propertyName];
    this.playerMoney[playerId] += Math.floor(price / 2);
    return true;
  }

  // Build house or hotel
  buildHouse(playerId, propertyName) {
    const property = this.propertyOwnership[propertyName];
    const data = this.propertyData[propertyName];
    if (!property || property.owner !== playerId) return false;
    if (!data || data.type !== 'property') return false;
    if (property.mortgaged) return false;
    if (property.hotel) return false;
    // Enforce even build only if enabled
    if (this.settings.evenBuild && !this.canBuildHouse(playerId, propertyName)) return false;
    // Build hotel
    if (property.houses === 4) {
      if (this.settings.evenBuild) {
        // Already checked in canBuildHouse
      }
      if (this.playerMoney[playerId] < data.hotelCost) return false;
      property.houses = 0;
      property.hotel = true;
      this.playerMoney[playerId] -= data.hotelCost;
      return true;
    }
    // Build house
    if (property.houses < 4) {
      if (this.playerMoney[playerId] < data.buildCost) return false;
      property.houses += 1;
      this.playerMoney[playerId] -= data.buildCost;
      return true;
    }
    return false;
  }
  // Destroy house or hotel
  destroyHouse(playerId, propertyName) {
    const property = this.propertyOwnership[propertyName];
    const data = this.propertyData[propertyName];
    if (!property || property.owner !== playerId) return false;
    if (!data || data.type !== 'property') return false;
    if (property.mortgaged) return false;
    // Enforce even build
    if (!this.canDestroyHouse(playerId, propertyName)) return false;
    // Destroy hotel
    if (property.hotel) {
      property.hotel = false;
      property.houses = 4;
      this.playerMoney[playerId] += Math.floor(data.hotelCost / 2);
      return true;
    }
    // Destroy house
    if (property.houses > 0) {
      property.houses -= 1;
      this.playerMoney[playerId] += Math.floor(data.buildCost / 2);
      return true;
    }
    return false;
  }

  // Trade system methods
  createTrade(createdBy, targetPlayerId, offers, note = '') {
    const tradeId = `trade-${this.id}-${++this.tradeCounter}`;
    const trade = {
      id: tradeId,
      createdBy,
      targetPlayerId,
      offers, // { playerId: { money: number, properties: [propertyName] } }
      note,
      status: 'pending', // pending, accepted, declined, cancelled
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.trades[tradeId] = trade;
    return trade;
  }

  updateTradeStatus(tradeId, status) {
    if (this.trades[tradeId]) {
      this.trades[tradeId].status = status;
      this.trades[tradeId].updatedAt = Date.now();
      return this.trades[tradeId];
    }
    return null;
  }

  executeTrade(tradeId) {
    const trade = this.trades[tradeId];
    if (!trade || trade.status !== 'pending') {
      return { success: false, error: 'Invalid trade or trade not accepted' };
    }

    const creatorId = trade.createdBy;
    const targetId = trade.targetPlayerId;
    const creatorOffer = trade.offers[creatorId] || { money: 0, properties: [] };
    const targetOffer = trade.offers[targetId] || { money: 0, properties: [] };

    // Validate players have sufficient resources
    const creatorPlayer = this.players.find(p => p.id === creatorId);
    const targetPlayer = this.players.find(p => p.id === targetId);
    
    if (!creatorPlayer || !targetPlayer) {
      return { success: false, error: 'One or both players not found' };
    }

    // Check money availability
    if (this.playerMoney[creatorId] < creatorOffer.money) {
      return { success: false, error: 'Creator does not have sufficient money' };
    }
    if (this.playerMoney[targetId] < targetOffer.money) {
      return { success: false, error: 'Target does not have sufficient money' };
    }

    // Check property ownership
    for (const propertyName of creatorOffer.properties) {
      if (!this.propertyOwnership[propertyName] || this.propertyOwnership[propertyName].owner !== creatorId) {
        return { success: false, error: `Creator does not own ${propertyName}` };
      }
    }
    for (const propertyName of targetOffer.properties) {
      if (!this.propertyOwnership[propertyName] || this.propertyOwnership[propertyName].owner !== targetId) {
        return { success: false, error: `Target does not own ${propertyName}` };
      }
    }

    // Execute the trade
    // Transfer money
    this.playerMoney[creatorId] -= creatorOffer.money;
    this.playerMoney[creatorId] += targetOffer.money;
    this.playerMoney[targetId] -= targetOffer.money;
    this.playerMoney[targetId] += creatorOffer.money;

    // Update player money in players array
    creatorPlayer.money = this.playerMoney[creatorId];
    targetPlayer.money = this.playerMoney[targetId];

    // Transfer properties
    for (const propertyName of creatorOffer.properties) {
      this.propertyOwnership[propertyName].owner = targetId;
      this.propertyOwnership[propertyName].ownerName = targetPlayer.name;
      this.propertyOwnership[propertyName].ownerColor = targetPlayer.color;
    }
    for (const propertyName of targetOffer.properties) {
      this.propertyOwnership[propertyName].owner = creatorId;
      this.propertyOwnership[propertyName].ownerName = creatorPlayer.name;
      this.propertyOwnership[propertyName].ownerColor = creatorPlayer.color;
    }

    // Mark trade as completed
    trade.status = 'completed';
    trade.updatedAt = Date.now();

    return { success: true, trade };
  }

  getTrades() {
    return Object.values(this.trades);
  }

  getActiveTrades() {
    return Object.values(this.trades).filter(trade => trade.status === 'pending');
  }

  cancelTrade(tradeId) {
    if (this.trades[tradeId]) {
      this.trades[tradeId].status = 'cancelled';
      this.trades[tradeId].updatedAt = Date.now();
      return this.trades[tradeId];
    }
    return null;
  }

  // Get properties owned by a player with their data
  getPlayerProperties(playerId) {
    const ownedProperties = [];
    for (const [propertyName, ownership] of Object.entries(this.propertyOwnership)) {
      if (ownership.owner === playerId) {
        const propertyData = this.propertyData[propertyName];
        if (propertyData) {
          ownedProperties.push({
            name: propertyName,
            ...propertyData,
            ...ownership
          });
        }
      }
    }
    return ownedProperties;
  }
  
  // Bankruptcy functionality
  bankruptPlayer(playerId, reason = 'bankrupt') {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return false;

    // Mark player as bankrupt or vote-kicked
    if (reason === 'votekick') {
      this.votekickedPlayers.add(playerId);
    } else {
      this.bankruptedPlayers.add(playerId);
    }

    // Transfer all properties to the bank
    const playerProperties = [];
    for (const [propertyName, ownership] of Object.entries(this.propertyOwnership)) {
      if (ownership.owner === playerId) {
        playerProperties.push(propertyName);
      }
    }

    // Remove all properties from ownership (return to bank)
    playerProperties.forEach(propertyName => {
      delete this.propertyOwnership[propertyName];
    });

    // Set player money to 0
    this.playerMoney[playerId] = 0;

    // Remove player from board (this will make their avatar disappear)
    delete this.playerPositions[playerId];
    delete this.playerStatuses[playerId];
    delete this.playerJailCards[playerId];
    delete this.playerJailRounds[playerId];
    delete this.playerDoublesCount[playerId];

    // Log the bankruptcy (but not for vote-kick since we already logged the kick message)
    if (reason !== 'votekick') {
      this.addGameLog({
        type: 'bankruptcy',
        playerId,
        message: `${player.name} bankrupted all their properties and assets to the bank and ended their game.`
      });
    }

    return { properties: playerProperties, playerName: player.name };
  }

  // Vote-kick functionality
  startVoteKick(targetPlayerId, initiatorId) {
    // console.log('[DEBUG SERVER] startVoteKick called:', { targetPlayerId, initiatorId });
    // Can't vote-kick if already in progress
    if (this.activeVoteKick) return false;
    
    // Can't vote-kick bankrupt or already kicked players
    if (this.bankruptedPlayers.has(targetPlayerId) || this.votekickedPlayers.has(targetPlayerId)) {
      return false;
    }

    const targetPlayer = this.players.find(p => p.id === targetPlayerId);
    const initiatorPlayer = this.players.find(p => p.id === initiatorId);
    
    if (!targetPlayer || !initiatorPlayer) return false;

    const now = Date.now();
    this.activeVoteKick = {
      targetPlayerId,
      targetPlayerName: targetPlayer.name,
      votes: new Set([initiatorId]), // Initiator automatically votes
      startTime: now,
      endTime: now + 1 * 60 * 1000, // 5 minutes
      initiatorName: initiatorPlayer.name
    };

    // Add log for vote-kick start
    const logEntry = {
      type: 'votekick',
      message: `${initiatorPlayer.name} decided to votekick ${targetPlayer.name}, 1/${this.getRequiredVotes()} votekicks logged.`
    };
    this.addGameLog(logEntry);

    // Set timer for auto-kick
    if (this.voteKickTimer) {
      clearTimeout(this.voteKickTimer);
    }
    
    this.voteKickTimer = setTimeout(() => {
      this.executeVoteKick();
    }, 5 * 60 * 1000);

    return { success: true, logEntry };
  }

  addVoteKick(voterId) {
    if (!this.activeVoteKick) return false;
    
    // Can't vote for yourself or if already voted
    if (voterId === this.activeVoteKick.targetPlayerId || this.activeVoteKick.votes.has(voterId)) {
      return false;
    }

    // Can't vote if bankrupt or kicked
    if (this.bankruptedPlayers.has(voterId) || this.votekickedPlayers.has(voterId)) {
      return false;
    }

    const voterPlayer = this.players.find(p => p.id === voterId);
    if (!voterPlayer) return false;

    this.activeVoteKick.votes.add(voterId);
    
    const currentVotes = this.activeVoteKick.votes.size;
    const requiredVotes = this.getRequiredVotes();

    // Add log for additional vote
    const logEntry = {
      type: 'votekick',
      message: `${voterPlayer.name} decided to votekick ${this.activeVoteKick.targetPlayerName}, ${currentVotes}/${requiredVotes} votekicks logged.`
    };
    this.addGameLog(logEntry);

    // Check if we have enough votes
    if (currentVotes >= requiredVotes) {
      const targetPlayerId = this.activeVoteKick.targetPlayerId;
      const executeResult = this.executeVoteKick();
      return { 
        executed: true, 
        targetPlayerId, 
        logEntry, 
        kickLog: executeResult.kickLog,
        wasCurrentPlayer: executeResult.wasCurrentPlayer
      };
    }

    return { executed: false, votes: currentVotes, required: requiredVotes, logEntry };
  }

  getRequiredVotes() {
    // Half of active players + 1 (including bankrupt but not kicked players for voting)
    const activePlayers = this.players.filter(p => !this.votekickedPlayers.has(p.id));
    return Math.floor(activePlayers.length / 2) + 1;
  }

  executeVoteKick() {
    if (!this.activeVoteKick) return false;

    const targetPlayerId = this.activeVoteKick.targetPlayerId;
    const targetPlayerName = this.activeVoteKick.targetPlayerName;
    
    // Clear timer
    if (this.voteKickTimer) {
      clearTimeout(this.voteKickTimer);
      this.voteKickTimer = null;
    }

    // Add kick message before bankrupting
    const kickLog = {
      type: 'votekick',
      message: `${targetPlayerName} was kicked out of the game.`
    };
    this.addGameLog(kickLog);

    // Check if the kicked player is the current player
    const isCurrentPlayer = this.players[this.turnIndex]?.id === targetPlayerId;
    
    // If kicked player had a pending dice roll, clear it
    if (isCurrentPlayer && this.lastDiceRoll && this.lastDiceRoll.playerId === targetPlayerId) {
      this.lastDiceRoll = null;
    }

    // Bankrupt the player with vote-kick reason
    this.bankruptPlayer(targetPlayerId, 'votekick');

    // Clear active vote-kick
    this.activeVoteKick = null;

    return { kickLog, wasCurrentPlayer: isCurrentPlayer };
  }

  cancelVoteKick() {
    if (!this.activeVoteKick) return false;

    // console.log('[DEBUG SERVER] cancelVoteKick called for target:', this.activeVoteKick.targetPlayerName);

    // Clear timer
    if (this.voteKickTimer) {
      clearTimeout(this.voteKickTimer);
      this.voteKickTimer = null;
      // console.log('[DEBUG SERVER] cancelVoteKick: cleared voteKickTimer');
    }

    this.addGameLog({
      type: 'system',
      message: `Vote-kick against ${this.activeVoteKick.targetPlayerName} was cancelled.`
    });

    this.activeVoteKick = null;
    return true;
  }

  // Check if player can play (not bankrupt or kicked)
  canPlayerPlay(playerId) {
    return !this.bankruptedPlayers.has(playerId) && !this.votekickedPlayers.has(playerId);
  }

  // Get active playing players only
  getActivePlayers() {
    return this.players.filter(p => this.canPlayerPlay(p.id));
  }
}

module.exports = Room;
