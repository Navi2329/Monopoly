import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import MonopolyBoard from '../components/game/MonopolyBoard';
import ShareGame from '../components/game/ShareGame';
import Chat from '../components/game/Chat';
import PlayerList from '../components/game/PlayerList';
import GameSettings from '../components/game/GameSettings';
import PlayerSelection from '../components/game/PlayerSelection';

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

  // Players data - Initially empty, will be populated when player joins
  const [players, setPlayers] = useState([]);

  // Bots state
  const [bots, setBots] = useState([]);
  const [isAddingBots, setIsAddingBots] = useState(false);
  const [gameSettings, setGameSettings] = useState({
    maxPlayers: 4,
    allowBots: false,
    startingCash: 1500
  });

  // Bot names for dynamic joining
  const botNames = [
    'CyberTrader', 'PropertyBot', 'RichBot', 'MonopolyAI', 
    'AutoInvestor', 'SmartPlayer', 'GameBot', 'TradeMaster'
  ];

  // Function to add bots with delays
  const addBotsWithDelay = async (botsNeeded, startingCash) => {
    if (botsNeeded <= 0) return;
    
    setIsAddingBots(true);
    
    // Get names of existing bots to avoid duplicates
    const existingBotNames = bots.map(bot => bot.name);
    const availableBotNames = botNames.filter(name => !existingBotNames.includes(name));
    
    for (let i = 0; i < botsNeeded && i < availableBotNames.length; i++) {
      const botName = availableBotNames[i];
      const bot = {
        id: `bot-${Date.now()}-${i}`,
        name: botName,
        isBot: true,
        isOnline: true,
        color: ['#ef4444', '#f97316', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'][i % 8],
        money: startingCash,
        icon: botName[0],
        isJoining: true
      };
      
      setBots(prev => [...prev, bot]);
      
      // Add to game log
      console.log(`Bot ${bot.name} is joining...`);
      
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
    setGameLog([...gameLog, { id: Date.now(), type: 'info', message: 'Game started!' }]);
  };

  const handleSettingsChange = (newSettings) => {
    console.log('Settings changed:', newSettings);
    setGameSettings(newSettings);
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

  // Combine human players and bots for display
  const allPlayers = [...players, ...bots];

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <div className="flex h-full">
        {/* Left Sidebar */}
        <div className="w-80 bg-gradient-to-b from-slate-800/90 to-slate-900/90 backdrop-blur-sm flex flex-col border-r border-white/10 shadow-2xl">
          {/* Header with Logo */}
          <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm">
            <button
              className="bg-transparent border-none cursor-pointer w-full text-left group"
              onClick={() => window.location.assign('/')}
              aria-label="Go to Lobby"
            >
              <h1
                className="font-bold tracking-widest text-center group-hover:scale-105 transition-transform duration-200"
                style={{
                  fontSize: '1.4rem',
                  letterSpacing: '0.15em',
                  lineHeight: 1,
                  textShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.3)',
                  color: '#fff',
                  WebkitTextStroke: '0.5px rgba(255,255,255,0.8)',
                  textTransform: 'uppercase',
                  margin: 0,
                  padding: '8px 0',
                }}
              >
                MONOPOLY
              </h1>
            </button>
          </div>

          {/* Share Game Section */}
          <div className="px-4 py-4 border-b border-white/10">
            <ShareGame gameUrl={gameUrl} />
          </div>

          {/* Chat Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <Chat 
              messages={messages} 
              onSendMessage={handleSendMessage}
              disabled={!playerJoined}
            />
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
          {/* Always render the Monopoly Board */}
          <div className={`absolute inset-0 transition-all duration-500 ${!playerJoined ? 'blur-sm scale-105 opacity-60' : ''}`}>
            <div className="h-full flex items-center justify-center p-8">
              <MonopolyBoard 
                gameStarted={gameStarted}
                gameLog={gameLog}
                onStartGame={handleStartGame}
              />
            </div>
          </div>

          {/* Player Selection Overlay */}
          {!playerJoined && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-[1px]">
              <PlayerSelection onJoinGame={handlePlayerJoin} />
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-gradient-to-b from-slate-800/90 to-slate-900/90 backdrop-blur-sm flex flex-col border-l border-white/10 shadow-2xl">
          {/* Players Section */}
          <div className="px-4 py-4 border-b border-white/10">
            <PlayerList 
              players={allPlayers} 
              currentPlayerId={currentPlayer?.id} 
              gameStarted={gameStarted}
              isHost={true}
              onKickPlayer={handleKickPlayer}
              playerJoined={playerJoined}
            />
          </div>

          {gameStarted ? (
            /* Game Started Layout */
            <>
              {/* Votekick and Bankrupt Buttons */}
              <div className="px-4 py-3 border-b border-white/10 space-y-2">
                <button 
                  className="w-full bg-gray-600/80 hover:bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={handleVotekick}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Votekick
                </button>
                <button 
                  className="w-full bg-red-600/80 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={handleBankrupt}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Bankrupt
                </button>
              </div>

              {/* Trades Section */}
              <div className="px-4 py-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-white/90">Trades</span>
                  <button 
                    className="bg-purple-600/80 hover:bg-purple-600 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 shadow-sm"
                    onClick={handleCreateTrade}
                  >
                    Create
                  </button>
                </div>
                {/* Scrollable Trades Container */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-3 max-h-24 overflow-y-auto">
                  <div className="text-center text-white/60 text-sm">
                    No active trades
                  </div>
                </div>
              </div>

              {/* Properties Section */}
              <div className="flex-1 px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-white/90">My properties (8)</span>
                </div>
                {/* Scrollable Properties Container */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-2 flex-1 overflow-y-auto max-h-80">
                  <div className="space-y-1">
                    {/* Sample Properties */}
                    <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-md hover:bg-slate-700/70 transition-colors">
                      <span className="text-lg">🇧🇷</span>
                      <span className="text-sm text-white/90">Salvador</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-md hover:bg-slate-700/70 transition-colors">
                      <span className="text-lg">🇮🇱</span>
                      <span className="text-sm text-white/90">Tel Aviv</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-md hover:bg-slate-700/70 transition-colors">
                      <span className="text-lg">✈️</span>
                      <span className="text-sm text-white/90">MUC Airport</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-md hover:bg-slate-700/70 transition-colors">
                      <span className="text-lg">🇨🇳</span>
                      <span className="text-sm text-white/90">Shanghai</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-md hover:bg-slate-700/70 transition-colors">
                      <span className="text-lg">�🇷</span>
                      <span className="text-sm text-white/90">Paris</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-md hover:bg-slate-700/70 transition-colors">
                      <span className="text-lg">🇬🇧</span>
                      <span className="text-sm text-white/90">London</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-md hover:bg-slate-700/70 transition-colors">
                      <span className="text-lg">✈️</span>
                      <span className="text-sm text-white/90">JFK Airport</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-md hover:bg-slate-700/70 transition-colors">
                      <span className="text-lg">🇺🇸</span>
                      <span className="text-sm text-white/90">New York</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Game Settings Section - Only before game starts */
            <div className="flex-1 overflow-y-auto">
              <GameSettings 
                settings={gameSettings}
                onSettingsChange={handleSettingsChange}
                isHost={true}
                players={players}
                maxPlayers={gameSettings.maxPlayers}
                gameStarted={gameStarted}
                playerJoined={playerJoined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default GamePage;
