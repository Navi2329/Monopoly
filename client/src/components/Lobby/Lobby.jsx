import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Container,
  Card,
  CardContent,
  Fade,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  Casino as CasinoIcon, 
  Person as PersonIcon, 
  Lock as LockIcon, 
  Public as PublicIcon, 
  Settings as SettingsIcon, 
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { FaDice } from 'react-icons/fa';
import socket from '../../socket';

const diceSpin = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  60% { transform: rotate(360deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
`;

const Lobby = ({ onCreatePrivateGame, onJoinGame }) => {
  const [playerName, setPlayerName] = useState('');
  const [showDice, setShowDice] = useState(false);
  const [diceAnim, setDiceAnim] = useState(false);
  const [gameModesOpen, setGameModesOpen] = useState(false);
  const [joinGameDialogOpen, setJoinGameDialogOpen] = useState(false);
  const [allRoomsDialogOpen, setAllRoomsDialogOpen] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const { user } = useUser();
  const inputRef = useRef();

  // Socket effect for handling room list
  useEffect(() => {
    const handleAllRooms = (rooms) => {
      setAvailableRooms(rooms);
      setLoadingRooms(false);
    };

    socket.on('allRooms', handleAllRooms);

    return () => {
      socket.off('allRooms', handleAllRooms);
    };
  }, []);

  const generateRandomName = () => {
    const names = [
      "LuckyLion", "DiceyDan", "VioletVixen", "BoardBoss", "TokenTiger",
      "CashCat", "RailroadRex", "ChanceChamp", "MisterMoney", "QueenQuirk",
      "PropertyPro", "MonopolyMaven", "BankerBob", "ChanceCharlie", "CommunityCarla"
    ];
    setPlayerName(names[Math.floor(Math.random() * names.length)]);
    setDiceAnim(true);
    setTimeout(() => setDiceAnim(false), 500);
  };

  const handleGameModes = () => {
    setGameModesOpen(true);
  };

  const handleGameModeSelect = (mode) => {
    const finalName = user ? user.name : playerName;
    if (!finalName || !finalName.trim()) {
      alert('Please enter a name or log in to play.');
      return;
    }
    if (mode === 'private') {
      setGameModesOpen(false);
      onCreatePrivateGame(finalName);
    } else if (mode === 'join') {
      setGameModesOpen(false);
      setJoinGameDialogOpen(true);
    } else if (mode === 'allRooms') {
      setGameModesOpen(false);
      setAllRoomsDialogOpen(true);
      setLoadingRooms(true);
      socket.emit('getAllRooms');
    }
  };

  const handleJoinGame = () => {
    if (!joinRoomId.trim()) {
      alert('Please enter a Room ID.');
      return;
    }
    const finalName = user ? user.name : playerName;
    if (!finalName || !finalName.trim()) {
      alert('Please enter a name or log in to play.');
      return;
    }
    setJoinGameDialogOpen(false);
    onJoinGame(finalName, joinRoomId.trim());
  };

  const handleJoinRoomFromList = (roomId) => {
    const finalName = user ? user.name : playerName;
    if (!finalName || !finalName.trim()) {
      alert('Please enter a name or log in to play.');
      return;
    }
    setAllRoomsDialogOpen(false);
    onJoinGame(finalName, roomId);
  };

  const handleRefreshRooms = () => {
    setLoadingRooms(true);
    socket.emit('getAllRooms');
  };

  // Improved hover/focus logic for dice icon
  const handleInputFocus = () => setShowDice(true);
  const handleInputBlur = (e) => {
    // Small delay to allow hover to take effect
    setTimeout(() => {
      if (document.activeElement !== inputRef.current) {
        setShowDice(false);
      }
    }, 100);
  };
  const handleInputMouseEnter = () => setShowDice(true);
  const handleInputMouseLeave = (e) => {
    // Only hide if not focused and not hovering over the dice button
    setTimeout(() => {
      const inputFocused = document.activeElement === inputRef.current;
      const hoveringButton = e.relatedTarget?.closest('button');
      if (!inputFocused && !hoveringButton) {
        setShowDice(false);
      }
    }, 100);
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Logo and Title as heading */}
      <Box sx={{ textAlign: 'center', mt: 6, mb: 5 }}>
        <FaDice
          style={{
            fontSize: '4rem',
            color: '#a78bfa',
            animation: diceAnim ? `${diceSpin} 0.8s ease-in-out` : 'none',
            marginBottom: '16px'
          }}
        />
        <Typography
          variant="h2"
          sx={{
            color: 'white',
            fontWeight: 900,
            fontSize: { xs: '2.5rem', sm: '3rem' },
            textShadow: '2px 4px 8px rgba(0,0,0,0.3)',
            background: 'linear-gradient(45deg, #a78bfa 30%, #c084fc 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          MONOPOLY
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 400,
            fontSize: '1.2rem'
          }}
        >
          Roll the dice, build your empire
        </Typography>
      </Box>

      {/* Main card containing form */}
      <Card sx={{
        background: 'linear-gradient(135deg, rgba(50, 41, 74, 0.95) 0%, rgba(30, 19, 50, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: 4,
        border: '2px solid rgba(167, 139, 250, 0.2)',
        minWidth: { xs: '100%', sm: '400px' },
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.3)',
        p: 0
      }}>
        <CardContent sx={{ p: 6 }}>
          {/* Name input section */}
          {!user && (
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white', 
                  mb: 2, 
                  fontWeight: 600, 
                  textAlign: 'center',
                  width: '100%'
                }}
              >
                Enter your name
              </Typography>
              <Box sx={{ position: 'relative' }}>
                <TextField
                  ref={inputRef}
                  fullWidth
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Choose your player name"
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  onMouseEnter={handleInputMouseEnter}
                  onMouseLeave={handleInputMouseLeave}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: 'rgba(167, 139, 250, 0.7)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: 3,
                      '& fieldset': {
                        borderColor: 'rgba(167, 139, 250, 0.3)',
                        borderWidth: '2px'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(167, 139, 250, 0.5)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#a78bfa'
                      }
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                      fontSize: '1.1rem',
                      fontWeight: 500,
                      textAlign: 'left', // Left-align the input text
                      '&::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                        textAlign: 'left' // Left-align the placeholder
                      }
                    }
                  }}
                />
                <Fade in={showDice} timeout={{ enter: 200, exit: 200 }}>
                  <IconButton
                    onClick={generateRandomName}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#a78bfa',
                      background: 'rgba(167, 139, 250, 0.1)',
                      '&:hover': {
                        background: 'rgba(167, 139, 250, 0.2)',
                        transform: 'translateY(-50%) scale(1.1)'
                      },
                      transition: 'all 0.2s ease-in-out',
                      zIndex: 10
                    }}
                  >
                    <CasinoIcon />
                  </IconButton>
                </Fade>
              </Box>
            </Box>
          )}

          {/* Welcome message for logged in users */}
          {user && (
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: 'white', mb: 1, fontWeight: 700 }}>
                Welcome back, {user.name}!
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Ready to build your empire?
              </Typography>
            </Box>
          )}

          {/* Start Game Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleGameModes}
            sx={{
              py: 2.5,
              fontSize: '1.2rem',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)',
              boxShadow: '0 8px 32px rgba(167, 139, 250, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #c084fc 0%, #a78bfa 100%)',
                boxShadow: '0 12px 40px rgba(167, 139, 250, 0.4)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Start Playing
          </Button>
        </CardContent>
      </Card>

      {/* Game Modes Dialog */}
      <Dialog
        open={gameModesOpen}
        onClose={() => setGameModesOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(50, 41, 74, 0.98) 0%, rgba(30, 19, 50, 0.98) 100%)',
            border: '2px solid',
            borderColor: 'rgba(167, 139, 250, 0.2)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', color: 'white', borderBottom: '1px solid rgba(167, 139, 250, 0.2)', pb: 3 }}>Select Game Mode</DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Private Mode */}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleGameModeSelect('private')}
              startIcon={<LockIcon />}
              sx={{
                py: 3,
                borderColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  borderColor: 'primary.light',
                  backgroundColor: 'rgba(167, 139, 250, 0.1)',
                  transform: 'translateY(-2px)',
                },
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontSize: '1.1rem',
                borderRadius: 3,
                borderWidth: '2px',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Private Game
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Create a private room for friends
                </Typography>
              </Box>
            </Button>

            {/* Join Game Option */}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleGameModeSelect('join')}
              startIcon={<LockIcon />}
              sx={{
                py: 3,
                borderColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  borderColor: 'primary.light',
                  backgroundColor: 'rgba(167, 139, 250, 0.1)',
                  transform: 'translateY(-2px)',
                },
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontSize: '1.1rem',
                borderRadius: 3,
                borderWidth: '2px',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Join Game
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Enter Room ID to join a game
                </Typography>
              </Box>
            </Button>

            {/* All Rooms Option */}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => handleGameModeSelect('allRooms')}
              startIcon={<PublicIcon />}
              sx={{
                py: 3,
                borderColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  borderColor: 'primary.light',
                  backgroundColor: 'rgba(167, 139, 250, 0.1)',
                  transform: 'translateY(-2px)',
                },
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontSize: '1.1rem',
                borderRadius: 3,
                borderWidth: '2px',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  All Rooms
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Browse and join available rooms
                </Typography>
              </Box>
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setGameModesOpen(false)}
            startIcon={<CloseIcon />}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 600,
              '&:hover': {
                color: 'white',
              }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join Game Dialog */}
      <Dialog
        open={joinGameDialogOpen}
        onClose={() => setJoinGameDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(50, 41, 74, 0.98) 0%, rgba(30, 19, 50, 0.98) 100%)',
            border: '2px solid',
            borderColor: 'rgba(167, 139, 250, 0.2)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', color: 'white', borderBottom: '1px solid rgba(167, 139, 250, 0.2)', pb: 3 }}>Join Game</DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          <TextField
            fullWidth
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            placeholder="Enter Room ID"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: 'rgba(167, 139, 250, 0.7)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                borderRadius: 3,
                '& fieldset': {
                  borderColor: 'rgba(167, 139, 250, 0.3)',
                  borderWidth: '2px'
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(167, 139, 250, 0.5)'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#a78bfa'
                }
              },
              '& .MuiInputBase-input': {
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 500,
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)'
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setJoinGameDialogOpen(false)}
            startIcon={<CloseIcon />}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 600,
              '&:hover': {
                color: 'white',
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoinGame}
            variant="contained"
            startIcon={<LockIcon />}
            sx={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #c084fc 0%, #a78bfa 100%)',
              },
              borderRadius: 3,
              fontWeight: 700,
              fontSize: '1.1rem',
              textTransform: 'none',
              boxShadow: '0 4px 16px rgba(167, 139, 250, 0.15)',
            }}
          >
            Join
          </Button>
        </DialogActions>
      </Dialog>

      {/* All Rooms Dialog */}
      <Dialog
        open={allRoomsDialogOpen}
        onClose={() => setAllRoomsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(50, 41, 74, 0.98) 0%, rgba(30, 19, 50, 0.98) 100%)',
            border: '2px solid',
            borderColor: 'rgba(167, 139, 250, 0.2)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
            minHeight: '400px'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          color: 'white', 
          borderBottom: '1px solid rgba(167, 139, 250, 0.2)', 
          pb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 600
        }}>
          Available Rooms
          <IconButton
            onClick={handleRefreshRooms}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: 'white',
                backgroundColor: 'rgba(167, 139, 250, 0.1)'
              }
            }}
            disabled={loadingRooms}
          >
            {loadingRooms ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 2, minHeight: '300px' }}>
          {loadingRooms ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress size={40} sx={{ color: 'primary.main' }} />
            </Box>
          ) : availableRooms.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                No rooms available
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                Create a private game or check back later
              </Typography>
            </Box>
          ) : (
            <List>
              {availableRooms.map((room) => (
                <ListItem
                  key={room.id}
                  sx={{
                    borderRadius: 2,
                    mb: 2,
                    backgroundColor: 'rgba(30, 41, 59, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(167, 139, 250, 0.3)'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                          {room.name || `Room ${room.id}`}
                        </Typography>
                        <Chip 
                          label={room.gameState === 'waiting' ? 'Waiting' : room.gameState === 'in-progress' ? 'In Progress' : 'Unknown'}
                          size="small"
                          sx={{
                            backgroundColor: room.gameState === 'waiting' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                            color: room.gameState === 'waiting' ? '#22c55e' : '#fbbf24',
                            fontWeight: 600
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'block' }}>
                        <Typography variant="body2" component="span" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block' }}>
                          Host: {room.hostName} • Players: {room.playerCount}/{room.maxPlayers}
                        </Typography>
                        <Typography variant="caption" component="span" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}>
                          Map: {room.settings?.mapType || 'Classic'} • Money: ${(room.settings?.startingMoney || 1500).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      onClick={() => handleJoinRoomFromList(room.id)}
                      disabled={room.playerCount >= room.maxPlayers}
                      sx={{
                        borderColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          borderColor: 'primary.light',
                          backgroundColor: 'rgba(167, 139, 250, 0.1)',
                        },
                        '&:disabled': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          color: 'rgba(255, 255, 255, 0.4)'
                        }
                      }}
                    >
                      {room.playerCount >= room.maxPlayers ? 'Full' : 'Join'}
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setAllRoomsDialogOpen(false)}
            startIcon={<CloseIcon />}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 600,
              '&:hover': {
                color: 'white',
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Lobby;