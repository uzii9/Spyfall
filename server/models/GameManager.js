const Game = require('./Game');

class GameManager {
  constructor() {
    this.games = new Map(); // roomCode -> Game instance
    this.players = new Map(); // socketId -> { playerId, roomCode, playerName }
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure uniqueness
    if (this.games.has(code)) {
      return this.generateRoomCode();
    }
    
    return code;
  }

  createGame(gameDurationMinutes = 6) {    const roomCode = this.generateRoomCode();    const game = new Game(roomCode, gameDurationMinutes);    this.games.set(roomCode, game);    return game;  }

  getGame(roomCode) {
    return this.games.get(roomCode);
  }

  joinGame(roomCode, playerId, playerName, socketId) {
    const game = this.games.get(roomCode);
    if (!game) {
      throw new Error('Game not found');
    }

    // Check if player name is already taken in this room
    const existingPlayers = game.getPlayerList();
    if (existingPlayers.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
      throw new Error('Player name already taken');
    }

    const player = game.addPlayer(playerId, playerName);
    this.players.set(socketId, { playerId, roomCode, playerName });
    
    return { game, player };
  }

  leaveGame(socketId) {
    const playerInfo = this.players.get(socketId);
    if (!playerInfo) {
      return null;
    }

    const { playerId, roomCode } = playerInfo;
    const game = this.games.get(roomCode);
    
    if (game) {
      game.removePlayer(playerId);
      
      // Remove empty games
      if (game.players.size === 0) {
        this.games.delete(roomCode);
      }
    }
    
    this.players.delete(socketId);
    return playerInfo;
  }

  getPlayerInfo(socketId) {
    return this.players.get(socketId);
  }

  cleanupOldGames() {
    const now = new Date();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours
    
    for (const [roomCode, game] of this.games.entries()) {
      if (now - game.createdAt > maxAge && game.players.size === 0) {
        this.games.delete(roomCode);
      }
    }
  }

  // Start periodic cleanup
  startCleanup() {
    setInterval(() => {
      this.cleanupOldGames();
    }, 30 * 60 * 1000); // Run every 30 minutes
  }
}

module.exports = GameManager; 