# Spyfall Multiplayer Game

A fully functional multiplayer web version of the social deduction game "Spyfall" built with React, Node.js, Express, and Socket.IO.

## 🎮 Game Overview

Spyfall is a social deduction game where:
- One player is secretly assigned as the **Spy**
- All other players receive the same **location** and unique **roles**
- Players ask questions to identify the spy without revealing the location
- The spy tries to figure out the location by listening to conversations
- After 6 minutes, players vote to identify the spy
- The spy can win by correctly guessing the location before being caught

## 🚀 Features

### Core Gameplay
- **Real-time multiplayer** using Socket.IO
- **6-minute game timer** with automatic voting phase
- **15 unique locations** with 6 roles each
- **Spy guess mechanism** for early wins
- **Voting system** to identify the spy
- **Comprehensive results screen** with statistics

### Technical Features
- **Modern React frontend** with Vite
- **Express.js backend** with Socket.IO
- **Responsive design** with Tailwind CSS
- **Real-time game state synchronization**
- **Room-based multiplayer** with unique codes
- **Automatic game cleanup** for old rooms

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- React Router DOM
- Socket.IO Client
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Socket.IO
- UUID for unique IDs
- CORS for cross-origin requests

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Quick Start
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd spyfall-multiplayer
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start:
- Backend server on `http://localhost:3001`
- Frontend development server on `http://localhost:5173`

### Manual Setup

#### Backend Setup
```bash
cd server
npm install
npm run dev
```

#### Frontend Setup
```bash
cd client
npm install
npm run dev
```

## 🎯 How to Play

### Starting a Game
1. **Create a Room**: Enter your name and click "Create New Game"
2. **Share Room Code**: Give the 6-character room code to friends
3. **Join Game**: Friends enter the room code to join
4. **Start Game**: Host clicks "Start Game" when 3+ players have joined

### During the Game
- **If you're the Spy**: Listen carefully and ask questions to figure out the location
- **If you're Innocent**: Ask questions to identify the spy without being obvious about the location
- **Timer**: You have 6 minutes before voting begins
- **Early Actions**: 
  - Spy can guess the location anytime
  - Any player can force early voting

### Winning Conditions
- **Spy Wins**: If they correctly guess the location OR if innocent players vote incorrectly
- **Innocent Players Win**: If they correctly identify the spy in the vote

## 🗺️ Locations & Roles

The game includes 15 unique locations:
- Airport, Beach, Casino, Hospital, Space Station
- School, Restaurant, Bank, Cruise Ship, Hotel
- Movie Theater, Library, Police Station, Subway, Art Museum

Each location has 6 unique roles to ensure variety and replayability.

## 🔧 API Endpoints

### REST API
- `POST /api/create-room` - Create a new game room
- `POST /api/validate-room` - Validate room exists and is joinable
- `GET /api/locations` - Get list of all available locations

### Socket.IO Events
- `join-room` - Join a game room
- `start-game` - Start the game (host only)
- `submit-vote` - Submit vote during voting phase
- `spy-guess` - Spy submits location guess
- `force-voting` - Force early voting phase

## 🎨 UI/UX Features

- **Beautiful gradient backgrounds** with glassmorphism effects
- **Responsive design** that works on desktop and mobile
- **Real-time updates** for all game state changes
- **Intuitive navigation** between game phases
- **Visual indicators** for spy vs innocent players
- **Animated elements** and smooth transitions

## 🔒 Game Security

- **Server-side validation** for all game actions
- **Role assignment** happens on the server
- **Vote counting** and win condition logic on backend
- **Room cleanup** to prevent memory leaks
- **Input validation** and error handling

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
npm start
```

### Environment Variables
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `VITE_SERVER_URL` - Frontend server URL for API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - feel free to use this project for learning or building your own games!

## 🎉 Acknowledgments

- Inspired by the original Spyfall board game
- Built with modern web technologies for the best multiplayer experience
- Designed for both casual and competitive play

---

**Ready to play?** Start the servers and visit `http://localhost:5173` to begin your Spyfall adventure! 