import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  Chip
} from '@mui/material';
import {
  Add,
  SmartToy,
  Close,
  Psychology,
  Speed,
  TrendingUp
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledBotButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: theme.spacing(0.8, 2),
  fontSize: '0.85rem',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
  },
  '&:disabled': {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.4)',
  }
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: 'white',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#667eea',
  },
  '& .MuiSelect-icon': {
    color: 'white',
  }
}));

const DifficultyChip = styled(Chip)(({ difficulty }) => {
  const colors = {
    easy: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' },
    medium: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)' },
    hard: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }
  };
  
  const colorSet = colors[difficulty] || colors.medium;
  
  return {
    backgroundColor: colorSet.bg,
    color: colorSet.color,
    border: colorSet.border,
    fontSize: '0.7rem',
    height: '20px',
    '& .MuiChip-label': {
      padding: '0 6px',
    }
  };
});

const BotManagement = ({ 
  room, 
  isHost, 
  gameStarted, 
  playerJoined, 
  onAddBot, 
  onRemoveBot, 
  socket 
}) => {
  const [addBotDialog, setAddBotDialog] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  const botsAllowed = room?.settings?.allowBots;
  const maxPlayers = room?.settings?.maxPlayers || 8;
  const currentPlayerCount = room?.players?.length || 0;
  const botPlayers = room?.players?.filter(p => p.isBot) || [];
  const canAddBots = isHost && !gameStarted && playerJoined && botsAllowed && currentPlayerCount < maxPlayers;

  const handleAddBot = () => {
    if (!canAddBots) return;
    
    socket.emit('addBot', {
      roomId: room.id,
      difficulty: selectedDifficulty
    });
    
    setAddBotDialog(false);
    setSelectedDifficulty('medium');
  };

  const handleRemoveBot = (botId) => {
    if (!isHost || gameStarted) return;
    
    socket.emit('removeBot', {
      roomId: room.id,
      botId: botId
    });
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return <Psychology fontSize="small" />;
      case 'medium':
        return <Speed fontSize="small" />;
      case 'hard':
        return <TrendingUp fontSize="small" />;
      default:
        return <SmartToy fontSize="small" />;
    }
  };

  const getDifficultyDescription = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'Conservative play, keeps lots of cash, minimal risk-taking';
      case 'medium':
        return 'Balanced strategy, moderate risk-taking and trading';
      case 'hard':
        return 'Aggressive play, competitive bidding, strategic trading';
      default:
        return 'Standard AI behavior';
    }
  };

  if (!botsAllowed) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* Add Bot Button */}
      {canAddBots && (
        <StyledBotButton
          onClick={() => setAddBotDialog(true)}
          disabled={!canAddBots}
          startIcon={<Add />}
          fullWidth
        >
          Add Bot ({currentPlayerCount}/{maxPlayers})
        </StyledBotButton>
      )}

      {/* Bot List */}
      {botPlayers.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              display: 'block',
              mb: 1,
              fontSize: '0.75rem'
            }}
          >
            Bots in room:
          </Typography>
          {botPlayers.map((bot) => (
            <Box
              key={bot.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 0.5,
                p: 1,
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToy sx={{ fontSize: '1rem', color: '#667eea' }} />
                <Typography variant="caption" sx={{ color: 'white' }}>
                  {bot.name}
                </Typography>
                <DifficultyChip
                  difficulty={bot.difficulty || 'medium'}
                  label={bot.difficulty || 'medium'}
                  size="small"
                />
              </Box>
              {isHost && !gameStarted && (
                <Tooltip title="Remove bot">
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveBot(bot.id)}
                    sx={{ 
                      color: 'rgba(239, 68, 68, 0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.1)'
                      }
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Add Bot Dialog */}
      <Dialog
        open={addBotDialog}
        onClose={() => setAddBotDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy />
            Add Bot Player
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ color: 'white', mb: 2 }}>
              Choose the difficulty level for the bot:
            </Typography>
            <FormControl fullWidth>
              <StyledSelect
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      '& .MuiMenuItem-root': {
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(102, 126, 234, 0.2)',
                          '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.3)',
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="easy">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getDifficultyIcon('easy')}
                    Easy
                  </Box>
                </MenuItem>
                <MenuItem value="medium">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getDifficultyIcon('medium')}
                    Medium
                  </Box>
                </MenuItem>
                <MenuItem value="hard">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getDifficultyIcon('hard')}
                    Hard
                  </Box>
                </MenuItem>
              </StyledSelect>
            </FormControl>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                display: 'block', 
                mt: 1,
                fontSize: '0.75rem'
              }}
            >
              {getDifficultyDescription(selectedDifficulty)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setAddBotDialog(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            Cancel
          </Button>
          <StyledBotButton onClick={handleAddBot}>
            Add Bot
          </StyledBotButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BotManagement;
