import React, { createContext, useContext, useReducer, useEffect } from 'react';
import socketService from '../services/socket';

const GameContext = createContext();

const initialState = {
  currentPlayer: null,
  roomCode: null,
  gameState: 'waiting', // waiting, playing, voting, ended
  players: [],
  playerRole: null,
  timeRemaining: 0,
  gameDurationMinutes: 6,
  winner: null,
  spyId: null,
  location: null,
  votes: null,
  error: null,
  loading: false,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'SET_PLAYER':
      return { 
        ...state, 
        currentPlayer: action.payload,
        error: null,
        loading: false 
      };
    
    case 'SET_ROOM':
      return { 
        ...state, 
        roomCode: action.payload,
        error: null 
      };
    
    case 'UPDATE_GAME_STATE':
      return {
        ...state,
        gameState: action.payload.gameState,
        players: action.payload.players || state.players,
        timeRemaining: action.payload.timeRemaining || 0,
        gameDurationMinutes: action.payload.gameDurationMinutes || state.gameDurationMinutes,
        winner: action.payload.winner || null,
        spyId: action.payload.spyId || null,
        location: action.payload.location || null,
        votes: action.payload.votes || null,
      };
    
    case 'SET_ROLE':
      return {
        ...state,
        playerRole: action.payload,
      };
    
    case 'RESET_GAME':
      return {
        ...initialState,
        currentPlayer: state.currentPlayer,
      };
    
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    // Set up socket event listeners
    socketService.on('joined-room', (data) => {
      if (data.success) {
        dispatch({ type: 'SET_PLAYER', payload: data.player });
        dispatch({ type: 'SET_ROOM', payload: data.roomCode });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error });
      }
    });

    socketService.on('player-joined', (data) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: data.gameState });
    });

    socketService.on('game-started', (data) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: data.gameState });
    });

    socketService.on('role-assigned', (role) => {
      dispatch({ type: 'SET_ROLE', payload: role });
    });

    socketService.on('voting-started', (data) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: data.gameState });
    });

    socketService.on('vote-submitted', (data) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: data.gameState });
    });

    socketService.on('game-ended', (data) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: data.gameState });
    });

    socketService.on('player-left', (data) => {
      // Remove player from current players list
      dispatch({ 
        type: 'UPDATE_GAME_STATE', 
        payload: { 
          players: state.players.filter(p => p.id !== data.playerId) 
        } 
      });
    });

    socketService.on('error', (data) => {
      dispatch({ type: 'SET_ERROR', payload: data.message });
    });

    // Cleanup listeners on unmount
    return () => {
      socketService.off('joined-room');
      socketService.off('player-joined');
      socketService.off('game-started');
      socketService.off('role-assigned');
      socketService.off('voting-started');
      socketService.off('vote-submitted');
      socketService.off('game-ended');
      socketService.off('player-left');
      socketService.off('error');
    };
  }, []);

  const actions = {
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    resetGame: () => dispatch({ type: 'RESET_GAME' }),
  };

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
} 