import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

import coachAvatar from "@assets/img/coach_avatar.png";
import * as styles from "./ChatbotPage.module.css";

interface Message {
    role: "user" | "coach";
    text: string;
}

function ChatbotPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "coach",
            text: "👋 **Hello! I am your AI Chess Tutor.**\n\nAsk me anything about chess rules, strategies, tactics, famous players, openings, or ask for advice on how to improve your game!"
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const query = input.trim();
        if (!query || loading) return;

        const updatedMessages = [...messages, { role: "user", text: query } as Message];
        setMessages(updatedMessages);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/analysis/coach", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    mode: "chat",
                    question: query,
                    chatHistory: messages.slice(1)
                })
            });

            if (!response.ok) throw new Error();

            const data = await response.json();
            setMessages(prev => [...prev, { role: "coach", text: data.text }]);
        } catch (err) {
            setMessages(prev => [
                ...prev,
                { role: "coach", text: "❌ **Error**: I had trouble connecting to the brain. Please try again." }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <h1 className={styles.title}>AI Chess Tutor Chatbot</h1>
                </div>

                <div className={styles.chatContainer}>
                    <div className={styles.messagesList}>
                        {messages.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`${styles.messageWrapper} ${
                                    msg.role === "user" ? styles.userWrapper : styles.coachWrapper
                                }`}
                            >
                                {msg.role === "coach" && (
                                    <div className={styles.avatarWrapper}>
                                        <img src={coachAvatar} className={styles.coachAvatar} alt="Coach" />
                                    </div>
                                )}
                                <div className={`${styles.bubble} ${
                                    msg.role === "user" ? styles.userBubble : styles.coachBubble
                                }`}>
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className={`${styles.messageWrapper} ${styles.coachWrapper}`}>
                                <div className={styles.avatarWrapper}>
                                    <img src={coachAvatar} className={styles.coachAvatar} alt="Coach" />
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

                    <form onSubmit={handleSend} className={styles.inputArea}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask the AI Tutor anything about chess..."
                            className={styles.input}
                            disabled={loading}
                        />
                        <button type="submit" className={styles.sendBtn} disabled={loading || !input.trim()}>
                            Send
                        </button>
                    </form>
                </div>
            </div>

            <div className={styles.credits}>
                Powered by WintrChess
            </div>
        </div>
    );
}

export default ChatbotPage;
