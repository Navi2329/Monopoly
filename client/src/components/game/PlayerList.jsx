import React from 'react';

const PlayerList = ({ players, currentPlayerId, gameStarted = false, isHost = false, onKickPlayer, playerJoined = true }) => {
  const hasPlayers = players.length > 0;
  
  return (
    <div className="players-section">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white/90">
          Players {hasPlayers && `(${players.length})`}
        </span>
        {!gameStarted && (
          <button className="text-white/60 hover:text-white/80 transition-colors duration-200 w-4 h-4 flex items-center justify-center">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Players List or Waiting State */}
      {!playerJoined ? (
        <div className="text-center py-8">
          <div className="text-white/50 text-sm mb-2">Waiting for players...</div>
          <div className="animate-pulse flex justify-center">
            <div className="w-8 h-8 bg-white/10 rounded-full"></div>
          </div>
        </div>
      ) : !hasPlayers ? (
        <div className="text-center py-8">
          <div className="text-white/50 text-sm mb-2">No other players yet</div>
          <div className="animate-pulse flex justify-center">
            <div className="w-8 h-8 bg-white/10 rounded-full"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {players.map((player) => (
            <div key={player.id} className={`group transition-all duration-500 ${player.isJoining ? 'animate-pulse' : ''}`}>
              <div className="flex items-center justify-between bg-black/20 backdrop-blur-sm p-2.5 rounded-md border border-white/5 hover:border-white/10 transition-all duration-200 hover:bg-black/30">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    {/* Color circle */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm transition-all duration-300 ${player.isJoining ? 'scale-110' : ''}`}
                      style={{ 
                        backgroundColor: player.color,
                        boxShadow: `0 0 10px ${player.color}30${player.isJoining ? ', 0 0 20px ' + player.color + '50' : ''}`
                      }}
                    >
                      {player.avatar ? (
                        <img 
                          src={player.avatar} 
                          alt={player.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        player.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    {/* Host crown */}
                    {player.isHost && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] shadow-sm">
                        👑
                      </div>
                    )}
                    
                    {/* Joining indicator */}
                    {player.isJoining && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[8px] shadow-sm animate-bounce">
                        ✨
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs text-white/90 truncate flex items-center gap-1">
                      {player.name}
                      {player.isJoining && (
                        <span className="text-[10px] text-green-400 animate-pulse">joining...</span>
                      )}
                      {!player.isJoining && player.isOnline && (
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-sm flex-shrink-0"></div>
                      )}
                      {player.isBot && !player.isJoining && (
                        <span className="text-[10px] text-purple-400 bg-purple-500/20 px-1 rounded">BOT</span>
                      )}
                    </div>
                    <div className="text-xs text-white/60">${player.money?.toLocaleString() || '1500'}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {!gameStarted && player.id !== currentPlayerId && isHost && (
                    <button 
                      onClick={() => onKickPlayer && onKickPlayer(player.id)}
                      className="bg-red-600/80 hover:bg-red-600 text-white w-6 h-6 rounded text-xs font-medium transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                      title={`Kick ${player.isBot ? 'bot' : 'player'}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default PlayerList;