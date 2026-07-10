import React, { lazy } from "react";
import { useTranslation } from "react-i18next";

import AnalysisTab from "@analysis/constants/AnalysisTab";
import useSettingsStore from "@/stores/SettingsStore";
import useAnalysisGameStore from "@analysis/stores/AnalysisGameStore";
import useAnalysisBoardStore from "@analysis/stores/AnalysisBoardStore";
import useAnalysisTabStore from "@analysis/stores/AnalysisTabStore";
import ClassifiedMoveCard from "@analysis/components/report/ClassifiedMoveCard";
import StateTreeTraverser from "@/components/chess/StateTreeTraverser";

import TabBar from "./TabBar";
import AnalysisProgress from "./AnalysisProgress";
import RealtimeEngineArea from "./RealtimeEngineArea";

import GameSelection from "./GameSelection";
import GameReport from "./GameReport";
import GameAnalysis from "./GameAnalysis";
import GameCoach from "./GameCoach";

import AnalysisPanelProps from "./AnalysisPanelProps";
import * as styles from "./AnalysisPanel.module.css";

const OptionsToolbar = lazy(() => import("@analysis/components/OptionsToolbar"));

function AnalysisPanel({
    className,
    style
}: AnalysisPanelProps) {
    const { t } = useTranslation("analysis");

    const settings = useSettingsStore(state => state.settings.analysis);

    const gameAnalysisOpen = useAnalysisGameStore(
        state => state.gameAnalysisOpen
    );

    const currentNode = useAnalysisBoardStore(
        state => state.currentStateTreeNode
    );

    const {
        activeTab
    } = useAnalysisTabStore();

    const {
        playMode,
        playGameStarted,
        setPlayGameStarted
    } = useAnalysisBoardStore();

    const isGameOpen = playMode ? playGameStarted : gameAnalysisOpen;
    
    return <div
        className={`${styles.wrapper} ${className}`}
        style={style}
    >
        <div className={styles.components}>
            <div className={styles.title}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1baaa6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <span>Game Review</span>
                </div>

                {playMode && playGameStarted && (
                    <button 
                        onClick={() => setPlayGameStarted(false)} 
                        className={styles.resignBtn}
                    >
                        Resign
                    </button>
                )}
            </div>

            <OptionsToolbar/>

            {isGameOpen && <TabBar/>}

            <AnalysisProgress/>

            {(isGameOpen && settings.engine.enabled)
                && <RealtimeEngineArea/>
            }

            {isGameOpen
                ? (activeTab == AnalysisTab.REPORT
                    ? <GameReport/>
                    : activeTab == AnalysisTab.ANALYSIS
                    ? <GameAnalysis/>
                    : <GameCoach/>
                )
                : <GameSelection/>
            }
        </div>

        <div className={styles.traverserContainer}>
            <StateTreeTraverser className={styles.traverser} />
        </div>
    </div>;
}

export default AnalysisPanel;