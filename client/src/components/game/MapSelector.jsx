import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip
} from '@mui/material';
import { Preview, Map } from '@mui/icons-material';
import { getAvailableMaps, getMapProperties, getMapLayout } from '../../data/mapConfigurations';
import MapPreviewModal from './MapPreviewModal';

const MapSelector = ({ selectedMap, onMapChange, disabled = false, showBrowseButton = false }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const availableMaps = getAvailableMaps();
  const currentMap = availableMaps.find(map => map.id === selectedMap) || availableMaps[0];

  const handleBrowseMaps = () => {
    setPreviewOpen(true);
  };

  const handleMapSelect = (mapName) => {
    onMapChange(mapName);
    setPreviewOpen(false);
  };

  const handleMapPreview = (mapName) => {
    // This will be handled by GamePage to show full preview
  };

  const MapPreview = ({ mapId }) => {
    if (!mapId) return null;
    
    const mapLayout = getMapLayout(mapId);
    const mapProperties = getMapProperties(mapId);
    
    // Group properties by set
    const propertyBySets = mapProperties.reduce((acc, prop) => {
      if (!acc[prop.set]) acc[prop.set] = [];
      acc[prop.set].push(prop);
      return acc;
    }, {});

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {mapLayout.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {mapLayout.description}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Board Layout
                </Typography>
                <Typography variant="body2">
                  Size: {mapLayout.gridSize}×{mapLayout.gridSize}
                </Typography>
                <Typography variant="body2">
                  Total Spaces: {mapLayout.totalSpaces}
                </Typography>
                <Typography variant="body2">
                  Properties: {mapProperties.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Property Sets
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Object.keys(propertyBySets).map(setName => (
                    <Chip 
                      key={setName}
                      label={`${setName} (${propertyBySets[setName].length})`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Visual board representation */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Board Preview
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: mapLayout.gridSize === 11 
                ? '75px repeat(9, 1fr) 75px' 
                : '60px repeat(11, 1fr) 60px',
              gridTemplateRows: mapLayout.gridSize === 11 
                ? '75px repeat(9, 1fr) 75px' 
                : '60px repeat(11, 1fr) 60px',
              width: '300px',
              height: '300px',
              border: '2px solid #4c1d95',
              backgroundColor: '#1e1b2e',
              margin: '0 auto'
            }}
          >
            {/* Top row */}
            {Array.from({ length: mapLayout.gridSize }).map((_, i) => (
              <Box
                key={`top-${i}`}
                sx={{
                  gridColumn: i + 1,
                  gridRow: 1,
                  border: '1px solid #4c1d95',
                  backgroundColor: i === 0 || i === mapLayout.gridSize - 1 ? '#22c55e' : '#2d1b3d',
                  fontSize: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                {i === 0 ? 'START' : i === mapLayout.gridSize - 1 ? 'JAIL' : ''}
              </Box>
            ))}
            
            {/* Right column */}
            {Array.from({ length: mapLayout.gridSize - 2 }).map((_, i) => (
              <Box
                key={`right-${i}`}
                sx={{
                  gridColumn: mapLayout.gridSize,
                  gridRow: i + 2,
                  border: '1px solid #4c1d95',
                  backgroundColor: '#2d1b3d'
                }}
              />
            ))}
            
            {/* Bottom row */}
            {Array.from({ length: mapLayout.gridSize }).map((_, i) => (
              <Box
                key={`bottom-${i}`}
                sx={{
                  gridColumn: mapLayout.gridSize - i,
                  gridRow: mapLayout.gridSize,
                  border: '1px solid #4c1d95',
                  backgroundColor: i === 0 || i === mapLayout.gridSize - 1 ? '#22c55e' : '#2d1b3d',
                  fontSize: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                {i === mapLayout.gridSize - 1 ? 'FREE' : i === 0 ? 'JAIL' : ''}
              </Box>
            ))}
            
            {/* Left column */}
            {Array.from({ length: mapLayout.gridSize - 2 }).map((_, i) => (
              <Box
                key={`left-${i}`}
                sx={{
                  gridColumn: 1,
                  gridRow: mapLayout.gridSize - 1 - i,
                  border: '1px solid #4c1d95',
                  backgroundColor: '#2d1b3d'
                }}
              />
            ))}
            
            {/* Center area */}
            <Box
              sx={{
                gridColumn: `2 / ${mapLayout.gridSize}`,
                gridRow: `2 / ${mapLayout.gridSize}`,
                backgroundColor: '#1a1625',
                border: '1px solid #4c1d95',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '8px'
              }}
            >
              {mapLayout.name}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <>
      {showBrowseButton ? (
        // Compact display with current map and browse button
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 1,
          width: '100%'
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 500,
              flexShrink: 0
            }}
          >
            {currentMap?.name || 'Classic'}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleBrowseMaps}
            disabled={disabled}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              fontSize: '0.7rem',
              padding: '2px 8px',
              minWidth: 'auto',
              height: '24px',
              flexShrink: 0,
              '&:hover': {
                borderColor: '#60a5fa',
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                color: '#60a5fa'
              },
              '&:disabled': {
                color: 'rgba(255, 255, 255, 0.4)',
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Browse maps ›
          </Button>
        </Box>
      ) : (
        // Full dropdown selector
        <FormControl fullWidth disabled={disabled}>
          <InputLabel id="map-select-label">Board Map</InputLabel>
          <Select
            labelId="map-select-label"
            value={selectedMap || 'Classic'}
            label="Board Map"
            onChange={(e) => onMapChange(e.target.value)}
          >
            {availableMaps.map((map) => (
              <MenuItem key={map.id} value={map.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Map sx={{ mr: 1, fontSize: 16 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">{map.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {map.description}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <MapPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        selectedMap={selectedMap || 'Classic'}
        onMapSelect={handleMapSelect}
        onMapPreview={handleMapPreview}
        availableMaps={['Classic', 'Mr. Worldwide', 'Death Valley', 'Lucky Wheel']}
      />
    </>
  );
};

export default MapSelector;
