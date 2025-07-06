import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { FaStar, FaTrophy, FaEdit, FaGamepad, FaCalendar, FaUsers, FaHome, FaVolumeUp, FaShoppingCart } from 'react-icons/fa';
import ProfileHeader from '../components/profile/ProfileHeader';
import Header from '../components/layout/Header';
import Modal from '../components/common/Modal';

const mockStats = [
  { icon: <FaGamepad className="text-purple-400" />, label: 'Played 127 games', value: '' },
  { icon: <FaTrophy className="text-yellow-400" />, label: 'Won 49 games', value: '' },
  { icon: <FaCalendar className="text-blue-400" />, label: 'Joined 1 year ago', value: '' },
  { icon: <FaUsers className="text-green-400" />, label: 'Has 6 friends', value: '' },
];

const mockFriends = [
  { id: 1, name: 'Asap', avatar: 'https://i.pravatar.cc/40?u=asap', lastSeen: '36 minutes ago' },
  { id: 2, name: 'Arvind V Ramanan', avatar: 'https://i.pravatar.cc/40?u=arvind', lastSeen: '1 day ago' },
  { id: 3, name: 'Ob trice', avatar: 'https://i.pravatar.cc/40?u=obtrice', lastSeen: '1 day ago' },
  { id: 4, name: 'Val', avatar: 'https://i.pravatar.cc/40?u=val', lastSeen: '2 months ago' },
  { id: 5, name: 'hardcorejin', avatar: null, lastSeen: '4 months ago' },
  { id: 6, name: 'Hard Game 500$', avatar: 'https://i.pravatar.cc/40?u=hardgame', lastSeen: '5 months ago' },
];

const mockMatchHistory = Array.from({ length: 45 }, (_, i) => {
  const dates = [
    'Jul 05, 22:34', 'Jul 05, 22:25', 'Jul 04, 22:30', 'Jun 29, 22:24', 'Jun 29, 22:02', 
    'Jun 29, 00:56', 'Jun 29, 00:52', 'Jun 28, 18:48', 'Jun 28, 15:23', 'Jun 27, 20:15',
    'Jun 27, 18:42', 'Jun 26, 21:30', 'Jun 26, 19:15', 'Jun 25, 22:45', 'Jun 25, 20:30'
  ];
  return {
    id: i,
    date: dates[i] || `Jun ${25 - Math.floor(i/2)}, ${20 + Math.floor(Math.random() * 4)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    players: Math.floor(Math.random() * 4) + 2,
    outcome: Math.random() > 0.6 ? 'win' : 'loss',
    points: Math.floor(Math.random() * 400) + 50,
    duration: `${Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
  };
});

const ProfilePage = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { user, updateUser, logoutUser } = useUser();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const gamesPerPage = 10;

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (onLoginSuccess) {
      console.log('✅ onLoginSuccess callback is available in ProfilePage');
    } else {
      console.warn('❌ onLoginSuccess callback is missing in ProfilePage');
    }
  }, [onLoginSuccess]);

  if (!user) {
    return null;
  }

  const handleProfileUpdate = (updatedData) => {
    console.log("Updating profile with:", updatedData);
    updateUser(updatedData);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logoutUser();
    setShowLogoutConfirm(false);
    navigate('/');
  };

  // Pagination logic
  const indexOfLastGame = currentPage * gamesPerPage;
  const indexOfFirstGame = indexOfLastGame - gamesPerPage;
  const currentGames = mockMatchHistory.slice(indexOfFirstGame, indexOfLastGame);
  const totalPages = Math.ceil(mockMatchHistory.length / gamesPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="bg-[#1e1332] min-h-screen text-white flex flex-col items-center">
      <Header 
        onLoginSuccess={onLoginSuccess} 
        onLogoutClick={handleLogoutClick} 
      />

        <div className="px-6 pb-8 w-full flex flex-col items-center">
        <div className="max-w-4xl w-full flex flex-col items-center" style={{ marginTop: '50px' }}>
          <div
            className="flex flex-col items-center justify-center mb-16"
            style={{ marginTop: '50px', paddingTop: '24px', paddingBottom: '24px' }}
          >
            <div className="flex flex-row items-center justify-center bg-purple-900/20 rounded-xl p-8 w-full gap-12">
              <ProfileHeader user={user} onUpdate={handleProfileUpdate} />
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-4 bg-purple-900/30 rounded-xl p-6">
                  <FaStar className="text-yellow-400 text-3xl" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">30</div>
                    <div className="text-sm text-gray-300 font-medium">Karma Points</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-purple-900/30 rounded-xl p-6">
                  <FaTrophy className="text-yellow-400 text-3xl" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">39%</div>
                    <div className="text-sm text-gray-300 font-medium">Winning Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-16 w-full flex flex-col items-center" style={{ marginTop: '20px' }}>
            <h1 className="font-bold mb-8 text-white tracking-wide" style={{ fontSize: '30px' }}>Statistics</h1>
            <div className="pl-0 w-full flex justify-center" style={{ marginTop: '20px' }}>
              <div className="grid grid-cols-1 gap-4 max-w-lg w-full">
                {mockStats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-4 p-5 bg-purple-900/30 rounded-xl hover:bg-purple-900/40 transition-colors">
                    <div className="text-2xl">{stat.icon}</div>
                    <span className="text-lg font-medium text-white">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30 mb-8"></div>
          <div className="mb-16 w-full flex flex-col items-center" style={{ marginTop: '30px' }}>
            <h2 className="text-5xl font-extrabold mb-8 text-white tracking-wide" style={{ fontSize: '30px' }}>Inventory</h2>
            <div className="pl-0 w-full flex justify-center" style={{ marginTop: '20px' }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl w-full">
                <div className="bg-purple-900/30 rounded-xl p-8 text-center hover:bg-purple-900/40 transition-colors">
                  <div className="w-20 h-20 mx-auto mb-4 bg-blue-500/30 rounded-full flex items-center justify-center">
                    <div className="w-10 h-10 bg-blue-400 rounded-full"></div>
                  </div>
                  <p className="text-sm text-gray-300 font-medium">7-8 Players</p>
                </div>
                <div className="bg-purple-900/30 rounded-xl p-8 text-center border-2 border-dashed border-gray-500 hover:border-gray-400 transition-colors cursor-pointer">
                  <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-5xl text-gray-400">+</span>
                  </div>
                  <p className="text-sm text-gray-300 font-medium">Get more items</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-16 w-full flex flex-col items-center">
            <div className="text-center w-full" style={{ marginTop: '30px' }}>
              <h2 className="text-4xl font-bold mb-4 text-white tracking-wide" style={{ marginTop: '20px',fontSize: '30px' }}>Last games</h2>
              <p className="text-gray-300 text-base mb-8 font-medium">
                Only last 80 games are shown. 
              </p>
              
              <div className="max-w-4xl mx-auto space-y-3" style={{ marginTop: '20px' }}>
                {currentGames.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-5 bg-purple-900/30 rounded-xl hover:bg-purple-900/40 transition-colors">
                    <div className="flex items-center gap-6">
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <span className="text-base font-medium text-white">{match.date}</span>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: match.players }).map((_, i) => (
                          <div key={i} className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">P</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-3xl">🔒</span>
                      </div>
                      {match.outcome === 'win' && (
                        <div className="text-yellow-400 text-xl">
                          <FaTrophy />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-base font-medium text-white">📊 {match.points}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-medium text-white">⏱️ {match.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center items-center gap-3 mt-8">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-lg bg-purple-900/50 hover:bg-purple-900/70 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  ‹
                </button>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors font-medium ${
                        currentPage === pageNumber
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-900/50 hover:bg-purple-900/70 text-gray-300'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                {totalPages > 5 && (
                  <>
                    <span className="text-gray-400 mx-2">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors font-medium ${
                        currentPage === totalPages
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-900/50 hover:bg-purple-900/70 text-gray-300'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-lg bg-purple-900/50 hover:bg-purple-900/70 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


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

export default ProfilePage;
