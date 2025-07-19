import React, { useState, useEffect, useRef } from 'react';
import socket from './socket';
import { jwtDecode } from 'jwt-decode';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useUser } from './contexts/UserContext';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import GamePage from './pages/GamePage';

// Remove all socket.on('connect') and socket.on('disconnect') debug logs

function App() {
  const [gameState, setGameState] = useState('lobby');
  const [room, setRoom] = useState(null);
  const { user, loginUser, logoutUser } = useUser();
  const navigate = useNavigate();
  const lastPlayerNameRef = useRef(null);

  useEffect(() => {
    socket.on('gameCreated', (gameRoom) => {
      setRoom(gameRoom);
      setGameState('in-game');
      // Navigate to the game page with the room ID and playerName from ref
      navigate(`/game/${gameRoom.id}`, { state: { playerName: lastPlayerNameRef.current || user?.name } });
    });

    socket.on('roomJoined', (gameRoom) => {
      setRoom(gameRoom);
      setGameState('in-game');
      // Use playerName from ref or user
      navigate(`/game/${gameRoom.id}`, { state: { playerName: lastPlayerNameRef.current || user?.name } });
    });

    socket.on('joinRoomError', ({ message }) => {
      alert(message || 'Failed to join room.');
    });

    return () => {
      socket.off('gameCreated');
      socket.off('roomJoined');
      socket.off('joinRoomError');
    };
  }, [navigate, room, user]);

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
    lastPlayerNameRef.current = playerName;
    socket.emit('createPrivateGame', { playerName });
  };

  const handleJoinGame = (playerName, roomId) => {
    if (!playerName || !playerName.trim() || !roomId || !roomId.trim()) {
      alert('Please enter a name and Room ID.');
      return;
    }
    lastPlayerNameRef.current = playerName;
    // Only navigate to the game page; joinRoom will be emitted after color selection
    navigate(`/game/${roomId}`, { state: { playerName } });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            onLoginSuccess={handleLoginSuccess}
            onCreatePrivateGame={handleCreatePrivateGame}
            onJoinGame={handleJoinGame}
          />
        }
      />
      <Route path="/profile" element={<ProfilePage onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/game/:roomId" element={<GamePage />} />
    </Routes>
  );
}

export default App;
