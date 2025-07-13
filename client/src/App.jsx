import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useUser } from './contexts/UserContext';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import GamePage from './pages/GamePage';

const socket = io('http://localhost:4000');

function App() {
  const [gameState, setGameState] = useState('lobby'); 
  const [room, setRoom] = useState(null);
  const { user, loginUser, logoutUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('gameCreated', (gameRoom) => {
      setRoom(gameRoom);
      setGameState('in-game');
      // Navigate to the game page with the room ID
      navigate(`/game/${gameRoom.id}`);
    });

    return () => {
      socket.off('gameCreated');
    };
  }, [navigate]);

  const handleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    loginUser({
      name: decoded.name,
      picture: decoded.picture,
      email: decoded.email,
    });
  };

  const handleLogout = () => {
    logoutUser();
  };

  const handleCreatePrivateGame = (playerName) => {
    if (!playerName || !playerName.trim()) {
      alert('Please enter a name or log in to play.');
      return;
    }
    socket.emit('createPrivateGame', { playerName });
  };

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <HomePage
            onLoginSuccess={handleLoginSuccess}
            onCreatePrivateGame={handleCreatePrivateGame}
          />
        } 
      />
      <Route path="/profile" element={<ProfilePage onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/game/:roomId" element={<GamePage />} />
    </Routes>
  );
}

export default App;
