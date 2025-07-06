import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';

const ProfileDropdown = ({ user, onLogoutClick, onLoginSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const profileButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen &&
          dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          profileButtonRef.current && !profileButtonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = () => {
    onLogoutClick();
    setIsOpen(false);
  }

  return (
    <div className="relative flex items-center gap-2 text-white">
      <button
        ref={profileButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col items-center focus:outline-none cursor-pointer bg-transparent border-0 p-0"
      >
        <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full mx-auto" />
        <span className="font-semibold text-center w-full text-sm">{user.name}</span>
        <FaChevronDown className="mx-auto mt-1 text-xs" />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-3 w-60 rounded-3xl shadow-2xl border border-purple-300/40 z-[9999] overflow-hidden transition-all duration-300 ease-out"
          style={{ background: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 50%, #4c1d95 100%)' }}
        >
          {/* User Info Section */}
          <div className="w-full flex flex-col items-center justify-center p-8 border-b border-white/20">
            <div className="w-24 h-24 mx-auto relative mb-6">
              <img src={user.picture} alt={user.name} className="w-full h-full rounded-full border-4 border-green-400 shadow-lg shadow-green-400/30" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-purple-200"></div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-wider">{user.name.toUpperCase()}</h3>
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <p className="text-purple-200 text-sm font-medium">30 Karma points</p>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Menu Items */}
          <div className="w-full flex flex-col p-4 space-y-1">
            <Link to="/profile" onClick={() => setIsOpen(false)} className="w-full">
              <button className="w-full flex flex-col items-center gap-2 p-4 text-center hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer">
                <FaUser className="text-white text-lg" />
                <span className="text-white font-medium">Your profile</span>
              </button>
            </Link>
            
            <div className="w-full h-px my-2" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.3) 80%, transparent 100%)' }}></div>
            
            <button onClick={() => setIsOpen(false)} className="w-full flex flex-col items-center gap-2 p-4 text-center hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer">
              <FaCog className="text-white text-lg" />
              <span className="text-white font-medium">Settings</span>
            </button>
            
            <div className="w-full h-px my-2" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0.3) 80%, transparent 100%)' }}></div>
            
            <button onClick={handleLogout} className="w-full flex flex-col items-center gap-2 p-4 text-center hover:bg-white/10 rounded-xl transition-all duration-200 cursor-pointer">
              <FaSignOutAlt className="text-white text-lg" />
              <span className="text-white font-medium">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
