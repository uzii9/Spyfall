const { v4: uuidv4 } = require('uuid');
const LOCATIONS = require('../data/locations');

class Game {
  constructor(roomCode, gameDurationMinutes = 6) {
    this.roomCode = roomCode;
    this.players = new Map(); // playerId -> player object
    this.gameState = 'waiting'; // waiting, playing, voting, ended
    this.location = null;
    this.spyId = null;
    this.gameStartTime = null;
    this.gameDuration = gameDurationMinutes === 'unlimited' ? null : gameDurationMinutes * 60 * 1000; // duration in milliseconds
    this.gameDurationMinutes = gameDurationMinutes; // store original duration
    this.votes = new Map(); // playerId -> votedForPlayerId
    this.spyGuess = null;
    this.winner = null;
    this.createdAt = new Date();
  }

  addPlayer(playerId, playerName) {
    if (this.gameState !== 'waiting') {
      throw new Error('Cannot join game in progress');
    }
    
    const player = {
      id: playerId,
      name: playerName,
      role: null,
      location: null,
      isSpy: false,
      isReady: false,
      joinedAt: new Date()
    };
    
    this.players.set(playerId, player);
    return player;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    this.votes.delete(playerId);
    
    // Remove votes for this player
    for (const [voterId, votedForId] of this.votes.entries()) {
      if (votedForId === playerId) {
        this.votes.delete(voterId);
      }
    }
  }

  getPlayerList() {
    return Array.from(this.players.values());
  }

  canStartGame() {
    return this.players.size >= 3 && this.gameState === 'waiting';
  }

  startGame() {
    if (!this.canStartGame()) {
      throw new Error('Cannot start game');
    }

    this.gameState = 'playing';
    this.gameStartTime = new Date();
    
    // Assign spy randomly
    const playerIds = Array.from(this.players.keys());
    this.spyId = playerIds[Math.floor(Math.random() * playerIds.length)];
    
    // Select random location
    const locationNames = Object.keys(LOCATIONS);
    this.location = locationNames[Math.floor(Math.random() * locationNames.length)];
    
    // Assign roles
    const availableRoles = [...LOCATIONS[this.location]];
    
    for (const [playerId, player] of this.players.entries()) {
      if (playerId === this.spyId) {
        player.isSpy = true;
        player.role = 'Spy';
        player.location = null;
      } else {
        player.isSpy = false;
        player.location = this.location;
        // Assign random role, ensuring no duplicates
        const roleIndex = Math.floor(Math.random() * availableRoles.length);
        player.role = availableRoles.splice(roleIndex, 1)[0];
      }
    }
  }

  getPlayerRole(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;
    
    return {
      isSpy: player.isSpy,
      role: player.role,
      location: player.location
    };
  }

  submitVote(playerId, votedForPlayerId) {
    if (this.gameState !== 'voting') {
      throw new Error('Voting is not active');
    }
    
    if (!this.players.has(playerId) || !this.players.has(votedForPlayerId)) {
      throw new Error('Invalid player ID');
    }
    
    this.votes.set(playerId, votedForPlayerId);
  }

  submitSpyGuess(playerId, guessedLocation) {
    if (playerId !== this.spyId) {
      throw new Error('Only the spy can guess the location');
    }
    
    if (this.gameState !== 'playing') {
      throw new Error('Game is not in playing state');
    }
    
    this.spyGuess = guessedLocation;
    this.endGame();
  }

  startVoting() {
    if (this.gameState !== 'playing') {
      throw new Error('Cannot start voting');
    }
    
    this.gameState = 'voting';
    this.votes.clear();
  }

  endGame() {
    this.gameState = 'ended';
    
    // Determine winner
    if (this.spyGuess === this.location) {
      this.winner = 'spy';
    } else if (this.votes.size > 0) {
      // Count votes
      const voteCount = new Map();
      for (const votedForId of this.votes.values()) {
        voteCount.set(votedForId, (voteCount.get(votedForId) || 0) + 1);
      }
      
      // Find player with most votes
      let maxVotes = 0;
      let mostVotedPlayer = null;
      for (const [playerId, votes] of voteCount.entries()) {
        if (votes > maxVotes) {
          maxVotes = votes;
          mostVotedPlayer = playerId;
        }
      }
      
      if (mostVotedPlayer === this.spyId) {
        this.winner = 'innocent';
      } else {
        this.winner = 'spy';
      }
    } else {
      // Time ran out, spy wins by default
      this.winner = 'spy';
    }
  }

  getGameState() {
    return {
      roomCode: this.roomCode,
      gameState: this.gameState,
      players: this.getPlayerList().map(p => ({
        id: p.id,
        name: p.name,
        isReady: p.isReady
      })),
      timeRemaining: this.getTimeRemaining(),
      gameDurationMinutes: this.gameDurationMinutes,
      winner: this.winner,
      spyId: this.gameState === 'ended' ? this.spyId : null,
      location: this.gameState === 'ended' ? this.location : null,
      votes: this.gameState === 'voting' || this.gameState === 'ended' ? 
        Object.fromEntries(this.votes) : null
    };
  }

  getTimeRemaining() {
    if (!this.gameStartTime || this.gameState !== 'playing' || this.gameDuration === null) {
      return this.gameDuration; // Return null for unlimited, or full duration if not started
    }
    
    const elapsed = new Date() - this.gameStartTime;
    return Math.max(0, this.gameDuration - elapsed);
  }

  isTimeUp() {
    if (this.gameDuration === null) return false; // Unlimited game
    return this.getTimeRemaining() === 0;
  }
}

module.exports = Game; 