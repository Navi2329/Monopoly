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
  FiberManualRecord,
  MonetizationOn
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import './MonopolyBoard.css';
import PropertyPopup from './PropertyPopup';
import CustomModal from '../common/Modal';
import { createPortal } from 'react-dom';
import ReactCountryFlag from 'react-country-flag';
import classicMap from '../../data/maps/classic';
import socket from '../../socket';

const StyledDice = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isRolling'
})(({ theme, isRolling }) => ({
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
  maxWidth: 600,
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
  },
  [theme.breakpoints.down('md')]: {
    maxWidth: 500,
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: 350,
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

const MonopolyBoard = (props) => {
  const {
    gameStarted,
    gameLog = [],
    onStartGame,
    isPreviewMode = false,
    previewContent = null,
    players = [],
    currentPlayerIndex = 0,
    onRollDice,
    onEndTurn,
    gamePhase = 'waiting',
    onPlayerStatusChange,
    propertyOwnership = {},
    gameSettings = {},
    playerJailCards = {},
    onPayJailFine,
    onUseJailCard,
    onJailExit,
    playerStatuses = {},
    playerJailRounds = {},
    playerMoveRequest = null,
    onPlayerMoveComplete,
    propertyLandingState = null,
    onMortgageProperty = () => { },
    onSellProperty = () => { },
    onBuildHouse = () => { },
    onDestroyHouse = () => { },
    onMovementComplete,
    devDiceEnabled = false,
    devDice1 = 1,
    devDice2 = 1,
    vacationCash = 0,
    isHost = false,
    syncedPositions,
    syncedLastDiceRoll,
    syncedPlayerMoney,
    syncedSpecialAction,
    isMyTurn,
    roomId,
    globalDiceRolling = false,
    onBuyProperty,
    onAuctionProperty,
    onSkipProperty,
    onClearPropertyLandingState,
    currentUserId,
    isShufflingPlayers = false,
    onPropertyClick = () => { }
  } = props;
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [spaceArrivalOrder, setSpaceArrivalOrder] = useState({}); // Track arrival order for each space
  const [playersInJail, setPlayersInJail] = useState(new Set()); // Track players in jail
  const [canRollAgain, setCanRollAgain] = useState(false);
  const [hasRolledBefore, setHasRolledBefore] = useState(false); // Track if any dice have been rolled
  const [hasEndedTurnAfterDoubles, setHasEndedTurnAfterDoubles] = useState(false); // Track if player ended turn after doubles
  const [jailAnimationStates, setJailAnimationStates] = useState({}); // Track jail entry/exit animations
  const [movementComplete, setMovementComplete] = useState(true); // Track if movement animation is complete
  const [localDiceRolling, setLocalDiceRolling] = useState(false); // Local dice rolling state for immediate response
  const [previousDiceRoll, setPreviousDiceRoll] = useState(null); // Track previous dice roll to detect turn changes
  const [isInDoublesSequence, setIsInDoublesSequence] = useState(false); // Track if we're in a doubles sequence
  // Store the last valid dice roll for display
  const [lastValidDiceRoll, setLastValidDiceRoll] = React.useState(null);
  // Track local button state to prevent double-purchase (for property modal)
  const [buying, setBuying] = React.useState(false);
  // Add at the top of the component, after useState declarations
  const [rollDiceButtonVisible, setRollDiceButtonVisible] = React.useState(false);
  const [rollAgainButtonVisible, setRollAgainButtonVisible] = React.useState(false);
  const [endTurnButtonVisible, setEndTurnButtonVisible] = React.useState(false);
  const [justPurchasedProperty, setJustPurchasedProperty] = React.useState(false);
  const [awaitingVacationEndTurn, setAwaitingVacationEndTurn] = React.useState(false);
  const [endTurnClicked, setEndTurnClicked] = React.useState(false);
  const [hasRolledSinceLastEndTurn, setHasRolledSinceLastEndTurn] = React.useState(true);
  const [awaitingRollAfterDoubles, setAwaitingRollAfterDoubles] = React.useState(false);
  React.useEffect(() => { setBuying(false); }, [propertyLandingState]);

  // Move this function up before any useEffect that references it
  const getCurrentPlayer = React.useCallback(() => {
    return players && players.length > 0 ? players[currentPlayerIndex] : null;
  }, [players, currentPlayerIndex]);


  // --- FIX: Close property modal and reset buying state after purchase ---
  React.useEffect(() => {
    if (
      propertyLandingState &&
      propertyLandingState.isActive &&
      propertyLandingState.property &&
      propertyOwnership[propertyLandingState.property]
    ) {
      // Property is now owned, close modal and reset buying
      setBuying(false);
      setShowModal(false);
      // Optionally, you could call onEndTurn() here if needed
    }
  }, [propertyOwnership, propertyLandingState]);

  const propertyPopupRootId = 'property-popup-root';

  // Add a div with id property-popup-root to the board container if not present
  React.useEffect(() => {
    let root = document.getElementById(propertyPopupRootId);
    if (!root) {
      root = document.createElement('div');
      root.id = propertyPopupRootId;
      root.style.position = 'fixed';
      root.style.top = '32px';
      root.style.right = '32px';
      root.style.zIndex = 2000;
      document.body.appendChild(root);
    }
    return () => {
      if (root && root.parentNode) root.parentNode.removeChild(root);
    };
  }, []);

  // Helper function to check if a player can roll dice
  const canPlayerRoll = React.useCallback((playerId) => {
    const status = playerStatuses[playerId];
    // Player can't roll if in jail or on vacation
    return status !== 'jail' && (!status || typeof status !== 'object' || status.status !== 'vacation');
  }, [playerStatuses]);

  // Update space arrival order when syncedPositions changes
  React.useEffect(() => {
    if (syncedPositions && Object.keys(syncedPositions).length > 0) {
      const newOrder = {};

      // Group players by their positions
      Object.entries(syncedPositions).forEach(([playerId, position]) => {
        if (!newOrder[position]) {
          newOrder[position] = [];
        }
        newOrder[position].push(playerId);
      });

      setSpaceArrivalOrder(newOrder);
    }
  }, [syncedPositions]);

  // Listen for dice roll results to set canRollAgain and track movement
  React.useEffect(() => {
    if (gamePhase === 'rolling' && syncedLastDiceRoll && syncedLastDiceRoll.dice1 === syncedLastDiceRoll.dice2) {
      // Check if player went to jail for 3 doubles
      if (syncedSpecialAction === 'jail') {
        setCanRollAgain(false);
        setHasEndedTurnAfterDoubles(false);
        setIsInDoublesSequence(false); // Exit doubles sequence when going to jail
        // Stop dice animation immediately when going to jail for 3 doubles
        setLocalDiceRolling(false);
      } else {
        // Player rolled doubles but not 3 in a row - they need to click End Turn first
        setCanRollAgain(false);
        // Don't reset hasEndedTurnAfterDoubles here - let it persist for the Roll Again button
      }
    } else {
      setCanRollAgain(false);
    }

    // Track movement completion - wait for both dice animation AND server response
    if (syncedLastDiceRoll && !globalDiceRolling && !localDiceRolling) {
      // Movement is complete immediately when server responds (player moves instantly)
      setMovementComplete(true);
    } else if (globalDiceRolling || localDiceRolling) {
      setMovementComplete(false);
    }

    // Stop local dice rolling when server responds
    if (syncedLastDiceRoll && localDiceRolling) {
      setLocalDiceRolling(false);
    }

    // Stop dice animation if special action is jail (for 3 doubles)
    if (syncedSpecialAction === 'jail' && (globalDiceRolling || localDiceRolling)) {
      setLocalDiceRolling(false);
    }

    // Handle jail-escape action - reset states since turn ends immediately
    if (syncedSpecialAction === 'jail-escape' && (globalDiceRolling || localDiceRolling)) {
      setCanRollAgain(false);
      setHasEndedTurnAfterDoubles(false);
      setIsInDoublesSequence(false);
      setMovementComplete(true);
    }
  }, [gamePhase, syncedLastDiceRoll, globalDiceRolling, localDiceRolling, syncedSpecialAction]);

  // Reset canRollAgain when turn ends
  React.useEffect(() => {
    if (gamePhase === 'turn-end') {
      setCanRollAgain(false);
      // Do NOT reset hasEndedTurnAfterDoubles or isInDoublesSequence here!
      // Only reset those when the turn actually advances to the next player or on special actions.
    }
  }, [gamePhase]);

  // Reset dice roll tracking when game starts
  React.useEffect(() => {
    if (gameStarted) {
      setHasRolledBefore(false);
    }
  }, [gameStarted]);

  // Replace the currentPlayerIndex useEffect with the following:
  const prevPlayerIdRef = React.useRef();
  React.useEffect(() => {
    const currentPlayer = getCurrentPlayer();
    // Only reset doubles state if the player actually changes
    if (prevPlayerIdRef.current !== undefined && currentPlayer && prevPlayerIdRef.current !== currentPlayer.id) {
      // console.log('[DEBUG][RESET DOUBLES][CLIENT]', {
        prevPlayerId: prevPlayerIdRef.current,
        currentPlayerId: currentPlayer && currentPlayer.id,
        currentPlayerIndex,
        hasEndedTurnAfterDoubles,
        isInDoublesSequence,
        allowRollAgain,
        doublesSequenceActive,
        syncedLastDiceRoll,
        gamePhase,
        isMyTurn,
        propsGameState: {
          allowRollAgain: props.allowRollAgain,
          doublesSequenceActive: props.doublesSequenceActive,
          syncedLastDiceRoll: props.syncedLastDiceRoll,
          gamePhase: props.gamePhase,
          currentPlayerIndex: props.currentPlayerIndex,
          currentTurnSocketId: props.currentTurnSocketId,
          turnIndex: props.turnIndex,
          playerStatuses: props.playerStatuses,
          playerPositions: props.playerPositions,
          specialAction: props.specialAction,
        }
      });
      setCanRollAgain(false);
      setHasEndedTurnAfterDoubles(false);
      setHasRolledBefore(false);
      setIsInDoublesSequence(false);
      setMovementComplete(true);
      setLocalDiceRolling(false);
      // Reset dice values when player changes
      setLastValidDiceRoll(null);
      if (lastValidDiceRollRef.current) {
        lastValidDiceRollRef.current = null;
      }
    }
    prevPlayerIdRef.current = currentPlayer ? currentPlayer.id : undefined;
  }, [currentPlayerIndex, getCurrentPlayer]);

  // Track dice roll changes and detect turn changes
  React.useEffect(() => {
    if (syncedLastDiceRoll !== previousDiceRoll) {
      // If we had a previous dice roll and now it's null, and the previous roll was from a different player
      if (previousDiceRoll && syncedLastDiceRoll === null && previousDiceRoll.playerId !== getCurrentPlayer()?.id) {
        // This is a turn change to a different player - reset all states EXCEPT dice faces
        setCanRollAgain(false);
        setHasEndedTurnAfterDoubles(false);
        setHasRolledBefore(false);
        setIsInDoublesSequence(false); // Exit doubles sequence on turn change
        setMovementComplete(true);
        setLocalDiceRolling(false);
        // Do NOT reset dice faces here
      }
      // If same player's dice roll became null, do NOT reset hasEndedTurnAfterDoubles or isInDoublesSequence
    }
  }, [syncedLastDiceRoll, previousDiceRoll]);

  // Handle player move requests (for sending to jail, etc.)
  React.useEffect(() => {
    if (playerMoveRequest && playerMoveRequest.playerId && playerMoveRequest.position !== undefined) {
      const { playerId, position, resolve } = playerMoveRequest;


      // Check if this is a jail move (position 10) and trigger animation
      if (position === 10) {
        // Trigger jail entry animation
        setJailAnimationStates(prev => ({
          ...prev,
          [playerId]: 'entering'
        }));

        // Clear animation after it completes
        setTimeout(() => {
          setJailAnimationStates(prev => {
            const newStates = { ...prev };
            delete newStates[playerId];
            return newStates;
          });
        }, 600); // Match animation duration
      }

      // Get the player's current position to remove them from that space's arrival order
      const currentPosition = syncedPositions[playerId];

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
  }, [playerMoveRequest, onPlayerMoveComplete]);

  // Watch for jail status changes to trigger exit animations
  React.useEffect(() => {
    players.forEach(player => {
      const wasInJail = playerStatuses[player.id] === 'jail';
      const isInJail = playerStatuses[player.id] === 'jail';

      // If player was in jail but is no longer in jail, trigger exit animation
      if (!isInJail && syncedPositions[player.id] === 10) {
        // Trigger jail exit animation
        setJailAnimationStates(prev => ({
          ...prev,
          [player.id]: 'exiting'
        }));

        // Clear animation after it completes
        setTimeout(() => {
          setJailAnimationStates(prev => {
            const newStates = { ...prev };
            delete newStates[player.id];
            return newStates;
          });
        }, 400); // Match animation duration
      }
    });
  }, [playerStatuses, players, syncedPositions]); // Added syncedPositions dependency

  // Watch for vacation events from game logs to reset doubles state
  React.useEffect(() => {
    // Check if the latest game log entry is a vacation event for the current player
    if (gameLog.length > 0) {
      const latestLog = gameLog[gameLog.length - 1];
      const currentPlayer = getCurrentPlayer();

      if (currentPlayer && latestLog.player === currentPlayer.name) {
        if (latestLog.message && latestLog.message.includes('went on vacation')) {
          // console.log(`[DEBUG] Vacation event detected for ${currentPlayer.name}, resetting doubles state`);
          setHasEndedTurnAfterDoubles(false);
          setCanRollAgain(false);
          setHasRolledBefore(false);
          setIsInDoublesSequence(false);
        } else if (latestLog.message && latestLog.message.includes('returned from vacation')) {
          // console.log(`[DEBUG] Vacation return event detected for ${currentPlayer.name}, resetting doubles state`);
          setHasEndedTurnAfterDoubles(false);
          setCanRollAgain(false);
          setHasRolledBefore(false);
          setIsInDoublesSequence(false);
        }
      }
    }
  }, [gameLog, players]);

  // Debug logging for doubles state
  React.useEffect(() => {
    const currentPlayer = getCurrentPlayer();
    if (currentPlayer) {
      // console.log(`[DEBUG] Doubles state for ${currentPlayer.name}:`, {
      //   hasEndedTurnAfterDoubles,
      //   canRollAgain,
      //   hasRolledBefore,
      //   isInDoublesSequence,
      //   syncedLastDiceRoll: syncedLastDiceRoll ? `${syncedLastDiceRoll.dice1} + ${syncedLastDiceRoll.dice2} = ${syncedLastDiceRoll.dice1 + syncedLastDiceRoll.dice2}` : 'null',
      //   isDoubles: syncedLastDiceRoll ? syncedLastDiceRoll.dice1 === syncedLastDiceRoll.dice2 : false
      // });
    }
  }, [hasEndedTurnAfterDoubles, canRollAgain, hasRolledBefore, isInDoublesSequence, syncedLastDiceRoll, players]);

  // Watch for vacation status changes to reset doubles state when player goes on vacation
  React.useEffect(() => {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return;

    const currentPlayerStatus = playerStatuses[currentPlayer.id];
    const isNowOnVacation = currentPlayerStatus &&
      typeof currentPlayerStatus === 'object' &&
      currentPlayerStatus.status === 'vacation';

    // console.log(`[DEBUG] Vacation status check for ${currentPlayer.name}:`, {
    //   currentPlayerStatus,
    //   isNowOnVacation,
    //   hasEndedTurnAfterDoubles,
    //   canRollAgain
    // });

    // Reset doubles state if the current player is on vacation
    if (isNowOnVacation) {
      // console.log(`[DEBUG] ${currentPlayer.name} is on vacation, resetting doubles state`);
      setHasEndedTurnAfterDoubles(false);
      setCanRollAgain(false);
      setHasRolledBefore(false);
      setIsInDoublesSequence(false);
    }
  }, [playerStatuses, players]);

  // Track last property landing emission to prevent duplicates
  const lastEmittedLanding = React.useRef(null);
  const lastDiceRollRef = React.useRef(null);
  const lastButtonLogRef = React.useRef('');

  // Reset lastEmittedLanding when dice roll changes (new turn)
  React.useEffect(() => {
    if (syncedLastDiceRoll && lastDiceRollRef.current !== `${syncedLastDiceRoll.dice1}-${syncedLastDiceRoll.dice2}`) {
      lastEmittedLanding.current = null;
      lastDiceRollRef.current = `${syncedLastDiceRoll.dice1}-${syncedLastDiceRoll.dice2}`;
      lastButtonLogRef.current = ''; // Reset button log when dice roll changes
    }
  }, [syncedLastDiceRoll]);

  // Property landing detection
  React.useEffect(() => {

    if (gameStarted && syncedLastDiceRoll && isMyTurn && !propertyLandingState && !globalDiceRolling && !localDiceRolling) {
      const currentPlayer = getCurrentPlayer();
      if (!currentPlayer) return;

      const currentPosition = syncedPositions[currentPlayer.id];
      if (currentPosition === undefined) return;

      // Skip property landing detection if player is in jail (jail escape roll)
      if (playerStatuses[currentPlayer.id] === 'jail') {
        return;
      }

      // Get property name for current position
      const propertyName = getPropertyNameByPosition(currentPosition);

      // --- GUARD: Do not trigger property landing if not a property space ---
      // --- GUARD: Do not emit if we already emitted for this landing ---
      if (
        propertyName &&
        isPropertySpace(propertyName) &&
        lastEmittedLanding.current !== `${currentPlayer.id}-${currentPosition}-${syncedLastDiceRoll.dice1}-${syncedLastDiceRoll.dice2}`
      ) {
        // Emit for any property space (owned or unowned)
        socket.emit('handlePropertyLanding', {
          roomId,
          propertyName
        });
        lastEmittedLanding.current = `${currentPlayer.id}-${currentPosition}-${syncedLastDiceRoll.dice1}-${syncedLastDiceRoll.dice2}`;
      }
    }
  }, [syncedLastDiceRoll, syncedPositions, isMyTurn, gameStarted, globalDiceRolling, localDiceRolling, propertyOwnership, roomId, playerStatuses]);

  // Reset button log when property landing state changes
  React.useEffect(() => {
    lastButtonLogRef.current = '';
  }, [propertyLandingState]);

  // Reset justPurchasedProperty when dice roll changes (but not immediately)
  React.useEffect(() => {
    if (syncedLastDiceRoll && lastDiceRollRef.current !== `${syncedLastDiceRoll.dice1}-${syncedLastDiceRoll.dice2}`) {
      // Only reset when it's a new dice roll, not when the same roll is cleared
      setJustPurchasedProperty(false);
    }
  }, [syncedLastDiceRoll]);

  // Helper function to get property name by position
  const getPropertyNameByPosition = (position) => {
    const propertyMap = {
      1: 'Salvador',
      3: 'Rio',
      5: 'TLV Airport',
      6: 'Tel Aviv',
      8: 'Haifa',
      9: 'Jerusalem',
      11: 'Venice',
      12: 'Electric Company',
      13: 'Milan',
      14: 'Rome',
      15: 'MUC Airport',
      16: 'Frankfurt',
      18: 'Munich',
      19: 'Berlin',
      21: 'Shenzhen',
      23: 'Beijing',
      24: 'Shanghai',
      25: 'CDG Airport',
      26: 'Lyon',
      27: 'Toulouse',
      28: 'Water Company',
      29: 'Paris',
      31: 'Liverpool',
      32: 'Manchester',
      34: 'London',
      35: 'JFK Airport',
      37: 'California',
      39: 'New York'
    };
    return propertyMap[position];
  };

  // Helper function to check if a space is a property
  const isPropertySpace = (propertyName) => {
    return classicMap.some(prop => prop.name === propertyName);
  };

  const diceRollingStartedByEvent = React.useRef(false);

  const localRollTriggered = React.useRef(false);

  // Add at the top of the component, after useState declarations
  const jailDelayNextRoll = React.useRef(false);

  // Only set the delay flag when a jail event occurs, and only once per event
  React.useEffect(() => {
    if (syncedSpecialAction === 'jail' || syncedSpecialAction === 'go-to-jail') {
      jailDelayNextRoll.current = true;
    }
  }, [syncedSpecialAction]);

  const rollDice = () => {
    if (gamePhase !== 'rolling') return;
    if (globalDiceRolling || localDiceRolling) return;

    setLocalDiceRolling(false);
    localRollTriggered.current = false;

    if (
      syncedLastDiceRoll &&
      typeof syncedLastDiceRoll.dice1 === 'number' &&
      typeof syncedLastDiceRoll.dice2 === 'number'
    ) {
      setLastValidDiceRoll(syncedLastDiceRoll);
    }

    // Only delay the socket event for the first roll after jail
    if (jailDelayNextRoll.current) {
      jailDelayNextRoll.current = false;
      setTimeout(() => {
        socket.emit('diceRollingStarted', { roomId });
      }, 350); // 350ms delay for post-jail roll only
    } else {
      socket.emit('diceRollingStarted', { roomId });
    }

    setMovementComplete(false);

    setTimeout(() => {
      if (onRollDice) {
        onRollDice();
      }
      setPreviousDiceRoll(syncedLastDiceRoll);
    }, 800);
  };

  React.useEffect(() => {
    const handleDiceRollingStarted = () => {
      setLocalDiceRolling(true);
      localRollTriggered.current = false;
    };
    socket.on('diceRollingStarted', handleDiceRollingStarted);
    return () => {
      socket.off('diceRollingStarted', handleDiceRollingStarted);
    };
  }, []);

  // Always reset dice animation state after dice animation finishes or special actions
  React.useEffect(() => {
    if (!localDiceRolling && syncedLastDiceRoll) {
      // Animation finished, reset state for next roll
      localRollTriggered.current = false;
    }
    // Also reset after jail/vacation/special actions
    if (
      syncedSpecialAction === 'jail' ||
      syncedSpecialAction === 'go-to-jail' ||
      syncedSpecialAction === 'vacation' ||
      syncedSpecialAction === 'jail-escape'
    ) {
      setLocalDiceRolling(false);
      localRollTriggered.current = false;
    }
  }, [localDiceRolling, syncedLastDiceRoll, syncedSpecialAction]);

  const handleEndTurn = () => {
    if (endTurnClicked || awaitingRollAfterDoubles) {
      console.warn('[GUARD] handleEndTurn called while already awaiting roll after doubles or endTurnClicked. Ignoring.');
      return;
    }
    setEndTurnClicked(true);
    setAwaitingRollAfterDoubles(true);
    // console.log('[DEBUG][handleEndTurn][CALL STACK]', new Error().stack);
    if (!hasRolledSinceLastEndTurn) {
      console.warn('[GUARD] handleEndTurn called without rolling since last end turn. Ignoring.');
      return;
    }
    setHasRolledSinceLastEndTurn(false);
    const currentPlayer = getCurrentPlayer();
    const currentPosition = syncedPositions && currentPlayer ? syncedPositions[currentPlayer.id] : null;
    // Set doubles state if last roll was doubles and not the third double (not going to jail)
    if (
      syncedLastDiceRoll &&
      syncedLastDiceRoll.dice1 === syncedLastDiceRoll.dice2 &&
      syncedSpecialAction !== 'jail'
    ) {
      setHasEndedTurnAfterDoubles(true);
      setIsInDoublesSequence(true);
    } else {
      setHasEndedTurnAfterDoubles(false);
      setIsInDoublesSequence(false);
    }
    // Debug log
    // console.log('[DEBUG][handleEndTurn] gamePhase:', gamePhase, 'hasEndedTurnAfterDoubles:', hasEndedTurnAfterDoubles, 'isInDoublesSequence:', isInDoublesSequence, 'syncedLastDiceRoll:', syncedLastDiceRoll, 'currentPlayerIndex:', currentPlayerIndex);
    if (
      currentPosition === 20 &&
      currentPlayer &&
      (!playerStatuses[currentPlayer.id] || (typeof playerStatuses[currentPlayer.id] === 'object' && playerStatuses[currentPlayer.id].status !== 'vacation'))
    ) {
      // eslint-disable-next-line no-console
      // console.log('[DEBUG][CLIENT] End Turn button clicked after landing on vacation (position check)');
      socket.emit('endTurn', { roomId, vacationEndTurnPlayerId: currentPlayer.id });
    } else {
      socket.emit('endTurn', { roomId });
    }
    if (onEndTurn) {
      // console.log('[DEBUG][onEndTurn][CALL STACK][handleEndTurn]', new Error().stack);
      onEndTurn();
    }
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
      .filter(player => player && syncedPositions[player.id] === spaceIndex);

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

    // Special handling for jail space (spaceIndex === 10)
    const isJailSpace = spaceIndex === 10;

    if (isJailSpace) {
      // Separate jailed players from visiting players and remove duplicates
      const jailedPlayers = playersOnSpace.filter(player => playerStatuses[player.id] === 'jail');
      const visitingPlayers = playersOnSpace.filter(player => playerStatuses[player.id] !== 'jail');

      // Remove duplicates by player ID
      const uniqueJailedPlayers = jailedPlayers.filter((player, index, self) =>
        index === self.findIndex(p => p.id === player.id)
      );
      const uniqueVisitingPlayers = visitingPlayers.filter((player, index, self) =>
        index === self.findIndex(p => p.id === player.id)
      );

      return (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 100
        }}>
          {/* Jailed Players - Behind Bars */}
          {uniqueJailedPlayers.length > 0 && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: uniqueVisitingPlayers.length > 0 ? 'translate(-60%, -50%)' : 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 90, // Behind bars
              // Calculate container dimensions for proper stacking
              width: `${avatarSize}px`,
              height: uniqueJailedPlayers.length > 1
                ? `${avatarSize + (uniqueJailedPlayers.length - 1) * (avatarSize * 0.5)}px`
                : `${avatarSize}px`,
              justifyContent: 'center'
            }}>
              {uniqueJailedPlayers.map((player, index) => {
                const isCurrentPlayer = currentPlayer && player.id === currentPlayer.id;
                const isMovingPlayer = isMoving && isCurrentPlayer;
                const overlapAmount = avatarSize * 0.5; // 50% overlap for arc effect

                return (
                  <Box
                    key={`jailed-${player.id}-${index}`}
                    className={jailAnimationStates[player.id] ? `jail-avatar-${jailAnimationStates[player.id]}` : ''}
                    sx={{
                      position: 'relative',
                      width: avatarSize,
                      height: avatarSize,
                      borderRadius: '50%',
                      backgroundColor: player.color,
                      border: '3px solid #ef4444', // Red border for jailed players
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
                      zIndex: 90 + index, // Stack jailed players behind bars
                      marginTop: index > 0 ? `-${overlapAmount}px` : 0,
                      flexShrink: 0, // Prevent compression
                      animation: isMovingPlayer ? 'avatarGlow 1s ease-in-out infinite alternate' : 'none',
                      '@keyframes avatarGlow': {
                        '0%': {
                          boxShadow: `0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 20px ${player.color}`,
                          transform: 'scale(1.05)'
                        },
                        '100%': {
                          boxShadow: `0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 30px ${player.color}`,
                          transform: 'scale(1.1)'
                        }
                      },
                      '&:hover': {
                        transform: 'scale(1.15)',
                        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(255, 255, 255, 0.4)',
                        zIndex: 200
                      }
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}

                    {/* Jail bars overlay for jailed players */}
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
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Visiting Players - Outside Bars */}
          {uniqueVisitingPlayers.length > 0 && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: uniqueJailedPlayers.length > 0 ? 'translate(-40%, -50%)' : 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 110, // In front of bars
              // Calculate container dimensions for proper stacking
              width: `${avatarSize}px`,
              height: uniqueVisitingPlayers.length > 1
                ? `${avatarSize + (uniqueVisitingPlayers.length - 1) * (avatarSize * 0.5)}px`
                : `${avatarSize}px`,
              justifyContent: 'center'
            }}>
              {uniqueVisitingPlayers.map((player, index) => {
                const isCurrentPlayer = currentPlayer && player.id === currentPlayer.id;
                const isMovingPlayer = isMoving && isCurrentPlayer;
                const overlapAmount = avatarSize * 0.5; // 50% overlap for arc effect

                return (
                  <Box
                    key={`visiting-${player.id}-${index}`}
                    className={jailAnimationStates[player.id] ? `jail-avatar-${jailAnimationStates[player.id]}` : ''}
                    sx={{
                      position: 'relative',
                      width: avatarSize,
                      height: avatarSize,
                      borderRadius: '50%',
                      backgroundColor: player.color,
                      border: '3px solid #22c55e', // Green border for visiting players
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
                      zIndex: 110 + index, // Stack visiting players in front of bars
                      marginTop: index > 0 ? `-${overlapAmount}px` : 0,
                      flexShrink: 0, // Prevent compression
                      animation: isMovingPlayer ? 'avatarGlow 1s ease-in-out infinite alternate' : 'none',
                      '@keyframes avatarGlow': {
                        '0%': {
                          boxShadow: `0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 20px ${player.color}`
                        },
                        '100%': {
                          boxShadow: `0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 30px ${player.color}`
                        }
                      },
                      '&:hover': {
                        transform: 'scale(1.15)',
                        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(255, 255, 255, 0.4)',
                        zIndex: 200
                      }
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      );
    }

    // Regular space avatar rendering (non-jail spaces)
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
        justifyContent: 'center' // Center the stack
      }}>
        {playersOnSpace.map((player, index) => {
          const isCurrentPlayer = currentPlayer && player.id === currentPlayer.id;
          const isMovingPlayer = isMoving && isCurrentPlayer;

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
                // Use appropriate margins based on stacking direction
                marginTop: index > 0 && !isHorizontalStack ? `-${overlapAmount}px` : 0,
                marginLeft: index > 0 && isHorizontalStack ? `-${overlapAmount}px` : 0,
                flexShrink: 0, // Prevent compression that causes oval shape
                animation: isMovingPlayer ? 'avatarGlow 1s ease-in-out infinite alternate' : 'none',
                '@keyframes avatarGlow': {
                  '0%': {
                    boxShadow: `0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 20px ${player.color}`
                  },
                  '100%': {
                    boxShadow: `0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 30px ${player.color}`
                  }
                },
                '&:hover': {
                  transform: 'scale(1.15)',
                  boxShadow: '0 6px 12px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(255, 255, 255, 0.4)',
                  zIndex: 200 // Bring hovered avatar to top
                }
              }}
            >
              {player.name.charAt(0).toUpperCase()}
            </Box>
          );
        })}
      </Box>
    );
  };
  // Property to country code mapping
  const propertyFlags = {
    'Salvador': 'BR', // Brazil
    'Rio': 'BR', // Brazil
    'Tel Aviv': 'IL', // Israel
    'Haifa': 'IL', // Israel
    'Jerusalem': 'IL', // Israel
    'Venice': 'IT', // Italy
    'Milan': 'IT', // Italy
    'Rome': 'IT', // Italy
    'Frankfurt': 'DE', // Germany
    'Munich': 'DE', // Germany
    'Berlin': 'DE', // Germany
    'Shenzhen': 'CN', // China
    'Beijing': 'CN', // China
    'Shanghai': 'CN', // China
    'Lyon': 'FR', // France
    'Toulouse': 'FR', // France
    'Paris': 'FR', // France
    'Liverpool': 'GB', // UK
    'Manchester': 'GB', // UK
    'London': 'GB', // UK
    'California': 'US', // USA
    'New York': 'US' // USA
  };

  // Helper function to get property data from classic map
  const getPropertyData = (propertyName) => {
    return classicMap.find(prop => prop.name === propertyName);
  };

  // Top row properties (left to right)
  const topRow = [
    { name: 'START', type: 'corner', color: 'green', className: 'start' },
    { name: 'Salvador', type: 'property', flag: propertyFlags['Salvador'], price: getPropertyData('Salvador')?.price || 60 },
    { name: 'Treasure', type: 'treasure', color: 'orange' },
    { name: 'Rio', type: 'property', flag: propertyFlags['Rio'], price: getPropertyData('Rio')?.price || 60 },
    { name: 'Income Tax', type: 'tax', color: 'white' },
    { name: 'TLV Airport', type: 'airport', color: 'gray', price: getPropertyData('TLV Airport')?.price || 200 },
    { name: 'Tel Aviv', type: 'property', flag: propertyFlags['Tel Aviv'], price: getPropertyData('Tel Aviv')?.price || 100 },
    { name: 'Surprise', type: 'surprise', color: 'pink' },
    { name: 'Haifa', type: 'property', flag: propertyFlags['Haifa'], price: getPropertyData('Haifa')?.price || 100 },
    { name: 'Jerusalem', type: 'property', flag: propertyFlags['Jerusalem'], price: getPropertyData('Jerusalem')?.price || 120 },
    { name: 'In Prison / Just Visiting', type: 'corner', color: 'orange', className: 'prison' }
  ];

  // Right row properties (top to bottom)
  const rightRow = [
    { name: 'Venice', type: 'property', flag: propertyFlags['Venice'], price: getPropertyData('Venice')?.price || 140 },
    { name: 'Electric Company', type: 'utility', utilityType: 'electric', color: 'lightblue', price: getPropertyData('Electric Company')?.price || 150 },
    { name: 'Milan', type: 'property', flag: propertyFlags['Milan'], price: getPropertyData('Milan')?.price || 140 },
    { name: 'Rome', type: 'property', flag: propertyFlags['Rome'], price: getPropertyData('Rome')?.price || 160 },
    { name: 'MUC Airport', type: 'airport', color: 'gray', price: getPropertyData('MUC Airport')?.price || 200 },
    { name: 'Frankfurt', type: 'property', flag: propertyFlags['Frankfurt'], price: getPropertyData('Frankfurt')?.price || 180 },
    { name: 'Treasure', type: 'treasure', color: 'orange' },
    { name: 'Munich', type: 'property', flag: propertyFlags['Munich'], price: getPropertyData('Munich')?.price || 180 },
    { name: 'Berlin', type: 'property', flag: propertyFlags['Berlin'], price: getPropertyData('Berlin')?.price || 200 }
  ];

  // Bottom row properties (right to left)
  const bottomRow = [
    { name: 'Shenzhen', type: 'property', flag: propertyFlags['Shenzhen'], price: getPropertyData('Shenzhen')?.price || 220 },
    { name: 'Surprise', type: 'surprise', color: 'pink' },
    { name: 'Beijing', type: 'property', flag: propertyFlags['Beijing'], price: getPropertyData('Beijing')?.price || 220 },
    { name: 'Shanghai', type: 'property', flag: propertyFlags['Shanghai'], price: getPropertyData('Shanghai')?.price || 240 },
    { name: 'CDG Airport', type: 'airport', color: 'gray', price: getPropertyData('CDG Airport')?.price || 200 },
    { name: 'Lyon', type: 'property', flag: propertyFlags['Lyon'], price: getPropertyData('Lyon')?.price || 260 },
    { name: 'Toulouse', type: 'property', flag: propertyFlags['Toulouse'], price: getPropertyData('Toulouse')?.price || 260 },
    { name: 'Water Company', type: 'utility', color: 'lightblue', price: getPropertyData('Water Company')?.price || 150 },
    { name: 'Paris', type: 'property', flag: propertyFlags['Paris'], price: getPropertyData('Paris')?.price || 280 }
  ];

  // Left row properties (bottom to top)
  const leftRow = [
    { name: 'Liverpool', type: 'property', flag: propertyFlags['Liverpool'], price: getPropertyData('Liverpool')?.price || 300 },
    { name: 'Manchester', type: 'property', flag: propertyFlags['Manchester'], price: getPropertyData('Manchester')?.price || 300 },
    { name: 'Treasure', type: 'treasure', color: 'orange' },
    { name: 'London', type: 'property', flag: propertyFlags['London'], price: getPropertyData('London')?.price || 320 },
    { name: 'JFK Airport', type: 'airport', color: 'gray', price: getPropertyData('JFK Airport')?.price || 200 },
    { name: 'Surprise', type: 'surprise', color: 'pink' },
    { name: 'California', type: 'property', flag: propertyFlags['California'], price: getPropertyData('California')?.price || 350 },
    { name: 'Luxury Tax', type: 'tax', color: 'white' },
    { name: 'New York', type: 'property', flag: propertyFlags['New York'], price: getPropertyData('New York')?.price || 400 }
  ];

  // Corner spaces
  const corners = [
    { name: 'Vacation', type: 'corner', color: 'green', className: 'free-parking' },
    { name: 'Go to prison', type: 'corner', color: 'red', className: 'jail' }
  ];

  const handlePropertyClick = (propertyName) => {
    onPropertyClick(propertyName);
  };

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
      <div key={`${position}-${index}`} className={spaceClasses} style={{ position: 'relative' }}
        onClick={() => {
          if (["property", "airport", "utility", "company"].includes(space.type)) {
            handlePropertyClick(space.name);
          }
        }}
      >
        <div className="space-content">
          {space.type === 'property' && (
            <>
              <div className="property-flag">
                {propertyFlags[space.name] && (
                  <ReactCountryFlag
                    countryCode={propertyFlags[space.name]}
                    svg
                    style={{ width: (position === 'top' || position === 'bottom') ? '1em' : '1.5em', height: (position === 'top' || position === 'bottom') ? '1em' : '1.5em' }}
                    title={propertyFlags[space.name]}
                  />
                )}
              </div>
              {space.price && (
                <div
                  className="space-price"
                  style={{
                    background: propertyOwnership[space.name]
                      ? propertyOwnership[space.name].ownerColor
                      : 'rgba(251, 191, 36, 0.3)',
                    color: propertyOwnership[space.name] ? 'white' : '#fbbf24',
                    fontWeight: 'bold',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    minHeight: '16px'
                  }}
                >
                  {propertyOwnership[space.name]?.mortgaged && (
                    <div style={{ position: 'absolute', left: '12.5%', top: '12.5%', width: '75%', height: '75%', background: '#fff', zIndex: 10, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {['top', 'bottom'].includes(position)
                        ? <div style={{ width: '90%', height: '0', borderTop: '6px solid #ef4444' }} />
                        : <div style={{ height: '90%', width: '0', borderLeft: '6px solid #ef4444' }} />}
                    </div>
                  )}
                  {propertyOwnership[space.name]
                    ? (
                      <>
                        {propertyOwnership[space.name].hotel ? (
                          <span style={{ fontSize: '11px' }} title="Hotel">🏨</span>
                        ) : propertyOwnership[space.name].houses > 0 ? (
                          Array.from({ length: propertyOwnership[space.name].houses }, (_, i) => (
                            <span
                              key={i}
                              style={{ fontSize: '9px' }}
                              title={`${propertyOwnership[space.name].houses} house${propertyOwnership[space.name].houses > 1 ? 's' : ''}`}
                            >
                              🏠
                            </span>
                          ))
                        ) : null}
                      </>
                    )
                    : `$${space.price}`
                  }
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
                fontWeight: 'bold',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                minHeight: '16px'
              }}
            >
              {propertyOwnership[space.name]?.mortgaged && (
                <div style={{ position: 'absolute', left: '12.5%', top: '12.5%', width: '75%', height: '75%', background: '#fff', zIndex: 10, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {['top', 'bottom'].includes(position)
                    ? <div style={{ width: '90%', height: '0', borderTop: '6px solid #ef4444' }} />
                    : <div style={{ height: '90%', width: '0', borderLeft: '6px solid #ef4444' }} />}
                </div>
              )}
              {propertyOwnership[space.name] ? null : space.price}
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
                fontWeight: 'bold',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                minHeight: '16px'
              }}
            >
              {propertyOwnership[space.name]?.mortgaged && (
                <div style={{ position: 'absolute', left: '12.5%', top: '12.5%', width: '75%', height: '75%', background: '#fff', zIndex: 10, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {['top', 'bottom'].includes(position)
                    ? <div style={{ width: '90%', height: '0', borderTop: '6px solid #ef4444' }} />
                    : <div style={{ height: '90%', width: '0', borderLeft: '6px solid #ef4444' }} />}
                </div>
              )}
              {propertyOwnership[space.name] ? null : space.price}
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

          {/* Vacation cash display - only show when vacation cash setting is enabled and there's money */}
          {space.name === 'Vacation' && gameSettings?.vacationCash && (
            <div style={{
              position: 'absolute',
              bottom: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: vacationCash > 0 ? 'rgba(34, 197, 94, 0.9)' : 'rgba(156, 163, 175, 0.8)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              zIndex: 130,
              whiteSpace: 'nowrap'
            }}>
              Cash: ${vacationCash}
            </div>
          )}
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
            zIndex: 110,
            animation: 'jailBarsShimmer 3s ease-in-out infinite'
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
            zIndex: 120,
            animation: 'jailTextPulse 2s ease-in-out infinite'
          }}>
            JAIL
          </div>
        )}
      </div>
    );
  };

  // Ref to always store the latest valid dice roll synchronously
  const lastValidDiceRollRef = React.useRef(null);

  React.useEffect(() => {
    if (
      syncedLastDiceRoll &&
      typeof syncedLastDiceRoll.dice1 === 'number' &&
      typeof syncedLastDiceRoll.dice2 === 'number'
    ) {
      lastValidDiceRollRef.current = syncedLastDiceRoll;
      setLastValidDiceRoll(syncedLastDiceRoll);
    } else if (
      previousDiceRoll &&
      syncedLastDiceRoll === null &&
      previousDiceRoll.playerId !== getCurrentPlayer()?.id
    ) {
      lastValidDiceRollRef.current = null;
      setLastValidDiceRoll(null);
    }
    // Do NOT clear dice just because syncedLastDiceRoll is null for the same player
  }, [syncedLastDiceRoll, previousDiceRoll, getCurrentPlayer]);

  React.useEffect(() => {
    // Add this effect to close modal and reset buying state when propertyOwnership updates
    if (propertyLandingState && propertyLandingState.isActive) {
      const isOwned = propertyOwnership[propertyLandingState.property];
      if (isOwned) {
        setShowModal(false);
        setBuying(false);
      }
    }
  }, [propertyOwnership, propertyLandingState]);

  // Reset lastLoggedState when propertyLandingState is cleared
  React.useEffect(() => {
    if (!propertyLandingState && lastLoggedState.current === 'property-landing') {
      lastLoggedState.current = '';
      // Don't set hasHandledPropertyLanding here - only set it when turn actually ends
    }
    // Reset property landing flag when property landing state is set
    if (propertyLandingState && propertyLandingState.isActive) {
      hasHandledPropertyLanding.current = true;
    }
  }, [propertyLandingState]);

  // Reset lastLoggedState when a new dice roll starts (to allow new property landings)
  React.useEffect(() => {
    if (syncedLastDiceRoll && lastLoggedState.current === 'end-turn') {
      // If we have a new dice roll and we were showing end turn, reset the state
      lastLoggedState.current = '';
    }
  }, [syncedLastDiceRoll]);

  React.useEffect(() => {
  }, [propertyOwnership]);

  const handleBuyProperty = () => {
    if (!propertyLandingState || !propertyLandingState.canAfford) return;
    // In the Buy button click handler, before socket.emit('buyProperty', ...):
    window.lastBuyProperty = propertyLandingState.property.name;
    socket.emit('buyProperty', {
      roomId,
      propertyName: propertyLandingState.property.name,
      price: propertyLandingState.price
    });
    if (typeof onBuyProperty === 'function') {
      onBuyProperty();
    }
    setShowModal(false);
    if (typeof onClearPropertyLandingState === 'function') {
      onClearPropertyLandingState(); // <-- Reset propertyLandingState after buy
    }
    if (onEndTurn) {
      // ('[DEBUG][onEndTurn][CALL STACK][handleBuyProperty]', new Error().stack);
      onEndTurn();
    }
  };

  // Track the last logged button state to prevent duplicate logs
  const lastLoggedState = React.useRef('');
  // Track if we've handled property landing for the current dice roll
  const hasHandledPropertyLanding = React.useRef(false);

  // Set the flag when player lands on vacation
  React.useEffect(() => {
    if (
      syncedLastDiceRoll &&
      syncedLastDiceRoll.action === 'vacation' &&
      isMyTurn
    ) {
      setJustPurchasedProperty(true);
    }
  }, [syncedLastDiceRoll, isMyTurn]);

  React.useEffect(() => {
    if (syncedSpecialAction === 'vacation' && isMyTurn) {
      setAwaitingVacationEndTurn(true);
    }
    // Do NOT reset here!
  }, [syncedSpecialAction, isMyTurn]);

  // Reset flag only when backend confirms vacation status
  React.useEffect(() => {
    const currentPlayer = getCurrentPlayer();
    if (
      awaitingVacationEndTurn &&
      currentPlayer &&
      playerStatuses[currentPlayer.id] &&
      typeof playerStatuses[currentPlayer.id] === 'object' &&
      playerStatuses[currentPlayer.id].status === 'vacation'
    ) {
      setAwaitingVacationEndTurn(false);
    }
  }, [playerStatuses, awaitingVacationEndTurn, getCurrentPlayer]);

  // Place this useEffect near other hooks, before the return statement
  React.useEffect(() => {
    // Center Controls Render log
    const landingPlayerId = propertyLandingState?.player?.id || getCurrentPlayer()?.id;
    if (gameStarted) {
      // Check property landing first - this should take priority
      if (
        propertyLandingState &&
        propertyLandingState.isActive &&
        landingPlayerId === getCurrentPlayer()?.id
      ) {
        lastLoggedState.current = 'property-landing';
        return; // Exit early to prevent other button conditions from being checked
      }

      // Check if we should be in property landing state but propertyLandingState hasn't been set yet
      // This happens when a player lands on a property but the state hasn't been updated yet
      const currentPlayer = getCurrentPlayer();

      // Reset property landing flag when we get a new dice roll or when turn changes
      if (syncedLastDiceRoll) {
        // Keep the flag as is during the turn
      } else {
        // Turn has changed, reset the flag
        hasHandledPropertyLanding.current = false;
      }

      // Check if we're waiting for property landing state to be set
      // This should only happen immediately after a dice roll, not after property actions
      const shouldBePropertyLanding =
        syncedLastDiceRoll &&
        movementComplete &&
        isMyTurn &&
        currentPlayer &&
        !globalDiceRolling &&
        !localDiceRolling &&
        gamePhase === 'rolling' &&
        !propertyLandingState && // Only if propertyLandingState is not set yet
        lastLoggedState.current === ''; // Only if we haven't logged any button state yet (fresh dice roll)

      if (shouldBePropertyLanding) {
        // Don't show any buttons while waiting for property landing state to be set
        if (lastLoggedState.current !== 'waiting-for-property-landing') {
          lastLoggedState.current = 'waiting-for-property-landing';
        }
        return; // Exit early to prevent other button conditions from being checked
      }

      // Only check other button conditions if not on a property landing
      if (
        gamePhase === 'rolling' && getCurrentPlayer() && canPlayerRoll(getCurrentPlayer().id) && !globalDiceRolling && !localDiceRolling && playerStatuses[getCurrentPlayer().id] !== 'jail' && (!playerStatuses[getCurrentPlayer().id] || typeof playerStatuses[getCurrentPlayer().id] !== 'object' || playerStatuses[getCurrentPlayer().id].status !== 'vacation') && !syncedLastDiceRoll && !isInDoublesSequence &&
        isMyTurn
      ) {
        if (lastLoggedState.current !== 'roll-dice') {
          lastLoggedState.current = 'roll-dice';
        }
      } else if (
        gamePhase === 'rolling' && getCurrentPlayer() && canPlayerRoll(getCurrentPlayer().id) && hasEndedTurnAfterDoubles && !globalDiceRolling && !localDiceRolling && !syncedLastDiceRoll && isMyTurn
      ) {
        // Check if we landed on a special space that requires ending turn
        const currentPlayer = getCurrentPlayer();
        const currentPosition = syncedPositions[currentPlayer.id];
        const isSpecialSpace = [0, 2, 4, 7, 10, 17, 20, 22, 30, 33, 36, 38].includes(currentPosition);

        if (isSpecialSpace) {
          // Show end turn log for special spaces even when rolling doubles
          let specialSpaceMessage = null;
          if ([2, 4, 7, 17, 22, 33, 36, 38].includes(currentPosition)) {
            specialSpaceMessage = 'Showing End Turn button after rolling';
          }
          if (lastLoggedState.current !== 'end-turn') {
            lastLoggedState.current = 'end-turn';
          }
        } else {
          // Show roll again button for non-special spaces
          if (lastLoggedState.current !== 'roll-again') {
            lastLoggedState.current = 'roll-again';
          }
        }
      } else if (
        gamePhase === 'rolling' && getCurrentPlayer() && canPlayerRoll(getCurrentPlayer().id) && syncedLastDiceRoll && !globalDiceRolling && !localDiceRolling && movementComplete && isMyTurn
      ) {
        // Check if we landed on a special space
        const currentPlayer = getCurrentPlayer();
        const currentPosition = syncedPositions[currentPlayer.id];
        let specialSpaceMessage = null;

        specialSpaceMessage = 'Showing End Turn button after landing on Luxury Tax';
        if ([2, 4, 7, 17, 22, 33, 36, 38].includes(currentPosition)) {
          specialSpaceMessage = 'Showing End Turn button after rolling';
        }

        if (lastLoggedState.current !== 'end-turn') {
          lastLoggedState.current = 'end-turn';
        }
      } else {
        // Reset state if no button should be shown
        lastLoggedState.current = '';
      }
    }
  }, [gameStarted, propertyLandingState, isMyTurn, gamePhase, syncedPlayerMoney, globalDiceRolling, localDiceRolling, playerStatuses, syncedLastDiceRoll, isInDoublesSequence, hasEndedTurnAfterDoubles, movementComplete, getCurrentPlayer, canPlayerRoll]);

  // Debug: Log dice values whenever they change
  React.useEffect(() => {
    // console.log('[DEBUG] syncedLastDiceRoll:', syncedLastDiceRoll);
    // console.log('[DEBUG] lastValidDiceRoll:', lastValidDiceRoll);
  }, [syncedLastDiceRoll, lastValidDiceRoll]);

  // When dice animation finishes, notify the server if a pending special action is active
  React.useEffect(() => {
    if (
      !localDiceRolling &&
      syncedLastDiceRoll &&
      (syncedSpecialAction === 'vacation' || syncedSpecialAction === 'jail' || syncedSpecialAction === 'go-to-jail')
    ) {
      // Animation just finished for a special action
      socket.emit('diceAnimationComplete', { roomId });
    }
  }, [localDiceRolling, syncedLastDiceRoll, syncedSpecialAction, roomId]);

  // Add this effect to re-enable the Buy button only when a new property landing state is received
  React.useEffect(() => {
    setBuying(false);
  }, [propertyLandingState]);

  // Add this effect to clear property landing state and reset buying only after the property is owned by the current user
  React.useEffect(() => {
    if (
      buying &&
      propertyLandingState &&
      propertyLandingState.property &&
      propertyOwnership[propertyLandingState.property.name] &&
      propertyOwnership[propertyLandingState.property.name].owner === currentUserId
    ) {
      setBuying(false);
      setJustPurchasedProperty(true);
      onClearPropertyLandingState && onClearPropertyLandingState();
    }
  }, [propertyOwnership, propertyLandingState, buying, currentUserId, onClearPropertyLandingState]);

  // Add debug log when player lands on vacation
  React.useEffect(() => {
    if (syncedSpecialAction === 'vacation') {
      // eslint-disable-next-line no-console
      // console.log('[DEBUG][CLIENT] Player landed on vacation!');
    }
  }, [syncedSpecialAction]);

  const handleSkipVacationTurn = () => {
    const currentPlayer = getCurrentPlayer();
    if (currentPlayer) {
      socket.emit('skipVacationTurn', { roomId, playerId: currentPlayer.id });
    }
  };

  // Use allowRollAgain and doublesSequenceActive from server if present
  const allowRollAgain = typeof props.allowRollAgain === 'boolean' ? props.allowRollAgain : false;
  const doublesSequenceActive = typeof props.doublesSequenceActive === 'boolean' ? props.doublesSequenceActive : false;

  // Reset endTurnClicked when turn or dice roll changes
  React.useEffect(() => {
    setEndTurnClicked(false);
  }, [currentPlayerIndex, syncedLastDiceRoll]);

  // Set hasRolledSinceLastEndTurn to true after a roll
  React.useEffect(() => {
    if (syncedLastDiceRoll) {
      setHasRolledSinceLastEndTurn(true);
    }
  }, [syncedLastDiceRoll]);
  // Reset hasRolledSinceLastEndTurn to true on turn change
  React.useEffect(() => {
    setHasRolledSinceLastEndTurn(true);
  }, [currentPlayerIndex]);

  // Reset awaitingRollAfterDoubles on turn change or new dice roll
  React.useEffect(() => {
    setAwaitingRollAfterDoubles(false);
  }, [currentPlayerIndex, syncedLastDiceRoll]);

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
            p: 3,
            width: '100%'
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

            {/* Show Start Game button or waiting message when there are players who have chosen colors */}
            {players.length > 0 && players.some(p => p.color) && (
              <Box sx={{ height: 56, display: 'flex', alignItems: 'center', mb: 2 }}>
                {isShufflingPlayers ? (
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '1rem',
                      color: '#f8fafc',
                      textAlign: 'center',
                      width: '100%',
                      lineHeight: '56px',
                    }}
                  >
                    Shuffling Player Order...
                  </Typography>
                ) : isHost ? (
                  <StyledActionButton onClick={onStartGame} sx={{ mb: 0 }}>
                    Start Game
                  </StyledActionButton>
                ) : (
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: '1rem',
                      color: '#f8fafc',
                      textAlign: 'center',
                      width: '100%',
                      lineHeight: '56px',
                    }}
                  >
                    Waiting for host to start the game...
                  </Typography>
                )}
              </Box>
            )}

            {/* Game Log - Show even before game starts */}
            <StyledGameLog elevation={3}>
              <List sx={{ py: 0 }}>
                {gameLog.length > 0 ? gameLog.map((entry, index) => (
                  <ListItem key={entry.id ? `log-${entry.id}-${index}` : `log-${index}-${entry.timestamp || Date.now()}-${Math.random()}`} sx={{ px: 0, py: 0.5 }}>
                    {entry.type === 'system' ? (
                      <ListItemText
                        primary={
                          <Typography
                            component="span"
                            sx={{ color: '#a3a3a3', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', width: '100%' }}
                          >
                            {entry.message}
                          </Typography>
                        }
                      />
                    ) : (
                      <>
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
                      </>
                    )}
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
              <StyledDice elevation={4} isRolling={globalDiceRolling || localDiceRolling}>
                {(globalDiceRolling || localDiceRolling) ? '?' : (lastValidDiceRollRef.current?.dice1 ?? '?')}
              </StyledDice>
              <StyledDice elevation={4} isRolling={globalDiceRolling || localDiceRolling}>
                {(globalDiceRolling || localDiceRolling) ? '?' : (lastValidDiceRollRef.current?.dice2 ?? '?')}
              </StyledDice>
            </Box>

            {/* All Action Buttons - Horizontal Layout - Only show when not moving */}
            {gamePhase !== 'moving' && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                {(() => {
                  // Debug log for button rendering
                  // console.log('[DEBUG][BUTTONS] gamePhase:', gamePhase, 'hasEndedTurnAfterDoubles:', hasEndedTurnAfterDoubles, 'isInDoublesSequence:', isInDoublesSequence, 'syncedLastDiceRoll:', syncedLastDiceRoll, 'currentPlayerIndex:', currentPlayerIndex, 'isMyTurn:', currentUserId === getCurrentPlayer()?.id);
                  const landingPlayerId = propertyLandingState?.player?.id || getCurrentPlayer()?.id;
                  const isMyTurn = currentUserId === getCurrentPlayer()?.id;
                  const isOnVacation = playerStatuses[currentUserId] && typeof playerStatuses[currentUserId] === 'object' && playerStatuses[currentUserId].status === 'vacation';
                  const lastRoll = syncedLastDiceRoll;
                  // Show End Turn button if player just went to jail (jail-move)
                  if (
                    isMyTurn &&
                    lastRoll &&
                    lastRoll.action === 'jail-move'
                  ) {
                    return (
                      <UniformButton
                        variant="purple"
                        onClick={handleEndTurn}
                        disabled={endTurnClicked || globalDiceRolling || localDiceRolling}
                        sx={{ minWidth: 120 }}
                      >
                        End Turn
                      </UniformButton>
                    );
                  }
                  if (isMyTurn && isOnVacation) {
                    return (
                      <UniformButton
                        variant="purple"
                        onClick={handleSkipVacationTurn}
                        disabled={endTurnClicked || globalDiceRolling || localDiceRolling}
                        sx={{ minWidth: 80 }}
                      >
                        Skip Turn
                      </UniformButton>
                    );
                  }
                  if (
                    propertyLandingState &&
                    propertyLandingState.isActive &&
                    landingPlayerId === getCurrentPlayer()?.id
                  ) {
                    if (lastButtonLogRef.current !== 'property-landing') {
                      // console.log('[DEBUG] Showing Buy and End Turn buttons for property landing');
                      lastButtonLogRef.current = 'property-landing';
                    }
                    return <>
                      <UniformButton
                        variant="green"
                        disabled={buying || syncedPlayerMoney[landingPlayerId] < propertyLandingState.price}
                        onClick={() => {
                          if (propertyLandingState && propertyLandingState.canAfford && !buying) {
                            setBuying(true);
                            // console.log('[DEBUG] Buy button clicked: emitting buyProperty', {
                              roomId,
                              propertyName: propertyLandingState.property.name,
                              price: propertyLandingState.price
                            });
                            socket.emit('buyProperty', {
                              roomId,
                              propertyName: propertyLandingState.property.name,
                              price: propertyLandingState.price
                            });
                            // Do NOT clear property landing state or setJustPurchasedProperty here; wait for server response
                            lastButtonLogRef.current = '';
                          }
                        }}
                      >
                        Buy for ${propertyLandingState.price}
                      </UniformButton>
                      <UniformButton
                        variant="purple"
                        onClick={() => {
                          // console.log('[DEBUG] End Turn clicked from property landing, showing Roll Dice button');
                          handleEndTurn();
                        }}
                        disabled={endTurnClicked || globalDiceRolling || localDiceRolling}
                      >
                        End Turn
                      </UniformButton>
                    </>;
                  } else {
                    // Check if player just purchased a property - show End Turn button
                    if (justPurchasedProperty && syncedLastDiceRoll && !globalDiceRolling && !localDiceRolling && movementComplete && isMyTurn) {
                      if (lastButtonLogRef.current !== 'end-turn-after-purchase') {
                        lastButtonLogRef.current = 'end-turn-after-purchase';
                      }
                      return <UniformButton variant="purple" onClick={() => {
                        // console.log('[DEBUG] End Turn clicked after purchasing property, showing Roll Dice button');
                        setJustPurchasedProperty(false);
                        // Always call handleEndTurn to properly handle the turn end
                        handleEndTurn();
                      }}>End Turn</UniformButton>;
                    }

                    // Jail Escape Actions - Show when player is in jail
                    if (
                      gamePhase === 'rolling' && getCurrentPlayer() && playerStatuses[getCurrentPlayer().id] === 'jail' && !globalDiceRolling && !localDiceRolling && !syncedLastDiceRoll && isMyTurn
                    ) {
                      if (lastButtonLogRef.current !== 'jail-escape') {
                        // console.log('[DEBUG] Showing jail escape buttons');
                        lastButtonLogRef.current = 'jail-escape';
                      }

                      const currentPlayer = getCurrentPlayer();
                      const hasJailCard = playerJailCards[currentPlayer.id] && playerJailCards[currentPlayer.id] > 0;
                      const canAffordFine = syncedPlayerMoney[currentPlayer.id] >= 50;

                      return (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                          <UniformButton
                            variant="green"
                            onClick={() => {
                              // console.log('[DEBUG] Pay jail fine clicked');
                              // Clear doubles sequence when paying fine
                              setHasEndedTurnAfterDoubles(false);
                              setIsInDoublesSequence(false);
                              setCanRollAgain(false);
                              setHasRolledBefore(false);
                              if (onPayJailFine) onPayJailFine();
                            }}
                            disabled={endTurnClicked || globalDiceRolling || localDiceRolling || isOnVacation}
                          >
                            Pay $50
                          </UniformButton>
                          <UniformButton
                            variant="blue"
                            onClick={() => {
                              // console.log('[DEBUG] Roll dice for jail escape clicked');
                              rollDice();
                            }}
                            disabled={endTurnClicked || globalDiceRolling || localDiceRolling || isOnVacation}
                          >
                            Roll Dice
                          </UniformButton>
                          {hasJailCard > 0 && (
                            <UniformButton
                              variant="purple"
                              onClick={() => {
                                // console.log('[DEBUG] Use pardon card clicked');
                                // Clear doubles sequence when using pardon card
                                setHasEndedTurnAfterDoubles(false);
                                setIsInDoublesSequence(false);
                                setCanRollAgain(false);
                                setHasRolledBefore(false);
                                if (onUseJailCard) onUseJailCard();
                              }}
                              disabled={endTurnClicked || globalDiceRolling || localDiceRolling || isOnVacation}
                            >
                              Use Pardon Card
                            </UniformButton>
                          )}
                        </Box>
                      );
                    }

                    // Normal Rolling Actions - Only show when not in property landing
                    if (
                      gamePhase === 'rolling' && getCurrentPlayer() && canPlayerRoll(getCurrentPlayer().id) && !globalDiceRolling && !localDiceRolling && playerStatuses[getCurrentPlayer().id] !== 'jail' && (!playerStatuses[getCurrentPlayer().id] || typeof playerStatuses[getCurrentPlayer().id] !== 'object' || playerStatuses[getCurrentPlayer().id].status !== 'vacation') && !syncedLastDiceRoll && isMyTurn
                    ) {
                      // If player is in a doubles sequence (i.e., just ended turn after rolling doubles), show 'Roll Again' instead of 'Roll Dice'
                      if (allowRollAgain || doublesSequenceActive || isInDoublesSequence || hasEndedTurnAfterDoubles) {
                        if (lastButtonLogRef.current !== 'roll-again') {
                          lastButtonLogRef.current = 'roll-again';
                        }
                        return <UniformButton variant="blue" onClick={() => {
                          rollDice();
                        }}>Roll Again</UniformButton>;
                      } else {
                        if (lastButtonLogRef.current !== 'roll-dice') {
                          lastButtonLogRef.current = 'roll-dice';
                        }
                        return <UniformButton onClick={() => {
                          rollDice();
                        }}>Roll Dice</UniformButton>;
                      }
                    }
                    // Jail escape dice roll result - show End Turn button immediately
                    if (
                      gamePhase === 'rolling' && getCurrentPlayer() && playerStatuses[getCurrentPlayer().id] === 'jail' && syncedLastDiceRoll && !globalDiceRolling && !localDiceRolling && movementComplete && isMyTurn
                    ) {
                      // If player is in jail, just rolled, and did not escape, auto-end turn (no End Turn button)
                      if (lastButtonLogRef.current !== 'jail-escape-auto-end') {
                        // console.log('[DEBUG] Auto-ending turn after failed jail escape roll');
                        lastButtonLogRef.current = 'jail-escape-auto-end';
                        setTimeout(() => {
                          handleEndTurn();
                        }, 300); // slight delay for UX
                      }
                      return null;
                    }

                    // Show Roll Again button after ending turn on doubles
                    if (
                      gamePhase === 'rolling' && getCurrentPlayer() && canPlayerRoll(getCurrentPlayer().id) && hasEndedTurnAfterDoubles && !globalDiceRolling && !localDiceRolling && !syncedLastDiceRoll && isMyTurn
                    ) {
                      if (lastButtonLogRef.current !== 'roll-again-after-end-turn') {
                        // console.log('[DEBUG] Showing Roll Again button after ending turn on doubles');
                        lastButtonLogRef.current = 'roll-again-after-end-turn';
                      }
                      return <UniformButton variant="blue" onClick={() => {
                        // console.log('[DEBUG] Roll Again clicked after ending turn');
                        rollDice();
                      }}>Roll Again</UniformButton>;
                    }
                    if (
                      gamePhase === 'rolling' && getCurrentPlayer() && canPlayerRoll(getCurrentPlayer().id) && syncedLastDiceRoll && !globalDiceRolling && !localDiceRolling && movementComplete && isMyTurn && syncedLastDiceRoll.dice1 === syncedLastDiceRoll.dice2
                    ) {
                      // Check if we landed on a special space that requires ending turn during doubles
                      const currentPlayer = getCurrentPlayer();
                      const currentPosition = syncedPositions[currentPlayer.id];

                      // Check if this is a property space - if so, don't show doubles buttons yet
                      const propertyName = getPropertyNameByPosition(currentPosition);
                      if (propertyName && isPropertySpace(propertyName) && !propertyOwnership[propertyName]) {
                        // This is an unowned property space - don't show doubles buttons yet
                        return null;
                      }

                      const isSpecialSpace = [0, 2, 4, 7, 10, 17, 20, 22, 30, 33, 36, 38].includes(currentPosition);

                      if (isSpecialSpace) {
                        // Show end turn for special spaces even when rolling doubles
                        if (lastButtonLogRef.current !== 'end-turn-doubles') {
                          // console.log('[DEBUG] Showing End Turn button after landing on special space during doubles');
                          lastButtonLogRef.current = 'end-turn-doubles';
                        }
                        return <UniformButton variant="purple" onClick={() => {
                          // console.log('[DEBUG] End Turn clicked from special space during doubles, showing Roll Dice button');
                          handleEndTurn();
                        }}>End Turn</UniformButton>;
                      } else {
                        if (lastButtonLogRef.current !== 'roll-again-doubles') {
                          // console.log('[DEBUG] Showing Roll Again button for doubles');
                          lastButtonLogRef.current = 'roll-again-doubles';
                        }
                        return <UniformButton variant="blue" onClick={() => {
                          // console.log('[DEBUG] Roll Again clicked');
                          rollDice();
                        }}>Roll Again</UniformButton>;
                      }
                    }
                    if (
                      gamePhase === 'rolling' && getCurrentPlayer() && canPlayerRoll(getCurrentPlayer().id) && syncedLastDiceRoll && !globalDiceRolling && !localDiceRolling && movementComplete && isMyTurn && !hasEndedTurnAfterDoubles
                    ) {
                      // Check if we landed on a special space
                      const currentPlayer = getCurrentPlayer();
                      const currentPosition = syncedPositions[currentPlayer.id];

                      // Check if this is a property space - if so, don't show End Turn button yet
                      const propertyName = getPropertyNameByPosition(currentPosition);
                      if (propertyName && isPropertySpace(propertyName) && !propertyOwnership[propertyName]) {
                        // This is an unowned property space - don't show End Turn button yet
                        return null;
                      }

                      let specialSpaceMessage = 'Showing End Turn button after rolling';

                      if ([2, 4, 7, 17, 22, 33, 36, 38].includes(currentPosition)) {
                        specialSpaceMessage = 'Showing End Turn button after rolling';
                      }

                      if (lastButtonLogRef.current !== 'end-turn-normal') {
                        // console.log(`[DEBUG] ${specialSpaceMessage}`);
                        lastButtonLogRef.current = 'end-turn-normal';
                      }
                      return <UniformButton variant="purple" onClick={() => {
                        // console.log('[DEBUG] End Turn clicked from special space, showing Roll Dice button');
                        handleEndTurn();
                      }}>End Turn</UniformButton>;
                    }
                    // After the block for showing Roll Again and Roll Dice, add this logic:
                    // Show End Turn button after a non-double roll following a doubles sequence
                    if (
                      gamePhase === 'rolling' && getCurrentPlayer() && canPlayerRoll(getCurrentPlayer().id) && syncedLastDiceRoll && !globalDiceRolling && !localDiceRolling && movementComplete && isMyTurn && isInDoublesSequence && syncedLastDiceRoll.dice1 !== syncedLastDiceRoll.dice2
                    ) {
                      if (lastButtonLogRef.current !== 'end-turn-after-doubles-sequence') {
                        // console.log('[DEBUG] Showing End Turn button after non-double roll following doubles sequence');
                        lastButtonLogRef.current = 'end-turn-after-doubles-sequence';
                      }
                      return <UniformButton variant="purple" onClick={() => {
                        // console.log('[DEBUG] End Turn clicked after doubles sequence, advancing to next player');
                        handleEndTurn();
                      }}>End Turn</UniformButton>;
                    }
                    return null;
                  }
                })()}

              </Box>
            )}

            {/* Game Log */}
            <StyledGameLog elevation={3}>
              <List sx={{ py: 0 }}>
                {gameLog.length > 0 ? gameLog.map((entry, index) => (
                  <ListItem key={entry.id ? `log-${entry.id}-${index}` : `log-${index}-${entry.timestamp || Date.now()}-${Math.random()}`} sx={{ px: 0, py: 0.5 }}>
                    {entry.type === 'system' ? (
                      <ListItemText
                        primary={
                          <Typography
                            component="span"
                            sx={{ color: '#a3a3a3', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', width: '100%' }}
                          >
                            {entry.message}
                          </Typography>
                        }
                      />
                    ) : (
                      <>
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
                      </>
                    )}
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
        <CustomModal
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
        </CustomModal>


      </div>
    </div>
  );
}

export default MonopolyBoard;