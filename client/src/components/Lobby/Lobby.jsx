import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { FaDice } from 'react-icons/fa';
import RoundedButton from '../common/RoundedButton';

const Lobby = ({ onCreatePrivateGame }) => {
  const [guestName, setGuestName] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const { user } = useUser();

  const handleCreateClick = () => {
    const playerName = user ? user.name : guestName;
    onCreatePrivateGame(playerName);
  };

  return (
    <div className="flex flex-col items-center text-center">
      <FaDice className="text-8xl mb-4 text-purple-400" />
      <h1
        className="font-bold tracking-widest mb-2"
        style={{
          fontSize: '8vw',
          letterSpacing: '0.2em',
          lineHeight: 1,
          textShadow: '0 4px 32px #a78bfa, 0 2px 0 #fff, 0 8px 24px #0008',
          color: '#fff',
          WebkitTextStroke: '2px #a78bfa',
          textTransform: 'uppercase'
        }}
      >
        MONOPOLY
      </h1>

      <div className="h-6" />
      <div className="mt-24 mb-24 flex flex-col items-center">
        <span className="text-lg text-purple-400">Playing as</span>
        <div className="h-8"></div>
        {user ? (
          <div className="flex items-center w-full justify-center gap-3">
            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
            <span className="font-semibold text-2xl tracking-wide">{user.name}</span>
          </div>
        ) : (
          <div className="flex items-center w-full justify-center gap-2">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your name"
              className="text-white text-center text-2xl p-4 rounded-lg border-2 border-purple-400 w-80 focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder-purple-200"
              style={{ backgroundColor: '#32294a', minHeight: 42, minWidth: 240, boxShadow: '0 2px 16px #a78bfa44' }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            {inputFocused && (
              <button
                type="button"
                className="bg-gradient-to-r from-purple-300 to-purple-400 hover:from-purple-400 hover:to-purple-500 text-white font-bold rounded-lg px-4 py-2 text-lg shadow-md transition-colors flex items-center justify-center ml-2"
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  const names = ["LuckyLion", "DiceyDan", "VioletVixen", "BoardBoss", "TokenTiger", "CashCat", "RailroadRex", "ChanceChamp", "MisterMoney", "QueenQuirk"];
                  setGuestName(names[Math.floor(Math.random() * names.length)]);
                }}
                title="Generate random name"
              >
                <FaDice className="text-xl" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-grow" style={{ minHeight: 32 }} />

      <RoundedButton
        onClick={handleCreateClick}
        style={{ fontSize: '1.8rem', minWidth: 205, minHeight: 80, marginBottom: 0 }}
      >
        » Play
      </RoundedButton>
    </div>
  );
};

export default Lobby;
