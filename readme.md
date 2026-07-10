# 👁️ VISION Board

VISION Board is a premium Chess Tutor and Game Analysis dashboard featuring a sleek dark emerald interface, Stockfish ELO play bot integrations, and real-time AI move explanations. 

Originally built on top of the open-source **[WintrChess](https://github.com/WintrCat/wintrchess)** engine, this project extends the base review platform into a comprehensive, interactive coaching tool with bot-play capabilities, custom animations, and a real-time AI Grandmaster tutor.

![Game Review Analysis](Screenshots/Game%20Review%20Analysis.png)

---

## 🛠️ Built on Top of WintrChess

VISION Board leverages the core board rendering, move classification, and engine analysis architectures of **WintrChess**, adding a suite of custom features to enhance the gameplay, tutoring, and design aesthetics:

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

## 📂 Detailed Project Structure

VISION Board is structured as a monorepo containing three core packages:

### 1. `client/`
The React and TypeScript frontend SPA containing:
- **`src/apps/features/analysis/`**: The core dashboard feature area where the chessboard, report sheets, move lists, and chatbot screens are defined.
  - **`components/Board/`**: The custom chessboard container which renders the board, evaluation bars, and handles check/checkmate overlay logic.
  - **`components/AnalysisPanel/`**: Displays the right sidebar containing the tab switcher (Report, Analysis, Coach) and active setups.
  - **`stores/`**: Local state management via Zustand (splitting play state logs and active tab layouts).
- **`src/components/layout/`**: Global UI structures like the left vertical NavigationBar and Sidebar drawer wrappers.

### 2. `server/`
The Node.js Express backend API:
- **`src/routes/api/analysis/coach.ts`**: The endpoint responsible for generating chatbot responses, constructing system prompts from current board FEN states, and querying the Gemini AI API.
- Serves static assets, handles database integrations, and authenticates game sessions.

### 3. `shared/`
Shared libraries, types, and logic used by both the client and server:
- **`shared/types/`**: Shared TS typings for moves, classifications, and players.
- **`shared/lib/`**: Evaluation algorithms, accuracy score calculators, and PGN parsing utilities.

---

## 📸 Screenshots

### 1. Active Bot Play & Move Feedback
![Play vs Stockfish Move Feedback](Screenshots/Play%20vs%20Stockfish%20move%20feedback.png)

### 2. AI Coach Move Explanation Chatbot
![AI Coach Chatbot](Screenshots/AI%20Coach.png)

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

## 📄 License

This project is licensed under the **GPL-3.0 License** - see the [LICENSE](LICENSE) file for details.
