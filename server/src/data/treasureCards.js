// Treasure cards data
const treasureCards = [
  {
    id: 'treasure-1',
    message: 'Your phone died. Pay $50 for a repair.',
    action: 'payMoney',
    amount: 50
  },
  {
    id: 'treasure-2',
    message: 'Happy holidays! Receive $20',
    action: 'receiveMoney',
    amount: 20
  },
  {
    id: 'treasure-3',
    message: 'You host a party. Collect $50 from every player for equipment.',
    action: 'collectFromPlayers',
    amount: 50
  },
  {
    id: 'treasure-4',
    message: 'Tax refund. Collect $100.',
    action: 'receiveMoney',
    amount: 100
  },
  {
    id: 'treasure-5',
    message: 'Your car has ran out of gas. Pay $50.',
    action: 'payMoney',
    amount: 50
  },
  {
    id: 'treasure-6',
    message: 'You found a wallet containing some cash. Collect $200.',
    action: 'receiveMoney',
    amount: 200
  },
  {
    id: 'treasure-7',
    message: 'From trading stocks you earned $50.',
    action: 'receiveMoney',
    amount: 50
  },
  {
    id: 'treasure-8',
    message: 'You received $100 from your sibling.',
    action: 'receiveMoney',
    amount: 100
  },
  {
    id: 'treasure-9',
    message: 'Car rental insurance. Pay $60.',
    action: 'payMoney',
    amount: 60
  },
  {
    id: 'treasure-10',
    message: 'You have won third prize in a lottery. Collect $15.',
    action: 'receiveMoney',
    amount: 15
  },
  {
    id: 'treasure-11',
    message: 'From gift cards you get $100',
    action: 'receiveMoney',
    amount: 100
  },
  {
    id: 'treasure-12',
    message: 'You got a Pardon card from the treasures stack',
    action: 'receiveJailCard'
  },
  {
    id: 'treasure-13',
    message: 'Advance to Start',
    action: 'moveToPosition',
    position: 0,
    collectStart: true
  }
];

module.exports = treasureCards;
