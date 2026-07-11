# 👁️ VISION Board

![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![CSS3 Modules](https://img.shields.io/badge/CSS3-Modules-1572B6?style=for-the-badge&logo=css3&logoColor=white)

VISION Board is a premium Chess Tutor, Local Game Review Engine, and Play Dashboard. Designed as a high-fidelity tool for players to review their matches and hone their skills, the platform offers automated game reviews, an interactive AI coach chatbot, and adjustable ELO computer bot play.

Originally built on top of the open-source **[WintrChess](https://github.com/WintrCat/wintrchess)** engine, this application extends the base review tools into a fully interactive chess sandbox.

![Game Review Analysis](Screenshots/Game%20Review%20Analysis.png)

---

## 🛠️ Tech Stack

VISION Board is built using modern web development frameworks and APIs:

- **Frontend**: React, TypeScript, Zustand (State Management), Webpack (Bundler), Vanilla CSS modules.
- **Backend**: Node.js, Express, Better Auth (Session Management & Credentials Authentication).
- **Database**: MongoDB & Mongoose (Object Data Modeling).
- **APIs & Integrations**: Google Gemini API (AI Chess Coach), Stockfish.js (Browser-run Web Worker engines for move analysis and play difficulty).

---

## 🚀 Core Chess Engine & Analysis Features

At its core, VISION Board provides powerful chess evaluation tools powered by local and remote integrations:

1. **📥 Multi-Source Game Importer**:
   - **Chess.com Integration**: Fetch games directly using any public Chess.com username. The application calls the Chess.com public API, parses the match records, and loads them instantly.
   - **Lichess Integration**: Fetch matches directly from Lichess.org profiles.
   - **PGN Parser**: Parse raw PGN (Portable Game Notation) text files, rebuilding the state tree and move list automatically.
   - **FEN Loader**: Input any custom FEN (Forsyth-Edwards Notation) string to set up the board position and explore different openings or tactical puzzles.

2. **💻 Local Stockfish Engine Evaluation**:
   - Runs a full instance of **Stockfish.js** locally inside a browser Web Worker thread.
   - Evaluates positions in real time as the user navigates the move tree, plotting an evaluation graph and providing engine lines without sending data to a remote server.

3. **📊 Professional Game Review & Classification**:
   - Automatically evaluates whole games and calculates individual player accuracy percentages.
   - Classifies every move into standard notation badges: **Brilliant**, **Great Move**, **Best Move**, **Excellent**, **Good**, **Book**, **Inaccuracy**, **Mistake**, and **Blunder**.

---

## 💎 Custom Extensions & Extensions Added

We extended the base chess analysis platform with a suite of custom features to build a complete learning dashboard:

1. **🤖 Play vs Stockfish Bot (ELO Selection)**:
   - Configured custom play setup controls allowing users to select their color (White or Black) and ELO strength (**500**, **1000**, **1500**, **2000**, **2500**).
   - Dynamically maps chosen ELO ratings to Stockfish worker skill parameters.
   - Added active in-game controls (green Start Game button, Resign button).

2. **💬 Real-Time AI Chess Coach (Google Gemini Integration)**:
   - Built a dedicated Grandmaster chatbot interface in the Coach tab.
   - Users can query the AI about specific positions, opening lines, or click "Explain this Move" to get instant, educational text breakdowns.
   - Handles API rate-limiting gracefully, catching Gemini free-tier `429` (Quota Exceeded) status codes and informing the user inline.

3. **🔄 Isolated Zustand Board State Trees**:
   - Re-architected `AnalysisBoardStore.ts` to manage two independent state trees (`analysisStateTreeNode` and `playStateTreeNode`).
   - Ensures that switching tabs between PGN Game Review and Play vs Stockfish never transfers board positions, resets ongoing play, or overwrites analysis histories.

4. **⚡ Tab Navigation Locks**:
   - Disables sidebar links and blocks navigation when either a Stockfish game is actively playing or the PGN evaluation engine is running. This protects current sessions from accidental interruption.

5. **👑 Visual Check & Checkmate Animations**:
   - King's square turns translucent red when under check.
   - The checkmated King piece rotates **90 degrees right** (falling sideways) to visually mark the end of the game.

6. **🎨 Premium Dark Emerald Design Refactoring**:
   - Upgraded the design system in `index.css` to a dark emerald dashboard aesthetic.
   - Integrated Spotify Green (`#1db954`) highlight accents for active tabs, borders, and hover states.
   - Replaced all gold labels with clean, high-contrast white text.
   - Replaced the browser favicon.ico with a custom glowing eye icon and updated browser tab titles.

7. **📊 Material Balance & Points Advantage**:
   - Added real-time tracking of captured pieces (using standard unicode symbols) and points advantage badges next to player profile banners.

---

## 📂 Repository Structure

```
├── client/                     # Frontend client workspace (React + TS)
│   ├── src/                    # Source directory containing app page routers
│   │   ├── apps/               # Modules for PGN Analysis and Play vs Stockfish
│   │   │   └── features/       # Board controls, evaluation panels, and chatbot views
│   │   ├── components/         # Reusable UI dashboard elements and navigation links
│   │   └── index.css           # Core styling system (dark emerald, Spotify green variables)
│   └── public/                 # HTML templates, assets, icons, and audio
├── server/                     # Backend server workspace (Express + Node)
│   ├── src/                    # Source directory containing api routes
│   │   └── routes/             # Gemini AI Coach and auth handler endpoints
│   └── dist/                   # Compiled server distribution folder
├── shared/                     # Common shared monorepo codebase
│   └── src/                    # Shared typings, helper utilities, and calculations
├── Screenshots/                # Application preview screenshots
├── package.json                # Project workspaces script config
├── readme.md                   # Repository documentation (this file)
└── LICENSE                     # GPL-3.0 License details
```

---

## 🚀 Hosting Locally

### 1. Configure Environment
Create a `.env` file in the root directory:
```env
PORT=8080
GEMINI_API_KEY=your_google_gemini_api_key
```

### 2. Install and Start
Install workspace dependencies and build the packages:
```bash
npm install
npm run build
npm start
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser to start analyzing!

---

## 👤 Author

VISION Board is created and developed by **Om Mishra ([0mM1shra](https://github.com/0mM1shra))**.

---

