import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import apiService from '../services/api';
import socketService from '../services/socket';

function Home() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();
  const { state, actions } = useGame();

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      actions.setError('Please enter your name');
      return;
    }

    try {
      actions.setLoading(true);
      await socketService.connect();
      const response = await apiService.createRoom();
      
      // Join the created room
      socketService.joinRoom(response.roomCode, playerName.trim());
      navigate('/lobby');
    } catch (error) {
      actions.setError(error.message);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      actions.setError('Please enter your name');
      return;
    }
    
    if (!roomCode.trim()) {
      actions.setError('Please enter a room code');
      return;
    }

    try {
      actions.setLoading(true);
      
      // Validate room exists
      const validation = await apiService.validateRoom(roomCode.trim().toUpperCase());
      if (!validation.success) {
        actions.setError(validation.error);
        return;
      }

      await socketService.connect();
      socketService.joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
      navigate('/lobby');
    } catch (error) {
      actions.setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
            SPYFALL
          </h1>
          <p className="text-xl text-white/80">
            The ultimate social deduction game
          </p>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="bg-danger-500/20 border border-danger-500 text-danger-100 px-4 py-3 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span>{state.error}</span>
              <button 
                onClick={actions.clearError}
                className="text-danger-100 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className="card">
          <div className="space-y-6">
            {/* Player Name Input */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="input-field w-full"
                maxLength={20}
                disabled={state.loading}
              />
            </div>

            {!isJoining ? (
              /* Create Room Mode */
              <div className="space-y-4">
                <button
                  onClick={handleCreateRoom}
                  disabled={state.loading || !playerName.trim()}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state.loading ? 'Creating Room...' : 'Create New Game'}
                </button>
                
                <div className="text-center">
                  <span className="text-white/60">or</span>
                </div>
                
                <button
                  onClick={() => setIsJoining(true)}
                  className="btn-secondary w-full"
                  disabled={state.loading}
                >
                  Join Existing Game
                </button>
              </div>
            ) : (
              /* Join Room Mode */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    className="input-field w-full text-center text-lg font-mono tracking-wider"
                    maxLength={6}
                    disabled={state.loading}
                  />
                </div>
                
                <button
                  onClick={handleJoinRoom}
                  disabled={state.loading || !playerName.trim() || !roomCode.trim()}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state.loading ? 'Joining...' : 'Join Game'}
                </button>
                
                <button
                  onClick={() => {
                    setIsJoining(false);
                    setRoomCode('');
                  }}
                  className="btn-secondary w-full"
                  disabled={state.loading}
                >
                  Back to Create Game
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Game Info */}
        <div className="mt-8 text-center text-white/60 text-sm">
          <p>Spyfall is a social deduction game for 3+ players.</p>
          <p>One player is the spy, everyone else gets the same location.</p>
          <p>Ask questions to find the spy, but don't be too obvious!</p>
        </div>
      </div>
    </div>
  );
}

export default Home; 