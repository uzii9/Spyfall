import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import socketService from '../services/socket';

function Lobby() {
  const navigate = useNavigate();
  const { state, actions } = useGame();

  useEffect(() => {
    // Redirect if not in a room
    if (!state.roomCode || !state.currentPlayer) {
      navigate('/');
      return;
    }

    // Navigate to game when it starts
    if (state.gameState === 'playing') {
      navigate('/game');
    }
  }, [state.roomCode, state.currentPlayer, state.gameState, navigate]);

  const handleStartGame = () => {
    console.log('Start game button clicked');
    socketService.startGame();
  };

  const handleLeaveRoom = () => {
    console.log('Leaving room - disconnecting socket and resetting state');
    socketService.disconnect();
    actions.leaveGame();
    navigate('/');
  };

  const canStartGame = state.players.length >= 1; // Temporarily lowered for testing
  const isHost = state.currentPlayer?.id === state.players[0]?.id;
  
  console.log('Lobby state:', {
    players: state.players,
    currentPlayer: state.currentPlayer,
    canStartGame,
    isHost,
    gameState: state.gameState
  });
  
  if (!state.roomCode) {
    return <div>Loading...</div>;
  }

    return (    <div className="min-h-screen p-4">      {/* Subtle Corner Watermark */}      <div className="fixed top-4 right-4 z-10">        <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/10">          <span className="text-white/30 text-xs">by</span>          <span className="text-yellow-400/80 text-xs font-medium">uzi9</span>        </div>      </div>            <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Game Lobby</h1>
          <div className="flex items-center justify-center space-x-4">
            <div className="card inline-block">
              <span className="text-sm text-white/60 mr-2">Room Code:</span>
              <span className="text-2xl font-mono font-bold tracking-wider">
                {state.roomCode}
              </span>
            </div>
            <div className="card inline-block">
              <span className="text-sm text-white/60 mr-2">Duration:</span>
              <span className="text-lg font-semibold">
                {state.gameDurationMinutes === 'unlimited' ? 'Unlimited' : `${state.gameDurationMinutes}min`}
              </span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(state.roomCode)}
              className="btn-secondary py-2 px-3 text-sm"
              title="Copy room code"
            >
              📋 Copy
            </button>
          </div>
        </div>

        {/* Players List */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Players ({state.players.length})
          </h2>
          
          {state.players.length === 0 ? (
            <p className="text-white/60 text-center py-4">
              Waiting for players to join...
            </p>
          ) : (
            <div className="grid gap-3">
              {state.players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-white/10 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{player.name}</span>
                    {player.id === state.currentPlayer?.id && (
                      <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {index === 0 && (
                      <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full">
                        Host
                      </span>
                    )}
                    <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Game Rules */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">How to Play</h2>
          <div className="space-y-3 text-white/80">
            <div className="flex items-start space-x-3">
              <span className="text-primary-400 font-bold">1.</span>
              <p>One player is secretly assigned as the <strong>Spy</strong></p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-primary-400 font-bold">2.</span>
              <p>All other players receive the same <strong>location</strong> and a unique <strong>role</strong></p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-primary-400 font-bold">3.</span>
              <p>Players take turns asking each other questions about the location</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-primary-400 font-bold">4.</span>
              <p>The spy must figure out the location without revealing they don't know it</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-primary-400 font-bold">5.</span>
              <p>After 6 minutes, players vote to identify the spy</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-primary-400 font-bold">6.</span>
              <p>If the spy guesses the location correctly before time runs out, they win!</p>
            </div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="space-y-4">
          {/* Only show start button to host */}
          {isHost ? (
            canStartGame ? (
              <button
                onClick={handleStartGame}
                className="btn-success w-full text-lg"
              >
                🚀 Start Game
              </button>
            ) : (
              <div className="card text-center">
                <p className="text-white/60 mb-2">
                  Need at least 3 players to start
                </p>
                <p className="text-sm text-white/40">
                  Share the room code with your friends!
                </p>
              </div>
            )
          ) : (
            /* Show waiting message to non-hosts */
            state.players.length >= 3 ? (
              <div className="card text-center">
                <p className="text-white/60">
                  Waiting for <strong>{state.players[0]?.name}</strong> to start the game...
                </p>
              </div>
            ) : (
              <div className="card text-center">
                <p className="text-white/60 mb-2">
                  Need at least 3 players to start
                </p>
                <p className="text-sm text-white/40">
                  Share the room code with your friends!
                </p>
              </div>
            )
          )}
          
          <button
            onClick={handleLeaveRoom}
            className="btn-danger w-full"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}

export default Lobby; 