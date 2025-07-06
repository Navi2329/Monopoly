import React from 'react';
import { useUser } from '../../contexts/UserContext';
import { FaVolumeUp, FaUsers, FaShoppingCart } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import ProfileDropdown from '../auth/ProfileDropdown';

const Header = ({ onLoginSuccess, onLogoutClick }) => {
  const { user } = useUser();
  
  // To retain logged-in status, ensure your authentication logic (in UserContext or similar)
  // checks for a persisted token (e.g., in localStorage or cookies) on app load,
  // and restores the user session if present.

  return (
    <header className="absolute top-5 left-0 right-5 p-5 flex justify-between items-start">
      <div className="flex items-center">
        <button className="text-4xl text-white hover:text-gray-200 transition-colors w-16 h-16 flex items-center justify-center">
          <FaVolumeUp />
        </button>
        <button
          className="mx-8 p-0 bg-transparent border-none cursor-pointer"
          onClick={() => window.location.assign('/')}
          aria-label="Go to Lobby"
          style={{ background: 'none' }}
        >
          <h1
            className="font-bold tracking-widest"
            style={{
              fontSize: '1vw',
              letterSpacing: '0.2em',
              lineHeight: 1,
              textShadow: '0 2px 12px #fff, 0 1px 0 #fff, 0 4px 12px #0008',
              color: '#fff',
              WebkitTextStroke: '1px #fff',
              textTransform: 'uppercase',
              margin: 0,
              padding: 0,
            }}
          >
            MONOPOLY
          </h1>
        </button>
      </div>
      {user ? (
        <div className="flex items-center gap-12 mt-2 mr-4">
          <button className="flex items-center gap-2 hover:text-gray-100 transition-colors cursor-pointer">
            <span className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center">
              <FaUsers className="text-xl text-white" />
            </span>
            <span className="tracking-wide ml-2">0 friends online</span>
          </button>
          <button className="flex items-center gap-2 hover:text-gray-100 transition-colors cursor-pointer">
            <FaShoppingCart className="text-2xl" />
            <span className="tracking-wide">Store</span>
          </button>
          <ProfileDropdown user={user} onLogoutClick={onLogoutClick} onLoginSuccess={onLoginSuccess} />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <GoogleLogin onSuccess={onLoginSuccess} theme="outline" shape="pill" />
        </div>
      )}
    </header>
  );
};

export default Header;
