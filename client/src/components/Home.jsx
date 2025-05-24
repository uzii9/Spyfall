import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import apiService from '../services/api';
import socketService from '../services/socket';
import CustomSelect from './CustomSelect';

function Home() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [gameDuration, setGameDuration] = useState(6);
  const [customDuration, setCustomDuration] = useState('');
  const navigate = useNavigate();
  const { state, actions } = useGame();

  // Navigate to lobby when player successfully joins a room
  useEffect(() => {
    console.log('Home useEffect - checking navigation conditions:', {
      roomCode: state.roomCode,
      currentPlayer: state.currentPlayer,
      gameState: state.gameState
    });
    if (state.roomCode && state.currentPlayer && state.gameState === 'waiting') {
      console.log('Navigating to lobby...');
      navigate('/lobby');
    }
  }, [state.roomCode, state.currentPlayer, state.gameState, navigate]);

  const durationOptions = [
    { value: 6, label: '6 minutes' },
    { value: 7, label: '7 minutes' },
    { value: 8, label: '8 minutes' },
    { value: 9, label: '9 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 'unlimited', label: 'Unlimited' },
    { value: 'custom', label: 'Custom' }
  ];

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      actions.setError('Please enter your name');
      return;
    }

    let duration = gameDuration;
    
    // Handle custom duration
    if (gameDuration === 'custom') {
      const customValue = parseInt(customDuration);
      if (isNaN(customValue) || customValue < 1 || customValue > 60) {
        actions.setError('Custom duration must be between 1 and 60 minutes');
        return;
      }
      duration = customValue;
    }

    try {
      console.log('Creating room with duration:', duration);
      actions.setLoading(true);
      
      console.log('Connecting to socket...');
      await socketService.connect();
      console.log('Socket connected successfully');
      
      console.log('Creating room via API...');
      const response = await apiService.createRoom(duration);
      console.log('Room created:', response);
      
      // Join the created room - navigation will happen via useEffect
      console.log('Joining room:', response.roomCode, 'with name:', playerName.trim());
      socketService.joinRoom(response.roomCode, playerName.trim());
    } catch (error) {
      console.error('Error creating room:', error);
      actions.setError(error.message);
      actions.setLoading(false);
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
        actions.setLoading(false);
        return;
      }

      await socketService.connect();
      // Join room - navigation will happen via useEffect when state updates
      socketService.joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
    } catch (error) {
      actions.setError(error.message);
      actions.setLoading(false);
    }
  };

  const handleDurationChange = (value) => {
    setGameDuration(value);
    if (value !== 'custom') {
      setCustomDuration('');
    }
  };

  // Handle room code input with proper sanitization for mobile browsers
  const handleRoomCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Main Content Container */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column - Game Interface */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Header */}
            <header className="text-center mb-8">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
                SPYFALL ONLINE
              </h1>
              <h2 className="text-xl text-white/80 mb-2">
                Free Multiplayer Social Deduction Game
              </h2>
              <p className="text-white/60 text-sm mb-3">
                Play the ultimate spy game online with friends - no download required!
              </p>
              
             
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 backdrop-blur-sm mb-2">
                <span className="text-white/70 text-sm">created by</span>
                <a 
                  href="https://www.linkedin.com/in/uzair-kamran-76a174266/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-yellow-400 text-lg font-bold tracking-wide hover:text-yellow-300 transition-colors duration-200 hover:underline"
                >
                  uzi9
                </a>
                <span className="text-yellow-400/70 text-sm">🕵️</span>
              </div>
            </header>

            {/* Error Message */}
            {state.error && (
              <div className="bg-danger-500/20 border border-danger-500 text-danger-100 px-4 py-3 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <span>{state.error}</span>
                  <button 
                    onClick={actions.clearError}
                    className="text-danger-100 hover:text-white"
                    aria-label="Close error message"
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
                  <label htmlFor="playerName" className="block text-sm font-medium text-white/90 mb-2">
                    Your Name
                  </label>
                  <input
                    id="playerName"
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    className="input-field w-full"
                    maxLength={20}
                    disabled={state.loading}
                    aria-describedby="name-help"
                  />
                  <p id="name-help" className="sr-only">Enter your display name for the Spyfall game</p>
                </div>

                {!isJoining ? (
                  /* Create Room Mode */
                  <div className="space-y-4">
                    {/* Game Duration Selection */}
                    <div>
                      <label htmlFor="gameDuration" className="block text-sm font-medium text-white/90 mb-2">
                        Game Duration
                      </label>
                      <CustomSelect
                        id="gameDuration"
                        value={gameDuration}
                        onChange={handleDurationChange}
                        options={durationOptions}
                        disabled={state.loading}
                        className="w-full"
                        aria-describedby="duration-help"
                      />
                      <p id="duration-help" className="sr-only">Select how long each Spyfall game should last</p>
                    </div>

                    {/* Custom Duration Input */}
                    {gameDuration === 'custom' && (
                      <div>
                        <label htmlFor="customDuration" className="block text-sm font-medium text-white/90 mb-2">
                          Custom Duration (minutes)
                        </label>
                        <input
                          id="customDuration"
                          type="number"
                          value={customDuration}
                          onChange={(e) => setCustomDuration(e.target.value)}
                          placeholder="Enter minutes (1-60)"
                          className="input-field w-full"
                          min="1"
                          max="60"
                          disabled={state.loading}
                          aria-describedby="custom-duration-help"
                        />
                        <p id="custom-duration-help" className="sr-only">Set a custom game duration between 1 and 60 minutes</p>
                      </div>
                    )}
                    
                    <button
                      onClick={handleCreateRoom}
                      disabled={state.loading || !playerName.trim() || (gameDuration === 'custom' && !customDuration.trim())}
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-describedby="create-help"
                    >
                      {state.loading ? 'Creating Room...' : 'Create New Spyfall Game'}
                    </button>
                    <p id="create-help" className="sr-only">Create a new Spyfall game room and invite friends to join</p>
                    
                    <div className="text-center">
                      <span className="text-white/60">or</span>
                    </div>
                    
                    <button
                      onClick={() => setIsJoining(true)}
                      className="btn-secondary w-full"
                      disabled={state.loading}
                    >
                      Join Existing Spyfall Game
                    </button>
                  </div>
                ) : (
                  /* Join Room Mode */
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="roomCode" className="block text-sm font-medium text-white/90 mb-2">
                        Room Code
                      </label>
                      <input
                        id="roomCode"
                        type="text"
                        value={roomCode}
                        onChange={handleRoomCodeChange}
                        placeholder="Enter 6-character room code"
                        className="input-field w-full text-center text-lg font-mono tracking-wider"
                        maxLength={6}
                        disabled={state.loading}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="characters"
                        spellCheck="false"
                        inputMode="text"
                        aria-describedby="room-code-help"
                      />
                      <p id="room-code-help" className="sr-only">Enter the 6-character room code provided by the game host</p>
                    </div>
                    
                    <button
                      onClick={handleJoinRoom}
                      disabled={state.loading || !playerName.trim() || !roomCode.trim()}
                      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {state.loading ? 'Joining...' : 'Join Spyfall Game'}
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
          </div>

          {/* Right Column - Game Information & SEO Content */}
          <div className="space-y-6">
            
            {/* What is Spyfall */}
            <section className="card">
              <h3 className="text-2xl font-bold text-white mb-4">What is Spyfall?</h3>
              <div className="space-y-3 text-white/80 leading-relaxed">
                <p>
                  <strong>Spyfall</strong> is the ultimate <strong>social deduction game</strong> where one player is secretly the spy! 
                  Perfect for parties, family game nights, or online hangouts with friends.
                </p>
                <p>
                  In this <strong>free online multiplayer game</strong>, all players except the spy receive the same location 
                  and unique roles. The spy must figure out the location through careful questioning, 
                  while everyone else tries to identify the spy without being too obvious about the location.
                </p>
              </div>
            </section>

            {/* How to Play */}
            <section className="card">
              <h3 className="text-2xl font-bold text-white mb-4">How to Play Spyfall Online</h3>
              <div className="space-y-3 text-white/80">
                <div className="flex items-start space-x-3">
                  <span className="text-primary-400 font-bold text-lg">1.</span>
                  <div>
                    <p><strong>Create or Join:</strong> Host creates a room and shares the code, or join with a friend's room code</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-primary-400 font-bold text-lg">2.</span>
                  <div>
                    <p><strong>Get Your Role:</strong> One player becomes the spy, others get the location and unique roles</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-primary-400 font-bold text-lg">3.</span>
                  <div>
                    <p><strong>Ask Questions:</strong> Take turns asking each other questions about the location</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-primary-400 font-bold text-lg">4.</span>
                  <div>
                    <p><strong>Find the Spy:</strong> Vote to identify the spy, or the spy can guess the location to win!</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Game Features */}
            <section className="card">
              <h3 className="text-2xl font-bold text-white mb-4">Game Features</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-success-400">✓</span>
                    <span className="text-white/80">100% Free to Play</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-success-400">✓</span>
                    <span className="text-white/80">No Download Required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-success-400">✓</span>
                    <span className="text-white/80">3-8 Players Online</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-success-400">✓</span>
                    <span className="text-white/80">Real-time Multiplayer</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-success-400">✓</span>
                    <span className="text-white/80">15 Unique Locations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-success-400">✓</span>
                    <span className="text-white/80">Custom Game Duration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-success-400">✓</span>
                    <span className="text-white/80">Mobile Friendly</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-success-400">✓</span>
                    <span className="text-white/80">Instant Room Creation</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SEO Keywords Section */}
            <section className="card">
              <h3 className="text-xl font-bold text-white mb-3">Perfect For</h3>
              <div className="text-white/70 text-sm leading-relaxed">
                <p>
                  <strong>Party games</strong> • <strong>Social deduction games</strong> • <strong>Online games with friends</strong> • 
                  <strong>Multiplayer browser games</strong> • <strong>Free web games</strong> • <strong>Virtual game night</strong> • 
                  <strong>Family game time</strong> • <strong>Icebreaker games</strong> • <strong>Group activities</strong>
                </p>
              </div>
            </section>

          </div>
        </div>

        {/* Bottom Game Info - Centered */}
        <footer className="mt-12 text-center space-y-4">
          <div className="text-white/60 text-sm space-y-1">
            <p>Play <strong>Spyfall online</strong> - the classic social deduction game, now free in your browser!</p>
            <p>No registration required. Create a room and start playing with friends instantly.</p>
          </div>

          {/* Game Attribution */}
          <div className="text-xs text-white/50 leading-relaxed">
            <p>Original Spyfall game designed by <span className="text-white/70 font-medium">Alexandr Ushan</span></p>
            <p>and published by <span className="text-white/70 font-medium">Hobby World</span></p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Home; 