const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const GameManager = require('./models/GameManager');
const LOCATIONS = require('./data/locations');

const app = express();
const server = http.createServer(app);

// Configure CORS for production
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:3000', // Alternative local port
  'https://spy-fall.online', // Production frontend domain
  process.env.CLIENT_URL   // Additional production client URL (if set)
].filter(Boolean); // Remove undefined values

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Spyfall Server is running!', 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Initialize game manager
const gameManager = new GameManager();
gameManager.startCleanup();

// API Routes
app.post('/api/create-room', (req, res) => {  try {    const { gameDurationMinutes = 6 } = req.body;    const game = gameManager.createGame(gameDurationMinutes);    res.json({       success: true,       roomCode: game.roomCode,      gameDurationMinutes: game.gameDurationMinutes    });  } catch (error) {    res.status(500).json({       success: false,       error: error.message     });  }});

app.post('/api/validate-room', (req, res) => {
  try {
    const { roomCode } = req.body;
    const game = gameManager.getGame(roomCode);
    
    if (!game) {
      return res.json({ 
        success: false, 
        error: 'Room not found' 
      });
    }
    
    if (game.gameState !== 'waiting') {
      return res.json({ 
        success: false, 
        error: 'Game already in progress' 
      });
    }
    
    res.json({ 
      success: true,
      players: game.getPlayerList().map(p => ({ id: p.id, name: p.name }))
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/locations', (req, res) => {
  res.json({ 
    success: true, 
    locations: Object.keys(LOCATIONS)
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', async (data) => {
    try {
      const { roomCode, playerName } = data;
      const playerId = uuidv4();
      
      const { game, player } = gameManager.joinGame(roomCode, playerId, playerName, socket.id);
      
      // Join socket room
      socket.join(roomCode);
      
      // Send player their info
      socket.emit('joined-room', {
        success: true,
        playerId,
        roomCode,
        player
      });
      
      // Notify all players in room
      io.to(roomCode).emit('player-joined', {
        player: { id: player.id, name: player.name },
        gameState: game.getGameState()
      });
      
    } catch (error) {
      socket.emit('joined-room', {
        success: false,
        error: error.message
      });
    }
  });

  socket.on('start-game', () => {
    try {
      console.log('=== START GAME EVENT RECEIVED ===');
      const playerInfo = gameManager.getPlayerInfo(socket.id);
      console.log('Player info:', playerInfo);
      if (!playerInfo) {
        return socket.emit('error', { message: 'Player not found' });
      }
      
      const game = gameManager.getGame(playerInfo.roomCode);
      console.log('Game found:', !!game);
      console.log('Game state before startGame():', game?.gameState);
      if (!game) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      // Check if player is the host (first player in the game)
      const players = game.getPlayerList();
      const isHost = players.length > 0 && players[0].id === playerInfo.playerId;
      console.log('Is host:', isHost);
      console.log('Players count:', players.length);
      console.log('Can start game:', game.canStartGame());
      
      if (!isHost) {
        return socket.emit('error', { message: 'Only the host can start the game' });
      }
      
      console.log('Calling game.startGame()...');
      game.startGame();
      console.log('Game state after startGame():', game.gameState);
      
      // Send each player their role
      for (const [playerId, player] of game.players.entries()) {
        const playerSocket = Array.from(io.sockets.sockets.values())
          .find(s => gameManager.getPlayerInfo(s.id)?.playerId === playerId);
        
        if (playerSocket) {
          playerSocket.emit('role-assigned', game.getPlayerRole(playerId));
        }
      }
      
      // Get game state before sending
      const gameStateData = game.getGameState();
      console.log('Game state data being sent:', gameStateData);
      
      // Notify all players game started
      io.to(playerInfo.roomCode).emit('game-started', {
        gameState: gameStateData
      });
      
      // Start game timer (only if not unlimited)
      if (game.gameDuration !== null) {
        // Send timer updates every second
        const timerInterval = setInterval(() => {
          if (game.gameState === 'playing') {
            const timeRemaining = game.getTimeRemaining();
            
            // Broadcast timer update
            io.to(playerInfo.roomCode).emit('timer-update', {
              timeRemaining: timeRemaining
            });
            
            // Check if time is up
            if (timeRemaining <= 0) {
              clearInterval(timerInterval);
              game.startVoting();
              io.to(playerInfo.roomCode).emit('voting-started', {
                gameState: game.getGameState()
              });
            }
          } else {
            clearInterval(timerInterval);
          }
        }, 1000);
        
        // Fallback timer for the full duration
        setTimeout(() => {
          if (game.gameState === 'playing') {
            game.startVoting();
            io.to(playerInfo.roomCode).emit('voting-started', {
              gameState: game.getGameState()
            });
          }
        }, game.gameDuration);
      }
      
    } catch (error) {
      console.error('Error in start-game handler:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('submit-vote', (data) => {
    try {
      const { votedForPlayerId } = data;
      const playerInfo = gameManager.getPlayerInfo(socket.id);
      
      if (!playerInfo) {
        return socket.emit('error', { message: 'Player not found' });
      }
      
      const game = gameManager.getGame(playerInfo.roomCode);
      if (!game) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      game.submitVote(playerInfo.playerId, votedForPlayerId);
      
      // Check if all players have voted
      if (game.votes.size === game.players.size) {
        game.endGame();
        io.to(playerInfo.roomCode).emit('game-ended', {
          gameState: game.getGameState()
        });
      } else {
        io.to(playerInfo.roomCode).emit('vote-submitted', {
          gameState: game.getGameState()
        });
      }
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('spy-guess', (data) => {
    try {
      const { guessedLocation } = data;
      const playerInfo = gameManager.getPlayerInfo(socket.id);
      
      if (!playerInfo) {
        return socket.emit('error', { message: 'Player not found' });
      }
      
      const game = gameManager.getGame(playerInfo.roomCode);
      if (!game) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      game.submitSpyGuess(playerInfo.playerId, guessedLocation);
      
      io.to(playerInfo.roomCode).emit('game-ended', {
        gameState: game.getGameState(),
        spyGuess: guessedLocation
      });
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('force-voting', () => {
    try {
      const playerInfo = gameManager.getPlayerInfo(socket.id);
      if (!playerInfo) {
        return socket.emit('error', { message: 'Player not found' });
      }
      
      const game = gameManager.getGame(playerInfo.roomCode);
      if (!game) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      if (game.gameState === 'playing') {
        game.startVoting();
        io.to(playerInfo.roomCode).emit('voting-started', {
          gameState: game.getGameState()
        });
      }
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('reset-game', () => {
    try {
      console.log('=== RESET GAME EVENT RECEIVED ===');
      const playerInfo = gameManager.getPlayerInfo(socket.id);
      console.log('Player info:', playerInfo);
      if (!playerInfo) {
        return socket.emit('error', { message: 'Player not found' });
      }
      
      const game = gameManager.getGame(playerInfo.roomCode);
      console.log('Game found:', !!game);
      if (!game) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      // Any player can reset the game - no host restriction needed
      console.log('Player requesting reset:', playerInfo.playerName);
      
      console.log('Resetting game state...');
      game.resetGame();
      console.log('Game state after reset:', game.gameState);
      
      // Notify all players that game was reset
      io.to(playerInfo.roomCode).emit('game-reset', {
        gameState: game.getGameState()
      });
      
    } catch (error) {
      console.error('Error in reset-game handler:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const playerInfo = gameManager.leaveGame(socket.id);
    if (playerInfo) {
      // Notify remaining players
      io.to(playerInfo.roomCode).emit('player-left', {
        playerId: playerInfo.playerId,
        playerName: playerInfo.playerName
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 