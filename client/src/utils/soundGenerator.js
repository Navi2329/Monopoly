// Sound Generator Utility for creating placeholder sounds
// This creates simple synthetic sounds for demonstration

class SoundGenerator {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume context if suspended (required for user interaction policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.initialized = true;
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  // Create a simple tone
  createTone(frequency, duration, type = 'sine') {
    if (!this.audioContext) return null;

    // Try to resume audio context immediately if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(error => {
        console.warn('Failed to resume AudioContext:', error);
      });
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    // Envelope for smooth sound
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    return { oscillator, gainNode, duration };
  }

  // Play a tone
  playTone(frequency, duration, type = 'sine') {
    const tone = this.createTone(frequency, duration, type);
    if (!tone) return;

    // Try to resume audio context if suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(error => {
        console.warn('Failed to resume audio context:', error);
      });
    }

    tone.oscillator.start();
    tone.oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Create dice roll sound
  playDiceRoll() {
    const frequencies = [200, 300, 150, 250, 180];
    frequencies.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.1, 'square'), index * 50);
    });
  }

  // Create coin sound for money transactions
  playCoinSound() {
    this.playTone(800, 0.1, 'sine');
    setTimeout(() => this.playTone(1000, 0.15, 'sine'), 100);
  }

  // Create building sound
  playBuildingSound() {
    const frequencies = [400, 500, 600];
    frequencies.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.2, 'triangle'), index * 100);
    });
  }

  // Create chat notification
  playChatNotification() {
    this.playTone(600, 0.1, 'sine');
    setTimeout(() => this.playTone(800, 0.1, 'sine'), 150);
  }

  // Create success sound
  playSuccess() {
    const melody = [523, 659, 784]; // C, E, G
    melody.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine'), index * 150);
    });
  }

  // Create error sound
  playError() {
    this.playTone(200, 0.3, 'sawtooth');
  }

  // Game-specific sounds
  playGameStart() {
    const melody = [440, 554, 659, 880]; // A, C#, E, A
    melody.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine'), index * 200);
    });
  }

  playGameEnd() {
    const melody = [880, 659, 554, 440]; // A, E, C#, A (descending)
    melody.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.4, 'sine'), index * 250);
    });
  }

  playBuyProperty() {
    this.playCoinSound();
    setTimeout(() => this.playSuccess(), 200);
  }

  playBuildHouse() {
    this.playBuildingSound();
  }

  playBuildHotel() {
    // Bigger building sound
    const frequencies = [300, 400, 500, 600, 700];
    frequencies.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.2, 'triangle'), index * 100);
    });
  }

  playDestroyBuilding() {
    // Reverse building sound
    const frequencies = [700, 600, 500, 400, 300];
    frequencies.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sawtooth'), index * 80);
    });
  }

  playPayMoney() {
    this.playTone(400, 0.2, 'sine');
    setTimeout(() => this.playTone(300, 0.2, 'sine'), 150);
  }

  playReceiveMoney() {
    this.playTone(600, 0.2, 'sine');
    setTimeout(() => this.playTone(800, 0.2, 'sine'), 150);
  }

  playPayTax() {
    this.playTone(200, 0.3, 'triangle');
    setTimeout(() => this.playTone(150, 0.2, 'triangle'), 200);
  }

  playTreasureCard() {
    const melody = [523, 659, 784, 1047]; // C, E, G, C
    melody.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine'), index * 100);
    });
  }

  playSurpriseCard() {
    const melody = [1047, 784, 659, 523]; // C, G, E, C (descending)
    melody.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.15, 'triangle'), index * 100);
    });
  }

  playGoToJail() {
    this.playTone(150, 0.5, 'sawtooth');
    setTimeout(() => this.playTone(100, 0.3, 'sawtooth'), 300);
  }

  playPassStart() {
    const melody = [440, 523, 659, 880]; // A, C, E, A
    melody.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine'), index * 100);
    });
  }

  playPlayerJoin() {
    this.playTone(440, 0.2, 'sine');
    setTimeout(() => this.playTone(554, 0.2, 'sine'), 150);
    setTimeout(() => this.playTone(659, 0.2, 'sine'), 300);
  }

  playPlayerLeave() {
    this.playTone(659, 0.2, 'sine');
    setTimeout(() => this.playTone(554, 0.2, 'sine'), 150);
    setTimeout(() => this.playTone(440, 0.2, 'sine'), 300);
  }

  // Auction sounds
  playAuctionStart() {
    const melody = [330, 440, 554, 659]; // Ascending auction call
    melody.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.2, 'square'), index * 100);
    });
  }

  playBid() {
    this.playTone(880, 0.1, 'square');
    setTimeout(() => this.playTone(1108, 0.1, 'square'), 80);
  }

  playAuctionEnd() {
    const melody = [659, 554, 440, 330]; // Descending end
    melody.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.3, 'square'), index * 150);
    });
  }

  // Trade sounds
  playTradeProposal() {
    this.playTone(523, 0.2, 'sine');
    setTimeout(() => this.playTone(659, 0.2, 'sine'), 200);
  }

  playTradeAccepted() {
    const melody = [523, 659, 784]; // Success melody
    melody.forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine'), index * 150);
    });
  }

  playTradeDeclined() {
    this.playTone(400, 0.2, 'triangle');
    setTimeout(() => this.playTone(300, 0.2, 'triangle'), 150);
  }

  playTradeCancelled() {
    this.playTone(300, 0.3, 'sawtooth');
  }

  // Chat sound
  playChatMessage() {
    this.playChatNotification();
  }
}

export default SoundGenerator;
