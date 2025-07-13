import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Paper,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Settings,
  Close,
  RadioButtonChecked,
  Palette
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';



const StyledPlayerCard = styled(Paper)(({ theme, isshuffling }) => ({
  background: 'rgba(30, 41, 59, 0.3)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  transition: isshuffling === 'true' ? 'all 0.15s ease' : 'all 0.2s ease',
  transform: isshuffling === 'true' ? 'scale(0.98) rotate(1deg)' : 'scale(1)',
  opacity: isshuffling === 'true' ? 0.9 : 1,
  boxShadow: isshuffling === 'true' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transform: isshuffling === 'true' ? 'scale(0.98) rotate(1deg)' : 'translateY(-1px)',
  }
}));

const StyledAvatar = styled(Avatar)(({ playercolor }) => ({
  width: 32,
  height: 32,
  backgroundColor: playercolor,
  fontSize: '0.9rem',
  fontWeight: 700,
  border: '2px solid rgba(255, 255, 255, 0.2)',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    backgroundColor: '#10b981',
    borderRadius: '50%',
    border: '2px solid rgba(15, 23, 42, 0.8)',
  }
}));

const PlayerList = ({ players, currentPlayerId, gameStarted = false, isHost = false, onKickPlayer, onChangeAppearance, playerJoined = true, playerStatuses = {}, isShuffling = false }) => {
  const hasPlayers = players.length > 0;

  return (
    <Box sx={{ maxHeight: 240, overflow: 'auto' }} className="custom-scrollbar">
      {/* Players List */}
      {hasPlayers && (
        <Box>
          {players.map((player) => (
            <StyledPlayerCard key={player.id} elevation={0} isshuffling={isShuffling.toString()}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Left side - Avatar and player info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                  {/* Avatar with crown badge and status indicators */}
                  <Box sx={{ position: 'relative' }}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                      badgeContent={
                        player.isHost ? (
                          <Box
                            sx={{
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            👑
                          </Box>
                        ) : null
                      }
                    >
                      <StyledAvatar playercolor={player.color}>
                        {player.name.charAt(0).toUpperCase()}

                        {/* Jail bars overlay for players in jail */}
                        {playerStatuses[player.id] === 'jail' && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.7) 2px, rgba(0,0,0,0.7) 4px)',
                              pointerEvents: 'none',
                              zIndex: 1
                            }}
                          />
                        )}
                      </StyledAvatar>
                    </Badge>

                    {/* Vacation indicator */}
                    {playerStatuses[player.id] && typeof playerStatuses[player.id] === 'object' && playerStatuses[player.id].status === 'vacation' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '-6px',
                          left: '-6px',
                          width: '18px',
                          height: '18px',
                          backgroundColor: '#22c55e',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '8px',
                          border: '2px solid white',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
                          zIndex: 2
                        }}
                      >
                        🏖️
                      </Box>
                    )}
                  </Box>

                  {/* Player name and icons */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {/* Turn order indicator when game has started */}
                    {gameStarted && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#fbbf24',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(251, 191, 36, 0.2)',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 0.5
                        }}
                      >
                        {players.indexOf(player) + 1}
                      </Typography>
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}
                    >
                      {player.name}
                    </Typography>
                    {player.isHost && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#fbbf24',
                          fontSize: '0.7rem'
                        }}
                      >
                        👑
                      </Typography>
                    )}
                    {/* Show bot icon next to name during game */}
                    {player.isBot && gameStarted && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#a78bfa',
                          fontSize: '0.8rem',
                          ml: 0.5
                        }}
                      >
                        🤖
                      </Typography>
                    )}
                  </Box>

                  {/* Bot indicator - only show before game starts */}
                  {player.isBot && !gameStarted && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#a78bfa',
                        fontSize: '0.8rem',
                        ml: 0.5
                      }}
                    >
                      🤖
                    </Typography>
                  )}
                </Box>

                {/* Right side - Action buttons and cash display */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {/* Change appearance button - only for current player and only before game starts */}
                  {!gameStarted && player.id === currentPlayerId && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        onChangeAppearance && onChangeAppearance();
                      }}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        '&:hover': {
                          color: '#60a5fa',
                          backgroundColor: 'rgba(96, 165, 250, 0.1)',
                          border: '1px solid rgba(96, 165, 250, 0.3)'
                        }
                      }}
                    >
                      <Palette fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        Change appearance
                      </Typography>
                    </IconButton>
                  )}

                  {/* Kick button */}
                  {!gameStarted && player.id !== currentPlayerId && isHost && (
                    <IconButton
                      size="small"
                      onClick={() => onKickPlayer && onKickPlayer(player.id)}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        '&:hover': {
                          color: '#ef4444',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)'
                        }
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  )}

                  {/* Cash display - when game started */}
                  {gameStarted && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        minWidth: '60px',
                        textAlign: 'right'
                      }}
                    >
                      ${player.money?.toLocaleString() || '1,500'}
                    </Typography>
                  )}
                </Box>
              </Box>
            </StyledPlayerCard>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PlayerList;