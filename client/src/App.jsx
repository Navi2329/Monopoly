// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import Lobby from './components/Lobby';

const socket = io('http://localhost:4000');

function App() {
  const [gameState, setGameState] = useState('lobby'); 
  const [room, setRoom] = useState(null);
  // User state: null for guests, an object for logged-in users.
  const [user, setUser] = useState(null);

  useEffect(() => {
    socket.on('gameCreated', (gameRoom) => {
      console.log('Game Created!', gameRoom);
      setRoom(gameRoom);
      setGameState('in-game');
    });

    return () => {
      socket.off('gameCreated');
    };
  }, []);

  // Decodes the token from Google and sets the user state.
  const handleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setUser({
      name: decoded.name,
      picture: decoded.picture,
    });
  };

  // Clears the user state to log them out.
  const handleLogout = () => {
    setUser(null);
  };

  // Sends the player's name to the server to create a game.
  const handleCreatePrivateGame = (playerName) => {
    if (!playerName || !playerName.trim()) {
      alert('Please enter a name or log in to play.');
      return;
    }
    socket.emit('createPrivateGame', { playerName });
  };

  // Render logic remains the same, but now we pass auth props to Lobby.
  return (
    <div>
      {gameState === 'lobby' && (
        <Lobby
          user={user}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          onCreatePrivateGame={handleCreatePrivateGame}
        />
      )}
      
      {gameState === 'in-game' && (
        <div className="text-white p-8 bg-[#1e1332] min-h-screen">
          <h2 className="text-4xl font-bold">Game Room: {room?.id}</h2>
          <p className="mt-4 text-xl">Players:</p>
          <ul className="list-disc list-inside mt-2 text-lg">
            {room?.players.map(p => <li key={p.id}>{p.name}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
