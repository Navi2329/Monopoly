import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
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
  Settings
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

const StyledSidebar = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  width: '380px',
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden'
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
  
  // Player states
  const [playerJoined, setPlayerJoined] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  
  const [messages, setMessages] = useState([
    { id: 1, text: "Welcome to the game! 🎲", sender: "Game", time: "12:00" }
  ]);

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameLog, setGameLog] = useState([]);
  const [mapPreviewOpen, setMapPreviewOpen] = useState(false);
  const [mapFullPreviewOpen, setMapFullPreviewOpen] = useState(false);
  const [previewingMap, setPreviewingMap] = useState('Classic');
  const [changeAppearanceOpen, setChangeAppearanceOpen] = useState(false);

  // Game turn management
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState('waiting'); // 'waiting', 'rolling', 'moving', 'turn-end'
  const [lastDiceRoll, setLastDiceRoll] = useState(null);

  // Player status tracking
  const [playerStatuses, setPlayerStatuses] = useState({}); // { playerId: status } where status can be 'normal', 'jail'

  // Track jail cards for each player
  const [playerJailCards, setPlayerJailCards] = useState({}); // { playerId: number of jail cards }

  // Property ownership and landing
  const [propertyOwnership, setPropertyOwnership] = useState({}); // { propertyName: { owner: playerId, ownerName: string, ownerColor: string } }
  const [propertyLandingState, setPropertyLandingState] = useState(null); // { property, player, isActive } - null when no property landing

  // Dev options state
  // Dev options state
  const [devDiceEnabled, setDevDiceEnabled] = useState(false);
  const [devDice1, setDevDice1] = useState(1);
  const [devDice2, setDevDice2] = useState(1);

  // Players data - Initially empty, will be populated when player joins
  const [players, setPlayers] = useState([]);

  // Bots state
  const [bots, setBots] = useState([]);
  const [isAddingBots, setIsAddingBots] = useState(false);

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

  // Game settings
  const [gameSettings, setGameSettings] = useState({
    maxPlayers: 4,
    allowBots: false,
    startingCash: 1500,
    allowAuction: true // Enable auction by default
  });

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
      const botName = availableBotNames[i];
      const bot = {
        id: `bot-${Date.now()}-${i}`,
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
      setGameLog(prev => [...prev, { 
        id: Date.now() + i, 
        type: 'join', 
        player: botName,
        message: 'joined the game' 
      }]);
      
      console.log(`Bot ${bot.name} joined the game`);
      
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
      if (gameSettings.allowBots && !gameStarted && !isAddingBots && playerJoined) {
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
  }, [gameSettings.allowBots, gameSettings.maxPlayers, players.length, gameSettings.startingCash, gameStarted, playerJoined, isAddingBots, bots.length]);

  // Define all properties on the board
  const allBoardProperties = [
    // Top row
    { name: 'Salvador', type: 'property', price: 60 },
    { name: 'Rio', type: 'property', price: 60 },
    { name: 'TLV Airport', type: 'airport', price: 200 },
    { name: 'Tel Aviv', type: 'property', price: 100 },
    { name: 'Haifa', type: 'property', price: 100 },
    { name: 'Jerusalem', type: 'property', price: 120 },
    // Right row
    { name: 'Venice', type: 'property', price: 140 },
    { name: 'Electric Company', type: 'utility', price: 150 },
    { name: 'Milan', type: 'property', price: 140 },
    { name: 'Rome', type: 'property', price: 160 },
    { name: 'MUC Airport', type: 'airport', price: 200 },
    { name: 'Frankfurt', type: 'property', price: 180 },
    { name: 'Munich', type: 'property', price: 180 },
    { name: 'Berlin', type: 'property', price: 200 },
    // Bottom row
    { name: 'Shenzhen', type: 'property', price: 220 },
    { name: 'Beijing', type: 'property', price: 220 },
    { name: 'Shanghai', type: 'property', price: 240 },
    { name: 'CDG Airport', type: 'airport', price: 200 },
    { name: 'Lyon', type: 'property', price: 260 },
    { name: 'Toulouse', type: 'property', price: 260 },
    { name: 'Water Company', type: 'utility', price: 150 },
    { name: 'Paris', type: 'property', price: 280 },
    // Left row
    { name: 'Liverpool', type: 'property', price: 300 },
    { name: 'Manchester', type: 'property', price: 300 },
    { name: 'London', type: 'property', price: 320 },
    { name: 'JFK Airport', type: 'airport', price: 200 },
    { name: 'California', type: 'property', price: 350 },
    { name: 'New York', type: 'property', price: 400 }
  ];

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
    return allBoardProperties.find(prop => prop.name === propertyName);
  };

  // Handle property landing
  const handlePropertyLanding = (playerIndex, spaceIndex) => {
    const property = getPropertyBySpaceIndex(spaceIndex);
    const currentPlayer = allPlayers[playerIndex];
    
    if (!property || !currentPlayer) return;
    
    // Check if property is already owned
    const ownership = propertyOwnership[property.name];
    
    if (ownership && ownership.owner !== currentPlayer.id) {
      // Property is owned by someone else - pay rent
      const rentAmount = Math.floor(property.price * 0.1); // 10% of property price as rent
      handlePropertyRent(currentPlayer.name, ownership.ownerName, property.name, rentAmount);
    } else if (!ownership) {
      // Property is unowned
      if (currentPlayer.isBot) {
        // Bot automatically tries to buy if it has enough money
        if (currentPlayer.money >= property.price) {
          handleBotPropertyPurchase(currentPlayer, property);
        } else {
          setGameLog(prev => [...prev, { 
            id: Date.now(), 
            type: 'info', 
            player: currentPlayer.name,
            message: `cannot afford ${property.name} ($${property.price})` 
          }]);
        }
      } else {
        // Human player - show purchase options as horizontal buttons
        setPropertyLandingState({
          property: property,
          player: currentPlayer,
          isActive: true
        });
      }
    }
    // If property is owned by current player, nothing happens
  };

  // Handle bot property purchase
  const handleBotPropertyPurchase = (bot, property) => {
    // Update property ownership
    setPropertyOwnership(prev => ({
      ...prev,
      [property.name]: {
        owner: bot.id,
        ownerName: bot.name,
        ownerColor: bot.color
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
    
    // Deduct $50 from player
    if (currentPlayer.isBot) {
      setBots(prev => prev.map(bot => 
        bot.id === currentPlayer.id 
          ? { ...bot, money: bot.money - 50 }
          : bot
      ));
    } else {
      setPlayers(prev => prev.map(p => 
        p.id === currentPlayer.id 
          ? { ...p, money: p.money - 50 }
          : p
      ));
      if (currentPlayer.id === currentPlayer?.id) {
        setCurrentPlayer(prev => ({ ...prev, money: prev.money - 50 }));
      }
    }
    
    // Remove from jail
    setPlayerStatuses(prev => ({
      ...prev,
      [currentPlayer.id]: 'normal'
    }));
    
    // Log the action
    setGameLog(prev => [...prev, { 
      id: Date.now(), 
      type: 'special', 
      player: currentPlayer.name,
      message: `paid $50 to get out of jail` 
    }]);
    
    // Clear property landing state and end turn
    setPropertyLandingState(null);
    setGamePhase('turn-end');
  };

  // Handle jail escape with card
  const handleUseJailCard = () => {
    const currentPlayer = allPlayers[currentPlayerIndex];
    if (!currentPlayer || !playerJailCards[currentPlayer.id] || playerJailCards[currentPlayer.id] <= 0) return;
    
    // Use jail card
    setPlayerJailCards(prev => ({
      ...prev,
      [currentPlayer.id]: prev[currentPlayer.id] - 1
    }));
    
    // Remove from jail
    setPlayerStatuses(prev => ({
      ...prev,
      [currentPlayer.id]: 'normal'
    }));
    
    // Log the action
    setGameLog(prev => [...prev, { 
      id: Date.now(), 
      type: 'special', 
      player: currentPlayer.name,
      message: `used "Get out of jail free" card` 
    }]);
    
    // Clear property landing state and end turn
    setPropertyLandingState(null);
    setGamePhase('turn-end');
  };

  const gameUrl = `http://localhost:5173/game/${roomId}`;

  const handlePlayerJoin = (selectedColor) => {
    const newPlayer = {
      id: 1,
      name: 'GODWILDBEAST',
      color: selectedColor,
      money: 1500,
      avatar: null, // Set to actual avatar if logged in
      isOnline: true,
      isBot: false,
      isHost: true
    };
    
    setCurrentPlayer(newPlayer);
    setPlayers([newPlayer]);
    setPlayerJoined(true);
    
    // Initialize jail cards for new player
    setPlayerJailCards(prev => ({
      ...prev,
      [newPlayer.id]: 1 // Give 1 jail card for testing - in real game this would be 0
    }));
    
    // Add join message to game log
    setGameLog([
      { id: Date.now(), type: 'join', player: 'GODWILDBEAST', message: 'joined the game' },
      { id: Date.now() + 1, type: 'info', message: `Joined room ${roomId}` }
    ]);
    
    // Add welcome message to chat
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: 'Ready to play!',
      sender: 'GODWILDBEAST',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const handleSendMessage = (messageText) => {
    if (!playerJoined) return; // Don't allow messages until joined
    
    const newMessage = {
      id: Date.now(),
      text: messageText,
      sender: currentPlayer?.name || 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
  };

  const handleStartGame = () => {
    if (!playerJoined) return; // Don't allow game start until player joined
    
    setGameStarted(true);
    setGamePhase('rolling'); // Start with first player's turn
    setCurrentPlayerIndex(0);
    setGameLog([...gameLog, { 
      id: Date.now(), 
      type: 'info', 
      message: 'Game started! All players placed on START.' 
    }]);
  };

  const handleRollDice = (dice1, dice2, total, isDoubles, specialAction, landedSpaceIndex) => {
    setLastDiceRoll({ dice1, dice2, total });
    setGamePhase('moving');
    
    const currentPlayer = allPlayers[currentPlayerIndex];
    
    // Handle special actions
    if (specialAction === 'jail') {
      setGameLog(prev => [...prev, { 
        id: Date.now(), 
        type: 'special', 
        player: currentPlayer?.name,
        message: `was sent to jail! 🚔` 
      }]);
      
      // Set player status to jail
      setPlayerStatuses(prev => ({
        ...prev,
        [currentPlayer.id]: 'jail'
      }));
      
    } else if (specialAction === 'jail-escape') {
      setGameLog(prev => [...prev, { 
        id: Date.now(), 
        type: 'special', 
        player: currentPlayer?.name,
        message: `rolled doubles and escaped from jail! 🎲` 
      }]);
    } else if (specialAction === 'jail-stay') {
      setGameLog(prev => [...prev, { 
        id: Date.now(), 
        type: 'info', 
        player: currentPlayer?.name,
        message: `stays in jail (didn't roll doubles) 🔒` 
      }]);
    }
    
    // Only add important dice roll events (like doubles, high rolls, or special outcomes)
    if (dice1 === dice2 && !specialAction) {
      setGameLog(prev => [...prev, { 
        id: Date.now(), 
        type: 'special', 
        player: currentPlayer?.name,
        message: `rolled doubles! ${dice1} + ${dice2} = ${total}` 
      }]);
    } else if (total >= 10 && !specialAction) {
      setGameLog(prev => [...prev, { 
        id: Date.now(), 
        type: 'info', 
        player: currentPlayer?.name,
        message: `rolled a high ${total}!` 
      }]);
    }
    // Normal rolls are not logged to keep the log clean

    // Simulate movement time, then handle property landing and turn end
    setTimeout(() => {
      // Check if player landed on a purchasable property
      if (landedSpaceIndex !== undefined && !specialAction) {
        handlePropertyLanding(currentPlayerIndex, landedSpaceIndex);
      }
      
      if (isDoubles && !specialAction) {
        // Player gets another turn for rolling doubles
        setGamePhase('rolling');
        setGameLog(prev => [...prev, { 
          id: Date.now(), 
          type: 'special', 
          player: currentPlayer?.name,
          message: `gets another turn for rolling doubles!` 
        }]);
      } else {
        // Normal turn end
        setGamePhase('turn-end');
      }
    }, 1000);
  };

  const handleEndTurn = () => {
    let nextPlayerIndex = (currentPlayerIndex + 1) % allPlayers.length;
    let nextPlayer = allPlayers[nextPlayerIndex];
    
    setCurrentPlayerIndex(nextPlayerIndex);
    setGamePhase('rolling');
    
    // Only log turn changes at the start of a new round (when returning to first player)
    if (nextPlayerIndex === 0) {
      setGameLog(prev => [...prev, { 
        id: Date.now(), 
        type: 'info', 
        message: `New round started` 
      }]);
    }
    // Individual turn changes are not logged to keep the log clean
  };

  const handleSettingsChange = (newSettings) => {
    console.log('Settings changed:', newSettings);
    setGameSettings(newSettings);
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
    console.log('Bots updated:', newBots);
  };

  const handleCreateTrade = () => {
    console.log('Creating new trade');
    // Add trade creation logic here
  };

  // Handler functions for buttons
  const handleVotekick = () => {
    console.log('Votekick initiated');
    // Add votekick logic here
  };

  const handleBankrupt = () => {
    console.log('Bankrupt initiated');
    // Add bankrupt logic here
  };

  const handleKickPlayer = (playerId) => {
    console.log('Kicking player:', playerId);
    
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
      id: Date.now(),
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

  // Combine human players and bots for display
  const allPlayers = [...players, ...bots];

  // Handler for property purchase events
  const handlePropertyPurchase = (playerName, propertyName, price) => {
    setGameLog(prev => [...prev, { 
      id: Date.now(), 
      type: 'purchase', 
      player: playerName,
      message: `bought ${propertyName} for $${price}` 
    }]);
  };

  // Handle property purchase from horizontal buttons
  const handleBuyProperty = () => {
    const { property, player } = propertyLandingState;
    
    if (player.money >= property.price) {
      // Update property ownership
      setPropertyOwnership(prev => ({
        ...prev,
        [property.name]: {
          owner: player.id,
          ownerName: player.name,
          ownerColor: player.color
        }
      }));
      
      // Deduct money from player
      if (player.isBot) {
        setBots(prev => prev.map(bot => 
          bot.id === player.id 
            ? { ...bot, money: bot.money - property.price }
            : bot
        ));
      } else {
        setPlayers(prev => prev.map(p => 
          p.id === player.id 
            ? { ...p, money: p.money - property.price }
            : p
        ));
        if (player.id === currentPlayer?.id) {
          setCurrentPlayer(prev => ({ ...prev, money: prev.money - property.price }));
        }
      }
      
      // Log the purchase
      handlePropertyPurchase(player.name, property.name, property.price);
      
      // Clear property landing state
      setPropertyLandingState(null);
      
      // Check if last roll was doubles before ending turn
      const wasDoubles = lastDiceRoll && lastDiceRoll.dice1 === lastDiceRoll.dice2;
      if (wasDoubles) {
        // Player gets another turn for rolling doubles
        setGamePhase('rolling');
        setGameLog(prev => [...prev, { 
          id: Date.now(), 
          type: 'special', 
          player: player.name,
          message: `gets another turn for rolling doubles!` 
        }]);
      } else {
        // Normal turn end
        setGamePhase('turn-end');
      }
    }
  };

  // Handle auction from horizontal buttons
  const handleAuctionProperty = () => {
    const { property, player } = propertyLandingState;
    
    // For now, just log that auction started - implement auction logic later
    setGameLog(prev => [...prev, { 
      id: Date.now(), 
      type: 'info', 
      player: player.name,
      message: `started auction for ${property.name}` 
    }]);
    
    // Clear property landing state
    setPropertyLandingState(null);
    
    // Check if last roll was doubles before ending turn
    const wasDoubles = lastDiceRoll && lastDiceRoll.dice1 === lastDiceRoll.dice2;
    if (wasDoubles) {
      // Player gets another turn for rolling doubles
      setGamePhase('rolling');
      setGameLog(prev => [...prev, { 
        id: Date.now(), 
        type: 'special', 
        player: player.name,
        message: `gets another turn for rolling doubles!` 
      }]);
    } else {
      // Normal turn end
      setGamePhase('turn-end');
    }
  };

  // Handle skipping to buy property
  const handleSkipProperty = () => {
    const { property, player } = propertyLandingState;
    
    setGameLog(prev => [...prev, { 
      id: Date.now(), 
      type: 'info', 
      player: player.name,
      message: `declined to buy ${property.name}` 
    }]);
    
    // Clear property landing state
    setPropertyLandingState(null);
    
    // Check if last roll was doubles before ending turn
    const wasDoubles = lastDiceRoll && lastDiceRoll.dice1 === lastDiceRoll.dice2;
    if (wasDoubles) {
      // Player gets another turn for rolling doubles
      setGamePhase('rolling');
      setGameLog(prev => [...prev, { 
        id: Date.now(), 
        type: 'special', 
        player: player.name,
        message: `gets another turn for rolling doubles!` 
      }]);
    } else {
      // Normal turn end
      setGamePhase('turn-end');
    }
  };

  // Handler for property rent events
  const handlePropertyRent = (playerName, ownerName, propertyName, rent) => {
    const payingPlayer = allPlayers.find(p => p.name === playerName);
    const receivingPlayer = allPlayers.find(p => p.name === ownerName);
    
    if (payingPlayer && receivingPlayer) {
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
      
      // Add money to receiving player
      if (receivingPlayer.isBot) {
        setBots(prev => prev.map(bot => 
          bot.id === receivingPlayer.id 
            ? { ...bot, money: bot.money + rent }
            : bot
        ));
      } else {
        setPlayers(prev => prev.map(p => 
          p.id === receivingPlayer.id 
            ? { ...p, money: p.money + rent }
            : p
        ));
        if (receivingPlayer.id === currentPlayer?.id) {
          setCurrentPlayer(prev => ({ ...prev, money: prev.money + rent }));
        }
      }
    }
    
    setGameLog(prev => [...prev, { 
      id: Date.now(), 
      type: 'rent', 
      player: playerName,
      message: `paid $${rent} rent to ${ownerName} for ${propertyName}` 
    }]);
  };

  // Handler for special space events (Jail, Tax, etc.)
  const handleSpecialSpace = (playerName, spaceName, action) => {
    setGameLog(prev => [...prev, { 
      id: Date.now(), 
      type: 'special', 
      player: playerName,
      message: `${action} on ${spaceName}` 
    }]);
  };

  // Handler for player bankruptcy
  const handlePlayerBankruptcy = (playerName) => {
    setGameLog(prev => [...prev, { 
      id: Date.now(), 
      type: 'bankruptcy', 
      player: playerName,
      message: `went bankrupt and is out of the game!` 
    }]);
  };

  // Handler for trade completion
  const handleTradeCompletion = (player1Name, player2Name, details) => {
    setGameLog(prev => [...prev, { 
      id: Date.now(), 
      type: 'trade', 
      message: `${player1Name} and ${player2Name} completed a trade` 
    }]);
  };

  // Handler for bot actions
  const handleBotAction = (botName, action) => {
    setGameLog(prev => [...prev, { 
      id: Date.now(), 
      type: 'bot', 
      player: botName,
      message: action 
    }]);
  };

  const handlePlayerStatusChange = (playerId, statusType, isActive) => {
    if (statusType === 'jail') {
      setPlayerStatuses(prev => ({
        ...prev,
        [playerId]: isActive ? 'jail' : 'normal'
      }));
    }
  };

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
          />
        </Box>

        {/* Chat Section - Fixed container with scrollable content */}
        <Box sx={{ 
          flex: 1,
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: 0,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <Chat 
            messages={messages} 
            onSendMessage={handleSendMessage}
            disabled={!playerJoined}
          />
        </Box>
      </StyledSidebar>

      {/* Main Game Area */}
      <StyledMainArea>
        {/* Always render the Monopoly Board */}        <Box sx={{
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
            currentPlayerIndex={currentPlayerIndex}
            onRollDice={handleRollDice}
            onEndTurn={handleEndTurn}
            gamePhase={gamePhase}
            onPlayerStatusChange={handlePlayerStatusChange}
            onPropertyPurchase={handlePropertyPurchase}
            onPropertyRent={handlePropertyRent}
            onSpecialSpace={handleSpecialSpace}
            onPlayerBankruptcy={handlePlayerBankruptcy}
            onTradeCompletion={handleTradeCompletion}
            onBotAction={handleBotAction}
            propertyOwnership={propertyOwnership}
            gameSettings={gameSettings}
            playerJailCards={playerJailCards}
            onPayJailFine={handlePayJailFine}
            onUseJailCard={handleUseJailCard}
            playerStatuses={playerStatuses}
            propertyLandingState={propertyLandingState}
            onBuyProperty={handleBuyProperty}
            onAuctionProperty={handleAuctionProperty}
            onSkipProperty={handleSkipProperty}
            devDiceEnabled={devDiceEnabled}
            devDice1={devDice1}
            devDice2={devDice2}
          />
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

        {/* Player Selection Overlay */}
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
              onJoinGame={handlePlayerJoin}
              usedColors={allPlayers.map(p => p.color)}
            />
          </Box>
        )}

        {/* Change Appearance Overlay */}
        {changeAppearanceOpen && (
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
              usedColors={getUsedColors()}
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
          {/* Players Section */}
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>            
            <PlayerList 
              players={allPlayers} 
              currentPlayerId={currentPlayer?.id} 
              gameStarted={gameStarted}
              isHost={true}
              onKickPlayer={handleKickPlayer}
              onChangeAppearance={handleChangeAppearance}
              playerJoined={playerJoined}
              playerStatuses={playerStatuses}
            />
          </Box>

          {gameStarted ? (
            /* Game Started Layout */
            <>
              {/* Votekick and Bankrupt Buttons - Side by side */}
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
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

              {/* Trades Section */}
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
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
                    height: 80,
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

              {/* Properties Section */}
              <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                    My properties (8)
                  </Typography>
                </Box>
                <Paper 
                  sx={{ 
                    background: 'rgba(30, 41, 59, 0.5)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    p: 1,
                    flex: 1,
                    overflow: 'auto',
                    minHeight: 280,
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
                  <List sx={{ py: 0 }}>
                    {/* Sample Properties */}
                    {/*
                      { flag: '🇧🇷', name: 'Salvador' },
                      { flag: '🇮🇱', name: 'Tel Aviv' },
                      { flag: '✈️', name: 'MUC Airport' },
                      { flag: '🇨🇳', name: 'Shanghai' },
                      { flag: '🇫🇷', name: 'Paris' },
                      { flag: '🇬🇧', name: 'London' },
                      { flag: '✈️', name: 'JFK Airport' },
                      { flag: '🇺🇸', name: 'New York' }
                    */}
                    {Array.from({ length: 8 }).map((_, index) => (
                      <ListItem 
                        key={index}
                        sx={{ 
                          px: 1.5, 
                          py: 1, 
                          borderRadius: '8px',
                          background: 'rgba(51, 65, 85, 0.5)',
                          mb: 0.5,
                          transition: 'background 0.2s ease',
                          '&:hover': {
                            background: 'rgba(51, 65, 85, 0.7)'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5 }}>
                          <Typography variant="h6" sx={{ fontSize: '1.125rem' }}>
                            {['🇧🇷', '🇮🇱', '✈️', '🇨🇳', '🇫🇷', '🇬🇧', '✈️', '🇺🇸'][index]}
                          </Typography>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: '0.875rem'
                              }}
                            >
                              {['Salvador', 'Tel Aviv', 'MUC Airport', 'Shanghai', 'Paris', 'London', 'JFK Airport', 'New York'][index]}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            </>
          ) : (
            /* Game Settings Section - Only before game starts */
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <GameSettings 
                settings={gameSettings}
                onSettingsChange={handleSettingsChange}
                onMapPreviewOpen={handleMapPreviewOpen}
                isHost={true}
                players={players}
                maxPlayers={gameSettings.maxPlayers}
                gameStarted={gameStarted}
                playerJoined={playerJoined}
              />
            </Box>
          )}
        </StyledSidebar>
      </Box>
  );
}
export default GamePage;
