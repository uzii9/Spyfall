import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import socketService from '../services/socket';

function Results() {
  const navigate = useNavigate();
  const { state, actions } = useGame();

  // Navigate to lobby if game state changes to waiting (after reset)
  useEffect(() => {
    if (state.gameState === 'waiting' && state.roomCode && state.currentPlayer) {
      console.log('Game reset detected, navigating to lobby');
      navigate('/lobby');
    }
  }, [state.gameState, state.roomCode, state.currentPlayer, navigate]);

  if (state.gameState !== 'ended') {
    navigate('/');
    return null;
  }

  const handlePlayAgain = () => {
    console.log('Play again button clicked');
    // Reset the game on the server first, then navigate
    socketService.resetGame();
    // Navigation will happen automatically when we receive the game-reset event
    // and the game state changes to 'waiting'
  };

    const handleLeaveGame = () => {    socketService.disconnect();    actions.leaveGame();    navigate('/');  };

  const getSpyPlayer = () => {
    return state.players.find(p => p.id === state.spyId);
  };

  const getVoteResults = () => {
    if (!state.votes) return [];
    
    const voteCount = {};
    Object.values(state.votes).forEach(votedForId => {
      voteCount[votedForId] = (voteCount[votedForId] || 0) + 1;
    });

    return Object.entries(voteCount)
      .map(([playerId, votes]) => {
        const player = state.players.find(p => p.id === playerId);
        return { player, votes };
      })
      .sort((a, b) => b.votes - a.votes);
  };

  const spyPlayer = getSpyPlayer();
  const voteResults = getVoteResults();
  const isSpyWin = state.winner === 'spy';

    return (    <div className="min-h-screen p-4">      {/* Subtle Corner Watermark */}      <div className="fixed top-4 right-4 z-10">        <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm border border-white/10">          <span className="text-white/30 text-xs">by</span>          <span className="text-yellow-400/80 text-xs font-medium">uzi9</span>        </div>      </div>            <div className="max-w-2xl mx-auto">
        {/* Game Over Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">Game Over!</h1>
          
          <div className={`card text-center ${isSpyWin ? 'bg-danger-600/20 border-danger-500' : 'bg-success-600/20 border-success-500'}`}>
            <div className="text-6xl mb-4">
              {isSpyWin ? '🕵️' : '👥'}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {isSpyWin ? 'SPY WINS!' : 'INNOCENT PLAYERS WIN!'}
            </h2>
            <p className="text-lg text-white/80">
              {isSpyWin 
                ? 'The spy successfully deceived everyone!'
                : 'The innocent players caught the spy!'
              }
            </p>
          </div>
        </div>

        {/* Spy Reveal */}
        <div className="card mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">The Spy Was...</h3>
          
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-danger-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {spyPlayer?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{spyPlayer?.name}</p>
              <p className="text-danger-400 font-semibold">🕵️ The Spy</p>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm text-white/60 mb-1">The location was:</p>
            <p className="text-2xl font-bold text-white">{state.location}</p>
          </div>
        </div>

        {/* Vote Results */}
        {voteResults.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Voting Results</h3>
            
            <div className="space-y-3">
              {voteResults.map(({ player, votes }, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === state.spyId 
                      ? 'bg-danger-600/30 border border-danger-500' 
                      : 'bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-white/60">#{index + 1}</span>
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{player.name}</span>
                    {player.id === state.spyId && (
                      <span className="text-xs bg-danger-600 text-white px-2 py-1 rounded-full">
                        Spy
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-bold">{votes}</span>
                    <span className="text-white/60 text-sm">
                      vote{votes !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Statistics */}
        <div className="card mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">Game Statistics</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-white/60 mb-1">Total Players</p>
              <p className="text-2xl font-bold text-white">{state.players.length}</p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-white/60 mb-1">Game Duration</p>
              <p className="text-2xl font-bold text-white">
                {state.timeRemaining ? '6:00' : '< 6:00'}
              </p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-white/60 mb-1">Winner</p>
              <p className="text-lg font-bold text-white">
                {isSpyWin ? 'Spy' : 'Innocent Players'}
              </p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-white/60 mb-1">Location</p>
              <p className="text-lg font-bold text-white">{state.location}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handlePlayAgain}
            className="btn-primary w-full text-lg"
          >
            🎮 Play Again
          </button>
          
          <button
            onClick={handleLeaveGame}
            className="btn-secondary w-full"
          >
            🏠 Back to Home
          </button>
        </div>

        {/* Share Results */}
        <div className="card mt-6 text-center">
          <p className="text-white/60 mb-2">Share your game results:</p>
          <button
            onClick={() => {
              const text = `I just played Spyfall! ${isSpyWin ? 'The spy won' : 'We caught the spy'}! The location was "${state.location}". Join us at ${window.location.origin}`;
              navigator.clipboard.writeText(text);
            }}
            className="btn-secondary"
          >
            📋 Copy Share Text
          </button>
        </div>
      </div>
    </div>
  );
}

export default Results; 