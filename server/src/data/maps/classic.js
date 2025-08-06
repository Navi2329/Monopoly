// server/src/data/maps/classic.js
const classicMap = {
  layout: {
    boardType: 'classic',
    gridSize: 11,
    totalSpaces: 40,
    corners: [
      { name: 'Vacation', position: 20, type: 'vacation' },
      { name: 'Jail', position: 30, type: 'jail' }
    ],
    rows: {
      top: 11,      // Start + top row
      right: 9,     // Right column (excluding corners)
      bottom: 11,   // Vacation + bottom row + Jail  
      left: 9       // Left column (excluding corners)
    }
  },
  
  properties: {
    // Brazil set
    'Salvador': { type: 'property', set: 'Brazil', price: 60, rent: [2, 10, 10, 90, 160, 250], buildCost: 50, hotelCost: 50 },
    'Rio': { type: 'property', set: 'Brazil', price: 60, rent: [4, 20, 60, 180, 320, 450], buildCost: 50, hotelCost: 50 },
    
    // Tax
    'Income Tax': { type: 'tax', taxType: 'income', taxAmount: 0.1 },
    
    // Airport
    'TLV Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
    
    // Israel set
    'Tel Aviv': { type: 'property', set: 'Israel', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50, hotelCost: 50 },
    'Haifa': { type: 'property', set: 'Israel', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50, hotelCost: 50 },
    'Jerusalem': { type: 'property', set: 'Israel', price: 120, rent: [8, 40, 100, 300, 450, 600], buildCost: 50, hotelCost: 50 },
    
    // Italy set
    'Venice': { type: 'property', set: 'Italy', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100, hotelCost: 100 },
    'Milan': { type: 'property', set: 'Italy', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100, hotelCost: 100 },
    'Rome': { type: 'property', set: 'Italy', price: 160, rent: [12, 60, 180, 500, 700, 900], buildCost: 100, hotelCost: 100 },
    
    // Airport
    'MUC Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
    
    // Germany set
    'Frankfurt': { type: 'property', set: 'Germany', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100, hotelCost: 100 },
    'Munich': { type: 'property', set: 'Germany', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100, hotelCost: 100 },
    'Berlin': { type: 'property', set: 'Germany', price: 200, rent: [16, 80, 220, 600, 800, 1000], buildCost: 100, hotelCost: 100 },
    
    // China set
    'Shenzhen': { type: 'property', set: 'China', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150, hotelCost: 150 },
    'Beijing': { type: 'property', set: 'China', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150, hotelCost: 150 },
    'Shanghai': { type: 'property', set: 'China', price: 240, rent: [20, 100, 300, 750, 925, 1100], buildCost: 150, hotelCost: 150 },
    
    // Airport
    'CDG Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
    
    // France set
    'Lyon': { type: 'property', set: 'France', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150, hotelCost: 150 },
    'Toulouse': { type: 'property', set: 'France', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150, hotelCost: 150 },
    'Paris': { type: 'property', set: 'France', price: 280, rent: [24, 120, 360, 850, 1025, 1200], buildCost: 150, hotelCost: 150 },
    
    // UK set  
    'Liverpool': { type: 'property', set: 'UK', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200, hotelCost: 200 },
    'Manchester': { type: 'property', set: 'UK', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200, hotelCost: 200 },
    'London': { type: 'property', set: 'UK', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], buildCost: 200, hotelCost: 200 },
    
    // Airport
    'JFK Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
    
    // USA set
    'California': { type: 'property', set: 'USA', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], buildCost: 200, hotelCost: 200 },
    'New York': { type: 'property', set: 'USA', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], buildCost: 200, hotelCost: 200 },
    
    // Tax
    'Luxury Tax': { type: 'tax', taxType: 'luxury', taxAmount: 75 },
    
    // Companies
    'Electric Company': { type: 'company', set: 'Company', price: 150, rent: [4, 10] },
    'Water Company': { type: 'company', set: 'Company', price: 150, rent: [4, 10] }
  }
};

module.exports = classicMap;
