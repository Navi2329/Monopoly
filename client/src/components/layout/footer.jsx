import React from 'react';
import { useUser } from '../../contexts/UserContext';
import RoundedButton from '../common/RoundedButton';

const Footer = ({ onCreatePrivateGame }) => {
  const { user } = useUser();
  
  const handleCreateClick = () => {
    const playerName = user ? user.name : document.querySelector('input[placeholder="Enter your name"]')?.value;
    onCreatePrivateGame(playerName);
  };
  
  return (
    <footer className="absolute bottom-20 left-0 right-0 flex justify-center items-center gap-8">
      <RoundedButton style={{ minHeight: 40, minWidth: 120, marginBottom: 0 }}>
        All Rooms
      </RoundedButton>
      <RoundedButton
        onClick={handleCreateClick}
        style={{ minHeight: 40, minWidth: 180, marginBottom: 0 }}
      >
        Create a private game
      </RoundedButton>
    </footer>
  );
};

export default Footer;
