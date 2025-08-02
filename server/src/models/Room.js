// server/src/models/Room.js
const treasureCards = require('../data/treasureCards');
const surpriseCards = require('../data/surpriseCards');

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
    this.playerNegativeBalance = {}; // { playerId: boolean } for tracking negative balance state
    
    // Debt tracking system
    this.playerDebts = {}; // { debtorPlayerId: { creditorPlayerId: amount } } for tracking unpaid debts

    // Property data from classic map
    this.propertyData = {
      // Brazil set
      'Salvador': { type: 'property', set: 'Brazil', price: 60, rent: [2, 10, 10, 90, 160, 250], buildCost: 50, hotelCost: 50 },
      'Rio': { type: 'property', set: 'Brazil', price: 60, rent: [4, 20, 60, 180, 320, 450], buildCost: 50, hotelCost: 50 },
      // Airport
      'TLV Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
      // Israel set
      'Tel Aviv': { type: 'property', set: 'Israel', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50, hotelCost: 50 },
      'Haifa': { type: 'property', set: 'Israel', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50, hotelCost: 50 },
      'Jerusalem': { type: 'property', set: 'Israel', price: 120, rent: [8, 40, 100, 300, 450, 600], buildCost: 50, hotelCost: 50 },
      // Italy set
      'Venice': { type: 'property', set: 'Italy', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100, hotelCost: 100 },
      'Milan': { type: 'property', set: 'Italy', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100, hotelCost: 100 },
      'Rome': { type: 'property', set: 'Italy', price: 160, rent: [12, 60, 180, 500, 700, 900], buildCost: 100, hotelCost: 100 },
      // Airport
      'MUC Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
      // Germany set
      'Frankfurt': { type: 'property', set: 'Germany', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100, hotelCost: 100 },
      'Munich': { type: 'property', set: 'Germany', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100, hotelCost: 100 },
      'Berlin': { type: 'property', set: 'Germany', price: 200, rent: [16, 80, 220, 600, 800, 1000], buildCost: 100, hotelCost: 100 },
      // China set
      'Shenzhen': { type: 'property', set: 'China', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150, hotelCost: 150 },
      'Beijing': { type: 'property', set: 'China', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150, hotelCost: 150 },
      'Shanghai': { type: 'property', set: 'China', price: 240, rent: [20, 100, 300, 750, 925, 1100], buildCost: 150, hotelCost: 150 },
      // Airport
      'CDG Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
      // France set
      'Lyon': { type: 'property', set: 'France', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150, hotelCost: 150 },
      'Toulouse': { type: 'property', set: 'France', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150, hotelCost: 150 },
      'Paris': { type: 'property', set: 'France', price: 280, rent: [24, 120, 360, 850, 1025, 1200], buildCost: 150, hotelCost: 150 },
      // UK set
      'Liverpool': { type: 'property', set: 'UK', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200, hotelCost: 200 },
      'Manchester': { type: 'property', set: 'UK', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200, hotelCost: 200 },
      'London': { type: 'property', set: 'UK', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], buildCost: 200, hotelCost: 200 },
      // Airport
      'JFK Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
      // USA set
      'California': { type: 'property', set: 'USA', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], buildCost: 200, hotelCost: 200 },
      'New York': { type: 'property', set: 'USA', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], buildCost: 200, hotelCost: 200 },
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
    } else if ([2, 17, 33].includes(newPos)) { // Treasure spaces
      action = 'treasure';
    } else if ([7, 22, 36].includes(newPos)) { // Surprise spaces
      action = 'surprise';
    }

    return { action, position: newPos, passedStart };
  }

  // Helper method to get property position on board
  getPropertyPosition(propertyName) {
    const propertyMap = {
      'Salvador': 1, 'Rio': 3, 'Tel Aviv': 6, 'Haifa': 8, 'Jerusalem': 9,
      'Venice': 11, 'Milan': 13, 'Rome': 14, 'Frankfurt': 16, 'Munich': 18, 
      'Berlin': 19, 'Shenzhen': 21, 'Beijing': 23, 'Shanghai': 24,
      'Lyon': 26, 'Toulouse': 27, 'Paris': 29, 'Liverpool': 31, 
      'Manchester': 32, 'London': 34, 'California': 37, 'New York': 39
    };
    return propertyMap[propertyName] || null;
  }

  // Helper method to get property name by position on board
  getPropertyNameByPosition(position) {
    const positionMap = {
      1: 'Salvador', 2: 'Treasure', 3: 'Rio', 4: 'Income Tax', 5: 'TLV Airport',
      6: 'Tel Aviv', 7: 'Surprise', 8: 'Haifa', 9: 'Jerusalem', 10: 'Jail',
      11: 'Venice', 12: 'Electric Company', 13: 'Milan', 14: 'Rome', 15: 'MUC Airport',
      16: 'Frankfurt', 17: 'Treasure', 18: 'Munich', 19: 'Berlin', 20: 'Vacation',
      21: 'Shenzhen', 22: 'Surprise', 23: 'Beijing', 24: 'Shanghai', 25: 'CDG Airport',
      26: 'Lyon', 27: 'Toulouse', 28: 'Water Company', 29: 'Paris', 30: 'Go to Jail',
      31: 'Liverpool', 32: 'Manchester', 33: 'Treasure', 34: 'London', 35: 'JFK Airport',
      36: 'Surprise', 37: 'California', 38: 'Luxury Tax', 39: 'New York', 0: 'START'
    };
    return positionMap[position] || null;
  }

  // Method to draw and execute a treasure card
  drawTreasureCard(playerId) {
    const card = treasureCards[Math.floor(Math.random() * treasureCards.length)];
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    const result = {
      card,
      playerId,
      playerName: player.name,
      logs: []
    };

    // Add the main card message
    result.logs.push({
      type: 'treasure',
      player: player.name,
      message: `got a treasure card: ${card.message}`
    });

    // Execute card action
    switch (card.action) {
      case 'payMoney':
        this.playerMoney[playerId] -= card.amount;
        break;

      case 'receiveMoney':
        this.playerMoney[playerId] += card.amount;
        break;

      case 'collectFromPlayers':
        // Collect money from all other players
        this.players.forEach(otherPlayer => {
          if (otherPlayer.id !== playerId) {
            const amountToCollect = Math.min(card.amount, this.playerMoney[otherPlayer.id]);
            this.playerMoney[otherPlayer.id] -= amountToCollect;
            this.playerMoney[playerId] += amountToCollect;
            result.logs.push({
              type: 'transaction',
              player: otherPlayer.name,
              message: `paid $${amountToCollect} to ${player.name}`
            });
          }
        });
        break;

      case 'receiveJailCard':
        this.playerJailCards[playerId] = (this.playerJailCards[playerId] || 0) + 1;
        break;

      case 'moveToPosition':
        const oldPosition = this.playerPositions[playerId];
        this.playerPositions[playerId] = card.position;
        
        // Check if passed START
        if (oldPosition > card.position && card.position === 0) {
          // Moved to START, collect $300
          if (card.collectStart) {
            this.playerMoney[playerId] += 300;
            result.logs.push({
              type: 'movement',
              player: player.name,
              message: `moved to START and collected $300`
            });
          }
        } else if (oldPosition > card.position) {
          // Passed START while moving backward, collect $200
          this.playerMoney[playerId] += 200;
          result.logs.push({
            type: 'movement',
            player: player.name,
            message: `passed START and collected $200`
          });
        }
        
        result.movement = {
          fromPosition: oldPosition,
          toPosition: card.position,
          passedStart: oldPosition > card.position
        };
        break;
    }

    return result;
  }

  // Method to draw and execute a surprise card
  drawSurpriseCard(playerId) {
    const card = surpriseCards[Math.floor(Math.random() * surpriseCards.length)];
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    const result = {
      card,
      playerId,
      playerName: player.name,
      logs: []
    };

    // Add the main card message
    result.logs.push({
      type: 'surprise',
      player: player.name,
      message: `got a surprise card: ${card.message}`
    });

    // Execute card action
    switch (card.action) {
      case 'receiveJailCard':
        this.playerJailCards[playerId] = (this.playerJailCards[playerId] || 0) + 1;
        break;

      case 'payForBuildings':
        let totalCost = 0;
        Object.values(this.propertyOwnership).forEach(property => {
          if (property.owner === playerId) {
            if (property.houses > 0) {
              totalCost += property.houses * card.houseCost;
            }
            if (property.hotel) {
              totalCost += card.hotelCost;
            }
          }
        });
        this.playerMoney[playerId] -= totalCost;
        if (totalCost > 0) {
          result.logs.push({
            type: 'transaction',
            player: player.name,
            message: `paid $${totalCost} for property improvements`
          });
        }
        break;

      case 'payToPlayers':
        // Pay money to all other players
        this.players.forEach(otherPlayer => {
          if (otherPlayer.id !== playerId) {
            const amountToPay = Math.min(card.amount, this.playerMoney[playerId]);
            if (amountToPay > 0) {
              this.playerMoney[playerId] -= amountToPay;
              this.playerMoney[otherPlayer.id] += amountToPay;
              result.logs.push({
                type: 'transaction',
                player: player.name,
                message: `paid $${amountToPay} to ${otherPlayer.name}`
              });
            }
          }
        });
        break;

      case 'payMoney':
        this.playerMoney[playerId] -= card.amount;
        break;

      case 'receiveMoney':
        this.playerMoney[playerId] += card.amount;
        break;

      case 'moveToProperty':
        const targetPosition = this.getPropertyPosition(card.propertyName);
        if (targetPosition !== null) {
          const oldPosition = this.playerPositions[playerId];
          this.playerPositions[playerId] = targetPosition;
          
          // Check if passed START
          if (oldPosition > targetPosition) {
            // Passed START while moving
            this.playerMoney[playerId] += 200;
            result.logs.push({
              type: 'movement',
              player: player.name,
              message: `passed START and collected $200`
            });
          }
          
          result.movement = {
            fromPosition: oldPosition,
            toPosition: targetPosition,
            passedStart: oldPosition > targetPosition,
            propertyLanding: card.propertyName
          };
        }
        break;

      case 'moveToPosition':
        const oldPos = this.playerPositions[playerId];
        this.playerPositions[playerId] = card.position;
        
        // Check if passed START or landed on START
        if (card.position === 0) {
          // Moved to START, collect $300
          if (card.collectStart) {
            this.playerMoney[playerId] += 300;
            result.logs.push({
              type: 'movement',
              player: player.name,
              message: `moved to START and collected $300`
            });
          }
        } else if (oldPos > card.position) {
          // Passed START while moving
          this.playerMoney[playerId] += 200;
          result.logs.push({
            type: 'movement',
            player: player.name,
            message: `passed START and collected $200`
          });
        }
        
        result.movement = {
          fromPosition: oldPos,
          toPosition: card.position,
          passedStart: oldPos > card.position || card.position === 0
        };
        break;

      case 'goToJail':
        this.playerPositions[playerId] = 10;
        this.playerStatuses[playerId] = 'jail';
        this.playerJailRounds[playerId] = 0;
        this.playerDoublesCount[playerId] = 0;
        result.movement = {
          fromPosition: this.playerPositions[playerId],
          toPosition: 10,
          goToJail: true
        };
        break;

      case 'moveBackward':
        const currentPos = this.playerPositions[playerId];
        let newPos = currentPos - card.steps;
        
        // Handle wrapping around the board
        if (newPos < 0) {
          newPos = 40 + newPos; // Go around the board
          // Passed START while going backward
          this.playerMoney[playerId] += 200;
          result.logs.push({
            type: 'movement',
            player: player.name,
            message: `passed START and collected $200`
          });
        }
        
        this.playerPositions[playerId] = newPos;
        result.movement = {
          fromPosition: currentPos,
          toPosition: newPos,
          passedStart: newPos > currentPos
        };
        break;
    }

    return result;
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
      playerNegativeBalance: this.playerNegativeBalance,
      // Debt tracking
      playerDebts: this.playerDebts,
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
    const property = this.propertyOwnership[propertyName];
    const data = this.propertyData[propertyName];
    
    // Basic requirements
    if (!property || property.owner !== playerId) return false;
    if (!data || data.type !== 'property') return false;
    if (property.mortgaged) return false;
    if (property.hotel) return false; // Can't build on a hotel
    
    // Check if player has enough money
    if (!this.playerMoney[playerId] || this.playerMoney[playerId] < data.buildCost) return false;
    
    // Check if player owns all properties in the set
    const set = data.set;
    const setProps = Object.keys(this.propertyData).filter(
      k => this.propertyData[k].set === set && this.propertyData[k].type === 'property'
    );
    const ownsAllInSet = setProps.every(k => {
      const p = this.propertyOwnership[k];
      return p && p.owner === playerId;
    });
    if (!ownsAllInSet) return false;

    // Check if any property in set is mortgaged
    const anyMortgaged = setProps.some(k => {
      const p = this.propertyOwnership[k];
      return p && p.mortgaged;
    });
    if (anyMortgaged) return false;

    // If even build is OFF, allow building without restrictions (as long as basic requirements are met)
    if (!this.settings.evenBuild) return true;

    // Even build logic - only applies when setting is ON
    const houseCounts = setProps.map(k => {
      const p = this.propertyOwnership[k];
      if (p && p.hotel) return 5; // treat hotel as 5 for strict even build
      return p ? p.houses : 0;
    });
    const minHouses = Math.min(...houseCounts);
    
    // Only allow building if this property has the minimum number of houses
    if (property.houses < 4) {
      return property.houses === minHouses;
    }
    
    // For hotel (when property has 4 houses), all others must have 4 houses or a hotel
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
    const property = this.propertyOwnership[propertyName];
    const data = this.propertyData[propertyName];
    
    // Basic requirements
    if (!property || property.owner !== playerId) return false;
    if (!data || data.type !== 'property') return false;
    if (property.mortgaged) return false;
    if (property.houses === 0 && !property.hotel) return false; // Nothing to destroy
    
    // If even build is OFF, allow destroying without restrictions
    if (!this.settings.evenBuild) return true;

    // Even build logic - only applies when setting is ON
    const set = data.set;
    const setProps = Object.keys(this.propertyData).filter(
      k => this.propertyData[k].set === set && this.propertyData[k].type === 'property'
    );
    const houseCounts = setProps.map(k => {
      const p = this.propertyOwnership[k];
      if (p && p.hotel) return 5; // treat hotel as 5 for even build
      return p ? p.houses : 0;
    });
    const maxHouses = Math.max(...houseCounts);
    const currentCount = property.hotel ? 5 : property.houses;
    return currentCount >= maxHouses;
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
    
    // Use the comprehensive canBuildHouse check
    if (!this.canBuildHouse(playerId, propertyName)) return false;
    
    // Build hotel
    if (property.houses === 4) {
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
    
    // Use the comprehensive canDestroyHouse check
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
      offers, // { playerId: { money: number, properties: [propertyName], pardonCards: number } }
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
    const creatorOffer = trade.offers[creatorId] || { money: 0, properties: [], pardonCards: 0 };
    const targetOffer = trade.offers[targetId] || { money: 0, properties: [], pardonCards: 0 };

    // Validate players have sufficient resources
    const creatorPlayer = this.players.find(p => p.id === creatorId);
    const targetPlayer = this.players.find(p => p.id === targetId);
    
    if (!creatorPlayer || !targetPlayer) {
      return { success: false, error: 'One or both players not found' };
    }

    // Check money availability - only validate if they're actually offering money
    if (creatorOffer.money > 0 && this.playerMoney[creatorId] < creatorOffer.money) {
      return { success: false, error: 'Creator does not have sufficient money' };
    }
    if (targetOffer.money > 0 && this.playerMoney[targetId] < targetOffer.money) {
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

    // Check pardon card availability
    if (creatorOffer.pardonCards > (this.playerJailCards[creatorId] || 0)) {
      return { success: false, error: 'Creator does not have enough pardon cards' };
    }
    if (targetOffer.pardonCards > (this.playerJailCards[targetId] || 0)) {
      return { success: false, error: 'Target does not have enough pardon cards' };
    }

    // Execute the trade
    // Handle money transfers and debt payments
    
    // First, subtract money being offered
    if (creatorOffer.money > 0) {
      this.playerMoney[creatorId] -= creatorOffer.money;
    }
    if (targetOffer.money > 0) {
      this.playerMoney[targetId] -= targetOffer.money;
    }
    
    // Process debt payments for money received (before adding to player balance)
    const creatorDebtResult = targetOffer.money > 0 ? this.processDebtPayments(creatorId, targetOffer.money) : { payments: [], remainingMoney: 0 };
    const targetDebtResult = creatorOffer.money > 0 ? this.processDebtPayments(targetId, creatorOffer.money) : { payments: [], remainingMoney: 0 };
    
    // Add only remaining money after debt payments
    if (targetOffer.money > 0) {
      this.playerMoney[creatorId] += creatorDebtResult.remainingMoney;
    }
    if (creatorOffer.money > 0) {
      this.playerMoney[targetId] += targetDebtResult.remainingMoney;
    }

    // Update player money in players array
    creatorPlayer.money = this.playerMoney[creatorId];
    targetPlayer.money = this.playerMoney[targetId];
    
    // Check if players recovered from negative balance
    if (this.playerMoney[creatorId] >= 0 && this.playerNegativeBalance[creatorId]) {
      this.playerNegativeBalance[creatorId] = false;
    }
    if (this.playerMoney[targetId] >= 0 && this.playerNegativeBalance[targetId]) {
      this.playerNegativeBalance[targetId] = false;
    }

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

    // Transfer pardon cards
    if (creatorOffer.pardonCards > 0) {
      this.playerJailCards[creatorId] = (this.playerJailCards[creatorId] || 0) - creatorOffer.pardonCards;
      this.playerJailCards[targetId] = (this.playerJailCards[targetId] || 0) + creatorOffer.pardonCards;
    }
    if (targetOffer.pardonCards > 0) {
      this.playerJailCards[targetId] = (this.playerJailCards[targetId] || 0) - targetOffer.pardonCards;
      this.playerJailCards[creatorId] = (this.playerJailCards[creatorId] || 0) + targetOffer.pardonCards;
    }

    // Mark trade as completed
    trade.status = 'completed';
    trade.updatedAt = Date.now();

    return { 
      success: true, 
      trade,
      debtPayments: {
        creator: creatorDebtResult.payments,
        target: targetDebtResult.payments
      }
    };
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

  // Get all tradeable assets for a player (properties + pardon cards)
  getPlayerTradeableAssets(playerId) {
    // Get properties (filter out those with buildings)
    const properties = this.getPlayerProperties(playerId).filter(property => 
      property.houses === 0 && !property.hotel
    );
    
    // Get pardon cards
    const pardonCards = this.playerJailCards[playerId] || 0;
    
    return {
      properties: properties.map(p => ({
        name: p.name,
        price: p.price,
        type: p.type,
        set: p.set
      })),
      pardonCards
    };
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

  // Check if game should end (only one active player remaining)
  checkGameEnd() {
    const activePlayers = this.getActivePlayers();
    
    if (activePlayers.length <= 1 && this.gameState === 'in-progress') {
      this.gameState = 'finished';
      
      if (activePlayers.length === 1) {
        const winner = activePlayers[0];
        this.addGameLog({
          type: 'game-over',
          playerId: winner.id,
          message: `${winner.name} wins the game! All other players have been eliminated.`
        });
        
        return {
          gameOver: true,
          winner: {
            id: winner.id,
            name: winner.name,
            color: winner.color,
            money: this.playerMoney[winner.id] || winner.money
          }
        };
      } else {
        // No winners (shouldn't happen, but handle gracefully)
        this.addGameLog({
          type: 'game-over',
          message: 'Game ended with no remaining players.'
        });
        
        return {
          gameOver: true,
          winner: null
        };
      }
    }
    
    return { gameOver: false };
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
      endTime: now + 3 * 60 * 1000, // 3 minutes
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

  // ===== DEBT MANAGEMENT SYSTEM =====
  
  // Add debt to a player (when they can't pay full rent)
  addDebt(debtorId, creditorId, amount) {
    if (!this.playerDebts[debtorId]) {
      this.playerDebts[debtorId] = {};
    }
    this.playerDebts[debtorId][creditorId] = (this.playerDebts[debtorId][creditorId] || 0) + amount;
  }

  // Get total debt owed by a player
  getTotalDebt(playerId) {
    if (!this.playerDebts[playerId]) return 0;
    return Object.values(this.playerDebts[playerId]).reduce((sum, debt) => sum + debt, 0);
  }

  // Process payment of debts when player gains money
  processDebtPayments(playerId, moneyGained) {
    if (!this.playerDebts[playerId] || moneyGained <= 0) return { payments: [], remainingMoney: moneyGained };

    console.log(`[DEBUG] processDebtPayments: ${playerId} gained ${moneyGained} money, current debts:`, this.playerDebts[playerId]);

    const payments = [];
    let remainingMoney = moneyGained;
    let totalPaidToDebts = 0;

    // Pay debts in the order they were created (FIFO)
    for (const creditorId in this.playerDebts[playerId]) {
      if (remainingMoney <= 0) break;

      const debtAmount = this.playerDebts[playerId][creditorId];
      const paymentAmount = Math.min(debtAmount, remainingMoney);

      console.log(`[DEBUG] Paying ${paymentAmount} to ${creditorId} (debt was ${debtAmount})`);

      if (paymentAmount > 0) {
        // Transfer money to creditor
        this.playerMoney[creditorId] += paymentAmount;
        
        // Reduce debt
        this.playerDebts[playerId][creditorId] -= paymentAmount;
        if (this.playerDebts[playerId][creditorId] <= 0) {
          delete this.playerDebts[playerId][creditorId];
        }

        // Track remaining money and total paid to debts
        remainingMoney -= paymentAmount;
        totalPaidToDebts += paymentAmount;

        payments.push({
          creditorId,
          creditorName: this.players.find(p => p.id === creditorId)?.name,
          amount: paymentAmount,
          remainingDebt: this.playerDebts[playerId][creditorId] || 0
        });
      }
    }

    // IMPORTANT: Increase player's balance by the total amount paid to debts
    // This handles negative balance scenarios correctly
    if (totalPaidToDebts > 0) {
      this.playerMoney[playerId] += totalPaidToDebts;
      console.log(`[DEBUG] Increased player ${playerId} balance by ${totalPaidToDebts} for debt payments (new balance: ${this.playerMoney[playerId]})`);
    }

    // Clean up empty debt object
    if (Object.keys(this.playerDebts[playerId]).length === 0) {
      delete this.playerDebts[playerId];
    }

    console.log(`[DEBUG] Debt payments completed, remaining money: ${remainingMoney}, total paid to debts: ${totalPaidToDebts}, payments:`, payments);

    return { payments, remainingMoney };
  }

  // Handle rent payment with debt tracking
  payRentWithDebt(payerId, ownerId, propertyName, rentAmount) {
    const availableMoney = this.playerMoney[payerId];
    const actualPayment = Math.min(availableMoney, rentAmount);
    const remainingDebt = rentAmount - actualPayment;

    console.log(`[DEBUG] payRentWithDebt: ${payerId} owes ${rentAmount} rent, has ${availableMoney} money`);
    console.log(`[DEBUG] Will pay ${actualPayment}, remaining debt ${remainingDebt}`);

    // IMPORTANT: Deduct FULL rent amount from payer (creating negative balance if needed)
    this.playerMoney[payerId] -= rentAmount;
    
    // Credit owner with only the available money (not full rent)
    if (actualPayment > 0) {
      this.playerMoney[ownerId] += actualPayment;
    }

    // Track remaining debt if any
    if (remainingDebt > 0) {
      this.addDebt(payerId, ownerId, remainingDebt);
      this.playerNegativeBalance[payerId] = true;
    }

    console.log(`[DEBUG] After payment: ${payerId} has ${this.playerMoney[payerId]} money, ${ownerId} received ${actualPayment}`);

    return {
      actualPayment,
      remainingDebt,
      totalRent: rentAmount
    };
  }

  // Handle property sale with debt payment
  sellPropertyWithDebtPayment(playerId, propertyName) {
    // Check if property can be sold first
    const property = this.propertyOwnership[propertyName];
    if (!property || property.owner !== playerId) return { success: false, payments: [] };
    if (property.mortgaged) return { success: false, payments: [] };
    if (property.houses > 0 || property.hotel) return { success: false, payments: [] };
    const price = this.propertyData[propertyName]?.price || 0;
    if (!price) return { success: false, payments: [] };

    // Get money gained from sale (don't add to player yet)
    const salePrice = Math.floor(price / 2);
    
    // Remove property ownership
    delete this.propertyOwnership[propertyName];
    
    // Process debt payments first, then add only remaining money to player
    const debtResult = this.processDebtPayments(playerId, salePrice);
    
    // Add only the remaining money to player after debt payments
    this.playerMoney[playerId] += debtResult.remainingMoney;

    // Check if player still has negative balance
    if (this.playerMoney[playerId] >= 0) {
      this.playerNegativeBalance[playerId] = false;
    }

    return { success: true, salePrice, payments: debtResult.payments };
  }

  // Handle mortgage with debt payment
  mortgagePropertyWithDebtPayment(playerId, propertyName) {
    // Check if property can be mortgaged first
    if (!this.settings.mortgage) return { success: false, payments: [] };
    const property = this.propertyOwnership[propertyName];
    if (!property || property.owner !== playerId) return { success: false, payments: [] };
    if (property.mortgaged) return { success: false, payments: [] };
    if (property.houses > 0 || property.hotel) return { success: false, payments: [] };

    // Get money gained from mortgage (don't add to player yet)
    const mortgageAmount = Math.floor(this.propertyData[propertyName].price / 2);
    
    // Mortgage the property
    property.mortgaged = true;
    
    // Process debt payments first, then add only remaining money to player
    const debtResult = this.processDebtPayments(playerId, mortgageAmount);
    
    // Add only the remaining money to player after debt payments
    this.playerMoney[playerId] += debtResult.remainingMoney;

    // Check if player still has negative balance
    if (this.playerMoney[playerId] >= 0) {
      this.playerNegativeBalance[playerId] = false;
    }

    return { success: true, mortgageAmount, payments: debtResult.payments };
  }

  // Automatic bankruptcy handling when player cannot pay debts
  processBankruptcy(playerId) {
    console.log(`[DEBUG] Processing bankruptcy for player ${playerId}`);
    
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false };

    let totalLiquidated = 0;
    const liquidationLog = [];

    // 1. Destroy all houses/hotels and collect money
    for (const propertyName in this.propertyOwnership) {
      const property = this.propertyOwnership[propertyName];
      if (property.owner === playerId) {
        // Destroy houses/hotels
        if (property.houses > 0) {
          const houseValue = property.houses * Math.floor(this.propertyData[propertyName].housePrice / 2);
          totalLiquidated += houseValue;
          liquidationLog.push(`Destroyed ${property.houses} houses on ${propertyName} for $${houseValue}`);
          property.houses = 0;
        }
        if (property.hotel) {
          const hotelValue = Math.floor(this.propertyData[propertyName].housePrice * 5 / 2); // 5 houses worth
          totalLiquidated += hotelValue;
          liquidationLog.push(`Destroyed hotel on ${propertyName} for $${hotelValue}`);
          property.hotel = false;
        }

        // Sell unmortgaged properties
        if (!property.mortgaged) {
          const saleValue = Math.floor(this.propertyData[propertyName].price / 2);
          totalLiquidated += saleValue;
          liquidationLog.push(`Sold ${propertyName} for $${saleValue}`);
          delete this.propertyOwnership[propertyName];
        } else {
          // Mortgaged properties go back to bank with no value
          liquidationLog.push(`${propertyName} (mortgaged) returned to bank`);
          delete this.propertyOwnership[propertyName];
        }
      }
    }

    // 2. Process debt payments with liquidated assets
    const debtResult = this.processDebtPayments(playerId, totalLiquidated);
    
    // 3. Mark player as bankrupt
    this.bankruptedPlayers = this.bankruptedPlayers || new Set();
    this.bankruptedPlayers.add(playerId);
    
    // 4. Clear remaining debts (if any)
    if (this.playerDebts[playerId]) {
      delete this.playerDebts[playerId];
    }
    
    // 5. Clear negative balance flag
    if (this.playerNegativeBalance[playerId]) {
      this.playerNegativeBalance[playerId] = false;
    }

    // 6. Set player money to 0
    this.playerMoney[playerId] = 0;

    console.log(`[DEBUG] Bankruptcy processed: liquidated $${totalLiquidated}, paid ${debtResult.payments.length} debts`);

    return {
      success: true,
      totalLiquidated,
      debtPayments: debtResult.payments,
      liquidationLog
    };
  }

  // Reset room for new game while keeping same room ID and settings
  resetForNewGame() {
    // Clear all players - they need to rejoin for the new game
    this.players = [];
    
    // Clear hostId and hostName so first player to rejoin becomes new host
    this.hostId = null;
    this.hostName = null;
    
    // Reset game state to initial values
    this.gameState = 'waiting';
    this.turnIndex = 0;
    this.roundNumber = 1;
    this.playerPositions = {};
    this.playerMoney = {};
    this.playerStatuses = {};
    this.playerJailCards = {};
    this.playerJailRounds = {};
    this.playerDoublesCount = {};
    this.propertyOwnership = {};
    this.lastDiceRoll = null;
    this.gameLog = [];
    this.collectedMoney = {};
    this.vacationCash = 0;
    
    // Reset trade system
    this.trades = {};
    this.tradeCounter = 0;
    
    // Reset bankruptcy and vote-kick system
    this.bankruptedPlayers.clear();
    this.votekickedPlayers.clear();
    this.activeVoteKick = null;
    this.playerNegativeBalance = {};
    
    // Reset debt system
    this.playerDebts = {};
    
    // Clear vote-kick timer if it exists
    if (this.voteKickTimer) {
      clearTimeout(this.voteKickTimer);
      this.voteKickTimer = null;
    }
    
    // Other game state resets
    this.allowRollAgain = false;
    this.doublesSequenceActive = false;
    this.pendingSpecialAction = null;
  }
}

module.exports = Room;
