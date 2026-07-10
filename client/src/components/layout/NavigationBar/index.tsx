import React from "react";
import { Link, useLocation } from "react-router-dom";

import useAnalysisBoardStore from "@/apps/features/analysis/stores/AnalysisBoardStore";
import useAnalysisProgressStore from "@/apps/features/analysis/stores/AnalysisProgressStore";
import AnalysisStatus from "@/apps/features/analysis/constants/AnalysisStatus";
import * as styles from "./NavigationBar.module.css";
import iconIconsAnalysis from "@assets/img/icons/analysis.png";
import iconIconsArchive from "@assets/img/icons/archive.png";
import iconIconsEngine from "@assets/img/icons/engine.png";

function NavigationBar() {
    const location = useLocation();
    const currentPath = location.pathname;

    const { playMode, playGameStarted } = useAnalysisBoardStore();
    const analysisStatus = useAnalysisProgressStore(state => state.analysisStatus);
    const isLinkDisabled = (playMode && playGameStarted) || (!playMode && analysisStatus !== AnalysisStatus.INACTIVE);

    return (
        <div className={styles.sidebar}>
            <div className={styles.logoArea}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1db954" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "10px" }}>
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
                <span className={styles.logoText}>
                    VISION <span className={styles.logoSubtext}>Board</span>
                </span>
            </div>

            <div className={styles.menu}>
                <Link 
                    to={isLinkDisabled ? "#" : "/analysis"} 
                    className={`${styles.menuItem} ${currentPath === "/analysis" ? styles.activeItem : ""}`}
                    onClick={isLinkDisabled ? (e) => e.preventDefault() : undefined}
                    style={isLinkDisabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                >
                    <img src={iconIconsAnalysis} className={styles.icon} alt="Analysis" />
                    <span>Analysis</span>
                </Link>

                <Link 
                    to="/play" 
                    className={`${styles.menuItem} ${(currentPath === "/play" || currentPath === "/") ? styles.activeItem : ""}`}
                >
                    <img src={iconIconsEngine} className={styles.icon} alt="Play" />
                    <span>Play vs Stockfish</span>
                </Link>
            </div>
            
            <div className={styles.footer}>
                <div className={styles.credits}>
                    Powered by WintrChess
                </div>
            </div>
        </div>
    );
}

export default NavigationBar;