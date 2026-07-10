import React from "react";

import { getGameAccuracy } from "shared/lib/reporter/accuracy";
import useAnalysisGameStore from "@analysis/stores/AnalysisGameStore";
import useAnalysisBoardStore from "@analysis/stores/AnalysisBoardStore";
import AccuraciesCard from "@analysis/components/report/AccuraciesCard";
import ClassificationCountCard from "@analysis/components/report/ClassificationCountCard";

import EvaluationGraphArea from "./EvaluationGraphArea";

function GameReport() {
    const analysisGame = useAnalysisGameStore(state => state.analysisGame);

    const {
        currentStateTreeNodeUpdate,
        currentStateTreeNode
    } = useAnalysisBoardStore();

    // Find the root of the active tree
    let rootNode = currentStateTreeNode;
    while (rootNode.parent) {
        rootNode = rootNode.parent;
    }

    const accuracies = getGameAccuracy(rootNode);
    const mockGame = { ...analysisGame, stateTree: rootNode };
    
    return <>
        <EvaluationGraphArea/>

        <AccuraciesCard accuracies={accuracies} />

        <ClassificationCountCard analysisGame={mockGame} />
    </>;
}

export default GameReport;