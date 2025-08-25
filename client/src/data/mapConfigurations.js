import { classicMap } from './maps/classic.js';
import { worldwideMap } from './maps/worldwide.js';
import { indiaMap } from './maps/india.js';

// Map configurations with layout information
export const mapConfigurations = {
  'Classic': {
    name: 'Classic',
    description: 'The original Monopoly map with classic properties',
    size: '11x11',
    properties: classicMap,
    layout: 'classic', // 11x11 grid
    totalSpaces: 40,
    boardType: 'classic'
  },
  'Mr. Worldwide': {
    name: 'Mr. Worldwide',
    description: 'Expanded worldwide map with more countries and properties',
    size: '13x13',
    properties: worldwideMap,
    layout: 'worldwide', // 13x13 grid
    totalSpaces: 48,
    boardType: 'worldwide'
  },
  'India': {
    name: 'India',
    description: 'Explore the cities and culture of India',
    size: '11x11',
    properties: indiaMap,
    layout: 'classic', // 11x11 grid
    totalSpaces: 40,
    boardType: 'classic'
  },
  'Custom': {
    name: 'Custom',
    description: 'Create your own custom map layout',
    size: '11x11',
    properties: [], // Will be implemented later
    layout: 'classic', // 11x11 grid
    totalSpaces: 40,
    boardType: 'classic'
  }
};

// Helper function to get property data for a specific map
export const getPropertyData = (mapName, propertyName) => {
  const mapConfig = mapConfigurations[mapName];
  if (!mapConfig) return null;
  
  return mapConfig.properties.find(prop => prop.name === propertyName);
};

// Helper function to get all property data for a map
export const getMapProperties = (mapName) => {
  const mapConfig = mapConfigurations[mapName];
  return mapConfig ? mapConfig.properties : [];
};

// Helper function to get map layout info
export const getMapLayout = (mapName) => {
  const mapConfig = mapConfigurations[mapName];
  if (!mapConfig) return { size: '11x11', layout: 'classic', totalSpaces: 40, boardType: 'classic' };
  
  return {
    size: mapConfig.size,
    layout: mapConfig.layout,
    totalSpaces: mapConfig.totalSpaces,
    boardType: mapConfig.boardType
  };
};

// Helper function to get available maps for selection
export const getAvailableMaps = () => {
  return Object.keys(mapConfigurations).map(key => ({
    id: key,
    name: mapConfigurations[key].name,
    description: mapConfigurations[key].description,
    boardType: mapConfigurations[key].boardType,
    totalSpaces: mapConfigurations[key].totalSpaces,
    gridSize: mapConfigurations[key].boardType === 'classic' ? 11 : 13
  }));
};

// Available maps for selection
export const availableMaps = Object.keys(mapConfigurations);

export default mapConfigurations;
