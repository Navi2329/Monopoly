// server/src/socket/roomHandlers.js
const roomService = require('../services/roomService');
const { v4: uuidv4 } = require('uuid');

// Helper to push to room log and emit to all clients
function pushGameLog(room, logEntry, io) {
  // console.log('[DEBUG][SERVER][pushGameLog]', logEntry);
  room.addGameLog(logEntry);
  io.to(room.id).emit('gameLogUpdated', logEntry);
}

// Helper to emit all logs after advanceTurn
function emitAdvanceTurnLogs(room, turnResult, io) {
  // console.log('[DEBUG] emitAdvanceTurnLogs called for round', room.roundNumber, 'at', Date.now());
  if (turnResult && turnResult.orderedEvents) {
    let roundStartLogged = false;
    turnResult.orderedEvents.forEach(event => {
      if (event.type === 'round-start') {
        pushGameLog(room, {
          type: 'system',
          message: event.message
        }, io);
        roundStartLogged = true;
      }
    });
    // Removed fallback for duplicate round-start log
  }
  if (turnResult && turnResult.vacationReturnEvents) {
    turnResult.vacationReturnEvents.forEach(event => {
      const player = room.players.find(p => p.id === event.playerId);
      if (player) {
        pushGameLog(room, {
          type: 'special',
          player: player.name,
          message: event.message
        }, io);
      }
    });
  }
}

// Add a helper to emit gameStateUpdated with a unique debug marker
function emitGameStateUpdated(room, io, roomId, extra = {}) {
  const gameState = room.getGameState();
  // Attach doubles flags for client
  gameState.allowRollAgain = room.allowRollAgain || false;
  gameState.doublesSequenceActive = room.doublesSequenceActive || false;
  // Attach any extra fields passed in
  Object.assign(gameState, extra);
  // console.log('[DEBUG] emitGameStateUpdated propertyOwnership:', JSON.stringify(gameState.propertyOwnership));
  io.to(roomId).emit('gameStateUpdated', gameState);
}

// REMOVE or DISABLE autoAdvanceVacationSkips and autoAdvanceStep
// function autoAdvanceVacationSkips(room, io, roomId) { ... }
// function autoAdvanceStep(room, io, roomId, skipsProcessed, returnsProcessed, mode, sessionId) { ... }
// REMOVE all calls to autoAdvanceVacationSkips(room, io, roomId)


module.exports = (io, socket) => {
  // Remove all listeners for this socket to prevent duplicates
  socket.removeAllListeners();
  const createPrivateGame = ({ playerName }) => {
    const newRoom = roomService.createRoom(socket.id, playerName);
    if (newRoom) {
      socket.join(newRoom.id);
      socket.emit('gameCreated', newRoom);
      io.to(newRoom.id).emit('playerListUpdated', newRoom.getPlayerList());
      // Emit log for host joining and game id
      pushGameLog(newRoom, { type: 'info', message: `Game ID: ${newRoom.id}` }, io);
      pushGameLog(newRoom, { type: 'join', player: playerName, message: `has joined the room as host.` }, io);
    }
  };

  const joinRoom = ({ roomId, playerName, color }) => {
    const roomOrError = roomService.addPlayerToRoom(roomId, socket.id, playerName, color);
    if (roomOrError === 'color_taken') {
      socket.emit('colorTakenError', { message: 'Color already taken. Please choose another color.' });
      return;
    }
    if (roomOrError) {
      const room = roomOrError;
      socket.join(roomId);
      // console.log(`[DEBUG] Server: socket ${socket.id} joined room ${roomId}`);
      io.in(roomId).allSockets().then((clients) => {
        // console.log(`[DEBUG] Sockets in room ${roomId} after join:`, Array.from(clients));
      });
      // Fix: If the joining player is the host (by name), update hostId to current socket.id only if different
      if (room.hostName && room.hostName === playerName) {
        if (room.hostId !== socket.id) {
          room.hostId = socket.id;
        }
      }
      socket.emit('roomJoined', room);
      // Log the player list before emitting to all clients
      io.to(roomId).emit('playerListUpdated', room.getPlayerList());
      // Emit log for player joining
      pushGameLog(room, { type: 'join', player: playerName, message: `joined the room.` }, io);

      // Send current game state so players can see their positions on the board
      emitGameStateUpdated(room, io, roomId);

      setTimeout(() => {
        io.to(roomId).emit('playerListUpdated', room.getPlayerList());
      }, 100);
    } else {
      socket.emit('joinRoomError', { message: 'Room not found or could not join.' });
    }
  };

  const leaveRoom = () => {
    const room = roomService.removePlayerFromRoom(socket.id);
    if (room) {
      socket.leave(room.id);
      io.to(room.id).emit('playerListUpdated', room.getPlayerList());
    }
  };

  const updateRoomSettings = async ({ roomId, newSettings }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) {
    } else {
    }
    if (room && room.hostId === socket.id) {
      roomService.updateRoomSettings(roomId, newSettings);
      // Log all socket.io rooms and their members
      try {
        const sockets = await io.in(roomId).allSockets();
        if (!room.settings || Object.keys(room.settings).length === 0) {
        }
        io.to(roomId).emit('roomSettingsUpdated', room.settings);
      } catch (err) {
      }
    }
  };

  const startGame = ({ roomId, shuffledOrder }) => {
    const room = roomService.getRoomById(roomId);
    if (room && room.hostId === socket.id) {
      if (Array.isArray(shuffledOrder) && shuffledOrder.length === room.players.length) {
        // Reorder room.players to match shuffledOrder
        const idToPlayer = Object.fromEntries(room.players.map(p => [p.id, p]));
        room.players = shuffledOrder.map(id => idToPlayer[id]).filter(Boolean);
      }
      room.startGame(); // Use Room.startGame() to handle random order and starting cash
      io.to(roomId).emit('gameStarted');
      // Emit initial game state for turn sync
      emitGameStateUpdated(room, io, roomId);
      pushGameLog(room, { type: 'info', message: 'Game started.' }, io);
      pushGameLog(room, { type: 'system', message: 'Round 1 started.' }, io);
    }
  };

  // Handler to send the full game log to a client
  const handleRequestGameLog = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (room && room.gameLog) {
      socket.emit('fullGameLog', room.gameLog);
    } else {
      socket.emit('fullGameLog', []);
    }
  };

  const updatePlayerColor = ({ roomId, color }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.color = color;
      io.to(roomId).emit('playerListUpdated', room.getPlayerList());
    }
  };

  const handleDisconnect = () => {
    leaveRoom();
    // Additional cleanup if needed
  };

  // Handler to send the current player list to a client (before joining)
  const handleRequestPlayerList = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (room) {
      socket.emit('playerList', room.getPlayerList());
    } else {
      socket.emit('playerList', []);
    }
  };

  // Handler to send current room settings to a client
  const handleRequestRoomSettings = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (room) {
      socket.emit('roomSettingsUpdated', room.settings);
    }
  };

  // --- Enhanced Game Logic Handlers ---
  const rollDice = async ({ roomId, devDice1, devDice2 }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || room.gameState !== 'in-progress') return;

    const currentPlayer = room.players[room.turnIndex];
    if (!currentPlayer || socket.id !== currentPlayer.id) return; // Only current player can roll

    // Broadcast dice rolling animation to all players immediately
    io.to(roomId).emit('diceRollingStarted');

    // Delay the actual dice roll and player movement until after animation completes
    setTimeout(() => {
      const result = room.rollDice(socket.id, devDice1, devDice2);
      if (!result) return;

      // Log the dice roll
      pushGameLog(room, {
        type: 'info',
        player: currentPlayer.name,
        message: `rolled ${result.dice1} + ${result.dice2} = ${result.total}`
      }, io);

      // Debug log to see what result contains
      // console.log('[DEBUG][START] rollDice result:', {
      //   action: result.action,
      //   position: result.position,
      //   passedStart: result.passedStart,
      //   dice1: result.dice1,
      //   dice2: result.dice2,
      //   total: result.total
      // });

      // Handle special actions
      if (result.action === 'jail') {
        pushGameLog(room, {
          type: 'special',
          player: currentPlayer.name,
          message: `went to jail for rolling 3 doubles`
        }, io);
      } else if (result.action === 'jail-escape') {
        pushGameLog(room, {
          type: 'special',
          player: currentPlayer.name,
          message: `got out of jail with doubles`
        }, io);
        room.playerDoublesCount[currentPlayer.id] = 0;
      } else if (result.action === 'jail-auto-release') {
        pushGameLog(room, {
          type: 'special',
          player: currentPlayer.name,
          message: `served full sentence and was released from jail! ⏰`
        }, io);
        room.playerDoublesCount[currentPlayer.id] = 0;
      } else if (result.action === 'start') {
        pushGameLog(room, {
          type: 'info',
          player: currentPlayer.name,
          message: `landed on START and collected $300!`
        }, io);
      } else if (result.passedStart && result.action !== 'start') {
        pushGameLog(room, {
          type: 'info',
          player: currentPlayer.name,
          message: `passed START and collected $200!`
        }, io);
      } else if (result.action === 'vacation') {
        // Vacation: End turn immediately, reset doubles, log event
        pushGameLog(room, {
          type: 'special',
          player: currentPlayer.name,
          message: `went to vacation!`
        }, io);

        // Check if there was vacation cash to collect
        if (room.vacationCash > 0) {
          pushGameLog(room, {
            type: 'info',
            player: currentPlayer.name,
            message: `collected $${room.vacationCash} from vacation cash!`
          }, io);
        }

        room.playerDoublesCount[currentPlayer.id] = 0;
        // Store pending special action in the room
        room.pendingSpecialAction = { type: result.action, playerId: currentPlayer.id, dice: { dice1: result.dice1, dice2: result.dice2, total: result.total } };
        emitGameStateUpdated(room, io, roomId, { debug: 'SERVER-UNIQUE-123' });
        return;
      } else if (result.action === 'income-tax') {
        // Income Tax: Log the tax payment
        const taxAmount = Math.floor(room.playerMoney[currentPlayer.id] / 9);
        if (room.settings.vacationCash) {
          pushGameLog(room, {
            type: 'info',
            player: currentPlayer.name,
            message: `paid $${taxAmount} income tax (added to vacation cash)`
          }, io);
        } else {
          pushGameLog(room, {
            type: 'info',
            player: currentPlayer.name,
            message: `paid $${taxAmount} income tax`
          }, io);
        }
      } else if (result.action === 'luxury-tax') {
        // Luxury Tax: Log the tax payment
        const taxAmount = 75;
        if (room.settings.vacationCash) {
          pushGameLog(room, {
            type: 'info',
            player: currentPlayer.name,
            message: `paid $${taxAmount} luxury tax (added to vacation cash)`
          }, io);
        } else {
          pushGameLog(room, {
            type: 'info',
            player: currentPlayer.name,
            message: `paid $${taxAmount} luxury tax`
          }, io);
        }
      } else if (result.action === 'jail-move') {
        // Determine if this is from landing on Go to Jail or from 3 doubles
        const isFromGoToJail = result.position === 30; // If player landed on position 30 (Go to Jail)
        const isFromThreeDoubles = result.turnResult; // If turnResult exists, it's from 3 doubles

        let message;
        if (isFromThreeDoubles) {
          message = `rolled three doubles in a row and was sent to jail! 🚔`;
        } else if (isFromGoToJail) {
          message = `landed on Go to Jail and was sent to jail! 🚔`;
        } else {
          message = `was sent to jail! 🚔`;
        }

        pushGameLog(room, {
          type: 'special',
          player: currentPlayer.name,
          message: message
        }, io);
        // Store pending special action in the room
        room.pendingSpecialAction = { type: result.action, playerId: currentPlayer.id, dice: { dice1: result.dice1, dice2: result.dice2, total: result.total } };
        // Emit dice result and new position, but do NOT advance turn yet
        emitGameStateUpdated(room, io, roomId, { debug: 'SERVER-UNIQUE-123' });
        return;
      }

      // Emit logs if advanceTurn was called (for jail, vacation, or 3 doubles)
      if (result.turnResult) {
        emitAdvanceTurnLogs(room, result.turnResult, io);
      }

      // Broadcast updated state
      const timestamp = new Date().toISOString();
      // console.log(`[SERVER] ${timestamp} - rollDice emit gameStateUpdated:`, { propertyOwnership: room.propertyOwnership });
      // console.log(`[SERVER] ${timestamp} - rollDice playerStatuses:`, JSON.stringify(room.playerStatuses));
      emitGameStateUpdated(room, io, roomId);
    }, 800); // Wait for dice animation to complete before moving player
  };

// Update the endTurn handler to accept vacationEndTurnPlayerId
const endTurn = async ({ roomId, vacationEndTurnPlayerId }) => {
  const room = roomService.getRoomById(roomId);
  if (!room || room.gameState !== 'in-progress') return;

  const currentPlayer = room.players[room.turnIndex];
  if (!currentPlayer || socket.id !== currentPlayer.id) return;

  // console.log('[DEBUG SERVER] endTurn called by:', currentPlayer.name, 'activeVoteKick before:', room.activeVoteKick?.targetPlayerName);

  // GUARD: Prevent duplicate endTurn calls using a timestamp-based debounce
  const now = Date.now();
  const lastEndTurnTime = room.lastEndTurnTime || 0;
  if (now - lastEndTurnTime < 1000) { // 1 second debounce
    // console.log('[DEBUG][SERVER][endTurn][DEBOUNCE] Ignoring duplicate endTurn call');
    return;
  }
  room.lastEndTurnTime = now;

  // GUARD: If player is supposed to roll again after doubles, ignore extra endTurn calls
  if (room.allowRollAgain && room.lastDiceRoll === null) {
    // console.log('[DEBUG][SERVER][endTurn][GUARD] Ignoring endTurn: player must roll again after doubles');
    return;
  }

  // Check if player rolled doubles
  const lastRoll = room.lastDiceRoll;
  const isDoubles = lastRoll && lastRoll.dice1 === lastRoll.dice2;
  const doublesCount = room.playerDoublesCount[currentPlayer.id] || 0;
  
  // Handle doubles logic
  // Check if player is on vacation space (position 20) even if status not set yet
  const isOnVacationSpace = room.playerPositions[currentPlayer.id] === 20;

  if (isDoubles && !isOnVacationSpace) {
    if (doublesCount === 3) {
      // THIRD DOUBLE: Go to jail, reset doubles state, advance turn
      room.doublesSequenceActive = false;
      room.allowRollAgain = false;
      room.playerDoublesCount[currentPlayer.id] = 0;
      // Send player to jail (set their status)
      room.playerStatuses[currentPlayer.id] = 'jail';
      // Note: The jail message is now handled in rollDice function
      const turnResult = room.advanceTurn('user-action', vacationEndTurnPlayerId);
      room.lastDiceRoll = null;
      emitAdvanceTurnLogs(room, turnResult, io);
      emitGameStateUpdated(room, io, roomId);
      return;
    } else if (doublesCount < 3) {
      // Allow another roll
      room.lastDiceRoll = null;
      room.doublesSequenceActive = true;
      room.allowRollAgain = true;
      pushGameLog(room, {
        type: 'info',
        player: currentPlayer.name,
        message: 'ended turn after rolling doubles - gets another roll'
      }, io);
      emitGameStateUpdated(room, io, roomId, { allowRollAgain: true, doublesSequenceActive: true });
      return;
    }
  }

  // If not doubles or not the third double, proceed with normal turn advancement
  room.doublesSequenceActive = false;
  room.allowRollAgain = false;
  room.playerDoublesCount[currentPlayer.id] = 0; // Only reset here, when turn advances

  // Check if player is being sent to jail (either by landing on Go to Jail or rolling 3 doubles)
  const isBeingSentToJail = room.pendingSpecialAction &&
    room.pendingSpecialAction.type === 'jail-move';

  // Check if we already logged a turn-ending message for doubles
  const alreadyLoggedTurnEnd = isDoubles && !isOnVacationSpace && doublesCount < 3;

  // Only log "ended turn" if player is not being sent to jail AND we haven't already logged for doubles
  if (!isBeingSentToJail && !alreadyLoggedTurnEnd) {
    // console.log('[DEBUG][SERVER][endTurn][NORMAL]', {
    //   playerDoublesCount: room.playerDoublesCount,
    //   turnIndex: room.turnIndex,
    //   lastDiceRoll: room.lastDiceRoll,
    //   allowRollAgain: room.allowRollAgain,
    //   doublesSequenceActive: room.doublesSequenceActive
    // });
    pushGameLog(room, {
      type: 'info',
      player: currentPlayer.name,
      message: `ended turn`
    }, io);
  }

  const turnResult = room.advanceTurn('user-action', vacationEndTurnPlayerId);
  // console.log('[DEBUG SERVER] endTurn: advanceTurn called, activeVoteKick after:', room.activeVoteKick);
  room.lastDiceRoll = null;
  emitAdvanceTurnLogs(room, turnResult, io);
  emitGameStateUpdated(room, io, roomId);
};

  // New handler for property landing
  const handlePropertyLanding = ({ roomId, propertyName }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || room.gameState !== 'in-progress') return;
    const currentPlayer = room.players[room.turnIndex];
    if (!currentPlayer || socket.id !== currentPlayer.id) return;
    const propertyData = room.getPropertyData(propertyName);
    if (!propertyData) return;
    // Debug: Log property landing
    // console.log(`[DEBUG] handlePropertyLanding: Player ${currentPlayer.name} (${socket.id}) landed on ${propertyName}`);
    // If property is unowned
    if (!room.propertyOwnership[propertyName]) {
      if (room.playerMoney[socket.id] >= propertyData.price) {
        socket.emit('propertyLanding', {
          propertyName,
          price: propertyData.price,
          canAfford: true,
          action: 'buy'
        });
      } else {
        // Player cannot afford it - auction or skip
        if (room.settings.allowAuction) {
          socket.emit('propertyLanding', {
            propertyName,
            price: propertyData.price,
            canAfford: false,
            action: 'auction'
          });
        } else {
          socket.emit('propertyLanding', {
            propertyName,
            price: propertyData.price,
            canAfford: false,
            action: 'skip'
          });
        }
      }
    } else if (room.propertyOwnership[propertyName].owner !== socket.id) {
      // Debug: Log property ownership and rent attempt
      // console.log(`[DEBUG] handlePropertyLanding: Property ${propertyName} is owned by ${room.propertyOwnership[propertyName].ownerName} (${room.propertyOwnership[propertyName].owner})`);
      const rent = room.payRent(socket.id, propertyName);
      if (rent > 0) {
        // (`[DEBUG] handlePropertyLanding: Rent of $${rent} paid by ${currentPlayer.name} to ${room.propertyOwnership[propertyName].ownerName}`);
        pushGameLog(room, {
          type: 'rent',
          player: currentPlayer.name,
          owner: room.propertyOwnership[propertyName].ownerName,
          property: propertyName,
          amount: rent,
          message: `paid $${rent} rent to ${room.propertyOwnership[propertyName].ownerName} for ${propertyName}`
        }, io);
        // Check if player went bankrupt
        if (room.playerMoney[socket.id] <= 0) {
          pushGameLog(room, {
            type: 'bankruptcy',
            player: currentPlayer.name,
            message: `went bankrupt!`
          }, io);
        }
        emitGameStateUpdated(room, io, roomId);
      } else {
        // console.log(`[DEBUG] handlePropertyLanding: No rent paid for ${propertyName} (rent=$${rent})`);
      }
    }
    // Vacation cash: if player lands on Vacation (position 20)
    if (propertyName === 'Vacation' && room.settings.vacationCash) {
      const cash = room.vacationCash;
      if (cash > 0) {
        room.playerMoney[socket.id] += cash;
        room.vacationCash = 0;
        pushGameLog(room, {
          type: 'special',
          player: currentPlayer.name,
          message: `collected $${cash} vacation cash!`
        }, io);
        emitGameStateUpdated(room, io, roomId);
      }
    }
  };

  // Handler for skipping property purchase
  const skipProperty = ({ roomId, propertyName }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || room.gameState !== 'in-progress') return;

    const currentPlayer = room.players[room.turnIndex];
    if (!currentPlayer || socket.id !== currentPlayer.id) return;

    pushGameLog(room, {
      type: 'info',
      player: currentPlayer.name,
      message: `skipped purchasing ${propertyName}`
    }, io);
  };

  // Handler for auctioning property
  const auctionProperty = ({ roomId, propertyName }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || room.gameState !== 'in-progress') return;

    const currentPlayer = room.players[room.turnIndex];
    if (!currentPlayer || socket.id !== currentPlayer.id) return;

    // Start auction - this would need more complex auction logic
    pushGameLog(room, {
      type: 'info',
      player: currentPlayer.name,
      message: `started auction for ${propertyName}`
    }, io);

    // Find all participants (players with money > 0)
    const participants = room.players.filter(p => room.playerMoney[p.id] > 0);
    
    // Get full property data - use propertyData if available, otherwise create basic property
    let property = room.propertyData ? room.propertyData[propertyName] : null;
    
    // Initialize auction state in room
    room.auction = {
      active: true,
      property: { ...property, name: propertyName },
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        money: room.playerMoney[p.id]
      })),
      currentBid: 0,
      currentBidder: null, // No turn-based bidding, anyone can bid
      bidHistory: [],
      passedPlayers: [],
      timer: 5,
      timerColor: '#94a3b8', // Initial greyish silver color
      ended: false,
      winner: null,
      lastBidTime: 0, // Track last bid time for 50ms gap
      lastBidderId: null, // Track last bidder to prevent consecutive bids
      currentPlayerId: currentPlayer.id // Track who started the auction for end turn button
    };
    
    // console.log('[SERVER] Emitting auctionStarted for property:', propertyName, 'to room:', roomId, 'participants:', participants.map(p => p.name));
    
    // Start auction timer on server
    room.auctionTimer = setInterval(() => {
      if (room.auction && room.auction.active && !room.auction.ended) {
        room.auction.timer--;
        if (room.auction.timer <= 0) {
          // Timer expired, end auction
          endAuction(room, io);
        } else {
          // Emit timer update
          io.to(roomId).emit('auctionUpdate', room.auction);
        }
      }
    }, 1000);
    
    io.to(roomId).emit('auctionStarted', room.auction);
  };

  // Helper function to end auction
  const endAuction = (room, io) => {
    if (!room.auction || room.auction.ended) return;
    
    clearInterval(room.auctionTimer);
    room.auction.ended = true;
    room.auction.active = false;
    room.auction.timer = 0; // Set timer to 0 when auction ends
    
    // Determine winner
    if (room.auction.bidHistory.length > 0) {
      const lastBid = room.auction.bidHistory[room.auction.bidHistory.length - 1];
      const winner = room.auction.participants.find(p => p.id === lastBid.playerId);
      room.auction.winner = { ...winner, amount: room.auction.currentBid };
      
      // Award property to winner and deduct money
      room.propertyOwnership[room.auction.property.name] = {
        owner: winner.id,
        ownerName: winner.name,
        ownerColor: winner.color,
        houses: 0,
        hotel: false,
        mortgaged: false
      };
      room.playerMoney[winner.id] -= room.auction.currentBid;
      
      pushGameLog(room, {
        type: 'purchase',
        player: winner.name,
        message: `won ${room.auction.property.name} for $${room.auction.currentBid} (auction)`
      }, io);
      
      // Emit updated game state to sync property ownership and money
      emitGameStateUpdated(room, io, room.id);
    } else {
      pushGameLog(room, {
        type: 'info',
        message: `No one bid for ${room.auction.property.name}`
      }, io);
    }
    
    // Include current player info in auction ended event
    const auctionEndedData = {
      ...room.auction,
      currentPlayerId: room.auction.currentPlayerId // This tells the client who should get the end turn button
    };
    
    io.to(room.id).emit('auctionEnded', auctionEndedData);
    
    // Clean up auction state after a delay
    setTimeout(() => {
      if (room.auction) {
        delete room.auction;
      }
      if (room.auctionTimer) {
        delete room.auctionTimer;
      }
    }, 3000); // Give clients time to process the auction end
  };

  // Handle auction bid
  const auctionBid = ({ roomId, amount }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || !room.auction || !room.auction.active || room.auction.ended) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    // Check if player is still in the auction (not passed)
    if (room.auction.passedPlayers.includes(player.id)) return;
    
    // Prevent same player from bidding consecutively
    if (room.auction.lastBidderId === player.id) return;
    
    // Enforce 50ms gap between bids
    const now = Date.now();
    if (now - room.auction.lastBidTime < 50) return;
    
    const newBid = room.auction.currentBid + amount;
    if (room.playerMoney[player.id] < newBid) return; // Can't afford
    
    // Add bid to history
    room.auction.bidHistory.push({
      playerId: player.id,
      name: player.name,
      color: player.color,
      amount: newBid,
      note: `+$${amount}`
    });
    
    room.auction.currentBid = newBid;
    room.auction.passedPlayers = []; // Reset passes when someone bids
    room.auction.timer = 5; // Reset timer to 5 seconds
    room.auction.timerColor = player.color; // Set timer color to bidder's color
    room.auction.lastBidTime = now; // Update last bid time
    room.auction.lastBidderId = player.id; // Track last bidder to prevent consecutive bids
    
    // console.log('[SERVER] Auction bid:', player.name, 'bid', newBid);
    io.to(roomId).emit('auctionUpdate', room.auction);
  };

  // Handle auction pass
  const auctionPass = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || !room.auction || !room.auction.active || room.auction.ended) return;
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    
    // Add to passed players if not already passed
    if (!room.auction.passedPlayers.includes(player.id)) {
      room.auction.passedPlayers.push(player.id);
    }
    
    // Check if all but one have passed
    const activeBidders = room.auction.participants.filter(p => !room.auction.passedPlayers.includes(p.id));
    if (activeBidders.length <= 1) {
      endAuction(room, io);
      return;
    }
    
    // console.log('[SERVER] Auction pass:', player.name);
    io.to(roomId).emit('auctionUpdate', room.auction);
  };

  // Enhanced buyProperty handler
  const buyProperty = ({ roomId, propertyName, price }) => {
    const room = roomService.getRoomById(roomId);
    const currentPlayer = room && room.players[room.turnIndex];
    if (!room || room.gameState !== 'in-progress' || !currentPlayer || socket.id !== currentPlayer.id) return;
    if (room.playerMoney[socket.id] < price) return;
    const success = room.buyProperty(socket.id, propertyName, price);
    if (success) {
      const propertyDetails = room.propertyOwnership[propertyName];
      pushGameLog(room, {
        type: 'purchase',
        player: currentPlayer.name,
        property: propertyName,
        price: price,
        message: `bought ${propertyName} for $${price}`
      }, io);
      // Log Buy Property completed and full game state
      const gameState = room.getGameState();
      // console.log('[DEBUG] Buy Property completed:', gameState);
      // Broadcast updated state to the room
      try {
        const gameState = room.getGameState();
        gameState.roomId = roomId;
        gameState.debug = 'SERVER-UNIQUE-123';
        gameState.debugMarker = Date.now();
        io.to(roomId).emit('gameStateUpdated', gameState);
        // Also emit directly to the socket
        socket.emit('gameStateUpdated', gameState);
      } catch (err) { }
      io.in(roomId).allSockets().then((clients) => {
        // console.log(`[DEBUG] Sockets in room ${roomId} after buy:`, Array.from(clients));
      });
    } else {
      socket.emit('purchaseError', { message: 'Cannot purchase property' });
    }
  };

  const payJailFine = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || room.gameState !== 'in-progress') return;

    const currentPlayer = room.players[room.turnIndex];
    if (!currentPlayer || socket.id !== currentPlayer.id) return;
    if (room.playerStatuses[socket.id] !== 'jail') return;
    if (room.playerMoney[socket.id] < 50) return;

    room.playerMoney[socket.id] -= 50;
    room.playerStatuses[socket.id] = null;
    room.playerJailRounds[socket.id] = 0;

    pushGameLog(room, {
      type: 'special',
      player: currentPlayer.name,
      message: `paid $50 to get out of jail`
    }, io);

    // End turn immediately after paying fine
    const turnResult = room.advanceTurn('user-action');
    emitAdvanceTurnLogs(room, turnResult, io);

    // Broadcast updated state
    emitGameStateUpdated(room, io, roomId);
  };

  const useJailCard = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || room.gameState !== 'in-progress') return;

    const currentPlayer = room.players[room.turnIndex];
    if (!currentPlayer || socket.id !== currentPlayer.id) return;
    if (room.playerStatuses[socket.id] !== 'jail') return;
    if (room.playerJailCards[socket.id] <= 0) return;

    room.playerJailCards[socket.id]--;
    room.playerStatuses[socket.id] = null;
    room.playerJailRounds[socket.id] = 0;

    pushGameLog(room, {
      type: 'special',
      player: currentPlayer.name,
      message: `used a jail card to get out of jail`
    }, io);

    // End turn immediately after using jail card
    const turnResult = room.advanceTurn('user-action');
    emitAdvanceTurnLogs(room, turnResult, io);

    // Broadcast updated state
    emitGameStateUpdated(room, io, roomId);
  };

  // Sell property handler
  const sellProperty = ({ roomId, propertyName }) => {
    const room = roomService.getRoomById(roomId);
    const currentPlayer = room && room.players[room.turnIndex];
    if (!room || room.gameState !== 'in-progress' || !currentPlayer || socket.id !== currentPlayer.id) return;
    const success = room.sellProperty(socket.id, propertyName);
    if (success) {
      pushGameLog(room, {
        type: 'special',
        player: currentPlayer.name,
        property: propertyName,
        message: `sold ${propertyName}`
      }, io);
      emitGameStateUpdated(room, io, roomId);
    } else {
      socket.emit('propertyActionError', { message: 'Cannot sell property' });
    }
  };

  // Mortgage property handler
  const mortgageProperty = ({ roomId, propertyName }) => {
    const room = roomService.getRoomById(roomId);
    const currentPlayer = room && room.players[room.turnIndex];
    if (!room || room.gameState !== 'in-progress' || !currentPlayer || socket.id !== currentPlayer.id) return;
    const success = room.mortgageProperty(socket.id, propertyName);
    if (success) {
      pushGameLog(room, {
        type: 'special',
        player: currentPlayer.name,
        property: propertyName,
        message: `mortgaged ${propertyName}`
      }, io);
      emitGameStateUpdated(room, io, roomId);
    } else {
      socket.emit('propertyActionError', { message: 'Cannot mortgage property' });
    }
  };

  // Unmortgage property handler
  const unmortgageProperty = ({ roomId, propertyName }) => {
    const room = roomService.getRoomById(roomId);
    const currentPlayer = room && room.players[room.turnIndex];
    if (!room || room.gameState !== 'in-progress' || !currentPlayer || socket.id !== currentPlayer.id) return;
    const success = room.unmortgageProperty(socket.id, propertyName);
    if (success) {
      pushGameLog(room, {
        type: 'special',
        player: currentPlayer.name,
        property: propertyName,
        message: `unmortgaged ${propertyName}`
      }, io);
      emitGameStateUpdated(room, io, roomId);
    } else {
      socket.emit('propertyActionError', { message: 'Cannot unmortgage property' });
    }
  };

  // Build house/hotel handler
  const buildHouse = ({ roomId, propertyName }) => {
    const room = roomService.getRoomById(roomId);
    const currentPlayer = room && room.players[room.turnIndex];
    if (!room || room.gameState !== 'in-progress' || !currentPlayer || socket.id !== currentPlayer.id) return;
    const success = room.buildHouse(socket.id, propertyName);
    if (success) {
      pushGameLog(room, {
        type: 'special',
        player: currentPlayer.name,
        property: propertyName,
        message: `built house/hotel on ${propertyName}`
      }, io);
      emitGameStateUpdated(room, io, roomId);
    } else {
      socket.emit('propertyActionError', { message: 'Cannot build house/hotel' });
    }
  };

  // Destroy house/hotel handler
  const destroyHouse = ({ roomId, propertyName }) => {
    const room = roomService.getRoomById(roomId);
    const currentPlayer = room && room.players[room.turnIndex];
    if (!room || room.gameState !== 'in-progress' || !currentPlayer || socket.id !== currentPlayer.id) return;
    const success = room.destroyHouse(socket.id, propertyName);
    if (success) {
      pushGameLog(room, {
        type: 'special',
        player: currentPlayer.name,
        property: propertyName,
        message: `destroyed house/hotel on ${propertyName}`
      }, io);
      emitGameStateUpdated(room, io, roomId);
    } else {
      socket.emit('propertyActionError', { message: 'Cannot destroy house/hotel' });
    }
  };

  // Add a handler for requestShuffle
  const requestShuffle = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (room && room.hostId === socket.id) {
      // Shuffle the player order
      const shuffled = [...room.players];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const shuffledOrder = shuffled.map(p => p.id);
      io.to(roomId).emit('shufflingPlayers', { shuffledOrder });
    }
  };

  // Add skipVacationTurn handler
  const skipVacationTurn = ({ roomId, playerId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || room.gameState !== 'in-progress') return;
    const currentPlayer = room.players[room.turnIndex];
    if (!currentPlayer || currentPlayer.id !== playerId || socket.id !== currentPlayer.id) return;
    // Only allow if player is on vacation
    const status = room.playerStatuses[playerId];
    if (!(status && typeof status === 'object' && status.status === 'vacation')) return;
    // Add skip log and advance turn
    const playerName = currentPlayer.name;
    pushGameLog(room, {
      type: 'info',
      player: playerName,
      message: 'turn skipped. Still in vacation.'
    }, io);
    // Mark that the player has skipped (for backend logic)
    room.playerStatuses[playerId].justSkippedVacation = true;
    const turnResult = room.advanceTurn('user-action');
    emitAdvanceTurnLogs(room, turnResult, io);
    emitGameStateUpdated(room, io, roomId);
  };

  socket.on('createPrivateGame', createPrivateGame);
  socket.on('joinRoom', joinRoom);
  socket.on('leaveRoom', leaveRoom);
  socket.on('updateRoomSettings', updateRoomSettings);
  socket.on('startGame', startGame);
  socket.on('updatePlayerColor', updatePlayerColor);
  socket.on('rollDice', rollDice);
  socket.on('buyProperty', buyProperty);
  socket.on('payJailFine', payJailFine);
  socket.on('useJailCard', useJailCard);
  socket.on('sellProperty', sellProperty);
  socket.on('mortgageProperty', mortgageProperty);
  socket.on('unmortgageProperty', unmortgageProperty);
  socket.on('endTurn', endTurn);
  socket.on('handlePropertyLanding', handlePropertyLanding);
  socket.on('skipProperty', skipProperty);
  socket.on('auctionProperty', auctionProperty);
  socket.on('auctionBid', auctionBid);
  socket.on('auctionPass', auctionPass);
  socket.on('buildHouse', buildHouse);
  socket.on('destroyHouse', destroyHouse);
  socket.on('disconnect', handleDisconnect);
  socket.on('requestGameLog', handleRequestGameLog);
  socket.on('requestPlayerList', handleRequestPlayerList);
  socket.on('requestRoomSettings', handleRequestRoomSettings);
  socket.on('requestShuffle', requestShuffle);
  socket.on('skipVacationTurn', skipVacationTurn);
  socket.on('whatRooms', () => {
  });
  socket.on('gameLogUpdated', (logEntry) => {
  });
  socket.on('gameStateUpdated', (gameState) => {
    // ... rest of your state update logic
  });
  socket.on('diceAnimationComplete', ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (room && room.pendingSpecialAction) {
      const { type, playerId } = room.pendingSpecialAction;
      // Process the pending special action and advance the turn
      if (type === 'vacation') {
        // Vacation logic: advance turn, set player status, etc.
        room.playerStatuses[playerId] = { status: 'vacation', vacationStartRound: room.roundNumber };
        room.playerDoublesCount[playerId] = 0;
        const turnResult = room.advanceTurn();
        room.lastDiceRoll = null;
        room.pendingSpecialAction = null; // <-- Move this up to prevent double-processing
        emitAdvanceTurnLogs(room, turnResult, io);
        emitGameStateUpdated(room, io, roomId);
      } else if (type === 'jail' || type === 'go-to-jail') {
        // Jail logic: move player to jail, set status, advance turn
        room.playerPositions[playerId] = 10;
        room.playerStatuses[playerId] = 'jail';
        room.playerJailRounds[playerId] = 0;
        room.playerDoublesCount[playerId] = 0;
        const turnResult = room.advanceTurn();
        room.lastDiceRoll = null;
        room.pendingSpecialAction = null; // <-- Move this up to prevent double-processing
        emitAdvanceTurnLogs(room, turnResult, io);
        emitGameStateUpdated(room, io, roomId);
      }
    }
  });

  // ===== TRADE SYSTEM HANDLERS =====
  
  // Create a new trade
  const createTrade = ({ roomId, targetPlayerId, offers, note }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || room.gameState !== 'in-progress') return;

    const creatorPlayer = room.players.find(p => p.id === socket.id);
    const targetPlayer = room.players.find(p => p.id === targetPlayerId);
    
    if (!creatorPlayer || !targetPlayer) {
      socket.emit('tradeError', { message: 'Player not found' });
      return;
    }

    // Validate trade offers
    const creatorOffer = offers[socket.id] || { money: 0, properties: [] };
    const targetOffer = offers[targetPlayerId] || { money: 0, properties: [] };

    // Check if creator has sufficient resources
    if (creatorOffer.money > room.playerMoney[socket.id]) {
      socket.emit('tradeError', { message: 'You do not have enough money' });
      return;
    }

    // Check if creator owns all properties they're offering
    for (const propertyName of creatorOffer.properties) {
      if (!room.propertyOwnership[propertyName] || room.propertyOwnership[propertyName].owner !== socket.id) {
        socket.emit('tradeError', { message: `You do not own ${propertyName}` });
        return;
      }
    }

    // Check if target owns all properties in the request
    for (const propertyName of targetOffer.properties) {
      if (!room.propertyOwnership[propertyName] || room.propertyOwnership[propertyName].owner !== targetPlayerId) {
        socket.emit('tradeError', { message: `${targetPlayer.name} does not own ${propertyName}` });
        return;
      }
    }

    // Check if target has sufficient money
    if (targetOffer.money > room.playerMoney[targetPlayerId]) {
      socket.emit('tradeError', { message: `${targetPlayer.name} does not have enough money` });
      return;
    }

    // Create the trade
    const trade = room.createTrade(socket.id, targetPlayerId, offers, note);
    
    // Log trade creation
    pushGameLog(room, {
      type: 'trade',
      player: creatorPlayer.name,
      target: targetPlayer.name,
      tradeId: trade.id, // Add trade ID for clickable functionality
      message: `proposed a trade to ${targetPlayer.name}`
    }, io);

    // Emit trade created to all players
    io.to(roomId).emit('tradeCreated', trade);
    emitGameStateUpdated(room, io, roomId);
  };

  // Respond to a trade (accept/decline)
  const respondToTrade = ({ roomId, tradeId, response }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) return;

    const trade = room.trades[tradeId];
    if (!trade || trade.status !== 'pending') {
      socket.emit('tradeError', { message: 'Trade not found or no longer active' });
      return;
    }

    // Only target player can respond
    if (trade.targetPlayerId !== socket.id) {
      socket.emit('tradeError', { message: 'You cannot respond to this trade' });
      return;
    }

    const responsePlayer = room.players.find(p => p.id === socket.id);
    const creatorPlayer = room.players.find(p => p.id === trade.createdBy);

    if (response === 'accepted') {
      // Execute the trade
      const result = room.executeTrade(tradeId);
      
      if (result.success) {
        pushGameLog(room, {
          type: 'trade',
          player: responsePlayer.name,
          target: creatorPlayer.name,
          tradeId: tradeId, // Add trade ID for clickable functionality
          message: `${responsePlayer.name} accepted the trade from ${creatorPlayer.name}`
        }, io);

        // Emit trade accepted
        io.to(roomId).emit('tradeAccepted', { tradeId, trade: result.trade });
        emitGameStateUpdated(room, io, roomId);
      } else {
        socket.emit('tradeError', { message: result.error });
      }
    } else if (response === 'declined') {
      room.updateTradeStatus(tradeId, 'declined');
      
      pushGameLog(room, {
        type: 'trade',
        player: responsePlayer.name,
        target: creatorPlayer.name,
        tradeId: tradeId, // Add trade ID for clickable functionality
        message: `declined the trade from ${creatorPlayer.name}`
      }, io);

      // Emit trade declined
      io.to(roomId).emit('tradeDeclined', { tradeId });
    }
  };

  // Cancel a trade
  const cancelTrade = ({ roomId, tradeId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) return;

    const trade = room.trades[tradeId];
    if (!trade || trade.status !== 'pending') {
      socket.emit('tradeError', { message: 'Trade not found or no longer active' });
      return;
    }

    // Only creator can cancel
    if (trade.createdBy !== socket.id) {
      socket.emit('tradeError', { message: 'You cannot cancel this trade' });
      return;
    }

    room.updateTradeStatus(tradeId, 'cancelled');
    
    const creatorPlayer = room.players.find(p => p.id === socket.id);
    const targetPlayer = room.players.find(p => p.id === trade.targetPlayerId);

    pushGameLog(room, {
      type: 'trade',
      player: creatorPlayer.name,
      target: targetPlayer.name,
      tradeId: tradeId, // Add trade ID for clickable functionality
      message: `cancelled their trade proposal to ${targetPlayer.name}`
    }, io);

    // Emit trade cancelled
    io.to(roomId).emit('tradeCancelled', { tradeId });
  };

  // Negotiate a trade (create counter-offer)
  const negotiateTrade = ({ roomId, originalTradeId, offers, note }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) return;

    const originalTrade = room.trades[originalTradeId];
    if (!originalTrade || originalTrade.status !== 'pending') {
      socket.emit('tradeError', { message: 'Original trade not found or no longer active' });
      return;
    }

    // Only target player can negotiate
    if (originalTrade.targetPlayerId !== socket.id) {
      socket.emit('tradeError', { message: 'You cannot negotiate this trade' });
      return;
    }

    // Cancel the original trade
    room.updateTradeStatus(originalTradeId, 'cancelled');

    // Create new trade with negotiated terms (swap creator and target)
    const newTargetId = originalTrade.createdBy;
    const newCreatorId = socket.id;

    // Validate the new offers
    const creatorOffer = offers[newCreatorId] || { money: 0, properties: [] };
    const targetOffer = offers[newTargetId] || { money: 0, properties: [] };

    // Validation checks (similar to createTrade)
    if (creatorOffer.money > room.playerMoney[newCreatorId]) {
      socket.emit('tradeError', { message: 'You do not have enough money' });
      return;
    }

    for (const propertyName of creatorOffer.properties) {
      if (!room.propertyOwnership[propertyName] || room.propertyOwnership[propertyName].owner !== newCreatorId) {
        socket.emit('tradeError', { message: `You do not own ${propertyName}` });
        return;
      }
    }

    for (const propertyName of targetOffer.properties) {
      if (!room.propertyOwnership[propertyName] || room.propertyOwnership[propertyName].owner !== newTargetId) {
        const targetPlayer = room.players.find(p => p.id === newTargetId);
        socket.emit('tradeError', { message: `${targetPlayer.name} does not own ${propertyName}` });
        return;
      }
    }

    if (targetOffer.money > room.playerMoney[newTargetId]) {
      const targetPlayer = room.players.find(p => p.id === newTargetId);
      socket.emit('tradeError', { message: `${targetPlayer.name} does not have enough money` });
      return;
    }

    // Mark the original trade as cancelled instead of deleting it (for trade history)
    room.updateTradeStatus(originalTradeId, 'cancelled');
    
    // Create the negotiated trade (negotiating player becomes the new creator)
    const newTrade = room.createTrade(newCreatorId, newTargetId, offers, note);
    
    const negotiatingPlayer = room.players.find(p => p.id === newCreatorId);
    const originalCreator = room.players.find(p => p.id === newTargetId);

    pushGameLog(room, {
      type: 'trade',
      player: negotiatingPlayer.name,
      target: originalCreator.name,
      message: `filed a negotiation in their trade with ${originalCreator.name}`,
      tradeId: newTrade.id
    }, io);

    // Emit original trade cancelled and new trade created
    io.to(roomId).emit('tradeCancelled', { tradeId: originalTradeId });
    io.to(roomId).emit('tradeCreated', newTrade);
  };

  // Get player properties for trade UI
  const getPlayerProperties = ({ roomId, playerId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) return;

    const properties = room.getPlayerProperties(playerId);
    socket.emit('playerProperties', { playerId, properties });
  };

  // Bankruptcy handlers
  const bankruptPlayer = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || room.gameState !== 'in-progress') return;

    const playerId = socket.id;
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    // Can't bankrupt if already bankrupt or kicked
    if (!room.canPlayerPlay(playerId)) return;

    // Execute bankruptcy
    const result = room.bankruptPlayer(playerId);
    if (result) {
      // Check if game should end after bankruptcy
      const gameEndResult = room.checkGameEnd();
      
      if (gameEndResult.gameOver) {
        // Emit game over event to all players
        io.to(roomId).emit('gameOver', {
          winner: gameEndResult.winner
        });
      }
      
      // Emit updated game state to all players
      emitGameStateUpdated(room, io, roomId);
      
      // If it was current player's turn, advance turn (only if game didn't end)
      if (!gameEndResult.gameOver && room.players[room.turnIndex]?.id === playerId) {
        const turnResult = room.advanceTurn(socket.id);
        emitAdvanceTurnLogs(room, turnResult, io);
        emitGameStateUpdated(room, io, roomId);
      }
    }
  };

  // Vote-kick handlers
  const startVoteKick = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || room.gameState !== 'in-progress') return;

    const initiatorId = socket.id;
    const currentPlayer = room.players[room.turnIndex];
    
    if (!currentPlayer) return;
    
    // Start vote-kick against current player
    const result = room.startVoteKick(currentPlayer.id, initiatorId);
    if (result && result.success) {
      // Push the vote-kick log to all clients immediately
      if (result.logEntry) {
        io.to(roomId).emit('gameLogUpdated', result.logEntry);
      }
      
      emitGameStateUpdated(room, io, roomId);
      
      // Start server-side timer to track remaining time
      const updateTimer = () => {
        // Always check if activeVoteKick still exists before proceeding
        if (!room.activeVoteKick) {
          // console.log('[DEBUG SERVER] updateTimer: activeVoteKick was cancelled, stopping timer');
          // Emit a final timer update with 0 remaining time to clear frontend
          io.to(roomId).emit('voteKickTimer', { 
            targetPlayerId: null,
            remainingTime: 0 
          });
          return; // Stop the timer if vote-kick was cancelled
        }
        
        const remaining = Math.max(0, room.activeVoteKick.endTime - Date.now());
        // console.log('[DEBUG SERVER] updateTimer emitting voteKickTimer:', { targetPlayerId: room.activeVoteKick.targetPlayerId, remainingTime: remaining });
        io.to(roomId).emit('voteKickTimer', { 
          targetPlayerId: room.activeVoteKick.targetPlayerId,
          remainingTime: remaining 
        });
        
        // If time is up, auto-kick the player
        if (remaining <= 0) {
          // console.log('[DEBUG SERVER] Vote-kick timer expired, auto-kicking player');
          const executeResult = room.executeVoteKick();
          if (executeResult && executeResult.kickLog) {
            io.to(roomId).emit('gameLogUpdated', executeResult.kickLog);
          }
          
          // Check if game should end after vote-kick
          const gameEndResult = room.checkGameEnd();
          
          if (gameEndResult.gameOver) {
            // Emit game over event to all players
            io.to(roomId).emit('gameOver', {
              winner: gameEndResult.winner
            });
          } else {
            // If the kicked player was the current player, advance turn (only if game didn't end)
            if (executeResult && executeResult.wasCurrentPlayer) {
              const turnResult = room.advanceTurn(socket.id);
              emitAdvanceTurnLogs(room, turnResult, io);
            }
          }
          
          emitGameStateUpdated(room, io, roomId);
          return; // Stop the timer
        }
        
        // Store the timeout reference so it can be cancelled
        room.voteKickTimer = setTimeout(updateTimer, 1000);
      };
      
      // Start the timer
      room.voteKickTimer = setTimeout(updateTimer, 1000);
    } else {
      socket.emit('voteKickError', { message: 'Cannot start vote-kick at this time' });
    }
  };

  const addVoteKick = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || !room.activeVoteKick) return;

    const voterId = socket.id;
    const result = room.addVoteKick(voterId);
    
    if (result) {
      // Push the vote-kick log to all clients immediately
      if (result.logEntry) {
        io.to(roomId).emit('gameLogUpdated', result.logEntry);
      }
      
      emitGameStateUpdated(room, io, roomId);
      
      if (result.executed) {
        // Push the kick log to all clients
        if (result.kickLog) {
          io.to(roomId).emit('gameLogUpdated', result.kickLog);
        }
        
        // Check if game should end after vote-kick execution
        const gameEndResult = room.checkGameEnd();
        
        if (gameEndResult.gameOver) {
          // Emit game over event to all players
          io.to(roomId).emit('gameOver', {
            winner: gameEndResult.winner
          });
        } else {
          // Vote-kick was executed, advance turn if the kicked player was the current player (only if game didn't end)
          if (result.wasCurrentPlayer) {
            const turnResult = room.advanceTurn(socket.id);
            emitAdvanceTurnLogs(room, turnResult, io);
          }
        }
        
        emitGameStateUpdated(room, io, roomId);
      }
    } else {
      socket.emit('voteKickError', { message: 'Cannot vote at this time' });
    }
  };

  // Register trade event listeners
  socket.on('createTrade', createTrade);
  socket.on('respondToTrade', respondToTrade);
  socket.on('cancelTrade', cancelTrade);
  socket.on('negotiateTrade', negotiateTrade);
  socket.on('getPlayerProperties', getPlayerProperties);
  
  // Register bankruptcy and vote-kick listeners
  socket.on('bankruptPlayer', bankruptPlayer);
  socket.on('startVoteKick', startVoteKick);
  socket.on('addVoteKick', addVoteKick);

  // Reset room handler for "Another Game" functionality
  const resetRoom = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) return;

    // Reset the room to pre-game state
    room.resetForNewGame();

    // Emit updated player list to all clients (first player joining becomes host)
    io.to(roomId).emit('playerListUpdated', room.getPlayerList());
    
    // Emit room settings
    io.to(roomId).emit('roomSettingsUpdated', room.settings);
    
    // Clear game state
    emitGameStateUpdated(room, io, roomId);
  };

  socket.on('resetRoom', resetRoom);
};
