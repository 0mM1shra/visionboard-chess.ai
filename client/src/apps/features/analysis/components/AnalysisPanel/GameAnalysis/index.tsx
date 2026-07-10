import React from "react";

import useAnalysisBoardStore from "@analysis/stores/AnalysisBoardStore";
import useAnalysisGameStore from "@analysis/stores/AnalysisGameStore";
import StateTreeEditor from "@/components/chess/StateTreeEditor";
import playBoardSound from "@/lib/boardSounds";

import * as styles from "./GameAnalysis.module.css";

function GameAnalysis() {
    const { analysisGame } = useAnalysisGameStore();

    const {
        currentStateTreeNode,
        setCurrentStateTreeNode,
        setAutoplayEnabled,
        playMode
    } = useAnalysisBoardStore();

    // Dynamically find the root node of the active tree (works for both play and analysis)
    let rootNode = currentStateTreeNode;
    while (rootNode.parent) {
        rootNode = rootNode.parent;
    }
    
    return <StateTreeEditor
        className={styles.stateTreeEditor}
        stateTreeRootNode={rootNode}
        onMoveClick={node => {
            setCurrentStateTreeNode(node);
        
            if (node != currentStateTreeNode) {
                playBoardSound(node);
            }

            setAutoplayEnabled(false);
        }}
    />;
}

export default GameAnalysis;