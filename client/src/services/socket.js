import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    this.socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3001');
    
    // Re-register all listeners after connection
    for (const [event, callbacks] of this.listeners.entries()) {
      callbacks.forEach(callback => {
        this.socket.on(event, callback);
      });
    }

    return new Promise((resolve) => {
      this.socket.on('connect', () => {
        console.log('Connected to server');
        resolve();
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

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Game-specific methods
  joinRoom(roomCode, playerName) {
    this.emit('join-room', { roomCode, playerName });
  }

  startGame() {
    this.emit('start-game');
  }

  submitVote(votedForPlayerId) {
    this.emit('submit-vote', { votedForPlayerId });
  }

  submitSpyGuess(guessedLocation) {
    this.emit('spy-guess', { guessedLocation });
  }

  forceVoting() {
    this.emit('force-voting');
  }
}

export default new SocketService(); 