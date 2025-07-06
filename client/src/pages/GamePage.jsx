import React from 'react';
import { useParams } from 'react-router-dom';

const GamePage = () => {
  const { roomId } = useParams();

  return (
    <div className="min-h-screen bg-[#1e1332] text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Monopoly Game</h1>
      <p className="text-xl mb-8">Room ID: {roomId}</p>
      <div className="bg-[#32294a] p-8 rounded-lg shadow-lg">
        <p className="text-lg text-center">Game starting soon...</p>
        <p className="text-sm text-purple-400 mt-4 text-center">
          The game board and mechanics will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default GamePage;
