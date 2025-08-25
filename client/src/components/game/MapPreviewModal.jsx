import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { Close, Map as MapIcon, Visibility, CheckCircle } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { mapConfigurations } from '../../data/mapConfigurations';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    maxWidth: '1200px',
    width: '95vw',
    maxHeight: '85vh',
    color: 'white'
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(3),
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'white'
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3)
}));

const MapCard = styled(Card)(({ theme, selected }) => ({
  backgroundColor: 'rgba(51, 65, 85, 0.6)',
  border: selected ? '2px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
  }
}));

const MapPreview = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '120px',
  background: 'linear-gradient(135deg, #1e1b2e 0%, #2a1f3d 100%)',
  border: '2px solid #4c1d95',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  padding: theme.spacing(1)
}));

const MiniBoard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'gridSize',
})(({ theme, gridSize = 11 }) => ({
  width: '80px',
  height: '80px',
  display: 'grid',
  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
  gridTemplateRows: `repeat(${gridSize}, 1fr)`,
  gap: '1px',
  border: '1px solid #4c1d95',
  borderRadius: '4px',
  backgroundColor: '#1e1b2e'
}));

const MiniSpace = styled(Box)(({ theme, color }) => ({
  backgroundColor: color || '#2d1b3d',
  border: '0.5px solid #4c1d95',
  minWidth: '6px',
  minHeight: '6px',
  '&.corner': {
    backgroundColor: '#8b5cf6'
  }
}));

const MapPreviewModal = ({ 
  open, 
  onClose, 
  selectedMap = 'Classic',
  onMapSelect = () => {},
  onMapPreview = () => {},
  availableMaps = ['Classic']
}) => {
  const [localSelectedMap, setLocalSelectedMap] = useState(selectedMap);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalSelectedMap(selectedMap);
  }, [selectedMap]);

  // Helper function to get property name by position
  const getPropertyNameByPosition = (position, mapName) => {
    if (mapName === 'Mr. Worldwide') {
      // Worldwide map positions (48 spaces) - 13x13 grid layout
      const worldwidePositionMap = {
        // Top row (0-12): Start → top right corner
        0: 'START', 1: 'Salvador', 2: 'Treasure', 3: 'Rio', 4: 'Income Tax', 5: 'Tel Aviv',
        6: 'TLV Airport', 7: 'Haifa', 8: 'Jerusalem', 9: 'Surprise', 10: 'Mumbai', 11: 'New Delhi', 12: 'Prison',
        
        // Right column (13-23): Prison → bottom right corner
        13: 'Venice', 14: 'Bologna', 15: 'Electric Company', 16: 'Milan', 17: 'Rome', 18: 'MUC Airport',
        19: 'Frankfurt', 20: 'Treasure', 21: 'Munich', 22: 'Gas Company', 23: 'Berlin',
        
        // Bottom row (24-35): bottom right → Vacation (reversed)
        24: 'Vacation', 25: 'Shenzhen', 26: 'Surprise', 27: 'Beijing', 28: 'Treasure', 29: 'Shanghai',
        30: 'CDG Airport', 31: 'Toulouse', 32: 'Paris', 33: 'Water Company', 34: 'Yokohama', 35: 'Tokyo',
        
        // Left column (36-47): Vacation → Start (reversed)  
        36: 'Go to Prison', 37: 'Liverpool', 38: 'Manchester', 39: 'Treasure', 40: 'Birmingham', 41: 'London',
        42: 'JFK Airport', 43: 'Los Angeles', 44: 'Surprise', 45: 'California', 46: 'Luxury Tax', 47: 'New York'
      };
      return worldwidePositionMap[position] || null;
    } else if (mapName === 'India') {
      // India map positions (40 spaces) - 11x11 grid layout
      const indiaPositionMap = {
        // Top row (0-10): Start → In Prison/Just Visiting
        0: 'START', 1: 'Pune', 2: 'Treasure', 3: 'Nashik', 4: 'Income Tax', 5: 'Mumbai Airport',
        6: 'Surat', 7: 'Surprise', 8: 'Ahmedabad', 9: 'Rajkot', 10: 'In Prison/Just Visiting',

        // Right column (11-19): In Prison/Just Visiting → Vacation
        11: 'Jaipur', 12: 'Electric Company', 13: 'Jodhpur', 14: 'Udaipur', 15: 'Delhi Airport',
        16: 'Kochi', 17: 'Treasure', 18: 'Kottayam', 19: 'Kozhikode',

        // Bottom row (20-29): Vacation → Go to Jail (reversed)
        20: 'Vacation', 21: 'Lucknow', 22: 'Surprise', 23: 'Agra', 24: 'Varanasi',
        25: 'Chennai Airport', 26: 'Bangalore', 27: 'Mysore', 28: 'Water Company', 29: 'Mangalore',

        // Left column (30-39): Go to Jail → Start (reversed)
        30: 'Go to Jail', 31: 'Chennai', 32: 'Coimbatore', 33: 'Treasure', 34: 'Madurai',
        35: 'Kolkata Airport', 36: 'Surprise', 37: 'Hyderabad', 38: 'Luxury Tax', 39: 'Warangal'
      };
      return indiaPositionMap[position] || null;
    } else {
      // Classic map positions (40 spaces) - based on corrected classic.js properties
      const classicPositionMap = {
        // Top row (0-10): Start → Jail
        0: 'START', 1: 'Salvador', 2: 'Treasure', 3: 'Rio', 4: 'Income Tax', 5: 'TLV Airport',
        6: 'Tel Aviv', 7: 'Surprise', 8: 'Haifa', 9: 'Jerusalem', 10: 'Jail',
        
        // Right column (11-19): Jail → Vacation  
        11: 'Venice', 12: 'Electric Company', 13: 'Milan', 14: 'Rome', 15: 'MUC Airport',
        16: 'Frankfurt', 17: 'Treasure', 18: 'Munich', 19: 'Berlin',
        
        // Bottom row (20-29): Vacation → Go to Jail (reversed)
        20: 'Vacation', 21: 'Shenzhen', 22: 'Surprise', 23: 'Beijing', 24: 'Shanghai', 
        25: 'CDG Airport', 26: 'Lyon', 27: 'Toulouse', 28: 'Water Company', 29: 'Paris',
        
        // Left column (30-39): Go to Jail → Start (reversed)
        30: 'Go to Jail', 31: 'Liverpool', 32: 'Manchester', 33: 'Treasure', 34: 'London', 
        35: 'JFK Airport', 36: 'Surprise', 37: 'California', 38: 'Luxury Tax', 39: 'New York'
      };
      return classicPositionMap[position] || null;
    }
  };

  // Use actual map configurations instead of hardcoded data
  const mapData = {
    Classic: {
      name: 'Classic',
      description: mapConfigurations.Classic?.description || 'The traditional Monopoly board with classic properties and locations',
      status: 'Free',
      icon: '🌍',
      colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'],
      actualData: mapConfigurations.Classic
    },
    'Mr. Worldwide': {
      name: 'Mr. Worldwide',
      description: mapConfigurations['Mr. Worldwide']?.description || 'Travel around the world with international properties',
      status: 'Premium',
      icon: '🌐', 
      colors: ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#1e40af', '#1d4ed8', '#2563eb'],
      actualData: mapConfigurations['Mr. Worldwide']
    },
    'India': {
      name: 'India',
      description: mapConfigurations['India']?.description || 'Explore the cities and culture of India',
      status: 'Premium',
      icon: '🇮🇳',
      colors: ['#ff6b35', '#f7931e', '#ffcc02', '#228b22', '#1e90ff', '#9932cc', '#ff1493', '#8b4513'],
      actualData: mapConfigurations['India']
    }
  };

  const generateMiniBoard = (colors, mapName) => {
    const spaces = [];
    const isWorldwide = mapName === 'Mr. Worldwide';
    const gridSize = isWorldwide ? 13 : 11;
    
    // Get actual map data if available
    const actualMapData = mapData[mapName]?.actualData;
    
    // Generate spaces for the appropriate grid size
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        let isSpace = false;
        let color = '#2d1b3d';
        let isCorner = false;
        
        // Calculate position based on board layout
        let position = -1;
        
        // Top row
        if (row === 0) {
          isSpace = true;
          position = col;
          if ((col === 0 || col === gridSize - 1)) isCorner = true;
          else color = colors[col % colors.length];
        }
        // Bottom row  
        else if (row === gridSize - 1) {
          isSpace = true;
          position = isWorldwide ? (24 + (12 - col)) : (20 + (10 - col));
          if ((col === 0 || col === gridSize - 1)) isCorner = true;
          else color = colors[(col + 4) % colors.length];
        }
        // Left column
        else if (col === 0 && row > 0 && row < gridSize - 1) {
          isSpace = true;
          position = isWorldwide ? (48 - row) : (40 - row);
          color = colors[(row + 2) % colors.length];
        }
        // Right column
        else if (col === gridSize - 1 && row > 0 && row < gridSize - 1) {
          isSpace = true;
          position = isWorldwide ? (12 + row) : (10 + row);
          color = colors[(row + 6) % colors.length];
        }
        
        // If we have actual map data, try to get property color based on set
        if (isSpace && actualMapData && position >= 0) {
          const propertyName = getPropertyNameByPosition(position, mapName);
          if (propertyName && actualMapData.properties) {
            const property = actualMapData.properties.find(prop => prop.name === propertyName);
            if (property && property.set) {
              // Use different colors for different property sets
              const setColors = {
                'Brazil': '#8B4513',
                'Israel': '#87CEEB', 
                'India': '#FF8C00',
                'Italy': '#DC143C',
                'Germany': '#32CD32',
                'China': '#FFD700',
                'France': '#9370DB',
                'Japan': '#FF69B4',
                'UK': '#006400',
                'USA': '#0000FF',
                'Airport': '#708090',
                'Company': '#FFFFFF',
                // India map sets
                'Maharashtra': '#800000',
                'Gujarat': '#FF8C00', 
                'Rajasthan': '#FF69B4',
                'Kerala': '#FFD700',
                'Uttar Pradesh': '#32CD32',
                'Karnataka': '#000080',
                'Tamil Nadu': '#87CEEB',
                'Telangana': '#9932CC'
              };
              color = setColors[property.set] || color;
            } else if (property && (property.type === 'start' || property.type === 'jail' || 
                      property.type === 'free-parking' || property.type === 'go-to-jail')) {
              isCorner = true;
            } else if (property && (property.type === 'tax' || property.type === 'chance' || 
                      property.type === 'community-chest')) {
              color = '#4B0082'; // Special spaces
            }
          }
        }
        
        if (isSpace) {
          spaces.push(
            <MiniSpace
              key={`${row}-${col}`}
              color={color}
              className={isCorner ? 'corner' : ''}
              sx={{
                gridColumn: col + 1,
                gridRow: row + 1
              }}
            />
          );
        }
      }
    }
    
    return spaces;
  };

  const maps = Object.keys(mapData);

  const handleMapSelect = (mapName) => {
    setLocalSelectedMap(mapName);
  };

  const handleConfirmSelection = () => {
    onMapSelect(localSelectedMap);
    onClose();
  };

  const handlePreview = (mapName) => {
    onMapPreview(mapName);
  };

  return (
    <StyledDialog 
      open={open} 
      onClose={onClose}
      maxWidth={false}
    >
      <StyledDialogTitle sx={{ fontWeight: 600 }}>
        Choose Board Map
        <IconButton 
          onClick={onClose}
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white'
            }
          }}
        >
          <Close />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        <Grid container spacing={2} justifyContent="center">
          {maps.map((mapName) => {
            const map = mapData[mapName];
            const isSelected = localSelectedMap === mapName;
            const isPremium = map.status === 'Premium';
            
            return (
              <Grid item xs={6} sm={4} md={3} key={mapName}>
                <MapCard 
                  selected={isSelected}
                  onClick={() => handleMapSelect(mapName)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <MapPreview>
                      <MiniBoard gridSize={mapName === 'Mr. Worldwide' ? 13 : 11}>
                        {generateMiniBoard(map.colors, mapName)}
                      </MiniBoard>
                      {isSelected && (
                        <CheckCircle 
                          sx={{ 
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: '#10b981',
                            backgroundColor: 'white',
                            borderRadius: '50%'
                          }}
                        />
                      )}
                    </MapPreview>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                        {map.name}
                      </Typography>
                      <Chip 
                        label={map.status}
                        size="small"
                        sx={{
                          backgroundColor: isPremium ? '#f59e0b' : '#10b981',
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                    </Box>
                    
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.8rem',
                        lineHeight: 1.3,
                        mb: 2
                      }}
                    >
                      {map.description}
                    </Typography>
                    
                    {isSelected && (
                      <CheckCircle 
                        sx={{ 
                          color: '#10b981',
                          mt: 1,
                          fontSize: '1.2rem'
                        }}
                      />
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(mapName);
                      }}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        fontSize: '0.75rem',
                        '&:hover': {
                          borderColor: '#60a5fa',
                          backgroundColor: 'rgba(96, 165, 250, 0.1)',
                          color: '#60a5fa'
                        }
                      }}
                    >
                      Preview
                    </Button>
                  </CardActions>
                </MapCard>
              </Grid>
            );
          })}
        </Grid>
      </StyledDialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirmSelection}
          variant="contained"
          sx={{ 
            backgroundColor: '#60a5fa',
            '&:hover': { backgroundColor: '#3b82f6' }
          }}
        >
          Select {localSelectedMap}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default MapPreviewModal;
