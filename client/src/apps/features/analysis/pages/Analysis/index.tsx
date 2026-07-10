import React, { useEffect } from "react";

import ads from "@/constants/advertisements";
import Advertisement from "@/components/Advertisement";
import useGameLoader from "@analysis/hooks/useGameLoader";
import AnalysisPanel from "@analysis/components/AnalysisPanel";
import useAnalysisBoardStore from "@analysis/stores/AnalysisBoardStore";
import { defaultRootNode } from "shared/constants/utils";

import BoardArea from "./BoardArea";
import * as styles from "./Analysis.module.css";

function Analysis({ playMode = false }: { playMode?: boolean }) {
    const setPlayMode = useAnalysisBoardStore(state => state.setPlayMode);
    const playGameStarted = useAnalysisBoardStore(state => state.playGameStarted);
    const playPlayerColor = useAnalysisBoardStore(state => state.playPlayerColor);
    const playElo = useAnalysisBoardStore(state => state.playElo);
    const setPlayGameStarted = useAnalysisBoardStore(state => state.setPlayGameStarted);
    const setPlayPlayerColor = useAnalysisBoardStore(state => state.setPlayPlayerColor);
    const setPlayElo = useAnalysisBoardStore(state => state.setPlayElo);
    const setCurrentStateTreeNode = useAnalysisBoardStore(state => state.setCurrentStateTreeNode);

    useEffect(() => {
        setPlayMode(playMode);
    }, [playMode]);

    useGameLoader();

    const handleStartGame = () => {
        setCurrentStateTreeNode(defaultRootNode);
        setPlayGameStarted(true);
    };

    return <div className={styles.wrapper}>
        <div className={styles.advertisement}>
            <Advertisement adUnitId={ads.analysis.top} style={{
                width: "100%", height: "100px"
            }}/>
        </div>

        <div className={styles.analysisSection}>
            <BoardArea playMode={playMode} />

            {playMode && !playGameStarted ? (
                <div className={`${styles.panel} ${styles.setupPanel}`}>
                    <h2 className={styles.setupTitle}>Play vs Stockfish Bot</h2>
                    
                    <div className={styles.setupGroup}>
                        <label className={styles.setupLabel}>CHOOSE YOUR COLOR</label>
                        <div className={styles.colorSelector}>
                            <button 
                                onClick={() => setPlayPlayerColor("w")} 
                                className={`${styles.colorBtn} ${playPlayerColor === "w" ? styles.selectedColor : ""}`}
                            >
                                Play as White
                            </button>
                            <button 
                                onClick={() => setPlayPlayerColor("b")} 
                                className={`${styles.colorBtn} ${playPlayerColor === "b" ? styles.selectedColor : ""}`}
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
                                    onClick={() => setPlayElo(val)}
                                    className={`${styles.eloBtn} ${playElo === val ? styles.selectedElo : ""}`}
                                >
                                    {val} Elo
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleStartGame} className={styles.startGameBtn}>
                        Start Game
                    </button>
                </div>
            ) : (
                <AnalysisPanel className={styles.panel} />
            )}
        </div>

        <div className={styles.advertisement}>
            <Advertisement adUnitId={ads.analysis.bottom} style={{
                width: "100%", height: "100px"
            }}/>
        </div>
    </div>;
}

export default Analysis;