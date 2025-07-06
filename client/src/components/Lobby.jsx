// client/src/components/Lobby.jsx
import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { FaDice, FaUsers, FaKey, FaShoppingCart, FaVolumeUp, FaChevronDown } from 'react-icons/fa';

const Lobby = ({ user, onLoginSuccess, onLogout, onCreatePrivateGame }) => {
  const [guestName, setGuestName] = useState('');

  // A single handler for all "play" or "create game" buttons.
  const handleCreateClick = () => {
    const playerName = user ? user.name : guestName;
    onCreatePrivateGame(playerName);
  };
  
  // --- GUEST VIEW ---
  // This is shown if the user is NOT logged in. It matches the logged-in layout, but with Google login.
  if (!user) {
    return (
      <div className="relative min-h-screen bg-[#1e1332] text-white font-sans overflow-hidden">
      <header className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start">
        <button className="text-4xl text-purple-400 hover:text-purple-200 transition-colors w-16 h-16 flex items-center justify-center">
        <FaVolumeUp />
        </button>
        <div className="flex items-center gap-12 mt-2 mr-4">
        <button className="flex items-center gap-2 hover:text-purple-100 transition-colors">
          <FaShoppingCart className="text-2xl" />
          <span className="tracking-wide">Store</span>
        </button>
        <div className="flex items-center gap-2">
          <GoogleLogin onSuccess={onLoginSuccess} theme="outline" shape="pill" />
        </div>
        </div>
      </header>

      <main className="min-h-screen flex flex-col justify-center items-center px-4">
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
        
        <div className="h-1" />
        <div className="mt-24 mb-24 flex flex-col items-center">
          <p className="text-big text-purple-400 mb-24">Playing as</p>
          <div className="mb-24" />
          <div className="flex items-center">
          <div className="w-5" />
          <div className="h-5" />
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Enter your name"
            className="text-white text-center text-2xl p-4 rounded-lg border-2 border-purple-400 w-80 focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder-purple-200"
            style={{
            backgroundColor: '#32294a',
            minHeight: 42,
            minWidth: 240,
            boxShadow: '0 2px 16px #a78bfa44'
            }}
          />
          <button
            type="button"
            className="bg-gradient-to-r from-purple-300 to-purple-400 hover:from-purple-400 hover:to-purple-500 text-white font-bold rounded-lg px-4 py-2 text-lg shadow-md transition-colors flex items-center justify-center"
            onClick={() => {
            const names = [
              "LuckyLion", "DiceyDan", "VioletVixen", "BoardBoss", "TokenTiger",
              "CashCat", "RailroadRex", "ChanceChamp", "MisterMoney", "QueenQuirk"
            ];
            setGuestName(names[Math.floor(Math.random() * names.length)]);
            }}
            title="Generate random name"
          >
            <FaDice className="text-xl" />
          </button>
          </div>
        </div>

        <div className="flex-grow" style={{ minHeight: 32 }} />

        {/* Add gap below the textbox */}
        <div className="mb-2" />

        <button
          onClick={handleCreateClick}
          className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold rounded-[2rem] transition-colors shadow-lg shadow-purple-900/50 tracking-wide mb-2 px-12 py-5 text-3xl"
          style={{ fontSize: '1.8rem', minWidth: 205, minHeight: 80 }}
        >
          » Play
        </button>
        </div>
      </main>

      <footer className="absolute bottom-20 left-0 right-0 flex justify-center items-center gap-8">
        <button className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold rounded-[2rem] transition-colors shadow-lg shadow-purple-900/50 tracking-wide mb-2 px-8 py-2 text-lg" style={{ minHeight: 40, minWidth: 120 }}>
        All Rooms
        </button>
        <button
        onClick={handleCreateClick}
        className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold rounded-[2rem] transition-colors shadow-lg shadow-purple-900/50 tracking-wide mb-2 px-8 py-2 text-lg"
        style={{ minHeight: 40, minWidth: 180 }}
        >
        Create a private game
        </button>
      </footer>
      </div>
    );
  }

  // --- LOGGED-IN VIEW ---
  // This uses YOUR exact code, but with dynamic user data.
  return (
    <div className="relative min-h-screen bg-[#1e1332] text-white font-sans overflow-hidden">
      <header className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start">
        <button className="text-4xl text-purple-400 hover:text-purple-200 transition-colors w-16 h-16 flex items-center justify-center">
          <FaVolumeUp />
        </button>
        <div className="flex items-center gap-12 mt-2 mr-4">
          <button className="flex items-center gap-2 hover:text-purple-100 transition-colors">
            <span className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center">
              <FaUsers className="text-xl text-white" />
            </span>
            <span className="tracking-wide ml-2">0 friends online</span>
          </button>
          <button className="flex items-center gap-2 hover:text-purple-100 transition-colors">
            <FaShoppingCart className="text-2xl" />
            <span className="tracking-wide">Store</span>
          </button>
          {/* DYNAMIC: User account info and logout button */}
          <div className="flex items-center gap-2 text-white">
            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
            <span className="font-semibold">{user.name}</span>
            <button onClick={onLogout} className="bg-red-600/80 hover:bg-red-600 p-2 rounded-full">
              <FaChevronDown />
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-screen flex flex-col justify-center items-center px-4">
        <div className="flex flex-col items-center text-center">
          <FaDice className="text-8xl mb-4 text-purple-400" />
          <h1
            className="font-bold tracking-widest mb-2"
            style={{ fontSize: '8vw', letterSpacing: '0.2em', lineHeight: 1, textShadow: '0 4px 32px #a78bfa, 0 2px 0 #fff, 0 8px 24px #0008', color: '#fff', WebkitTextStroke: '2px #a78bfa', textTransform: 'uppercase' }}
          >
            MONOPOLY
          </h1>

          <div className="mt-8 mb-8">
            <p className="text-sm text-purple-400">Playing as</p>
            {/* DYNAMIC: User avatar and name */}
            <div className="flex items-center gap-3 mt-2">
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
              <span className="font-semibold text-2xl tracking-wide">{user.name}</span>
            </div>
          </div>

          <div className="flex-grow" style={{ minHeight: 32 }} />

          <button
            onClick={handleCreateClick}
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold rounded-[2rem] transition-colors shadow-lg shadow-purple-900/50 tracking-wide mb-2 px-12 py-5 text-3xl"
            style={{ fontSize: '1.8rem', minWidth: 205, minHeight: 80 }}
          >
            » Play
          </button>
        </div>
      </main>

      <footer className="absolute bottom-20 left-0 right-0 flex justify-center items-center gap-8">
        <button className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold rounded-[2rem] transition-colors shadow-lg shadow-purple-900/50 tracking-wide mb-2 px-8 py-2 text-lg" style={{ minHeight: 40, minWidth: 120 }}>
          All Rooms
        </button>
        <button
          onClick={handleCreateClick}
          className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold rounded-[2rem] transition-colors shadow-lg shadow-purple-900/50 tracking-wide mb-2 px-8 py-2 text-lg"
          style={{ minHeight: 40, minWidth: 180 }}
        >
          Create a private game
        </button>
      </footer>
    </div>
  );
};

export default Lobby;
