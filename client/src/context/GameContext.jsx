import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
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
      console.log('UPDATE_GAME_STATE action payload:', action.payload);
      console.log('Current state.gameState:', state.gameState);
      console.log('New gameState from payload:', action.payload?.gameState);
      const newState = {
        ...state,
        gameState: action.payload.gameState || state.gameState,
        players: action.payload.players || state.players,
        timeRemaining: action.payload.timeRemaining !== undefined ? action.payload.timeRemaining : state.timeRemaining,
        gameDurationMinutes: action.payload.gameDurationMinutes || state.gameDurationMinutes,
        winner: action.payload.winner || state.winner,
        spyId: action.payload.spyId || state.spyId,
        location: action.payload.location || state.location,
        votes: action.payload.votes || state.votes,
      };
      console.log('New state after UPDATE_GAME_STATE:', newState);
      return newState;
    
    case 'SET_ROLE':
      return {
        ...state,
        playerRole: action.payload,
      };
    
    case 'REMOVE_PLAYER':
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.payload),
      };
    
    case 'RESET_GAME':
      console.log('Resetting game state (keeping player, room, and players)');
      return {
        ...initialState,
        currentPlayer: state.currentPlayer,
        roomCode: state.roomCode,
        players: state.players,
        gameDurationMinutes: state.gameDurationMinutes,
      };
    
    case 'LEAVE_GAME':
      console.log('Leaving game - clearing all state');
      return {
        ...initialState,
      };
    
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    // Set up socket event listeners
    socketService.on('joined-room', (data) => {      console.log('joined-room event received:', data);      if (data.success) {        console.log('Setting player and room code:', data.player, data.roomCode);        dispatch({ type: 'SET_PLAYER', payload: data.player });        dispatch({ type: 'SET_ROOM', payload: data.roomCode });      } else {        console.error('Failed to join room:', data.error);        dispatch({ type: 'SET_ERROR', payload: data.error });      }    });

    socketService.on('player-joined', (data) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: data.gameState });
    });

    socketService.on('game-started', (data) => {
      console.log('game-started event received:', data);
      console.log('data.gameState:', data.gameState);
      console.log('data.gameState.gameState:', data.gameState?.gameState);
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

    socketService.on('game-reset', (data) => {
      console.log('game-reset event received:', data);
      dispatch({ type: 'UPDATE_GAME_STATE', payload: data.gameState });
    });

    socketService.on('player-left', (data) => {
      // Remove player from current players list
      dispatch({ 
        type: 'REMOVE_PLAYER', 
        payload: data.playerId 
      });
    });

    socketService.on('timer-update', (data) => {
      dispatch({ 
        type: 'UPDATE_GAME_STATE', 
        payload: { timeRemaining: data.timeRemaining } 
      });
    });

    socketService.on('error', (data) => {
      console.error('Socket error received:', data);
      dispatch({ type: 'SET_ERROR', payload: data.message });
    });

        // Cleanup listeners on unmount    return () => {      socketService.off('joined-room');      socketService.off('player-joined');      socketService.off('game-started');      socketService.off('role-assigned');      socketService.off('voting-started');      socketService.off('vote-submitted');      socketService.off('game-ended');      socketService.off('game-reset');      socketService.off('player-left');      socketService.off('timer-update');      socketService.off('error');    };
  }, []);

  const actions = {    setLoading: useCallback((loading) => dispatch({ type: 'SET_LOADING', payload: loading }), []),    setError: useCallback((error) => dispatch({ type: 'SET_ERROR', payload: error }), []),    clearError: useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []),    resetGame: useCallback(() => dispatch({ type: 'RESET_GAME' }), []),    leaveGame: useCallback(() => dispatch({ type: 'LEAVE_GAME' }), []),  };  return (    <GameContext.Provider value={{ state, actions }}>      {children}    </GameContext.Provider>  );}export function useGame() {  const context = useContext(GameContext);  if (!context) {    throw new Error('useGame must be used within a GameProvider');  }  return context;} 