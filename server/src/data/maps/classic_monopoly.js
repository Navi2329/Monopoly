// server/src/data/maps/classic_monopoly.js
const MonopolyMap = {
  layout: {
    boardType: 'classic',
    gridSize: 11,
    totalSpaces: 40,
    corners: [
      { name: 'GO', position: 0, type: 'start', passingBonus: 200 },
      { name: 'Jail', position: 10, type: 'jail' },
      { name: 'Free Parking', position: 20, type: 'free-parking' },
      { name: 'Go to Jail', position: 30, type: 'go-to-jail' }
    ],
    rows: {
      top: 11,
      right: 9,
      bottom: 11,
      left: 9
    }
  },

  properties: {
    // Brown
    'Old Kent Road': { type: 'property', set: 'Brown', price: 60, rent: [2, 10, 30, 90, 160, 250], buildCost: 50, hotelCost: 50 },
    'Whitechapel Road': { type: 'property', set: 'Brown', price: 60, rent: [4, 20, 60, 180, 320, 450], buildCost: 50, hotelCost: 50 },

    // Station
    "King's Cross Station": { type: 'station', set: 'Station', price: 200, rent: [25, 50, 100, 200] },

    // Light Blue
    'The Angel, Islington': { type: 'property', set: 'Light Blue', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50, hotelCost: 50 },
    'Euston Road': { type: 'property', set: 'Light Blue', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50, hotelCost: 50 },
    'Pentonville Road': { type: 'property', set: 'Light Blue', price: 120, rent: [8, 40, 100, 300, 450, 600], buildCost: 50, hotelCost: 50 },

    // Pink
    'Pall Mall': { type: 'property', set: 'Pink', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100, hotelCost: 100 },
    'Whitehall': { type: 'property', set: 'Pink', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100, hotelCost: 100 },
    'Northumberland Avenue': { type: 'property', set: 'Pink', price: 160, rent: [12, 60, 180, 500, 700, 900], buildCost: 100, hotelCost: 100 },

    // Station
    'Marylebone Station': { type: 'station', set: 'Station', price: 200, rent: [25, 50, 100, 200] },

    // Orange
    'Bow Street': { type: 'property', set: 'Orange', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100, hotelCost: 100 },
    'Marlborough Street': { type: 'property', set: 'Orange', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100, hotelCost: 100 },
    'Vine Street': { type: 'property', set: 'Orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], buildCost: 100, hotelCost: 100 },

    // Red
    'Strand': { type: 'property', set: 'Red', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150, hotelCost: 150 },
    'Fleet Street': { type: 'property', set: 'Red', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150, hotelCost: 150 },
    'Trafalgar Square': { type: 'property', set: 'Red', price: 240, rent: [20, 100, 300, 750, 925, 1100], buildCost: 150, hotelCost: 150 },

    // Station
    'Fenchurch Street Station': { type: 'station', set: 'Station', price: 200, rent: [25, 50, 100, 200] },

    // Yellow
    'Leicester Square': { type: 'property', set: 'Yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150, hotelCost: 150 },
    'Coventry Street': { type: 'property', set: 'Yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150, hotelCost: 150 },
    'Piccadilly': { type: 'property', set: 'Yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], buildCost: 150, hotelCost: 150 },

    // Green
    'Regent Street': { type: 'property', set: 'Green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200, hotelCost: 200 },
    'Oxford Street': { type: 'property', set: 'Green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200, hotelCost: 200 },
    'Bond Street': { type: 'property', set: 'Green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], buildCost: 200, hotelCost: 200 },

    // Station
    'Liverpool Street Station': { type: 'station', set: 'Station', price: 200, rent: [25, 50, 100, 200] },

    // Dark Blue
    'Park Lane': { type: 'property', set: 'Dark Blue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], buildCost: 200, hotelCost: 200 },
    'Mayfair': { type: 'property', set: 'Dark Blue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], buildCost: 200, hotelCost: 200 },

    // Utilities
    'Electric Company': { type: 'company', set: 'Company', price: 150, rent: [4, 10] },
    'Water Works': { type: 'company', set: 'Company', price: 150, rent: [4, 10] },

    // Taxes
    'Income Tax': { type: 'tax', taxType: 'income', taxAmount: 0.1 },
    'Super Tax': { type: 'tax', taxType: 'luxury', taxAmount: 100 },

    // Chance & Community Chest
    'Chance': { type: 'chance' },
    'Community Chest': { type: 'community-chest' }
  }
};

module.exports = MonopolyMap;
