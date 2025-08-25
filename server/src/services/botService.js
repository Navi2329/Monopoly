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

      // Roll dice
      const diceResult = room.rollDice(botId);
      if (diceResult) {
        io.to(room.id).emit('diceRolled', {
          playerId: botId,
          dice1: diceResult.dice1,
          dice2: diceResult.dice2,
          total: diceResult.total
        });

        // Small delay to simulate dice rolling
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle property landing decisions
        const currentPosition = room.playerPositions[botId];
        const currentProperty = room.propertyData[currentPosition];
        
        if (currentProperty && currentProperty.price && !room.propertyOwnership[currentProperty.name]) {
          // Decide whether to buy property
          const botMoney = room.playerMoney[botId] || 0;
          const shouldBuy = bot.shouldBuyProperty(currentProperty, botMoney, room.propertyData);
          
          if (shouldBuy && botMoney >= currentProperty.price) {
            const buyResult = room.buyProperty(botId, currentProperty.name);
            if (buyResult) {
              io.to(room.id).emit('gameStateUpdated', room.getGameState());
              io.to(room.id).emit('gameLogUpdated', {
                type: 'property',
                player: bot.name,
                message: `bought ${currentProperty.name} for $${currentProperty.price}.`
              });
            }
          }
        }

        // Check if bot can continue rolling (doubles)
        const canRollAgain = room.allowRollAgain && room.getCurrentPlayer()?.id === botId;
        if (canRollAgain) {
          // Bot will roll again after a short delay
          setTimeout(() => {
            this.playBotTurn(room, botId, io);
          }, 2000);
        } else {
          // End bot's turn
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
          }, 1500);
        }
      }
    } catch (error) {
      console.error(`Error during bot turn for ${bot.name}:`, error);
    }
  }
}

module.exports = new BotService();
