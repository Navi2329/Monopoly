import React, { useState, useEffect } from 'react';

const GameSettings = ({ 
  settings = {}, 
  onSettingsChange = () => {},
  onBotsChange = () => {},
  isHost = true,
  players = [],
  maxPlayers = 4,
  gameStarted = false,
  playerJoined = false
}) => {
  const [localSettings, setLocalSettings] = useState({
    maxPlayers: 4,
    privateRoom: true,
    allowBots: false,
    onlyLoggedUsers: false,
    boardMap: 'Classic',
    doubleRentFullSet: true,
    vacationCash: true,
    auction: false,
    noRentInPrison: false,
    mortgage: true,
    evenBuild: true,
    startingCash: 1500,
    randomizeOrder: true,
    ...settings
  });

  const [bots, setBots] = useState([]);

  // Bot names for dynamic joining
  const botNames = [
    'CyberTrader', 'PropertyBot', 'RichBot', 'MonopolyAI', 
    'AutoInvestor', 'SmartPlayer', 'GameBot', 'TradeMaster'
  ];

  useEffect(() => {
    if (localSettings.allowBots && players.length < localSettings.maxPlayers) {
      // Add bots to fill remaining slots
      const humanPlayers = players.filter(p => !p.isBot);
      const botsNeeded = localSettings.maxPlayers - humanPlayers.length;
      const newBots = [];
      
      for (let i = 0; i < botsNeeded; i++) {
        if (i < botNames.length) {
          newBots.push({
            id: `bot-${i + 1}`,
            name: botNames[i],
            isBot: true,
            isOnline: true,
            color: ['#ef4444', '#f97316', '#06b6d4', '#8b5cf6'][i % 4],
            money: localSettings.startingCash,
            icon: botNames[i][0]
          });
        }
      }
      setBots(newBots);
      onBotsChange(newBots);
    } else {
      setBots([]);
      onBotsChange([]);
    }
  }, [localSettings.allowBots, localSettings.maxPlayers, players.length, localSettings.startingCash]);

  const handleChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled || !isHost}
        className="sr-only"
      />
      <div
        className={`w-11 h-6 rounded-full transition-all duration-300 ease-in-out relative ${
          checked 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30' 
            : 'bg-white/20 shadow-inner'
        } ${disabled || !isHost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ease-in-out absolute top-1 ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </div>
    </label>
  );

  const totalPlayers = players.length + (localSettings.allowBots ? bots.length : 0);
  const humanPlayers = players.filter(p => !p.isBot);

  return (
    <div className="flex flex-col h-full">
      {/* Waiting for players section - Only show before player joins */}
      {!playerJoined && (
        <div className="px-4 py-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-lg mx-4 mb-4 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-white/90">Waiting for players...</div>
            <div className="text-xs text-white/60">{totalPlayers}/{localSettings.maxPlayers}</div>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(totalPlayers / localSettings.maxPlayers) * 100}%` }}
            />
          </div>
          
          {/* Player slots visualization */}
          <div className="flex gap-2 mt-3">
            {Array.from({ length: localSettings.maxPlayers }, (_, i) => {
              const player = [...players, ...bots][i];
              return (
                <div key={i} className="flex-1 flex items-center justify-center">
                  {player ? (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      player.isBot ? 'bg-gradient-to-r from-slate-500 to-slate-600 animate-pulse' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}>
                      {player.icon}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Game Settings Header */}
        <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <h3 className="text-sm font-semibold text-white/90">Game Settings</h3>
          </div>
        </div>
        
        <div className="px-4 py-2">
          <div className="space-y-1">
            {/* Maximum Players */}
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white/90">Max players</div>
                  <div className="text-xs text-white/60">Number of players allowed</div>
                </div>
              </div>
              <select 
                value={localSettings.maxPlayers}
                onChange={(e) => handleChange('maxPlayers', parseInt(e.target.value))}
                disabled={!isHost}
                className="bg-white/5 text-white/90 px-3 py-1.5 rounded-lg text-sm border border-white/10 hover:border-white/20 focus:border-blue-400 focus:outline-none transition-all disabled:opacity-50 min-w-[70px]"
              >
                <option value={4} className="bg-slate-800">4</option>
                <option value={3} className="bg-slate-800">3</option>
                <option value={2} className="bg-slate-800">2</option>
              </select>
            </div>

            {/* Private Room */}
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white/90">Private room</div>
                  <div className="text-xs text-white/60">Accessible via URL only</div>
                </div>
              </div>
              <ToggleSwitch
                checked={localSettings.privateRoom}
                onChange={(value) => handleChange('privateRoom', value)}
              />
            </div>

            {/* Allow Bots */}
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white/90 flex items-center gap-2">
                    Allow bots
                  </div>
                  <div className="text-xs text-white/60">Fill empty slots with AI players</div>
                </div>
              </div>
              <ToggleSwitch
                checked={localSettings.allowBots}
                onChange={(value) => handleChange('allowBots', value)}
              />
            </div>

            {/* Only Logged Users */}
            <div className="flex items-center justify-between py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white/90">Logged users only</div>
                  <div className="text-xs text-white/60">Require login to join</div>
                </div>
              </div>
              <ToggleSwitch
                checked={localSettings.onlyLoggedUsers}
                onChange={(value) => handleChange('onlyLoggedUsers', value)}
              />
            </div>

            {/* Board Map */}
            <div className="py-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90">Board map</div>
                    <div className="text-xs text-white/60">Change tiles and properties</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/90">{localSettings.boardMap}</span>
                  <button 
                    className="text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors p-1 rounded-md hover:bg-white/5"
                    disabled={!isHost}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Gameplay Rules Header */}
            <div className="py-4 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/50 -mx-4 px-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm centerfont-semibold text-white/90">Gameplay Rules</div>
              </div>
            </div>
            
            {/* Gameplay Rules */}
            <div className="space-y-1">
              {/* Double Rent */}
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1.001-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.549.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979A4.265 4.265 0 018.017 12H10a1 1 0 100-2H8.017a4.265 4.265 0 01.719-2.021z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90">Double rent on full sets</div>
                    <div className="text-xs text-white/60">2x rent for complete property groups</div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={localSettings.doubleRentFullSet}
                  onChange={(value) => handleChange('doubleRentFullSet', value)}
                />
              </div>

              {/* Vacation Cash */}
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90">Vacation cash</div>
                    <div className="text-xs text-white/60">Collect Cash when Landing on Vacation</div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={localSettings.vacationCash}
                  onChange={(value) => handleChange('vacationCash', value)}
                />
              </div>

              {/* Auction */}
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90">Auction</div>
                    <div className="text-xs text-white/60">Auction unpurchased properties</div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={localSettings.auction}
                  onChange={(value) => handleChange('auction', value)}
                />
              </div>

              {/* No Rent in Prison */}
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-500/20 to-slate-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90">No rent in prison</div>
                    <div className="text-xs text-white/60">No rent collected while jailed</div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={localSettings.noRentInPrison}
                  onChange={(value) => handleChange('noRentInPrison', value)}
                />
              </div>

              {/* Mortgage */}
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90">Mortgage</div>
                    <div className="text-xs text-white/60">Allow property mortgaging</div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={localSettings.mortgage}
                  onChange={(value) => handleChange('mortgage', value)}
                />
              </div>

              {/* Even Build */}
              <div className="flex items-center justify-between py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90">Even build</div>
                    <div className="text-xs text-white/60">Build houses evenly across sets</div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={localSettings.evenBuild}
                  onChange={(value) => handleChange('evenBuild', value)}
                />
              </div>

              {/* Starting Cash */}
              <div className="py-4 border-b border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90">Starting cash</div>
                    <div className="text-xs text-white/60">Initial money for each player</div>
                  </div>
                </div>
                <select 
                  value={localSettings.startingCash}
                  onChange={(e) => handleChange('startingCash', parseInt(e.target.value))}
                  disabled={!isHost}
                  className="w-full bg-white/5 text-white/90 px-3 py-2 rounded-lg text-sm border border-white/10 hover:border-white/20 focus:border-blue-400 focus:outline-none transition-all disabled:opacity-50"
                >
                  <option value={1000} className="bg-slate-800">$1,000</option>
                  <option value={1500} className="bg-slate-800">$1,500</option>
                  <option value={2000} className="bg-slate-800">$2,000</option>
                  <option value={2500} className="bg-slate-800">$2,500</option>
                </select>
              </div>

              {/* Randomize Order */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90">Randomize order</div>
                    <div className="text-xs text-white/60">Shuffle player turn order</div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={localSettings.randomizeOrder}
                  onChange={(value) => handleChange('randomizeOrder', value)}
                />
              </div>
            </div>
          </div>

          {!isHost && (
            <div className="mx-4 mb-4 text-xs text-white/60 bg-black/20 backdrop-blur-sm rounded-lg p-3 border border-white/10 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Only the host can modify game settings
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameSettings;
