import express, { Router } from "express";
import { StatusCodes } from "http-status-codes";
import analysisAuthenticator from "@/lib/security/analysis";

const path = "/analysis/coach";

const router = Router();

router.use(path,
    analysisAuthenticator,
    express.json({ limit: "1mb" })
);

router.post(path, async (req, res) => {
    const {
        mode,
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
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        if (mode === "play") {
            return res.status(StatusCodes.OK).json({
                assessment: "Offline",
                explanation: "🤖 **AI Chess Coach** is currently offline. Please configure `GEMINI_API_KEY` in the `.env` file to get real-time move explanations."
            });
        }
        return res.status(StatusCodes.OK).json({
            text: "🤖 **AI Chess Coach** is currently offline.\n\nTo enable me, please add your `GEMINI_API_KEY` to the `.env` file in the root of the project and restart the server! Once configured, I will automatically explain your moves and answer your questions here."
        });
    }

    try {
        let systemPrompt = "";
        if (mode === "play") {
            systemPrompt = `You are a Grandmaster Chess Coach. You will assess the played chess move and explain it.
Board state context:
- Move played: ${move || "None"}
- FEN before: ${prevFen || "N/A"}
- FEN after: ${currFen || "N/A"}
- Color: ${color || "Unknown"}

Assess the move and return a JSON object with two keys:
1. "assessment": One of: "Brilliant", "Great Move", "Best Move", "Excellent", "Good", "Book", "Inaccuracy", "Mistake", "Blunder".
2. "explanation": A 2-3 sentence clear, educational explanation of why the move is good or bad, what it threatens, or what it missed.

Ensure the output is strictly valid JSON. Do not include markdown formatting or backticks around the JSON.`;
        } else {
            systemPrompt = `You are a friendly, encouraging, and highly skilled AI chess coach, similar to the chess.com coach.
Your job is to explain chess moves and answer user queries about the current position.
Here is the context of the current board state:
- Active color: ${color || "Unknown"}
- Move played: ${move || "None"}
- Move number: ${moveNumber || "Unknown"}
- Opening: ${opening || "Unknown"}
- Classification: ${classification || "Unknown"}
- Move accuracy: ${accuracy !== undefined ? accuracy + "%" : "Unknown"}
- Previous FEN: ${prevFen || "N/A"}
- Current FEN: ${currFen || "N/A"}
- Previous Evaluation: ${prevEval || "N/A"}
- Current Evaluation: ${currEval || "N/A"}
- Best alternative moves (Engine Lines): ${JSON.stringify(engineLines || [])}

Please explain the move played or answer the user's question. Keep the explanation relatively concise (2-4 sentences), clear, and educational. Use coordinates (e.g. e4, Nf3) and explain the strategic or tactical meaning of the move (e.g., control of the center, pinning a knight, defending a threat, or hanging a piece). Do not use Markdown headings like # or ##. Use bold text for emphasis.`;
        }

        let promptText = `${systemPrompt}\n\n`;
        if (chatHistory && chatHistory.length > 0) {
            promptText += "Chat History:\n";
            for (const msg of chatHistory) {
                const roleName = msg.role === "user" ? "User" : "Coach";
                promptText += `${roleName}: ${msg.text}\n`;
            }
        }
        if (mode !== "play") {
            promptText += `\nUser question: ${question || "Explain the move played."}`;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: promptText }]
                }]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini API error:", errText);
            if (response.status === 429) {
                if (mode === "play") {
                    return res.status(StatusCodes.OK).json({
                        assessment: "Rate Limited",
                        explanation: "⚠️ **Gemini API Quota Exceeded (429)**. You reached the free-tier limit (15 requests/min, 20 requests/day). Please retry in a moment or add a billing plan to your API key."
                    });
                }
                return res.status(StatusCodes.OK).json({
                    text: "⚠️ **Gemini API Quota Exceeded (429)**.\n\nYou have reached the free-tier limit (15 requests per minute, 20 requests per day). Please retry in a moment or add a billing plan to your API key in Google AI Studio."
                });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to query Gemini API" });
        }

        const data = await response.json() as any;
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't analyze that position. Could you try again?";

        if (mode === "play") {
            try {
                const cleanedText = replyText.replace(/```json/g, "").replace(/```/g, "").trim();
                res.json(JSON.parse(cleanedText));
            } catch (err) {
                console.error("Failed to parse JSON reply from Gemini:", replyText);
                res.json({
                    assessment: "Good",
                    explanation: replyText
                });
            }
        } else {
            res.json({ text: replyText });
        }
    } catch (error) {
        console.error("Coach explanation error:", error);
        res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    }
});

export default router;
