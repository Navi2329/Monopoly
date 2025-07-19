// server/src/socket/roomHandlers.js
const roomService = require('../services/roomService');

// Helper to push to room log and emit to all clients
function pushGameLog(room, logEntry, io) {
  room.addGameLog(logEntry);
  io.to(room.id).emit('gameLogUpdated', logEntry);
}

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
      io.to(roomId).emit('gameStateUpdated', {
        playerPositions: room.playerPositions || {},
        lastDiceRoll: room.lastDiceRoll || null,
        playerStatuses: room.playerStatuses || {},
        turnIndex: room.turnIndex || 0,
        roundNumber: room.roundNumber || 1,
        specialAction: null,
        playerMoney: room.playerMoney || {},
        currentTurnSocketId: room.players[room.turnIndex]?.id || null,
        propertyOwnership: room.propertyOwnership || {},
        playerJailCards: room.playerJailCards || {},
        playerJailRounds: room.playerJailRounds || {},
        vacationCash: room.vacationCash || 0,
        roomId: roomId
      });

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

  const startGame = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (room && room.hostId === socket.id) {
      roomService.startGame(roomId);
      room.turnIndex = 0;
      room.gameState = 'in-progress';

      // Ensure all players start at position 0 (START space)
      room.players.forEach(player => {
        room.playerPositions[player.id] = 0;
        room.playerStatuses[player.id] = null;
        room.playerJailCards[player.id] = 0;
        room.playerJailRounds[player.id] = 0;
        room.playerDoublesCount[player.id] = 0;
      });

      io.to(roomId).emit('gameStarted');
      // Emit initial game state for turn sync
      const timestamp = new Date().toISOString();
      console.log(`[SERVER] ${timestamp} - startGame emit gameStateUpdated:`, { propertyOwnership: room.propertyOwnership || {} });
      io.to(roomId).emit('gameStateUpdated', {
        playerPositions: room.playerPositions || {},
        lastDiceRoll: room.lastDiceRoll || null,
        playerStatuses: room.playerStatuses || {},
        turnIndex: room.turnIndex,
        roundNumber: room.roundNumber || 1,
        specialAction: null,
        playerMoney: room.playerMoney || {},
        currentTurnSocketId: room.players[room.turnIndex]?.id || null,
        propertyOwnership: room.propertyOwnership || {},
        playerJailCards: room.playerJailCards || {},
        playerJailRounds: room.playerJailRounds || {},
        vacationCash: room.vacationCash || 0,
        roomId: roomId
      });
      pushGameLog(room, { type: 'info', message: 'Game started.' }, io);
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
  const rollDice = ({ roomId, devDice1, devDice2 }) => {
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
          message: `passed START and collected $300`
        }, io);
      }

      // Broadcast updated state
      const timestamp = new Date().toISOString();
      console.log(`[SERVER] ${timestamp} - rollDice emit gameStateUpdated:`, { propertyOwnership: room.propertyOwnership });
      io.to(roomId).emit('gameStateUpdated', {
        playerPositions: room.playerPositions,
        lastDiceRoll: room.lastDiceRoll,
        playerStatuses: room.playerStatuses,
        turnIndex: room.turnIndex,
        roundNumber: room.roundNumber,
        specialAction: result.action,
        playerMoney: room.playerMoney,
        currentTurnSocketId: room.players[room.turnIndex]?.id || null,
        propertyOwnership: room.propertyOwnership,
        playerJailCards: room.playerJailCards,
        playerJailRounds: room.playerJailRounds,
        vacationCash: room.vacationCash,
        roomId: roomId
      });
    }, 800); // Wait for dice animation to complete before moving player
  };

  const endTurn = ({ roomId }) => {
    const room = roomService.getRoomById(roomId);
    if (!room || room.gameState !== 'in-progress') return;

    const currentPlayer = room.players[room.turnIndex];
    if (!currentPlayer || socket.id !== currentPlayer.id) return;

    // Check if player rolled doubles
    const lastRoll = room.lastDiceRoll;
    const isDoubles = lastRoll && lastRoll.dice1 === lastRoll.dice2;
    const doublesCount = room.playerDoublesCount[socket.id] || 0;

    if (isDoubles && doublesCount < 3) {
      // Player rolled doubles but not 3 in a row - they get another roll
      // Don't advance turn, just reset the dice roll so they can roll again
      room.lastDiceRoll = null;

      pushGameLog(room, {
        type: 'info',
        player: currentPlayer.name,
        message: `ended turn after rolling doubles - gets another roll`
      }, io);
    } else {
      // Normal turn end or 3rd double - advance to next player
      room.playerDoublesCount[socket.id] = 0;
      room.advanceTurn();
      // Reset dice roll for the new player's turn
      room.lastDiceRoll = null;

      pushGameLog(room, {
        type: 'info',
        player: currentPlayer.name,
        message: `ended turn`
      }, io);
    }

    // Broadcast updated state
    io.to(roomId).emit('gameStateUpdated', {
      playerPositions: room.playerPositions,
      lastDiceRoll: room.lastDiceRoll,
      playerStatuses: room.playerStatuses,
      turnIndex: room.turnIndex,
      roundNumber: room.roundNumber,
      specialAction: null,
      playerMoney: room.playerMoney,
      currentTurnSocketId: room.players[room.turnIndex]?.id || null,
      propertyOwnership: room.propertyOwnership,
      playerJailCards: room.playerJailCards,
      playerJailRounds: room.playerJailRounds,
      vacationCash: room.vacationCash,
      roomId: roomId
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

    const property = room.propertyOwnership[propertyName];

    if (!property) {
      // Property is available for purchase
      if (room.playerMoney[socket.id] >= propertyData.price) {
        // Player can afford it - send purchase option
        socket.emit('propertyLanding', {
          propertyName,
          price: propertyData.price,
          canAfford: true,
          action: 'purchase'
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
    } else if (property.owner !== socket.id) {
      // Property is owned by another player - pay rent
      const rent = room.calculateRent(propertyName);
      if (rent > 0) {
        const actualRent = Math.min(rent, room.playerMoney[socket.id]);
        room.playerMoney[socket.id] -= actualRent;
        room.playerMoney[property.owner] += actualRent;

        pushGameLog(room, {
          type: 'rent',
          player: currentPlayer.name,
          owner: property.ownerName,
          property: propertyName,
          amount: actualRent,
          message: `paid $${actualRent} rent to ${property.ownerName} for ${propertyName}`
        }, io);

        // Check if player went bankrupt
        if (room.playerMoney[socket.id] <= 0) {
          pushGameLog(room, {
            type: 'bankruptcy',
            player: currentPlayer.name,
            message: `went bankrupt!`
          }, io);
        }

        // Broadcast updated state
        io.to(roomId).emit('gameStateUpdated', {
          playerPositions: room.playerPositions,
          lastDiceRoll: room.lastDiceRoll,
          playerStatuses: room.playerStatuses,
          turnIndex: room.turnIndex,
          roundNumber: room.roundNumber,
          specialAction: null,
          playerMoney: room.playerMoney,
          currentTurnSocketId: room.players[room.turnIndex]?.id || null,
          propertyOwnership: room.propertyOwnership,
          playerJailCards: room.playerJailCards,
          playerJailRounds: room.playerJailRounds,
          vacationCash: room.vacationCash,
          roomId: roomId
        });
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
  const buyProperty = async ({ roomId, propertyName, price }) => {
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

      // Broadcast updated state
      try {
        const gameState = room.getGameState();
        gameState.roomId = roomId; // Add roomId to the game state
        gameState.debug = 'SERVER-UNIQUE-123';
        io.to(roomId).emit('gameStateUpdated', gameState);
      } catch (err) {
      }
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

    // Broadcast updated state
    io.to(roomId).emit('gameStateUpdated', {
      playerPositions: room.playerPositions,
      lastDiceRoll: room.lastDiceRoll,
      playerStatuses: room.playerStatuses,
      turnIndex: room.turnIndex,
      roundNumber: room.roundNumber,
      specialAction: null,
      playerMoney: room.playerMoney,
      currentTurnSocketId: room.players[room.turnIndex]?.id || null,
      propertyOwnership: room.propertyOwnership,
      playerJailCards: room.playerJailCards,
      playerJailRounds: room.playerJailRounds,
      vacationCash: room.vacationCash,
      roomId: roomId
    });
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

    // Broadcast updated state
    io.to(roomId).emit('gameStateUpdated', {
      playerPositions: room.playerPositions,
      lastDiceRoll: room.lastDiceRoll,
      playerStatuses: room.playerStatuses,
      turnIndex: room.turnIndex,
      roundNumber: room.roundNumber,
      specialAction: null,
      playerMoney: room.playerMoney,
      currentTurnSocketId: room.players[room.turnIndex]?.id || null,
      propertyOwnership: room.propertyOwnership,
      playerJailCards: room.playerJailCards,
      playerJailRounds: room.playerJailRounds,
      vacationCash: room.vacationCash,
      roomId: roomId
    });
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
  socket.on('endTurn', endTurn);
  socket.on('handlePropertyLanding', handlePropertyLanding);
  socket.on('skipProperty', skipProperty);
  socket.on('auctionProperty', auctionProperty);
  socket.on('disconnect', handleDisconnect);
  socket.on('requestGameLog', handleRequestGameLog);
  socket.on('requestPlayerList', handleRequestPlayerList);
  socket.on('requestRoomSettings', handleRequestRoomSettings);
  socket.on('whatRooms', () => {
  });
  socket.on('gameLogUpdated', (logEntry) => {
  });
  socket.on('gameStateUpdated', (gameState) => {
    // ... rest of your state update logic
  });
};
