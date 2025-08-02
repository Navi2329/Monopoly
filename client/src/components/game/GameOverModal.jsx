import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Modal, Card, CardContent } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Fireworks animation keyframes
const fireworks1 = keyframes`
  0% {
    transform: translate(0, 100vh) scale(0);
    opacity: 0;
  }
  15% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  30% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(0, 0) scale(1.5);
    opacity: 0;
  }
`;

const fireworks2 = keyframes`
  0% {
    transform: translate(100vw, 100vh) scale(0);
    opacity: 0;
  }
  20% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  40% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(0, 0) scale(1.5);
    opacity: 0;
  }
`;

const fireworks3 = keyframes`
  0% {
    transform: translate(-100vw, 100vh) scale(0);
    opacity: 0;
  }
  25% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(0, 0) scale(1.5);
    opacity: 0;
  }
`;

const sparkle = keyframes`
  0%, 100% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1) rotate(180deg);
    opacity: 1;
  }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
`;

const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 215, 0, 0.1);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.5), 0 0 90px rgba(255, 215, 0, 0.3);
  }
`;

const StyledModal = styled(Modal)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(5px)',
  zIndex: 1300, // Ensure modal is below fireworks
});

const GameOverCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1e1b2e 0%, #2a1f3d 50%, #1e1b2e 100%)',
  border: '2px solid #8b5cf6',
  borderRadius: '20px',
  color: 'white',
  maxWidth: '500px',
  width: '90%',
  position: 'relative',
  overflow: 'visible',
  animation: `${bounce} 2s ease-in-out`,
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: '-2px',
    background: 'linear-gradient(45deg, #8b5cf6, #a855f7, #8b5cf6)',
    borderRadius: '22px',
    zIndex: -1,
    animation: `${glow} 3s ease-in-out infinite`,
  }
}));

const DiceIcon = styled(Box)({
  position: 'absolute',
  fontSize: '60px',
  animation: `${sparkle} 2s ease-in-out infinite`,
  '&:nth-of-type(1)': {
    top: '-30px',
    left: '20px',
    animationDelay: '0s',
  },
  '&:nth-of-type(2)': {
    top: '-20px',
    right: '30px',
    animationDelay: '0.5s',
  },
});

const FireworkContainer = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  pointerEvents: 'none',
  zIndex: 1400, // Above the modal (MUI modal has zIndex 1300)
});

const Firework = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'animationType'
})(({ delay = 0, animationType = 'fireworks1' }) => ({
  position: 'absolute',
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, #ffd700 0%, #ff6b35 50%, #f7931e 100%)',
  animation: `${animationType === 'fireworks1' ? fireworks1 : animationType === 'fireworks2' ? fireworks2 : fireworks3} 3s ease-out infinite`,
  animationDelay: `${delay}s`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '200px',
    height: '200px',
    background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '50px',
    height: '50px',
    background: 'radial-gradient(circle, #fff 0%, transparent 70%)',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
  }
}));

const WinnerAvatar = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'playerColor'
})(({ playerColor }) => ({
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  backgroundColor: playerColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '32px',
  fontWeight: 'bold',
  color: 'white',
  margin: '0 auto 20px',
  border: '4px solid #ffd700',
  animation: `${glow} 2s ease-in-out infinite`,
  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
}));

const GameOverModal = ({ isOpen, winner, onPlayAgain, onBackToLobby }) => {
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowFireworks(true);
      // Stop fireworks after 10 seconds
      const timer = setTimeout(() => {
        setShowFireworks(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !winner) return null;

  return (
    <>
      {/* Fireworks */}
      {showFireworks && (
        <FireworkContainer>
          <Firework 
            delay={0} 
            animationType="fireworks1"
            sx={{ top: '10%', left: '5%' }}
          />
          <Firework 
            delay={1} 
            animationType="fireworks2"
            sx={{ top: '15%', right: '5%' }}
          />
        </FireworkContainer>
      )}

      <StyledModal open={isOpen}>
        <GameOverCard>
          {/* Decorative dice icons */}
          <DiceIcon>🎲</DiceIcon>
          <DiceIcon>🎲</DiceIcon>

          <CardContent sx={{ textAlign: 'center', p: 4, position: 'relative' }}>
            {/* Game Over Title */}
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 2,
                background: 'linear-gradient(45deg, #ffd700, #ff6b35)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                fontSize: { xs: '2rem', sm: '3rem' }
              }}
            >
              Game over!
            </Typography>

            {/* Winner Section */}
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                mb: 3,
                fontSize: '1.2rem'
              }}
            >
              and the winner is...
            </Typography>

            <WinnerAvatar playerColor={winner.color}>
              {winner.name.charAt(0).toUpperCase()}
            </WinnerAvatar>

            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 3,
                color: '#ffd700',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}
            >
              {winner.name.toUpperCase()}
            </Typography>

            {/* Game Statistics */}
            <Box sx={{ 
              background: 'rgba(0, 0, 0, 0.3)', 
              borderRadius: '12px', 
              p: 2, 
              mb: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 1, fontSize: '1rem' }}>
                Game statistics
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                  Final Cash:
                </Typography>
                <Typography sx={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  ${winner.money?.toLocaleString() || '0'}
                </Typography>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={onPlayAgain}
                sx={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  px: 3,
                  py: 1.5,
                  borderRadius: '25px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
                startIcon={<span>🔄</span>}
              >
                Another game
              </Button>
              
              <Button
                variant="outlined"
                onClick={onBackToLobby}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  px: 3,
                  py: 1.5,
                  borderRadius: '25px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
                startIcon={<span>🏠</span>}
              >
                Back to lobby
              </Button>
            </Box>
          </CardContent>
        </GameOverCard>
      </StyledModal>
    </>
  );
};

export default GameOverModal;
