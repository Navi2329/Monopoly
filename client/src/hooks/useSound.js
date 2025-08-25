import { useEffect, useRef } from 'react';
import soundManager from '../utils/soundManager';
import SoundGenerator from '../utils/soundGenerator';

// Custom hook for sound integration
export const useSound = () => {
  const soundGeneratorRef = useRef(null);

  useEffect(() => {
    // Initialize sound manager
    soundManager.initialize();
    
    // Initialize sound generator as fallback
    soundGeneratorRef.current = new SoundGenerator();
    soundGeneratorRef.current.initialize();

    // Add a global click handler to resume audio context on first user interaction
    const handleFirstInteraction = async () => {
      const generator = soundGeneratorRef.current;
      if (generator && generator.audioContext && generator.audioContext.state === 'suspended') {
        try {
          await generator.audioContext.resume();
        } catch (error) {
          console.warn('Failed to resume AudioContext on interaction:', error);
        }
      }
      // Remove the listener after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      // Cleanup
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const playSound = async (soundKey, options = {}) => {
    try {
      // Try to play from sound manager first
      await soundManager.play(soundKey, options);
    } catch (error) {
      // Fallback to sound generator for all sounds
      const generator = soundGeneratorRef.current;
      if (!generator || !generator.audioContext) {
        if (generator) {
          await generator.initialize();
        } else {
          return;
        }
      }

      // Resume audio context if needed (user interaction requirement)
      if (generator.audioContext && generator.audioContext.state === 'suspended') {
        try {
          await generator.audioContext.resume();
        } catch (resumeError) {
          console.warn('Could not resume audio context:', resumeError);
          return;
        }
      }

      switch (soundKey) {
        case 'diceRoll':
        case 'diceShake':
          generator.playDiceRoll();
          break;
        case 'buyProperty':
        case 'sellProperty':
          generator.playBuyProperty();
          break;
        case 'buildHouse':
          generator.playBuildHouse();
          break;
        case 'buildHotel':
          generator.playBuildHotel();
          break;
        case 'destroyBuilding':
          generator.playDestroyBuilding();
          break;
        case 'payMoney':
          generator.playPayMoney();
          break;
        case 'receiveMoney':
          generator.playReceiveMoney();
          break;
        case 'payTax':
          generator.playPayTax();
          break;
        case 'treasureCard':
          generator.playTreasureCard();
          break;
        case 'surpriseCard':
          generator.playSurpriseCard();
          break;
        case 'goToJail':
          generator.playGoToJail();
          break;
        case 'passStart':
          generator.playPassStart();
          break;
        case 'playerJoin':
          generator.playPlayerJoin();
          break;
        case 'playerLeave':
          generator.playPlayerLeave();
          break;
        case 'chatMessage':
          generator.playChatMessage();
          break;
        case 'gameStart':
          generator.playGameStart();
          break;
        case 'gameEnd':
          generator.playGameEnd();
          break;
        case 'auctionStart':
          generator.playAuctionStart();
          break;
        case 'bid':
          generator.playBid();
          break;
        case 'auctionEnd':
          generator.playAuctionEnd();
          break;
        case 'tradeProposal':
          generator.playTradeProposal();
          break;
        case 'tradeAccepted':
          generator.playTradeAccepted();
          break;
        case 'tradeDeclined':
          generator.playTradeDeclined();
          break;
        case 'tradeCancelled':
          generator.playTradeCancelled();
          break;
        case 'success':
          generator.playSuccess();
          break;
        case 'error':
          generator.playError();
          break;
        case 'buttonClick':
          generator.playChatNotification();
          break;
        default:
          // Play a generic notification sound for unknown types
          console.log(`Unknown sound type: ${soundKey}, playing default`);
          generator.playChatNotification();
      }
    }
  };

  const setVolume = (volume) => {
    soundManager.setVolume(volume);
  };

  const setMuted = (muted) => {
    soundManager.setMuted(muted);
  };

  return {
    playSound,
    setVolume,
    setMuted,
    volume: soundManager.getVolume(),
    isMuted: soundManager.isMutedState()
  };
};

export default useSound;
