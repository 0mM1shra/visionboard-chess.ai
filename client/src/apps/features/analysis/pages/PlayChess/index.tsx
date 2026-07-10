import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import ReactMarkdown from "react-markdown";

import coachAvatar from "@assets/img/coach_avatar.png";
import * as styles from "./PlayChess.module.css";

interface ChatMessage {
    role: "user" | "coach";
    text: string;
}

const eloToSkillMap: Record<number, number> = {
    500: 1,
    1000: 4,
    1500: 8,
    2000: 13,
    2500: 18
};

function PlayChess() {
    const [game, setGame] = useState(() => new Chess());
    const [gameStarted, setGameStarted] = useState(false);
    const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
    const [elo, setElo] = useState<number>(1500);

    const [chats, setChats] = useState<ChatMessage[]>([]);
    const [moveInput, setMoveInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [engine, setEngine] = useState<Worker | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initialize local Stockfish Worker
    useEffect(() => {
        try {
            const worker = new Worker("/engines/stockfish-17-lite-single.js");
            worker.postMessage("uci");
            setEngine(worker);
            return () => {
                worker.postMessage("quit");
                worker.terminate();
            };
        } catch (err) {
            console.error("Failed to initialize Stockfish worker:", err);
        }
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chats, loading]);

    const skillLevel = eloToSkillMap[elo] || 8;

    const startNewGame = () => {
        const newGame = new Chess();
        setGame(newGame);
        setChats([
            {
                role: "coach",
                text: `🎮 **Game Started!** You are playing as **${playerColor === "w" ? "White" : "Black"}** against Stockfish **${elo} Elo**.`
            }
        ]);
        setGameStarted(true);

        // If player is Black, Stockfish makes the first move!
        if (playerColor === "b") {
            setTimeout(() => {
                makeEngineMove(newGame.fen(), newGame);
            }, 1000);
        }
    };

    const fetchExplanation = async (question?: string) => {
        const history = game.history({ verbose: true });
        if (history.length === 0) return;

        const lastMove = history[history.length - 1];
        const prevFen = history.length > 1 ? history[history.length - 2].after : "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        
        setLoading(true);
        try {
            const response = await fetch("/api/analysis/coach", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    mode: "play",
                    move: lastMove.san,
                    currFen: game.fen(),
                    prevFen,
                    color: lastMove.color,
                    chatHistory: chats.slice(1),
                    question
                })
            });

            if (!response.ok) throw new Error();

            const data = await response.json();
            
            setChats(prev => [
                ...prev,
                ...(question ? [{ role: "user", text: question } as ChatMessage] : []),
                { role: "coach", text: `🤖 **AI Coach assessment**: ${data.assessment || "Good"}\n\n${data.explanation}` }
            ]);
        } catch (err) {
            setChats(prev => [
                ...prev,
                { role: "coach", text: "❌ Failed to fetch AI Coach explanation." }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const makeEngineMove = (currentFen: string, activeGame: Chess) => {
        if (!engine) return;

        engine.postMessage(`setoption name Skill Level value ${skillLevel}`);
        engine.postMessage(`position fen ${currentFen}`);
        
        const depth = Math.min(Math.max(Math.floor(skillLevel / 2) + 2, 2), 12);
        engine.postMessage(`go depth ${depth}`);

        setChats(prev => [...prev, { role: "coach", text: "Stockfish is thinking..." }]);

        engine.onmessage = (event) => {
            const msg = event.data;
            if (msg.startsWith("bestmove")) {
                const bestMove = msg.split(" ")[1];
                if (bestMove && bestMove !== "(none)") {
                    try {
                        const gameCopy = new Chess(activeGame.fen());
                        const moveResult = gameCopy.move({
                            from: bestMove.substring(0, 2),
                            to: bestMove.substring(2, 4),
                            promotion: bestMove.length > 4 ? bestMove.charAt(4) : undefined
                        });

                        if (moveResult) {
                            setGame(gameCopy);
                            setChats(prev => [
                                ...prev.filter(c => c.text !== "Stockfish is thinking..."),
                                { role: "coach", text: `Stockfish played **${moveResult.san}**.` }
                            ]);
                        }
                    } catch (err) {
                        console.error("Error making engine move:", err);
                    }
                }
            }
        };
    };

    const onDrop = (sourceSquare: string, targetSquare: string) => {
        if (game.isGameOver() || loading || !gameStarted) return false;
        
        // Ensure it's player's turn
        if (game.turn() !== playerColor) return false;

        try {
            const gameCopy = new Chess(game.fen());
            const moveResult = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: "q"
            });

            if (moveResult === null) return false;

            setGame(gameCopy);
            setChats(prev => [...prev, { role: "coach", text: `You played **${moveResult.san}**.` }]);

            if (!gameCopy.isGameOver()) {
                setTimeout(() => {
                    makeEngineMove(gameCopy.fen(), gameCopy);
                }, 800);
            }
            return true;
        } catch (error) {
            return false;
        }
    };

    const handleSendChat = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = moveInput.trim();
        if (!text || loading) return;

        setChats(prev => [...prev, { role: "user", text }]);
        setMoveInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/analysis/coach", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    mode: "chat",
                    question: text,
                    currFen: game.fen(),
                    chatHistory: chats.slice(1)
                })
            });

            if (!response.ok) throw new Error();

            const data = await response.json();
            setChats(prev => [...prev, { role: "coach", text: data.text }]);
        } catch (err) {
            setChats(prev => [...prev, { role: "coach", text: "❌ Failed to query AI Chess Coach." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleResign = () => {
        setChats(prev => [...prev, { role: "coach", text: "🏳️ You have resigned the game." }]);
        setGameStarted(false);
    };

    const getMovesHistory = () => {
        const history = game.history({ verbose: true });
        const pairs = [];
        for (let i = 0; i < history.length; i += 2) {
            pairs.push({
                num: Math.floor(i / 2) + 1,
                white: history[i]?.san || "",
                black: history[i + 1]?.san || ""
            });
        }
        return pairs;
    };

    // Locate King square in Check / Checkmate
    let checkKingSquare: string | undefined;
    let matedKingSquare: string | undefined;
    if (gameStarted) {
        if (game.inCheck()) {
            const turn = game.turn();
            for (const row of game.board()) {
                for (const col of row) {
                    if (col && col.type === "k" && col.color === turn) {
                        checkKingSquare = col.square;
                        break;
                    }
                }
                if (checkKingSquare) break;
            }
        }
        if (game.isCheckmate()) {
            const turn = game.turn();
            for (const row of game.board()) {
                for (const col of row) {
                    if (col && col.type === "k" && col.color === turn) {
                        matedKingSquare = col.square;
                        break;
                    }
                }
                if (matedKingSquare) break;
            }
        }
    }

    // Render Custom Chessboard Squares for Check & Mate Highlights
    const customSquareRenderer = (props: any) => {
        const { children, style, square } = props;
        const pieceElement = React.Children.toArray(children).find(
            (el: any) => el?.props?.piece
        );
        const notations = React.Children.toArray(children).filter(
            (el: any) => el?.props?.row !== undefined
        );

        return (
            <div style={{ ...style, position: "relative" }}>
                {pieceElement && (
                    square === matedKingSquare ? (
                        <div style={{ transform: "rotate(90deg)", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {pieceElement}
                        </div>
                    ) : pieceElement
                )}
                {notations}
                {square === checkKingSquare && (
                    <div style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(255, 0, 0, 0.4)",
                        pointerEvents: "none",
                        zIndex: 1
                    }} />
                )}
            </div>
        );
    };

    if (!gameStarted) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.setupCard}>
                    <h1 className={styles.title}>Play Against Stockfish Bot</h1>
                    
                    <div className={styles.setupGroup}>
                        <label className={styles.setupLabel}>CHOOSE YOUR COLOR</label>
                        <div className={styles.colorSelector}>
                            <button 
                                onClick={() => setPlayerColor("w")} 
                                className={`${styles.colorBtn} ${playerColor === "w" ? styles.selectedColor : ""}`}
                            >
                                Play as White
                            </button>
                            <button 
                                onClick={() => setPlayerColor("b")} 
                                className={`${styles.colorBtn} ${playerColor === "b" ? styles.selectedColor : ""}`}
                            >
                                Play as Black
                            </button>
                        </div>
                    </div>

                    <div className={styles.setupGroup}>
                        <label className={styles.setupLabel}>SELECT BOT STRENGTH</label>
                        <div className={styles.eloGrid}>
                            {[500, 1000, 1500, 2000, 2500].map(val => (
                                <button 
                                    key={val}
                                    onClick={() => setElo(val)}
                                    className={`${styles.eloBtn} ${elo === val ? styles.selectedElo : ""}`}
                                >
                                    {val} Elo
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={startNewGame} className={styles.startGameBtn}>
                        Start Game
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Play Against Stockfish Bot</h1>
                    <button onClick={handleResign} className={styles.resignBtnHeader}>
                        Resign
                    </button>
                </div>

                <div className={styles.dashboardGrid}>
                    {/* Chessboard Column */}
                    <div className={styles.boardCol}>
                        <div className={styles.playerLabel}>
                            {playerColor === "w" ? `Stockfish Bot (${elo} Elo)` : "You"}
                        </div>
                        
                        <div className={styles.boardContainer}>
                            <Chessboard 
                                position={game.fen()} 
                                onPieceDrop={onDrop}
                                boardWidth={440}
                                boardOrientation={playerColor === "w" ? "white" : "black"}
                                customSquare={customSquareRenderer}
                                customBoardStyle={{
                                    borderRadius: "4px"
                                }}
                            />
                        </div>

                        <div className={styles.playerLabel}>
                            {playerColor === "w" ? "You" : `Stockfish Bot (${elo} Elo)`}
                        </div>
                    </div>

                    {/* Logs & Terminal Column */}
                    <div className={styles.terminalCol}>
                        {/* Match Move Log */}
                        <div className={styles.logBox}>
                            <h3 className={styles.boxHeader}>MATCH MOVE LOG</h3>
                            <div className={styles.logScroll}>
                                <table className={styles.logTable}>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>White</th>
                                            <th>Black</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getMovesHistory().map((pair) => (
                                            <tr key={pair.num}>
                                                <td>{pair.num}.</td>
                                                <td>{pair.white}</td>
                                                <td>{pair.black}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* AI Coach Interactive Terminal */}
                        <div className={styles.terminalBox}>
                            <h3 className={styles.boxHeader}>AI COACH INTERACTIVE QUERY TERMINAL</h3>
                            <div className={styles.terminalScroll}>
                                {chats.map((msg, index) => (
                                    <div 
                                        key={index} 
                                        className={`${styles.logMessage} ${
                                            msg.role === "user" ? styles.logUser : styles.logCoach
                                        }`}
                                    >
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Suggestions */}
                            {game.history().length > 0 && !loading && (
                                <div className={styles.suggestions}>
                                    <button 
                                        onClick={() => fetchExplanation()} 
                                        className={styles.suggestBtn}
                                    >
                                        🤖 Explain last move
                                    </button>
                                    <button 
                                        onClick={() => fetchExplanation("Why was that last move good or bad?")} 
                                        className={styles.suggestBtn}
                                    >
                                        Why good/bad?
                                    </button>
                                </div>
                            )}

                            {/* Query Input */}
                            <form onSubmit={handleSendChat} className={styles.queryForm}>
                                <input 
                                    type="text" 
                                    value={moveInput}
                                    onChange={(e) => setMoveInput(e.target.value)}
                                    placeholder="Ask: 'How was that move?'..." 
                                    className={styles.queryInput}
                                    disabled={loading}
                                />
                                <button type="submit" className={styles.querySendBtn} disabled={loading}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.credits}>
                Powered by WintrChess
            </div>
        </div>
    );
}

export default PlayChess;
