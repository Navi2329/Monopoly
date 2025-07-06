import React, { useState, useEffect, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { FaDice, FaUsers, FaKey, FaShoppingCart, FaVolumeUp, FaChevronDown, FaUser, FaCog, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import '../roundedbutton.css';

const RoundedButton = ({ children, onClick, style }) => {
  return (
    <button className="rounded-button" onClick={onClick} style={style}>
      {children}
    </button>
  );
};

const Lobby = ({ user, onLoginSuccess, onLogout, onCreatePrivateGame }) => {
  const [guestName, setGuestName] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const dropdownRef = useRef(null);
  const profileButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && 
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target) &&
          profileButtonRef.current &&
          !profileButtonRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowLogoutConfirm(false);
    }
  };

  const handleCreateClick = () => {
    const playerName = user ? user.name : guestName;
    onCreatePrivateGame(playerName);
  };

  const handleProfileClick = () => {
    console.log('Opening profile...');
    setProfileDropdownOpen(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setProfileDropdownOpen(false);
  };

  const confirmLogout = () => {
    onLogout();
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  
  if (!user) {
    return (
      <div className="relative min-h-screen bg-[#1e1332] text-white font-sans overflow-hidden">
        <header className="absolute top-5 left-0 right-5 p-5 flex justify-between items-start">
          <button className="text-4xl text-purple-400 hover:text-purple-200 transition-colors w-16 h-16 flex items-center justify-center">
            <FaVolumeUp />
          </button>
          <div className="flex items-center gap-2">
            <GoogleLogin onSuccess={onLoginSuccess} theme="outline" shape="pill" />
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

            <div className="h-6" />
            <div className="mt-24 mb-24 flex flex-col items-center">
              <span className="text-lg text-purple-400">Playing as</span>
              <div className="h-8"></div>
              <div className="flex items-center w-full justify-center gap-2">
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
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                />
                {inputFocused && (
                  <button
                    type="button"
                    className="bg-gradient-to-r from-purple-300 to-purple-400 hover:from-purple-400 hover:to-purple-500 text-white font-bold rounded-lg px-4 py-2 text-lg shadow-md transition-colors flex items-center justify-center ml-2"
                    onMouseDown={e => e.preventDefault()}
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
                )}
              </div>
            </div>

            <div className="flex-grow" style={{ minHeight: 32 }} />

            <RoundedButton
              onClick={handleCreateClick}
              style={{ fontSize: '1.8rem', minWidth: 205, minHeight: 80, marginBottom: 0 }}
            >
              » Play
            </RoundedButton>
          </div>
        </main>

        <footer className="absolute bottom-20 left-0 right-0 flex justify-center items-center gap-8">
          <RoundedButton
            style={{ minHeight: 40, minWidth: 120, marginBottom: 0 }}
          >
            All Rooms
          </RoundedButton>
          <RoundedButton
            onClick={handleCreateClick}
            style={{ minHeight: 40, minWidth: 180, marginBottom: 0 }}
          >
            Create a private game
          </RoundedButton>
        </footer>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#1e1332] text-white font-sans overflow-hidden">
      <header className="absolute top-5 left-0 right-5 p-5 flex justify-between items-start">
        <button className="text-4xl text-purple-400 hover:text-purple-200 transition-colors w-16 h-16 flex items-center justify-center">
          <FaVolumeUp />
        </button>
        <div className="flex items-center gap-12 mt-2 mr-4">
          <button className="flex items-center gap-2 hover:text-purple-100 transition-colors cursor-pointer">
            <span className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center">
              <FaUsers className="text-xl text-white" />
            </span>
            <span className="tracking-wide ml-2">0 friends online</span>
          </button>
          <button className="flex items-center gap-2 hover:text-purple-100 transition-colors cursor-pointer">
            <FaShoppingCart className="text-2xl" />
            <span className="tracking-wide">Store</span>
          </button>
          <div className="relative flex items-center gap-2 text-white">
            <button
              ref={profileButtonRef}
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex flex-col items-center focus:outline-none cursor-pointer"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full mx-auto" />
              <span className="font-semibold text-center w-full">{user.name}</span>
              <FaChevronDown className="mx-auto mt-1" />
            </button>

            {profileDropdownOpen && (
              <div
                ref={dropdownRef}
                className="absolute top-full right-0 mt-3 w-60 rounded-3xl shadow-2xl border border-purple-300/40 z-50 overflow-hidden transition-all duration-300 ease-out"
                style={{
                  background: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 50%, #4c1d95 100%)',
                }}
              >
                <div className="w-full flex flex-col items-center justify-center p-8 border-b border-white/20">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 mx-auto relative">
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-full h-full rounded-full border-4 border-green-400 shadow-lg shadow-green-400/30"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-purple-200"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 tracking-wider">{user.name.toUpperCase()}</h3>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <p className="text-purple-200 text-sm font-medium">30 Karma points</p>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="w-full flex flex-col p-4 space-y-1">
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex flex-col items-center gap-2 p-4 text-center hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <FaUser className="text-white text-lg" />
                    </div>
                    <span className="text-white font-medium">Your profile</span>
                  </button>
                
                  <div 
                    className="w-full h-px my-2"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.3) 80%, transparent 100%)'
                    }}
                  ></div>
                  
                  <button
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full flex flex-col items-center gap-2 p-4 text-center hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <FaCog className="text-white text-lg" />
                    </div>
                    <span className="text-white font-medium">Settings</span>
                  </button>
                  
                  <div 
                    className="w-full h-px my-2"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.3) 80%, transparent 100%)'
                    }}
                  ></div>
                  
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex flex-col items-center gap-2 p-4 text-center hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <FaSignOutAlt className="text-white text-lg" />
                    </div>
                    <span className="text-white font-medium">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={handleModalBackdropClick}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-200 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={cancelLogout}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <FaTimes className="text-2xl" />
            </button>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center mt-0">Sign Out</h3>
              <p className="text-gray-600 mb-8 leading-relaxed text-center mt-0">
                Are you sure you want to sign out?<br />You'll need to log in again to access your account.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

          <div className="h-6" />
          <div className="mt-24 mb-24 flex flex-col items-center">
            <span className="text-lg text-purple-400">Playing as</span>
            <div className="h-8"></div>
            <div className="flex items-center w-full justify-center gap-3">
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
              <span className="font-semibold text-2xl tracking-wide">{user.name}</span>
            </div>
          </div>

          <div className="flex-grow" style={{ minHeight: 32 }} />

          <RoundedButton
            onClick={handleCreateClick}
            style={{ fontSize: '1.8rem', minWidth: 205, minHeight: 80, marginBottom: 0 }}
          >
            » Play
          </RoundedButton>
        </div>
      </main>

      <footer className="absolute bottom-20 left-0 right-0 flex justify-center items-center gap-8">
        <RoundedButton
          style={{ minHeight: 40, minWidth: 120, marginBottom: 0 }}
        >
          All Rooms
        </RoundedButton>
        <RoundedButton
          onClick={handleCreateClick}
          style={{ minHeight: 40, minWidth: 180, marginBottom: 0 }}
        >
          Create a private game
        </RoundedButton>
      </footer>
    </div>
  );
};

export default Lobby;