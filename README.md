# Kute Dating App

A full-stack cross-platform dating application with AI-powered chat analysis, built with React Native, Node.js, and MongoDB.

## Features

- **User Discovery** — Browse and swipe on other users with Like / Nope
- **Real-time Matching** — Mutual likes create instant matches via REST API
- **Real-time Chat** — Socket.io powered messaging between matched users
- **AI Vibe Analyzer** — Gemini AI analyzes conversation sentiment and gives relationship advice
- **Cross-platform** — Runs on iOS and Android via Expo

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native, Expo |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Real-time | Socket.io |
| AI | Google Gemini API |

## Project Structure

```
kute-dating-app/
├── backend/
│   ├── models/          # Mongoose schemas (User, Match, Message)
│   ├── routes/          # REST API routes
│   │   ├── users.js     # User registration & listing
│   │   ├── matches.js   # Like/Nope & match retrieval
│   │   └── messages.js  # Chat messages & AI analysis
│   ├── services/
│   │   └── aiService.js # Gemini AI sentiment analysis
│   └── index.js         # Express server + Socket.io setup
└── frontend/
    ├── screens/
    │   ├── LoginScreen.js    # User registration
    │   ├── HomeScreen.js     # User discovery (Like/Nope)
    │   ├── MatchesScreen.js  # Matched users list
    │   └── ChatScreen.js     # Real-time chat + AI Vibe button
    └── App.js               # Navigation setup
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)
- Expo CLI (`npm install -g expo-cli`)
- A [Google Gemini API key](https://aistudio.google.com/)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env
node index.js
```

### Frontend Setup

```bash
cd frontend
npm install
npx expo start
```

> **Note:** If testing on a physical device, replace `localhost` in the screen files with your machine's local IP address (e.g. `192.168.1.100`).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register a new user |
| GET | `/api/users` | Get all users |
| POST | `/api/matches/like` | Like a user |
| POST | `/api/matches/nope` | Nope a user |
| GET | `/api/matches/:userId` | Get all matches for a user |
| GET | `/api/messages/:matchId` | Get messages for a match |
| POST | `/api/messages/:matchId/analyze` | Run AI vibe analysis |

## Environment Variables

Create a `.env` file in `/backend` based on `.env.example`:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/kute-dating-app
GEMINI_API_KEY=your_gemini_api_key_here
```
