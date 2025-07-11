import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Modal,
  Card,
  CardContent,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Close,
  Settings,
  ContentCopy,
  PersonAdd,
  Check
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2)
}));

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  minWidth: 400,
  maxWidth: 500
}));

const ShareGame = ({ gameUrl, devDiceEnabled, devDice1, devDice2, onDevDiceChange }) => {
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareUrl = gameUrl || 'http://localhost:5173/game/example';

  const handleDevDiceToggle = () => {
    if (onDevDiceChange) {
      onDevDiceChange('enabled', !devDiceEnabled);
    }
  };

  const handleDice1Change = (value) => {
    if (onDevDiceChange) {
      onDevDiceChange('dice1', value);
    }
  };

  const handleDice2Change = (value) => {
    if (onDevDiceChange) {
      onDevDiceChange('dice2', value);
    }
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
          Share this game
        </Typography>
        <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          <Box sx={{ fontSize: '12px' }}>ℹ️</Box>
        </IconButton>
      </Box>
      
      {/* URL Input and Copy Button */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          value={shareUrl}
          size="small"
          fullWidth
          InputProps={{
            readOnly: true,
            sx: {
              fontSize: '11px',
              fontFamily: 'monospace',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.1)'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.2)'
              },
              '& .MuiInputBase-input': {
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '11px'
              }
            }
          }}
        />
        <Button
          onClick={copyToClipboard}
          variant={copied ? "contained" : "outlined"}
          size="small"
          sx={{
            minWidth: 70,
            fontSize: '11px',
            backgroundColor: copied ? '#059669' : 'rgba(255, 255, 255, 0.1)',
            borderColor: copied ? '#059669' : 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            '&:hover': {
              backgroundColor: copied ? '#047857' : 'rgba(255, 255, 255, 0.2)',
              borderColor: copied ? '#047857' : 'rgba(255, 255, 255, 0.2)'
            }
          }}
          startIcon={copied ? <Check sx={{ fontSize: '12px' }} /> : <ContentCopy sx={{ fontSize: '12px' }} />}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </Box>
      
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          fullWidth
          sx={{
            fontSize: '11px',
            backgroundColor: '#059669',
            '&:hover': { backgroundColor: '#047857' },
            textTransform: 'none'
          }}
          startIcon={<PersonAdd sx={{ fontSize: '12px' }} />}
        >
          Invite friends
        </Button>
        <Button
          variant="contained"
          size="small"
          fullWidth
          onClick={() => setSettingsOpen(true)}
          sx={{
            fontSize: '11px',
            backgroundColor: '#2563eb',
            '&:hover': { backgroundColor: '#1d4ed8' },
            textTransform: 'none'
          }}
          startIcon={<Settings sx={{ fontSize: '12px' }} />}
        >
          Settings
        </Button>
      </Box>

      {/* Settings Modal */}
      <StyledModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        aria-labelledby="settings-modal-title"
      >
        <StyledCard>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            p: 3,
            pb: 1
          }}>
            <Typography 
              id="settings-modal-title" 
              variant="h6" 
              sx={{ color: 'white', fontWeight: 600 }}
            >
              Developer Options
            </Typography>
            <IconButton
              onClick={() => setSettingsOpen(false)}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <Close />
            </IconButton>
          </Box>
          
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          
          <CardContent sx={{ p: 3, pt: 2 }}>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, mb: 2 }}>
              Debug Dice Roll
            </Typography>
            
            {/* Enable Custom Dice Toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px' }}>
                Custom Dice
              </Typography>
              <Button
                size="small"
                variant={devDiceEnabled ? "contained" : "outlined"}
                onClick={handleDevDiceToggle}
                sx={{
                  minWidth: 60,
                  height: 24,
                  fontSize: '11px',
                  borderColor: 'rgba(139, 92, 246, 0.5)',
                  color: devDiceEnabled ? 'white' : '#8b5cf6',
                  backgroundColor: devDiceEnabled ? '#8b5cf6' : 'transparent',
                  '&:hover': {
                    backgroundColor: devDiceEnabled ? '#7c3aed' : 'rgba(139, 92, 246, 0.1)'
                  }
                }}
              >
                {devDiceEnabled ? 'ON' : 'OFF'}
              </Button>
            </Box>

            {/* Dice Selectors */}
            {devDiceEnabled && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                    Dice 1
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={devDice1}
                      onChange={(e) => handleDice1Change(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(139, 92, 246, 0.3)'
                        },
                        '& .MuiSelect-select': {
                          color: 'white',
                          fontSize: '13px',
                          padding: '6px 8px'
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'rgba(255, 255, 255, 0.7)'
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            backgroundColor: 'rgba(30, 41, 59, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }
                        }
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <MenuItem 
                          key={num} 
                          value={num} 
                          sx={{ 
                            fontSize: '13px',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(139, 92, 246, 0.2)'
                            }
                          }}
                        >
                          {num}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                    Dice 2
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={devDice2}
                      onChange={(e) => handleDice2Change(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(139, 92, 246, 0.3)'
                        },
                        '& .MuiSelect-select': {
                          color: 'white',
                          fontSize: '13px',
                          padding: '6px 8px'
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'rgba(255, 255, 255, 0.7)'
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            backgroundColor: 'rgba(30, 41, 59, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }
                        }
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <MenuItem 
                          key={num} 
                          value={num} 
                          sx={{ 
                            fontSize: '13px',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(139, 92, 246, 0.2)'
                            }
                          }}
                        >
                          {num}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            )}
          </CardContent>
        </StyledCard>
      </StyledModal>
    </Box>
  );
};

export default ShareGame;
