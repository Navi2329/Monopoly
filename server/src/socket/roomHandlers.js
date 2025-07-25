// server/src/socket/roomHandlers.js
const roomService = require('../services/roomService');
const { v4: uuidv4 } = require('uuid');

// Helper to push to room log and emit to all clients
function pushGameLog(room, logEntry, io) {
  console.log('[DEBUG][SERVER][pushGameLog]', logEntry);
  room.addGameLog(logEntry);
  io.to(room.id).emit('gameLogUpdated', logEntry);
}

// Helper to emit all logs after advanceTurn
function emitAdvanceTurnLogs(room, turnResult, io) {
  console.log('[DEBUG] emitAdvanceTurnLogs called for round', room.roundNumber, 'at', Date.now());
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
  console.log('[DEBUG] emitGameStateUpdated propertyOwnership:', JSON.stringify(gameState.propertyOwnership));
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
      pushGameLog(newRoom, { type: 'join', player: playerName, message: `${playerName} has joined the room as host.` }, io);
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
      pushGameLog(room, { type: 'join', player: playerName, message: `${playerName} joined the room.` }, io);

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
      console.log('[DEBUG][START] rollDice result:', {
        action: result.action,
        position: result.position,
        passedStart: result.passedStart,
        dice1: result.dice1,
        dice2: result.dice2,
        total: result.total
      });

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
          message: `${currentPlayer.name} went to vacation!`
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
        const taxAmount = Math.floor(room.playerMoney[currentPlayer.id] * 0.1);
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

    // GUARD: If player is supposed to roll again after doubles, ignore extra endTurn calls
    if (room.allowRollAgain && room.lastDiceRoll === null) {
      console.log('[DEBUG][SERVER][endTurn][GUARD] Ignoring endTurn: player must roll again after doubles');
      return;
    }

    // Debug log at start
    console.log('[DEBUG][SERVER][endTurn][START]', {
      socketId: socket.id,
      currentPlayerId: currentPlayer.id,
      lastRoll: room.lastDiceRoll,
      isDoubles: room.lastDiceRoll && room.lastDiceRoll.dice1 === room.lastDiceRoll.dice2,
      doublesCount: room.playerDoublesCount[currentPlayer.id],
      playerDoublesCount: room.playerDoublesCount,
      turnIndex: room.turnIndex,
      lastDiceRoll: room.lastDiceRoll,
      allowRollAgain: room.allowRollAgain,
      doublesSequenceActive: room.doublesSequenceActive
    });

    // Check if player rolled doubles
    const lastRoll = room.lastDiceRoll;
    const isDoubles = lastRoll && lastRoll.dice1 === lastRoll.dice2;
    const doublesCount = room.playerDoublesCount[currentPlayer.id] || 0;
    // Debug log
    console.log('[DEBUG][SERVER][endTurn][CHECK]', { socketId: socket.id, currentPlayerId: currentPlayer.id, doublesCount });

    // Handle doubles logic
    if (isDoubles) {
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
        console.log('[DEBUG][SERVER][endTurn][DOUBLES RETURN]', {
          playerDoublesCount: room.playerDoublesCount,
          turnIndex: room.turnIndex,
          lastDiceRoll: room.lastDiceRoll,
          allowRollAgain: room.allowRollAgain,
          doublesSequenceActive: room.doublesSequenceActive
        });
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

    // Only log "ended turn" if player is not being sent to jail
    if (!isBeingSentToJail) {
      pushGameLog(room, {
        type: 'info',
        player: currentPlayer.name,
        message: `ended turn`
      }, io);
    }

    const turnResult = room.advanceTurn('user-action', vacationEndTurnPlayerId);
    room.lastDiceRoll = null;
    emitAdvanceTurnLogs(room, turnResult, io);
    emitGameStateUpdated(room, io, roomId);
    console.log('[DEBUG][SERVER][endTurn][ADVANCE TURN]', {
      playerDoublesCount: room.playerDoublesCount,
      turnIndex: room.turnIndex,
      lastDiceRoll: room.lastDiceRoll,
      allowRollAgain: room.allowRollAgain,
      doublesSequenceActive: room.doublesSequenceActive
    });
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
};
