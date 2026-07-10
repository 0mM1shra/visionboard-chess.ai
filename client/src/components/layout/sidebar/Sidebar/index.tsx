import React from "react";
import { useTranslation } from "react-i18next";

import useAnalysisBoardStore from "@/apps/features/analysis/stores/AnalysisBoardStore";
import useAnalysisProgressStore from "@/apps/features/analysis/stores/AnalysisProgressStore";
import AnalysisStatus from "@/apps/features/analysis/constants/AnalysisStatus";
import SidebarTab from "../SidebarTab";
import Separator from "@/components/common/Separator";
import Typography from "@/components/Typography";

import SidebarProps from "./SidebarProps";
import * as styles from "./Sidebar.module.css";

import iconInterfaceClose from "@assets/img/interface/close.svg";
import iconIconsAnalysis from "@assets/img/icons/analysis.png";
import iconIconsArchive from "@assets/img/icons/archive.png";
import iconIconsEngine from "@assets/img/icons/engine.png";
import iconIconsSettings from "@assets/img/icons/settings.png";

function Sidebar({ style, onClose }: SidebarProps) {
    const { t } = useTranslation("common");

    const { playMode, playGameStarted } = useAnalysisBoardStore();
    const analysisStatus = useAnalysisProgressStore(state => state.analysisStatus);
    const isLinkDisabled = (playMode && playGameStarted) || (!playMode && analysisStatus !== AnalysisStatus.INACTIVE);

    return <div
        className={styles.sidebar}
        style={style}
        onClick={event => event.stopPropagation()}
    >
        <div className={styles.titleSection}>
            <img
                className={styles.closeButton}
                src={iconInterfaceClose}
                onClick={onClose}
            />

            <div style={{ display: "flex", alignItems: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1db954" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
                <span style={{ 
                    fontFamily: "Nunito", 
                    fontWeight: 800, 
                    fontSize: "1.3rem", 
                    color: "#ffffff",
                    letterSpacing: "0.5px"
                }}>
                    VISION <span style={{ color: "#1db954" }}>Board</span>
                </span>
            </div>
        </div>

        <div style={{ padding: "0 10px" }}>
            <Separator style={{ margin: 0 }} />
        </div>

        <div className={styles.tabs}>
            <div className={styles.tabSection}>
                <SidebarTab
                    url={isLinkDisabled ? undefined : "/analysis"} 
                    icon={iconIconsAnalysis}
                    style={isLinkDisabled ? { width: "100%", opacity: 0.5, cursor: "not-allowed" } : { width: "100%" }}
                    onClick={isLinkDisabled ? (e) => e.preventDefault() : undefined}
                >
                    Analysis
                </SidebarTab>

                <SidebarTab
                    url="/play"
                    icon={iconIconsEngine}
                    style={{ width: "100%" }}
                >
                    Play vs Stockfish
                </SidebarTab>
            </div>

            <div className={styles.tabSection}>
                <SidebarTab
                    url="/settings"
                    icon={iconIconsSettings}
                    style={{ width: "100%" }}
                >
                    {t("settings")}
                </SidebarTab>
            </div>
        </div>
    </div>;
}

export default Sidebar;