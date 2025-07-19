import React, { useState, useEffect } from 'react';

const PlayerSelection = ({
  onJoinGame,
  onChangeAppearance,
  onClose,
  currentPlayerColor,
  usedColors = [],
  isChangingAppearance = false
}) => {
  const [selectedColor, setSelectedColor] = useState(currentPlayerColor || '#a3e635'); // Default lime green
  const [showExtendedColors, setShowExtendedColors] = useState(false);

  // If the selected color becomes disabled, auto-select the first available color
  useEffect(() => {
    if (usedColors.includes(selectedColor)) {
      const colorOptions = showExtendedColors ? extendedColorOptions : basicColorOptions;
      const firstAvailable = colorOptions.find(opt => !usedColors.includes(opt.color));
      if (firstAvailable) setSelectedColor(firstAvailable.color);
    }
  }, [usedColors]);

  const basicColorOptions = [
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

  const extendedColorOptions = [
    { color: '#ef4444', name: 'Crimson' },
    { color: '#f97316', name: 'Amber' },
    { color: '#eab308', name: 'Gold' },
    { color: '#84cc16', name: 'Chartreuse' },
    { color: '#06b6d4', name: 'Sky' },
    { color: '#3b82f6', name: 'Sapphire' },
    { color: '#8b5cf6', name: 'Indigo' },
    { color: '#d946ef', name: 'Magenta' },
    { color: '#71717a', name: 'Silver' },
    { color: '#78716c', name: 'Stone' },
    { color: '#dc2626', name: 'Ruby' },
    { color: '#ea580c', name: 'Bronze' },
    { color: '#ca8a04', name: 'Topaz' },
    { color: '#65a30d', name: 'Emerald' },
    { color: '#0891b2', name: 'Aqua' },
    { color: '#1d4ed8', name: 'Cobalt' },
    { color: '#7c3aed', name: 'Amethyst' },
    { color: '#be185d', name: 'Fuchsia' },
    { color: '#374151', name: 'Graphite' },
    { color: '#451a03', name: 'Mahogany' }
  ];

  const colorOptions = showExtendedColors ? extendedColorOptions : basicColorOptions;

  const handleConfirm = () => {
    if (isColorDisabled(selectedColor)) return;
    if (isChangingAppearance) {
      onChangeAppearance(selectedColor);
    } else {
      onJoinGame(selectedColor);
    }
  };

  const isColorDisabled = (color) => {
    // Always disable colors in usedColors, even for host
    return usedColors.includes(color);
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/30 rounded-3xl p-12 max-w-2xl w-full mx-8 shadow-2xl ring-1 ring-white/10">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            {isChangingAppearance ? 'Change your appearance' : 'Select your player appearance'}
          </h2>
          <p className="text-slate-200 text-lg drop-shadow-md mt-2">
            Choose a color to represent yourself in the game
          </p>
        </div>
        {/* Add gap after header/subtitle */}
        <div className="h-4" />
        {/* Color Selection Grid - Clean circular design with better spacing */}
        <div className={`grid gap-6 mb-6 justify-items-center px-4 ${showExtendedColors ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {colorOptions.map((option, index) => {
            const disabled = isColorDisabled(option.color);
            return (
              <button
                key={index}
                onClick={() => !disabled && setSelectedColor(option.color)}
                disabled={disabled}
                className={`relative w-16 h-16 rounded-full transition-all duration-300 focus:outline-none ${disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:scale-110 focus:ring-4 focus:ring-white/50 cursor-pointer'
                  } ${selectedColor === option.color
                    ? 'scale-125 shadow-2xl ring-4 ring-white/60'
                    : 'shadow-lg hover:shadow-xl'
                  }`}
                style={{
                  backgroundColor: option.color,
                  boxShadow: selectedColor === option.color
                    ? `0 0 30px ${option.color}80, 0 8px 32px rgba(0,0,0,0.3)`
                    : disabled
                      ? `0 4px 12px rgba(0,0,0,0.2)`
                      : `0 8px 24px ${option.color}40, 0 4px 12px rgba(0,0,0,0.2)`
                }}
                title={disabled ? `${option.name} (Taken)` : option.name}
              >
                {selectedColor === option.color && !disabled && (
                  <div className="absolute inset-0 rounded-full border-3 border-white animate-pulse" />
                )}
                {disabled && (() => {
                  return (
                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center pointer-events-none">
                      <span className="text-white text-2xl font-bold">✕</span>
                    </div>
                  );
                })()}
              </button>
            );
          })}
        </div>
        {/* Add gap after color grid */}
        <div className="h-4" />
        {/* Selected Color Preview with better spacing */}
        <div className="flex items-center justify-center gap-4 mb-6 bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <span className="text-slate-200 text-lg font-medium">Selected:</span>
          <div
            className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
            style={{
              backgroundColor: selectedColor,
              boxShadow: `0 4px 16px ${selectedColor}60`
            }}
          />
          <span className="text-white font-semibold text-lg">
            {colorOptions.find(opt => opt.color === selectedColor)?.name}
          </span>
        </div>
        {/* Add gap after selected color preview */}
        <div className="h-4" />
        {/* Action Buttons with better contrast */}
        <div className="space-y-4">
          <button
            onClick={handleConfirm}
            disabled={isColorDisabled(selectedColor)}
            className={`w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-lg backdrop-blur-sm border border-purple-500/30 ${isColorDisabled(selectedColor) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isChangingAppearance ? 'Update appearance' : 'Join game'}
          </button>

          {isChangingAppearance && (
            <button
              onClick={() => onClose && onClose()}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 border border-gray-400/30 hover:border-gray-300/50 backdrop-blur-sm shadow-lg hover:shadow-xl"
            >
              Cancel
            </button>
          )}

          <button
            onClick={() => setShowExtendedColors(!showExtendedColors)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 border border-blue-500/30 hover:border-blue-400/50 flex items-center justify-center gap-3 backdrop-blur-sm shadow-lg hover:shadow-xl"
          >
            <span className="text-xl">🎨</span>
            <span className="text-white">
              {showExtendedColors ? 'Show basic colors' : 'Get more appearances'}
            </span>
          </button>
        </div>
      </div>
    </div >
  );
};

export default PlayerSelection;
