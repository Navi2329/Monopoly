// server/src/data/maps/worldwide.js
const worldwideMap = {
  layout: {
    boardType: 'worldwide',
    gridSize: 13,
    totalSpaces: 48,
    corners: [
      { name: 'GO', position: 0, type: 'start' },
      { name: 'Prison', position: 12, type: 'jail' },
      { name: 'Vacation', position: 24, type: 'free-parking' },
      { name: 'Go to Prison', position: 36, type: 'go-to-jail' }
    ],
    rows: {
      top: 13,      // Start + top row (positions 0-12)
      right: 11,    // Right column (positions 13-23)  
      bottom: 12,   // Bottom row (positions 24-35)
      left: 12      // Left column (positions 36-47)
    }
  },
  
  properties: {
    // Brazil set
    'Salvador': { type: 'property', set: 'Brazil', price: 60, rent: [2, 10, 30, 90, 160, 250], buildCost: 50, hotelCost: 50 },
    'Rio': { type: 'property', set: 'Brazil', price: 60, rent: [4, 20, 60, 180, 320, 450], buildCost: 50, hotelCost: 50 },
    
    // Israel set
    'Tel Aviv': { type: 'property', set: 'Israel', price: 100, rent: [6, 30, 90, 270, 400, 550], buildCost: 50, hotelCost: 50 },
    'Haifa': { type: 'property', set: 'Israel', price: 100, rent: [4, 20, 60, 180, 320, 450], buildCost: 50, hotelCost: 50 },
    'Jerusalem': { type: 'property', set: 'Israel', price: 110, rent: [8, 40, 100, 300, 450, 600], buildCost: 50, hotelCost: 50 },
    
    // India set
    'Mumbai': { type: 'property', set: 'India', price: 120, rent: [8, 45, 120, 350, 500, 650], buildCost: 100, hotelCost: 100 },
    'New Delhi': { type: 'property', set: 'India', price: 120, rent: [10, 45, 130, 400, 575, 700], buildCost: 100, hotelCost: 100 },
    
    // Italy set
    'Venice': { type: 'property', set: 'Italy', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100, hotelCost: 100 },
    'Bologna': { type: 'property', set: 'Italy', price: 140, rent: [10, 50, 150, 450, 625, 750], buildCost: 100, hotelCost: 100 },
    'Milan': { type: 'property', set: 'Italy', price: 160, rent: [12, 60, 180, 500, 700, 900], buildCost: 100, hotelCost: 100 },
    'Rome': { type: 'property', set: 'Italy', price: 160, rent: [12, 60, 180, 500, 700, 900], buildCost: 100, hotelCost: 100 },
    
    // Germany set
    'Frankfurt': { type: 'property', set: 'Germany', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100, hotelCost: 100 },
    'Munich': { type: 'property', set: 'Germany', price: 180, rent: [14, 70, 200, 550, 750, 950], buildCost: 100, hotelCost: 100 },
    'Berlin': { type: 'property', set: 'Germany', price: 200, rent: [16, 80, 220, 600, 800, 1000], buildCost: 100, hotelCost: 100 },
    
    // China set
    'Shenzhen': { type: 'property', set: 'China', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150, hotelCost: 150 },
    'Beijing': { type: 'property', set: 'China', price: 220, rent: [18, 90, 250, 700, 875, 1050], buildCost: 150, hotelCost: 150 },
    'Shanghai': { type: 'property', set: 'China', price: 240, rent: [20, 100, 300, 750, 925, 1100], buildCost: 150, hotelCost: 150 },
    
    // France set
    'Toulouse': { type: 'property', set: 'France', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150, hotelCost: 150 },
    'Paris': { type: 'property', set: 'France', price: 260, rent: [22, 110, 330, 800, 975, 1150], buildCost: 150, hotelCost: 150 },
    
    // Japan set
    'Yokohama': { type: 'property', set: 'Japan', price: 280, rent: [24, 120, 360, 850, 1025, 1200], buildCost: 150, hotelCost: 150 },
    'Tokyo': { type: 'property', set: 'Japan', price: 280, rent: [24, 120, 360, 850, 1025, 1200], buildCost: 150, hotelCost: 150 },
    
    // UK set
    'Liverpool': { type: 'property', set: 'UK', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200, hotelCost: 200 },
    'Manchester': { type: 'property', set: 'UK', price: 300, rent: [26, 130, 390, 900, 1100, 1275], buildCost: 200, hotelCost: 200 },
    'Birmingham': { type: 'property', set: 'UK', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], buildCost: 200, hotelCost: 200 },
    'London': { type: 'property', set: 'UK', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], buildCost: 200, hotelCost: 200 },
    
    // USA set
    'Los Angeles': { type: 'property', set: 'USA', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], buildCost: 200, hotelCost: 200 },
    'California': { type: 'property', set: 'USA', price: 360, rent: [40, 180, 540, 1200, 1450, 1675], buildCost: 200, hotelCost: 200 },
    'New York': { type: 'property', set: 'USA', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], buildCost: 200, hotelCost: 200 },

    // Airports
    'TLV Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
    'MUC Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
    'CDG Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
    'JFK Airport': { type: 'airport', set: 'Airport', price: 200, rent: [25, 50, 100, 200] },
    
    // Companies (updated rent structure for 3 companies)
    'Electric Company': { type: 'company', set: 'Company', price: 150, rent: [4, 10, 20] },
    'Gas Company': { type: 'company', set: 'Company', price: 150, rent: [4, 10, 20] },
    'Water Company': { type: 'company', set: 'Company', price: 150, rent: [4, 10, 20] },

    // Special spaces - match classic structure
    'GO': { type: 'start', passingBonus: 200, landingBonus: 300 },
    'Prison': { type: 'jail' },
    'Vacation': { type: 'free-parking' },
    'Go to Prison': { type: 'go-to-jail' },
    'Income Tax': { type: 'tax', calculation: 'percentage', percentage: 10 },
    'Luxury Tax': { type: 'tax', amount: 75 },
    'Treasure': { type: 'chance' },
    'Surprise': { type: 'community-chest' }
  }
};

module.exports = worldwideMap;
