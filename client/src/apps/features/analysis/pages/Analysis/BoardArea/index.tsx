import React, { useEffect, useRef } from "react";
import { Chess, Move } from "chess.js";

import { addChildMove } from "shared/types/game/position/StateTreeNode";
import AnalysisTab from "@analysis/constants/AnalysisTab";
import useSettingsStore from "@/stores/SettingsStore";
import useAnalysisGameStore from "@analysis/stores/AnalysisGameStore";
import useAnalysisTabStore from "@analysis/stores/AnalysisTabStore";
import useAnalysisBoardStore from "@analysis/stores/AnalysisBoardStore";
import Board from "@analysis/components/Board";
import playBoardSound from "@/lib/boardSounds";

import useEvaluation from "./useEvaluation";
import useSuggestionArrows from "./useSuggestionArrows";
import * as styles from "./BoardArea.module.css";

const eloToSkillMap: Record<number, number> = {
    500: 1,
    1000: 4,
    1500: 8,
    2000: 13,
    2500: 18
};

function BoardArea({ playMode = false }: { playMode?: boolean }) {
    const settings = useSettingsStore(state => state.settings.analysis);
    const theme = useSettingsStore(state => state.settings.themes);

    const {
        analysisGame,
        gameAnalysisOpen,
        setGameAnalysisOpen
    } = useAnalysisGameStore();

    const setActiveTab = useAnalysisTabStore(state => state.setActiveTab);

    const {
        currentStateTreeNode,
        setCurrentStateTreeNode,
        dispatchCurrentNodeUpdate,
        autoplayEnabled,
        boardFlipped,
        playGameStarted,
        playPlayerColor,
        playElo
    } = useAnalysisBoardStore();

    const evaluation = useEvaluation();
    const suggestionArrows = useSuggestionArrows();
    
    const engineRef = useRef<Worker | null>(null);

    const skillLevel = eloToSkillMap[playElo] || 8;

    // Initialize Stockfish worker if playMode is active
    useEffect(() => {
        if (playMode) {
            try {
                const worker = new Worker("/engines/stockfish-17-lite-single.js");
                worker.postMessage("uci");
                engineRef.current = worker;
                return () => {
                    worker.postMessage("quit");
                    worker.terminate();
                };
            } catch (err) {
                console.error("Failed to initialize Stockfish worker:", err);
            }
        }
    }, [playMode]);

    // Handle bot first move when playing as Black
    useEffect(() => {
        if (playMode && playGameStarted && playPlayerColor === "b" && currentStateTreeNode.state.fen.split(" ")[1] === "w") {
            setTimeout(() => {
                triggerStockfishMove(currentStateTreeNode.state.fen);
            }, 800);
        }
    }, [playMode, playGameStarted, playPlayerColor]);

    function triggerStockfishMove(fen: string) {
        if (!engineRef.current) return;

        engineRef.current.postMessage(`setoption name Skill Level value ${skillLevel}`);
        engineRef.current.postMessage("position fen " + fen);
        engineRef.current.postMessage("go depth 10");

        engineRef.current.onmessage = (event) => {
            const msg = event.data;
            if (msg.startsWith("bestmove")) {
                const bestMove = msg.split(" ")[1];
                if (bestMove && bestMove !== "(none)") {
                    const chess = new Chess(fen);
                    try {
                        const m = chess.move({
                            from: bestMove.substring(0, 2),
                            to: bestMove.substring(2, 4),
                            promotion: bestMove.length > 4 ? bestMove.charAt(4) : undefined
                        });
                        if (m) {
                            setCurrentStateTreeNode(prev => {
                                const createdNode = addChildMove(prev, m.san);
                                playBoardSound(createdNode);
                                return createdNode;
                            });
                            dispatchCurrentNodeUpdate();
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
        };
    }

    function addMove(move: Move) {
        // Enforce player turns in playMode
        if (playMode) {
            if (!playGameStarted) return false;
            // The FEN turn prior to player's move must equal the player's color
            const currentTurn = currentStateTreeNode.state.fen.split(" ")[1];
            if (currentTurn !== playPlayerColor) return false;
        }

        if (!playMode && !gameAnalysisOpen) {
            setGameAnalysisOpen(true);
            setActiveTab(AnalysisTab.ANALYSIS);
        }

        setCurrentStateTreeNode(prev => {
            const createdNode = addChildMove(prev, move.san);
            playBoardSound(createdNode);

            // Trigger Stockfish move if playMode is active and it is the Bot's turn
            const nextTurn = createdNode.state.fen.split(" ")[1];
            if (playMode && nextTurn !== playPlayerColor) {
                setTimeout(() => {
                    triggerStockfishMove(createdNode.state.fen);
                }, 800);
            }

            return createdNode;
        });

        dispatchCurrentNodeUpdate();

        return true;
    }

    const currentTurn = currentStateTreeNode.state.fen.split(" ")[1];
    const isPlayersTurn = !playMode || (currentTurn === playPlayerColor && playGameStarted);

    const customWhiteProfile = playPlayerColor === "w"
        ? { username: "You", rating: undefined }
        : { username: "Stockfish (Bot)", rating: playElo };

    const customBlackProfile = playPlayerColor === "b"
        ? { username: "You", rating: undefined }
        : { username: "Stockfish (Bot)", rating: playElo };

    return <Board
        className={styles.board}
        style={{
            maxWidth: `calc(100vh - ${evaluation ? 195 : 235}px)`
        }}
        profileClassName={styles.boardProfile}
        whiteProfile={playMode ? customWhiteProfile : analysisGame.players.white}
        blackProfile={playMode ? customBlackProfile : analysisGame.players.black}
        theme={{
            lightSquareColour: theme.board.lightSquareColour,
            darkSquareColour: theme.board.darkSquareColour
        }}
        node={currentStateTreeNode}
        flipped={boardFlipped || (playMode && playPlayerColor === "b")}
        evaluation={evaluation}
        arrows={suggestionArrows}
        piecesDraggable={!autoplayEnabled && isPlayersTurn}
        enableClassifications={!settings.classifications.hide}
        onAddMove={addMove}
    />;
}

export default BoardArea;