// server/src/models/Bot.js
class Bot {
  constructor(id, name, difficulty = 'medium') {
    this.id = id;
    this.name = name;
    this.isHost = false;
    this.isBot = true;
    this.difficulty = difficulty; // 'easy', 'medium', 'hard'
    this.decisionDelay = this.getDecisionDelay(difficulty);
    this.personality = this.generatePersonality(difficulty);
  }

  getDecisionDelay(difficulty) {
    switch (difficulty) {
      case 'easy':
        return { min: 2000, max: 4000 }; // 2-4 seconds
      case 'medium':
        return { min: 1500, max: 3000 }; // 1.5-3 seconds
      case 'hard':
        return { min: 1000, max: 2000 }; // 1-2 seconds
      default:
        return { min: 1500, max: 3000 };
    }
  }

  generatePersonality(difficulty) {
    const personalities = {
      easy: {
        riskTolerance: 0.3, // Conservative
        propertyAcquisition: 0.4, // Somewhat interested in buying
        tradingWillingness: 0.3, // Not very eager to trade
        auctionAggression: 0.2, // Minimal bidding
        cashReserve: 0.6, // Keeps a lot of cash
      },
      medium: {
        riskTolerance: 0.5, // Balanced
        propertyAcquisition: 0.6, // Good property buying
        tradingWillingness: 0.5, // Willing to trade
        auctionAggression: 0.4, // Moderate bidding
        cashReserve: 0.4, // Balanced cash management
      },
      hard: {
        riskTolerance: 0.7, // Aggressive
        propertyAcquisition: 0.8, // Very interested in properties
        tradingWillingness: 0.7, // Eager to trade
        auctionAggression: 0.6, // Competitive bidding
        cashReserve: 0.2, // Keeps minimal cash
      }
    };

    return personalities[difficulty] || personalities.medium;
  }

  // Decision making methods
  shouldBuyProperty(property, currentMoney, propertyData) {
    const { riskTolerance, propertyAcquisition, cashReserve } = this.personality;
    const propertyPrice = property.price || 0;
    const reserveCash = currentMoney * cashReserve;
    
    // Can't afford or would leave too little cash
    if (propertyPrice > currentMoney - reserveCash) {
      return false;
    }

    // Calculate property value based on potential rent and position
    const baseDecision = Math.random() < propertyAcquisition;
    const riskFactor = (currentMoney - propertyPrice) / currentMoney;
    const shouldTakeRisk = riskFactor > (1 - riskTolerance);

    return baseDecision && shouldTakeRisk;
  }

  shouldAcceptTrade(trade, currentProperties, currentMoney) {
    const { tradingWillingness, riskTolerance } = this.personality;
    
    // Simple heuristic: accept if getting more valuable properties
    const givingValue = trade.givingProperties.reduce((sum, prop) => sum + (prop.price || 0), trade.givingMoney || 0);
    const receivingValue = trade.receivingProperties.reduce((sum, prop) => sum + (prop.price || 0), trade.receivingMoney || 0);
    
    const valueRatio = receivingValue / Math.max(givingValue, 1);
    const baseWillingness = Math.random() < tradingWillingness;
    const goodDeal = valueRatio > (2 - riskTolerance); // Adjust threshold based on risk tolerance
    
    return baseWillingness && goodDeal;
  }

  getAuctionBid(property, currentBid, currentMoney, propertyData) {
    const { auctionAggression, cashReserve } = this.personality;
    const maxAffordable = currentMoney * (1 - cashReserve);
    const propertyValue = property.price || 0;
    
    // Won't bid more than property value adjusted by aggression
    const maxWillingToBid = Math.min(
      propertyValue * (1 + auctionAggression),
      maxAffordable
    );
    
    if (currentBid >= maxWillingToBid) {
      return null; // Won't bid
    }

    // Bid increment based on aggression
    const increment = Math.max(50, propertyValue * 0.1 * auctionAggression);
    return Math.min(currentBid + increment, maxWillingToBid);
  }

  shouldPayToLeaveJail(currentMoney, jailRounds) {
    const { riskTolerance, cashReserve } = this.personality;
    const reserveCash = currentMoney * cashReserve;
    
    // More likely to pay if been in jail longer and has enough money
    const urgency = jailRounds / 3; // Max 3 rounds in jail
    const canAfford = currentMoney - 50 > reserveCash;
    const shouldPay = Math.random() < (riskTolerance * urgency);
    
    return canAfford && shouldPay;
  }
}

module.exports = Bot;
