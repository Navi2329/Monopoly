import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Alert,
  Paper,
  Divider,
  TextField,
  InputAdornment,
  Slider,
  Button
} from '@mui/material';
import {
  People,
  Lock,
  SmartToy,
  Login,
  Map,
  Casino,
  MonetizationOn,
  Home,
  Gavel,
  Build,
  AttachMoney,
  Shuffle,
  Visibility
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledSettingRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 0),
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  '&:last-child': {
    borderBottom: 'none'
  }
}));

const StyledSettingInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flex: 1
}));

const StyledIcon = styled(Box)(({ theme }) => ({
  width: 36,
  height: 36,
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  color: '#60a5fa'
}));

const StyledSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: '#60a5fa',
    '& + .MuiSwitch-track': {
      backgroundColor: '#60a5fa',
    },
  },
  '& .MuiSwitch-track': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    borderColor: '#60a5fa',
  },
  '& .MuiSelect-icon': {
    color: 'white',
  }
}));

const GameSettings = ({
  settings = {},
  onSettingsChange = () => { },
  onMapPreviewOpen = () => { },
  isHost = true,
  players = [],
  maxPlayers = 8,
  gameStarted = false,
  playerJoined = false
}) => {
  const [localSettings, setLocalSettings] = useState({
    maxPlayers: 4,
    privateRoom: true,
    allowBots: false,
    onlyLoggedUsers: false,
    boardMap: 'Classic',
    doubleRentFullSet: false,
    vacationCash: false,
    auction: false,
    noRentInPrison: false,
    mortgage: false,
    evenBuild: false,
    startingCash: 1500,
    randomizePlayerOrder: false,
    ...settings
  });

  useEffect(() => {
    // Only update localSettings if settings prop changes and is different
    if (settings && Object.keys(settings).length > 0) {
      setLocalSettings(prev => {
        // Only update if something actually changed
        const changed = Object.keys(settings).some(key => prev[key] !== settings[key]);
        return changed ? { ...prev, ...settings } : prev;
      });
    }
  }, [settings]);

  const totalPlayers = players.length;

  // Starting cash options from 500 to 4000
  const startingCashOptions = [
    500, 750, 1000, 1200, 1500, 2000, 2500, 3000, 3500, 4000
  ];

  const handleChange = (key, value) => {
    if (key === 'maxPlayers' && value < totalPlayers) {
      return;
    }

    let newSettings = { ...localSettings, [key]: value };
    // Ensure both doubleRentOnFullSet and doubleRentFullSet are always in sync
    if (key === 'doubleRentOnFullSet' || key === 'doubleRentFullSet') {
      newSettings.doubleRentOnFullSet = value;
      newSettings.doubleRentFullSet = value;
    }
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleMapSelect = (selectedMap) => {
    handleChange('boardMap', selectedMap);
  };

  const isDisabled = !isHost || !playerJoined || gameStarted;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography
        variant="h6"
        sx={{
          color: 'white',
          fontWeight: 600,
          fontSize: '1rem',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Casino sx={{ fontSize: '1.2rem' }} />
        Game Settings
      </Typography>

      {/* Maximum Players */}
      <StyledSettingRow>
        <StyledSettingInfo>
          <StyledIcon>
            <People fontSize="small" />
          </StyledIcon>
          <Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
              Maximum players
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              How many players can join the game
            </Typography>
          </Box>
        </StyledSettingInfo>
        <StyledSelect
          value={localSettings.maxPlayers ?? 4}
          onChange={(e) => handleChange('maxPlayers', e.target.value)}
          disabled={isDisabled}
          size="small"
          sx={{ minWidth: 80 }}
        >
          {[2, 3, 4, 5, 6, 7, 8].map(num => (
            <MenuItem
              key={num}
              value={num}
              disabled={num < totalPlayers}
              sx={{
                color: num < totalPlayers ? 'rgba(255, 255, 255, 0.4)' : 'white',
                backgroundColor: 'rgba(30, 41, 59, 0.9)'
              }}
            >
              {num}
            </MenuItem>
          ))}
        </StyledSelect>
      </StyledSettingRow>

      {/* Private Room */}
      <StyledSettingRow>
        <StyledSettingInfo>
          <StyledIcon>
            <Lock fontSize="small" />
          </StyledIcon>
          <Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
              Private room
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Private rooms can be accessed using the room URL only
            </Typography>
          </Box>
        </StyledSettingInfo>
        <StyledSwitch
          checked={!!localSettings.privateRoom}
          onChange={(e) => handleChange('privateRoom', e.target.checked)}
          disabled={isDisabled}
        />
      </StyledSettingRow>

      {/* Allow Bots */}
      <StyledSettingRow>
        <StyledSettingInfo>
          <StyledIcon>
            <SmartToy fontSize="small" />
          </StyledIcon>
          <Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
              Allow bots to join
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Bots will join the game based on availability
            </Typography>
          </Box>
        </StyledSettingInfo>
        <StyledSwitch
          checked={!!localSettings.allowBots}
          onChange={(e) => handleChange('allowBots', e.target.checked)}
          disabled={isDisabled}
        />
      </StyledSettingRow>

      {/* Only Logged Users */}
      <StyledSettingRow>
        <StyledSettingInfo>
          <StyledIcon>
            <Login fontSize="small" />
          </StyledIcon>
          <Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
              Only logged-in users
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Only allow logged-in users to join the game
            </Typography>
          </Box>
        </StyledSettingInfo>
        <StyledSwitch
          checked={!!localSettings.onlyLoggedUsers}
          onChange={(e) => handleChange('onlyLoggedUsers', e.target.checked)}
          disabled={isDisabled}
        />
      </StyledSettingRow>

      {/* Board Map */}
      <StyledSettingRow>
        <StyledSettingInfo>
          <StyledIcon>
            <Map fontSize="small" />
          </StyledIcon>
          <Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
              Board map
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Change map tiles, properties and stacks
            </Typography>
          </Box>
        </StyledSettingInfo>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          <Typography variant="body2" sx={{ color: 'white' }}>
            {localSettings.boardMap ?? 'Classic'}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={onMapPreviewOpen}
            disabled={isDisabled}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              fontSize: '0.7rem',
              padding: '2px 8px',
              minWidth: 'auto',
              height: '24px',
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
      </StyledSettingRow>

      {/* Gameplay Rules Header */}
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}
        >
          Gameplay rules
        </Typography>
      </Box>

      {/* Double Rent */}
      <StyledSettingRow>
        <StyledSettingInfo>
          <StyledIcon sx={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#10b981' }}>
            <MonetizationOn fontSize="small" />
          </StyledIcon>
          <Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
              x2 rent on full-set properties
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              If a player owns a full property set, the base rent payment will be doubled
            </Typography>
          </Box>
        </StyledSettingInfo>
        <StyledSwitch
          checked={!!localSettings.doubleRentOnFullSet}
          onChange={(e) => handleChange('doubleRentOnFullSet', e.target.checked)}
          disabled={isDisabled}
        />
      </StyledSettingRow>

      {/* Vacation Cash */}
      <StyledSettingRow>
        <StyledSettingInfo>
          <StyledIcon sx={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#10b981' }}>
            <AttachMoney fontSize="small" />
          </StyledIcon>
          <Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
              Vacation cash
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              If a player lands on Vacation, all collected money from taxes and bank payments will be earned
            </Typography>
          </Box>
        </StyledSettingInfo>
        <StyledSwitch
          checked={!!localSettings.vacationCash}
          onChange={(e) => handleChange('vacationCash', e.target.checked)}
          disabled={isDisabled}
        />
      </StyledSettingRow>

      {/* Auction */}
      <StyledSettingRow>
        <StyledSettingInfo>
          <StyledIcon sx={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Gavel fontSize="small" />
          </StyledIcon>
          <Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
              Auction
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              If someone skips purchasing the property landed on, it will be sold to the highest bidder
            </Typography>
          </Box>
        </StyledSettingInfo>
        <StyledSwitch
          checked={!!localSettings.auction}
          onChange={(e) => handleChange('auction', e.target.checked)}
          disabled={isDisabled}
        />
      </StyledSettingRow>

      {/* Don't collect rent while in prison */}
      <StyledSettingRow>
        <StyledSettingInfo>
          <StyledIcon sx={{ backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' }}>
            <Build fontSize="small" />
          </StyledIcon>
          <Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
              Don't collect rent while in prison
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Rent will not be collected when landing on properties whose owners are in prison
            </Typography>
          </Box>
        </StyledSettingInfo>
        <StyledSwitch
          checked={!!localSettings.noRentInPrison}
          onChange={(e) => handleChange('noRentInPrison', e.target.checked)}
          disabled={isDisabled}
        />
      </StyledSettingRow>

      {/* Mortgage */}
      <StyledSettingRow>
        <StyledSettingInfo>
          <StyledIcon sx={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#10b981' }}>
            <Home fontSize="small" />
          </StyledIcon>
          <Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
              Mortgage
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Mortgage properties to earn 50% of their cost, but you won't get paid rent when players land on them
            </Typography>
          </Box>
        </StyledSettingInfo>
        <StyledSwitch
          checked={!!localSettings.mortgage}
          onChange={(e) => handleChange('mortgage', e.target.checked)}
          disabled={isDisabled}
        />
      </StyledSettingRow>

      {/* Even build */}
      <StyledSettingRow>
        <StyledSettingInfo>
          <StyledIcon sx={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>
            <Build fontSize="small" />
          </StyledIcon>
          <Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
              Even build
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Houses and hotels must be built up and sold off evenly within a property set
            </Typography>
          </Box>
        </StyledSettingInfo>
        <StyledSwitch
          checked={!!localSettings.evenBuild}
          onChange={(e) => handleChange('evenBuild', e.target.checked)}
          disabled={isDisabled}
        />
      </StyledSettingRow>

      {/* Starting Cash */}
      <StyledSettingRow>
        <StyledSettingInfo>
          <StyledIcon sx={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#10b981' }}>
            <AttachMoney fontSize="small" />
          </StyledIcon>
          <Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
              Starting cash
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Adjust how much money players start the game with
            </Typography>
          </Box>
        </StyledSettingInfo>
        <StyledSelect
          value={localSettings.startingCash ?? 1500}
          onChange={(e) => handleChange('startingCash', e.target.value)}
          disabled={isDisabled}
          size="small"
          sx={{ minWidth: 100 }}
        >
          {startingCashOptions.map(amount => (
            <MenuItem
              key={amount}
              value={amount}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(30, 41, 59, 0.9)'
              }}
            >
              ${amount.toLocaleString()}
            </MenuItem>
          ))}
        </StyledSelect>
      </StyledSettingRow>

      {/* Randomize Order */}
      <StyledSettingRow>
        <StyledSettingInfo>
          <StyledIcon sx={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>
            <Shuffle fontSize="small" />
          </StyledIcon>
          <Box>
            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
              Randomize player order
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Randomly reorder players at the beginning of the game
            </Typography>
          </Box>
        </StyledSettingInfo>
        <StyledSwitch
          checked={!!localSettings.randomizePlayerOrder}
          onChange={(e) => handleChange('randomizePlayerOrder', e.target.checked)}
          disabled={isDisabled}
        />
      </StyledSettingRow>

      {/* Status Messages */}
      {!playerJoined && (
        <Alert
          severity="warning"
          sx={{
            mt: 3,
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            color: '#ffc107',
            '& .MuiAlert-icon': { color: '#ffc107' }
          }}
        >
          Join the game to access settings
        </Alert>
      )}

      {gameStarted && (
        <Alert
          severity="info"
          sx={{
            mt: 3,
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            color: '#2196f3',
            '& .MuiAlert-icon': { color: '#2196f3' }
          }}
        >
          Settings are locked once the game starts
        </Alert>
      )}

      {!isHost && playerJoined && !gameStarted && (
        <Alert
          severity="info"
          sx={{
            mt: 3,
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            color: '#2196f3',
            '& .MuiAlert-icon': { color: '#2196f3' }
          }}
        >
          Only the host can modify game settings
        </Alert>
      )}
    </Box>
  );
};

export default GameSettings;
