// server/src/services/botService.js
const Bot = require('../models/Bot');
const { v4: uuidv4 } = require('uuid');

class BotService {
  constructor() {
    this.activeBots = new Map(); // roomId -> Array of bot instances
    this.botNames = [
      'RoboTycoon', 'PropertyBot', 'CashMaster', 'DiceRoller', 'TradingBot',
      'MonopolyAI', 'PropertyHunter', 'StreetSmart', 'RentCollector', 'BoardBoss',
      'CapitalBot', 'EstateExpert', 'DealMaker', 'PropertyPro', 'WealthBot'
    ];
  }

  createBot(roomId, difficulty = 'medium') {
    if (!this.activeBots.has(roomId)) {
      this.activeBots.set(roomId, []);
    }

    const existingBots = this.activeBots.get(roomId);
    const usedNames = existingBots.map(bot => bot.name);
    const availableNames = this.botNames.filter(name => !usedNames.includes(name));
    
    if (availableNames.length === 0) {
      return null; // No available names
    }

    const botName = availableNames[Math.floor(Math.random() * availableNames.length)];
    const botId = `bot-${uuidv4()}`;
    const bot = new Bot(botId, botName, difficulty);
    
    existingBots.push(bot);
    return bot;
  }

  removeBot(roomId, botId) {
    if (!this.activeBots.has(roomId)) {
      return false;
    }

    const bots = this.activeBots.get(roomId);
    const index = bots.findIndex(bot => bot.id === botId);
    
    if (index !== -1) {
      bots.splice(index, 1);
      return true;
    }

    return false;
  }

  getBot(roomId, botId) {
    if (!this.activeBots.has(roomId)) {
      return null;
    }

    return this.activeBots.get(roomId).find(bot => bot.id === botId) || null;
  }

  getBots(roomId) {
    return this.activeBots.get(roomId) || [];
  }

  removeAllBots(roomId) {
    this.activeBots.delete(roomId);
  }

  // Bot decision making with delay simulation
  async makeBotDecision(roomId, botId, decisionType, decisionData) {
    const bot = this.getBot(roomId, botId);
    if (!bot) {
      return null;
    }

    // Simulate thinking time
    const delay = Math.random() * (bot.decisionDelay.max - bot.decisionDelay.min) + bot.decisionDelay.min;
    await new Promise(resolve => setTimeout(resolve, delay));

    switch (decisionType) {
      case 'buyProperty':
        return bot.shouldBuyProperty(
          decisionData.property,
          decisionData.currentMoney,
          decisionData.propertyData
        );

      case 'acceptTrade':
        return bot.shouldAcceptTrade(
          decisionData.trade,
          decisionData.currentProperties,
          decisionData.currentMoney
        );

      case 'auctionBid':
        return bot.getAuctionBid(
          decisionData.property,
          decisionData.currentBid,
          decisionData.currentMoney,
          decisionData.propertyData
        );

      case 'payJailFee':
        return bot.shouldPayToLeaveJail(
          decisionData.currentMoney,
          decisionData.jailRounds
        );

      default:
        return null;
    }
  }

  // Auto-play bot turn
  async playBotTurn(room, botId, io) {
    const bot = this.getBot(room.id, botId);
    if (!bot) {
      return;
    }

    // Simulate thinking delay
    const delay = Math.random() * (bot.decisionDelay.max - bot.decisionDelay.min) + bot.decisionDelay.min;
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // Check if bot is in jail
      const botStatus = room.playerStatuses[botId];
      if (botStatus === 'jail') {
        const jailRounds = room.playerJailRounds[botId] || 0;
        const botMoney = room.playerMoney[botId] || 0;
        
        if (jailRounds >= 2 || bot.shouldPayToLeaveJail(botMoney, jailRounds)) {
          // Try to pay to get out of jail
          if (botMoney >= 50) {
            const result = room.payJailFee(botId);
            if (result) {
              io.to(room.id).emit('gameStateUpdated', room.getGameState());
              io.to(room.id).emit('gameLogUpdated', {
                type: 'jail',
                player: bot.name,
                message: `paid $50 to get out of jail.`
              });
            }
          }
        }
      }

      // Emit dice animation start (matching human behavior)
      io.to(room.id).emit('diceRollingStarted', {});

      // Wait for dice animation duration (matching human behavior)
      await new Promise(resolve => setTimeout(resolve, 800));

      // Roll dice
      const diceResult = room.rollDice(botId);
      if (diceResult) {
        // Log the dice roll (matching human behavior)
        io.to(room.id).emit('gameLogUpdated', {
          type: 'info',
          player: bot.name,
          message: `rolled ${diceResult.dice1} + ${diceResult.dice2} = ${diceResult.total}`
        });

        // Handle special actions (matching human rollDice logic)
        if (diceResult.action === 'jail') {
          io.to(room.id).emit('gameLogUpdated', {
            type: 'special',
            player: bot.name,
            message: `went to jail for rolling 3 doubles`
          });
          room.playerDoublesCount[botId] = 0;
          room.pendingSpecialAction = { 
            type: diceResult.action, 
            playerId: botId, 
            dice: { dice1: diceResult.dice1, dice2: diceResult.dice2, total: diceResult.total } 
          };
          io.to(room.id).emit('gameStateUpdated', room.getGameState());
          return;
        } else if (diceResult.action === 'vacation') {
          io.to(room.id).emit('gameLogUpdated', {
            type: 'special',
            player: bot.name,
            message: `went on vacation`
          });
          
          if (room.vacationCash > 0) {
            io.to(room.id).emit('gameLogUpdated', {
              type: 'info',
              player: bot.name,
              message: `collected $${room.vacationCash} from vacation cash!`
            });
          }
          
          room.playerDoublesCount[botId] = 0;
          room.pendingSpecialAction = { 
            type: diceResult.action, 
            playerId: botId, 
            dice: { dice1: diceResult.dice1, dice2: diceResult.dice2, total: diceResult.total } 
          };
          io.to(room.id).emit('gameStateUpdated', room.getGameState());
          return;
        } else if (diceResult.action === 'start') {
          io.to(room.id).emit('gameLogUpdated', {
            type: 'special',
            player: bot.name,
            message: `moved to START and collected $300`
          });
        }

        // Handle property landing decisions
        const currentPosition = room.playerPositions[botId];
        const currentProperty = room.propertyData[currentPosition];
        
        if (currentProperty && currentProperty.price && !room.propertyOwnership[currentProperty.name]) {
          // Decide whether to buy property
          const botMoney = room.playerMoney[botId] || 0;
          const shouldBuy = bot.shouldBuyProperty(currentProperty, botMoney, room.propertyData);
          
          if (shouldBuy && botMoney >= currentProperty.price) {
            const buyResult = room.buyProperty(botId, currentProperty.name, currentProperty.price);
            if (buyResult) {
              io.to(room.id).emit('gameStateUpdated', room.getGameState());
              io.to(room.id).emit('gameLogUpdated', {
                type: 'property',
                player: bot.name,
                message: `bought ${currentProperty.name} for $${currentProperty.price}.`
              });
            }
          } else {
            // Bot declined to buy property
            io.to(room.id).emit('gameLogUpdated', {
              type: 'property',
              player: bot.name,
              message: `declined to buy ${currentProperty.name}.`
            });
            
            // Start auction if settings allow
            if (room.settings.allowAuction) {
              // Give a small delay before starting auction
              setTimeout(() => {
                this.startPropertyAuction(room, currentProperty.name, io);
              }, 1000);
            }
          }
        }

        // Set turn state to show End Turn (matching human behavior)
        room.turnState = 'awaiting-end-turn';
        io.to(room.id).emit('gameStateUpdated', room.getGameState());

        // Check if bot can continue rolling (doubles)
        const canRollAgain = room.allowRollAgain && room.getCurrentPlayer()?.id === botId;
        if (canRollAgain) {
          // Bot will roll again after a short delay
          setTimeout(() => {
            this.playBotTurn(room, botId, io);
          }, 2000);
        } else {
          // End bot's turn after a delay
          setTimeout(() => {
            const turnResult = room.advanceTurn('bot-action');
            io.to(room.id).emit('gameLogUpdated', {
              type: 'info',
              player: bot.name,
              message: `ended turn`
            });
            
            if (turnResult) {
              // Emit turn advance logs if any
              if (turnResult.orderedEvents) {
                turnResult.orderedEvents.forEach(event => {
                  if (event.type === 'round-start') {
                    io.to(room.id).emit('gameLogUpdated', {
                      type: 'system',
                      message: event.message
                    });
                  }
                });
              }
            }
            
            // Set turn state for next player
            const nextPlayer = room.getCurrentPlayer();
            if (nextPlayer) {
              const nextPlayerStatus = room.playerStatuses[nextPlayer.id];
              if (nextPlayerStatus && typeof nextPlayerStatus === 'object' && nextPlayerStatus.status === 'vacation') {
                room.turnState = 'awaiting-vacation-skip';
              } else {
                room.turnState = 'awaiting-roll';
              }
            }
            
            io.to(room.id).emit('gameStateUpdated', room.getGameState());
          }, 2000);
        }
      }
    } catch (error) {
      console.error(`Error during bot turn for ${bot.name}:`, error);
    }
  }

  // Helper method to start property auction
  startPropertyAuction(room, propertyName, io) {
    // This is simplified - the actual auction logic should be in roomHandlers
    // For now, just emit that auction should start
    io.to(room.id).emit('startAuction', { propertyName });
  }

  // Bot auction participation
  async handleBotAuction(room, botId, io) {
    const bot = this.getBot(room.id, botId);
    if (!bot || !room.auction || !room.auction.active || room.auction.ended) {
      return;
    }

    // Check if bot is still in the auction
    if (room.auction.passedPlayers.includes(botId)) {
      return;
    }

    // Simulate thinking time for auction decision
    const delay = Math.random() * (bot.decisionDelay.max - bot.decisionDelay.min) + bot.decisionDelay.min;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Get bot's bid decision
    const botMoney = room.playerMoney[botId] || 0;
    const bidAmount = bot.getAuctionBid(
      room.auction.property,
      room.auction.currentBid,
      botMoney,
      room.propertyData
    );

    if (bidAmount && bidAmount > room.auction.currentBid && botMoney >= bidAmount) {
      // Bot places a bid
      const incrementAmount = bidAmount - room.auction.currentBid;
      
      // Add bid to history
      room.auction.bidHistory.push({
        playerId: botId,
        name: bot.name,
        color: room.players.find(p => p.id === botId)?.color || '#000000',
        amount: bidAmount,
        note: `+$${incrementAmount}`
      });

      room.auction.currentBid = bidAmount;
      room.auction.passedPlayers = []; // Reset passes when someone bids
      room.auction.timer = 5; // Reset timer to 5 seconds
      room.auction.timerColor = room.players.find(p => p.id === botId)?.color || '#000000';
      room.auction.lastBidTime = Date.now();
      room.auction.lastBidderId = botId;

      io.to(room.id).emit('auctionUpdate', room.auction);
      io.to(room.id).emit('gameLogUpdated', {
        type: 'auction',
        player: bot.name,
        message: `bid $${bidAmount} for ${room.auction.property.name}`
      });
    } else {
      // Bot passes
      if (!room.auction.passedPlayers.includes(botId)) {
        room.auction.passedPlayers.push(botId);
      }

      // Check if all but one have passed
      const activeBidders = room.auction.participants.filter(p => !room.auction.passedPlayers.includes(p.id));
      if (activeBidders.length <= 1) {
        this.endAuction(room, io);
        return;
      }

      io.to(room.id).emit('auctionUpdate', room.auction);
      io.to(room.id).emit('gameLogUpdated', {
        type: 'auction',
        player: bot.name,
        message: `passed on ${room.auction.property.name}`
      });
    }
  }

  // Helper function to end auction (copied from roomHandlers)
  endAuction(room, io) {
    if (!room.auction || room.auction.ended) return;
    
    clearInterval(room.auctionTimer);
    room.auction.ended = true;
    room.auction.active = false;
    room.auction.timer = 0;
    
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
      
      io.to(room.id).emit('gameLogUpdated', {
        type: 'auction',
        player: winner.name,
        message: `won auction for ${room.auction.property.name} with $${room.auction.currentBid}`
      });
    } else {
      io.to(room.id).emit('gameLogUpdated', {
        type: 'auction',
        message: `No bids for ${room.auction.property.name} - auction ended`
      });
    }
    
    io.to(room.id).emit('auctionEnded', room.auction);
    io.to(room.id).emit('gameStateUpdated', room.getGameState());
    
    // Clean up auction
    room.auction = null;
    room.auctionTimer = null;
  }

  // Bot trade response
  async handleBotTradeOffer(room, botId, tradeOffer, io) {
    const bot = this.getBot(room.id, botId);
    if (!bot) {
      return false;
    }

    // Simulate thinking time for trade decision
    const delay = Math.random() * (bot.decisionDelay.max - bot.decisionDelay.min) + bot.decisionDelay.min;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Get bot's trade decision
    const botMoney = room.playerMoney[botId] || 0;
    const botProperties = Object.keys(room.propertyOwnership).filter(
      prop => room.propertyOwnership[prop].owner === botId
    );

    const shouldAccept = bot.shouldAcceptTrade(tradeOffer, botProperties, botMoney);

    io.to(room.id).emit('gameLogUpdated', {
      type: 'trade',
      player: bot.name,
      message: shouldAccept ? `accepted trade offer` : `declined trade offer`
    });

    return shouldAccept;
  }
}

module.exports = new BotService();
