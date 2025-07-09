import React, { useState } from 'react';

const PlayerSelectionModal = ({ isOpen, onClose, onJoinGame }) => {
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6 text-center">
          Select your player appearance:
        </h2>
        
        {/* Color Selection Grid */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {colorOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedColor(option.color)}
              className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                selectedColor === option.color 
                  ? 'border-white scale-110 shadow-lg' 
                  : 'border-slate-500 hover:border-slate-300 hover:scale-105'
              }`}
              style={{ backgroundColor: option.color }}
              title={option.name}
            />
          ))}
        </div>

        {/* Join Game Button */}
        <button
          onClick={handleJoinGame}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Join game
        </button>

        {/* Get More Appearances Button */}
        <button
          onClick={() => {/* TODO: Implement get more appearances */}}
          className="w-full mt-3 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 border border-slate-600 hover:border-slate-500 flex items-center justify-center gap-2"
        >
          <span>🎨</span>
          Get more appearances
        </button>
      </div>
    </div>
  );
};

export default PlayerSelectionModal;
