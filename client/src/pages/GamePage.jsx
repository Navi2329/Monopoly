import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Grid,
  Modal,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import {
  Home,
  PersonRemove,
  MoneyOff,
  SwapHoriz,
  Add,
  Settings,
  MonetizationOn,
  Close
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import MonopolyBoard from '../components/game/MonopolyBoard';
import ShareGame from '../components/game/ShareGame';
import Chat from '../components/game/Chat';
import PlayerList from '../components/game/PlayerList';
import GameSettings from '../components/game/GameSettings';
import PlayerSelection from '../components/game/PlayerSelection';
import MapPreviewModal from '../components/game/MapPreviewModal';
import MapFullPreview from '../components/game/MapFullPreview';
import classicMap from '../data/maps/classic';
import AuctionModal from '../components/game/AuctionModal';
import { useUser } from '../contexts/UserContext';
import socket from '../socket';
import PropertyPopup from '../components/game/PropertyPopup';

const StyledSidebar = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  width: '380px',
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  paddingBottom: 0, // Remove bottom padding
  boxSizing: 'border-box',
}));

const StyledMainArea = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.8))',
  backdropFilter: 'blur(10px)',
  flex: 1,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  minHeight: 0,
  overflow: 'hidden',
  height: '100dvh',
  maxHeight: '100dvh'
}));

const StyledHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  textAlign: 'center'
}));

const StyledActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  padding: '12px 20px',
  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  color: 'white',
  border: 'none',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
  }
}));

const PropertyCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.6))',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '12px',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8))',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
  }
}));

const GamePage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const playerNameFromNav = location.state?.playerName;

  // Track the current room and player name globally for reconnect logic
  window.currentRoomId = roomId;
  window.currentPlayerName = playerNameFromNav;

  // --- DEBUG: Log socket id and roomId on mount and on every reconnect ---
  useEffect(() => {
    const handleConnect = () => {
      if (window.currentRoomId && window.currentPlayerName) {
        socket.emit('joinRoom', {
          roomId: window.currentRoomId,
          playerName: window.currentPlayerName,
        });
      }
    };
    socket.on('connect', handleConnect);
    return () => {
      socket.off('connect', handleConnect);
    };
  }, [roomId]);

  // Multiplayer state
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerJoined, setPlayerJoined] = useState(false);
  const [gameLog, setGameLog] = useState([]);

  // Game state from server
  const [playerPositions, setPlayerPositions] = useState({});

  // Game state variables (moved to top to avoid undefined errors)
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState('waiting');
  const [syncedPositions, setSyncedPositions] = useState({});
  const [syncedStatuses, setSyncedStatuses] = useState({});
  const [syncedTurnIndex, setSyncedTurnIndex] = useState(0);
  const [syncedRound, setSyncedRound] = useState(1);
  const [syncedLastDiceRoll, setSyncedLastDiceRoll] = useState(null);
  const [syncedPlayerMoney, setSyncedPlayerMoney] = useState({});
  const [syncedSpecialAction, setSyncedSpecialAction] = useState(null);
  const [currentTurnSocketId, setCurrentTurnSocketId] = useState(null);
  const [globalDiceRolling, setGlobalDiceRolling] = useState(false);
  const [localDiceRolling, setLocalDiceRolling] = useState(false);

  // Helper function to wait for dice animation to complete before ending turn
  const waitForDiceAnimationAndEndTurn = (endTurnCallback) => {
    const checkDiceAnimation = () => {
      if (!globalDiceRolling && !localDiceRolling) {
        // Dice animation is complete, end turn
        endTurnCallback();
      } else {
        // Check again in 100ms
        setTimeout(checkDiceAnimation, 100);
      }
    };

    // Start checking for dice animation completion
    setTimeout(checkDiceAnimation, 100);
  };

  // Add this near the other useState hooks at the top of GamePage
  const [lastDiceRoll, setLastDiceRoll] = useState(null);

  // Property popup state
  const [propertyPopupOpen, setPropertyPopupOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const prevPropertyOwnershipRef = useRef({});

  // Move onGameStateUpdated outside useEffect for stable reference
  const onGameStateUpdated = React.useCallback((gameState) => {
    // Log the game state as a collapsible object
    // console.log('[DEBUG] [CLIENT] FULL gameStateUpdated:', gameState);
    // --- FIX: Log after property purchase only when owned by current player ---
    if (
      window.lastBuyProperty &&
      gameState.propertyOwnership &&
      gameState.propertyOwnership[window.lastBuyProperty] &&
      gameState.propertyOwnership[window.lastBuyProperty].owner === socket.id
    ) {
      // console.log('[DEBUG] [CLIENT] Buy Property completed:', gameState);
      window.lastBuyProperty = null;
    }
  }, []);

  // --- Remove all duplicate gameStateUpdated listeners and ensure only one is active ---
  useEffect(() => {
    // Remove any previous listeners before adding a new one
    const handleGameStateUpdated = (gameState) => {
      // console.log('[DEBUG] [CLIENT] FULL gameStateUpdated:', gameState, 'socket.id:', socket.id, 'roomId:', roomId);
      // ...existing onGameStateUpdated logic...
      if (
        window.lastBuyProperty &&
        gameState.propertyOwnership &&
        gameState.propertyOwnership[window.lastBuyProperty] &&
        gameState.propertyOwnership[window.lastBuyProperty].owner === socket.id
      ) {
        // console.log('[DEBUG] [CLIENT] Buy Property completed:', gameState);
        window.lastBuyProperty = null;
      }
    };
    return () => {
    };
  }, [roomId]);

  useEffect(() => {
    if (roomId) {
      socket.emit('requestPlayerList', { roomId });
    }
    // Listen for player list updates
    socket.on('playerListUpdated', (playerList) => {
      setPlayers(playerList);
      // Set current player by matching socket id
      const mySocketId = socket.id;
      const me = playerList.find(p => p.id === mySocketId);
      setCurrentPlayer(me);
      setIsHost(me?.isHost || false);
      // Only set playerJoined to true if the player is in the player list
      setPlayerJoined(!!me);
      // Request the current game log from the server when player list updates (e.g., on join)
      socket.emit('requestGameLog', { roomId });
    });
    // Listen for direct playerList response (before joining)
    socket.on('playerList', (playerList) => {
      setPlayers(playerList);
    });
    // Listen for room settings updates
    socket.on('roomSettingsUpdated', (settings) => {
      setGameSettings(settings);
    });
    // Listen for game started
    socket.on('gameStarted', () => {
      if (isShufflingPlayers) {
        // Wait for shuffling animation to finish before starting the game
        setTimeout(() => {
          setGameStarted(true);
          setGamePhase('rolling');
        }, 2000);
      } else {
        setGameStarted(true);
        setGamePhase('rolling');
      }
    });
    // Listen for game state updates from server
    // Listen for game log updates from backend
    socket.on('gameLogUpdated', (logEntry) => {
      // console.log('[CLIENT] Received gameLogUpdated:', logEntry);
      setGameLog(prev => [{ id: Date.now(), ...logEntry }, ...prev]);
    });
    // Listen for full game log from backend
    socket.on('fullGameLog', (logArray) => {
      setGameLog(logArray.map(entry => ({ id: Date.now() + Math.random(), ...entry })).reverse());
    });
    // Listen for color taken error from backend
    socket.on('colorTakenError', ({ message }) => {
      alert(message || 'Color already taken. Please choose another color.');
      setPlayerJoined(false); // Re-open the PlayerSelection overlay
    });
    // Listen for property landing events from server
    socket.on('propertyLanding', (landingData) => {
      // console.log('[DEBUG] Received propertyLanding event:', landingData);
      // Find the player object by id if provided, else fallback to currentPlayer
      let playerObj = currentPlayer;
      if (landingData.playerId) {
        playerObj = allPlayers.find(p => p.id === landingData.playerId) || currentPlayer;
      }

      // Get the property object from classicMap
      const property = classicMap.find(p => p.name === landingData.propertyName);
      if (!property) {
        // console.log('[DEBUG] Property not found in classicMap:', landingData.propertyName);
        return;
      }

      setPropertyLandingState({
        property: property,
        player: playerObj,
        isActive: true,
        price: landingData.price,
        canAfford: landingData.canAfford,
        action: landingData.action
      });
    });
    // Listen for purchase errors
    socket.on('purchaseError', ({ message }) => {
      alert(message || 'Purchase failed');
    });

    // Listen for dice rolling events from any player
    socket.on('diceRollingStarted', () => {
      setGlobalDiceRolling(true);
      // Stop global rolling after animation duration (reduced to match roll duration)
      setTimeout(() => {
        setGlobalDiceRolling(false);
      }, 800);
    });

    // Listen for shufflingPlayers event from server
    socket.on('shufflingPlayers', ({ shuffledOrder }) => {
      setIsShufflingPlayers(true);
      // Map shuffledOrder (array of ids) to player objects
      const order = shuffledOrder.map(id => players.find(p => p.id === id)).filter(Boolean);
      setShuffledOrder(order);
      setTimeout(() => {
        setIsShufflingPlayers(false);
        setShuffledOrder([]);
      }, 2000);
    });

    // Optionally: fetch initial state if needed
    return () => {
      socket.off('playerListUpdated');
      socket.off('playerList');
      socket.off('roomSettingsUpdated');
      socket.off('gameStarted');
      socket.off('gameLogUpdated');
      socket.off('fullGameLog');
      socket.off('colorTakenError');
      socket.off('propertyLanding');
      socket.off('purchaseError');
      socket.off('diceRollingStarted');
      socket.off('shufflingPlayers');
    };
  }, [roomId, onGameStateUpdated, players]);

  // Player states
  const [playerStatuses, setPlayerStatuses] = useState({}); // { playerId: { status: 'jail' | 'vacation', vacationStartRound?: number } }

  // Track consecutive doubles for each player
  const [playerDoublesCount, setPlayerDoublesCount] = useState({}); // { playerId: number of consecutive doubles }

  // Track jail cards for each player
  const [playerJailCards, setPlayerJailCards] = useState({}); // { playerId: number of jail cards }

  // Track jail rounds for each player (for automatic release after 3 rounds)
  const [playerJailRounds, setPlayerJailRounds] = useState({}); // { playerId: number of rounds in jail }



  // Track collected money for vacation cash rule
  const [collectedMoney, setCollectedMoney] = useState({}); // { playerId: amount }
  const [vacationCash, setVacationCash] = useState(0); // Total money collected for vacation
  const isProcessingLanding = useRef(false); // Prevent duplicate processing

  // Counter for generating unique IDs for game log entries
  const [logIdCounter, setLogIdCounter] = useState(0);



  // Helper function to generate unique log IDs
  const generateLogId = () => {
    setLogIdCounter(prev => prev + 1);
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${logIdCounter}`;
  };

  // Property ownership and landing
  const [propertyLandingState, setPropertyLandingState] = useState(null); // { property, player, isActive } - null when no property landing

  // State to handle player move requests from GamePage to MonopolyBoard
  const [playerMoveRequest, setPlayerMoveRequest] = useState(null);

  // Dev options state
  // Dev options state
  const [devDiceEnabled, setDevDiceEnabled] = useState(false);
  const [devDice1, setDevDice1] = useState(1);
  const [devDice2, setDevDice2] = useState(1);

  // Bots state
  const [bots, setBots] = useState([]);
  const [isAddingBots, setIsAddingBots] = useState(false);
  const [shuffledOrder, setShuffledOrder] = useState([]);

  // Ref to store the final shuffled order
  const shuffledOrderRef = useRef(null);
  const [shuffleVersion, setShuffleVersion] = useState(0);

  // Ref to track if game has started (for immediate bot stopping)
  const gameStartedRef = useRef(false);

  // Add syncedPlayersOrdered state to store the latest player order from the server
  const [syncedPlayersOrdered, setSyncedPlayersOrdered] = useState([]);

  // Combine human players and bots for display
  // Use server-synced order if available, otherwise use current order
  const allPlayers = React.useMemo(() => {
    if (gameStarted && syncedPlayersOrdered.length > 0) {
      // Merge server-sent order with up-to-date player objects (for money, status, etc.)
      return syncedPlayersOrdered.map(player => {
        // Find the current version of this player in players or bots arrays
        const currentPlayer = players.find(p => p.id === player.id) || bots.find(b => b.id === player.id);
        return currentPlayer ? { ...currentPlayer, ...player } : player;
      });
    }
    if (shuffledOrderRef.current && gameStarted) {
      return shuffledOrderRef.current;
    }
    return [...players, ...bots];
  }, [players, bots, gameStarted, shuffleVersion, syncedPlayersOrdered]);

  // State to track if randomization was used
  const [wasRandomized, setWasRandomized] = useState(false);

  // Reset game started ref when game state changes
  React.useEffect(() => {
    if (!gameStarted) {
      gameStartedRef.current = false;
    }
  }, [gameStarted]);

  // Update shuffled order when player money changes (to keep UI in sync)
  React.useEffect(() => {
    if (shuffledOrderRef.current && gameStarted) {
      // Update the shuffled order with current player data
      const updatedShuffledOrder = shuffledOrderRef.current.map(player => {
        // Find the current version of this player in players or bots arrays
        const currentPlayer = players.find(p => p.id === player.id) || bots.find(b => b.id === player.id);
        return currentPlayer || player; // Fallback to original if not found
      });
      shuffledOrderRef.current = updatedShuffledOrder;
      // Force re-render by incrementing version
      setShuffleVersion(prev => prev + 1);
    }
  }, [players, bots, gameStarted]);

  // Dev options change handler
  const handleDevDiceChange = (type, value) => {
    switch (type) {
      case 'enabled':
        setDevDiceEnabled(value);
        break;
      case 'dice1':
        setDevDice1(value);
        break;
      case 'dice2':
        setDevDice2(value);
        break;
      default:
        break;
    }
  };

  // Handle player cash change from developer settings
  const handlePlayerCashChange = (playerId, newCash) => {
    // Update human players
    setPlayers(prev => prev.map(player =>
      player.id === playerId
        ? { ...player, money: newCash }
        : player
    ));

    // Update bots
    setBots(prev => prev.map(bot =>
      bot.id === playerId
        ? { ...bot, money: newCash }
        : bot
    ));

    // Update current player if it's the same player
    if (currentPlayer && currentPlayer.id === playerId) {
      setCurrentPlayer(prev => ({ ...prev, money: newCash }));
    }

    // Log the cash change
    const player = allPlayers.find(p => p.id === playerId);
    if (player) {
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'info',
        message: `${player.name}'s cash adjusted to $${newCash}`
      }, ...prev]);
    }
  };

  // Game settings
  const [gameSettings, setGameSettings] = useState({});

  // Sync allowAuction with auction on mount/settings change
  useEffect(() => {
    setGameSettings(prev => ({
      ...prev,
      allowAuction: prev.auction !== undefined ? prev.auction : prev.allowAuction
    }));
  }, []);

  // Bot names for dynamic joining
  const botNames = [
    'CyberTrader', 'PropertyBot', 'RichBot', 'MonopolyAI',
    'AutoInvestor', 'SmartPlayer', 'GameBot', 'TradeMaster'
  ];

  // Available colors for players (matches PlayerSelection.jsx)
  const availableColors = [
    '#a3e635', '#fbbf24', '#f97316', '#ef4444',
    '#3b82f6', '#06b6d4', '#10b981', '#22c55e',
    '#a855f7', '#ec4899', '#f43f5e', '#8b5cf6'
  ];

  // Function to get next available color
  const getNextAvailableColor = (currentBots = []) => {
    const usedColors = [...players.map(p => p.color), ...bots.map(b => b.color), ...currentBots.map(b => b.color)];
    return availableColors.find(color => !usedColors.includes(color)) || availableColors[0];
  };

  // Function to add bots with delays
  const addBotsWithDelay = async (botsNeeded, startingCash) => {
    if (botsNeeded <= 0) return;

    setIsAddingBots(true);

    // Get names of existing bots to avoid duplicates
    const existingBotNames = bots.map(bot => bot.name);
    const availableBotNames = botNames.filter(name => !existingBotNames.includes(name));

    const newBots = [];

    for (let i = 0; i < botsNeeded && i < availableBotNames.length; i++) {
      // Check if game has started - if so, stop adding bots (use ref for immediate check)
      if (gameStarted || gameStartedRef.current) {
        // Log that bot adding was interrupted
        if (i > 0) {
          setGameLog(prev => [{
            id: generateLogId(),
            type: 'info',
            message: `Game started while adding bots - ${i} bot${i !== 1 ? 's' : ''} added successfully`
          }, ...prev]);
        }
        break;
      }

      const botName = availableBotNames[i];
      const bot = {
        id: `bot-${generateLogId()}-${i}`,
        name: botName,
        isBot: true,
        isOnline: true,
        color: getNextAvailableColor(newBots),
        money: startingCash,
        icon: botName[0],
        isJoining: true
      };

      newBots.push(bot);
      setBots(prev => [...prev, bot]);

      // Add bot join message to game log
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'join',
        player: botName,
        message: ' joined the game'
      }, ...prev]);

      // Wait 1 second before adding next bot
      if (i < botsNeeded - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Remove joining animation after all bots are added
    setTimeout(() => {
      setBots(prev => prev.map(bot => ({ ...bot, isJoining: false })));
      setIsAddingBots(false);
    }, 500);
  };

  // Effect to manage bots when settings change
  React.useEffect(() => {
    const manageBotsAsync = async () => {
      // Stop adding bots if game has already started (use ref for immediate check)
      if (gameStarted || gameStartedRef.current) {
        return;
      }

      if (gameSettings.allowBots && !isAddingBots && playerJoined) {
        // Calculate how many bots we need
        const humanPlayers = players.filter(p => !p.isBot);
        const totalSlotsNeeded = gameSettings.maxPlayers - humanPlayers.length;
        const botsNeeded = totalSlotsNeeded - bots.length;

        if (botsNeeded > 0) {
          await addBotsWithDelay(botsNeeded, gameSettings.startingCash);
        } else if (botsNeeded < 0) {
          // Remove excess bots only when maxPlayers is reduced
          const botsToKeep = bots.slice(0, totalSlotsNeeded);
          setBots(botsToKeep);
        }
      }
      // Note: Removed automatic bot removal when allowBots is disabled
      // Players can manually kick bots using the X icon instead
    };

    manageBotsAsync();
  }, [gameSettings.allowBots, gameSettings.maxPlayers, players.length, gameSettings.startingCash, gameStarted, playerJoined, isAddingBots]);

  // Effect to update existing players' money when starting cash or any game setting changes
  React.useEffect(() => {
    if (!gameStarted && playerJoined) {
      // Update human players' money
      setPlayers(prev => prev.map(player => ({
        ...player,
        money: gameSettings.startingCash
      })));

      // Update current player's money
      setCurrentPlayer(prev => prev ? ({
        ...prev,
        money: gameSettings.startingCash
      }) : null);

      // Update bots' money
      setBots(prev => prev.map(bot => ({
        ...bot,
        money: gameSettings.startingCash
      })));
    }
  }, [gameSettings, gameStarted, playerJoined]);





  // Get property by space index
  const getPropertyBySpaceIndex = (spaceIndex) => {
    // Board layout clockwise: 0-10 (top), 11-19 (right), 20-30 (bottom), 31-39 (left)
    const propertyMap = {
      // Top row (excluding START and corners)
      1: 'Salvador', 3: 'Rio', 5: 'TLV Airport', 6: 'Tel Aviv', 8: 'Haifa', 9: 'Jerusalem',
      // Right row
      11: 'Venice', 12: 'Electric Company', 13: 'Milan', 14: 'Rome', 15: 'MUC Airport', 16: 'Frankfurt', 18: 'Munich', 19: 'Berlin',
      // Bottom row
      21: 'Shenzhen', 23: 'Beijing', 24: 'Shanghai', 25: 'CDG Airport', 26: 'Lyon', 27: 'Toulouse', 28: 'Water Company', 29: 'Paris',
      // Left row
      31: 'Liverpool', 32: 'Manchester', 34: 'London', 35: 'JFK Airport', 37: 'California', 39: 'New York'
    };

    const cornerMap = {
      0: 'START', 10: 'PRISON', 20: 'VACATION', 30: 'GO TO JAIL'
    }
    const propertyName = cornerMap[spaceIndex] || propertyMap[spaceIndex];
    return classicMap.find(prop => prop.name === propertyName);
  };

  // Handle property landing
  const handlePropertyLanding = (playerIndex, spaceIndex) => {
    // console.log('[DEBUG] handlePropertyLanding called with playerIndex:', playerIndex, 'spaceIndex:', spaceIndex);
    const currentPlayer = allPlayers[playerIndex];

    if (!currentPlayer) {
      // console.log('[DEBUG] No current player found');
      return;
    }

    // Prevent duplicate processing
    if (isProcessingLanding.current) {
      // console.log('[DEBUG] Already processing landing, skipping');
      return;
    }
    // console.log('[DEBUG] Setting isProcessingLanding to true');
    isProcessingLanding.current = true;

    // Safety timeout to reset flag
    setTimeout(() => {
      isProcessingLanding.current = false;
    }, 2000);

    // Handle tax spaces first (these are not in classicMap)
    if (spaceIndex === 4) { // Income Tax
      const taxAmount = Math.floor(currentPlayer.money * 0.1); // 10% of cash

      // Deduct money from player
      if (currentPlayer.isBot) {
        setBots(prev => prev.map(bot =>
          bot.id === currentPlayer.id
            ? { ...bot, money: bot.money - taxAmount }
            : bot
        ));
      } else {
        setPlayers(prev => prev.map(p =>
          p.id === currentPlayer.id
            ? { ...p, money: p.money - taxAmount }
            : p
        ));
        if (currentPlayer.id === currentPlayer?.id) {
          setCurrentPlayer(prev => ({ ...prev, money: prev.money - taxAmount }));
        }
      }

      // Add to vacation cash if enabled, otherwise goes to bank
      if (gameSettings.vacationCash) {
        setVacationCash(prev => {
          const newTotal = prev + taxAmount;
          return newTotal;
        });
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'info',
          message: `Vacation cash increased to $${vacationCash + taxAmount}`
        }, {
          id: generateLogId(),
          type: 'tax',
          player: currentPlayer.name,
          message: `paid $${taxAmount} income tax to vacation fund`
        }, ...prev]);
      } else {
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'tax',
          player: currentPlayer.name,
          message: `paid $${taxAmount} income tax to bank`
        }, ...prev]);
      }
      return;
    }

    if (spaceIndex === 38) { // Luxury Tax
      const taxAmount = 75; // Fixed $75

      // Deduct money from player
      if (currentPlayer.isBot) {
        setBots(prev => prev.map(bot =>
          bot.id === currentPlayer.id
            ? { ...bot, money: bot.money - taxAmount }
            : bot
        ));
      } else {
        setPlayers(prev => prev.map(p =>
          p.id === currentPlayer.id
            ? { ...p, money: p.money - taxAmount }
            : p
        ));
        if (currentPlayer.id === currentPlayer?.id) {
          setCurrentPlayer(prev => ({ ...prev, money: prev.money - taxAmount }));
        }
      }

      // Add to vacation cash if enabled, otherwise goes to bank
      if (gameSettings.vacationCash) {
        setVacationCash(prev => {
          const newTotal = prev + taxAmount;
          return newTotal;
        });
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'info',
          message: `Vacation cash increased to $${vacationCash + taxAmount}`
        }, {
          id: generateLogId(),
          type: 'tax',
          player: currentPlayer.name,
          message: `paid $${taxAmount} luxury tax to vacation fund`
        }, ...prev]);
      } else {
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'tax',
          player: currentPlayer.name,
          message: `paid $${taxAmount} luxury tax to bank`
        }, ...prev]);
      }
      return;
    }

    // Now handle regular properties
    const property = getPropertyBySpaceIndex(spaceIndex);
    if (!property) {
      isProcessingLanding.current = false;
      return;
    }

    // Check if property is already owned
    const ownership = syncedPropertyOwnership[property.name];

    if (ownership && ownership.owner !== currentPlayer.id) {
      // Property is owned by someone else - pay rent
      let rentAmount = 0;

      if (ownership.mortgaged) {
        // Mortgaged properties don't collect rent
        rentAmount = 0;
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'info',
          player: currentPlayer.name,
          message: `landed on ${property.name} but it's mortgaged - no rent due`
        }, ...prev]);
      } else if (property.type === 'property' && property.rent && Array.isArray(property.rent)) {
        // Calculate rent based on houses/hotel
        const houses = ownership.houses || 0;
        const hasHotel = ownership.hotel || false;

        if (hasHotel && property.rent[5] !== undefined) {
          rentAmount = property.rent[5]; // Hotel rent
        } else if (property.rent[houses] !== undefined) {
          rentAmount = property.rent[houses]; // Rent based on number of houses
        } else {
          rentAmount = property.rent[0]; // Fallback to base rent
        }
      } else if (property.type === 'airport' && property.rent && Array.isArray(property.rent)) {
        // Airport rent based on number of airports owned by the same player
        const ownerAirports = Object.values(syncedPropertyOwnership).filter(
          p => p.owner === ownership.owner && classicMap.find(prop => prop.name === p.name)?.type === 'airport'
        ).length;
        const rentIndex = Math.min(ownerAirports - 1, 3); // 0-3 index for 1-4 airports
        rentAmount = property.rent[rentIndex] || property.rent[0]; // Use base rent as fallback
      } else if (property.type === 'company' && property.rent && Array.isArray(property.rent)) {
        // Company rent based on number of companies owned by the same player
        const ownerCompanies = Object.values(syncedPropertyOwnership).filter(
          p => p.owner === ownership.owner && classicMap.find(prop => prop.name === p.name)?.type === 'company'
        ).length;
        const multiplier = property.rent[Math.min(ownerCompanies - 1, 1)] || property.rent[0]; // 0-1 index for 1-2 companies
        // Use the current dice roll total for company rent calculation
        const diceTotal = lastDiceRoll ? lastDiceRoll.dice1 + lastDiceRoll.dice2 : 7; // Fallback to 7 if no dice roll
        rentAmount = multiplier * diceTotal;
      } else {
        // Fallback for properties without rent or invalid rent structure
        rentAmount = 0;
      }

      // Apply double rent if owner has full set and setting is enabled
      if (gameSettings.doubleRentOnFullSet && property.type === 'property') {
        const setProperties = classicMap.filter(p => p.set === property.set && p.type === 'property');
        const ownedFullSet = setProperties.every(p => syncedPropertyOwnership[p.name] && syncedPropertyOwnership[p.name].owner === ownership.owner);
        if (ownedFullSet) {
          rentAmount *= 2;
        }
      }

      // Don't collect rent if owner is in prison and setting is enabled
      if (gameSettings.noRentInPrison) {
        const ownerStatus = playerStatuses[ownership.owner];
        if (ownerStatus === 'jail') {
          rentAmount = 0;
          setGameLog(prev => [{
            id: generateLogId(),
            type: 'info',
            player: currentPlayer.name,
            message: `landed on ${property.name} but owner is in jail - no rent due`
          }, ...prev]);
        }
      }

      if (rentAmount > 0) {
        handlePropertyRent(currentPlayer.name, ownership.ownerName, property.name, rentAmount);
      }
    } else if (!ownership) {
      // Property is unowned
      if (currentPlayer.isBot) {
        // Bot automatically tries to buy if it has enough money
        if (currentPlayer.money >= property.price) {
          handleBotPropertyPurchase(currentPlayer, property);
        } else {
          setGameLog(prev => [{
            id: generateLogId(),
            type: 'info',
            player: currentPlayer.name,
            message: `cannot afford ${property.name} ($${property.price})`
          }, ...prev]);
        }
      } else {
        // Human player - show purchase options as horizontal buttons
        // Only set property landing state if it's not already set for this property
        if (!propertyLandingState || propertyLandingState.property.name !== property.name) {
          // console.log('[DEBUG] Setting propertyLandingState for property:', property.name);
          setPropertyLandingState({
            property: property,
            player: currentPlayer,
            isActive: true
          });
        } else {
          // console.log('[DEBUG] Property landing state already set for property:', property.name);
        }
      }
    }
    // If property is owned by current player, nothing happens
  };

  // Handle bot property purchase
  const handleBotPropertyPurchase = (bot, property) => {
    // Update property ownership
    setSyncedPropertyOwnership(prev => ({
      ...prev,
      [property.name]: {
        owner: bot.id,
        ownerName: bot.name,
        ownerColor: bot.color,
        houses: 0,
        hotel: false,
        mortgaged: false
      }
    }));

    // Deduct money from bot
    setBots(prev => prev.map(b =>
      b.id === bot.id
        ? { ...b, money: b.money - property.price }
        : b
    ));

    // Log the purchase
    handlePropertyPurchase(bot.name, property.name, property.price);
  };

  // Handle jail escape with fine payment
  const handlePayJailFine = () => {
    const currentPlayer = allPlayers[currentPlayerIndex];
    if (!currentPlayer || currentPlayer.money < 50) return;

    // Send pay jail fine request to server
    socket.emit('payJailFine', { roomId });

    // Clear property landing state
    setPropertyLandingState(null);
  };

  // Handle jail escape with card
  const handleUseJailCard = () => {
    const currentPlayer = allPlayers[currentPlayerIndex];
    if (!currentPlayer || !playerJailCards[currentPlayer.id] || playerJailCards[currentPlayer.id] <= 0) return;

    // Send use jail card request to server
    socket.emit('useJailCard', { roomId });

    // Clear property landing state
    setPropertyLandingState(null);
  };

  const gameUrl = `http://localhost:5173/game/${roomId}`;

  const handleSendMessage = (messageText) => {
    if (!playerJoined) return; // Don't allow messages until joined

    const newMessage = {
      id: generateLogId(),
      text: messageText,
      sender: currentPlayer?.name || 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
  };

  // Add shuffling state
  const [isShufflingPlayers, setIsShufflingPlayers] = useState(false);
  const [shufflingOverlayVisible, setShufflingOverlayVisible] = useState(false);

  // Helper to shuffle array
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Modified handleStartGame
  const handleStartGame = () => {
    if (!playerJoined) return;
    if (gameSettings.randomizePlayerOrder) {
      // Host requests shuffle from server
      socket.emit('requestShuffle', { roomId });
    } else {
      socket.emit('startGame', { roomId });
    }
  };

  // Listen for shufflingPlayers event from server
  useEffect(() => {
    const handleShufflingPlayers = ({ shuffledOrder }) => {
      setIsShufflingPlayers(true);
      setShufflingOverlayVisible(true); // Show overlay for all clients
      // Map shuffledOrder (array of ids) to player objects
      const order = shuffledOrder.map(id => players.find(p => p.id === id)).filter(Boolean);
      setShuffledOrder(order);
      setTimeout(() => {
        setIsShufflingPlayers(false);
        setShuffledOrder([]);
        setShufflingOverlayVisible(false); // Hide overlay after animation
        // Only the host emits startGame after animation
        if (isHost) {
          socket.emit('startGame', { roomId, shuffledOrder });
        }
      }, 2000);
    };
    socket.on('shufflingPlayers', handleShufflingPlayers);
    return () => {
      socket.off('shufflingPlayers', handleShufflingPlayers);
    };
  }, [players, isHost, roomId]);

  // For rendering player list, use server-synced order if available
  const displayPlayers = React.useMemo(() => {
    if (isShufflingPlayers && shuffledOrder.length > 0) return shuffledOrder;
    if (gameStarted && syncedPlayersOrdered.length > 0) return allPlayers;
    return players;
  }, [isShufflingPlayers, shuffledOrder, players, allPlayers, gameStarted, syncedPlayersOrdered]);

  const handleRollDice = (dice1, dice2, total, isDoubles, specialAction, landedSpaceIndex, currentPos) => {
    setLastDiceRoll({ dice1, dice2, total });
    // Keep game phase as rolling during movement to avoid delays
    // setGamePhase('moving'); // Removed to prevent delays

    const currentPlayer = allPlayers[currentPlayerIndex];

    // Track consecutive doubles
    if (isDoubles) {
      const currentDoublesCount = playerDoublesCount[currentPlayer.id] || 0;
      const newDoublesCount = currentDoublesCount + 1;

      setPlayerDoublesCount(prev => ({
        ...prev,
        [currentPlayer.id]: newDoublesCount
      }));

      // Check if player rolled 3 doubles in a row
      if (newDoublesCount >= 3) {
        // Send player to jail for rolling 3 doubles
        setPlayerStatuses(prev => ({
          ...prev,
          [currentPlayer.id]: 'jail'
        }));

        // Initialize jail rounds for this player
        setPlayerJailRounds(prev => ({
          ...prev,
          [currentPlayer.id]: 0
        }));

        // Reset doubles count
        setPlayerDoublesCount(prev => ({
          ...prev,
          [currentPlayer.id]: 0
        }));

        setGameLog(prev => [{
          id: generateLogId(),
          type: 'special',
          player: currentPlayer?.name,
          message: `rolled 3 doubles in a row and was sent to jail! 🚔`
        }, ...prev]);

        // Set game phase to turn-end immediately to prevent showing jail escape buttons
        setGamePhase('turn-end');

        // Move player directly to jail (position 10) instead of their rolled position
        handleMovePlayerToPosition(currentPlayer.id, 10).then(() => {
          // Clear the last dice roll to prevent "roll again" logic
          setLastDiceRoll(null);

          // Wait for dice animation to complete before ending turn
          waitForDiceAnimationAndEndTurn(() => handleEndTurn(true));
        });
        return;
      }
    } else {
      // Reset doubles count if didn't roll doubles
      setPlayerDoublesCount(prev => ({
        ...prev,
        [currentPlayer.id]: 0
      }));
    }

    // Handle START space rewards
    const newPos = landedSpaceIndex;
    const startPos = currentPos || 0;

    // Check if player passed or landed on START (position 0)
    let startBonus = 0;
    let startMessage = '';

    if (startPos !== 0 && newPos === 0) {
      // Landed exactly on START
      startBonus = 300;
      startMessage = 'landed on START and collected $300!';
    } else if (startPos + total > 40 && newPos !== 0) {
      // Passed START (wrapped around) but didn't land on it
      startBonus = 200;
      startMessage = 'passed START and collected $200!';
    }

    // Award START bonus
    if (startBonus > 0) {
      if (currentPlayer.isBot) {
        setBots(prev => prev.map(bot =>
          bot.id === currentPlayer.id
            ? { ...bot, money: bot.money + startBonus }
            : bot
        ));
      } else {
        setPlayers(prev => prev.map(p =>
          p.id === currentPlayer.id
            ? { ...p, money: p.money + startBonus }
            : p
        ));
        if (currentPlayer.id === currentPlayer?.id) {
          setCurrentPlayer(prev => ({ ...prev, money: prev.money + startBonus }));
        }
      }

      // START bonus goes directly to player only (not to vacation cash)
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'special',
        player: currentPlayer?.name,
        message: startMessage
      }, ...prev]);
    }

    // Handle special actions
    if (specialAction === 'jail') {
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'special',
        player: currentPlayer?.name,
        message: `was sent to jail! 🚔`
      }, ...prev]);

      // Set player status to jail
      setPlayerStatuses(prev => ({
        ...prev,
        [currentPlayer.id]: 'jail'
      }));

      // Initialize jail rounds for this player
      setPlayerJailRounds(prev => ({
        ...prev,
        [currentPlayer.id]: 0
      }));

      // Reset doubles count when sent to jail
      setPlayerDoublesCount(prev => ({
        ...prev,
        [currentPlayer.id]: 0
      }));

      // Set game phase to turn-end immediately to prevent showing jail escape buttons
      setGamePhase('turn-end');

      // Wait for dice animation to complete before ending turn
      waitForDiceAnimationAndEndTurn(() => handleEndTurn(true));
      return;
    } else if (specialAction === 'vacation') {
      // Award collected money if vacation cash rule is enabled
      if (gameSettings.vacationCash && vacationCash > 0) {
        const currentVacationCash = vacationCash;
        setVacationCash(0); // Reset vacation cash

        // Add vacation cash to player
        if (currentPlayer.isBot) {
          setBots(prev => prev.map(bot =>
            bot.id === currentPlayer.id
              ? { ...bot, money: bot.money + currentVacationCash }
              : bot
          ));
        } else {
          setPlayers(prev => prev.map(p =>
            p.id === currentPlayer.id
              ? { ...p, money: p.money + currentVacationCash }
              : p
          ));
          if (currentPlayer.id === currentPlayer?.id) {
            setCurrentPlayer(prev => ({ ...prev, money: prev.money + currentVacationCash }));
          }
        }

        setGameLog(prev => [{
          id: generateLogId(),
          type: 'special',
          player: currentPlayer?.name,
          message: `landed on vacation and collected $${currentVacationCash} from taxes and bank payments! 🏖️💰`
        }, ...prev]);

        // Log that vacation cash is reset
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'info',
          message: 'Vacation cash reset to $0'
        }, ...prev]);
      } else {
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'special',
          player: currentPlayer?.name,
          message: `landed on vacation! 🏖️ Turn ends immediately.`
        }, ...prev]);
      }

      setPlayerStatuses(prev => {
        const newStatuses = {
          ...prev,
          [currentPlayer.id]: { status: 'vacation', vacationStartRound: roundNumber }
        };
        return newStatuses;
      });

      setLastDiceRoll(null); // <-- Clear dice after vacation

      // Wait for dice animation to complete before ending turn
      waitForDiceAnimationAndEndTurn(() => handleEndTurn(true, { [currentPlayer.id]: { status: 'vacation', vacationStartRound: roundNumber } }));
      return;
    } else if (specialAction === 'jail-escape') {
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'special',
        player: currentPlayer?.name,
        message: `rolled doubles and escaped from jail! 🎲`
      }, ...prev]);

      // Reset doubles count when escaping jail (don't count the escape double)
      setPlayerDoublesCount(prev => ({
        ...prev,
        [currentPlayer.id]: 0
      }));

      // Clear jail rounds when escaping jail
      setPlayerJailRounds(prev => {
        const newRounds = { ...prev };
        delete newRounds[currentPlayer.id];
        return newRounds;
      });

      // Set game phase to turn-end to prevent showing any buttons
      setGamePhase('turn-end');

      // Wait for dice animation to complete before ending turn
      waitForDiceAnimationAndEndTurn(() => handleEndTurn(true));
      return;
    } else if (specialAction === 'jail-stay') {
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'info',
        player: currentPlayer?.name,
        message: `stays in jail (didn't roll doubles) 🔒`
      }, ...prev]);

      // Set game phase to turn-end to prevent showing any buttons
      setGamePhase('turn-end');

      // Wait for dice animation to complete before ending turn
      waitForDiceAnimationAndEndTurn(() => handleEndTurn(true));
      return;
    } else if (specialAction === 'jail-auto-release') {
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'special',
        player: currentPlayer?.name,
        message: `is automatically released from jail after 3 turns! 🚪`
      }, ...prev]);

      // Clear jail rounds when automatically released
      setPlayerJailRounds(prev => {
        const newRounds = { ...prev };
        delete newRounds[currentPlayer.id];
        return newRounds;
      });

      // Set game phase to turn-end to prevent showing any buttons
      setGamePhase('turn-end');

      // Wait for dice animation to complete before ending turn
      waitForDiceAnimationAndEndTurn(() => handleEndTurn(true));
      return;
    }

    // Only add high roll events (doubles are handled in the doubles logic below)
    if (total >= 10 && !specialAction && dice1 !== dice2) {
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'info',
        player: currentPlayer?.name,
        message: `rolled a high ${total}!`
      }, ...prev]);
    }
    // Normal rolls are not logged to keep the log clean

    // Check if player landed on a purchasable property
    if (landedSpaceIndex !== undefined && !specialAction) {
      // console.log('[DEBUG] Calling handlePropertyLanding for spaceIndex:', landedSpaceIndex);
      handlePropertyLanding(currentPlayerIndex, landedSpaceIndex);
    } else {
      // console.log('[DEBUG] Not calling handlePropertyLanding - landedSpaceIndex:', landedSpaceIndex, 'specialAction:', specialAction);
    }

    // Handle doubles logic
    if (isDoubles && !specialAction && (playerDoublesCount[currentPlayer.id] || 0) < 3) {
      // Player rolled doubles, they can choose to end turn or roll again
      // Keep them in rolling phase so they can choose to end turn first
      setGamePhase('rolling');
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'special',
        player: currentPlayer?.name,
        message: `rolled doubles! ${dice1} + ${dice2} = ${total} - End turn to roll again.`
      }, ...prev]);
    } else if (!specialAction) {
      // Normal turn end (only if not a special action)
      setGamePhase('turn-end');
    }
  };

  // Fix: Add forceNextPlayer param to handleEndTurn
  const handleEndTurn = (forceNextPlayer = false, pendingVacationStatus = null) => {
    setPropertyLandingState(null);
    isProcessingLanding.current = false; // Reset processing flag

    // Send end turn request to server
    socket.emit('endTurn', { roomId });
  };

  // Reset processing flag when property landing state is cleared
  React.useEffect(() => {
    if (!propertyLandingState) {
      isProcessingLanding.current = false;
    }
  }, [propertyLandingState]);

  const handleSettingsChange = (newSettings) => {
    setGameSettings(prev => ({
      ...prev,
      ...newSettings,
      allowAuction: newSettings.auction !== undefined ? newSettings.auction : prev.allowAuction
    }));
    if (isHost && roomId) {
      socket.emit('updateRoomSettings', { roomId, newSettings });
    }
  };

  const handleMapPreviewOpen = () => {
    setMapPreviewOpen(true);
  };

  const handleMapPreviewClose = () => {
    setMapPreviewOpen(false);
  };

  const handleMapSelect = (selectedMap) => {
    setGameSettings(prev => ({ ...prev, boardMap: selectedMap }));
  };

  const handleMapFullPreview = (mapName) => {
    setPreviewingMap(mapName);
    setMapFullPreviewOpen(true);
    setMapPreviewOpen(false); // Close the browser modal
  };

  const handleMapFullPreviewClose = () => {
    setMapFullPreviewOpen(false);
  };

  const handleBotsChange = (newBots) => {
    setBots(newBots);
  };

  const handleCreateTrade = () => {
    // Add trade creation logic here
  };

  // Handler functions for buttons
  const handleVotekick = () => {
    // Add votekick logic here
  };

  const handleBankrupt = () => {
    // Add bankrupt logic here
  };

  const handleKickPlayer = (playerId) => {

    // Check if it's a bot or human player
    const isBot = playerId.startsWith('bot-');

    if (isBot) {
      // Remove bot
      setBots(prev => prev.filter(bot => bot.id !== playerId));
    } else {
      // Remove human player
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    }
  };

  const handleChangeAppearance = () => {
    setChangeAppearanceOpen(true);
  };

  const handleChangeAppearanceClose = () => {
    setChangeAppearanceOpen(false);
  };

  const handleAppearanceUpdate = (newColor) => {
    // Update current player's color
    const updatedPlayer = { ...currentPlayer, color: newColor };
    setCurrentPlayer(updatedPlayer);
    setPlayers(prev => prev.map(p => p.id === currentPlayer.id ? updatedPlayer : p));
    setChangeAppearanceOpen(false);

    // Add message to chat
    setMessages(prev => [...prev, {
      id: generateLogId(),
      text: `Changed appearance to ${getColorName(newColor)}`,
      sender: currentPlayer?.name || 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const getColorName = (color) => {
    const colorOptions = [
      { color: '#a3e635', name: 'Lime' },
      { color: '#fbbf24', name: 'Yellow' },
      { color: '#f97316', name: 'Orange' },
      { color: '#ef4444', name: 'Red' },
      { color: '#3b82f6', name: 'Blue' },
      { color: '#06b6d4', name: 'Cyan' },
      { color: '#10b981', name: 'Teal' },
      { color: '#22c55e', name: 'Green' },
      { color: '#a855f7', name: 'Purple' },
      { color: '#ec4899', name: 'Pink' },
      { color: '#f43f5e', name: 'Rose' },
      { color: '#8b5cf6', name: 'Violet' }
    ];
    return colorOptions.find(opt => opt.color === color)?.name || 'Unknown';
  };

  // Get all used colors (excluding current player when changing appearance)
  const getUsedColors = () => {
    return allPlayers.filter(p => p.id !== currentPlayer?.id).map(p => p.color);
  };

  // Handler for property purchase events
  const handlePropertyPurchase = (playerName, propertyName, price) => {
    setGameLog(prev => [{
      id: generateLogId(),
      type: 'purchase',
      player: playerName,
      message: `bought ${propertyName} for $${price}`
    }, ...prev]);
  };

  // Handle property purchase from horizontal buttons
  const handleBuyProperty = () => {
    if (propertyLandingState && propertyLandingState.isActive) {
      // console.log(`[DEBUG] Emitting buyProperty for room: ${roomId}, socket connected: ${socket.connected}, socket.id: ${socket.id}`);
      // console.log('[SOCKET INSTANCE BEFORE BUY]', socket, 'socket.id =', socket.id);
      socket.emit('buyProperty', {
        roomId,
        propertyName: propertyLandingState.property.name,
        price: propertyLandingState.price
      });
      // console.log('[SOCKET INSTANCE AFTER BUY]', socket, 'socket.id =', socket.id);
    }
  };

  // Handle auction from horizontal buttons
  const handleAuctionProperty = () => {
    if (propertyLandingState && propertyLandingState.isActive) {
      socket.emit('auctionProperty', {
        roomId,
        propertyName: propertyLandingState.property.name
      });
      // Do NOT clear propertyLandingState here; let the board handle it after turn end
    }
  };

  // Handle skipping to buy property
  const handleSkipProperty = () => {
    if (propertyLandingState && propertyLandingState.isActive) {
      socket.emit('skipProperty', {
        roomId,
        propertyName: propertyLandingState.property.name
      });
      // Do NOT clear propertyLandingState here; let the board handle it after turn end
    }
  };

  // Property management handlers
  const handleBuildHouse = (propertyName) => {
    // Multiplayer: emit socket event
    if (gameStarted) {
      console.log('[DEBUG] Emitting buildHouse', propertyName, roomId);
      socket.emit('buildHouse', { roomId, propertyName });
      return;
    }
    // ... existing singleplayer/local logic ...
    const currentPlayer = allPlayers[currentPlayerIndex];
    if (!currentPlayer) return;

    const property = classicMap.find(p => p.name === propertyName);
    if (!property || property.type !== 'property') return;

    const ownership = syncedPropertyOwnership[propertyName];
    if (!ownership || ownership.owner !== currentPlayer.id) return;

    // Check if player can build (owns full set, no mortgaged properties in set, has money)
    const setProperties = classicMap.filter(p => p.set === property.set && p.type === 'property');
    const ownedSet = setProperties.every(p => syncedPropertyOwnership[p.name] && syncedPropertyOwnership[p.name].owner === currentPlayer.id);
    const anyMortgaged = setProperties.some(p => syncedPropertyOwnership[p.name]?.mortgaged);

    if (!ownedSet || anyMortgaged) {
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'info',
        player: currentPlayer.name,
        message: `cannot build on ${propertyName} - must own full set and no mortgaged properties`
      }, ...prev]);
      return;
    }

    const currentHouses = ownership.houses || 0;
    const hasHotel = ownership.hotel || false;

    // Check if houses are built evenly across the set (only if even build rule is enabled)
    if (gameSettings.evenBuild) {
      // For even build calculation, treat hotels as 4 houses
      const setHouseCounts = setProperties.map(p => {
        const propHouses = syncedPropertyOwnership[p.name]?.houses || 0;
        const propHotel = syncedPropertyOwnership[p.name]?.hotel || false;
        return propHotel ? 4 : propHouses;
      });
      const minHouses = Math.min(...setHouseCounts);
      const maxHouses = Math.max(...setHouseCounts);

      // Calculate current property's effective house count
      const currentEffectiveHouses = hasHotel ? 4 : currentHouses;

      // Can only build on properties that have the minimum number of houses
      if (currentEffectiveHouses > minHouses) {
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'info',
          player: currentPlayer.name,
          message: `cannot build on ${propertyName} - must build houses evenly across the set`
        }, ...prev]);
        return;
      }
    }

    if (hasHotel) {
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'info',
        player: currentPlayer.name,
        message: `cannot build more on ${propertyName} - already has hotel`
      }, ...prev]);
      return;
    }

    if (currentHouses >= 4) {
      // Check if all properties in the set have 4 houses before building hotel (only if even build is enabled)
      if (gameSettings.evenBuild) {
        // For hotels, we need to check if all properties have either 4 houses or a hotel
        const allReadyForHotel = setProperties.every(p => {
          const propHouses = syncedPropertyOwnership[p.name]?.houses || 0;
          const propHotel = syncedPropertyOwnership[p.name]?.hotel || false;
          return propHouses >= 4 || propHotel;
        });
        if (!allReadyForHotel) {
          setGameLog(prev => [{
            id: generateLogId(),
            type: 'info',
            player: currentPlayer.name,
            message: `cannot build hotel on ${propertyName} - all properties in set must have 4 houses or hotels first`
          }, ...prev]);
          return;
        }
      }

      // Build hotel
      if (currentPlayer.money < property.hotelCost) {
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'info',
          player: currentPlayer.name,
          message: `cannot build hotel on ${propertyName} - needs $${property.hotelCost}`
        }, ...prev]);
        return;
      }

      // Update property ownership
      setSyncedPropertyOwnership(prev => ({
        ...prev,
        [propertyName]: {
          ...prev[propertyName],
          houses: 0,
          hotel: true
        }
      }));

      // Deduct money from player
      if (currentPlayer.isBot) {
        setBots(prev => prev.map(bot =>
          bot.id === currentPlayer.id
            ? { ...bot, money: bot.money - property.hotelCost }
            : bot
        ));
      } else {
        setPlayers(prev => prev.map(p =>
          p.id === currentPlayer.id
            ? { ...p, money: p.money - property.hotelCost }
            : p
        ));
        if (currentPlayer.id === currentPlayer?.id) {
          setCurrentPlayer(prev => ({ ...prev, money: prev.money - property.hotelCost }));
        }
      }

      setGameLog(prev => [{
        id: generateLogId(),
        type: 'purchase',
        player: currentPlayer.name,
        message: `built hotel on ${propertyName} for $${property.hotelCost}`
      }, ...prev]);
    } else {
      // Build house
      if (currentPlayer.money < property.buildCost) {
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'info',
          player: currentPlayer.name,
          message: `cannot build house on ${propertyName} - needs $${property.buildCost}`
        }, ...prev]);
        return;
      }

      // Update property ownership
      setSyncedPropertyOwnership(prev => ({
        ...prev,
        [propertyName]: {
          ...prev[propertyName],
          houses: currentHouses + 1
        }
      }));

      // Deduct money from player
      if (currentPlayer.isBot) {
        setBots(prev => prev.map(bot =>
          bot.id === currentPlayer.id
            ? { ...bot, money: bot.money - property.buildCost }
            : bot
        ));
      } else {
        setPlayers(prev => prev.map(p =>
          p.id === currentPlayer.id
            ? { ...p, money: p.money - property.buildCost }
            : p
        ));
        if (currentPlayer.id === currentPlayer?.id) {
          setCurrentPlayer(prev => ({ ...prev, money: prev.money - property.buildCost }));
        }
      }

      setGameLog(prev => [{
        id: generateLogId(),
        type: 'purchase',
        player: currentPlayer.name,
        message: `built house on ${propertyName} for $${property.buildCost}`
      }, ...prev]);
    }
  };

  const handleDestroyHouse = (propertyName) => {
    // Multiplayer: emit socket event
    if (gameStarted) {
      socket.emit('destroyHouse', { roomId, propertyName });
      return;
    }
    // ... existing singleplayer/local logic ...
    const currentPlayer = allPlayers[currentPlayerIndex];
    if (!currentPlayer) return;

    const property = classicMap.find(p => p.name === propertyName);
    if (!property || property.type !== 'property') return;

    const ownership = syncedPropertyOwnership[propertyName];
    if (!ownership || ownership.owner !== currentPlayer.id) return;

    const currentHouses = ownership.houses || 0;
    const hasHotel = ownership.hotel || false;

    if (!hasHotel && currentHouses === 0) {
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'info',
        player: currentPlayer.name,
        message: `cannot destroy anything on ${propertyName} - no houses or hotel`
      }, ...prev]);
      return;
    }

    // Check if houses are destroyed evenly across the set (only if even build rule is enabled)
    if (gameSettings.evenBuild && !hasHotel) {
      const setProperties = classicMap.filter(p => p.set === property.set && p.type === 'property');
      const setHouses = setProperties.map(p => syncedPropertyOwnership[p.name]?.houses || 0);
      const maxHouses = Math.max(...setHouses);

      // Can only destroy from properties that have the maximum number of houses
      if (currentHouses < maxHouses) {
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'info',
          player: currentPlayer.name,
          message: `cannot destroy house on ${propertyName} - must destroy houses evenly across the set`
        }, ...prev]);
        return;
      }
    }

    if (hasHotel) {
      // Check if all properties in the set have hotels before destroying (only if even build is enabled)
      if (gameSettings.evenBuild) {
        const setProperties = classicMap.filter(p => p.set === property.set && p.type === 'property');
        const allHaveHotels = setProperties.every(p => syncedPropertyOwnership[p.name]?.hotel);
        if (!allHaveHotels) {
          setGameLog(prev => [{
            id: generateLogId(),
            type: 'info',
            player: currentPlayer.name,
            message: `cannot destroy hotel on ${propertyName} - all properties in set must have hotels first`
          }, ...prev]);
          return;
        }
      }

      // Destroy hotel and get 4 houses back
      const refundAmount = property.hotelCost / 2; // Half price when selling back

      setSyncedPropertyOwnership(prev => ({
        ...prev,
        [propertyName]: {
          ...prev[propertyName],
          houses: 4,
          hotel: false
        }
      }));

      // Add money to player
      if (currentPlayer.isBot) {
        setBots(prev => prev.map(bot =>
          bot.id === currentPlayer.id
            ? { ...bot, money: bot.money + refundAmount }
            : bot
        ));
      } else {
        setPlayers(prev => prev.map(p =>
          p.id === currentPlayer.id
            ? { ...p, money: p.money + refundAmount }
            : p
        ));
        if (currentPlayer.id === currentPlayer?.id) {
          setCurrentPlayer(prev => ({ ...prev, money: prev.money + refundAmount }));
        }
      }

      setGameLog(prev => [{
        id: generateLogId(),
        type: 'special',
        player: currentPlayer.name,
        message: `destroyed hotel on ${propertyName} for $${refundAmount}`
      }, ...prev]);
    } else {
      // Destroy house
      const refundAmount = property.buildCost / 2; // Half price when selling back

      setSyncedPropertyOwnership(prev => ({
        ...prev,
        [propertyName]: {
          ...prev[propertyName],
          houses: currentHouses - 1
        }
      }));

      // Add money to player
      if (currentPlayer.isBot) {
        setBots(prev => prev.map(bot =>
          bot.id === currentPlayer.id
            ? { ...bot, money: bot.money + refundAmount }
            : bot
        ));
      } else {
        setPlayers(prev => prev.map(p =>
          p.id === currentPlayer.id
            ? { ...p, money: p.money + refundAmount }
            : p
        ));
        if (currentPlayer.id === currentPlayer?.id) {
          setCurrentPlayer(prev => ({ ...prev, money: prev.money + refundAmount }));
        }
      }

      setGameLog(prev => [{
        id: generateLogId(),
        type: 'special',
        player: currentPlayer.name,
        message: `destroyed house on ${propertyName} for $${refundAmount}`
      }, ...prev]);
    }
  };

  const handleMortgageProperty = (propertyName, mortgage) => {
    // Multiplayer: emit socket event
    if (gameStarted) {
      if (mortgage) {
        socket.emit('mortgageProperty', { roomId, propertyName });
      } else {
        socket.emit('unmortgageProperty', { roomId, propertyName });
      }
      return;
    }
    // ... existing singleplayer/local logic ...
    const currentPlayer = allPlayers[currentPlayerIndex];
    if (!currentPlayer) return;

    const property = classicMap.find(p => p.name === propertyName);
    if (!property) return;

    const ownership = syncedPropertyOwnership[propertyName];
    if (!ownership || ownership.owner !== currentPlayer.id) return;

    // Check if property can be mortgaged/unmortgaged
    if (property.type === 'property') {
      const setProperties = classicMap.filter(p => p.set === property.set && p.type === 'property');
      const anyHousesOrHotels = setProperties.some(p => syncedPropertyOwnership[p.name]?.houses > 0 || syncedPropertyOwnership[p.name]?.hotel);
      const currentHouses = ownership.houses || 0;
      const hasHotel = ownership.hotel || false;

      if (mortgage) {
        // For mortgaging: check if this specific property has houses/hotel
        if (currentHouses > 0 || hasHotel) {
          setGameLog(prev => [{
            id: generateLogId(),
            type: 'info',
            player: currentPlayer.name,
            message: `cannot mortgage ${propertyName} - property has houses or hotel`
          }, ...prev]);
          return;
        }
      } else {
        // For unmortgaging: check if any property in the set has houses/hotels
        if (anyHousesOrHotels) {
          setGameLog(prev => [{
            id: generateLogId(),
            type: 'info',
            player: currentPlayer.name,
            message: `cannot unmortgage ${propertyName} - set has houses or hotels`
          }, ...prev]);
          return;
        }
      }
    }

    if (mortgage) {
      // Mortgage property
      const mortgageAmount = property.price / 2;

      setSyncedPropertyOwnership(prev => ({
        ...prev,
        [propertyName]: {
          ...prev[propertyName],
          mortgaged: true
        }
      }));

      // Add money to player
      if (currentPlayer.isBot) {
        setBots(prev => prev.map(bot =>
          bot.id === currentPlayer.id
            ? { ...bot, money: bot.money + mortgageAmount }
            : bot
        ));
      } else {
        setPlayers(prev => prev.map(p =>
          p.id === currentPlayer.id
            ? { ...p, money: p.money + mortgageAmount }
            : p
        ));
        if (currentPlayer.id === currentPlayer?.id) {
          setCurrentPlayer(prev => ({ ...prev, money: prev.money + mortgageAmount }));
        }
      }

      setGameLog(prev => [{
        id: generateLogId(),
        type: 'special',
        player: currentPlayer.name,
        message: `mortgaged ${propertyName} for $${mortgageAmount}`
      }, ...prev]);
    } else {
      // Unmortgage property
      const unmortgageAmount = Math.ceil(property.price * 0.6); // 60% of original price to unmortgage

      if (currentPlayer.money < unmortgageAmount) {
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'info',
          player: currentPlayer.name,
          message: `cannot unmortgage ${propertyName} - needs $${unmortgageAmount}`
        }, ...prev]);
        return;
      }

      setSyncedPropertyOwnership(prev => ({
        ...prev,
        [propertyName]: {
          ...prev[propertyName],
          mortgaged: false
        }
      }));

      // Deduct money from player
      if (currentPlayer.isBot) {
        setBots(prev => prev.map(bot =>
          bot.id === currentPlayer.id
            ? { ...bot, money: bot.money - unmortgageAmount }
            : bot
        ));
      } else {
        setPlayers(prev => prev.map(p =>
          p.id === currentPlayer.id
            ? { ...p, money: p.money - unmortgageAmount }
            : p
        ));
        if (currentPlayer.id === currentPlayer?.id) {
          setCurrentPlayer(prev => ({ ...prev, money: prev.money - unmortgageAmount }));
        }
      }

      setGameLog(prev => [{
        id: generateLogId(),
        type: 'special',
        player: currentPlayer.name,
        message: `unmortgaged ${propertyName} for $${unmortgageAmount}`
      }, ...prev]);
    }
  };

  const handleSellProperty = (propertyName) => {
    // Multiplayer: emit socket event
    if (gameStarted) {
      socket.emit('sellProperty', { roomId, propertyName });
      return;
    }
    // ... existing singleplayer/local logic ...
    const currentPlayer = allPlayers[currentPlayerIndex];
    if (!currentPlayer) return;

    const property = classicMap.find(p => p.name === propertyName);
    if (!property) return;

    const ownership = syncedPropertyOwnership[propertyName];
    if (!ownership || ownership.owner !== currentPlayer.id) return;

    // Check if property can be sold (no houses/hotels, not mortgaged)
    if (property.type === 'property') {
      const setProperties = classicMap.filter(p => p.set === property.set && p.type === 'property');
      const anyHousesOrHotels = setProperties.some(p => syncedPropertyOwnership[p.name]?.houses > 0 || syncedPropertyOwnership[p.name]?.hotel);

      if (anyHousesOrHotels) {
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'info',
          player: currentPlayer.name,
          message: `cannot sell ${propertyName} - set has houses or hotels`
        }, ...prev]);
        return;
      }
    }

    if (ownership.mortgaged) {
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'info',
        player: currentPlayer.name,
        message: `cannot sell ${propertyName} - property is mortgaged`
      }, ...prev]);
      return;
    }

    // Sell property back to bank
    const sellAmount = property.price / 2; // Half price when selling back

    // Remove property ownership
    setSyncedPropertyOwnership(prev => {
      const newOwnership = { ...prev };
      delete newOwnership[propertyName];
      return newOwnership;
    });

    // Add money to player
    if (currentPlayer.isBot) {
      setBots(prev => prev.map(bot =>
        bot.id === currentPlayer.id
          ? { ...bot, money: bot.money + sellAmount }
          : bot
      ));
    } else {
      setPlayers(prev => prev.map(p =>
        p.id === currentPlayer.id
          ? { ...p, money: p.money + sellAmount }
          : p
      ));
      if (currentPlayer.id === currentPlayer?.id) {
        setCurrentPlayer(prev => ({ ...prev, money: prev.money + sellAmount }));
      }
    }

    setGameLog(prev => [{
      id: generateLogId(),
      type: 'special',
      player: currentPlayer.name,
      message: `sold ${propertyName} for $${sellAmount}`
    }, ...prev]);
  };

  // Handler for opening property popup from sidebar
  const handlePropertyClick = (propertyName) => {
    setSelectedProperty(propertyName);
    setPropertyPopupOpen(true);
  };

  // Handler for property rent events
  const handlePropertyRent = (playerName, ownerName, propertyName, rent) => {
    const payingPlayer = allPlayers.find(p => p.name === playerName);
    const receivingPlayer = allPlayers.find(p => p.name === ownerName);

    if (payingPlayer && receivingPlayer) {
      const currentMoney = payingPlayer.money;
      const actualRentPaid = Math.min(currentMoney, rent);

      // Deduct money from paying player
      if (payingPlayer.isBot) {
        setBots(prev => prev.map(bot =>
          bot.id === payingPlayer.id
            ? { ...bot, money: Math.max(0, bot.money - rent) }
            : bot
        ));
      } else {
        setPlayers(prev => prev.map(p =>
          p.id === payingPlayer.id
            ? { ...p, money: Math.max(0, p.money - rent) }
            : p
        ));
        if (payingPlayer.id === currentPlayer?.id) {
          setCurrentPlayer(prev => ({ ...prev, money: Math.max(0, prev.money - rent) }));
        }
      }

      // Add money to receiving player (only what was actually paid)
      if (receivingPlayer.isBot) {
        setBots(prev => prev.map(bot =>
          bot.id === receivingPlayer.id
            ? { ...bot, money: bot.money + actualRentPaid }
            : bot
        ));
      } else {
        setPlayers(prev => prev.map(p =>
          p.id === receivingPlayer.id
            ? { ...p, money: p.money + actualRentPaid }
            : p
        ));
        if (receivingPlayer.id === currentPlayer?.id) {
          setCurrentPlayer(prev => ({ ...prev, money: prev.money + actualRentPaid }));
        }
      }

      // Rent money goes to other players, not to vacation cash

      // Check if player went bankrupt
      if (currentMoney < rent) {
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'bankruptcy',
          player: playerName,
          message: `went bankrupt paying rent for ${propertyName}!`
        }, ...prev]);

        // Trigger bankruptcy handler
        handlePlayerBankruptcy(playerName);
      }
    }

    // Get property details for better logging
    const property = classicMap.find(p => p.name === propertyName);
    const ownership = syncedPropertyOwnership[propertyName];
    let rentDetails = '';

    if (property && ownership) {
      if (property.type === 'property') {
        const houses = ownership.houses || 0;
        const hasHotel = ownership.hotel || false;
        if (hasHotel) {
          rentDetails = ` (hotel rent)`;
        } else if (houses > 0) {
          rentDetails = ` (${houses} house${houses > 1 ? 's' : ''})`;
        } else {
          rentDetails = ` (base rent)`;
        }

        // Add double rent indicator if applicable
        if (gameSettings.doubleRentOnFullSet) {
          const setProperties = classicMap.filter(p => p.set === property.set && p.type === 'property');
          const ownedFullSet = setProperties.every(p => syncedPropertyOwnership[p.name] && syncedPropertyOwnership[p.name].owner === ownership.owner);
          if (ownedFullSet) {
            rentDetails += ` (double rent - full set)`;
          }
        }
      } else if (property.type === 'airport') {
        const ownerAirports = Object.values(syncedPropertyOwnership).filter(
          p => p.owner === ownership.owner && classicMap.find(prop => prop.name === p.name)?.type === 'airport'
        ).length;
        rentDetails = ` (${ownerAirports} airport${ownerAirports > 1 ? 's' : ''} owned)`;
      } else if (property.type === 'company') {
        const ownerCompanies = Object.values(syncedPropertyOwnership).filter(
          p => p.owner === ownership.owner && classicMap.find(prop => prop.name === p.name)?.type === 'company'
        ).length;
        const diceTotal = lastDiceRoll ? lastDiceRoll.dice1 + lastDiceRoll.dice2 : 7;
        rentDetails = ` (${ownerCompanies} company${ownerCompanies > 1 ? 's' : ''} × ${diceTotal} dice)`;
      }
    }

    setGameLog(prev => [{
      id: generateLogId(),
      type: 'rent',
      player: playerName,
      message: `paid $${rent} rent to ${ownerName} for ${propertyName}${rentDetails}`
    }, ...prev]);
  };

  // Handler for special space events (Jail, Tax, etc.)
  const handleSpecialSpace = (playerName, spaceName, action) => {
    setGameLog(prev => [{
      id: generateLogId(),
      type: 'special',
      player: playerName,
      message: `${action} on ${spaceName}`
    }, ...prev]);
  };

  // Handler for player bankruptcy
  const handlePlayerBankruptcy = (playerName) => {
    setGameLog(prev => [{
      id: generateLogId(),
      type: 'bankruptcy',
      player: playerName,
      message: `went bankrupt and is out of the game!`
    }, ...prev]);
  };

  // Handler for trade completion
  const handleTradeCompletion = (player1Name, player2Name, details) => {
    setGameLog(prev => [{
      id: generateLogId(),
      type: 'trade',
      message: `${player1Name} and ${player2Name} completed a trade`
    }, ...prev]);
  };

  // Handler for bot actions
  const handleBotAction = (botName, action) => {
    setGameLog(prev => [{
      id: generateLogId(),
      type: 'bot',
      player: botName,
      message: action
    }, ...prev]);
  };

  const handlePlayerStatusChange = (playerId, statusType, isActive) => {
    if (statusType === 'jail') {
      setPlayerStatuses(prev => ({
        ...prev,
        [playerId]: isActive ? 'jail' : 'normal'
      }));
    } else if (statusType === 'vacation') {
      setPlayerStatuses(prev => {
        const newStatuses = { ...prev };
        if (isActive) {
          newStatuses[playerId] = { status: 'vacation', vacationStartRound: roundNumber };
        } else {
          delete newStatuses[playerId];
        }
        return newStatuses;
      });
    }
  };

  // Auction state
  const [auctionActive, setAuctionActive] = useState(false);
  const [auctionProperty, setAuctionProperty] = useState(null);
  const [auctionBids, setAuctionBids] = useState([]); // {playerId, name, color, amount, note}
  const [auctionParticipants, setAuctionParticipants] = useState([]); // [{id, name, color, money}]
  const [auctionCurrentBid, setAuctionCurrentBid] = useState(0);
  const [auctionCurrentBidder, setAuctionCurrentBidder] = useState(null);
  const [auctionTimer, setAuctionTimer] = useState(5);
  const [auctionPassedPlayers, setAuctionPassedPlayers] = useState([]); // [playerId]
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [auctionWinner, setAuctionWinner] = useState(null);
  const auctionTimerRef = useRef();
  const auctionBidOrderRef = useRef([]); // For round-robin

  // Start auction
  const startAuction = (property, player) => {
    const participants = allPlayers.filter(p => p.money > 0);
    setAuctionActive(true);
    setAuctionProperty(property);
    setAuctionBids([]);
    setAuctionParticipants(participants);
    setAuctionCurrentBid(0);
    setAuctionCurrentBidder(participants[0]);
    setAuctionTimer(5);
    setAuctionPassedPlayers([]);
    setAuctionEnded(false);
    setAuctionWinner(null);
    auctionBidOrderRef.current = participants.map(p => p.id);
  };

  // Handle auction bid
  const handleAuctionBid = (inc) => {
    if (!auctionActive || !auctionCurrentBidder) return;
    const newBid = auctionCurrentBid + inc;
    setAuctionBids(prev => [...prev, { playerId: auctionCurrentBidder.id, name: auctionCurrentBidder.name, color: auctionCurrentBidder.color, amount: newBid, note: `+${inc}` }]);
    setAuctionCurrentBid(newBid);
    setAuctionPassedPlayers([]); // Reset passes on new bid
    setAuctionTimer(5); // Reset global timer on new bid
    // Next bidder
    nextAuctionBidder(auctionCurrentBidder.id);
  };

  // Handle auction pass
  const handleAuctionPass = () => {
    setAuctionPassedPlayers(prev => [...prev, auctionCurrentBidder.id]);
    // Next bidder
    nextAuctionBidder(auctionCurrentBidder.id);
  };

  // Next bidder logic
  const nextAuctionBidder = (lastId) => {
    const ids = auctionBidOrderRef.current;
    let idx = ids.indexOf(lastId);
    let nextIdx = (idx + 1) % ids.length;
    let tries = 0;
    while (auctionPassedPlayers.includes(ids[nextIdx]) && tries < ids.length) {
      nextIdx = (nextIdx + 1) % ids.length;
      tries++;
    }
    // If all but one passed, end auction
    const activeBidders = auctionParticipants.filter(p => !auctionPassedPlayers.includes(p.id));
    if (activeBidders.length <= 1) {
      endAuction(activeBidders[0]);
      return;
    }
    setAuctionCurrentBidder(auctionParticipants.find(p => p.id === ids[nextIdx]));
  };

  // Auction timer effect (global)
  useEffect(() => {
    if (!auctionActive || auctionEnded) return;
    if (auctionTimer <= 0) {
      // Timer ran out, end auction with current highest bidder
      if (auctionBids.length > 0) {
        const lastBid = auctionBids[auctionBids.length - 1];
        const winner = auctionParticipants.find(p => p.id === lastBid.playerId);
        endAuction(winner);
      } else {
        endAuction(null);
      }
      return;
    }
    auctionTimerRef.current = setTimeout(() => setAuctionTimer(t => t - 1), 1000);
    return () => clearTimeout(auctionTimerRef.current);
  }, [auctionTimer, auctionActive, auctionEnded, auctionBids, auctionParticipants]);

  // End auction
  const endAuction = (winner) => {
    setAuctionEnded(true);
    setAuctionActive(false);
    if (!winner) {
      setAuctionWinner(null);
      setGameLog(prev => [{ id: generateLogId(), type: 'info', message: `No one bid for ${auctionProperty.name}` }, ...prev]);
      setPropertyLandingState(null);
      setGamePhase('turn-end');
      return;
    }
    setAuctionWinner({ ...winner, amount: auctionCurrentBid });
    // Deduct money and assign property
    setSyncedPropertyOwnership(prev => ({
      ...prev,
      [auctionProperty.name]: {
        owner: winner.id,
        ownerName: winner.name,
        ownerColor: winner.color,
        houses: 0,
        hotel: false,
        mortgaged: false
      }
    }));
    if (winner.isBot) {
      setBots(prev => prev.map(bot => bot.id === winner.id ? { ...bot, money: bot.money - auctionCurrentBid } : bot));
    } else {
      setPlayers(prev => prev.map(p => p.id === winner.id ? { ...p, money: p.money - auctionCurrentBid } : p));
      if (winner.id === currentPlayer?.id) {
        setCurrentPlayer(prev => ({ ...prev, money: prev.money - auctionCurrentBid }));
      }
    }
    setGameLog(prev => [{ id: generateLogId(), type: 'purchase', player: winner.name, message: `won ${auctionProperty.name} for $${auctionCurrentBid} (auction)` }, ...prev]);
    setPropertyLandingState(null);
    setGamePhase('turn-end');
  };

  // AuctionModal rendering
  <AuctionModal
    isOpen={auctionActive || auctionEnded}
    onClose={() => { setAuctionActive(false); setAuctionEnded(false); }}
    property={auctionProperty}
    players={auctionParticipants}
    currentBid={auctionCurrentBid}
    currentBidder={auctionCurrentBidder}
    bidHistory={auctionBids}
    onBid={handleAuctionBid}
    onPass={handleAuctionPass}
    canBidAmounts={{
      2: auctionCurrentBidder && auctionCurrentBidder.money >= auctionCurrentBid + 2,
      10: auctionCurrentBidder && auctionCurrentBidder.money >= auctionCurrentBid + 10,
      100: auctionCurrentBidder && auctionCurrentBidder.money >= auctionCurrentBid + 100,
    }}
    timeLeft={auctionTimer}
    timeTotal={5}
    auctionEnded={auctionEnded}
    winner={auctionWinner}
    showEndButton={auctionEnded && auctionWinner && currentPlayer && currentPlayer.id === currentPlayerIndex}
    onEndTurn={handleEndTurn}
  />

  const [messages, setMessages] = useState([]);
  const [mapPreviewOpen, setMapPreviewOpen] = useState(false);
  const [changeAppearanceOpen, setChangeAppearanceOpen] = useState(false);
  const [mapFullPreviewOpen, setMapFullPreviewOpen] = useState(false);
  const [previewingMap, setPreviewingMap] = useState('Classic');

  const handleJoinGame = (selectedColor) => {
    // If not in the room, join as a new player
    if (!players.some(p => p.id === socket.id)) {
      const playerName = playerNameFromNav || user?.name || 'Guest';
      socket.emit('joinRoom', { roomId, playerName, color: selectedColor });
    }
  };

  const updatePlayerColor = ({ roomId, color }) => {
    const room = roomService.getRoomById(roomId);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.color = color;
      io.to(roomId).emit('playerListUpdated', room.getPlayerList());
    }
  };

  socket.on('updatePlayerColor', updatePlayerColor);

  const { user } = useUser();

  // Request current settings when joining the room or when playerJoined becomes true
  useEffect(() => {
    if (roomId && playerJoined) {
      socket.emit('requestRoomSettings', { roomId });
    }
  }, [roomId, playerJoined]);

  // --- Multiplayer game state sync ---

  // Add syncedPropertyOwnership state to store the latest property ownership from the server
  const [syncedPropertyOwnership, setSyncedPropertyOwnership] = useState({});
  // Add syncedVacationCash state to store the latest vacation cash from the server
  const [syncedVacationCash, setSyncedVacationCash] = useState(0);

  // Update syncedPropertyOwnership in the multiplayer sync useEffect
  useEffect(() => {
    socket.on('gameStateUpdated', (state) => {
      console.log('[DEBUG][CLIENT] gameStateUpdated:', state);
      console.log('[DEBUG][CLIENT] playerStatuses:', state.playerStatuses);
      console.log('[DEBUG][CLIENT] turnIndex:', state.turnIndex);
      console.log('[DEBUG][CLIENT] roundNumber:', state.roundNumber);
      console.log('[DEBUG][CLIENT] currentTurnSocketId:', state.currentTurnSocketId);
      console.log('[DEBUG][CLIENT] specialAction:', state.specialAction);
      console.log('[DEBUG][CLIENT] gameLog:', state.gameLog);
      setSyncedPositions(state.playerPositions || {});
      setSyncedStatuses(state.playerStatuses || {});
      setSyncedTurnIndex(state.turnIndex || 0);
      setSyncedRound(state.roundNumber || 1);
      setSyncedLastDiceRoll(state.lastDiceRoll || null);
      setSyncedPlayerMoney(state.playerMoney || {});
      setSyncedSpecialAction(state.specialAction || null);
      setCurrentTurnSocketId(state.currentTurnSocketId || null);
      setSyncedPropertyOwnership(state.propertyOwnership || {});
      setSyncedVacationCash(state.vacationCash || 0);
      setSyncedPlayersOrdered(state.playersOrdered || []);
      // Set game phase to 'rolling' when game starts and it's the current player's turn
      if (gameStarted && state.currentTurnSocketId === socket.id) {
        setGamePhase('rolling');
      }
    });
    return () => {
    };
  }, [gameStarted, socket.id]);

  // Helper: is it my turn?
  const isMyTurn = socket.id === currentTurnSocketId;

  // Update game phase when turn changes
  useEffect(() => {
    if (gameStarted && isMyTurn) {
      setGamePhase('rolling');
    }
  }, [gameStarted, isMyTurn]);

  // Handler for rolling dice (only if my turn)
  const handleRollDiceMultiplayer = (...args) => {
    // Emit rollDice event to server (required for animation to stop)
    if (isMyTurn && gameStarted && playerJoined) {
      const rollData = { roomId };
      if (devDiceEnabled) {
        rollData.devDice1 = devDice1;
        rollData.devDice2 = devDice2;
      }
      socket.emit('rollDice', rollData);
    }
  };


  <MonopolyBoard
    gameStarted={gameStarted}
    gameLog={gameLog}
    onStartGame={handleStartGame}
    players={allPlayers}
    currentPlayerIndex={syncedTurnIndex}
    onRollDice={handleRollDiceMultiplayer}
    onEndTurn={handleEndTurn}
    gamePhase={gamePhase}
    onPlayerStatusChange={handlePlayerStatusChange}
    propertyOwnership={syncedPropertyOwnership}
    gameSettings={gameSettings}
    playerJailCards={playerJailCards}
    onPayJailFine={handlePayJailFine}
    onUseJailCard={handleUseJailCard}
    onJailExit={() => { }}
    playerStatuses={syncedStatuses}
    playerJailRounds={playerJailRounds}
    playerMoveRequest={playerMoveRequest}
    onPlayerMoveComplete={() => setPlayerMoveRequest(null)}
    propertyLandingState={propertyLandingState}
    onBuildHouse={handleBuildHouse}
    onDestroyHouse={handleDestroyHouse}
    onMortgageProperty={handleMortgageProperty}
    onSellProperty={handleSellProperty}
    devDiceEnabled={devDiceEnabled}
    devDice1={devDice1}
    devDice2={devDice2}
    vacationCash={gameSettings.vacationCash ? syncedVacationCash : 0}
    isHost={isHost}
    syncedPositions={syncedPositions}
    syncedLastDiceRoll={syncedLastDiceRoll}
    syncedPlayerMoney={syncedPlayerMoney}
    syncedSpecialAction={syncedSpecialAction}
    isMyTurn={isMyTurn}
    roomId={roomId}
    globalDiceRolling={globalDiceRolling}
    onBuyProperty={handleBuyProperty}
    onAuctionProperty={handleAuctionProperty}
    onSkipProperty={handleSkipProperty}
    onClearPropertyLandingState={() => {
      setPropertyLandingState(null);
      if (gamePhase !== 'rolling') setGamePhase('rolling');
    }}
    currentUserId={currentPlayer?.id}
    isShufflingPlayers={isShufflingPlayers}
    onLocalDiceRollingChange={setLocalDiceRolling}
  />


  // --- Add this effect to clear propertyLandingState after purchase ---
  React.useEffect(() => {
    if (
      propertyLandingState &&
      propertyLandingState.isActive &&
      syncedPropertyOwnership[propertyLandingState.property] &&
      syncedPropertyOwnership[propertyLandingState.property].owner === currentPlayer?.id
    ) {
      setPropertyLandingState(null);
    }
  }, [syncedPropertyOwnership, propertyLandingState, currentPlayer]);


  // Only log gameStateUpdated events inside this effect
  useEffect(() => {
    const handleGameStateUpdated = (gameState) => {
      console.log('[gameStateUpdated]', gameState);
    };
    socket.on('gameStateUpdated', handleGameStateUpdated);
    return () => {
      socket.off('gameStateUpdated', handleGameStateUpdated);
    };
  }, []);

  // Listen for property action errors from server
  useEffect(() => {
    const handlePropertyActionError = ({ message }) => {
      alert(message || 'Property action failed');
    };
    socket.on('propertyActionError', handlePropertyActionError);
    return () => {
      socket.off('propertyActionError', handlePropertyActionError);
    };
  }, [roomId]);

  return (
    <Box sx={{
      height: '100dvh',
      background: 'linear-gradient(135deg, #0f172a, #1e293b, #0f172a)',
      overflow: 'hidden',
      display: 'flex',
      maxWidth: '100vw'
    }}>
      {/* Left Sidebar */}
      <StyledSidebar elevation={24}>
        {/* Header with Logo */}
        <StyledHeader>
          <Tooltip title="Go to Lobby" arrow>
            <IconButton
              onClick={() => window.location.assign('/')}
              sx={{ p: 0, width: '100%' }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 20px rgba(255,255,255,0.5)',
                  fontSize: '1.5rem',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              >
                MONOPOLY
              </Typography>
            </IconButton>
          </Tooltip>
        </StyledHeader>

        {/* Share Game Section */}
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <ShareGame
            gameUrl={gameUrl}
            devDiceEnabled={devDiceEnabled}
            devDice1={devDice1}
            devDice2={devDice2}
            onDevDiceChange={handleDevDiceChange}
            playerJoined={playerJoined}
            gameStarted={gameStarted}
            gameSettings={gameSettings}
            players={allPlayers}
            onPlayerCashChange={handlePlayerCashChange}
          />
        </Box>

        {/* Chat Section - Fixed container with scrollable content */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          p: 0 // Remove all padding
        }}>
          <Chat
            messages={messages}
            onSendMessage={handleSendMessage}
            disabled={!playerJoined}
            currentPlayer={currentPlayer}
          />
        </Box>
      </StyledSidebar>

      {/* Main Game Area */}
      <StyledMainArea>
        {/* Always render the Monopoly Board */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          transition: 'all 0.5s ease',
          filter: !playerJoined ? 'blur(2px)' : 'none',
          transform: !playerJoined ? 'scale(1.02)' : 'scale(1)',
          opacity: !playerJoined ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0,
          width: '100%',
          height: '100%'
        }}>
          <MonopolyBoard
            gameStarted={gameStarted}
            gameLog={gameLog}
            onStartGame={handleStartGame}
            players={allPlayers}
            currentPlayerIndex={syncedTurnIndex}
            onRollDice={handleRollDiceMultiplayer}
            onEndTurn={handleEndTurn}
            gamePhase={gamePhase}
            onPlayerStatusChange={handlePlayerStatusChange}
            propertyOwnership={syncedPropertyOwnership}
            gameSettings={gameSettings}
            playerJailCards={playerJailCards}
            onPayJailFine={handlePayJailFine}
            onUseJailCard={handleUseJailCard}
            onJailExit={() => { }}
            playerStatuses={syncedStatuses}
            playerJailRounds={playerJailRounds}
            playerMoveRequest={playerMoveRequest}
            onPlayerMoveComplete={() => setPlayerMoveRequest(null)}
            propertyLandingState={propertyLandingState}
            onBuildHouse={handleBuildHouse}
            onDestroyHouse={handleDestroyHouse}
            onMortgageProperty={handleMortgageProperty}
            onSellProperty={handleSellProperty}
            devDiceEnabled={devDiceEnabled}
            devDice1={devDice1}
            devDice2={devDice2}
            vacationCash={gameSettings.vacationCash ? syncedVacationCash : 0}
            isHost={isHost}
            syncedPositions={syncedPositions}
            syncedLastDiceRoll={syncedLastDiceRoll}
            syncedPlayerMoney={syncedPlayerMoney}
            syncedSpecialAction={syncedSpecialAction}
            isMyTurn={isMyTurn}
            roomId={roomId}
            globalDiceRolling={globalDiceRolling}
            onBuyProperty={handleBuyProperty}
            onAuctionProperty={handleAuctionProperty}
            onSkipProperty={handleSkipProperty}
            onClearPropertyLandingState={() => {
              setPropertyLandingState(null);
              if (gamePhase !== 'rolling') setGamePhase('rolling');
            }}
            currentUserId={currentPlayer?.id}
            isShufflingPlayers={isShufflingPlayers}
            onPropertyClick={handlePropertyClick}
          />

          {/* Property Popup */}
          {propertyPopupOpen && selectedProperty && (
            <div style={{
              position: 'absolute',
              top: 100,
              left: classicMap.find(p => p.name === selectedProperty)?.type === 'company' ? '48%' : '57%',
              transform: classicMap.find(p => p.name === selectedProperty)?.type === 'company' ? 'translateX(-9%)' : 'translateX(10%)',
              zIndex: 200,
            }}
              onClick={e => e.stopPropagation()}
            >
              <PropertyPopup
                propertyName={selectedProperty}
                onClose={() => setPropertyPopupOpen(false)}
                propertyOwnership={syncedPropertyOwnership}
                players={allPlayers}
                currentPlayerIndex={syncedTurnIndex}
                gamePhase={gamePhase}
                onBuildHouse={handleBuildHouse}
                onDestroyHouse={handleDestroyHouse}
                onMortgageProperty={handleMortgageProperty}
                onSellProperty={handleSellProperty}
                gameSettings={gameSettings}
                currentUserId={currentPlayer?.id}
                popupWidth={classicMap.find(p => p.name === selectedProperty)?.type === 'company' ? 320 : undefined}
                syncedPlayerMoney={syncedPlayerMoney}
                playerStatuses={syncedStatuses}
              />
            </div>
          )}

          {/* Overlay to close popup on outside click */}
          {propertyPopupOpen && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 99,
                background: 'transparent',
              }}
              onClick={() => setPropertyPopupOpen(false)}
            />
          )}
        </Box>

        {/* Map Preview Overlay */}
        {mapPreviewOpen && (
          <MapPreviewModal
            open={mapPreviewOpen}
            onClose={handleMapPreviewClose}
            selectedMap={gameSettings.boardMap || 'Classic'}
            onMapSelect={handleMapSelect}
            onMapPreview={handleMapFullPreview}
            availableMaps={['Classic', 'Mr. Worldwide', 'Death Valley', 'Lucky Wheel']}
          />
        )}

        {/* Only show PlayerSelection if the current socket id is not in the players list */}
        {!playerJoined && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(1px)'
          }}>
            <PlayerSelection
              key={players.map(p => p.color).join(',')}
              onJoinGame={handleJoinGame}
              usedColors={players.length === 0 ? [] : players.map(p => p.color).filter(Boolean)}
              isChangingAppearance={false}
            />
          </Box>
        )}

        {/* Change Appearance Overlay */}
        {changeAppearanceOpen && currentPlayer && (
          <Box sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(1px)'
          }}>
            <PlayerSelection
              onChangeAppearance={handleAppearanceUpdate}
              onClose={handleChangeAppearanceClose}
              currentPlayerColor={currentPlayer?.color}
              usedColors={players.map(p => p.color)}
              isChangingAppearance={true}
            />
          </Box>
        )}
      </StyledMainArea>

      {/* Full Page Map Preview */}
      <MapFullPreview
        open={mapFullPreviewOpen}
        onClose={handleMapFullPreviewClose}
        selectedMap={previewingMap}
      />

      {/* Right Sidebar */}
      <StyledSidebar elevation={24}>
        {/* Players Section - Fixed at top */}
        <Box sx={{ flex: '0 0 auto', p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <PlayerList
            players={displayPlayers}
            currentPlayerId={currentPlayer?.id}
            gameStarted={gameStarted}
            isHost={true}
            onKickPlayer={handleKickPlayer}
            onChangeAppearance={handleChangeAppearance}
            playerJoined={playerJoined}
            playerStatuses={syncedStatuses}
            isShuffling={isShufflingPlayers}
            syncedPlayerMoney={syncedPlayerMoney}
          />
        </Box>

        {gameStarted ? (
          /* Game Started Layout - Flexible content area */
          <Box sx={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Votekick and Bankrupt Buttons - Side by side */}
            <Box sx={{ flex: '0 0 auto', p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<PersonRemove />}
                  onClick={handleVotekick}
                  size="small"
                  sx={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    textTransform: 'none',
                    py: 0.75,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4b5563, #374151)',
                      transform: 'translateY(-1px)',
                    }
                  }}
                >
                  Votekick
                </Button>
                <Button
                  startIcon={<MoneyOff />}
                  onClick={handleBankrupt}
                  size="small"
                  sx={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    textTransform: 'none',
                    py: 0.75,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #b91c1c, #991b1b)',
                      transform: 'translateY(-1px)',
                    }
                  }}
                >
                  Bankrupt
                </Button>
              </Box>
            </Box>

            {/* Trades Section - Fixed height */}
            <Box sx={{ flex: '0 0 auto', p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  Trades
                </Typography>
                <Button
                  size="small"
                  startIcon={<SwapHoriz />}
                  onClick={handleCreateTrade}
                  sx={{
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    textTransform: 'none',
                    px: 2,
                    py: 0.75,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                      transform: 'translateY(-1px)',
                    }
                  }}
                >
                  Create
                </Button>
              </Box>
              <Paper
                sx={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  p: 2,
                  height: 100,
                  overflow: 'auto',
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
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.875rem'
                  }}
                >
                  No active trades
                </Typography>
              </Paper>
            </Box>

            {/* Properties Section - Takes remaining space */}
            <Box sx={{ flex: '1 1 0', minHeight: 0, overflow: 'auto', p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  My properties ({classicMap.filter(
                    (prop) => ['property', 'airport', 'utility', 'company'].includes(prop.type) && syncedPropertyOwnership[prop.name]?.owner === currentPlayer?.id
                  ).length})
                </Typography>
              </Box>
              <Paper
                sx={{
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.6))',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  p: 1,
                  height: '100%',
                  overflow: 'auto',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
                    borderRadius: '16px',
                    pointerEvents: 'none',
                  },
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
                }}
                className="custom-scrollbar properties-container"
              >
                <List sx={{ py: 0 }}>
                  {classicMap.filter(
                    (prop) => ['property', 'airport', 'utility', 'company'].includes(prop.type) && syncedPropertyOwnership[prop.name]?.owner === currentPlayer?.id
                  ).map((prop) => {
                    const ownership = syncedPropertyOwnership[prop.name];
                    const propertyFlags = {
                      'Salvador': '🇧🇷', 'Rio': '🇧🇷', 'Tel Aviv': '🇮🇱', 'Haifa': '🇮🇱', 'Jerusalem': '🇮🇱',
                      'Venice': '🇮🇹', 'Milan': '🇮🇹', 'Rome': '🇮🇹', 'Frankfurt': '🇩🇪', 'Munich': '🇩🇪', 'Berlin': '🇩🇪',
                      'Shenzhen': '🇨🇳', 'Beijing': '🇨🇳', 'Shanghai': '🇨🇳', 'Lyon': '🇫🇷', 'Toulouse': '🇫🇷', 'Paris': '🇫🇷',
                      'Liverpool': '🇬🇧', 'Manchester': '🇬🇧', 'London': '🇬🇧', 'California': '🇺🇸', 'New York': '🇺🇸'
                    };
                    const flag = propertyFlags[prop.name] || (prop.type === 'airport' ? '✈️' : prop.type === 'utility' ? '⚡' : prop.type === 'company' ? '🏢' : '🏠');

                    return (
                      <ListItem
                        key={prop.name}
                        className="property-item"
                        data-type={prop.type}
                        data-mortgaged={ownership?.mortgaged || false}
                        onClick={() => handlePropertyClick(prop.name)}
                        sx={{
                          px: 1,
                          py: 0.75,
                          borderRadius: '8px',
                          background: 'rgba(51, 65, 85, 0.4)',
                          mb: 0.5,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          '&:hover': {
                            background: 'rgba(51, 65, 85, 0.8)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            '& .property-flag': {
                              transform: 'scale(1.1) rotate(5deg)',
                            },
                            '& .property-details': {
                              opacity: 1,
                            }
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            background: ownership?.ownerColor || 'rgba(255, 255, 255, 0.2)',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                          },
                          '&:hover::before': {
                            opacity: 1,
                          }
                        }}
                      >
                        {/* Property status indicator */}
                        <Box
                          className="property-status"
                          data-mortgaged={ownership?.mortgaged || false}
                        />
                        <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                          <Box
                            className="property-flag"
                            sx={{
                              fontSize: '1.25rem',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                              textShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
                            }}
                          >
                            {flag}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255, 255, 255, 0.95)',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                mb: 0.25
                              }}
                            >
                              {prop.name}
                            </Typography>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  fontSize: '0.7rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  mb: 0.125
                                }}
                              >
                                <span style={{ color: '#fbbf24', fontWeight: 600 }}>${prop.price}</span>
                                {prop.type === 'property' && (
                                  <span style={{ fontSize: '0.7rem' }}>
                                    {ownership?.houses > 0 ? `🏠 ${ownership.houses}` : ''}
                                    {ownership?.hotel ? '🏨' : ''}
                                    {ownership?.mortgaged ? (
                                      <span style={{
                                        background: '#ef4444',
                                        color: '#000',
                                        borderRadius: '2px',
                                        padding: '1px 3px',
                                        fontSize: '12px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: '2px'
                                      }} title="Mortgaged">
                                        <Close sx={{ fontSize: 16, color: '#000' }} />
                                      </span>
                                    ) : ''}
                                  </span>
                                )}
                              </Typography>
                              {prop.type === 'property' && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '0.65rem',
                                    fontStyle: 'italic'
                                  }}
                                >
                                  {prop.set} • {prop.type}
                                </Typography>
                              )}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    );
                  })}
                  {classicMap.filter(
                    (prop) => ['property', 'airport', 'utility', 'company'].includes(prop.type) && syncedPropertyOwnership[prop.name]?.owner === currentPlayer?.id
                  ).length === 0 && (
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255,255,255,0.6)',
                                fontStyle: 'italic',
                                textAlign: 'center',
                                py: 2
                              }}
                            >
                              No properties owned
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                </List>
              </Paper>
            </Box>
          </Box>
        ) : (
          /* Game Settings Section - Only before game starts */
          <Box sx={{ flex: '1 1 0', minHeight: 0, overflow: 'auto' }}>
            <GameSettings
              settings={gameSettings}
              onSettingsChange={handleSettingsChange}
              onMapPreviewOpen={handleMapPreviewOpen}
              isHost={isHost}
              players={allPlayers}
              maxPlayers={gameSettings.maxPlayers}
              gameStarted={gameStarted}
              playerJoined={playerJoined}
              // Debug log
              debugLog={(() => { return null; })()}
            />
            {/* Removed Start Game Button and Waiting Message from sidebar */}
          </Box>
        )}
      </StyledSidebar>
      <AuctionModal
        isOpen={auctionActive || auctionEnded}
        onClose={() => { setAuctionActive(false); setAuctionEnded(false); }}
        property={auctionProperty}
        players={auctionParticipants}
        currentBid={auctionCurrentBid}
        currentBidder={auctionCurrentBidder}
        bidHistory={auctionBids}
        onBid={handleAuctionBid}
        onPass={handleAuctionPass}
        canBidAmounts={{
          2: auctionCurrentBidder && auctionCurrentBidder.money >= auctionCurrentBid + 2,
          10: auctionCurrentBidder && auctionCurrentBidder.money >= auctionCurrentBid + 10,
          100: auctionCurrentBidder && auctionCurrentBidder.money >= auctionCurrentBid + 100,
        }}
        timeLeft={auctionTimer}
        timeTotal={5}
        auctionEnded={auctionEnded}
        winner={auctionWinner}
        showEndButton={auctionEnded && auctionWinner && currentPlayer && currentPlayer.id === currentPlayerIndex}
        onEndTurn={handleEndTurn}
      />
    </Box>
  );
}
export default GamePage;
