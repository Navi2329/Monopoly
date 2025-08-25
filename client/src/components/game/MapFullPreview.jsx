import React from 'react';
import {
  Box,
  Typography,
  Button
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import MonopolyBoard from './MonopolyBoard';

const FullPageOverlay = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.98)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  zIndex: 1000
}));

const BlackedOutSidebar = styled(Box)(({ theme }) => ({
  width: '320px',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  filter: 'grayscale(1) brightness(0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative'
}));

const PreviewMainArea = styled(Box)(({ theme }) => ({
  flex: 1,
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  minHeight: 0,
  overflow: 'hidden'
}));

const MapFullPreview = ({ 
  open, 
  onClose, 
  selectedMap = 'Classic'
}) => {
  if (!open) return null;

  // Debug log to see what selectedMap is being passed
  // console.log('[DEBUG] MapFullPreview selectedMap:', selectedMap);

  const mapData = {
    Classic: {
      name: 'Classic',
      description: 'The traditional Monopoly board with classic properties and locations'
    },
    'Mr. Worldwide': {
      name: 'Mr. Worldwide', 
      description: 'Travel around the world with international properties'
    },
    'India': {
      name: 'India',
      description: 'Explore the cities and culture of India'
    }
  };

  const currentMap = mapData[selectedMap] || mapData.Classic;

  return (
    <FullPageOverlay>
      {/* Left Sidebar - Blacked out */}
      <BlackedOutSidebar>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
          Chat
        </Typography>
      </BlackedOutSidebar>

      {/* Main Preview Area */}
      <PreviewMainArea>

        {/* Board */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          width: '100%',
          position: 'relative'
        }}>
          <MonopolyBoard 
            players={[]}
            currentPlayerIndex={0}
            onPropertyClick={() => {}}
            settings={{ boardMap: selectedMap }}
            isPreviewMode={true}
            previewContent={
              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontSize: '0.75rem',
                    mb: 1
                  }}
                >
                  Board Preview
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    mb: 3
                  }}
                >
                  {currentMap.name}
                </Typography>
                <Button
                  onClick={onClose}
                  startIcon={<Close />}
                  sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    }
                  }}
                >
                  Close preview
                </Button>
              </Box>
            }
          />
        </Box>
      </PreviewMainArea>

      {/* Right Sidebar - Blacked out */}
      <BlackedOutSidebar>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
          Game settings
        </Typography>
      </BlackedOutSidebar>
    </FullPageOverlay>
  );
};

export default MapFullPreview;
