import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import socketService from '../services/socket';
import apiService from '../services/api';

function Game() {
  const navigate = useNavigate();
  const { state } = useGame();
  const [locations, setLocations] = useState([]);
  const [showSpyGuess, setShowSpyGuess] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedVote, setSelectedVote] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [crossedOutLocations, setCrossedOutLocations] = useState(new Set());

  useEffect(() => {
    // Redirect if not in game
    if (!state.roomCode || !state.currentPlayer || state.gameState === 'waiting') {
      navigate('/');
      return;
    }

    // Navigate to results when game ends
    if (state.gameState === 'ended') {
      navigate('/results');
      return;
    }

    // Load locations for spy guess
    const loadLocations = async () => {
      try {
        const locationList = await apiService.getLocations();
        setLocations(locationList);
      } catch (error) {
        console.error('Failed to load locations:', error);
      }
    };

    loadLocations();
  }, [state.roomCode, state.currentPlayer, state.gameState, navigate]);

    // Timer countdown  useEffect(() => {    if (state.gameState === 'playing') {      const timer = setInterval(() => {        if (state.gameDurationMinutes === 'unlimited') {          setTimeLeft(null);        } else {          // Calculate time remaining from server data          setTimeLeft(state.timeRemaining || 0);        }      }, 1000);      return () => clearInterval(timer);    }  }, [state.gameState, state.timeRemaining, state.gameDurationMinutes]);

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSpyGuess = () => {
    if (selectedLocation) {
      socketService.submitSpyGuess(selectedLocation);
      setShowSpyGuess(false);
    }
  };

  const handleVote = () => {
    if (selectedVote) {
      socketService.submitVote(selectedVote);
    }
  };

  const handleForceVoting = () => {
    socketService.forceVoting();
  };

  const toggleLocationCrossOut = (locationName) => {
    setCrossedOutLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationName)) {
        newSet.delete(locationName);
      } else {
        newSet.add(locationName);
      }
      return newSet;
    });
  };

  if (!state.playerRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Game Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-6 mb-4">
            <div className="card">
              <span className="text-sm text-white/60 mr-2">Room:</span>
              <span className="font-mono font-bold">{state.roomCode}</span>
            </div>
            
                        {state.gameState === 'playing' && (              <div className="game-timer">                {state.gameDurationMinutes === 'unlimited'                   ? '∞ Unlimited'                   : formatTime(state.timeRemaining || 0)                }              </div>            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Role Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Your Role</h2>
            
            {state.playerRole.isSpy ? (
              <div>
                <div className="text-center mb-6">
                  <div className="spy-indicator mb-4">
                    🕵️ YOU ARE THE SPY
                  </div>
                  <p className="text-white/80 mb-4">
                    You don't know the location. Try to figure it out by asking clever questions 
                    without revealing that you're the spy!
                  </p>
                  
                  {state.gameState === 'playing' && (
                    <button
                      onClick={() => setShowSpyGuess(true)}
                      className="btn-primary w-full"
                    >
                      🎯 Guess Location
                    </button>
                  )}
                </div>

                {/* Location Tracker for Spy */}
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-white/90 flex items-center">
                      📍 Location Tracker
                      <span className="text-xs text-white/60 ml-2">(Click to cross out)</span>
                    </h4>
                    {crossedOutLocations.size > 0 && (
                      <button
                        onClick={() => setCrossedOutLocations(new Set())}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 text-xs mb-3">
                    {locations.map((location) => (
                      <button
                        key={location}
                        onClick={() => toggleLocationCrossOut(location)}
                        className={`text-left p-2 rounded transition-all ${
                          crossedOutLocations.has(location)
                            ? 'bg-red-600/30 text-red-300 line-through opacity-50'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                  
                  <p className="text-xs text-white/50">
                    {crossedOutLocations.size}/{locations.length} locations ruled out
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="innocent-indicator mb-4">
                  👥 INNOCENT PLAYER
                </div>
                <div className="space-y-2">
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm text-white/60 mb-1">Location:</p>
                    <p className="text-2xl font-bold text-white">{state.playerRole.location}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm text-white/60 mb-1">Your Role:</p>
                    <p className="text-xl font-semibold text-white">{state.playerRole.role}</p>
                  </div>
                </div>
                <p className="text-white/80 mt-4 text-sm">
                  Ask questions to find the spy, but don't be too obvious about the location!
                </p>
              </div>
            )}
          </div>

          {/* Players List */}
          <div className="card">
            <h2 className="text-xl font-semibold text-white mb-4">Players</h2>
            <div className="space-y-2">
              {state.players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === state.currentPlayer?.id 
                      ? 'bg-primary-600/30 border border-primary-500' 
                      : 'bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{player.name}</span>
                    {player.id === state.currentPlayer?.id && (
                      <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  
                  {state.votes && state.votes[state.currentPlayer?.id] === player.id && (
                    <span className="text-xs bg-danger-600 text-white px-2 py-1 rounded-full">
                      Your Vote
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game Actions */}
        <div className="mt-6">
          {state.gameState === 'playing' && (
            <div className="card text-center">
              <h3 className="text-lg font-semibold text-white mb-4">Game in Progress</h3>
              <p className="text-white/80 mb-4">
                Ask questions and discuss with other players to find the spy!
              </p>
              <button
                onClick={handleForceVoting}
                className="btn-secondary"
              >
                🗳️ Start Voting Early
              </button>
            </div>
          )}

          {state.gameState === 'voting' && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Voting Phase</h3>
              <p className="text-white/80 mb-4">
                Vote for who you think is the spy!
              </p>
              
              <div className="grid gap-2 mb-4">
                {state.players
                  .filter(p => p.id !== state.currentPlayer?.id)
                  .map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedVote(player.id)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        selectedVote === player.id
                          ? 'bg-danger-600 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Vote for {player.name}
                    </button>
                  ))}
              </div>
              
              <button
                onClick={handleVote}
                disabled={!selectedVote}
                className="btn-danger w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Vote
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spy Guess Modal */}
      {showSpyGuess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Guess the Location</h3>
            <p className="text-white/80 mb-4">
              If you guess correctly, you win! But if you're wrong, the innocent players win.
            </p>
            
            <div className="grid gap-2 mb-4 max-h-64 overflow-y-auto">
              {locations.map((location) => (
                <button
                  key={location}
                  onClick={() => setSelectedLocation(location)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedLocation === location
                      ? 'bg-primary-600 text-white'
                      : crossedOutLocations.has(location)
                      ? 'bg-red-600/30 text-red-300 line-through opacity-50'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleSpyGuess}
                disabled={!selectedLocation}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Guess
              </button>
              <button
                onClick={() => {
                  setShowSpyGuess(false);
                  setSelectedLocation('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game; 