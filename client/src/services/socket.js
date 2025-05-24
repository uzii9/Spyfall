import { io } from 'socket.io-client';

// Determine the server URL based on environment
const getServerUrl = () => {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  
  // For production builds, use the production server
  if (import.meta.env.PROD) {
    return 'https://spyfall-uvdi.onrender.com';
  }
  
  // Default to localhost for development
  return 'http://localhost:3001';
};

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.serverUrl = getServerUrl();
    console.log('🔗 Socket service configured for server:', this.serverUrl);
  }

  connect() {
    console.log('🔌 Attempting to connect to server:', this.serverUrl);
    this.socket = io(this.serverUrl);
    
    // Re-register all listeners after connection
    for (const [event, callbacks] of this.listeners.entries()) {
      callbacks.forEach(callback => {
        this.socket.on(event, callback);
      });
    }

    return new Promise((resolve) => {
      this.socket.on('connect', () => {
        console.log('✅ Connected to server successfully');
        resolve();
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        console.error('Server URL:', this.serverUrl);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

    emit(event, data) {    if (this.socket) {      console.log(`Emitting ${event} event:`, data);      this.socket.emit(event, data);    } else {      console.error('Socket not connected, cannot emit event:', event);    }  }

  // Game-specific methods
      joinRoom(roomCode, playerName) {    console.log('Emitting join-room event:', { roomCode, playerName });    this.emit('join-room', { roomCode, playerName });  }

    startGame() {    console.log('Emitting start-game event');    this.emit('start-game');  }

  submitVote(votedForPlayerId) {
    this.emit('submit-vote', { votedForPlayerId });
  }

  submitSpyGuess(guessedLocation) {
    this.emit('spy-guess', { guessedLocation });
  }

  forceVoting() {
    this.emit('force-voting');
  }

  resetGame() {
    console.log('Emitting reset-game event');
    this.emit('reset-game');
  }
}

export default new SocketService(); 