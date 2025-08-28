// server/src/data/maps/india.js
const indiaMap = {
  layout: {
    boardType: 'classic',
    gridSize: 11,
    totalSpaces: 40,
    corners: [
      { name: 'START', position: 0, type: 'start' },
      { name: 'Jail', position: 10, type: 'jail' },
      { name: 'Vacation', position: 20, type: 'vacation' },
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
    'Pune': {
      type: 'property',
      set: 'Maharashtra',
      color: '#800000',
      price: 80,
      rent: [6, 30, 90, 270, 400, 550],
      buildCost: 50,
      hotelCost: 50,
      position: 1
    },
    'Mumbai': {
      type: 'property',
      set: 'Maharashtra', 
      color: '#800000',
      price: 100,
      rent: [12, 60, 180, 500, 700, 900],
      buildCost: 50,
      hotelCost: 50,
      position: 3
    },
    'Income Tax': {
      type: 'tax',
      taxType: 'income', 
      taxAmount: 200,
      position: 4
    },
    'Mumbai Airport': {
      type: 'airport',
      set: 'Airport',
      price: 200,
      rent: [25, 50, 100, 200],
      position: 5
    },
    'Surat': {
      type: 'property',
      set: 'Gujarat',
      color: '#FF8C00',
      price: 100,
      rent: [6, 30, 90, 270, 400, 550],
      buildCost: 50,
      hotelCost: 50,
      position: 6
    },
    'Ahmedabad': {
      type: 'property',
      set: 'Gujarat',
      color: '#FF8C00', 
      price: 120,
      rent: [8, 40, 100, 300, 450, 625],
      buildCost: 50,
      hotelCost: 50,
      position: 8
    },
    'Rajkot': {
      type: 'property',
      set: 'Gujarat',
      color: '#FF8C00',
      price: 140,
      rent: [10, 50, 150, 450, 625, 750],
      buildCost: 50,
      hotelCost: 50,
      position: 9
    },
    'Jaipur': {
      type: 'property',
      set: 'Rajasthan',
      color: '#FF69B4',
      price: 160,
      rent: [12, 60, 180, 500, 700, 900],
      buildCost: 100,
      hotelCost: 100,
      position: 11
    },
    'Electric Company': {
      type: 'company',
      set: 'Company',
      price: 150,
      rent: [4, 10],
      position: 12
    },
    'Jodhpur': {
      type: 'property',
      set: 'Rajasthan',
      color: '#FF69B4',
      price: 140,
      rent: [10, 50, 150, 450, 625, 750],
      buildCost: 100,
      hotelCost: 100,
      position: 13
    },
    'Udaipur': {
      type: 'property',
      set: 'Rajasthan',
      color: '#FF69B4', 
      price: 180,
      rent: [14, 70, 200, 550, 750, 950],
      buildCost: 100,
      hotelCost: 100,
      position: 14
    },
    'Delhi Airport': {
      type: 'airport',
      set: 'Airport',
      price: 200,
      rent: [25, 50, 100, 200],
      position: 15
    },
    'Kochi': {
      type: 'property',
      set: 'Kerala',
      color: '#FFD700',
      price: 200,
      rent: [16, 80, 220, 600, 800, 1000],
      buildCost: 100,
      hotelCost: 100,
      position: 16
    },
    'Kottayam': {
      type: 'property',
      set: 'Kerala',
      color: '#FFD700',
      price: 180,
      rent: [14, 70, 200, 550, 750, 950],
      buildCost: 100,
      hotelCost: 100,
      position: 18
    },
    'Kozhikode': {
      type: 'property',
      set: 'Kerala',
      color: '#FFD700',
      price: 220,
      rent: [18, 90, 250, 700, 875, 1050],
      buildCost: 100,
      hotelCost: 100,
      position: 19
    },
    'Lucknow': {
      type: 'property',
      set: 'Uttar Pradesh',
      color: '#32CD32',
      price: 220,
      rent: [18, 90, 250, 700, 875, 1050],
      buildCost: 150,
      hotelCost: 150,
      position: 21
    },
    'Agra': {
      type: 'property',
      set: 'Uttar Pradesh',
      color: '#32CD32',
      price: 220,
      rent: [18, 90, 250, 700, 875, 1050],
      buildCost: 150,
      hotelCost: 150,
      position: 23
    },
    'Varanasi': {
      type: 'property',
      set: 'Uttar Pradesh',
      color: '#32CD32',
      price: 240,
      rent: [20, 100, 300, 750, 925, 1100],
      buildCost: 150,
      hotelCost: 150,
      position: 24
    },
    'Chennai Airport': {
      type: 'airport',
      set: 'Airport',
      price: 200,
      rent: [25, 50, 100, 200],
      position: 25
    },
    'Bangalore': {
      type: 'property',
      set: 'Karnataka',
      color: '#000080',
      price: 320,
      rent: [28, 150, 450, 1000, 1200, 1400],
      buildCost: 150,
      hotelCost: 150,
      position: 26
    },
    'Mysore': {
      type: 'property',
      set: 'Karnataka',
      color: '#000080',
      price: 280,
      rent: [24, 120, 360, 850, 1025, 1200],
      buildCost: 150,
      hotelCost: 150,
      position: 27
    },
    'Water Company': {
      type: 'company',
      set: 'Company',
      price: 150,
      rent: [4, 10],
      position: 28
    },
    'Mangalore': {
      type: 'property',
      set: 'Karnataka',
      color: '#000080',
      price: 300,
      rent: [26, 130, 390, 900, 1100, 1275],
      buildCost: 150,
      hotelCost: 150,
      position: 29
    },
    'Chennai': {
      type: 'property',
      set: 'Tamil Nadu',
      color: '#FF1493',
      price: 340,
      rent: [30, 160, 470, 1050, 1250, 1450],
      buildCost: 200,
      hotelCost: 200,
      position: 31
    },
    'Coimbatore': {
      type: 'property',
      set: 'Tamil Nadu',
      color: '#FF1493',
      price: 300,
      rent: [26, 130, 390, 900, 1100, 1275],
      buildCost: 200,
      hotelCost: 200,
      position: 32
    },
    'Madurai': {
      type: 'property',
      set: 'Tamil Nadu',
      color: '#FF1493',
      price: 320,
      rent: [28, 150, 450, 1000, 1200, 1400],
      buildCost: 200,
      hotelCost: 200,
      position: 34
    },
    'Kolkata Airport': {
      type: 'airport',
      set: 'Airport',
      price: 200,
      rent: [25, 50, 100, 200],
      position: 35
    },
    'Hyderabad': {
      type: 'property',
      set: 'Telangana',
      color: '#9932CC',
      price: 380,
      rent: [40, 200, 600, 1400, 1650, 1900],
      buildCost: 200,
      hotelCost: 200,
      position: 37
    },
    'Luxury Tax': {
      type: 'tax',
      taxType: 'luxury',
      taxAmount: 100,
      position: 38
    },
    'Warangal': {
      type: 'property',
      set: 'Telangana',
      color: '#9932CC',
      price: 400,
      rent: [50, 250, 700, 1500, 1800, 2100],
      buildCost: 200,
      hotelCost: 200,
      position: 39
    }
  }
};

module.exports = indiaMap;