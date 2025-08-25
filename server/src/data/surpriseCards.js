// Surprise cards data
const surpriseCards = [
  {
    id: 'surprise-1',
    message: 'You got a Pardon card from the surprises stack',
    action: 'receiveJailCard'
  },
  {
    id: 'surprise-2',
    message: 'Monsoon repairs needed for your properties. Pay $25 for each house and $100 for each hotel.',
    action: 'payForBuildings',
    houseCost: 25,
    hotelCost: 100
  },
  {
    id: 'surprise-3',
    message: 'You lost a bet. Pay each player $50.',
    action: 'payToPlayers',
    amount: 50
  },
  {
    id: 'surprise-4',
    message: 'Pay tax of $20.',
    action: 'payMoney',
    amount: 20
  },
  {
    id: 'surprise-5',
    message: 'Have an adventure to Chennai.',
    action: 'moveToProperty',
    propertyName: 'Chennai'
  },
  {
    id: 'surprise-6',
    message: 'Advance to Hyderabad.',
    action: 'moveToProperty',
    propertyName: 'Hyderabad'
  },
  {
    id: 'surprise-7',
    message: 'Advance to Bangalore.',
    action: 'moveToProperty',
    propertyName: 'Bangalore'
  },
  {
    id: 'surprise-8',
    message: 'Advance to Start.',
    action: 'moveToPosition',
    position: 0,
    collectStart: true
  },
  {
    id: 'surprise-9',
    message: 'Go to prison',
    action: 'goToJail'
  },
  {
    id: 'surprise-10',
    message: 'From a government scholarship you get $100.',
    action: 'receiveMoney',
    amount: 100
  },
  {
    id: 'surprise-11',
    message: 'Go back 3 steps',
    action: 'moveBackward',
    steps: 3
  },
  {
    id: 'surprise-12',
    message: 'You have a new investment. Receive $150.',
    action: 'receiveMoney',
    amount: 150
  }
];

module.exports = surpriseCards;
