import React, { useState } from 'react';
import './MonopolyBoard.css';

const MonopolyBoard = ({ gameStarted, gameLog = [], onStartGame }) => {
  const [dice, setDice] = useState({ dice1: 1, dice2: 1 });
  const [isRolling, setIsRolling] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState('GODWILDBEAST');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const rollDice = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    
    // Animate dice rolling
    const rollAnimation = setInterval(() => {
      setDice({
        dice1: Math.floor(Math.random() * 6) + 1,
        dice2: Math.floor(Math.random() * 6) + 1
      });
    }, 100);

    // Stop animation and show result
    setTimeout(() => {
      clearInterval(rollAnimation);
      const finalDice1 = Math.floor(Math.random() * 6) + 1;
      const finalDice2 = Math.floor(Math.random() * 6) + 1;
      
      setDice({ dice1: finalDice1, dice2: finalDice2 });
      setIsRolling(false);

      // Show modal for special events
      if (Math.random() > 0.7) {
        setModalContent('Received a Pardon card.');
        setShowModal(true);
      }
    }, 1000);
  };

  const endTurn = () => {
    // Logic to end current player's turn
    console.log('Turn ended');
  };
  // Property to country flag mapping
  const propertyFlags = {
    'Salvador': '🇧🇷', // Brazil
    'Rio': '🇧🇷', // Brazil
    'Tel Aviv': '🇮🇱', // Israel
    'Haifa': '🇮🇱', // Israel
    'Jerusalem': '🇮🇱', // Israel
    'Venice': '🇮🇹', // Italy
    'Milan': '🇮🇹', // Italy
    'Rome': '🇮🇹', // Italy
    'Frankfurt': '🇩🇪', // Germany
    'Munich': '🇩🇪', // Germany
    'Berlin': '🇩🇪', // Germany
    'Shenzhen': '🇨🇳', // China
    'Beijing': '🇨🇳', // China
    'Shanghai': '🇨🇳', // China
    'Lyon': '🇫🇷', // France
    'Toulouse': '🇫🇷', // France
    'Paris': '🇫🇷', // France
    'Liverpool': '🇬🇧', // UK
    'Manchester': '🇬🇧', // UK
    'London': '🇬🇧', // UK
    'San Francisco': '🇺🇸', // USA
    'New York': '🇺🇸' // USA
  };

  // Top row properties (left to right)
  const topRow = [
    { name: 'START', type: 'corner', color: 'green', className: 'start' },
    { name: 'Salvador', type: 'property', flag: propertyFlags['Salvador'], price: '60$' },
    { name: 'Treasure', type: 'treasure', color: 'orange' },
    { name: 'Rio', type: 'property', flag: propertyFlags['Rio'], price: '60$' },
    { name: 'Income Tax', type: 'tax', color: 'white' },
    { name: 'TLV Airport', type: 'airport', color: 'gray', price: '200$' },
    { name: 'Tel Aviv', type: 'property', flag: propertyFlags['Tel Aviv'], price: '100$' },
    { name: 'Surprise', type: 'surprise', color: 'pink' },
    { name: 'Haifa', type: 'property', flag: propertyFlags['Haifa'], price: '100$' },
    { name: 'Jerusalem', type: 'property', flag: propertyFlags['Jerusalem'], price: '120$' },
    { name: 'In Prison / Just Visiting', type: 'corner', color: 'orange', className: 'prison' }
  ];

  // Right row properties (top to bottom)
  const rightRow = [
    { name: 'Venice', type: 'property', flag: propertyFlags['Venice'], price: '140$' },
    { name: 'Electric Company', type: 'utility', utilityType: 'electric', color: 'lightblue', price: '150$' },
    { name: 'Milan', type: 'property', flag: propertyFlags['Milan'], price: '140$' },
    { name: 'Rome', type: 'property', flag: propertyFlags['Rome'], price: '160$' },
    { name: 'MUC Airport', type: 'airport', color: 'gray', price: '200$' },
    { name: 'Frankfurt', type: 'property', flag: propertyFlags['Frankfurt'], price: '180$' },
    { name: 'Treasure', type: 'treasure', color: 'orange' },
    { name: 'Munich', type: 'property', flag: propertyFlags['Munich'], price: '180$' },
    { name: 'Berlin', type: 'property', flag: propertyFlags['Berlin'], price: '200$' }
  ];

  // Bottom row properties (right to left)
  const bottomRow = [
    { name: 'Shenzhen', type: 'property', flag: propertyFlags['Shenzhen'], price: '220$' },
    { name: 'Surprise', type: 'surprise', color: 'pink' },
    { name: 'Beijing', type: 'property', flag: propertyFlags['Beijing'], price: '220$' },
    { name: 'Shanghai', type: 'property', flag: propertyFlags['Shanghai'], price: '240$' },
    { name: 'CDG Airport', type: 'airport', color: 'gray', price: '200$' },
    { name: 'Lyon', type: 'property', flag: propertyFlags['Lyon'], price: '260$' },
    { name: 'Toulouse', type: 'property', flag: propertyFlags['Toulouse'], price: '260$' },
    { name: 'Water Company', type: 'utility', color: 'lightblue', price: '150$' },
    { name: 'Paris', type: 'property', flag: propertyFlags['Paris'], price: '280$' }
  ];

  // Left row properties (bottom to top)
  const leftRow = [
    { name: 'Liverpool', type: 'property', flag: propertyFlags['Liverpool'], price: '300$' },
    { name: 'Manchester', type: 'property', flag: propertyFlags['Manchester'], price: '300$' },
    { name: 'Treasure', type: 'treasure', color: 'orange' },
    { name: 'London', type: 'property', flag: propertyFlags['London'], price: '320$' },
    { name: 'JFK Airport', type: 'airport', color: 'gray', price: '200$' },
    { name: 'Surprise', type: 'surprise', color: 'pink' },
    { name: 'San Francisco', type: 'property', flag: propertyFlags['San Francisco'], price: '350$' },
    { name: 'Luxury Tax', type: 'tax', color: 'white' },
    { name: 'New York', type: 'property', flag: propertyFlags['New York'], price: '400$' }
  ];

  // Corner spaces
  const corners = [
    { name: 'Vacation', type: 'corner', color: 'green', className: 'vacation' },
    { name: 'Go to prison', type: 'corner', color: 'red', className: 'jail' }
  ];

  const renderSpace = (space, index, position) => {
    const isCorner = space.type === 'corner';
    const spaceClasses = `space ${space.type} ${position} ${isCorner ? 'corner' : ''} ${space.className || ''}`;
    
    return (
      <div key={`${position}-${index}`} className={spaceClasses}>
        <div className="space-content">
          {space.type === 'property' && (
            <>
              <div className="property-flag">{space.flag}</div>
              {space.price && <div className="space-price">{space.price}</div>}
            </>
          )}
          {space.type === 'airport' && space.price && <div className="space-price">{space.price}</div>}
          {space.type === 'utility' && space.price && <div className="space-price">{space.price}</div>}
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
        </div>
      </div>
    );
  };

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

      {/* Bottom Row - 11 spaces (vacation corner + 9 spaces + jail corner) */}
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
        {!gameStarted ? (
          <div className="game-info">
            <div className="dice-area">
              <div className="dice">🎲</div>
              <div className="dice">🎲</div>
            </div>
            <div className="game-title">MONOPOLY</div>
            <button className="start-game-btn" onClick={onStartGame}>
              Start Game
            </button>
          </div>
        ) : (
          <div className="game-center">
            {/* Dice */}
            <div className="dice-area">
              <div className={`dice ${isRolling ? 'rolling' : ''}`}>
                {dice.dice1}
              </div>
              <div className={`dice ${isRolling ? 'rolling' : ''}`}>
                {dice.dice2}
              </div>
            </div>

            {/* Action Button */}
            <button 
              className="action-btn"
              onClick={isRolling ? undefined : rollDice}
              disabled={isRolling}
            >
              {isRolling ? 'Rolling...' : 'End turn'}
            </button>

            {/* Game Log */}
            <div className="game-log">
              {gameLog.map((entry, index) => (
                <div key={entry.id || index} className={`log-entry ${entry.type}`}>
                  {entry.type === 'join' && <span className="log-dot">🟢</span>}
                  {entry.type === 'info' && <span className="log-dot">🟡</span>}
                  {entry.player && <span className="log-player">{entry.player}</span>}
                  <span className="log-message">{entry.message}</span>
                </div>
              ))}
            </div>

            {/* Current Player Info */}
            <div className="current-player">
              <span className="player-indicator">🟢</span>
              <span>{currentPlayer} got a Pardon card from the surprises stack</span>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              <div className="modal-text">{modalContent}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default MonopolyBoard;