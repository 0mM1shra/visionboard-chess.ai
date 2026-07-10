import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

import useAnalysisBoardStore from "@analysis/stores/AnalysisBoardStore";
import useAnalysisGameStore from "@analysis/stores/AnalysisGameStore";
import { getNodeMoveNumber } from "shared/types/game/position/StateTreeNode";
import { classificationColours, classificationNames } from "@analysis/constants/classifications";
import coachAvatar from "@assets/img/coach_avatar.png";

import * as styles from "./GameCoach.module.css";

interface ChatMessage {
    role: "user" | "coach";
    text: string;
}

function formatEval(evaluation?: any) {
    if (!evaluation) return "N/A";
    if (evaluation.type === "mate") {
        return `M${evaluation.value}`;
    }
    const val = evaluation.value / 100;
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
}

function GameCoach() {
    const { t } = useTranslation("analysis");
    
    const currentNode = useAnalysisBoardStore(state => state.currentStateTreeNode);
    const { analysisGame } = useAnalysisGameStore();

    // Map of nodeId -> ChatMessage[]
    const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
    // Map of nodeId -> loading status
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const nodeId = currentNode.id;
    const isRootNode = !currentNode.parent || !currentNode.state.move;

    const currentChat = chats[nodeId] || [];
    const isCurrentLoading = loading[nodeId] || false;

    // Scroll to bottom whenever messages change or loading state changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentChat, isCurrentLoading]);

    // Handle welcoming the user when navigating to a new move
    useEffect(() => {
        if (isRootNode) {
            if (!chats[nodeId]) {
                setChats(prev => ({
                    ...prev,
                    [nodeId]: [
                        {
                            role: "coach",
                            text: "👋 **Welcome to Chess Tutor AI Coach!**\n\nI am your AI Chess Coach. Click the button below to analyze the position, or ask me any question about the current position right here!"
                        }
                    ]
                }));
            }
            return;
        }

        // If no chat history yet, set a friendly welcome coach message instead of auto-fetching!
        if (!chats[nodeId]) {
            setChats(prev => ({
                ...prev,
                [nodeId]: [
                    {
                        role: "coach",
                        text: "🤖 **AI Coach Ready.**\n\nClick **Explain this Move** below to see my assessment, or ask me a custom question about this position!"
                    }
                ]
            }));
        }
    }, [nodeId, isRootNode]);

    const fetchExplanation = async (question?: string) => {
        if (isRootNode) return;

        setLoading(prev => ({ ...prev, [nodeId]: true }));

        // Prepare the payload parameters
        const move = currentNode.state.move?.san;
        const color = currentNode.state.moveColour;
        const moveNumber = getNodeMoveNumber(currentNode, analysisGame.initialPosition);
        const opening = currentNode.state.opening;
        const classification = currentNode.state.classification;
        const accuracy = currentNode.state.accuracy;
        const prevFen = currentNode.parent?.state.fen;
        const currFen = currentNode.state.fen;
        const prevEval = formatEval(currentNode.parent?.state.engineLines?.[0]?.evaluation);
        const currEval = formatEval(currentNode.state.engineLines?.[0]?.evaluation);
        const engineLines = currentNode.parent?.state.engineLines?.map(line => ({
            moves: line.moves.map(m => m.san),
            evaluation: formatEval(line.evaluation)
        })) || [];

        const chatHistory = chats[nodeId] || [];

        try {
            const response = await fetch("/api/analysis/coach", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    move,
                    color,
                    moveNumber,
                    opening,
                    classification,
                    accuracy,
                    prevFen,
                    currFen,
                    prevEval,
                    currEval,
                    engineLines,
                    chatHistory,
                    question
                })
            });

            if (!response.ok) {
                throw new Error("Coach API call failed");
            }

            const data = await response.json();
            
            setChats(prev => {
                const updatedChat = prev[nodeId] ? [...prev[nodeId]] : [];
                updatedChat.push({ role: "coach", text: data.text });
                return {
                    ...prev,
                    [nodeId]: updatedChat
                };
            });
        } catch (error) {
            console.error("Error communicating with AI Chess Coach:", error);
            setChats(prev => {
                const updatedChat = prev[nodeId] ? [...prev[nodeId]] : [];
                updatedChat.push({
                    role: "coach",
                    text: "❌ **Error**: I'm having trouble analyzing this move right now. Please try again in a moment."
                });
                return {
                    ...prev,
                    [nodeId]: updatedChat
                };
            });
        } finally {
            setLoading(prev => ({ ...prev, [nodeId]: false }));
        }
    };

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        const text = inputValue.trim();
        if (!text || isCurrentLoading) return;

        // Add user question to the chat list immediately
        setChats(prev => ({
            ...prev,
            [nodeId]: [...(prev[nodeId] || []), { role: "user", text }]
        }));

        setInputValue("");
        fetchExplanation(text);
    };

    const handleSuggest = (suggestText: string) => {
        if (isCurrentLoading) return;
        
        // Add user question to the chat list immediately
        setChats(prev => ({
            ...prev,
            [nodeId]: [...(prev[nodeId] || []), { role: "user", text: suggestText }]
        }));

        fetchExplanation(suggestText);
    };

    // Construct classifications info
    const classification = currentNode.state.classification;
    const classificationNameStr = classification ? t(classificationNames[classification]) : "";
    const classificationColor = classification ? classificationColours[classification] : "#ffffff";

    return (
        <div className={styles.container}>
            {/* Header / Current Move Status */}
            {!isRootNode && currentNode.state.move && (
                <div className={styles.moveHeader} style={{ borderColor: classificationColor }}>
                    <div className={styles.moveHeaderLeft}>
                        <span className={styles.moveNumberLabel}>Move {getNodeMoveNumber(currentNode, analysisGame.initialPosition)}:</span>
                        <span className={styles.moveSan}>{currentNode.state.move.san}</span>
                        {classification && (
                            <span 
                                className={styles.badge} 
                                style={{ backgroundColor: classificationColor }}
                            >
                                {classificationNameStr.toUpperCase()}
                            </span>
                        )}
                    </div>
                    {currentNode.state.accuracy !== undefined && (
                        <div className={styles.accuracy}>
                            Accuracy: <strong>{Math.round(currentNode.state.accuracy)}%</strong>
                        </div>
                    )}
                </div>
            )}

            {/* Chat Messages */}
            <div className={styles.chatArea}>
                {currentChat.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`${styles.messageWrapper} ${
                            msg.role === "user" ? styles.userWrapper : styles.coachWrapper
                        }`}
                    >
                        {msg.role === "coach" && (
                            <div className={styles.avatarWrapper}>
                                <img src={coachAvatar} className={styles.coachAvatar} alt="Coach Robot" />
                            </div>
                        )}
                        <div className={`${styles.bubble} ${
                            msg.role === "user" ? styles.userBubble : styles.coachBubble
                        }`}>
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                    </div>
                ))}
                
                {isCurrentLoading && (
                    <div className={`${styles.messageWrapper} ${styles.coachWrapper}`}>
                        <div className={styles.avatarWrapper}>
                            <img src={coachAvatar} className={styles.coachAvatar} alt="Coach Robot" />
                        </div>
                        <div className={`${styles.bubble} ${styles.coachBubble} ${styles.loadingBubble}`}>
                            <div className={styles.typingIndicator}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {!isRootNode && !isCurrentLoading && currentChat.length > 0 && (
                <div className={styles.suggestions}>
                    {currentChat.length === 1 && (
                        <button 
                            className={styles.suggestBtn} 
                            style={{ backgroundColor: "rgba(29, 185, 84, 0.15)", borderColor: "#1db954", color: "#ffffff" }}
                            onClick={() => fetchExplanation()}
                        >
                            🤖 Explain this Move
                        </button>
                    )}
                    <button 
                        className={styles.suggestBtn} 
                        onClick={() => handleSuggest(`Why is my move classified as ${classificationNameStr || "this"}?`)}
                    >
                        Why classified as {classificationNameStr || "this"}?
                    </button>
                    <button 
                        className={styles.suggestBtn} 
                        onClick={() => handleSuggest("What is the threat in this position?")}
                    >
                        What is the threat?
                    </button>
                    {currentNode.parent?.state.engineLines && currentNode.parent.state.engineLines.length > 0 && (
                        <button 
                            className={styles.suggestBtn} 
                            onClick={() => handleSuggest("What should I have played instead?")}
                        >
                            What should I have played?
                        </button>
                    )}
                    {currentNode.state.opening && (
                        <button 
                            className={styles.suggestBtn} 
                            onClick={() => handleSuggest(`Tell me about the opening: ${currentNode.state.opening}`)}
                        >
                            Explain the opening
                        </button>
                    )}
                </div>
            )}

            {/* Input form */}
            <form onSubmit={handleSend} className={styles.inputArea}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                        isRootNode 
                            ? "Click on any move to start or ask me anything..." 
                            : "Ask your AI chess coach about this position..."
                    }
                    className={styles.input}
                    disabled={isCurrentLoading}
                />
                <button 
                    type="submit" 
                    className={styles.sendBtn}
                    disabled={!inputValue.trim() || isCurrentLoading}
                >
                    Send
                </button>
            </form>
        </div>
    );
}

export default GameCoach;
