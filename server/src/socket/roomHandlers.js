// server/src/socket/roomHandlers.js
const roomService = require('../services/roomService');
const botService = require('../services/botService');
const { v4: uuidv4 } = require('uuid');
const SafeEmitter = require('../utils/safeEmitter');

// Helper to deeply clean objects of circular references and problematic types
// Helper to safely emit data without circular references
function safeEmit(io, roomId, event, data) {
  SafeEmitter.safeEmit(io, roomId, event, data);
}

// Helper to push to room log and emit to all clients
function pushGameLog(room, logEntry, io) {
  // console.log('[DEBUG][SERVER][pushGameLog]', logEntry);
  room.addGameLog(logEntry);
  safeEmit(io, room.id, 'gameLogUpdated', logEntry);
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
  // CRITICAL: Add explicit turn state for frontend to know what button to show
  gameState.turnState = room.turnState || 'awaiting-roll'; // Default to awaiting roll
  // Attach any extra fields passed in
  Object.assign(gameState, extra);
  safeEmit(io, roomId, 'gameStateUpdated', gameState);
}

// REMOVE or DISABLE autoAdvanceVacationSkips and autoAdvanceStep
// function autoAdvanceVacationSkips(room, io, roomId) { ... }
// function autoAdvanceStep(room, io, roomId, skipsProcessed, returnsProcessed, mode, sessionId) { ... }
// REMOVE all calls to autoAdvanceVacationSkips(room, io, roomId)

// Bot turn handling
async function handleBotTurn(room, io) {
  if (!room || room.gameState !== 'in-progress') {
    return;
  }

  const currentPlayer = room.getCurrentPlayer();
  if (!currentPlayer || !currentPlayer.isBot) {
    return; // Not a bot's turn
  }

  try {
    // Check if bot is on vacation
    const botStatus = room.playerStatuses[currentPlayer.id];
    if (botStatus && typeof botStatus === 'object' && botStatus.status === 'vacation') {
      // Bot should skip turn
      setTimeout(async () => {
        const turnResult = room.advanceTurn('bot-action');
        pushGameLog(room, {
          type: 'info',
          player: currentPlayer.name,
          message: `(bot) skipped turn while on vacation`
        }, io);
        emitAdvanceTurnLogs(room, turnResult, io);
        emitGameStateUpdated(room, io, room.id);
        
        // Check if next player is also a bot
        setTimeout(() => {
          handleBotTurn(room, io);
        }, 1000);
      }, 2000); // 2 second delay for vacation skip
      return;
    }

    // Use bot service to play the turn
    await botService.playBotTurn(room, currentPlayer.id, io);
    
    // Check if next player is also a bot after this bot's turn
    setTimeout(() => {
      handleBotTurn(room, io);
    }, 1000);
    
  } catch (error) {
    console.error(`Error handling bot turn for ${currentPlayer.name}:`, error);
  }
}


module.exports = (io, socket) => {
  // Remove all listeners for this socket to prevent duplicates
  socket.removeAllListeners();
  const createPrivateGame = ({ playerName }) => {
    const newRoom = roomService.createRoom(socket.id, playerName);
    if (newRoom) {
      socket.join(newRoom.id);
      socket.emit('gameCreated', SafeEmitter.deepClean(newRoom));
      safeEmit(io, newRoom.id, 'playerListUpdated', newRoom.getPlayerList());
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
    if (roomOrError === 'name_taken') {
      socket.emit('joinRoomError', { message: 'Player name already taken in this room.' });
      return;
    }
    if (roomOrError === 'reconnection_required') {
      // Player exists but disconnected - attempt reconnection
      const room = roomService.handlePlayerReconnect(roomId, playerName, socket.id);
      if (room) {
        socket.join(roomId);
        socket.emit('reconnectSuccess', { room: SafeEmitter.deepClean(room), playerName });
        safeEmit(io, roomId, 'playerListUpdated', room.getPlayerList());
        // Reconnection log will be handled by attemptReconnect handler
        emitGameStateUpdated(room, io, roomId);
      } else {
        socket.emit('reconnectFailed', { message: 'Failed to reconnect to the room.' });
      }
      return;
    }
    if (roomOrError) {
      // Check if this is a spectator response
      if (typeof roomOrError === 'object' && roomOrError.isSpectator) {
        const room = roomOrError.room;
        socket.join(roomId);
        socket.emit('joinedAsSpectator', { room: SafeEmitter.deepClean(room), playerName });
        safeEmit(io, roomId, 'playerListUpdated', room.getPlayerList());
        // Don't log spectators joining to avoid spam
        emitGameStateUpdated(room, io, roomId);
        return;
      }
      
      const room = roomOrError;
      socket.join(roomId);
      // Fix: If the joining player is the host (by name), update hostId to current socket.id only if different
      if (room.hostName && room.hostName === playerName) {
        if (room.hostId !== socket.id) {
          room.hostId = socket.id;
        }
      }
      socket.emit('roomJoined', SafeEmitter.deepClean(room));
      // Log the player list before emitting to all clients
      safeEmit(io, roomId, 'playerListUpdated', room.getPlayerList());
      // Emit log for player joining
      pushGameLog(room, { type: 'join', player: playerName, message: `joined the room.` }, io);

      // Send current game state so players can see their positions on the board
      emitGameStateUpdated(room, io, roomId);

      setTimeout(() => {
        safeEmit(io, roomId, 'playerListUpdated', room.getPlayerList());
      }, 100);
    } else {
      socket.emit('joinRoomError', { message: 'Room not found or could not join.' });
    }
  };

  const leaveRoom = () => {
    const room = roomService.removePlayerFromRoom(socket.id);
    if (room) {
      socket.leave(room.id);
      safeEmit(io, room.id, 'playerListUpdated', room.getPlayerList());
    }
  };

  const kickPlayer = ({ roomId, playerId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) {
      socket.emit('kickPlayerError', { message: 'Room not found.' });
      return;
    }
    
    // Only host can kick players and only before game starts
    if (room.hostId !== socket.id) {
      socket.emit('kickPlayerError', { message: 'Only the host can kick players.' });
      return;
    }
    
    if (room.gameState === 'in-progress') {
      socket.emit('kickPlayerError', { message: 'Cannot kick players after game has started.' });
      return;
    }
    
    const kickedPlayerName = room.kickPlayer(playerId, io);
    if (kickedPlayerName) {
      pushGameLog(room, { 
        type: 'kick', 
        player: kickedPlayerName, 
        message: `was removed from the room by the host.` 
      }, io);
    } else {
      socket.emit('kickPlayerError', { message: 'Player not found.' });
    }
  };

  const updateRoomSettings = async ({ roomId, newSettings }) => {
    const room = roomService.getRoomById(roomId);
    if (room && room.hostId === socket.id) {
      roomService.updateRoomSettings(roomId, newSettings);
      
      // Log all socket.io rooms and their members
      try {
        const sockets = await io.in(roomId).allSockets();
        safeEmit(io, roomId, 'roomSettingsUpdated', room.settings);
      } catch (err) {
        console.error('[DEBUG] updateRoomSettings - error:', err);
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
      room.turnState = 'awaiting-roll'; // First player should see Roll button
      safeEmit(io, roomId, 'gameStarted', {});
      // Emit initial game state for turn sync
      emitGameStateUpdated(room, io, roomId);
      pushGameLog(room, { type: 'info', message: 'Game started.' }, io);
      pushGameLog(room, { type: 'system', message: 'Round 1 started.' }, io);
      
      // Start bot turn if first player is a bot
      setTimeout(() => {
        handleBotTurn(room, io);
      }, 2000); // Give clients time to process game start
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
      safeEmit(io, roomId, 'playerListUpdated', room.getPlayerList());
    }
  };

  const handleDisconnect = () => {
    // console.log(`[DEBUG] Socket ${socket.id} disconnected`);
    
    // Handle graceful disconnect with timeout
    const room = roomService.handlePlayerDisconnect(socket.id);
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        // Emit updated player list to show disconnected status
        safeEmit(io, room.id, 'playerListUpdated', room.getPlayerList());
        
        // Don't log disconnect immediately - only log when player is actually removed after timeout
      }
    }
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

  // Special handler for jail escape landing - only handle rent, taxes, and cards (no property purchases)
  const handleJailEscapeLanding = (room, player, position, io, roomId) => {
    const isWorldwide = room.mapType === 'Mr. Worldwide';
    
    if (position === 4) { // Income Tax (same position for both maps)
      const taxAmount = Math.floor(room.playerMoney[player.id] * 0.1); // 10% of player cash
      room.playerMoney[player.id] -= taxAmount;
      if (room.settings.vacationCash) {
        room.vacationCash += taxAmount;
        pushGameLog(room, {
          type: 'info',
          player: player.name,
          message: `paid $${taxAmount} income tax (added to vacation cash)`
        }, io);
      } else {
        pushGameLog(room, {
          type: 'info',
          player: player.name,
          message: `paid $${taxAmount} income tax`
        }, io);
      }
    } else if ((position === 38 && !isWorldwide) || (position === 46 && isWorldwide)) { // Luxury Tax
      const taxAmount = 75;
      room.playerMoney[player.id] -= taxAmount;
      if (room.settings.vacationCash) {
        room.vacationCash += taxAmount;
        pushGameLog(room, {
          type: 'info',
          player: player.name,
          message: `paid $${taxAmount} luxury tax (added to vacation cash)`
        }, io);
      } else {
        pushGameLog(room, {
          type: 'info',
          player: player.name,
          message: `paid $${taxAmount} luxury tax`
        }, io);
      }
    } else if ((isWorldwide && [2, 20, 28, 39].includes(position)) || (!isWorldwide && [2, 17, 33].includes(position))) { // Treasure spaces
      const cardResult = room.drawTreasureCard(player.id);
      if (cardResult) {
        cardResult.logs.forEach(log => {
          pushGameLog(room, log, io);
        });
        // Note: No movement handling for jail escape - cards that move are ignored
      }
    } else if ((isWorldwide && [9, 26, 44].includes(position)) || (!isWorldwide && [7, 22, 36].includes(position))) { // Surprise spaces
      const cardResult = room.drawSurpriseCard(player.id);
      if (cardResult) {
        cardResult.logs.forEach(log => {
          pushGameLog(room, log, io);
        });
        // Note: No movement handling for jail escape - cards that move are ignored
      }
    } else {
      // Check if it's a property space and handle ONLY rent (no property purchases)
      const propertyName = room.getPropertyNameByPosition(position);
      
      if (propertyName && room.propertyOwnership[propertyName] && room.propertyOwnership[propertyName].owner !== player.id) {
        const rent = room.calculateRent(propertyName);
        
        if (rent > 0) {
          const rentResult = room.payRentWithDebt(player.id, room.propertyOwnership[propertyName].owner, propertyName, rent);
          
          // Log rent payment with actual amounts
          if (rentResult.actualPayment > 0) {
            pushGameLog(room, {
              type: 'rent',
              player: player.name,
              owner: room.propertyOwnership[propertyName].ownerName,
              property: propertyName,
              amount: rentResult.actualPayment,
              message: `paid $${rentResult.actualPayment} rent to ${room.propertyOwnership[propertyName].ownerName} for ${propertyName}`
            }, io);
          }
          
          // Log remaining debt if any
          if (rentResult.remainingDebt > 0) {
            pushGameLog(room, {
              type: 'debt',
              player: player.name,
              owner: room.propertyOwnership[propertyName].ownerName,
              property: propertyName,
              amount: rentResult.remainingDebt,
              message: `owes $${rentResult.remainingDebt} in rent to ${room.propertyOwnership[propertyName].ownerName} for ${propertyName}`
            }, io);
          }
          
          // Check if player has negative money
          if (room.playerMoney[player.id] < 0) {
            pushGameLog(room, {
              type: 'warning',
              player: player.name,
              message: `has negative balance ($${room.playerMoney[player.id]}) - must sell properties, mortgage, or trade to recover`
            }, io);
            
            room.playerNegativeBalance = room.playerNegativeBalance || {};
            room.playerNegativeBalance[player.id] = true;
          }
          
          emitGameStateUpdated(room, io, roomId);
        }
      }
      // Note: No property purchase logic for jail escape - player just lands and pays rent if needed
    }
    
    return false; // No pending movement for jail escape
  };

  // Helper function to handle landing space actions (rent, taxes, treasure, surprise)
  const handleLandingSpaceAction = (room, player, position, io, roomId, isJailEscape = false) => {
    
    // If this is a jail escape, use the special limited handler
    if (isJailEscape) {
      return handleJailEscapeLanding(room, player, position, io, roomId);
    }
    
    // Handle special spaces after movement
    const isWorldwide = room.mapType === 'Mr. Worldwide';
    
    if (position === 4) { // Income Tax (same position for both maps)
      const taxAmount = Math.floor(room.playerMoney[player.id] * 0.1); // 10% of player cash
      room.playerMoney[player.id] -= taxAmount;
      if (room.settings.vacationCash) {
        room.vacationCash += taxAmount;
        pushGameLog(room, {
          type: 'info',
          player: player.name,
          message: `paid $${taxAmount} income tax (added to vacation cash)`
        }, io);
      } else {
        pushGameLog(room, {
          type: 'info',
          player: player.name,
          message: `paid $${taxAmount} income tax`
        }, io);
      }
    } else if ((position === 38 && !isWorldwide) || (position === 46 && isWorldwide)) { // Luxury Tax
      const taxAmount = 75;
      room.playerMoney[player.id] -= taxAmount;
      if (room.settings.vacationCash) {
        room.vacationCash += taxAmount;
        pushGameLog(room, {
          type: 'info',
          player: player.name,
          message: `paid $${taxAmount} luxury tax (added to vacation cash)`
        }, io);
      } else {
        pushGameLog(room, {
          type: 'info',
          player: player.name,
          message: `paid $${taxAmount} luxury tax`
        }, io);
      }
    } else if ((isWorldwide && [2, 20, 28, 39].includes(position)) || (!isWorldwide && [2, 17, 33].includes(position))) { // Treasure spaces
      const cardResult = room.drawTreasureCard(player.id);
      if (cardResult) {
        cardResult.logs.forEach(log => {
          pushGameLog(room, log, io);
        });
        
        // Handle movement if card requires it (but not during jail escape)
        if (!isJailEscape && cardResult.movement) {
          room.pendingSpecialAction = { 
            type: 'treasure-movement', 
            playerId: player.id, 
            movement: cardResult.movement,
            dice: room.lastDiceRoll ? { 
              dice1: room.lastDiceRoll.dice1, 
              dice2: room.lastDiceRoll.dice2, 
              total: room.lastDiceRoll.total 
            } : null
          };
          emitGameStateUpdated(room, io, roomId);
          return true; // Indicates movement is pending
        }
      }
    } else if ((isWorldwide && [9, 26, 44].includes(position)) || (!isWorldwide && [7, 22, 36].includes(position))) { // Surprise spaces
      const cardResult = room.drawSurpriseCard(player.id);
      if (cardResult) {
        cardResult.logs.forEach(log => {
          pushGameLog(room, log, io);
        });
        
        // Handle movement if card requires it (but not during jail escape)
        if (!isJailEscape && cardResult.movement) {
          room.pendingSpecialAction = { 
            type: 'surprise-movement', 
            playerId: player.id, 
            movement: cardResult.movement,
            dice: room.lastDiceRoll ? { 
              dice1: room.lastDiceRoll.dice1, 
              dice2: room.lastDiceRoll.dice2, 
              total: room.lastDiceRoll.total 
            } : null
          };
          emitGameStateUpdated(room, io, roomId);
          return true; // Indicates movement is pending
        }
      }
    } else {
      // Check if it's a property space and handle rent
      const propertyName = room.getPropertyNameByPosition(position);
      
      // Skip property handling for corner spaces
      if (propertyName && !room.isCornerSpace(position)) {
        if (room.propertyOwnership[propertyName] && room.propertyOwnership[propertyName].owner !== player.id) {
          const rent = room.calculateRent(propertyName);
          
          if (rent > 0) {
            // Use new debt tracking system for rent payment
            const rentResult = room.payRentWithDebt(player.id, room.propertyOwnership[propertyName].owner, propertyName, rent);
          
            // Log rent payment with actual amounts
            if (rentResult.actualPayment > 0) {
              pushGameLog(room, {
                type: 'rent',
                player: player.name,
                owner: room.propertyOwnership[propertyName].ownerName,
                property: propertyName,
                amount: rentResult.actualPayment,
                message: `paid $${rentResult.actualPayment} rent to ${room.propertyOwnership[propertyName].ownerName} for ${propertyName}`
              }, io);
            }
            
            // Log remaining debt if any
            if (rentResult.remainingDebt > 0) {
              pushGameLog(room, {
                type: 'debt',
                player: player.name,
                owner: room.propertyOwnership[propertyName].ownerName,
                property: propertyName,
                amount: rentResult.remainingDebt,
                message: `owes $${rentResult.remainingDebt} in rent to ${room.propertyOwnership[propertyName].ownerName} for ${propertyName}`
              }, io);
            }
            
            // Check if player has negative money (but don't declare bankruptcy yet)
            if (room.playerMoney[player.id] < 0) {
              pushGameLog(room, {
                type: 'warning',
                player: player.name,
                message: `has negative balance ($${room.playerMoney[player.id]}) - must sell properties, mortgage, or trade to recover`
              }, io);
              
              // Set a flag to prevent ending turn until money is positive or player declares bankruptcy
              room.playerNegativeBalance = room.playerNegativeBalance || {};
              room.playerNegativeBalance[player.id] = true;
            }
          }
        } else {
          // If property is not owned, emit propertyLanding event for client to show Buy/End Turn buttons
          // For jail escape players, allow normal property purchases (as per user request)
          if (!room.propertyOwnership[propertyName]) {
            const propertyData = room.getPropertyData(propertyName);
            const propertyPrice = propertyData?.price || 0;
            const canAfford = room.playerMoney[player.id] >= propertyPrice;
            
            const playerSocket = Array.from(io.sockets.sockets.values()).find(s => s.id === player.id);
            if (playerSocket) {
              playerSocket.emit('propertyLanding', {
                propertyName: propertyName,
                price: propertyPrice,
                canAfford: canAfford,
                action: 'purchase'
              });
            }
          }
        }
      }
    }
    return false; // No pending movement
  };

  // --- Enhanced Game Logic Handlers ---
  const rollDice = async ({ roomId, devDice1, devDice2 }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || room.gameState !== 'in-progress') return;

    const currentPlayer = room.players[room.turnIndex];
    if (!currentPlayer || socket.id !== currentPlayer.id) return; // Only current player can roll

    // Broadcast dice rolling animation to all players immediately
    safeEmit(io, roomId, 'diceRollingStarted', {});

    // Delay the actual dice roll and player movement until after animation completes
    setTimeout(() => {
      const result = room.rollDice(socket.id, devDice1, devDice2);
      if (!result) return;

      // CRITICAL: Handle jail escape IMMEDIATELY after rollDice call to prevent turn advancement
      if (result.action === 'jail-escape') {
        
        // Clear jail status
        room.playerStatuses[currentPlayer.id] = null;
        room.playerJailRounds[currentPlayer.id] = 0;
        
        // CRITICAL: Reset doubles count to 0 to prevent any turn advancement logic
        room.playerDoublesCount[currentPlayer.id] = 0;
        
        // CRITICAL: If Room.js advanced the turn, revert it back to the jail escape player
        if (room.turnIndex !== room.players.findIndex(p => p.id === currentPlayer.id)) {
          room.turnIndex = room.players.findIndex(p => p.id === currentPlayer.id);
        }
        
      }

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
        
        // Note: Jail status and doubles count already cleared at top of function
        
        // Continue to normal property landing logic - no special handling needed
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
        
        // After passing START, check for actions on the landing space
        const landingPosition = room.playerPositions[currentPlayer.id];
        const hasPendingMovement = handleLandingSpaceAction(room, currentPlayer, landingPosition, io, roomId);
        
        // If there's pending movement from treasure/surprise cards, return early
        if (hasPendingMovement) {
          return;
        }
        
        // Mark that we've already handled the landing action to avoid duplicate calls later
        result.landingActionHandled = true;
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
      } else if (result.action === 'treasure') {
        // Handle treasure card
        const cardResult = room.drawTreasureCard(currentPlayer.id);
        if (cardResult) {
          // Log all messages from the card result
          cardResult.logs.forEach(log => {
            pushGameLog(room, log, io);
          });
          
          // Handle movement if card requires it
          if (cardResult.movement) {
            room.pendingSpecialAction = { 
              type: 'treasure-movement', 
              playerId: currentPlayer.id, 
              movement: cardResult.movement,
              dice: { dice1: result.dice1, dice2: result.dice2, total: result.total } 
            };
            
            // DON'T set turnState here - let diceAnimationComplete handle it after processing the landing
            
            emitGameStateUpdated(room, io, roomId, { debug: 'SERVER-UNIQUE-123' });
            return;
          }
        }
      } else if (result.action === 'surprise') {
        // Handle surprise card
        const cardResult = room.drawSurpriseCard(currentPlayer.id);
        if (cardResult) {
          // Log all messages from the card result
          cardResult.logs.forEach(log => {
            pushGameLog(room, log, io);
          });
          
          // Handle movement if card requires it
          if (cardResult.movement) {
            room.pendingSpecialAction = { 
              type: 'surprise-movement', 
              playerId: currentPlayer.id, 
              movement: cardResult.movement,
              dice: { dice1: result.dice1, dice2: result.dice2, total: result.total } 
            };
            
            // DON'T set turnState here - let diceAnimationComplete handle it after processing the landing
            
            emitGameStateUpdated(room, io, roomId, { debug: 'SERVER-UNIQUE-123' });
            return;
          }
        }
      } else if (result.action === 'jail-move') {
        // Determine if this is from landing on Go to Jail or from 3 doubles
        const isFromGoToJail = result.position === 30 || result.position === 36; // Position 30 (classic) or 36 (worldwide)
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
        
        // BOTH Go to Jail and 3 doubles should FORCE turn end (no End Turn button)
        if (isFromThreeDoubles) {
          // Turn was already advanced in Room.js, just emit logs and state
          // Check if next player is on vacation
          const nextPlayer = room.players[room.turnIndex];
          const nextPlayerStatus = room.playerStatuses[nextPlayer.id];
          
          if (nextPlayerStatus && typeof nextPlayerStatus === 'object' && nextPlayerStatus.status === 'vacation') {
            room.turnState = 'awaiting-vacation-skip';
          } else {
            room.turnState = 'awaiting-roll';
          }
          
          emitAdvanceTurnLogs(room, result.turnResult, io);
          emitGameStateUpdated(room, io, roomId);
          return;
        } else if (isFromGoToJail) {
          // Go to Jail space - FORCE turn end immediately (this is the exception to universal End Turn rule)
          room.playerDoublesCount[currentPlayer.id] = 0; // Reset doubles count
          const turnResult = room.advanceTurn('user-action');
          room.lastDiceRoll = null;
          
          // Check if next player is on vacation
          const nextPlayer = room.players[room.turnIndex];
          const nextPlayerStatus = room.playerStatuses[nextPlayer.id];
          
          if (nextPlayerStatus && typeof nextPlayerStatus === 'object' && nextPlayerStatus.status === 'vacation') {
            room.turnState = 'awaiting-vacation-skip';
          } else {
            room.turnState = 'awaiting-roll';
          }
          
          emitAdvanceTurnLogs(room, turnResult, io);
          emitGameStateUpdated(room, io, roomId);
          return;
        }
      } else if (result.action === 'go-to-jail') {
        // Go to Prison space - FORCE turn end immediately (no End Turn button)
        pushGameLog(room, {
          type: 'special',
          player: currentPlayer.name,
          message: `landed on Go to Prison and was sent to jail! 🚔`
        }, io);
        
        // Reset doubles count and advance turn immediately
        room.playerDoublesCount[currentPlayer.id] = 0;
        const turnResult = room.advanceTurn('user-action');
        room.lastDiceRoll = null;
        
        // Check if next player is on vacation
        const nextPlayer = room.players[room.turnIndex];
        const nextPlayerStatus = room.playerStatuses[nextPlayer.id];
        
        if (nextPlayerStatus && typeof nextPlayerStatus === 'object' && nextPlayerStatus.status === 'vacation') {
          room.turnState = 'awaiting-vacation-skip';
        } else {
          room.turnState = 'awaiting-roll';
        }
        
        emitAdvanceTurnLogs(room, turnResult, io);
        emitGameStateUpdated(room, io, roomId);
        return;
      } else if (result.action === 'start') {
        // Landed on START - just log it, End Turn button will show
        pushGameLog(room, {
          type: 'special',
          player: currentPlayer.name,
          message: `moved to START and collected $300`
        }, io);
      }

      // Emit logs if advanceTurn was called (for jail, vacation, or 3 doubles)
      if (result.turnResult) {
        emitAdvanceTurnLogs(room, result.turnResult, io);
      }

      // Handle normal property landing for cases that don't have special actions AND haven't already been handled
      if ((!result.action || (!['jail', 'vacation', 'treasure', 'surprise', 'income-tax', 'luxury-tax', 'jail-move', 'start'].includes(result.action))) && !result.landingActionHandled) {
        const landingPosition = room.playerPositions[currentPlayer.id];
        const hasPendingMovement = handleLandingSpaceAction(room, currentPlayer, landingPosition, io, roomId);
        
        // If there's pending movement from treasure/surprise cards, return early
        if (hasPendingMovement) {
          return;
        }
      }

      // SPECIAL CASE: Reset dice roll for jail escapes AFTER property landing is handled
      if (result.action === 'jail-escape') {
        room.lastDiceRoll = null; // Reset dice roll for the next player's turn
      }

      // Broadcast updated state with explicit turn state
      const timestamp = new Date().toISOString();
      // console.log(`[SERVER] ${timestamp} - rollDice emit gameStateUpdated:`, { propertyOwnership: room.propertyOwnership });
      // console.log(`[SERVER] ${timestamp} - rollDice playerStatuses:`, JSON.stringify(room.playerStatuses));
      
      // CRITICAL: Set explicit state to show End Turn button after dice roll
      // The frontend should ALWAYS show End Turn button after rollDice (except for forced jail moves)
      room.turnState = 'awaiting-end-turn'; // Explicit state for frontend
      emitGameStateUpdated(room, io, roomId);
    }, 800); // Wait for dice animation to complete before moving player
  };

// Update the endTurn handler to accept vacationEndTurnPlayerId
const endTurn = async ({ roomId, vacationEndTurnPlayerId }) => {
  const room = roomService.getRoomById(roomId);
  if (!room || room.gameState !== 'in-progress') return;

  const currentPlayer = room.players[room.turnIndex];
  if (!currentPlayer || socket.id !== currentPlayer.id) return;

  // GUARD: Prevent duplicate endTurn calls using a timestamp-based debounce
  const now = Date.now();
  const lastEndTurnTime = room.lastEndTurnTime || 0;
  if (now - lastEndTurnTime < 1000) { // 1 second debounce
    return;
  }
  room.lastEndTurnTime = now;

  // GUARD: Prevent ending turn if player has negative balance or outstanding debts
  if (room.playerMoney[currentPlayer.id] < 0) {
    socket.emit('endTurnError', { 
      message: `Cannot end turn with negative balance ($${room.playerMoney[currentPlayer.id]}). You must sell properties, mortgage assets, trade, or declare bankruptcy.` 
    });
    return;
  }
  
  // Check for any outstanding debts
  if (room.playerDebts && room.playerDebts[currentPlayer.id]) {
    const totalDebt = Object.values(room.playerDebts[currentPlayer.id]).reduce((sum, debt) => sum + debt, 0);
    if (totalDebt > 0) {
      socket.emit('endTurnError', { 
        message: `Cannot end turn with outstanding debts ($${totalDebt}). You must pay your debts first.` 
      });
      return;
    }
  }

  // Check if player rolled doubles
  const lastRoll = room.lastDiceRoll;
  const isDoubles = lastRoll && lastRoll.dice1 === lastRoll.dice2;
  const doublesCount = room.playerDoublesCount[currentPlayer.id] || 0;
  
  
  // CRITICAL: Check if player landed on vacation and set vacation status
  const playerCurrentPosition = room.playerPositions[currentPlayer.id];
  const isWorldwide = room.mapType === 'Mr. Worldwide';
  const vacationPosition = isWorldwide ? 24 : 20; // Vacation position varies by map
  
  // Only set vacation status if player just landed on vacation AND is not already in vacation
  if (playerCurrentPosition === vacationPosition && 
      (!room.playerStatuses[currentPlayer.id] || 
       room.playerStatuses[currentPlayer.id].status !== 'vacation')) {
    // Player just landed on vacation space - set vacation status when they click End Turn
    room.playerStatuses[currentPlayer.id] = { 
      status: 'vacation', 
      vacationStartRound: room.roundNumber 
    };
  
  }
  
  // **CORRECTED DOUBLES LOGIC - UNIVERSAL END TURN BUTTON**
  // The philosophy: ALWAYS allow End Turn button, never force extra rolls automatically
  
  // 1. Check for Go to Jail moves (only thing that FORCES turn end without End Turn button)
  const goToJailPosition = room.mapType === 'worldwide' ? 36 : 30;
  const currentPosition = room.playerPositions[currentPlayer.id];
  const isGoToJailMove = room.pendingSpecialAction?.type === 'jail-move';
  
  if (isGoToJailMove) {
    // Go to jail FORCES turn end - no End Turn button needed
    room.playerDoublesCount[currentPlayer.id] = 0; // Reset doubles count
    room.jailEscapeThisTurn = false;
    pushGameLog(room, {
      type: 'info',
      player: currentPlayer.name,
      message: `went to jail - turn ended`
    }, io);
    const turnResult = room.advanceTurn('user-action', vacationEndTurnPlayerId);
    room.lastDiceRoll = null;
    emitAdvanceTurnLogs(room, turnResult, io);
    emitGameStateUpdated(room, io, roomId);
    return;
  }

  // 2. For ALL other cases (including doubles), check if player should get another roll
  if (isDoubles && doublesCount > 0 && doublesCount < 3) {
    // Player rolled doubles and can get another roll - but ONLY show they can roll again, don't advance turn
    room.lastDiceRoll = null;
    pushGameLog(room, {
      type: 'info',
      player: currentPlayer.name,
      message: 'ended turn after rolling doubles - gets another roll'
    }, io);
    // CRITICAL: Set explicit state to show Roll Again button
    room.turnState = 'awaiting-roll-again'; // Explicit state for frontend to show Roll Again button
    emitGameStateUpdated(room, io, roomId);
    return;
  }

  // 3. If we reach here, advance to the next player and ALWAYS reset doubles count
  // This happens when: no doubles, OR 3+ doubles, OR any other normal turn end
  room.playerDoublesCount[currentPlayer.id] = 0; // ALWAYS reset doubles count when turn ends
  room.jailEscapeThisTurn = false;

  // Log turn end
  pushGameLog(room, {
    type: 'info',
    player: currentPlayer.name,
    message: `ended turn`
  }, io);

  const turnResult = room.advanceTurn('user-action', vacationEndTurnPlayerId);
  room.lastDiceRoll = null;
  
  // CRITICAL: Set explicit state for next player's turn
  // Check if next player is on vacation and should skip
  const nextPlayer = room.players[room.turnIndex];
  const nextPlayerStatus = room.playerStatuses[nextPlayer.id];
  
  if (nextPlayerStatus && typeof nextPlayerStatus === 'object' && nextPlayerStatus.status === 'vacation') {
    // Next player is on vacation - show Skip Turn button
    room.turnState = 'awaiting-vacation-skip';
  } else {
    // Next player can roll normally
    room.turnState = 'awaiting-roll';
  }
  
  emitAdvanceTurnLogs(room, turnResult, io);
  emitGameStateUpdated(room, io, roomId);
  
  // Auto-play bot turns
  setTimeout(() => {
    handleBotTurn(room, io);
  }, 1000); // Small delay to ensure client updates first
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
      const rent = room.calculateRent(propertyName);
      if (rent > 0) {
        // Use new debt tracking system for rent payment
        const rentResult = room.payRentWithDebt(socket.id, room.propertyOwnership[propertyName].owner, propertyName, rent);
        
        // Log rent payment with actual amounts
        if (rentResult.actualPayment > 0) {
          pushGameLog(room, {
            type: 'rent',
            player: currentPlayer.name,
            owner: room.propertyOwnership[propertyName].ownerName,
            property: propertyName,
            amount: rentResult.actualPayment,
            message: `paid $${rentResult.actualPayment} rent to ${room.propertyOwnership[propertyName].ownerName} for ${propertyName}`
          }, io);
        }
        
        // Log remaining debt if any
        if (rentResult.remainingDebt > 0) {
          pushGameLog(room, {
            type: 'debt',
            player: currentPlayer.name,
            owner: room.propertyOwnership[propertyName].ownerName,
            property: propertyName,
            amount: rentResult.remainingDebt,
            message: `owes $${rentResult.remainingDebt} in rent to ${room.propertyOwnership[propertyName].ownerName} for ${propertyName}`
          }, io);
        }
        
        // Check if player has negative money (but don't declare bankruptcy yet)
        if (room.playerMoney[socket.id] < 0) {
          pushGameLog(room, {
            type: 'warning',
            player: currentPlayer.name,
            message: `has negative balance ($${room.playerMoney[socket.id]}) - must sell properties, mortgage, or trade to recover`
          }, io);
          
          // Set a flag to prevent ending turn until money is positive or player declares bankruptcy
          room.playerNegativeBalance = room.playerNegativeBalance || {};
          room.playerNegativeBalance[socket.id] = true;
        }
        
        emitGameStateUpdated(room, io, roomId);
      } else {
        // console.log(`[DEBUG] handlePropertyLanding: No rent paid for ${propertyName} (rent=$${rent})`);
      }
    }
    // Vacation cash: if player lands on Vacation (varies by map: classic=20, worldwide=24)
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

    // CRITICAL: Set turnState to awaiting-end-turn after skipping property
    room.turnState = 'awaiting-end-turn';
    
    // Emit updated game state
    emitGameStateUpdated(room, io, roomId);
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
          safeEmit(io, roomId, 'auctionUpdate', room.auction);
        }
      }
    }, 1000);
    
    safeEmit(io, roomId, 'auctionStarted', room.auction);
    
    // Trigger bot auction participation
    setTimeout(() => {
      const bots = participants.filter(p => p.isBot);
      bots.forEach(bot => {
        setTimeout(() => {
          botService.handleBotAuction(room, bot.id, io);
        }, Math.random() * 2000 + 1000); // Random delay between 1-3 seconds
      });
    }, 1000);
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
    
    // CRITICAL: Set turnState to awaiting-end-turn after auction completes
    room.turnState = 'awaiting-end-turn';
    
    // Include current player info in auction ended event
    const auctionEndedData = {
      ...room.auction,
      currentPlayerId: room.auction.currentPlayerId // This tells the client who should get the end turn button
    };
    
    safeEmit(io, room.id, 'auctionEnded', auctionEndedData);
    
    // Emit updated game state to show End Turn button
    emitGameStateUpdated(room, io, room.id);
    
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
    safeEmit(io, roomId, 'auctionUpdate', room.auction);
    
    // Trigger bot responses to new bid
    setTimeout(() => {
      const bots = room.auction.participants.filter(p => p.isBot && !room.auction.passedPlayers.includes(p.id) && p.id !== player.id);
      bots.forEach(bot => {
        setTimeout(() => {
          botService.handleBotAuction(room, bot.id, io);
        }, Math.random() * 1500 + 500); // Random delay between 0.5-2 seconds
      });
    }, 500);
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
    safeEmit(io, roomId, 'auctionUpdate', room.auction);
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
      
      // CRITICAL: Set turnState to awaiting-end-turn after property purchase
      room.turnState = 'awaiting-end-turn';
      
      // Broadcast updated state to the room using the proper function
      emitGameStateUpdated(room, io, roomId);
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
    if (!room || room.gameState !== 'in-progress') {
      // console.log('[DEBUG] useJailCard failed: room not found or not in progress');
      return;
    }

    const currentPlayer = room.players[room.turnIndex];
    if (!currentPlayer || socket.id !== currentPlayer.id) {
      return;
    }
    
    if (room.playerStatuses[socket.id] !== 'jail') {
      return;
    }
    
    if (room.playerJailCards[socket.id] <= 0) {
      return;
    }

    room.playerJailCards[socket.id]--;
    room.playerStatuses[socket.id] = null;
    room.playerJailRounds[socket.id] = 0;

    pushGameLog(room, {
      type: 'special',
      player: currentPlayer.name,
      message: `used a Pardon Card to get out of jail`
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
    
    const result = room.sellPropertyWithDebtPayment(socket.id, propertyName);
    if (result.success) {
      pushGameLog(room, {
        type: 'special',
        player: currentPlayer.name,
        property: propertyName,
        message: `sold ${propertyName} for $${result.salePrice}`
      }, io);
      
      // Log debt payments if any occurred
      result.payments.forEach(payment => {
        pushGameLog(room, {
          type: 'debt-payment',
          player: currentPlayer.name,
          creditor: payment.creditorName,
          amount: payment.amount,
          message: `paid $${payment.amount} debt to ${payment.creditorName}${payment.remainingDebt > 0 ? ` (remaining debt: $${payment.remainingDebt})` : ''}`
        }, io);
      });
      
      // Check if player recovered from negative balance
      if (room.playerMoney[socket.id] >= 0 && room.playerNegativeBalance && room.playerNegativeBalance[socket.id]) {
        room.playerNegativeBalance[socket.id] = false;
        pushGameLog(room, {
          type: 'info',
          player: currentPlayer.name,
          message: `recovered from negative balance!`
        }, io);
      }
      
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
    
    const result = room.mortgagePropertyWithDebtPayment(socket.id, propertyName);
    if (result.success) {
      pushGameLog(room, {
        type: 'special',
        player: currentPlayer.name,
        property: propertyName,
        message: `mortgaged ${propertyName} for $${result.mortgageAmount}`
      }, io);
      
      // Log debt payments if any occurred
      result.payments.forEach(payment => {
        pushGameLog(room, {
          type: 'debt-payment',
          player: currentPlayer.name,
          creditor: payment.creditorName,
          amount: payment.amount,
          message: `paid $${payment.amount} debt to ${payment.creditorName}${payment.remainingDebt > 0 ? ` (remaining debt: $${payment.remainingDebt})` : ''}`
        }, io);
      });
      
      // Check if player recovered from negative balance
      if (room.playerMoney[socket.id] >= 0 && room.playerNegativeBalance && room.playerNegativeBalance[socket.id]) {
        room.playerNegativeBalance[socket.id] = false;
        pushGameLog(room, {
          type: 'info',
          player: currentPlayer.name,
          message: `recovered from negative balance!`
        }, io);
      }
      
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
      safeEmit(io, roomId, 'shufflingPlayers', { shuffledOrder });
    }
  };

  // Declare bankruptcy handler
  const declareBankruptcy = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    const currentPlayer = room && room.players[room.turnIndex];
    if (!room || room.gameState !== 'in-progress' || !currentPlayer || socket.id !== currentPlayer.id) return;
    
    // Only allow bankruptcy if player has negative balance
    if (room.playerMoney[socket.id] >= 0) {
      socket.emit('propertyActionError', { message: 'Cannot declare bankruptcy with positive balance' });
      return;
    }
    
    // Process automatic bankruptcy with asset liquidation
    const bankruptcyResult = room.processBankruptcy(socket.id);
    
    if (bankruptcyResult.success) {
      // Log liquidation details
      bankruptcyResult.liquidationLog.forEach(log => {
        pushGameLog(room, {
          type: 'bankruptcy-liquidation',
          player: currentPlayer.name,
          message: log
        }, io);
      });
      
      // Log debt payments
      bankruptcyResult.debtPayments.forEach(payment => {
        pushGameLog(room, {
          type: 'debt-payment',
          player: currentPlayer.name,
          creditor: payment.creditorName,
          amount: payment.amount,
          message: `paid $${payment.amount} debt to ${payment.creditorName} (bankruptcy liquidation)`
        }, io);
      });
      
      // Final bankruptcy message
      pushGameLog(room, {
        type: 'bankruptcy',
        player: currentPlayer.name,
        message: `declared bankruptcy and left the game! (Total assets liquidated: $${bankruptcyResult.totalLiquidated})`
      }, io);
    }
    
    // Advance turn to next player
    const turnResult = room.advanceTurn('user-action');
    room.lastDiceRoll = null;
    emitAdvanceTurnLogs(room, turnResult, io);
    emitGameStateUpdated(room, io, roomId);
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
    
    // Check if next player is on vacation
    const nextPlayer = room.players[room.turnIndex];
    const nextPlayerStatus = room.playerStatuses[nextPlayer.id];
    
    if (nextPlayerStatus && typeof nextPlayerStatus === 'object' && nextPlayerStatus.status === 'vacation') {
      room.turnState = 'awaiting-vacation-skip';
    } else {
      room.turnState = 'awaiting-roll';
    }
    
    emitAdvanceTurnLogs(room, turnResult, io);
    emitGameStateUpdated(room, io, roomId);
  };

  // Handler for dice animation completion (treasure/surprise card movements)
  const diceAnimationComplete = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (room && room.pendingSpecialAction) {
      const { type, playerId } = room.pendingSpecialAction;
      // Process the pending special action and advance the turn
      if (type === 'vacation') {
        // Vacation logic: Let player click End Turn button, don't auto-advance
        // Just log the vacation landing and set turnState for End Turn button
        const currentPlayer = room.players[room.turnIndex];
        
        // Check if there was vacation cash to collect
        if (room.settings.vacationCash && room.vacationCash > 0) {
          room.playerMoney[playerId] += room.vacationCash;
          pushGameLog(room, {
            type: 'special',
            player: currentPlayer.name,
            message: `collected $${room.vacationCash} from vacation cash!`
          }, io);
          room.vacationCash = 0;
        }
        
        // Clear pending action and set turnState to show End Turn button
        room.pendingSpecialAction = null;
        room.turnState = 'awaiting-end-turn';
        emitGameStateUpdated(room, io, roomId);
      } else if (type === 'jail' || type === 'go-to-jail') {
        // Jail logic: move player to jail, set status, advance turn
        const jailPosition = room.mapType === 'Mr. Worldwide' ? 12 : 10;
        room.playerPositions[playerId] = jailPosition;
        room.playerStatuses[playerId] = 'jail';
        room.playerJailRounds[playerId] = 0;
        room.playerDoublesCount[playerId] = 0;
        const turnResult = room.advanceTurn();
        room.lastDiceRoll = null;
        room.pendingSpecialAction = null; // <-- Move this up to prevent double-processing
        // Set appropriate turnState for the new current player
        const currentPlayer = room.players[room.turnIndex];
        if (currentPlayer && room.playerStatuses[currentPlayer.id] === 'vacation') {
          room.turnState = 'awaiting-vacation-skip';
        } else {
          room.turnState = 'awaiting-roll';
        }
        emitAdvanceTurnLogs(room, turnResult, io);
        emitGameStateUpdated(room, io, roomId);
      } else if (type === 'treasure-movement' || type === 'surprise-movement') {
        // Handle treasure/surprise card movement
        const { movement, dice } = room.pendingSpecialAction;
        
        // CRITICAL: Update lastDiceRoll with the current roll that triggered the card
        // This ensures the correct dice values are used for doubles checking
        if (dice) {
          room.lastDiceRoll = {
            dice1: dice.dice1,
            dice2: dice.dice2,
            total: dice.total,
            playerId: playerId
          };
        }
        
        if (movement.goToJail) {
          // Go to jail movement
          const jailPosition = room.mapType === 'Mr. Worldwide' ? 12 : 10;
          room.playerPositions[playerId] = jailPosition;
          room.playerStatuses[playerId] = 'jail';
          room.playerJailRounds[playerId] = 0;
          room.playerDoublesCount[playerId] = 0;
          const turnResult = room.advanceTurn();
          room.lastDiceRoll = null;
          room.pendingSpecialAction = null;
          // Set appropriate turnState for the new current player
          const currentPlayer = room.players[room.turnIndex];
          if (currentPlayer && room.playerStatuses[currentPlayer.id] === 'vacation') {
            room.turnState = 'awaiting-vacation-skip';
          } else {
            room.turnState = 'awaiting-roll';
          }
          emitAdvanceTurnLogs(room, turnResult, io);
          emitGameStateUpdated(room, io, roomId);
        } else {
          // Regular movement - check if player needs to handle landing space actions
          const currentPosition = room.playerPositions[playerId];
          const currentPlayer = room.players.find(p => p.id === playerId);
          
          // Handle all types of landing space actions
          const hasPendingMovement = handleLandingSpaceAction(room, currentPlayer, currentPosition, io, roomId);
          
          // Reset special action
          room.pendingSpecialAction = null;
          
          // If no new pending movement from nested cards, check for property landing
          if (!hasPendingMovement) {
            // Check if the current position is an unowned property
            const propertyName = room.getPropertyNameByPosition(currentPosition);
            const propertyData = room.getPropertyData(propertyName);
            
            // console.log(`[DEBUG] Server: Position ${currentPosition}, PropertyName: ${propertyName}, PropertyData:`, propertyData);
            // console.log(`[DEBUG] Server: Has price?`, propertyData?.price, 'Is surprise?', room.isSurpriseSpace(currentPosition), 'Is treasure?', room.isTreasureSpace(currentPosition));
            
            // Only treat it as a purchasable property if it exists in propertyData and has a price
            if (propertyName && propertyData && propertyData.price && !room.propertyOwnership[propertyName]) {
              const propertyPrice = propertyData.price;
              const canAfford = room.playerMoney[playerId] >= propertyPrice;
              
              const playerSocket = Array.from(io.sockets.sockets.values()).find(s => s.id === playerId);
              if (playerSocket) {
                playerSocket.emit('propertyLanding', {
                  propertyName: propertyName,
                  price: propertyPrice,
                  canAfford: canAfford,
                  action: 'purchase'
                });
              }
              
              // CRITICAL FIX: If landing on unowned property, DON'T set turnState to awaiting-end-turn
              // The property landing will show Buy/Auction buttons instead of End Turn
              // Don't set any turnState here - let the property purchase flow handle it
            } else if (propertyName && propertyData && propertyData.price && room.propertyOwnership[propertyName] && room.propertyOwnership[propertyName].owner !== playerId) {
              // Player landed on owned property - calculate rent
              const rent = room.calculateRent(propertyName);
              if (rent > 0) {
                // Pay rent and set turnState to awaiting-end-turn
                room.turnState = 'awaiting-end-turn';
              } else {
                // No rent to pay, just set turnState to awaiting-end-turn
                room.turnState = 'awaiting-end-turn';
              }
            } else {
              // Not a property or player owns it - just set turnState to awaiting-end-turn
              room.turnState = 'awaiting-end-turn';
            }
            
          } else {
          }
          
          emitGameStateUpdated(room, io, roomId);
        }
      }
    }
  };

  socket.on('createPrivateGame', createPrivateGame);
  socket.on('joinRoom', joinRoom);
  socket.on('leaveRoom', leaveRoom);
  socket.on('kickPlayer', kickPlayer);
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
  socket.on('declareBankruptcy', declareBankruptcy);
  socket.on('disconnect', handleDisconnect);
  socket.on('requestGameLog', handleRequestGameLog);
  socket.on('requestPlayerList', handleRequestPlayerList);
  socket.on('requestRoomSettings', handleRequestRoomSettings);
  socket.on('requestShuffle', requestShuffle);
  socket.on('skipVacationTurn', skipVacationTurn);
  socket.on('diceAnimationComplete', diceAnimationComplete);
  socket.on('whatRooms', () => {
  });
  socket.on('gameLogUpdated', (logEntry) => {
  });
  socket.on('gameStateUpdated', (gameState) => {
    // ... rest of your state update logic
  });
  
  // Manual turn advancement for testing/fixing disconnection issues
  socket.on('forceAdvanceTurn', ({ roomId }) => {
    // console.log(`[DEBUG] Force advance turn requested by ${socket.id} for room ${roomId}`);
    const room = roomService.getRoomById(roomId);
    if (!room || room.gameState !== 'in-progress') {
      // console.log(`[DEBUG] Room not found or game not in progress`);
      return;
    }
    
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) {
      // console.log(`[DEBUG] Player not found or not host`);
      return;
    }
    
    // console.log(`[DEBUG] Forcing turn advancement...`);
    room.advanceToNextActiveTurn();
    
    const gameStateData = room.getGameState();
    // console.log(`[DEBUG] New turn state - turnIndex: ${room.turnIndex}, currentTurnSocketId: ${gameStateData.currentTurnSocketId}`);
    
    safeEmit(io, room.id, 'gameStateUpdated', gameStateData);
    // console.log(`[DEBUG] Emitted gameStateUpdated after force advance turn`);
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
    const creatorOffer = offers[socket.id] || { money: 0, properties: [], pardonCards: 0 };
    const targetOffer = offers[targetPlayerId] || { money: 0, properties: [], pardonCards: 0 };

    // Check if creator has sufficient resources - only check money if they're actually offering money
    if (creatorOffer.money > 0) {
      const creatorAvailableMoney = Math.max(0, room.playerMoney[socket.id]); // Only positive money can be offered
      if (creatorOffer.money > creatorAvailableMoney) {
        socket.emit('tradeError', { message: 'You do not have enough money' });
        return;
      }
    }

    // Check if creator owns all properties they're offering
    for (const propertyName of creatorOffer.properties) {
      if (!room.propertyOwnership[propertyName] || room.propertyOwnership[propertyName].owner !== socket.id) {
        socket.emit('tradeError', { message: `You do not own ${propertyName}` });
        return;
      }
      
      // Check if property has buildings (houses or hotels) - cannot be traded
      const property = room.propertyOwnership[propertyName];
      if (property.houses > 0 || property.hotel) {
        socket.emit('tradeError', { message: `Cannot trade ${propertyName} - property has buildings. Sell all buildings first.` });
        return;
      }
    }

    // Check if target owns all properties in the request
    for (const propertyName of targetOffer.properties) {
      if (!room.propertyOwnership[propertyName] || room.propertyOwnership[propertyName].owner !== targetPlayerId) {
        socket.emit('tradeError', { message: `${targetPlayer.name} does not own ${propertyName}` });
        return;
      }
      
      // Check if property has buildings (houses or hotels) - cannot be traded
      const property = room.propertyOwnership[propertyName];
      if (property.houses > 0 || property.hotel) {
        socket.emit('tradeError', { message: `Cannot trade ${propertyName} - ${targetPlayer.name}'s property has buildings.` });
        return;
      }
    }

    // Check if target has sufficient money - only check money if they're actually offering money
    if (targetOffer.money > 0) {
      const targetAvailableMoney = Math.max(0, room.playerMoney[targetPlayerId]); // Only positive money can be offered
      if (targetOffer.money > targetAvailableMoney) {
        socket.emit('tradeError', { message: `${targetPlayer.name} does not have enough money` });
        return;
      }
    }

    // Check pardon card availability
    if (creatorOffer.pardonCards > (room.playerJailCards[socket.id] || 0)) {
      socket.emit('tradeError', { message: 'You do not have enough pardon cards' });
      return;
    }
    if (targetOffer.pardonCards > (room.playerJailCards[targetPlayerId] || 0)) {
      socket.emit('tradeError', { message: `${targetPlayer.name} does not have enough pardon cards` });
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
    safeEmit(io, roomId, 'tradeCreated', trade);
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
        // Log debt payments if any occurred
        if (result.debtPayments.creator && result.debtPayments.creator.length > 0) {
          result.debtPayments.creator.forEach(payment => {
            pushGameLog(room, {
              type: 'debt-payment',
              player: creatorPlayer.name,
              creditor: payment.creditorName,
              amount: payment.amount,
              message: `paid $${payment.amount} debt to ${payment.creditorName} from trade${payment.remainingDebt > 0 ? ` (remaining debt: $${payment.remainingDebt})` : ''}`
            }, io);
          });
        }
        
        if (result.debtPayments.target && result.debtPayments.target.length > 0) {
          const targetPlayer = room.players.find(p => p.id === trade.targetPlayerId);
          result.debtPayments.target.forEach(payment => {
            pushGameLog(room, {
              type: 'debt-payment',
              player: targetPlayer.name,
              creditor: payment.creditorName,
              amount: payment.amount,
              message: `paid $${payment.amount} debt to ${payment.creditorName} from trade${payment.remainingDebt > 0 ? ` (remaining debt: $${payment.remainingDebt})` : ''}`
            }, io);
          });
        }
        
        // Check if either player recovered from negative balance
        if (room.playerMoney[trade.createdBy] >= 0 && room.playerNegativeBalance && room.playerNegativeBalance[trade.createdBy]) {
          room.playerNegativeBalance[trade.createdBy] = false;
          pushGameLog(room, {
            type: 'info',
            player: creatorPlayer.name,
            message: `recovered from negative balance through trade!`
          }, io);
        }
        
        if (room.playerMoney[trade.targetPlayerId] >= 0 && room.playerNegativeBalance && room.playerNegativeBalance[trade.targetPlayerId]) {
          room.playerNegativeBalance[trade.targetPlayerId] = false;
          const targetPlayer = room.players.find(p => p.id === trade.targetPlayerId);
          pushGameLog(room, {
            type: 'info',
            player: targetPlayer.name,
            message: `recovered from negative balance through trade!`
          }, io);
        }
        
        pushGameLog(room, {
          type: 'trade',
          player: responsePlayer.name,
          target: creatorPlayer.name,
          tradeId: tradeId,
          message: `accepted the trade from ${creatorPlayer.name}`
        }, io);
        
        // Emit trade executed
        safeEmit(io, roomId, 'tradeExecuted', { tradeId, result });
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
      safeEmit(io, roomId, 'tradeDeclined', { tradeId });
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
    safeEmit(io, roomId, 'tradeCancelled', { tradeId });
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
    const creatorOffer = offers[newCreatorId] || { money: 0, properties: [], pardonCards: 0 };
    const targetOffer = offers[newTargetId] || { money: 0, properties: [], pardonCards: 0 };

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
      
      // Check if property has buildings (houses or hotels) - cannot be traded
      const property = room.propertyOwnership[propertyName];
      if (property.houses > 0 || property.hotel) {
        socket.emit('tradeError', { message: `Cannot trade ${propertyName} - property has buildings. Sell all buildings first.` });
        return;
      }
    }

    for (const propertyName of targetOffer.properties) {
      if (!room.propertyOwnership[propertyName] || room.propertyOwnership[propertyName].owner !== newTargetId) {
        const targetPlayer = room.players.find(p => p.id === newTargetId);
        socket.emit('tradeError', { message: `${targetPlayer.name} does not own ${propertyName}` });
        return;
      }
      
      // Check if property has buildings (houses or hotels) - cannot be traded
      const property = room.propertyOwnership[propertyName];
      if (property.houses > 0 || property.hotel) {
        const targetPlayer = room.players.find(p => p.id === newTargetId);
        socket.emit('tradeError', { message: `Cannot trade ${propertyName} - ${targetPlayer.name}'s property has buildings.` });
        return;
      }
    }

    if (targetOffer.money > room.playerMoney[newTargetId]) {
      const targetPlayer = room.players.find(p => p.id === newTargetId);
      socket.emit('tradeError', { message: `${targetPlayer.name} does not have enough money` });
      return;
    }

    // Check pardon card availability
    if (creatorOffer.pardonCards > (room.playerJailCards[newCreatorId] || 0)) {
      socket.emit('tradeError', { message: 'You do not have enough pardon cards' });
      return;
    }
    if (targetOffer.pardonCards > (room.playerJailCards[newTargetId] || 0)) {
      const targetPlayer = room.players.find(p => p.id === newTargetId);
      socket.emit('tradeError', { message: `${targetPlayer.name} does not have enough pardon cards` });
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
    safeEmit(io, roomId, 'tradeCancelled', { tradeId: originalTradeId });
    safeEmit(io, roomId, 'tradeCreated', newTrade);
  };

  // Get player properties for trade UI
  const getPlayerProperties = ({ roomId, playerId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) return;

    const assets = room.getPlayerTradeableAssets(playerId);
    socket.emit('playerTradeableAssets', { playerId, assets });
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
        safeEmit(io, roomId, 'gameOver', {
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
        safeEmit(io, roomId, 'gameLogUpdated', result.logEntry);
      }
      
      emitGameStateUpdated(room, io, roomId);
      
      // Start server-side timer to track remaining time
      const updateTimer = () => {
        // Always check if activeVoteKick still exists before proceeding
        if (!room.activeVoteKick) {
          // console.log('[DEBUG SERVER] updateTimer: activeVoteKick was cancelled, stopping timer');
          // Emit a final timer update with 0 remaining time to clear frontend
          safeEmit(io, roomId, 'voteKickTimer', { 
            targetPlayerId: null,
            remainingTime: 0 
          });
          return; // Stop the timer if vote-kick was cancelled
        }
        
        const remaining = Math.max(0, room.activeVoteKick.endTime - Date.now());
        // console.log('[DEBUG SERVER] updateTimer emitting voteKickTimer:', { targetPlayerId: room.activeVoteKick.targetPlayerId, remainingTime: remaining });
        safeEmit(io, roomId, 'voteKickTimer', { 
          targetPlayerId: room.activeVoteKick.targetPlayerId,
          remainingTime: remaining 
        });
        
        // If time is up, auto-kick the player
        if (remaining <= 0) {
          // console.log('[DEBUG SERVER] Vote-kick timer expired, auto-kicking player');
          const executeResult = room.executeVoteKick();
          if (executeResult && executeResult.kickLog) {
            safeEmit(io, roomId, 'gameLogUpdated', executeResult.kickLog);
          }
          
          // Check if game should end after vote-kick
          const gameEndResult = room.checkGameEnd();
          
          if (gameEndResult.gameOver) {
            // Emit game over event to all players
            safeEmit(io, roomId, 'gameOver', {
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
        safeEmit(io, roomId, 'gameLogUpdated', result.logEntry);
      }
      
      emitGameStateUpdated(room, io, roomId);
      
      if (result.executed) {
        // Push the kick log to all clients
        if (result.kickLog) {
          safeEmit(io, roomId, 'gameLogUpdated', result.kickLog);
        }
        
        // Check if game should end after vote-kick execution
        const gameEndResult = room.checkGameEnd();
        
        if (gameEndResult.gameOver) {
          // Emit game over event to all players
          safeEmit(io, roomId, 'gameOver', {
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
    safeEmit(io, roomId, 'playerListUpdated', room.getPlayerList());
    
    // Emit room settings
    safeEmit(io, roomId, 'roomSettingsUpdated', room.settings);
    
    // Clear game state
    emitGameStateUpdated(room, io, roomId);
  };

  // Developer feature: Update player cash
  const updatePlayerCash = ({ roomId, playerId, newCash }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) return;
    
    // Only allow host to modify cash
    if (room.hostId !== socket.id) {
      socket.emit('error', { message: 'Only host can modify player cash' });
      return;
    }
    
    // Validate newCash value
    if (typeof newCash !== 'number' || newCash < 0 || newCash > 100000) {
      socket.emit('error', { message: 'Invalid cash amount' });
      return;
    }
    
    // Update player money
    room.playerMoney[playerId] = newCash;
    
    // Log the change
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      pushGameLog(room, {
        type: 'debug',
        message: `${player.name}'s cash was set to $${newCash} by developer settings`
      }, io);
    }
    
    
    // Broadcast updated state
    emitGameStateUpdated(room, io, roomId);
  };

  // Developer feature: Set forced treasure card
  const setDevTreasureCard = ({ roomId, cardId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) return;
    
    // Only allow host to set dev cards
    if (room.hostId !== socket.id) {
      socket.emit('error', { message: 'Only host can set developer cards' });
      return;
    }
    
    // Set the forced treasure card (null for random)
    room.devTreasureCard = cardId;
    
    // Log the change
    if (cardId) {
      pushGameLog(room, {
        type: 'debug',
        message: `Next treasure card set to: ${cardId} by developer settings`
      }, io);
    } else {
      pushGameLog(room, {
        type: 'debug',
        message: `Treasure cards reset to random by developer settings`
      }, io);
    }
  };

  // Developer feature: Set forced surprise card
  const setDevSurpriseCard = ({ roomId, cardId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) return;
    
    // Only allow host to set dev cards
    if (room.hostId !== socket.id) {
      socket.emit('error', { message: 'Only host can set developer cards' });
      return;
    }
    
    // Set the forced surprise card (null for random)
    room.devSurpriseCard = cardId;
    
    // Log the change
    if (cardId) {
      pushGameLog(room, {
        type: 'debug',
        message: `Next surprise card set to: ${cardId} by developer settings`
      }, io);
    } else {
      pushGameLog(room, {
        type: 'debug',
        message: `Surprise cards reset to random by developer settings`
      }, io);
    }
  };

  const sendChatMessage = ({ roomId, message, playerName }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Verify the player is in the room
    const player = room.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'Player not in room' });
      return;
    }

    // Verify the player name matches
    if (player.name !== playerName) {
      socket.emit('error', { message: 'Player name mismatch' });
      return;
    }

    // Broadcast the message to all clients in the room
    const chatData = {
      message: message,
      playerName: playerName,
      timestamp: Date.now()
    };
    
    safeEmit(io, roomId, 'chatMessage', chatData);
  };

  const attemptReconnect = ({ roomId, playerName }) => {
    const room = roomService.handlePlayerReconnect(roomId, playerName, socket.id);
    
    if (room) {
      socket.join(roomId);
      socket.emit('reconnectSuccess', { room: SafeEmitter.deepClean(room), playerName });
      safeEmit(io, roomId, 'playerListUpdated', room.getPlayerList());
      emitGameStateUpdated(room, io, roomId);
      // Don't log reconnections to reduce game log spam
    } else {
      socket.emit('reconnectFailed', { message: 'Room not found, player not found, or reconnection window expired' });
    }
  };

  const getAllRooms = () => {
    const rooms = roomService.getAllRooms();
    socket.emit('allRooms', rooms);
  };

  // Bot management handlers
  const addBot = ({ roomId, difficulty = 'medium' }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) {
      socket.emit('addBotError', { message: 'Room not found' });
      return;
    }

    // Check if the player is the host
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) {
      socket.emit('addBotError', { message: 'Only the host can add bots' });
      return;
    }

    const result = roomService.addBotToRoom(roomId, difficulty);
    
    if (typeof result === 'string') {
      // Error occurred
      const errorMessages = {
        'bots_not_allowed': 'Bots are not enabled for this room',
        'room_full': 'Room is full',
        'game_started': 'Cannot add bots after game has started',
        'no_colors_available': 'No colors available for bots',
        'no_bot_names_available': 'No bot names available'
      };
      socket.emit('addBotError', { message: errorMessages[result] || 'Failed to add bot' });
      return;
    }

    // Success
    const bot = room.players[room.players.length - 1]; // Get the last added player (bot)
    safeEmit(io, roomId, 'playerListUpdated', room.getPlayerList());
    pushGameLog(room, { 
      type: 'join', 
      player: bot.name, 
      message: `(bot) has joined the room.` 
    }, io);
    socket.emit('botAdded', { bot: SafeEmitter.deepClean(bot) });
  };

  const removeBot = ({ roomId, botId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) {
      socket.emit('removeBotError', { message: 'Room not found' });
      return;
    }

    // Check if the player is the host
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) {
      socket.emit('removeBotError', { message: 'Only the host can remove bots' });
      return;
    }

    // Check if game has started
    if (room.gameState === 'in-progress') {
      socket.emit('removeBotError', { message: 'Cannot remove bots after game has started' });
      return;
    }

    const bot = room.players.find(p => p.id === botId && p.isBot);
    if (!bot) {
      socket.emit('removeBotError', { message: 'Bot not found' });
      return;
    }

    const result = roomService.removeBotFromRoom(roomId, botId);
    
    if (result) {
      safeEmit(io, roomId, 'playerListUpdated', room.getPlayerList());
      pushGameLog(room, { 
        type: 'disconnect', 
        player: bot.name, 
        message: `(bot) has left the room.` 
      }, io);
      socket.emit('botRemoved', { botId });
    } else {
      socket.emit('removeBotError', { message: 'Failed to remove bot' });
    }
  };

  socket.on('resetRoom', resetRoom);
  socket.on('updatePlayerCash', updatePlayerCash);
  socket.on('setDevTreasureCard', setDevTreasureCard);
  socket.on('setDevSurpriseCard', setDevSurpriseCard);
  socket.on('sendChatMessage', sendChatMessage);
  socket.on('attemptReconnect', attemptReconnect);
  socket.on('getAllRooms', getAllRooms);
  socket.on('addBot', addBot);
  socket.on('removeBot', removeBot);
};
