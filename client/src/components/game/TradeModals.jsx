import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  Slider,
  TextField,
  Paper,
  IconButton,
  Chip,
  Divider,
  Avatar,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Close,
  SwapHoriz,
  Add,
  Remove,
  AttachMoney,
  Note
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components for consistent design
const StyledModal = styled(Modal)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
}));

const ModalContent = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
  boxShadow: '0 20px 40px 0 rgba(0, 0, 0, 0.3)',
  borderRadius: '20px',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
  padding: theme.spacing(3),
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflow: 'auto',
  position: 'relative',
  outline: 'none',
}));

const PlayerButton = styled(Button)(({ theme, selected }) => ({
  background: selected 
    ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.8))',
  color: 'white',
  border: selected ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  width: '100%',
  textTransform: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: theme.spacing(2),
  '&:hover': {
    background: selected
      ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
      : 'linear-gradient(135deg, rgba(51, 65, 85, 0.9), rgba(71, 85, 105, 0.9))',
    transform: 'translateY(-2px)',
  },
}));

const PropertyCard = styled(Button)(({ theme, selected, isowned }) => ({
  background: selected 
    ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
    : isowned === 'true' 
      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(21, 128, 61, 0.2))'
      : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(51, 65, 85, 0.8))',
  border: selected ? '2px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  padding: theme.spacing(1.5),
  cursor: isowned === 'true' ? 'pointer' : 'not-allowed',
  opacity: isowned === 'true' ? 1 : 0.5,
  transition: 'all 0.2s ease',
  color: 'white',
  textTransform: 'none',
  width: '100%',
  marginBottom: theme.spacing(1),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  '&:hover': isowned === 'true' ? {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  } : {},
}));

const TradeSection = styled(Box)(({ theme }) => ({
  borderRadius: '16px',
  padding: theme.spacing(2),
  minHeight: '200px',
}));

// Player Selection Modal - First step in trade creation
export const PlayerSelectionModal = ({ 
  isOpen, 
  onClose, 
  players, 
  currentPlayerId, 
  onSelectPlayer 
}) => {
  const otherPlayers = players.filter(player => player.id !== currentPlayerId);

  return (
    <StyledModal open={isOpen} onClose={onClose}>
      <ModalContent sx={{ minWidth: '500px', maxWidth: '600px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Create a trade
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <Close />
          </IconButton>
        </Box>

        <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.8)' }}>
          Select a player to trade with:
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {otherPlayers.map((player) => (
            <PlayerButton
              key={player.id}
              onClick={() => onSelectPlayer(player)}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: player.color,
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                {player.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {player.name}
              </Typography>
            </PlayerButton>
          ))}
        </Box>
      </ModalContent>
    </StyledModal>
  );
};

// Create/Edit Trade Modal - Main trade creation interface
export const CreateTradeModal = ({ 
  isOpen, 
  onClose, 
  currentPlayer,
  targetPlayer,
  syncedPlayerMoney,
  playerProperties,
  targetProperties,
  onCreateTrade,
  existingTrade = null // For editing/negotiating
}) => {
  const [currentPlayerMoney, setCurrentPlayerMoney] = useState(0);
  const [targetPlayerMoney, setTargetPlayerMoney] = useState(0);
  const [selectedCurrentProperties, setSelectedCurrentProperties] = useState([]);
  const [selectedTargetProperties, setSelectedTargetProperties] = useState([]);
  const [note, setNote] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);

  // Initialize with existing trade data if editing
  useEffect(() => {
    // console.log('[TRADE DEBUG] Modal opened with:');
    // console.log('currentPlayer:', currentPlayer);
    // console.log('targetPlayer:', targetPlayer);
    // console.log('currentPlayer.money:', currentPlayer?.money);
    // console.log('targetPlayer.money:', targetPlayer?.money);
    // console.log('syncedPlayerMoney:', syncedPlayerMoney);
    // console.log('syncedPlayerMoney for currentPlayer:', syncedPlayerMoney?.[currentPlayer?.id]);
    // console.log('syncedPlayerMoney for targetPlayer:', syncedPlayerMoney?.[targetPlayer?.id]);
    
    if (existingTrade && currentPlayer && targetPlayer) {
      setCurrentPlayerMoney(existingTrade.offers[currentPlayer.id]?.money || 0);
      setTargetPlayerMoney(existingTrade.offers[targetPlayer.id]?.money || 0);
      setSelectedCurrentProperties(existingTrade.offers[currentPlayer.id]?.properties || []);
      setSelectedTargetProperties(existingTrade.offers[targetPlayer.id]?.properties || []);
      setNote(existingTrade.note || '');
    } else {
      // Reset values when not editing
      setCurrentPlayerMoney(0);
      setTargetPlayerMoney(0);
      setSelectedCurrentProperties([]);
      setSelectedTargetProperties([]);
      setNote('');
      setShowNoteField(false);
    }
  }, [existingTrade, currentPlayer, targetPlayer, syncedPlayerMoney]);

  // Helper function to get current money amounts
  const getCurrentPlayerMoney = () => {
    return syncedPlayerMoney?.[currentPlayer?.id] ?? currentPlayer?.money ?? 0;
  };

  const getTargetPlayerMoney = () => {
    return syncedPlayerMoney?.[targetPlayer?.id] ?? targetPlayer?.money ?? 0;
  };

  const handlePropertyToggle = (propertyName, isCurrentPlayer) => {
    if (isCurrentPlayer) {
      setSelectedCurrentProperties(prev => 
        prev.includes(propertyName) 
          ? prev.filter(p => p !== propertyName)
          : [...prev, propertyName]
      );
    } else {
      setSelectedTargetProperties(prev => 
        prev.includes(propertyName) 
          ? prev.filter(p => p !== propertyName)
          : [...prev, propertyName]
      );
    }
  };

  const handleSendTrade = () => {
    if (!currentPlayer || !targetPlayer) return;
    
    const tradeData = {
      targetPlayerId: targetPlayer.id,
      offers: {
        [currentPlayer.id]: {
          money: currentPlayerMoney,
          properties: selectedCurrentProperties
        },
        [targetPlayer.id]: {
          money: targetPlayerMoney,
          properties: selectedTargetProperties
        }
      },
      note: note.trim(),
      isNegotiation: !!existingTrade
    };

    onCreateTrade(tradeData);
    onClose();
  };

  const isTradeValid = () => {
    const currentOffer = currentPlayerMoney > 0 || selectedCurrentProperties.length > 0;
    const targetOffer = targetPlayerMoney > 0 || selectedTargetProperties.length > 0;
    return currentOffer || targetOffer; // At least one side must offer something
  };

  return (
    <StyledModal open={isOpen} onClose={onClose}>
      <ModalContent sx={{ minWidth: '800px', maxWidth: '1000px' }}>
        {!currentPlayer || !targetPlayer ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Loading trade information...
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {existingTrade ? 'Negotiate trade' : 'Create a trade'}
              </Typography>
              <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                <Close />
              </IconButton>
            </Box>

            {/* Player Headers */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: currentPlayer.color, width: 40, height: 40 }}>
                  {currentPlayer.name.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {currentPlayer.name}
                </Typography>
              </Box>
              
              <SwapHoriz sx={{ fontSize: 32, color: 'rgba(255, 255, 255, 0.6)' }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {targetPlayer.name}
                </Typography>
                <Avatar sx={{ bgcolor: targetPlayer.color, width: 40, height: 40 }}>
                  {targetPlayer.name.charAt(0).toUpperCase()}
                </Avatar>
              </Box>
            </Box>

        {/* Money Sliders */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            {/* {console.log('[SLIDER DEBUG] currentPlayerMoney:', currentPlayerMoney, 'max:', getCurrentPlayerMoney())} */}
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: 'white' }}>0</Typography>
              <Slider
                value={currentPlayerMoney}
                onChange={(_, value) => setCurrentPlayerMoney(value)}
                max={getCurrentPlayerMoney()}
                step={25}
                sx={{
                  flex: 1,
                  mx: 2,
                  color: '#a855f7',
                  '& .MuiSlider-thumb': {
                    bgcolor: '#a855f7',
                  },
                  '& .MuiSlider-track': {
                    bgcolor: '#a855f7',
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              />
              <Typography sx={{ color: 'white' }}>{getCurrentPlayerMoney()}</Typography>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
              <TextField
                type="number"
                value={currentPlayerMoney}
                onChange={(e) => {
                  const value = Math.min(Math.max(0, parseInt(e.target.value) || 0), getCurrentPlayerMoney());
                  setCurrentPlayerMoney(value);
                }}
                inputProps={{ min: 0, max: getCurrentPlayerMoney() }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{
                  width: '120px',
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: '#a855f7',
                    borderRadius: '20px',
                    '& fieldset': {
                      border: 'none',
                    },
                  },
                  '& .MuiInputAdornment-root': {
                    color: 'white',
                  },
                }}
              />
            </Box>
          </Box>

          <SwapHoriz sx={{ fontSize: 32, color: 'rgba(255, 255, 255, 0.6)', alignSelf: 'center' }} />

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: 'white' }}>0</Typography>
              <Slider
                value={targetPlayerMoney}
                onChange={(_, value) => setTargetPlayerMoney(value)}
                max={getTargetPlayerMoney()}
                step={25}
                sx={{
                  flex: 1,
                  mx: 2,
                  color: '#a855f7',
                  '& .MuiSlider-thumb': {
                    bgcolor: '#a855f7',
                  },
                  '& .MuiSlider-track': {
                    bgcolor: '#a855f7',
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              />
              <Typography sx={{ color: 'white' }}>{getTargetPlayerMoney()}</Typography>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
              <TextField
                type="number"
                value={targetPlayerMoney}
                onChange={(e) => {
                  const value = Math.min(Math.max(0, parseInt(e.target.value) || 0), getTargetPlayerMoney());
                  setTargetPlayerMoney(value);
                }}
                inputProps={{ min: 0, max: getTargetPlayerMoney() }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{
                  width: '120px',
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    backgroundColor: '#a855f7',
                    borderRadius: '20px',
                    '& fieldset': {
                      border: 'none',
                    },
                  },
                  '& .MuiInputAdornment-root': {
                    color: 'white',
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Properties */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {/* Current Player Properties */}
          <TradeSection sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {playerProperties.map((property) => (
                <PropertyCard
                  key={property.name}
                  selected={selectedCurrentProperties.includes(property.name)}
                  isowned="true"
                  onClick={() => handlePropertyToggle(property.name, true)}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {property.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    ${property.price}
                  </Typography>
                </PropertyCard>
              ))}
            </Box>
          </TradeSection>

          {/* Target Player Properties */}
          <TradeSection sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {targetProperties.map((property) => (
                <PropertyCard
                  key={property.name}
                  selected={selectedTargetProperties.includes(property.name)}
                  isowned="true"
                  onClick={() => handlePropertyToggle(property.name, false)}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {property.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    ${property.price}
                  </Typography>
                </PropertyCard>
              ))}
            </Box>
          </TradeSection>
        </Box>

        {/* Note Section */}
        <Box sx={{ mb: 3 }}>
          {!showNoteField ? (
            <Button
              startIcon={<Note />}
              onClick={() => setShowNoteField(true)}
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                }
              }}
              variant="outlined"
            >
              Attach note
            </Button>
          ) : (
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Add a note to explain your strategy or reasoning..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#a855f7',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            onClick={onClose}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.4)',
              }
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendTrade}
            disabled={!isTradeValid()}
            startIcon={<SwapHoriz />}
            sx={{
              background: isTradeValid() 
                ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                : 'rgba(71, 85, 105, 0.3)',
              color: isTradeValid() ? 'white' : '#94a3b8',
              '&:hover': isTradeValid() ? {
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              } : {},
            }}
          >
            {existingTrade ? 'Send negotiation' : 'Send trade'}
          </Button>
        </Box>
        </>
        )}
      </ModalContent>
    </StyledModal>
  );
};

// View Trade Modal - For responding to trades
export const ViewTradeModal = ({ 
  isOpen, 
  onClose, 
  trade, 
  currentPlayerId,
  players,
  onConfirmTrade,
  onDeclineTrade,
  onCancelTrade,
  onNegotiateTrade,
  canInteract = true
}) => {
  if (!trade) return null;

  const isCreator = trade.createdBy === currentPlayerId;
  const isTarget = trade.targetPlayerId === currentPlayerId;
  const canRespond = canInteract && isTarget && trade.status === 'pending';
  const canNegotiate = canInteract && (isCreator || isTarget) && trade.status === 'pending';
  const isCompleted = ['completed', 'declined', 'cancelled'].includes(trade.status);

  const creatorPlayer = players.find(p => p.id === trade.createdBy);
  const targetPlayer = players.find(p => p.id === trade.targetPlayerId);
  
  const creatorOffer = trade.offers[trade.createdBy] || { money: 0, properties: [] };
  const targetOffer = trade.offers[trade.targetPlayerId] || { money: 0, properties: [] };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#10b981';
      case 'declined': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <StyledModal open={isOpen} onClose={onClose}>
      <ModalContent sx={{ minWidth: '700px', maxWidth: '900px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              View trade
            </Typography>
            {isCompleted && (
              <Chip
                label={trade.status === 'completed' ? 'Accepted' : trade.status === 'declined' ? 'Declined' : 'Cancelled'}
                sx={{
                  bgcolor: getStatusColor(trade.status),
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
            )}
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <Close />
          </IconButton>
        </Box>

        {/* Note at the top */}
        {trade.note && (
          <Paper sx={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            p: 2,
            mb: 3,
            position: 'relative',
          }}>
            <Box sx={{
              position: 'absolute',
              top: '-8px',
              left: '16px',
              background: '#8b5cf6',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              Note
            </Box>
            <Typography variant="body2" sx={{ color: 'white', mt: 1 }}>
              {trade.note}
            </Typography>
          </Paper>
        )}

        {/* Players */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: creatorPlayer?.color, width: 40, height: 40 }}>
              {creatorPlayer?.name.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {creatorPlayer?.name}
            </Typography>
          </Box>
          
          <SwapHoriz sx={{ fontSize: 32, color: 'rgba(255, 255, 255, 0.6)' }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {targetPlayer?.name}
            </Typography>
            <Avatar sx={{ bgcolor: targetPlayer?.color, width: 40, height: 40 }}>
              {targetPlayer?.name.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        </Box>

        {/* Money Display */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3, alignItems: 'center' }}>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#a855f7' }}>
              ${creatorOffer.money}
            </Typography>
          </Box>
          
          <SwapHoriz sx={{ fontSize: 24, color: 'rgba(255, 255, 255, 0.4)' }} />
          
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#a855f7' }}>
              ${targetOffer.money}
            </Typography>
          </Box>
        </Box>

        {/* Properties Display */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {/* Creator's Properties */}
          <Box sx={{ flex: 1 }}>
            {creatorOffer.properties.map((propertyName) => (
              <Button
                key={propertyName}
                disabled
                sx={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(124, 58, 237, 0.3))',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  borderRadius: '8px',
                  color: 'white',
                  textTransform: 'none',
                  width: '100%',
                  marginBottom: 1,
                  justifyContent: 'space-between',
                  '&.Mui-disabled': {
                    color: 'white',
                  }
                }}
              >
                <Typography>{propertyName}</Typography>
              </Button>
            ))}
          </Box>

          {/* Target's Properties */}
          <Box sx={{ flex: 1 }}>
            {targetOffer.properties.map((propertyName) => (
              <Button
                key={propertyName}
                disabled
                sx={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(124, 58, 237, 0.3))',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  borderRadius: '8px',
                  color: 'white',
                  textTransform: 'none',
                  width: '100%',
                  marginBottom: 1,
                  justifyContent: 'space-between',
                  '&.Mui-disabled': {
                    color: 'white',
                  }
                }}
              >
                <Typography>{propertyName}</Typography>
              </Button>
            ))}
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          {isCompleted ? (
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                fontStyle: 'italic',
                textAlign: 'center'
              }}
            >
              This trade has been {trade.status === 'completed' ? 'completed' : trade.status}
            </Typography>
          ) : (
            <>
              {canRespond && (
                <>
                  <Button
                    onClick={() => onDeclineTrade(trade.id)}
                    sx={{
                      color: '#ef4444',
                      borderColor: '#ef4444',
                      '&:hover': {
                        borderColor: '#dc2626',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      }
                    }}
                    variant="outlined"
                  >
                    Decline
                  </Button>
                  <Button
                    onClick={() => onNegotiateTrade(trade)}
                    sx={{
                      color: '#f59e0b',
                      borderColor: '#f59e0b',
                      '&:hover': {
                        borderColor: '#d97706',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      }
                    }}
                    variant="outlined"
                  >
                    Negotiate
                  </Button>
                  <Button
                    onClick={() => onConfirmTrade(trade.id)}
                    sx={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669, #047857)',
                      }
                    }}
                  >
                    Confirm
                  </Button>
                </>
              )}
              
              {isCreator && trade.status === 'pending' && (
                <Button
                  onClick={() => onCancelTrade(trade.id)}
                  sx={{
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    }
                  }}
                >
                  Delete trade
                </Button>
              )}
            </>
          )}
        </Box>
      </ModalContent>
    </StyledModal>
  );
};
