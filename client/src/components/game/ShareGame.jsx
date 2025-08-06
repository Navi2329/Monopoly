import React, { useState, useCallback } from 'react';
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
  InputAdornment,
  Snackbar,
  Tooltip,
  Slider
} from '@mui/material';
import {
  Close,
  Settings,
  ContentCopy,
  PersonAdd,
  Check,
  People,
  Lock,
  SmartToy,
  Login,
  Map,
  MonetizationOn,
  Home,
  Gavel,
  Build,
  AttachMoney,
  Shuffle,
  AccountCircle
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Developer card options
const treasureCards = [
  { id: 'treasure-1', message: 'Your phone died. Pay $50 for a repair.' },
  { id: 'treasure-2', message: 'Happy holidays! Receive $20' },
  { id: 'treasure-3', message: 'You host a party. Collect $50 from every player for equipment.' },
  { id: 'treasure-4', message: 'Tax refund. Collect $100.' },
  { id: 'treasure-5', message: 'Your car has ran out of gas. Pay $50.' },
  { id: 'treasure-6', message: 'You found a wallet containing some cash. Collect $200.' },
  { id: 'treasure-7', message: 'From trading stocks you earned $50.' },
  { id: 'treasure-8', message: 'You received $100 from your sibling.' },
  { id: 'treasure-9', message: 'Car rental insurance. Pay $60.' },
  { id: 'treasure-10', message: 'You have won third prize in a lottery. Collect $15.' },
  { id: 'treasure-11', message: 'From gift cards you get $100' },
  { id: 'treasure-12', message: 'You got a Pardon card from the treasures stack' },
  { id: 'treasure-13', message: 'Advance to Start' }
];

const surpriseCards = [
  { id: 'surprise-1', message: 'You got a Pardon card from the surprises stack' },
  { id: 'surprise-2', message: 'Have a redesign for your properties. Pay $25 for each house and $100 for each hotel.' },
  { id: 'surprise-3', message: 'You lost a bet. Pay each player $50.' },
  { id: 'surprise-4', message: 'Pay tax of $20.' },
  { id: 'surprise-5', message: 'Have an adventure to New York.' },
  { id: 'surprise-6', message: 'Advance to Shanghai.' },
  { id: 'surprise-7', message: 'Advance to Venice.' },
  { id: 'surprise-8', message: 'Advance to Start.' },
  { id: 'surprise-9', message: 'Go to prison' },
  { id: 'surprise-10', message: 'From a scholarship you get $100.' },
  { id: 'surprise-11', message: 'Go back 3 steps' },
  { id: 'surprise-12', message: 'You have a new investment. Receive $150.' }
];

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

const ShareGame = ({ 
  gameUrl, 
  devDiceEnabled, 
  devDice1, 
  devDice2, 
  onDevDiceChange, 
  playerJoined, 
  gameStarted, 
  gameSettings, 
  players, 
  syncedPlayerMoney,
  onPlayerCashChange,
  devTreasureCard,
  devSurpriseCard,
  onDevCardChange
}) => {
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  // Extract room ID from the URL (assume /game/:roomId)
  const roomId = gameUrl?.split('/').pop() || '';

  const showJoinToast = () => {
    setToastOpen(true);
  };

  const handleToastClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setToastOpen(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      //
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

  const handlePlayerCashChange = useCallback((playerId, newCash) => {
    if (onPlayerCashChange) {
      onPlayerCashChange(playerId, newCash);
    }
  }, [onPlayerCashChange]);

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
          Share this game
        </Typography>
        <IconButton
          size="small"
          sx={{ color: 'rgba(255, 255, 255, 0.6)' }}
          onClick={!playerJoined ? showJoinToast : undefined}
          disabled={false}
        >
          <Box sx={{ fontSize: '12px' }}>ℹ️</Box>
        </IconButton>
      </Box>
      {/* URL Input and Copy Button */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          value={roomId}
          size="small"
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
          onClick={playerJoined ? copyToClipboard : showJoinToast}
          variant={copied ? "contained" : "outlined"}
          size="small"
          sx={{
            minWidth: 70,
            fontSize: '11px',
            backgroundColor: copied ? '#059669' : 'rgba(255, 255, 255, 0.13)',
            borderColor: copied ? '#059669' : 'rgba(255, 255, 255, 0.13)',
            color: 'white',
            opacity: playerJoined ? 1 : 0.7,
            cursor: playerJoined ? 'pointer' : 'not-allowed',
            '&:hover': {
              backgroundColor: copied ? '#047857' : 'rgba(255, 255, 255, 0.18)',
              borderColor: copied ? '#047857' : 'rgba(255, 255, 255, 0.18)'
            }
          }}
          startIcon={copied ? <Check sx={{ fontSize: '12px' }} /> : <ContentCopy sx={{ fontSize: '12px' }} />}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </Box>
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {!gameStarted ? (
          <Button
            variant="contained"
            size="small"
            fullWidth
            sx={{
              fontSize: '11px',
              backgroundColor: '#059669',
              '&:hover': { backgroundColor: '#047857' },
              textTransform: 'none',
              minWidth: 0,
              maxWidth: '100%',
              opacity: playerJoined ? 1 : 0.7,
              cursor: playerJoined ? 'pointer' : 'not-allowed',
            }}
            startIcon={<PersonAdd sx={{ fontSize: '12px' }} />}
            onClick={playerJoined ? undefined : showJoinToast}
            disabled={!playerJoined}
          >
            Invite friends
          </Button>
        ) : (
          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={() => setSettingsOpen(true)}
            sx={{
              fontSize: '11px',
              backgroundColor: '#2563eb',
              '&:hover': { backgroundColor: '#1d4ed8' },
              textTransform: 'none',
              minWidth: 0,
              maxWidth: '100%',
            }}
            startIcon={<Settings sx={{ fontSize: '12px' }} />}
          >
            Settings
          </Button>
        )}
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
              {gameStarted ? 'Game Settings' : 'Developer Options'}
            </Typography>
            <IconButton
              onClick={() => setSettingsOpen(false)}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <Close />
            </IconButton>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          <CardContent sx={{ p: 3, pt: 2, maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Actual Game Settings (public, non-editable) */}
            {gameStarted && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, textAlign: 'center', mb: 2 }}>
                  Room Settings
                </Typography>
                {/* Room Settings Group */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <Tooltip title="Settings cannot be changed after starting the game" placement="right" arrow enterDelay={200}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <People sx={{ color: '#60a5fa', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>Maximum players</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>How many players can join the game</Typography>
                      </Box>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>{gameSettings.maxPlayers}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Settings cannot be changed after starting the game" placement="right" arrow enterDelay={200}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Lock sx={{ color: '#60a5fa', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>Private room</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Private rooms can be accessed using the room URL only</Typography>
                      </Box>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>{gameSettings.privateRoom ? 'On' : 'Off'}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Settings cannot be changed after starting the game" placement="right" arrow enterDelay={200}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <SmartToy sx={{ color: '#60a5fa', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>Allow bots to join</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Bots will join the game based on availability</Typography>
                      </Box>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>{gameSettings.allowBots ? 'On' : 'Off'}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Settings cannot be changed after starting the game" placement="right" arrow enterDelay={200}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Login sx={{ color: '#60a5fa', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>Only logged-in users</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Only allow logged-in users to join the game</Typography>
                      </Box>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>{gameSettings.onlyLoggedUsers ? 'On' : 'Off'}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Settings cannot be changed after starting the game" placement="right" arrow enterDelay={200}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                      <Map sx={{ color: '#60a5fa', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>Board map</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Change map tiles, properties and stacks</Typography>
                      </Box>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>{gameSettings.boardMap || 'Classic'}</Typography>
                    </Box>
                  </Tooltip>
                </Box>
                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.08)' }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, textAlign: 'center', mb: 2 }}>
                  Gameplay rules
                </Typography>
                {/* Gameplay Rules Group */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <Tooltip title="Settings cannot be changed after starting the game" placement="right" arrow enterDelay={200}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <MonetizationOn sx={{ color: '#10b981', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>x2 rent on full-set properties</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>If a player owns a full property set, the base rent payment will be doubled</Typography>
                      </Box>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>{gameSettings.doubleRentOnFullSet ? 'On' : 'Off'}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Settings cannot be changed after starting the game" placement="right" arrow enterDelay={200}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <AttachMoney sx={{ color: '#10b981', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>Vacation cash</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>If a player lands on Vacation, all collected money from taxes and bank payments will be earned</Typography>
                      </Box>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>{gameSettings.vacationCash ? 'On' : 'Off'}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Settings cannot be changed after starting the game" placement="right" arrow enterDelay={200}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Gavel sx={{ color: '#f59e0b', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>Auction</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>If someone skips purchasing the property landed on, it will be sold to the highest bidder</Typography>
                      </Box>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>{gameSettings.auction ? 'On' : 'Off'}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Settings cannot be changed after starting the game" placement="right" arrow enterDelay={200}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Build sx={{ color: '#6b7280', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>Don't collect rent while in prison</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Rent will not be collected when landing on properties whose owners are in prison</Typography>
                      </Box>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>{gameSettings.noRentInPrison ? 'On' : 'Off'}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Settings cannot be changed after starting the game" placement="right" arrow enterDelay={200}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Home sx={{ color: '#10b981', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>Mortgage</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Mortgage properties to earn 50% of their cost, but you won't get paid rent when players land on them</Typography>
                      </Box>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>{gameSettings.mortgage ? 'On' : 'Off'}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Settings cannot be changed after starting the game" placement="right" arrow enterDelay={200}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Build sx={{ color: '#a78bfa', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>Even build</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Houses and hotels must be built up and sold off evenly within a property set</Typography>
                      </Box>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>{gameSettings.evenBuild ? 'On' : 'Off'}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Settings cannot be changed after starting the game" placement="right" arrow enterDelay={200}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <AttachMoney sx={{ color: '#10b981', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>Starting cash</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Adjust how much money players start the game with</Typography>
                      </Box>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>${gameSettings.startingCash}</Typography>
                    </Box>
                  </Tooltip>
                  <Tooltip title="Settings cannot be changed after starting the game" placement="right" arrow enterDelay={200}>
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                      <Shuffle sx={{ color: '#a78bfa', mr: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>Randomize player order</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Randomly reorder players at the beginning of the game</Typography>
                      </Box>
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>{gameSettings.randomizePlayerOrder ? 'On' : 'Off'}</Typography>
                    </Box>
                  </Tooltip>
                </Box>
              </Box>
            )}

            {/* Developer Options (always shown) */}
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

            {/* Cash Sliders for Players */}
            {players && players.length > 0 && (
              <>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, mt: 4, mb: 2 }}>
                  Player Cash
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {players.map((player, index) => (
                    <Box key={player.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '120px' }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: player.color,
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: 'white',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                          }}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </Box>
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, fontSize: '13px' }}>
                          {player.name}
                        </Typography>
                      </Box>
                      <Slider
                        value={syncedPlayerMoney[player.id] || player.money || 0}
                        onChange={(event, newValue) => handlePlayerCashChange(player.id, newValue)}
                        valueLabelDisplay="auto"
                        min={0}
                        max={10000}
                        step={10}
                        sx={{
                          flex: 1,
                          mx: 2,
                          color: 'rgba(139, 92, 246, 0.8)',
                          '& .MuiSlider-thumb': {
                            '&:hover, &.Mui-focusVisible': {
                              boxShadow: '0px 0px 0px 8px rgba(139, 92, 246, 0.16)',
                            },
                            '&.Mui-active': {
                              boxShadow: '0px 0px 0px 14px rgba(139, 92, 246, 0.16)',
                            },
                          },
                          '& .MuiSlider-track': {
                            backgroundColor: 'rgba(139, 92, 246, 0.3)',
                          },
                          '& .MuiSlider-rail': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          },
                          '& .MuiSlider-valueLabel': {
                            backgroundColor: 'rgba(139, 92, 246, 0.9)',
                            color: 'white',
                            fontSize: '12px',
                            '&::before': {
                              borderTop: '6px solid rgba(139, 92, 246, 0.9)',
                              borderLeft: '6px solid transparent',
                              borderRight: '6px solid transparent',
                              content: '""',
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                            },
                          },
                        }}
                      />
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, minWidth: '60px', textAlign: 'right' }}>
                        ${syncedPlayerMoney[player.id] || player.money || 0}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {/* Developer Card Selection */}
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, mt: 4, mb: 2 }}>
              Force Next Cards (Developer)
            </Typography>
            
            {/* Treasure Card Selection */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                Next Treasure Card
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={devTreasureCard || 'random'}
                  onChange={(e) => onDevCardChange && onDevCardChange('treasure', e.target.value === 'random' ? null : e.target.value)}
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
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  <MenuItem
                    value="random"
                    sx={{
                      fontSize: '13px',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(139, 92, 246, 0.2)'
                      }
                    }}
                  >
                    Random (Default)
                  </MenuItem>
                  {treasureCards.map(card => (
                    <MenuItem
                      key={card.id}
                      value={card.id}
                      sx={{
                        fontSize: '12px',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(139, 92, 246, 0.2)'
                        }
                      }}
                    >
                      {card.message}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Surprise Card Selection */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: 0.5 }}>
                Next Surprise Card
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={devSurpriseCard || 'random'}
                  onChange={(e) => onDevCardChange && onDevCardChange('surprise', e.target.value === 'random' ? null : e.target.value)}
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
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  <MenuItem
                    value="random"
                    sx={{
                      fontSize: '13px',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(139, 92, 246, 0.2)'
                      }
                    }}
                  >
                    Random (Default)
                  </MenuItem>
                  {surpriseCards.map(card => (
                    <MenuItem
                      key={card.id}
                      value={card.id}
                      sx={{
                        fontSize: '12px',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(139, 92, 246, 0.2)'
                        }
                      }}
                    >
                      {card.message}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </StyledCard>
      </StyledModal>
      {/* Toast for join the game first */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={2000}
        onClose={handleToastClose}
        message="Join the game first"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default ShareGame;
