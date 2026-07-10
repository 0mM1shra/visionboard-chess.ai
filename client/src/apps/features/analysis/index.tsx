import React, { lazy, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { useAltcha } from "@/apps/features/analysis/hooks/useAltcha";
import PageWrapper from "@/components/layout/PageWrapper";
import { removeDefaultConsentLink } from "@/lib/consent";

import * as styles from "./index.module.css";

const Analysis = lazy(() => import("./pages/Analysis"));
const PlayChess = lazy(() => import("./pages/PlayChess"));
const ChatbotPage = lazy(() => import("./pages/ChatbotPage"));

import "@/i18n";
import "@/index.css";

const root = ReactDOM.createRoot(
    document.querySelector(".root")!
);

function App() {
    const executeCaptcha = useAltcha();

    useEffect(() => {
        removeDefaultConsentLink();
        executeCaptcha();
    }, []);

    return <BrowserRouter>
        <PageWrapper
            className={styles.wrapper}
            footerClassName={styles.footer}
        >
            <React.Suspense fallback={<div style={{ color: "#ffffff", padding: "20px" }}>Loading Chess Tutor...</div>}>
                <Routes>
                    <Route path="/analysis" element={<Analysis playMode={false} />} />
                    <Route path="/play" element={<Analysis playMode={true} />} />
                    <Route path="/chatbot" element={<ChatbotPage/>} />
                    <Route path="/" element={<Analysis playMode={true} />} />
                </Routes>
            </React.Suspense>
        </PageWrapper>
    </BrowserRouter>;
}

root.render(<App/>);