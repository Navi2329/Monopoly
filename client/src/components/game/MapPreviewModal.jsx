import React, { useState } from 'react';
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

const MiniBoard = styled(Box)(({ theme }) => ({
  width: '80px',
  height: '80px',
  display: 'grid',
  gridTemplateColumns: 'repeat(11, 1fr)',
  gridTemplateRows: 'repeat(11, 1fr)',
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

  const mapData = {
    Classic: {
      name: 'Classic',
      description: 'The traditional Monopoly board with classic properties and locations',
      status: 'Free',
      icon: '🌍',
      colors: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280']
    },
    'Mr. Worldwide': {
      name: 'Mr. Worldwide',
      description: 'Travel around the world with international properties',
      status: 'Premium',
      icon: '🌐', 
      colors: ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#1e40af', '#1d4ed8', '#2563eb']
    },
    'Death Valley': {
      name: 'Death Valley',
      description: 'A dangerous desert adventure with high stakes',
      status: 'Premium',
      icon: '💀',
      colors: ['#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#f97316', '#ea580c', '#c2410c', '#9a3412']
    },
    'Lucky Wheel': {
      name: 'Lucky Wheel',
      description: 'Test your luck with special wheel mechanics',
      status: 'Premium',
      icon: '🍀',
      colors: ['#16a34a', '#15803d', '#166534', '#14532d', '#65a30d', '#4d7c0f', '#365314', '#1a2e05']
    }
  };

  const generateMiniBoard = (colors) => {
    const spaces = [];
    
    // Generate all 40 spaces (11x11 grid with corners and edges)
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        let isSpace = false;
        let color = '#2d1b3d';
        let isCorner = false;
        
        // Top row
        if (row === 0) {
          isSpace = true;
          if (col === 0 || col === 10) isCorner = true;
          else color = colors[col % colors.length];
        }
        // Bottom row  
        else if (row === 10) {
          isSpace = true;
          if (col === 0 || col === 10) isCorner = true;
          else color = colors[(col + 4) % colors.length];
        }
        // Left column
        else if (col === 0 && row > 0 && row < 10) {
          isSpace = true;
          color = colors[(row + 2) % colors.length];
        }
        // Right column
        else if (col === 10 && row > 0 && row < 10) {
          isSpace = true;
          color = colors[(row + 6) % colors.length];
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
      <StyledDialogTitle>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Board Maps
        </Typography>
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
        <Grid container spacing={3} justifyContent="center">
          {maps.map((mapName) => {
            const map = mapData[mapName];
            const isSelected = localSelectedMap === mapName;
            const isPremium = map.status === 'Premium';
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={mapName}>
                <MapCard 
                  selected={isSelected}
                  onClick={() => handleMapSelect(mapName)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <MapPreview>
                      <MiniBoard>
                        {generateMiniBoard(map.colors)}
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
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.8rem',
                        lineHeight: 1.3,
                        mb: 2
                      }}
                    >
                      {map.description}
                    </Typography>
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
