import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Animation for money coming into the cash (gaining money)
const floatIn = keyframes`
  0% {
    transform: translateX(-50px) translateY(-20px) scale(0.8) rotate(-10deg);
    opacity: 0;
  }
  30% {
    opacity: 1;
    transform: translateX(-30px) translateY(-10px) scale(1) rotate(0deg);
  }
  100% {
    transform: translateX(0) translateY(0) scale(1.2) rotate(5deg);
    opacity: 0;
  }
`;

// Animation for money going out of the cash (losing money)
const floatOut = keyframes`
  0% {
    transform: translateX(0) translateY(0) scale(1.2) rotate(0deg);
    opacity: 1;
  }
  30% {
    opacity: 1;
    transform: translateX(30px) translateY(-15px) scale(1) rotate(-5deg);
  }
  100% {
    transform: translateX(60px) translateY(-40px) scale(0.6) rotate(-15deg);
    opacity: 0;
  }
`;

// Subtle bounce for emphasis
const bounce = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
`;

const CashAnimationContainer = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  zIndex: 10,
  overflow: 'visible',
});

const AnimatedCash = styled(Box)(({ isGain, delay = 0 }) => ({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `${isGain ? floatIn : floatOut} 2.5s ease-out forwards`,
  animationDelay: `${delay}s`,
  fontSize: '16px',
  fontWeight: 'bold',
  color: isGain ? '#22c55e' : '#ef4444',
  textShadow: isGain 
    ? '0 0 8px rgba(34, 197, 94, 0.6), 1px 1px 3px rgba(0,0,0,0.8)' 
    : '0 0 8px rgba(239, 68, 68, 0.6), 1px 1px 3px rgba(0,0,0,0.8)',
  backgroundColor: isGain 
    ? 'rgba(34, 197, 94, 0.15)' 
    : 'rgba(239, 68, 68, 0.15)',
  border: isGain 
    ? '2px solid rgba(34, 197, 94, 0.4)' 
    : '2px solid rgba(239, 68, 68, 0.4)',
  borderRadius: '12px',
  padding: '4px 8px',
  minWidth: '60px',
  backdropFilter: 'blur(4px)',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: '-1px',
    background: isGain 
      ? 'linear-gradient(45deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.1))' 
      : 'linear-gradient(45deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.1))',
    borderRadius: '12px',
    zIndex: -1,
  }
}));

const CashAnimation = ({ playerId, amount, isVisible, onAnimationEnd }) => {
  const [animations, setAnimations] = useState([]);

  useEffect(() => {
    if (isVisible && amount !== 0) {
      const newAnimation = {
        id: Date.now() + Math.random(),
        amount: Math.abs(amount),
        isGain: amount > 0,
        // Position the animation to start from the cash display area
        top: '50%',
        left: '50%',
      };

      setAnimations(prev => [...prev, newAnimation]);

      // Remove animation after it completes
      const timer = setTimeout(() => {
        setAnimations(prev => prev.filter(anim => anim.id !== newAnimation.id));
        if (onAnimationEnd) {
          onAnimationEnd();
        }
      }, 2500); // Match animation duration

      return () => clearTimeout(timer);
    }
  }, [isVisible, amount, onAnimationEnd]);

  if (!isVisible || animations.length === 0) return null;

  return (
    <CashAnimationContainer>
      {animations.map((animation) => (
        <AnimatedCash
          key={animation.id}
          isGain={animation.isGain}
          sx={{
            top: animation.top,
            left: animation.left,
            transform: 'translate(-50%, -50%)', // Center the animation on the cash display
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'inherit',
              fontWeight: 'bold',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            {animation.isGain ? '+' : '-'}${animation.amount.toLocaleString()}
          </Typography>
        </AnimatedCash>
      ))}
    </CashAnimationContainer>
  );
};

// Hook to manage cash animations
export const useCashAnimation = () => {
  const [animations, setAnimations] = useState({});

  const triggerCashAnimation = (playerId, amount) => {
    if (amount === 0) return;
    
    setAnimations(prev => ({
      ...prev,
      [playerId]: {
        amount,
        isVisible: true,
        timestamp: Date.now(),
      }
    }));

    // Auto-hide after a short delay
    setTimeout(() => {
      setAnimations(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          isVisible: false,
        }
      }));
    }, 100);
  };

  const clearAnimation = (playerId) => {
    setAnimations(prev => {
      const newAnimations = { ...prev };
      delete newAnimations[playerId];
      return newAnimations;
    });
  };

  return {
    animations,
    triggerCashAnimation,
    clearAnimation,
  };
};

export default CashAnimation;
