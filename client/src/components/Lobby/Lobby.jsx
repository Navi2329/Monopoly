import React, { useState, useRef } from 'react';
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
  Chip
} from '@mui/material';
import { Casino as CasinoIcon, Person as PersonIcon, Lock as LockIcon, Public as PublicIcon, Settings as SettingsIcon, Close as CloseIcon } from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { FaDice } from 'react-icons/fa';

const diceSpin = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  60% { transform: rotate(360deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
`;

const Lobby = ({ onCreatePrivateGame }) => {
  const [playerName, setPlayerName] = useState('');
  const [showDice, setShowDice] = useState(false);
  const [diceAnim, setDiceAnim] = useState(false);
  const [gameModesOpen, setGameModesOpen] = useState(false);
  const { user } = useUser();
  const inputRef = useRef();

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
    if (mode === 'private') {
      const finalName = user ? user.name : playerName;
      if (!finalName || !finalName.trim()) {
        alert('Please enter a name or log in to play.');
        return;
      }
      setGameModesOpen(false);
      onCreatePrivateGame(finalName);
    }
  };

  // Only show dice when input is hovered or focused
  const handleInputFocus = () => setShowDice(true);
  const handleInputBlur = () => setShowDice(false);
  const handleInputMouseEnter = () => setShowDice(true);
  const handleInputMouseLeave = (e) => {
    // Only hide if not focused
    if (document.activeElement !== inputRef.current) setShowDice(false);
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Logo and Title as heading */}
      <Box sx={{ textAlign: 'center', mt: 6, mb: 5 }}>
        <FaDice
          style={{
            fontSize: '4rem',
            color: '#a78bfa',
            marginBottom: 8,
            filter: 'drop-shadow(0 4px 16px rgba(167, 139, 250, 0.25))'
          }}
        />
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#fff',
            WebkitTextStroke: '1px #fff',
            textShadow: '0 2px 12px #fff, 0 1px 0 #fff, 0 4px 12px #0008',
            mb: 0,
            lineHeight: 1.1,
            fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.2rem', lg: '3.8rem' },
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          MONOPOLY
        </Typography>
      </Box>

      {/* Card with Playing As, Name Box, and Button */}
      <Card elevation={2} sx={{ width: '100%', maxWidth: 400, borderRadius: 4, p: 0 }}>
        <CardContent sx={{ p: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Typography
            variant="h6"
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 1
            }}
          >
            <PersonIcon sx={{ fontSize: '1.3rem' }} />
            Playing As
          </Typography>

          <Box sx={{ width: '100%', position: 'relative' }}>
            <TextField
              fullWidth
              value={user ? user.name : playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              variant="outlined"
              size="large"
              inputRef={inputRef}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onMouseEnter={handleInputMouseEnter}
              onMouseLeave={handleInputMouseLeave}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ width: 40, height: 40, display: 'inline-block', opacity: 0, pointerEvents: 'none' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={generateRandomName}
                      tabIndex={-1}
                      sx={{
                        color: 'primary.main',
                        animation: diceAnim ? `${diceSpin} 0.5s` : 'none',
                        transition: 'opacity 0.2s',
                        opacity: showDice ? 1 : 0,
                        pointerEvents: showDice ? 'auto' : 'none',
                      }}
                      aria-label="Randomize name"
                    >
                      <CasinoIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: 500,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  '& fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: '2px',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.light',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                  '& input': {
                    textAlign: 'center',
                  },
                },
                input: {
                  textAlign: 'center',
                },
                '& .MuiInputBase-input': {
                  textAlign: 'center',
                },
                '& .MuiInputBase-input::placeholder': {
                  textAlign: 'center',
                  width: '100%',
                  display: 'block',
                },
              }}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleGameModes}
            sx={{
              mt: 2,
              py: 2,
              borderRadius: 3,
              fontWeight: 700,
              fontSize: '1.1rem',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)',
              boxShadow: '0 4px 16px rgba(167, 139, 250, 0.15)',
              '&:hover': {
                background: 'linear-gradient(135deg, #c084fc 0%, #a78bfa 100%)',
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Game Modes
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
        <DialogTitle sx={{ textAlign: 'center', color: 'white', borderBottom: '1px solid rgba(167, 139, 250, 0.2)', pb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Select Game Mode
          </Typography>
        </DialogTitle>
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

            {/* Public Mode */}
            <Button
              fullWidth
              variant="outlined"
              disabled
              startIcon={<PublicIcon />}
              sx={{
                py: 3,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.4)',
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontSize: '1.1rem',
                borderRadius: 3,
                borderWidth: '2px',
                opacity: 0.6
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Public Game
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.6 }}>
                  Join public games
                </Typography>
                <Chip
                  label="Coming Soon"
                  size="small"
                  sx={{
                    mt: 1,
                    backgroundColor: 'rgba(255, 193, 7, 0.2)',
                    color: '#ffc107',
                    fontWeight: 600
                  }}
                />
              </Box>
            </Button>

            {/* Custom Mode */}
            <Button
              fullWidth
              variant="outlined"
              disabled
              startIcon={<SettingsIcon />}
              sx={{
                py: 3,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.4)',
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontSize: '1.1rem',
                borderRadius: 3,
                borderWidth: '2px',
                opacity: 0.6
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Custom Game
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.6 }}>
                  Custom rules and settings
                </Typography>
                <Chip
                  label="Coming Soon"
                  size="small"
                  sx={{
                    mt: 1,
                    backgroundColor: 'rgba(255, 193, 7, 0.2)',
                    color: '#ffc107',
                    fontWeight: 600
                  }}
                />
              </Box>
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
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
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Lobby;
