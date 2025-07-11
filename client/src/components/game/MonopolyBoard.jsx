import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Modal,
  IconButton,
  Chip,
  Card,
  CardContent,
  alpha
} from '@mui/material';
import {
  Close,
  Person,
  Info,
  FiberManualRecord
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import './MonopolyBoard.css';

const StyledDice = styled(Paper)(({ theme, isRolling }) => ({
  width: 70,
  height: 70,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: isRolling 
    ? 'linear-gradient(145deg, #fbbf24, #f59e0b)' 
    : 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
  border: `3px solid ${isRolling ? '#d97706' : '#4c1d95'}`,
  borderRadius: '16px',
  fontSize: '28px',
  fontWeight: 'bold',
  color: isRolling ? '#ffffff' : '#1e293b',
  boxShadow: isRolling 
    ? '0 6px 20px rgba(251, 191, 36, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.3)' 
    : '0 4px 12px rgba(0, 0, 0, 0.3)',
  transition: 'all 0.15s ease',
  animation: isRolling ? 'diceRoll 0.12s infinite' : 'none',
  transform: isRolling ? 'scale(1.15)' : 'scale(1)',
  textShadow: isRolling ? '0 0 8px rgba(0, 0, 0, 0.8)' : '0 2px 4px rgba(0, 0, 0, 0.2)',
  '@keyframes diceRoll': {
    '0%': { transform: 'scale(1.15) rotate(0deg)' },
    '25%': { transform: 'scale(1.15) rotate(90deg)' },
    '50%': { transform: 'scale(1.15) rotate(180deg)' },
    '75%': { transform: 'scale(1.15) rotate(270deg)' },
    '100%': { transform: 'scale(1.15) rotate(360deg)' }
  }
}));

const StyledGameLog = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 400,
  maxHeight: 200,
  overflow: 'auto',
  background: 'rgba(30, 27, 46, 0.8)',
  border: '1px solid #4c1d95',
  borderRadius: '12px',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backdropFilter: 'blur(10px)',
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '2px',
  }
}));

const StyledActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  padding: '12px 24px',
  background: 'linear-gradient(145deg, #8b5cf6, #7c3aed)',
  color: 'white',
  border: 'none',
  marginBottom: theme.spacing(2.5),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
  '&:hover:not(:disabled)': {
    background: 'linear-gradient(145deg, #7c3aed, #6d28d9)',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(139, 92, 246, 0.4)',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none'
  }
}));

// Shared button style for all action buttons
const UniformButton = styled(Button)(({ theme, variant, disabled: isDisabled }) => ({
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 600,
  padding: '8px 16px', // Reduced padding for smaller height
  fontSize: '0.875rem', // Slightly smaller font
  border: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)', // Reduced shadow
  background: variant === 'red' ? 'linear-gradient(145deg, #ef4444, #dc2626)' :
             variant === 'green' ? 'linear-gradient(145deg, #10b981, #059669)' :
             variant === 'blue' ? 'linear-gradient(145deg, #3b82f6, #2563eb)' :
             variant === 'purple' ? 'linear-gradient(145deg, #a855f7, #9333ea)' :
             'linear-gradient(145deg, #8b5cf6, #7c3aed)',
  color: isDisabled ? 'rgba(255, 255, 255, 0.5)' : 'white',
  cursor: isDisabled ? 'not-allowed' : 'pointer',
  opacity: isDisabled ? 0.6 : 1,
  '&:hover:not(:disabled)': {
    background: variant === 'red' ? 'linear-gradient(145deg, #dc2626, #b91c1c)' :
               variant === 'green' ? 'linear-gradient(145deg, #059669, #047857)' :
               variant === 'blue' ? 'linear-gradient(145deg, #2563eb, #1d4ed8)' :
               variant === 'purple' ? 'linear-gradient(145deg, #9333ea, #7c3aed)' :
               'linear-gradient(145deg, #7c3aed, #6d28d9)',
    transform: 'translateY(-1px)', // Reduced transform
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)', // Reduced shadow
  },
  '&:disabled': {
    pointerEvents: 'none'
  }
}));

const StyledCurrentPlayer = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.2))',
  border: '1px solid rgba(34, 197, 94, 0.3)',
  borderRadius: '8px',
  padding: theme.spacing(1, 2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}));

const MonopolyBoard = ({ 
  gameStarted, 
  gameLog = [], 
  onStartGame,
  isPreviewMode = false,
  previewContent = null,
  players = [],
  currentPlayerIndex = 0,
  onRollDice,
  onEndTurn,
  gamePhase = 'waiting', // 'waiting', 'rolling', 'moving', 'turn-end'
  onPlayerStatusChange, // New callback for vacation/jail status
  propertyOwnership = {}, // Property ownership data
  gameSettings = {}, // Game settings including auction setting
  playerJailCards = {}, // Player jail cards
  onPayJailFine, // Handler for paying jail fine
  onUseJailCard, // Handler for using jail card
  playerStatuses = {}, // Player status (jail, vacation)
  // Player move request from GamePage (for sending to jail, etc.)
  playerMoveRequest = null, // { playerId, position, resolve }
  onPlayerMoveComplete, // Called when player move is complete
  // Property landing state and handlers
  propertyLandingState = null, // { property, player, isActive } - null when no property landing
  onBuyProperty, // Handler for buying property
  onAuctionProperty, // Handler for auctioning property
  onSkipProperty, // Handler for skipping property purchase
  // Dev options for dice debugging
  devDiceEnabled = false,
  devDice1 = 1,
  devDice2 = 1
}) => {
  const [dice, setDice] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [playerPositions, setPlayerPositions] = useState({});
  const [spaceArrivalOrder, setSpaceArrivalOrder] = useState({}); // Track arrival order for each space
  const [playersInJail, setPlayersInJail] = useState(new Set()); // Track players in jail
  const [canRollAgain, setCanRollAgain] = useState(false);
  const [hasRolledBefore, setHasRolledBefore] = useState(false); // Track if any dice have been rolled

  // Helper function to check if a player can roll dice
  const canPlayerRoll = (playerId) => {
    const status = playerStatuses[playerId];
    // Player can't roll if in jail or on vacation
    return status !== 'jail' && (!status || typeof status !== 'object' || status.status !== 'vacation');
  };

  // Initialize player positions on START as soon as they join
  React.useEffect(() => {
    if (players.length > 0) {
      // Create fresh state for all current players
      const newPositions = {};
      const newOrder = { 0: [] };
      
      players.forEach((player) => {
        newPositions[player.id] = 0; // START position
        newOrder[0].push(player.id);
      });
      
      setPlayerPositions(newPositions);
      setSpaceArrivalOrder(newOrder);
    } else {
      // Clear all positions if no players
      setPlayerPositions({});
      setSpaceArrivalOrder({});
    }
  }, [players.length, JSON.stringify(players.map(p => ({ id: p.id, name: p.name })))]);

  // Listen for dice roll results to set canRollAgain
  React.useEffect(() => {
    if (gamePhase === 'rolling' && dice && dice.dice1 === dice.dice2 && !isRolling && hasRolledBefore) {
      setCanRollAgain(true);
    } else {
      setCanRollAgain(false);
    }
  }, [gamePhase, dice, isRolling, hasRolledBefore]);

  // Reset dice roll tracking when game starts
  React.useEffect(() => {
    if (gameStarted) {
      setHasRolledBefore(false);
      setDice(null);
    }
  }, [gameStarted]);

  // Handle player move requests (for sending to jail, etc.)
  React.useEffect(() => {
    if (playerMoveRequest && playerMoveRequest.playerId && playerMoveRequest.position !== undefined) {
      const { playerId, position, resolve } = playerMoveRequest;
      
      console.log(`Moving player ${playerId} to position ${position}`);
      
      // Get the player's current position to remove them from that space's arrival order
      const currentPosition = playerPositions[playerId];
      
      // Move the player to the specified position immediately
      setPlayerPositions(prev => {
        const newPositions = {
          ...prev,
          [playerId]: position
        };
        console.log('Updated player positions:', newPositions);
        return newPositions;
      });
      
      // Update space arrival order: remove from old position and add to new position
      setSpaceArrivalOrder(prev => {
        const newArrivalOrder = { ...prev };
        
        // Remove player from their current position (if they had one)
        if (currentPosition !== undefined && newArrivalOrder[currentPosition]) {
          newArrivalOrder[currentPosition] = newArrivalOrder[currentPosition].filter(id => id !== playerId);
        }
        
        // Add player to the new position
        const currentPlayersAtNewSpace = newArrivalOrder[position] || [];
        if (!currentPlayersAtNewSpace.includes(playerId)) {
          newArrivalOrder[position] = [...currentPlayersAtNewSpace, playerId];
        }
        
        console.log('Updated space arrival order:', newArrivalOrder);
        return newArrivalOrder;
      });
      
      // Call the resolve function to let GamePage know the move is complete
      if (resolve) {
        resolve();
      }
      
      // Notify GamePage that the move is complete
      if (onPlayerMoveComplete) {
        onPlayerMoveComplete();
      }
    }
  }, [playerMoveRequest, onPlayerMoveComplete, playerPositions]);

  const rollDice = () => {
    if (isRolling || gamePhase !== 'rolling') return;
    
    setIsRolling(true);
    
    // If dev dice is enabled, use the predefined values
    if (devDiceEnabled) {
      // Still show rolling animation for visual effect
      const rollAnimation = setInterval(() => {
        setDice({
          dice1: Math.floor(Math.random() * 6) + 1,
          dice2: Math.floor(Math.random() * 6) + 1
        });
      }, 80);

      // Stop animation and show dev dice result
      setTimeout(() => {
        clearInterval(rollAnimation);
        const finalDice1 = devDice1;
        const finalDice2 = devDice2;
        const total = finalDice1 + finalDice2;
        
        setDice({ dice1: finalDice1, dice2: finalDice2 });
        setHasRolledBefore(true);
        setIsRolling(false);

        // Continue with movement logic using dev dice values
        handleMovementLogic(finalDice1, finalDice2, total);
      }, 1000); // Shorter animation for dev mode
    } else {
      // Normal random dice rolling
      const rollAnimation = setInterval(() => {
        setDice({
          dice1: Math.floor(Math.random() * 6) + 1,
          dice2: Math.floor(Math.random() * 6) + 1
        });
      }, 80); // Faster animation for more excitement

      // Stop animation and show result
      setTimeout(() => {
        clearInterval(rollAnimation);
        const finalDice1 = Math.floor(Math.random() * 6) + 1;
        const finalDice2 = Math.floor(Math.random() * 6) + 1;
        const total = finalDice1 + finalDice2;
        
        setDice({ dice1: finalDice1, dice2: finalDice2 });
        setHasRolledBefore(true); // Mark that a dice roll has occurred
        setIsRolling(false);

        // Continue with movement logic
        handleMovementLogic(finalDice1, finalDice2, total);
      }, 1800); // Slightly longer dice roll for anticipation
    }
  };

  // Extract movement logic into separate function for reuse
  const handleMovementLogic = (finalDice1, finalDice2, total) => {
    // Move current player with smooth step-by-step animation
    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer) {
      // Check if player is in jail using playerStatuses prop
      if (playerStatuses[currentPlayer.id] === 'jail') {
        console.log(`${currentPlayer.name} is in jail`);
        
        // Check if doubles were rolled to get out of jail
        const isDoubles = finalDice1 === finalDice2;
        
        if (isDoubles) {
          console.log(`${currentPlayer.name} rolled doubles and got out of jail!`);
          
          if (onPlayerStatusChange) {
            onPlayerStatusChange(currentPlayer.id, 'jail', false);
          }
          
          // Player moves from jail with the roll
          const currentPos = 10; // Jail position
          const newPos = (currentPos + total) % 40;
          
          // Move player normally from jail
          let step = 0;
          const moveInterval = setInterval(() => {
            step++;
            const intermediatePos = (currentPos + step) % 40;
            
            setPlayerPositions(prev => ({
              ...prev,
              [currentPlayer.id]: intermediatePos
            }));
            
            // Update arrival order for intermediate positions during movement
            setSpaceArrivalOrder(prev => {
              const newOrder = { ...prev };
              
              // Remove player from all positions
              Object.keys(newOrder).forEach(spaceIndex => {
                newOrder[spaceIndex] = newOrder[spaceIndex].filter(id => id !== currentPlayer.id);
                if (newOrder[spaceIndex].length === 0) {
                  delete newOrder[spaceIndex];
                }
              });
              
              // Add player to new position
              if (!newOrder[intermediatePos]) {
                newOrder[intermediatePos] = [];
              }
              newOrder[intermediatePos].push(currentPlayer.id);
              
              return newOrder;
            });
            
            if (step >= total) {
              clearInterval(moveInterval);
              // Notify parent component after movement is complete
              if (onRollDice) {
                onRollDice(finalDice1, finalDice2, total, isDoubles, 'jail-escape', newPos, currentPos);
              }
            }
          }, 150);
          
          return;
        } else {
          // Player stays in jail
          console.log(`${currentPlayer.name} stays in jail (didn't roll doubles)`);
          if (onRollDice) {
            onRollDice(finalDice1, finalDice2, 0, false, 'jail-stay');
          }
          return;
        }
      }
      
      const currentPos = playerPositions[currentPlayer.id] || 0;
      const newPos = (currentPos + total) % 40; // 40 spaces on the board
      
      // Animate movement step by step with smooth transitions
      let step = 0;
      const moveInterval = setInterval(() => {
        step++;
        const intermediatePos = (currentPos + step) % 40;
        
        setPlayerPositions(prev => ({
          ...prev,
          [currentPlayer.id]: intermediatePos
        }));
        
        // Update arrival order for intermediate positions during movement
        setSpaceArrivalOrder(prev => {
          const newOrder = { ...prev };
          
          // Remove player from all positions
          Object.keys(newOrder).forEach(spaceIndex => {
            newOrder[spaceIndex] = newOrder[spaceIndex].filter(id => id !== currentPlayer.id);
            if (newOrder[spaceIndex].length === 0) {
              delete newOrder[spaceIndex];
            }
          });
          
          // Add player to new position
          if (!newOrder[intermediatePos]) {
            newOrder[intermediatePos] = [];
          }
          newOrder[intermediatePos].push(currentPlayer.id);
          
          return newOrder;
        });
        
        if (step >= total) {
          clearInterval(moveInterval);
          // Final position update - ensure player stays at the final position
          setPlayerPositions(prev => ({
            ...prev,
            [currentPlayer.id]: newPos
          }));
          
          // Final arrival order update
          setSpaceArrivalOrder(prev => {
            const newOrder = { ...prev };
            
            // Remove player from all positions
            Object.keys(newOrder).forEach(spaceIndex => {
              newOrder[spaceIndex] = newOrder[spaceIndex].filter(id => id !== currentPlayer.id);
              if (newOrder[spaceIndex].length === 0) {
                delete newOrder[spaceIndex];
              }
            });
            
            // Add player to final position
            if (!newOrder[newPos]) {
              newOrder[newPos] = [];
            }
            newOrder[newPos].push(currentPlayer.id);
            
            return newOrder;
          });
          
          // Check if doubles were rolled
          const isDoubles = finalDice1 === finalDice2;
          
          // Handle special spaces
          let specialAction = null;
          if (newPos === 30) { // Go to prison
            console.log(`${currentPlayer.name} landed on Go to prison - sent to jail`);
            // Move player to jail position (10)
            setPlayerPositions(prev => ({
              ...prev,
              [currentPlayer.id]: 10
            }));
            
            // Update arrival order for jail
            setSpaceArrivalOrder(prev => {
              const newOrder = { ...prev };
              
              // Remove player from go to prison position
              if (newOrder[30]) {
                newOrder[30] = newOrder[30].filter(id => id !== currentPlayer.id);
                if (newOrder[30].length === 0) {
                  delete newOrder[30];
                }
              }
              
              // Add player to jail position
              if (!newOrder[10]) {
                newOrder[10] = [];
              }
              newOrder[10].push(currentPlayer.id);
              
              return newOrder;
            });
            
            setPlayersInJail(prev => new Set(prev).add(currentPlayer.id));
            if (onPlayerStatusChange) {
              onPlayerStatusChange(currentPlayer.id, 'jail', true);
            }
            specialAction = 'jail';
          } else if (newPos === 20) { // Vacation
            console.log(`${currentPlayer.name} landed on Vacation`);
            if (onPlayerStatusChange) {
              onPlayerStatusChange(currentPlayer.id, 'vacation', true);
            }
            specialAction = 'vacation';
          }
          
          // Notify parent component after movement is complete
          if (onRollDice) {
            onRollDice(finalDice1, finalDice2, total, isDoubles, specialAction, newPos, currentPos);
          }
        }
      }, 150); // Slightly faster movement for better pacing
    } else {
      // No current player, just notify parent
      const isDoubles = finalDice1 === finalDice2;
      if (onRollDice) {
        onRollDice(finalDice1, finalDice2, total, isDoubles);
      }
    }
  };

  const handleEndTurn = () => {
    if (onEndTurn) {
      onEndTurn();
    }
  };

  const getCurrentPlayer = () => {
    return players && players.length > 0 ? players[currentPlayerIndex] : null;
  };

  // Helper function to get space index from position arrays
  const getSpaceIndex = (position) => {
    // Board has 40 positions total
    // 0-10: top row (START to PRISON)
    // 11-20: right row 
    // 21-30: bottom row (Vacation going left)
    // 31-39: left row (going up to START)
    return position;
  };

  // Helper function to render player avatars on spaces
  const renderPlayerAvatars = (spaceIndex) => {
    // Get players in arrival order for this space
    const playerIdsOnSpace = spaceArrivalOrder[spaceIndex] || [];
    const playersOnSpace = playerIdsOnSpace
      .map(playerId => players.find(player => player.id === playerId))
      .filter(player => player && playerPositions[player.id] === spaceIndex);
    
    if (playersOnSpace.length === 0) return null;

    const currentPlayer = getCurrentPlayer();
    const isMoving = gamePhase === 'moving';
    
    // Check if this is a corner space for special sizing
    const isCornerSpace = spaceIndex === 0 || spaceIndex === 10 || spaceIndex === 20 || spaceIndex === 30;
    const avatarSize = isCornerSpace ? 36 : 32;
    const fontSize = isCornerSpace ? '13px' : '12px';
    
    // Calculate overlap - each avatar should overlap the previous one by 50% to show an arc
    const overlapAmount = avatarSize * 0.5; // 50% overlap to show arc of each avatar
    
    // Determine stacking direction based on space position
    const isLeftSide = spaceIndex >= 31 && spaceIndex <= 39; // Left column
    const isRightSide = spaceIndex >= 11 && spaceIndex <= 19; // Right column
    const isHorizontalStack = isLeftSide || isRightSide;

    return (
      <Box sx={{ 
        position: 'absolute', 
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', 
        flexDirection: isHorizontalStack ? 'row' : 'column',
        alignItems: 'center',
        zIndex: 100, // High z-index to ensure avatars are always visible
        // Calculate container dimensions based on stacking direction
        width: isHorizontalStack 
          ? (playersOnSpace.length > 1 
            ? `${avatarSize + (playersOnSpace.length - 1) * (avatarSize - overlapAmount)}px` 
            : `${avatarSize}px`)
          : `${avatarSize}px`,
        height: isHorizontalStack 
          ? `${avatarSize}px`
          : (playersOnSpace.length > 1 
            ? `${avatarSize + (playersOnSpace.length - 1) * (avatarSize - overlapAmount)}px` 
            : `${avatarSize}px`),
        justifyContent: 'flex-start'
      }}>
        {playersOnSpace.map((player, index) => {
          const isCurrentPlayer = currentPlayer && player.id === currentPlayer.id;
          const isMovingPlayer = isMoving && isCurrentPlayer;
          const isInJail = playerStatuses[player.id] === 'jail';
          const isJailSpace = spaceIndex === 10;
          
          // For jail space, differentiate between visiting and in jail
          const isJustVisiting = isJailSpace && !isInJail;
          const isBehindBars = isJailSpace && isInJail;
          
          // Calculate base transform for jail positioning
          const baseTransform = isJailSpace ? (
            isBehindBars ? 'translate(-70%, 20%)' : 'translate(-30%, -70%)'
          ) : 'translate(0, 0)';
          
          return (
            <Box
              key={player.id}
              sx={{
                position: 'relative',
                width: avatarSize,
                height: avatarSize,
                borderRadius: '50%',
                backgroundColor: player.color,
                border: '3px solid white',
                fontSize: fontSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                textShadow: '0 0 4px rgba(0, 0, 0, 0.9)',
                boxShadow: isMovingPlayer 
                  ? `0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 20px ${player.color}` 
                  : '0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: isBehindBars ? 90 + index : 100 + index, // Put jailed players behind bars
                // Use appropriate margins based on stacking direction
                marginTop: index > 0 && !isHorizontalStack ? `-${overlapAmount}px` : 0,
                marginLeft: index > 0 && isHorizontalStack ? `-${overlapAmount}px` : 0,
                flexShrink: 0, // Prevent compression that causes oval shape
                transform: baseTransform, // Apply jail positioning first
                animation: isMovingPlayer ? 'avatarGlow 1s ease-in-out infinite alternate' : 'none',
                '@keyframes avatarGlow': {
                  '0%': { 
                    boxShadow: `0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 20px ${player.color}`,
                    transform: `${baseTransform} scale(1.05)` // Preserve jail positioning in animation
                  },
                  '100%': { 
                    boxShadow: `0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 30px ${player.color}`,
                    transform: `${baseTransform} scale(1.1)` // Preserve jail positioning in animation
                  }
                },
                '&:hover': {
                  transform: `${baseTransform} scale(1.15)`, // Preserve jail positioning when hovering
                  boxShadow: '0 6px 12px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(255, 255, 255, 0.4)',
                  zIndex: 200 // Bring hovered avatar to top
                }
              }}
            >
              {player.name.charAt(0).toUpperCase()}
              
              {/* Jail bars overlay for players in jail */}
              {isBehindBars && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.8) 3px, rgba(0,0,0,0.8) 5px)',
                    zIndex: 120,
                    pointerEvents: 'none'
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    );
  };
  // Property to country flag mapping
  const propertyFlags = {
    'Salvador': '🇧🇷', // Brazil
    'Rio': '🇧🇷', // Brazil
    'Tel Aviv': '🇮🇱', // Israel
    'Haifa': '🇮🇱', // Israel
    'Jerusalem': '🇮🇱', // Israel
    'Venice': '🇮🇹', // Italy
    'Milan': '🇮🇹', // Italy
    'Rome': '🇮🇹', // Italy
    'Frankfurt': '🇩🇪', // Germany
    'Munich': '🇩🇪', // Germany
    'Berlin': '🇩🇪', // Germany
    'Shenzhen': '🇨🇳', // China
    'Beijing': '🇨🇳', // China
    'Shanghai': '🇨🇳', // China
    'Lyon': '🇫🇷', // France
    'Toulouse': '🇫🇷', // France
    'Paris': '🇫🇷', // France
    'Liverpool': '🇬🇧', // UK
    'Manchester': '🇬🇧', // UK
    'London': '🇬🇧', // UK
    'California': '🇺🇸', // USA
    'New York': '🇺🇸' // USA
  };

  // Top row properties (left to right)
  const topRow = [
    { name: 'START', type: 'corner', color: 'green', className: 'start' },
    { name: 'Salvador', type: 'property', flag: propertyFlags['Salvador'], price: '60$' },
    { name: 'Treasure', type: 'treasure', color: 'orange' },
    { name: 'Rio', type: 'property', flag: propertyFlags['Rio'], price: '60$' },
    { name: 'Income Tax', type: 'tax', color: 'white' },
    { name: 'TLV Airport', type: 'airport', color: 'gray', price: '200$' },
    { name: 'Tel Aviv', type: 'property', flag: propertyFlags['Tel Aviv'], price: '100$' },
    { name: 'Surprise', type: 'surprise', color: 'pink' },
    { name: 'Haifa', type: 'property', flag: propertyFlags['Haifa'], price: '100$' },
    { name: 'Jerusalem', type: 'property', flag: propertyFlags['Jerusalem'], price: '120$' },
    { name: 'In Prison / Just Visiting', type: 'corner', color: 'orange', className: 'prison' }
  ];

  // Right row properties (top to bottom)
  const rightRow = [
    { name: 'Venice', type: 'property', flag: propertyFlags['Venice'], price: '140$' },
    { name: 'Electric Company', type: 'utility', utilityType: 'electric', color: 'lightblue', price: '150$' },
    { name: 'Milan', type: 'property', flag: propertyFlags['Milan'], price: '140$' },
    { name: 'Rome', type: 'property', flag: propertyFlags['Rome'], price: '160$' },
    { name: 'MUC Airport', type: 'airport', color: 'gray', price: '200$' },
    { name: 'Frankfurt', type: 'property', flag: propertyFlags['Frankfurt'], price: '180$' },
    { name: 'Treasure', type: 'treasure', color: 'orange' },
    { name: 'Munich', type: 'property', flag: propertyFlags['Munich'], price: '180$' },
    { name: 'Berlin', type: 'property', flag: propertyFlags['Berlin'], price: '200$' }
  ];

  // Bottom row properties (right to left)
  const bottomRow = [
    { name: 'Shenzhen', type: 'property', flag: propertyFlags['Shenzhen'], price: '220$' },
    { name: 'Surprise', type: 'surprise', color: 'pink' },
    { name: 'Beijing', type: 'property', flag: propertyFlags['Beijing'], price: '220$' },
    { name: 'Shanghai', type: 'property', flag: propertyFlags['Shanghai'], price: '240$' },
    { name: 'CDG Airport', type: 'airport', color: 'gray', price: '200$' },
    { name: 'Lyon', type: 'property', flag: propertyFlags['Lyon'], price: '260$' },
    { name: 'Toulouse', type: 'property', flag: propertyFlags['Toulouse'], price: '260$' },
    { name: 'Water Company', type: 'utility', color: 'lightblue', price: '150$' },
    { name: 'Paris', type: 'property', flag: propertyFlags['Paris'], price: '280$' }
  ];

  // Left row properties (bottom to top)
  const leftRow = [
    { name: 'Liverpool', type: 'property', flag: propertyFlags['Liverpool'], price: '300$' },
    { name: 'Manchester', type: 'property', flag: propertyFlags['Manchester'], price: '300$' },
    { name: 'Treasure', type: 'treasure', color: 'orange' },
    { name: 'London', type: 'property', flag: propertyFlags['London'], price: '320$' },
    { name: 'JFK Airport', type: 'airport', color: 'gray', price: '200$' },
    { name: 'Surprise', type: 'surprise', color: 'pink' },
    { name: 'California', type: 'property', flag: propertyFlags['California'], price: '350$' },
    { name: 'Luxury Tax', type: 'tax', color: 'white' },
    { name: 'New York', type: 'property', flag: propertyFlags['New York'], price: '400$' }
  ];

  // Corner spaces
  const corners = [
    { name: 'Vacation', type: 'corner', color: 'green', className: 'free-parking' },
    { name: 'Go to prison', type: 'corner', color: 'red', className: 'jail' }
  ];

  const renderSpace = (space, index, position) => {
    const isCorner = space.type === 'corner';
    const spaceClasses = `space ${space.type} ${position} ${isCorner ? 'corner' : ''} ${space.className || ''}`;
    
    // Calculate the global space index for player positioning
    // Board layout clockwise: 0-10 (top), 11-19 (right), 20-30 (bottom), 31-39 (left)
    let globalSpaceIndex = 0;
    if (position === 'top') {
      globalSpaceIndex = index; // 0-10
    } else if (position === 'right') {
      globalSpaceIndex = 11 + index; // 11-19
    } else if (position === 'bottom') {
      if (space.name === 'Vacation') {
        globalSpaceIndex = 20;
      } else if (space.name === 'Go to prison') {
        globalSpaceIndex = 30;
      } else {
        // Bottom row properties: index 0-8 should map to positions 21-29 (left to right)
        globalSpaceIndex = 21 + index;
      }
    } else if (position === 'left') {
      // Left row properties: index 0-8 should map to positions 31-39 (bottom to top)
      globalSpaceIndex = 31 + index;
    }
    
    return (
      <div key={`${position}-${index}`} className={spaceClasses} style={{ position: 'relative' }}>
        <div className="space-content">
          {space.type === 'property' && (
            <>
              <div className="property-flag">{space.flag}</div>
              {space.price && (
                <div 
                  className="space-price" 
                  style={{
                    background: propertyOwnership[space.name] 
                      ? propertyOwnership[space.name].ownerColor 
                      : 'rgba(251, 191, 36, 0.3)',
                    color: propertyOwnership[space.name] ? 'white' : '#fbbf24',
                    fontWeight: propertyOwnership[space.name] ? 'bold' : 'bold'
                  }}
                >
                  {propertyOwnership[space.name] ? '' : space.price}
                </div>
              )}
            </>
          )}
          {space.type === 'airport' && space.price && (
            <div 
              className="space-price"
              style={{
                background: propertyOwnership[space.name] 
                  ? propertyOwnership[space.name].ownerColor 
                  : 'rgba(251, 191, 36, 0.3)',
                color: propertyOwnership[space.name] ? 'white' : '#fbbf24',
                fontWeight: propertyOwnership[space.name] ? 'bold' : 'bold'
              }}
            >
              {propertyOwnership[space.name] ? '' : space.price}
            </div>
          )}
          {space.type === 'utility' && space.price && (
            <div 
              className="space-price"
              style={{
                background: propertyOwnership[space.name] 
                  ? propertyOwnership[space.name].ownerColor 
                  : 'rgba(251, 191, 36, 0.3)',
                color: propertyOwnership[space.name] ? 'white' : '#fbbf24',
                fontWeight: propertyOwnership[space.name] ? 'bold' : 'bold'
              }}
            >
              {propertyOwnership[space.name] ? '' : space.price}
            </div>
          )}
          <div className="space-name">
            {space.name.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < space.name.split('\n').length - 1 && <br />}
              </span>
            ))}
          </div>
          {space.type === 'treasure' && <div className="treasure-icon">📦</div>}
          {space.type === 'surprise' && <div className="surprise-icon">❓</div>}
          {space.type === 'airport' && <div className="airport-icon">✈️</div>}
          {space.type === 'utility' && space.utilityType === 'electric' && <div className="electric-icon">⚡</div>}
          {space.type === 'utility' && space.utilityType !== 'electric' && <div className="utility-icon">🏭</div>}
          {space.type === 'tax' && <div className="tax-icon">💰</div>}
        </div>
        {/* Render player avatars on this space - show avatars as soon as players join */}
        {renderPlayerAvatars(globalSpaceIndex)}
        
        {/* Add jail bars for the jail space */}
        {space.className === 'prison' && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.6) 8px, rgba(0,0,0,0.6) 12px)',
            pointerEvents: 'none',
            zIndex: 110
          }} />
        )}
        
        {/* Add "JAIL" text in corner for jail space */}
        {space.className === 'prison' && (
          <div style={{
            position: 'absolute',
            top: '2px',
            left: '2px',
            fontSize: '8px',
            fontWeight: 'bold',
            color: '#ef4444',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '1px 3px',
            borderRadius: '2px',
            zIndex: 120
          }}>
            JAIL
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="monopoly-board">
      {/* Top Row - 11 spaces */}
      <div className="board-row top-row">
        {topRow.map((space, index) => renderSpace(space, index, 'top'))}
      </div>

      {/* Right Column - 9 spaces (excluding corners) */}
      <div className="board-column right-column">
        {rightRow.map((space, index) => renderSpace(space, index, 'right'))}
      </div>

      {/* Bottom Row - 11 spaces (Vacation corner + 9 spaces + jail corner) */}
      <div className="board-row bottom-row">
        {renderSpace(corners[0], 0, 'bottom')}
        {bottomRow.map((space, index) => renderSpace(space, index, 'bottom'))}
        {renderSpace(corners[1], 1, 'bottom')}
      </div>

      {/* Left Column - 9 spaces (excluding corners) */}
      <div className="board-column left-column">
        {leftRow.map((space, index) => renderSpace(space, index, 'left'))}
      </div>

      {/* Center Area */}
      <div className="board-center">
        {isPreviewMode && previewContent ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center',
            color: '#e5e7eb',
            p: 3,
            width: '100%',
            height: '100%'
          }}>
            {previewContent}
          </Box>
        ) : !gameStarted ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center',
            color: '#e5e7eb',
            p: 3
          }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Box sx={{ 
                fontSize: '30px',
                background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
                width: 50,
                height: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: '2px solid #4c1d95',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                color: '#1e293b'
              }}>
                🎲
              </Box>
              <Box sx={{ 
                fontSize: '30px',
                background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
                width: 50,
                height: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: '2px solid #4c1d95',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                color: '#1e293b'
              }}>
                🎲
              </Box>
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#f8fafc', 
                mb: 3,
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                fontSize: '24px'
              }}
            >
              MONOPOLY
            </Typography>
            
            {/* Game Log - Show even before game starts */}
            <StyledGameLog elevation={3}>
              <List sx={{ py: 0 }}>
                {gameLog.length > 0 ? gameLog.map((entry, index) => (
                  <ListItem key={entry.id || index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                      {entry.type === 'join' && (
                        <FiberManualRecord sx={{ color: '#22c55e', fontSize: '8px' }} />
                      )}
                      {entry.type === 'info' && (
                        <FiberManualRecord sx={{ color: '#3b82f6', fontSize: '8px' }} />
                      )}
                      {entry.type === 'purchase' && (
                        <FiberManualRecord sx={{ color: '#fbbf24', fontSize: '8px' }} />
                      )}
                      {entry.type === 'rent' && (
                        <FiberManualRecord sx={{ color: '#f97316', fontSize: '8px' }} />
                      )}
                      {entry.type === 'special' && (
                        <FiberManualRecord sx={{ color: '#a855f7', fontSize: '8px' }} />
                      )}
                      {entry.type === 'bankruptcy' && (
                        <FiberManualRecord sx={{ color: '#ef4444', fontSize: '8px' }} />
                      )}
                      {entry.type === 'trade' && (
                        <FiberManualRecord sx={{ color: '#10b981', fontSize: '8px' }} />
                      )}
                      {entry.type === 'bot' && (
                        <FiberManualRecord sx={{ color: '#06b6d4', fontSize: '8px' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {entry.player && (
                            <Typography 
                              component="span" 
                              sx={{ 
                                fontWeight: 'bold', 
                                color: entry.type === 'join' ? '#22c55e' : '#f8fafc', 
                                fontSize: '13px' 
                              }}
                            >
                              {entry.player}
                            </Typography>
                          )}
                          <Typography 
                            component="span" 
                            sx={{ 
                              color: entry.type === 'bankruptcy' ? '#fca5a5' : '#d1d5db', 
                              fontSize: '13px',
                              fontWeight: entry.type === 'bankruptcy' ? 'bold' : 'normal'
                            }}
                          >
                            {entry.message}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                )) : (
                  <ListItem sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography 
                          component="span" 
                          sx={{ 
                            color: '#9ca3af', 
                            fontSize: '13px',
                            fontStyle: 'italic',
                            textAlign: 'center'
                          }}
                        >
                          Game log will appear here...
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </StyledGameLog>

            {/* Show Start Game button when there are players who have chosen colors */}
            {players.length > 0 && players.some(p => p.color) && (
              <StyledActionButton onClick={onStartGame}>
                Start Game
              </StyledActionButton>
            )}
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center',
            p: 3,
            width: '100%',
            height: '100%'
          }}>
            {/* Dice */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <StyledDice elevation={4} isRolling={isRolling}>
                {dice?.dice1 || '?'}
              </StyledDice>
              <StyledDice elevation={4} isRolling={isRolling}>
                {dice?.dice2 || '?'}
              </StyledDice>
            </Box>

            {/* All Action Buttons - Horizontal Layout */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              {/* Property Landing Actions - Only show when it's the current player's turn and they landed on a property */}
              {propertyLandingState && 
               propertyLandingState.isActive && 
               propertyLandingState.player && 
               propertyLandingState.player.id === getCurrentPlayer()?.id && (
                <>
                  {/* Buy Property Button */}
                  <UniformButton 
                    variant="green"
                    disabled={propertyLandingState.player.money < propertyLandingState.property.price}
                    onClick={() => onBuyProperty && onBuyProperty()}
                  >
                    Buy for ${propertyLandingState.property.price}
                  </UniformButton>
                  
                  {/* Auction Button (only if auction is enabled in settings) */}
                  {gameSettings.allowAuction && (
                    <UniformButton 
                      variant="purple"
                      onClick={() => onAuctionProperty && onAuctionProperty()}
                    >
                      Auction
                    </UniformButton>
                  )}
                  
                  {/* Skip Button (if auction is disabled) */}
                  {!gameSettings.allowAuction && (
                    <UniformButton 
                      variant="default"
                      onClick={() => onSkipProperty && onSkipProperty()}
                    >
                      Skip
                    </UniformButton>
                  )}
                </>
              )}

              {/* Jail Escape Actions */}
              {gamePhase === 'rolling' && getCurrentPlayer() && playerStatuses[getCurrentPlayer().id] === 'jail' && (
                <>
                  {/* Pay $50 Fine Button */}
                  <UniformButton 
                    variant="red"
                    disabled={!getCurrentPlayer() || getCurrentPlayer().money < 50}
                    onClick={onPayJailFine}
                  >
                    Pay $50 Fine
                  </UniformButton>

                  {/* Use Jail Card Button - Only show if player has cards */}
                  {getCurrentPlayer() && playerJailCards[getCurrentPlayer().id] > 0 && (
                    <UniformButton 
                      variant="green"
                      onClick={onUseJailCard}
                    >
                      Use Jail Card ({playerJailCards[getCurrentPlayer().id]})
                    </UniformButton>
                  )}

                  {/* Roll Dice to Try Doubles */}
                  <UniformButton 
                    variant="purple"
                    disabled={isRolling}
                    onClick={isRolling ? undefined : rollDice}
                  >
                    {isRolling ? 'Rolling...' : 'Roll for Doubles'}
                  </UniformButton>
                </>
              )}

              {/* Normal Rolling Actions */}
              {gamePhase === 'rolling' && getCurrentPlayer() && canPlayerRoll(getCurrentPlayer().id) && canRollAgain && (
                <UniformButton 
                  variant="blue"
                  disabled={isRolling}
                  onClick={isRolling ? undefined : rollDice}
                >
                  {isRolling ? 'Rolling...' : 'Roll Again'}
                </UniformButton>
              )}

              {gamePhase === 'rolling' && getCurrentPlayer() && canPlayerRoll(getCurrentPlayer().id) && !canRollAgain && (
                <UniformButton 
                  disabled={isRolling}
                  onClick={isRolling ? undefined : rollDice}
                >
                  {isRolling ? 'Rolling...' : 'Roll Dice'}
                </UniformButton>
              )}
              
              {/* End Turn Button */}
              {gamePhase === 'turn-end' && (
                <UniformButton 
                  onClick={handleEndTurn}
                >
                  End Turn
                </UniformButton>
              )}
            </Box>

            {gamePhase === 'moving' && (
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#f8fafc', 
                  mb: 2,
                  textAlign: 'center'
                }}
              >
                Moving...
              </Typography>
            )}

            {/* Game Log */}
            <StyledGameLog elevation={3}>
              <List sx={{ py: 0 }}>
                {gameLog.map((entry, index) => (
                  <ListItem key={entry.id || index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                      {entry.type === 'join' && (
                        <FiberManualRecord sx={{ color: '#22c55e', fontSize: '8px' }} />
                      )}
                      {entry.type === 'info' && (
                        <FiberManualRecord sx={{ color: '#3b82f6', fontSize: '8px' }} />
                      )}
                      {entry.type === 'purchase' && (
                        <FiberManualRecord sx={{ color: '#fbbf24', fontSize: '8px' }} />
                      )}
                      {entry.type === 'rent' && (
                        <FiberManualRecord sx={{ color: '#f97316', fontSize: '8px' }} />
                      )}
                      {entry.type === 'special' && (
                        <FiberManualRecord sx={{ color: '#a855f7', fontSize: '8px' }} />
                      )}
                      {entry.type === 'bankruptcy' && (
                        <FiberManualRecord sx={{ color: '#ef4444', fontSize: '8px' }} />
                      )}
                      {entry.type === 'trade' && (
                        <FiberManualRecord sx={{ color: '#10b981', fontSize: '8px' }} />
                      )}
                      {entry.type === 'bot' && (
                        <FiberManualRecord sx={{ color: '#06b6d4', fontSize: '8px' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {entry.player && (
                            <Typography 
                              component="span" 
                              sx={{ 
                                fontWeight: 'bold', 
                                color: entry.type === 'join' ? '#22c55e' : '#f8fafc', 
                                fontSize: '13px' 
                              }}
                            >
                              {entry.player}
                            </Typography>
                          )}
                          <Typography 
                            component="span" 
                            sx={{ 
                              color: entry.type === 'bankruptcy' ? '#fca5a5' : '#d1d5db', 
                              fontSize: '13px',
                              fontWeight: entry.type === 'bankruptcy' ? 'bold' : 'normal'
                            }}
                          >
                            {entry.message}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </StyledGameLog>

            {/* Current Player Info */}
            {getCurrentPlayer() && (
              <StyledCurrentPlayer>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: getCurrentPlayer().color,
                    border: '1px solid white',
                    mr: 1
                  }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ color: '#22c55e', fontSize: '14px' }}
                >
                  {getCurrentPlayer().name}'s turn
                </Typography>
              </StyledCurrentPlayer>
            )}
          </Box>
        )}

        {/* Modal */}
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Card 
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              maxWidth: 300,
              border: '1px solid #4c1d95',
              borderRadius: '12px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
            }}
          >
            <IconButton
              onClick={() => setShowModal(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                color: 'white',
                opacity: 0.7,
                '&:hover': { opacity: 1 }
              }}
            >
              <Close />
            </IconButton>
            <CardContent sx={{ textAlign: 'center', pt: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {modalContent}
              </Typography>
            </CardContent>
          </Card>
        </Modal>
      </div>
    </div>
  );
}

export default MonopolyBoard;