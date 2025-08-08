// server/src/data/maps/india.js
const indiaMap = {
  layout: {
    boardType: 'classic',
    gridSize: 11,
    totalSpaces: 40,
    corners: [
      { name: 'Vacation', position: 20, type: 'vacation' },
      { name: 'Jail', position: 30, type: 'jail' }
    ],
    rows: {
      top: 11,
      right: 9,
      bottom: 11,
      left: 9
    }
  },

  properties: {
    // Brown set
    'Bhubaneshwar': { type: 'property', set: 'Brown', price: 60, rent: [2, 10, 30, 90, 160, 250], buildCost: 50, hotelCost: 50 },
    'Guwahati': { type: 'property', set: 'Brown', price: 60, rent: [4, 20, 60, 180, 320, 450], buildCost: 50, hotelCost: 50 },

    // Tax
    'Income Tax': { type: 'tax', taxType: 'income', taxAmount: 0.1 },

    // Airports (Stations)
    'Chatrapthi Sivaji Terminal': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },

    // Light Blue set
    'Visakhapatnam': { type: 'property', set: 'Light Blue', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50, hotelCost: 50 },
    'Vadodara': { type: 'property', set: 'Light Blue', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50, hotelCost: 50 },
    'Ranchi': { type: 'property', set: 'Light Blue', price: 120, rent: [8, 40, 100, 300, 450, 600], buildCost: 50, hotelCost: 50 },

    // Pink set
    'Nagpur': { type: 'property', set: 'Pink', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100, hotelCost: 100 },
    'Surat': { type: 'property', set: 'Pink', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100, hotelCost: 100 },
    'Bhopal': { type: 'property', set: 'Pink', price: 160, rent: [12, 60, 180, 500, 700, 900], buildCost: 100, hotelCost: 100 },

    // Airport
    'New Delhi Railway Station': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },

    // Orange set
    'Kochi': { type: 'property', set: 'Orange', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100, hotelCost: 100 },
    'Indore': { type: 'property', set: 'Orange', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100, hotelCost: 100 },
    'Patna': { type: 'property', set: 'Orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], buildCost: 100, hotelCost: 100 },

    // Red set
    'Chandigarh': { type: 'property', set: 'Red', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150, hotelCost: 150 },
    'Goa': { type: 'property', set: 'Red', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150, hotelCost: 150 },
    'Lucknow': { type: 'property', set: 'Red', price: 240, rent: [20, 100, 300, 750, 925, 1100], buildCost: 150, hotelCost: 150 },

    // Airport
    'Chennai Central': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },

    // Yellow set
    'Pune': { type: 'property', set: 'Yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150, hotelCost: 150 },
    'Ahmedabad': { type: 'property', set: 'Yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150, hotelCost: 150 },
    'Jaipur': { type: 'property', set: 'Yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], buildCost: 150, hotelCost: 150 },

    // Green set
    'Bangalore': { type: 'property', set: 'Green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200, hotelCost: 200 },
    'Chennai': { type: 'property', set: 'Green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200, hotelCost: 200 },
    'Hyderabad': { type: 'property', set: 'Green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], buildCost: 200, hotelCost: 200 },

    // Airport
    'Howrah Junction': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },

    // Dark Blue set
    'Delhi': { type: 'property', set: 'Dark Blue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], buildCost: 200, hotelCost: 200 },
    'Mumbai': { type: 'property', set: 'Dark Blue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], buildCost: 200, hotelCost: 200 },

    // Tax
    'Luxury Tax': { type: 'tax', taxType: 'luxury', taxAmount: 75 },

    // Companies
    'Electric Company': { type: 'company', set: 'Company', price: 150, rent: [4, 10] },
    'Water Company': { type: 'company', set: 'Company', price: 150, rent: [4, 10] }
  }
};

module.exports = indiaMap;
