// Sound Manager for Monopoly Game
class SoundManager {
  constructor() {
    this.sounds = {};
    this.volume = 0.5;
    this.isMuted = false;
    this.initialized = false;
    
    // Sound file mappings
    this.soundFiles = {
      // Dice and movement
      diceRoll: '/sounds/dice-roll.mp3',
      diceShake: '/sounds/dice-shake.mp3',
      playerMove: '/sounds/player-move.mp3',
      
      // Property transactions
      buyProperty: '/sounds/buy-property.mp3',
      sellProperty: '/sounds/sell-property.mp3',
      rentPaid: '/sounds/rent-paid.mp3',
      
      // Building actions
      buildHouse: '/sounds/build-house.mp3',
      buildHotel: '/sounds/build-hotel.mp3',
      destroyBuilding: '/sounds/destroy-building.mp3',
      
      // Cards and special actions
      treasureCard: '/sounds/treasure-card.mp3',
      surpriseCard: '/sounds/surprise-card.mp3',
      goToJail: '/sounds/go-to-jail.mp3',
      passStart: '/sounds/pass-start.mp3',
      
      // Game events
      gameStart: '/sounds/game-start.mp3',
      gameEnd: '/sounds/game-end.mp3',
      playerJoin: '/sounds/player-join.mp3',
      playerLeave: '/sounds/player-leave.mp3',
      
      // UI and communication
      chatMessage: '/sounds/chat-message.mp3',
      notification: '/sounds/notification.mp3',
      buttonClick: '/sounds/button-click.mp3',
      error: '/sounds/error.mp3',
      success: '/sounds/success.mp3',
      
      // Auctions and trades
      auctionStart: '/sounds/auction-start.mp3',
      auctionBid: '/sounds/auction-bid.mp3',
      auctionEnd: '/sounds/auction-end.mp3',
      tradeProposed: '/sounds/trade-proposed.mp3',
      tradeAccepted: '/sounds/trade-accepted.mp3',
      
      // Money actions
      payTax: '/sounds/pay-tax.mp3',
      receiveMoney: '/sounds/receive-money.mp3',
      payMoney: '/sounds/pay-money.mp3',
      
      // Turn management
      turnStart: '/sounds/turn-start.mp3',
      turnEnd: '/sounds/turn-end.mp3'
    };
  }

  // Initialize sound manager
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Preload critical sounds
      const criticalSounds = ['diceRoll', 'buyProperty', 'chatMessage', 'buttonClick'];
      await this.preloadSounds(criticalSounds);
      this.initialized = true;
      console.log('Sound Manager initialized successfully');
    } catch (error) {
      console.warn('Sound Manager initialization failed:', error);
    }
  }

  // Preload specific sounds
  async preloadSounds(soundKeys) {
    const promises = soundKeys.map(key => this.loadSound(key));
    await Promise.allSettled(promises);
  }

  // Load a single sound
  async loadSound(soundKey) {
    return new Promise((resolve, reject) => {
      if (this.sounds[soundKey]) {
        resolve(this.sounds[soundKey]);
        return;
      }

      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = this.volume;
      
      audio.addEventListener('canplaythrough', () => {
        this.sounds[soundKey] = audio;
        resolve(audio);
      }, { once: true });
      
      audio.addEventListener('error', (e) => {
        console.warn(`Failed to load sound: ${soundKey}`, e);
        // Reject the promise so the fallback system can take over
        reject(new Error(`Failed to load sound: ${soundKey}`));
      }, { once: true });
      
      audio.src = this.soundFiles[soundKey];
    });
  }

  // Play a sound
  async play(soundKey, options = {}) {
    if (this.isMuted) return;
    
    try {
      // Load sound if not already loaded
      if (!this.sounds[soundKey]) {
        await this.loadSound(soundKey);
      }
      
      const sound = this.sounds[soundKey];
      if (!sound || !sound.play) {
        throw new Error(`Sound not available: ${soundKey}`);
      }
      
      // Reset sound to beginning
      sound.currentTime = 0;
      
      // Apply options
      if (options.volume !== undefined) {
        sound.volume = Math.max(0, Math.min(1, options.volume * this.volume));
      } else {
        sound.volume = this.volume;
      }
      
      if (options.loop !== undefined) {
        sound.loop = options.loop;
      }
      
      // Play the sound
      const playPromise = sound.play();
      if (playPromise) {
        await playPromise;
      }
      
    } catch (error) {
      console.warn(`Failed to play sound: ${soundKey}`, error);
      throw error; // Re-throw so useSound can catch and use fallback
    }
  }

  // Stop a sound
  stop(soundKey) {
    const sound = this.sounds[soundKey];
    if (sound && sound.pause) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  // Set master volume
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(sound => {
      if (sound && sound.volume !== undefined) {
        sound.volume = this.volume;
      }
    });
  }

  // Mute/unmute all sounds
  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      Object.values(this.sounds).forEach(sound => {
        if (sound && sound.pause) {
          sound.pause();
        }
      });
    }
  }

  // Get current volume
  getVolume() {
    return this.volume;
  }

  // Check if muted
  isMutedState() {
    return this.isMuted;
  }

  // Play multiple sounds in sequence
  async playSequence(soundKeys, delay = 200) {
    for (const soundKey of soundKeys) {
      await this.play(soundKey);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Play random sound from array
  async playRandom(soundKeys) {
    if (soundKeys.length === 0) return;
    const randomKey = soundKeys[Math.floor(Math.random() * soundKeys.length)];
    await this.play(randomKey);
  }
}

// Create global instance
const soundManager = new SoundManager();

// Auto-initialize on first user interaction
let autoInitialized = false;
const autoInitialize = () => {
  if (!autoInitialized) {
    autoInitialized = true;
    soundManager.initialize();
    // Remove listeners after first initialization
    document.removeEventListener('click', autoInitialize);
    document.removeEventListener('keydown', autoInitialize);
  }
};

// Add listeners for auto-initialization
document.addEventListener('click', autoInitialize);
document.addEventListener('keydown', autoInitialize);

export default soundManager;
