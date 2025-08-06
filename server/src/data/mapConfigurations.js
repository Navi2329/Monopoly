// server/src/data/mapConfigurations.js
const classicMap = require('./maps/classic');
const worldwideMap = require('./maps/worldwide');

const mapConfigurations = {
  classic: {
    name: 'Classic Monopoly',
    description: 'The traditional Monopoly board',
    boardType: 'classic',
    layout: classicMap.layout,
    properties: classicMap.properties
  },
  'Classic': {
    name: 'Classic Monopoly',
    description: 'The traditional Monopoly board',
    boardType: 'classic',
    layout: classicMap.layout,
    properties: classicMap.properties
  },
  worldwide: {
    name: 'Mr. Worldwide',
    description: 'An expanded international board',
    boardType: 'worldwide', 
    layout: worldwideMap.layout,
    properties: worldwideMap.properties
  },
  'Mr. Worldwide': {
    name: 'Mr. Worldwide',
    description: 'An expanded international board',
    boardType: 'worldwide', 
    layout: worldwideMap.layout,
    properties: worldwideMap.properties
  }
};

// Helper functions
function getPropertyData(mapType = 'classic') {
  if (!mapConfigurations[mapType]) {
    throw new Error(`Map type "${mapType}" not found`);
  }
  return mapConfigurations[mapType].properties;
}

function getMapProperties(mapType = 'classic') {
  if (!mapConfigurations[mapType]) {
    throw new Error(`Map type "${mapType}" not found`);
  }
  return mapConfigurations[mapType];
}

function getMapLayout(mapType = 'classic') {
  if (!mapConfigurations[mapType]) {
    throw new Error(`Map type "${mapType}" not found`);
  }
  return mapConfigurations[mapType].layout;
}

function getAvailableMaps() {
  return Object.keys(mapConfigurations).map(key => ({
    id: key,
    name: mapConfigurations[key].name,
    description: mapConfigurations[key].description,
    boardType: mapConfigurations[key].boardType
  }));
}

module.exports = {
  mapConfigurations,
  getPropertyData,
  getMapProperties,
  getMapLayout,
  getAvailableMaps
};
