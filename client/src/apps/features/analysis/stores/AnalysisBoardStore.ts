import { Dispatch, SetStateAction } from "react";
import { Square } from "react-chessboard/dist/chessboard/types";
import { create } from "zustand";

import { StateTreeNode } from "shared/types/game/position/StateTreeNode";
import useAnalysisGameStore from "./AnalysisGameStore";

interface AnalysisBoardStore {
    currentStateTreeNode: StateTreeNode;
    analysisStateTreeNode: StateTreeNode;
    playStateTreeNode: StateTreeNode;
    playMode: boolean;

    // Stockfish Bot Game Configuration
    playGameStarted: boolean;
    playPlayerColor: "w" | "b";
    playElo: number;

    currentStateTreeNodeUpdate: boolean;
    boardFlipped: boolean;
    autoplayEnabled: boolean;

    selectedSourceSquare?: Square;
    playableSquares: Square[];
    capturableSquares: Square[];
    highlightedSquares: Square[];

    setCurrentStateTreeNode: Dispatch<SetStateAction<StateTreeNode>>;
    dispatchCurrentNodeUpdate: () => void;
    setBoardFlipped: (flipped: boolean) => void;
    setAutoplayEnabled: (enabled: boolean) => void;

    setSelectedSourceSquare: (square?: Square) => void;
    setPlayableSquares: (squares: Square[]) => void;
    setCapturableSquares: (squares: Square[]) => void;
    setHighlightedSquares: Dispatch<SetStateAction<Square[]>>;

    setPlayMode: (playMode: boolean) => void;
    setPlayGameStarted: (started: boolean) => void;
    setPlayPlayerColor: (color: "w" | "b") => void;
    setPlayElo: (elo: number) => void;
}

const initialTree = useAnalysisGameStore.getInitialState().analysisGame.stateTree;

const useAnalysisBoardStore = create<AnalysisBoardStore>(set => ({
    currentStateTreeNode: initialTree,
    analysisStateTreeNode: initialTree,
    playStateTreeNode: initialTree,
    playMode: false,

    playGameStarted: false,
    playPlayerColor: "w",
    playElo: 1500,

    currentStateTreeNodeUpdate: false,
    boardFlipped: false,
    autoplayEnabled: false,

    playableSquares: [],
    capturableSquares: [],
    highlightedSquares: [],

    setCurrentStateTreeNode(node) {
        if (typeof node == "function") {
            return set(state => {
                const nextNode = node(state.currentStateTreeNode);
                if (state.playMode) {
                    return {
                        currentStateTreeNode: nextNode,
                        playStateTreeNode: nextNode
                    };
                } else {
                    return {
                        currentStateTreeNode: nextNode,
                        analysisStateTreeNode: nextNode
                    };
                }
            });
        }
        
        set(state => {
            if (state.playMode) {
                return {
                    currentStateTreeNode: node,
                    playStateTreeNode: node
                };
            } else {
                return {
                    currentStateTreeNode: node,
                    analysisStateTreeNode: node
                };
            }
        });
    },

    dispatchCurrentNodeUpdate() {
        set(state => ({
            currentStateTreeNodeUpdate: !state.currentStateTreeNodeUpdate
        }));
    },

    setBoardFlipped(flipped) {
        set({ boardFlipped: flipped });
    },

    setAutoplayEnabled(enabled) {
        set({ autoplayEnabled: enabled });
    },

    setSelectedSourceSquare(square) {
        set({ selectedSourceSquare: square });
    },

    setPlayableSquares(squares) {
        set({ playableSquares: squares });
    },

    setCapturableSquares(squares) {
        set({ capturableSquares: squares });
    },

    setHighlightedSquares(squares) {
        if (typeof squares == "function") {
            return set(state => ({
                highlightedSquares: squares(state.highlightedSquares)
            }));
        }

        set({ highlightedSquares: squares });
    },

    setPlayMode(playMode) {
        set(state => {
            if (state.playMode === playMode) return {};
            if (playMode) {
                return {
                    playMode: true,
                    analysisStateTreeNode: state.currentStateTreeNode,
                    currentStateTreeNode: state.playStateTreeNode
                };
            } else {
                return {
                    playMode: false,
                    playStateTreeNode: state.currentStateTreeNode,
                    currentStateTreeNode: state.analysisStateTreeNode
                };
            }
        });
    },

    setPlayGameStarted(started) {
        set({ playGameStarted: started });
    },

    setPlayPlayerColor(color) {
        set({ playPlayerColor: color });
    },

    setPlayElo(elo) {
        set({ playElo: elo });
    }
}));

export default useAnalysisBoardStore;