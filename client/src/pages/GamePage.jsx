import React, { useState, useRef } from 'react';
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
import classicMap from '../data/maps/classic';

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
  const [roundNumber, setRoundNumber] = useState(1); // Track current round number

  // Player status tracking - simplified
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

  // Debug effect to monitor playerStatuses changes
  React.useEffect(() => {
  }, [playerStatuses]);

  // Helper function to generate unique log IDs
  const generateLogId = () => {
    setLogIdCounter(prev => prev + 1);
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${logIdCounter}`;
  };

  // Property ownership and landing
  const [propertyOwnership, setPropertyOwnership] = useState({}); // { propertyName: { owner: playerId, ownerName: string, ownerColor: string, houses: number, hotel: boolean, mortgaged: boolean } }
  const [propertyLandingState, setPropertyLandingState] = useState(null); // { property, player, isActive } - null when no property landing

  // State to handle player move requests from GamePage to MonopolyBoard
  const [playerMoveRequest, setPlayerMoveRequest] = useState(null);

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
  const [isShufflingPlayers, setIsShufflingPlayers] = useState(false);

  // Ref to store the final shuffled order
  const shuffledOrderRef = useRef(null);
  const [shuffleVersion, setShuffleVersion] = useState(0);

  // Combine human players and bots for display
  // Use shuffled order if available, otherwise use current order
  const allPlayers = React.useMemo(() => {
    if (shuffledOrderRef.current && gameStarted) {
      return shuffledOrderRef.current;
    }
    return [...players, ...bots];
  }, [players, bots, gameStarted, shuffleVersion]);

  // State to track if randomization was used
  const [wasRandomized, setWasRandomized] = useState(false);

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
    allowAuction: true, // Enable auction by default
    doubleRentOnFullSet: false, // x2 rent on full-set properties
    vacationCash: false, // Vacation cash collection
    noRentInPrison: false, // Don't collect rent while in prison
    mortgage: false, // Mortgage properties
    evenBuild: false, // Even build rule
    randomizePlayerOrder: false // Randomize player order
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
        message: 'joined the game'
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
  }, [gameSettings.allowBots, gameSettings.maxPlayers, players.length, gameSettings.startingCash, gameStarted, playerJoined, isAddingBots]);

  // Effect to update existing players' money when starting cash changes
  React.useEffect(() => {
    if (!gameStarted && playerJoined) {
      // Update human players' money
      setPlayers(prev => prev.map(player => ({
        ...player,
        money: gameSettings.startingCash
      })));

      // Update current player's money
      if (currentPlayer) {
        setCurrentPlayer(prev => ({
          ...prev,
          money: gameSettings.startingCash
        }));
      }

      // Update bots' money
      setBots(prev => prev.map(bot => ({
        ...bot,
        money: gameSettings.startingCash
      })));
    }
  }, [gameSettings.startingCash, gameStarted, playerJoined]);





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
    const currentPlayer = allPlayers[playerIndex];

    if (!currentPlayer) return;

    // Prevent duplicate processing
    if (isProcessingLanding.current) {
      return;
    }
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
    const ownership = propertyOwnership[property.name];

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
        const ownerAirports = Object.values(propertyOwnership).filter(
          p => p.owner === ownership.owner && classicMap.find(prop => prop.name === p.name)?.type === 'airport'
        ).length;
        const rentIndex = Math.min(ownerAirports - 1, 3); // 0-3 index for 1-4 airports
        rentAmount = property.rent[rentIndex] || property.rent[0]; // Use base rent as fallback
      } else if (property.type === 'company' && property.rent && Array.isArray(property.rent)) {
        // Company rent based on number of companies owned by the same player
        const ownerCompanies = Object.values(propertyOwnership).filter(
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
        const ownedFullSet = setProperties.every(p => propertyOwnership[p.name] && propertyOwnership[p.name].owner === ownership.owner);
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
          setPropertyLandingState({
            property: property,
            player: currentPlayer,
            isActive: true
          });
        }
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
    setPlayerStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[currentPlayer.id];
      return newStatuses;
    });

    // Clear jail rounds when paying fine
    setPlayerJailRounds(prev => {
      const newRounds = { ...prev };
      delete newRounds[currentPlayer.id];
      return newRounds;
    });

    // Log the action
    setGameLog(prev => [{
      id: generateLogId(),
      type: 'special',
      player: currentPlayer.name,
      message: `paid $50 to get out of jail`
    }, ...prev]);

    // Clear property landing state and immediately end turn
    setPropertyLandingState(null);

    // Immediately end turn without showing any buttons
    handleEndTurn(true); // <-- force next player
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
    setPlayerStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[currentPlayer.id];
      return newStatuses;
    });

    // Clear jail rounds when using jail card
    setPlayerJailRounds(prev => {
      const newRounds = { ...prev };
      delete newRounds[currentPlayer.id];
      return newRounds;
    });

    // Log the action
    setGameLog(prev => [{
      id: generateLogId(),
      type: 'special',
      player: currentPlayer.name,
      message: `used "Get out of jail free" card`
    }, ...prev]);

    // Clear property landing state and immediately end turn
    setPropertyLandingState(null);

    // Immediately end turn without showing any buttons
    handleEndTurn(true); // <-- force next player
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
      { id: generateLogId(), type: 'info', message: `Joined room ${roomId}` },
      { id: generateLogId(), type: 'join', player: 'GODWILDBEAST', message: 'joined the game' }
    ]);

    // Add welcome message to chat
    setMessages(prev => [...prev, {
      id: generateLogId(),
      text: 'Ready to play!',
      sender: 'GODWILDBEAST',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

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

  const handleStartGame = () => {
    if (!playerJoined) return; // Don't allow game start until player joined

    // Randomize player order if setting is enabled
    if (gameSettings.randomizePlayerOrder) {
      setIsShufflingPlayers(true);
      setWasRandomized(true);

      // Capture current players and bots to avoid recreation issues
      const currentPlayers = [...players];
      const currentBots = [...bots];
      const allCurrentPlayers = [...currentPlayers, ...currentBots];

      // Safety check - ensure we have players to shuffle
      if (allCurrentPlayers.length === 0) {
        setIsShufflingPlayers(false);
        setGameStarted(true);
        setGamePhase('rolling');
        setCurrentPlayerIndex(0);
        setRoundNumber(1);
        return;
      }

      // Create a quick shuffling animation
      const shuffleSteps = 3; // Fewer steps for faster animation
      let currentStep = 0;

      const shuffleInterval = setInterval(() => {
        try {
          // Quick shuffle animation
          const shuffledPlayers = [...allCurrentPlayers];
          for (let i = shuffledPlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
          }

          setPlayers(shuffledPlayers.filter(p => !p.isBot));
          setBots(shuffledPlayers.filter(p => p.isBot));

          currentStep++;
          if (currentStep >= shuffleSteps) {
            clearInterval(shuffleInterval);
            setIsShufflingPlayers(false);

            try {
              // Set the final shuffled order and store it in ref
              // Fisher-Yates shuffle with retry to ensure order changes
              let finalShuffledPlayers = [...allCurrentPlayers];
              let attempts = 0;
              const maxAttempts = 10;

              do {
                finalShuffledPlayers = [...allCurrentPlayers];
                for (let i = finalShuffledPlayers.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [finalShuffledPlayers[i], finalShuffledPlayers[j]] = [finalShuffledPlayers[j], finalShuffledPlayers[i]];
                }
                attempts++;
              } while (
                attempts < maxAttempts &&
                finalShuffledPlayers.map(p => p.name).join(',') === allCurrentPlayers.map(p => p.name).join(',')
              );

              // Set the final shuffled order in ref
              shuffledOrderRef.current = finalShuffledPlayers;

              // Update players and bots arrays with the shuffled order
              setPlayers(finalShuffledPlayers.filter(p => !p.isBot));
              setBots(finalShuffledPlayers.filter(p => p.isBot));

              // Force re-render by incrementing version
              setShuffleVersion(prev => prev + 1);

              // Check if the order actually changed
              const originalOrder = allCurrentPlayers.map(p => p.name).join(',');
              const newOrder = finalShuffledPlayers.map(p => p.name).join(',');
              const orderChanged = originalOrder !== newOrder;

              // Log the final player order
              const playerOrderText = finalShuffledPlayers.map((player, index) =>
                `${index + 1}. ${player.name}${player.isBot ? ' 🤖' : ''}`
              ).join(', ');

              setGameLog(prev => [
                {
                  id: generateLogId(),
                  type: 'info',
                  message: orderChanged ? '🎲 Player order randomized!' : '🎲 Shuffling completed (same order)'
                },
                {
                  id: generateLogId(),
                  type: 'info',
                  message: `📋 Final order: ${playerOrderText}`
                },
                ...prev
              ]);

            } catch (error) {
              console.error('Error during player randomization:', error);
              setGameLog(prev => [{
                id: generateLogId(),
                type: 'info',
                message: '⚠️ Error during randomization, using original order'
              }, ...prev]);
            }

            // Start the game after a short delay to ensure state is updated
            setTimeout(() => {
              setGameStarted(true);
              setGamePhase('rolling'); // Start with first player's turn
              setCurrentPlayerIndex(0);
              setRoundNumber(1); // Initialize round number
              setGameLog(prev => [{
                id: generateLogId(),
                type: 'info',
                message: '🚀 Game started! All players placed on START.'
              }, ...prev]);

              // Show initial vacation cash if enabled
              if (gameSettings.vacationCash) {
                setGameLog(prev => [{
                  id: generateLogId(),
                  type: 'info',
                  message: 'Vacation cash collection enabled - Cash: $0'
                }, ...prev]);
              }
            }, 300); // Quick delay to show the final order
          }
        } catch (error) {
          console.error('Error during shuffle animation:', error);
          clearInterval(shuffleInterval);
          setIsShufflingPlayers(false);
          // Fallback to immediate game start
          setGameStarted(true);
          setGamePhase('rolling');
          setCurrentPlayerIndex(0);
          setRoundNumber(1);
        }
      }, 100); // Very fast shuffling animation
    } else {
      // No randomization - start game immediately
      setGameStarted(true);
      setGamePhase('rolling'); // Start with first player's turn
      setCurrentPlayerIndex(0);
      setRoundNumber(1); // Initialize round number
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'info',
        message: 'Game started! All players placed on START.'
      }, ...prev]);

      // Show initial vacation cash if enabled
      if (gameSettings.vacationCash) {
        setGameLog(prev => [{
          id: generateLogId(),
          type: 'info',
          message: 'Vacation cash collection enabled - Cash: $0'
        }, ...prev]);
      }
    }
  };

  // Function to move a player to a specific position (used for jail, etc.)
  const handleMovePlayerToPosition = (playerId, position) => {
    // This will be passed to MonopolyBoard as a callback
    // MonopolyBoard will handle the actual position update
    return new Promise((resolve) => {
      // Set a flag or trigger that MonopolyBoard can use
      setPlayerMoveRequest({ playerId, position, resolve });
    });
  };

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
          // End turn immediately after moving to jail
          setTimeout(() => {
            handleEndTurn(true); // <-- force next player
          }, 1000);
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
    if (startPos !== 0 && newPos === 0) {
      // Landed exactly on START
      startBonus = 300;
    } else if (startPos > newPos || (startPos + total) >= 40) {
      // Passed START (wrapped around)
      startBonus = 200;
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

      const bonusMessage = startBonus === 300 ? 'landed on START and collected $300!' : 'passed START and collected $200!';
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'special',
        player: currentPlayer?.name,
        message: bonusMessage
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

      // End turn immediately when sent to jail
      setTimeout(() => {
        handleEndTurn(true); // <-- force next player
      }, 1000);
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

      // End turn immediately after setting vacation status
      setTimeout(() => {
        handleEndTurn(true, { [currentPlayer.id]: { status: 'vacation', vacationStartRound: roundNumber } });
      }, 1000); // Increased delay to ensure state is updated
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

      // Player escaped jail - end turn immediately (no extra turn for doubles)
      setTimeout(() => {
        handleEndTurn(true); // <-- force next player
      }, 1000);
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

      // Player stays in jail, end their turn immediately
      setTimeout(() => {
        handleEndTurn(true); // <-- force next player
      }, 1000);
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

      // Player is automatically released, end their turn immediately
      setTimeout(() => {
        handleEndTurn(true); // <-- force next player
      }, 1000);
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
      handlePropertyLanding(currentPlayerIndex, landedSpaceIndex);
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

    const currentPlayer = allPlayers[currentPlayerIndex];
    const lastRoll = lastDiceRoll;
    const isEndTurnAfterDoubles = lastRoll && lastRoll.dice1 === lastRoll.dice2 &&
      (playerDoublesCount[currentPlayer?.id] || 0) < 3;

    // If forcing next player (like when going to jail), skip doubles logic
    if (forceNextPlayer) {
      // Clear any remaining dice roll state
      setLastDiceRoll(null);
    } else if (isEndTurnAfterDoubles) {
      setGamePhase('rolling');
      return;
    }

    // Find the next player who can take their turn (not on vacation)
    let nextPlayerIndex = (currentPlayerIndex + 1) % allPlayers.length;
    let roundsIncremented = 0;

    // First, check if all players are on vacation
    // Use pending vacation status if provided, otherwise use current state
    const effectivePlayerStatuses = pendingVacationStatus ? { ...playerStatuses, ...pendingVacationStatus } : playerStatuses;

    const allPlayersOnVacation = allPlayers.every(player => {
      const status = effectivePlayerStatuses[player.id];
      return status && (status === 'vacation' || status.status === 'vacation');
    });


    if (allPlayersOnVacation && allPlayers.length > 0) {
      // All players are on vacation - advance the round and clear all vacation statuses
      roundsIncremented += 2;
      setRoundNumber(prev => prev + 2);
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'info',
        message: `All players on vacation - advancing to Round ${roundNumber + 2} to get everyone out!`
      }, ...prev]);

      // Remove vacation status from all players
      setPlayerStatuses(prev => {
        const newStatuses = { ...prev };
        allPlayers.forEach(player => {
          if (newStatuses[player.id] &&
            (newStatuses[player.id] === 'vacation' || newStatuses[player.id].status === 'vacation')) {
            delete newStatuses[player.id];
          }
        });
        return newStatuses;
      });

      // Log that all players are back from vacation
      setGameLog(prev => [{
        id: generateLogId(),
        type: 'info',
        message: `All players returned from vacation!`
      }, ...prev]);

      // Start with the first player
      nextPlayerIndex = 0;
    } else {
      // Normal vacation handling - loop through players until we find one who can take their turn
      let playersChecked = 0;
      while (true) {
        // Check if we're starting a new round
        if (nextPlayerIndex === 0) {
          roundsIncremented++;
          setRoundNumber(prev => prev + 1);
          setGameLog(prev => [{
            id: generateLogId(),
            type: 'info',
            message: `New round started (Round ${roundNumber + roundsIncremented})`
          }, ...prev]);
        }

        // Check vacation status for the current next player
        const nextPlayerStatus = effectivePlayerStatuses[allPlayers[nextPlayerIndex]?.id];

        if (!nextPlayerStatus ||
          (nextPlayerStatus !== 'vacation' && nextPlayerStatus.status !== 'vacation')) {
          // Increment jail rounds for players in jail (release happens when they roll dice)
          if (nextPlayerStatus === 'jail') {
            const currentJailRounds = playerJailRounds[allPlayers[nextPlayerIndex].id] || 0;
            const newJailRounds = currentJailRounds + 1;

            setPlayerJailRounds(prev => ({
              ...prev,
              [allPlayers[nextPlayerIndex].id]: newJailRounds
            }));
          }

          // This player can take their turn
          break;
        }

        // Player is on vacation - check if vacation should end
        const vacationStartRound = nextPlayerStatus.vacationStartRound || 1;
        const currentRoundForCheck = roundNumber + roundsIncremented;
        const roundsSinceVacation = currentRoundForCheck - vacationStartRound;

        if (roundsSinceVacation >= 2) {
          // Vacation is over after spending 1 full round in vacation - remove status and let player take their turn
          setPlayerStatuses(prev => {
            const newStatuses = { ...prev };
            delete newStatuses[allPlayers[nextPlayerIndex].id];
            return newStatuses;
          });

          setGameLog(prev => [{
            id: generateLogId(),
            type: 'info',
            player: allPlayers[nextPlayerIndex].name,
            message: `vacation is over! Back to the game.`
          }, ...prev]);
          break;
        } else {
          // Still on vacation - skip this player
          setGameLog(prev => [{
            id: generateLogId(),
            type: 'info',
            player: allPlayers[nextPlayerIndex].name,
            message: `is on vacation - turn skipped!`
          }, ...prev]);

          // Move to next player
          nextPlayerIndex = (nextPlayerIndex + 1) % allPlayers.length;
          playersChecked++;

          // If we've checked all players and they're all still on vacation, advance round and clear all vacation statuses
          if (playersChecked >= allPlayers.length) {
            // Advance the round and clear all vacation statuses
            roundsIncremented += 2;
            setRoundNumber(prev => prev + 2);
            setGameLog(prev => [{
              id: generateLogId(),
              type: 'info',
              message: `All players on vacation - advancing to Round ${roundNumber + 2} to get everyone out!`
            }, ...prev]);

            // Remove vacation status from all players
            setPlayerStatuses(prev => {
              const newStatuses = { ...prev };
              allPlayers.forEach(player => {
                if (newStatuses[player.id] &&
                  (newStatuses[player.id] === 'vacation' || newStatuses[player.id].status === 'vacation')) {
                  delete newStatuses[player.id];
                }
              });
              return newStatuses;
            });

            // Log that all players are back from vacation
            setGameLog(prev => [{
              id: generateLogId(),
              type: 'info',
              message: `All players returned from vacation!`
            }, ...prev]);

            // Start with the first player
            nextPlayerIndex = 0;
            break;
          }
        }
      }
    }

    setCurrentPlayerIndex(nextPlayerIndex);
    setGamePhase('rolling');
  };

  const handleSettingsChange = (newSettings) => {
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
    const { property, player } = propertyLandingState;

    if (player.money >= property.price) {
      // Update property ownership
      setPropertyOwnership(prev => ({
        ...prev,
        [property.name]: {
          owner: player.id,
          ownerName: player.name,
          ownerColor: player.color,
          houses: 0,
          hotel: false,
          mortgaged: false
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
      } else {
        // Normal turn end
        setGamePhase('turn-end');
      }
    }

    // Reset processing flag
    isProcessingLanding.current = false;
  };

  // Handle auction from horizontal buttons
  const handleAuctionProperty = () => {
    const { property, player } = propertyLandingState;

    // For now, just log that auction started - implement auction logic later
    setGameLog(prev => [{
      id: generateLogId(),
      type: 'info',
      player: player.name,
      message: `started auction for ${property.name}`
    }, ...prev]);

    // Clear property landing state
    setPropertyLandingState(null);

    // Check if last roll was doubles before ending turn
    const wasDoubles = lastDiceRoll && lastDiceRoll.dice1 === lastDiceRoll.dice2;
    if (wasDoubles) {
      // Player gets another turn for rolling doubles
      setGamePhase('rolling');
    } else {
      // Normal turn end
      setGamePhase('turn-end');
    }
  };

  // Handle skipping to buy property
  const handleSkipProperty = () => {
    const { property, player } = propertyLandingState;

    setGameLog(prev => [{
      id: generateLogId(),
      type: 'info',
      player: player.name,
      message: `declined to buy ${property.name}`
    }, ...prev]);

    // Clear property landing state
    setPropertyLandingState(null);

    // Check if last roll was doubles before ending turn
    const wasDoubles = lastDiceRoll && lastDiceRoll.dice1 === lastDiceRoll.dice2;
    if (wasDoubles) {
      // Player gets another turn for rolling doubles
      setGamePhase('rolling');
    } else {
      // Normal turn end
      setGamePhase('turn-end');
    }
  };

  // Property management handlers
  const handleBuildHouse = (propertyName) => {
    const currentPlayer = allPlayers[currentPlayerIndex];
    if (!currentPlayer) return;

    const property = classicMap.find(p => p.name === propertyName);
    if (!property || property.type !== 'property') return;

    const ownership = propertyOwnership[propertyName];
    if (!ownership || ownership.owner !== currentPlayer.id) return;

    // Check if player can build (owns full set, no mortgaged properties in set, has money)
    const setProperties = classicMap.filter(p => p.set === property.set && p.type === 'property');
    const ownedSet = setProperties.every(p => propertyOwnership[p.name] && propertyOwnership[p.name].owner === currentPlayer.id);
    const anyMortgaged = setProperties.some(p => propertyOwnership[p.name]?.mortgaged);

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
        const propHouses = propertyOwnership[p.name]?.houses || 0;
        const propHotel = propertyOwnership[p.name]?.hotel || false;
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
          const propHouses = propertyOwnership[p.name]?.houses || 0;
          const propHotel = propertyOwnership[p.name]?.hotel || false;
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
      setPropertyOwnership(prev => ({
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
      setPropertyOwnership(prev => ({
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
    const currentPlayer = allPlayers[currentPlayerIndex];
    if (!currentPlayer) return;

    const property = classicMap.find(p => p.name === propertyName);
    if (!property || property.type !== 'property') return;

    const ownership = propertyOwnership[propertyName];
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
      const setHouses = setProperties.map(p => propertyOwnership[p.name]?.houses || 0);
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
        const allHaveHotels = setProperties.every(p => propertyOwnership[p.name]?.hotel);
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

      setPropertyOwnership(prev => ({
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

      setPropertyOwnership(prev => ({
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
    const currentPlayer = allPlayers[currentPlayerIndex];
    if (!currentPlayer) return;

    const property = classicMap.find(p => p.name === propertyName);
    if (!property) return;

    const ownership = propertyOwnership[propertyName];
    if (!ownership || ownership.owner !== currentPlayer.id) return;

    // Check if property can be mortgaged/unmortgaged
    if (property.type === 'property') {
      const setProperties = classicMap.filter(p => p.set === property.set && p.type === 'property');
      const anyHousesOrHotels = setProperties.some(p => propertyOwnership[p.name]?.houses > 0 || propertyOwnership[p.name]?.hotel);
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

      setPropertyOwnership(prev => ({
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

      setPropertyOwnership(prev => ({
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
    const currentPlayer = allPlayers[currentPlayerIndex];
    if (!currentPlayer) return;

    const property = classicMap.find(p => p.name === propertyName);
    if (!property) return;

    const ownership = propertyOwnership[propertyName];
    if (!ownership || ownership.owner !== currentPlayer.id) return;

    // Check if property can be sold (no houses/hotels, not mortgaged)
    if (property.type === 'property') {
      const setProperties = classicMap.filter(p => p.set === property.set && p.type === 'property');
      const anyHousesOrHotels = setProperties.some(p => propertyOwnership[p.name]?.houses > 0 || propertyOwnership[p.name]?.hotel);

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
    setPropertyOwnership(prev => {
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
    const ownership = propertyOwnership[propertyName];
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
          const ownedFullSet = setProperties.every(p => propertyOwnership[p.name] && propertyOwnership[p.name].owner === ownership.owner);
          if (ownedFullSet) {
            rentDetails += ` (double rent - full set)`;
          }
        }
      } else if (property.type === 'airport') {
        const ownerAirports = Object.values(propertyOwnership).filter(
          p => p.owner === ownership.owner && classicMap.find(prop => prop.name === p.name)?.type === 'airport'
        ).length;
        rentDetails = ` (${ownerAirports} airport${ownerAirports > 1 ? 's' : ''} owned)`;
      } else if (property.type === 'company') {
        const ownerCompanies = Object.values(propertyOwnership).filter(
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
            onJailExit={() => { }} // Empty callback for now, animations handled internally
            playerStatuses={playerStatuses}
            playerJailRounds={playerJailRounds}
            playerMoveRequest={playerMoveRequest}
            onPlayerMoveComplete={() => setPlayerMoveRequest(null)}
            propertyLandingState={propertyLandingState}
            onBuyProperty={handleBuyProperty}
            onAuctionProperty={handleAuctionProperty}
            onSkipProperty={handleSkipProperty}
            onBuildHouse={handleBuildHouse}
            onDestroyHouse={handleDestroyHouse}
            onMortgageProperty={handleMortgageProperty}
            onSellProperty={handleSellProperty}
            devDiceEnabled={devDiceEnabled}
            devDice1={devDice1}
            devDice2={devDice2}
            vacationCash={gameSettings.vacationCash ? vacationCash : 0}
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
            isShuffling={isShufflingPlayers}
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
