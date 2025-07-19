import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Lobby from '../components/lobby/Lobby';
import Modal from '../components/common/Modal';
import { FaTimes } from 'react-icons/fa';

const HomePage = ({ onLoginSuccess, onCreatePrivateGame, onJoinGame }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logoutUser } = useUser();

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logoutUser();
    setShowLogoutConfirm(false);
  };

  return (
    <div className="relative min-h-screen bg-[#1e1332] text-white font-sans overflow-hidden">
      <Header
        onLoginSuccess={onLoginSuccess}
        onLogoutClick={handleLogoutClick}
      />

      <main className="min-h-screen flex flex-col justify-center items-center px-4">
        <Lobby
          onCreatePrivateGame={onCreatePrivateGame}
          onJoinGame={onJoinGame}
        />
      </main>

      <Footer />

      {/* The Logout Modal now lives at the page level */}
      <Modal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)}>
        <div className="text-center text-gray-900">
          <h3 className="text-2xl font-bold mb-3 mt-0">Sign Out</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Are you sure you want to sign out?<br />You'll need to log in again to access your account.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowLogoutConfirm(false)}
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
      </Modal>
    </div>
  );
};

export default HomePage;
