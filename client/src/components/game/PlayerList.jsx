import React, { useState, useEffect } from 'react';
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
  Palette,
  SignalWifiOff
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import BotManagement from './BotManagement';



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

const PlayerList = ({ 
  players, 
  currentPlayerId, 
  gameStarted = false, 
  isHost = false, 
  onKickPlayer, 
  onChangeAppearance, 
  playerJoined = true, 
  playerStatuses = {}, 
  isShuffling = false, 
  syncedPlayerMoney = {}, 
  bankruptedPlayers = [], 
  votekickedPlayers = [],
  playerConnections = {},
  room = null,
  socket = null
}) => {
  const hasPlayers = players.length > 0;
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getDisconnectTimeRemaining = (playerId) => {
    const connection = playerConnections[playerId];
    if (!connection || connection.status !== 'disconnected') return null;
    
    // Use remainingTime if provided by server, otherwise calculate from disconnectTime
    if (connection.remainingTime !== null && connection.remainingTime !== undefined) {
      const timeRemaining = connection.remainingTime;
      if (timeRemaining <= 0) return null;
      
      const seconds = Math.floor(timeRemaining / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      
      return { minutes, seconds: remainingSeconds };
    }
    
    // Fallback to disconnectTime calculation
    const disconnectTime = connection.disconnectTime || connection.disconnectedAt;
    if (!disconnectTime) return null;
    
    const timeoutDuration = 0.5 * 60 * 1000; // 2 minutes
    const timeRemaining = Math.max(0, (disconnectTime + timeoutDuration) - currentTime);
    
    if (timeRemaining <= 0) return null;
    
    const seconds = Math.floor(timeRemaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return { minutes, seconds: remainingSeconds };
  };

  return (
    <Box sx={{ maxHeight: 240, overflow: 'auto' }} className={`custom-scrollbar${isShuffling ? ' shuffling' : ''}`}>
      {/* Players List */}
      {hasPlayers && (
        <Box>
          {players.map((player) => {
            const isBankrupt = bankruptedPlayers.includes(player.id);
            const isVoteKicked = votekickedPlayers.includes(player.id);
            const isTemporarilyDisconnected = playerConnections[player.id]?.status === 'disconnected';
            const isPermanentlyDisconnected = player.isDisconnected === true;
            const isDisconnected = isTemporarilyDisconnected || isPermanentlyDisconnected;
            const disconnectTimer = getDisconnectTimeRemaining(player.id);
            const isInactive = isBankrupt || isVoteKicked;
            
            return (
            <StyledPlayerCard 
              key={player.id} 
              elevation={0} 
              isshuffling={isShuffling.toString()} 
              className="player-list-item"
              sx={{
                opacity: isInactive ? 0.5 : isPermanentlyDisconnected ? 0.6 : isTemporarilyDisconnected ? 0.8 : 1,
                filter: isInactive ? 'grayscale(70%)' : isPermanentlyDisconnected ? 'grayscale(50%)' : isTemporarilyDisconnected ? 'grayscale(30%)' : 'none',
                border: isInactive ? '1px solid rgba(239, 68, 68, 0.3)' : 
                       isPermanentlyDisconnected ? '1px solid rgba(239, 68, 68, 0.7)' :
                       isTemporarilyDisconnected ? '1px solid rgba(239, 68, 68, 0.5)' : 
                       '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: isPermanentlyDisconnected ? 'rgba(239, 68, 68, 0.15)' : 
                               isTemporarilyDisconnected ? 'rgba(239, 68, 68, 0.1)' : 
                               undefined,
              }}
            >
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
                    {(() => {
                      const status = playerStatuses[player.id];
                      const isVacation = status && typeof status === 'object' && status.status === 'vacation';
                      return isVacation ? (
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
                      ) : null;
                    })()}

                    {/* Disconnect indicator - removed from here, moved to beside name */}
                  </Box>

                  {/* Player name and icons */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
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
                    {player.isBot && (
                      <Tooltip title={`Bot (${player.difficulty || 'medium'} difficulty)`}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#667eea',
                            fontSize: '0.7rem',
                            ml: 0.5
                          }}
                        >
                          🤖
                        </Typography>
                      </Tooltip>
                    )}
                    
                    {/* Disconnect indicator - show different indicators for temporary vs permanent */}
                    {isPermanentlyDisconnected && gameStarted && (
                      <Chip
                        label="DISCONNECTED"
                        size="small"
                        sx={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          fontSize: '0.65rem',
                          height: '18px',
                          ml: 1,
                          fontWeight: 600,
                          '& .MuiChip-label': {
                            px: 0.5
                          }
                        }}
                      />
                    )}
                    {isTemporarilyDisconnected && disconnectTimer && gameStarted && (
                      <Chip
                        label={`${disconnectTimer.minutes}:${disconnectTimer.seconds.toString().padStart(2, '0')}`}
                        size="small"
                        sx={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          fontSize: '0.7rem',
                          height: '18px',
                          ml: 1,
                          '& .MuiChip-label': {
                            px: 0.5
                          }
                        }}
                      />
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
                        color: isInactive ? 'rgba(255, 255, 255, 0.4)' : 
                               (syncedPlayerMoney[player.id] < 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.9)'),
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        minWidth: '60px',
                        textAlign: 'right'
                      }}
                    >
                      {syncedPlayerMoney[player.id] < 0 ? '-' : ''}${Math.abs(typeof syncedPlayerMoney[player.id] === 'number' ? syncedPlayerMoney[player.id] : (player.money || 1500)).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {/* Bankruptcy/Vote-kick/Disconnect status indicators */}
              {(isInactive || isDisconnected) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: isVoteKicked ? 'rgba(239, 68, 68, 0.8)' : 
                                   isDisconnected ? 'rgba(239, 68, 68, 0.9)' : 
                                   'rgba(107, 114, 128, 0.8)',
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '8px',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {isVoteKicked ? 'KICKED' : 
                   isDisconnected ? 'OFFLINE' : 
                   'BANKRUPT'}
                </Box>
              )}
            </StyledPlayerCard>
            );
          })}
        </Box>
      )}
      
      {/* Bot Management */}
      <BotManagement
        room={room}
        isHost={isHost}
        gameStarted={gameStarted}
        playerJoined={playerJoined}
        socket={socket}
      />
    </Box>
  );
};

export default PlayerList;