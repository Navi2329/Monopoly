import React, { useState } from 'react';

const PlayerSelection = ({ onJoinGame }) => {
  const [selectedColor, setSelectedColor] = useState('#a3e635'); // Default lime green

  const colorOptions = [
    { color: '#a3e635', name: 'Lime' },       // Row 1
    { color: '#fbbf24', name: 'Yellow' },
    { color: '#f97316', name: 'Orange' },
    { color: '#ef4444', name: 'Red' },
    { color: '#3b82f6', name: 'Blue' },       // Row 2
    { color: '#06b6d4', name: 'Cyan' },
    { color: '#10b981', name: 'Teal' },
    { color: '#22c55e', name: 'Green' },
    { color: '#a855f7', name: 'Purple' },     // Row 3
    { color: '#ec4899', name: 'Pink' },
    { color: '#f43f5e', name: 'Rose' },
    { color: '#8b5cf6', name: 'Violet' }
  ];

  const handleJoinGame = () => {
    onJoinGame(selectedColor);
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/30 rounded-3xl p-12 max-w-2xl w-full mx-8 shadow-2xl ring-1 ring-white/10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
            Select your player appearance
          </h2>
          <p className="text-slate-200 text-lg drop-shadow-md">
            Choose a color to represent yourself in the game
          </p>
        </div>
        
        {/* Color Selection Grid - Clean circular design */}
        <div className="grid grid-cols-4 gap-8 mb-12 justify-items-center">
          {colorOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedColor(option.color)}
              className={`relative w-16 h-16 rounded-full transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-white/50 ${
                selectedColor === option.color 
                  ? 'scale-125 shadow-2xl ring-4 ring-white/60' 
                  : 'shadow-lg hover:shadow-xl'
              }`}
              style={{ 
                backgroundColor: option.color,
                boxShadow: selectedColor === option.color 
                  ? `0 0 30px ${option.color}80, 0 8px 32px rgba(0,0,0,0.3)` 
                  : `0 8px 24px ${option.color}40, 0 4px 12px rgba(0,0,0,0.2)`
              }}
              title={option.name}
            >
              {selectedColor === option.color && (
                <div className="absolute inset-0 rounded-full border-3 border-white animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Selected Color Preview */}
        <div className="flex items-center justify-center gap-4 mb-8 bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <span className="text-slate-200 text-lg">Selected:</span>
          <div 
            className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
            style={{ 
              backgroundColor: selectedColor,
              boxShadow: `0 4px 16px ${selectedColor}60`
            }}
          />
          <span className="text-white font-medium">
            {colorOptions.find(opt => opt.color === selectedColor)?.name}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleJoinGame}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-lg backdrop-blur-sm border border-purple-500/30"
          >
            Join game
          </button>

          <button
            onClick={() => {/* TODO: Implement get more appearances */}}
            className="w-full bg-slate-800/60 hover:bg-slate-700/70 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 border border-slate-600/50 hover:border-slate-500 flex items-center justify-center gap-2 backdrop-blur-sm shadow-lg"
          >
            <span>🎨</span>
            Get more appearances
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerSelection;
