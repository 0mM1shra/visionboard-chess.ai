import express from "express";
import cluster from "cluster";
import os from "os";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";

import connectDatabase from "@/database/connect";
import hostnameWhitelist from "@/lib/security/whitelist";
import getAuth from "@/lib/auth";
import mainRouter from "./routes";

dotenv.config();

const port = process.env.PORT || 8080;
const nodeEnv = process.env.NODE_ENV || "production";
const isVercel = process.env.VERCEL === "1";

const app = express();

app.use(cookieParser());
app.use(hostnameWhitelist);

// Static assets
app.use("/",
    express.static("client/dist"),
    express.static("client/public")
);

// Normal endpoints
app.all("/auth/account/*", async (req, res, next) => {
    try {
        await connectDatabase();
        toNodeHandler(getAuth())(req, res);
    } catch (err) {
        next(err);
    }
});
app.use("/", mainRouter);

async function startServer() {
    await connectDatabase();
    if (isVercel) {
        return;
    }

    const coreCount = os.cpus().length;
    if (cluster.isPrimary) {
        console.log("starting server...");
        for (let i = 0; i < coreCount; i++) cluster.fork();
        return;
    }

    app.listen(port, () => {
        if (cluster.worker?.id != 1) return;

        console.log(
            `server running on port ${port} `
            + `(${nodeEnv} mode, ${coreCount} thread`
            + (coreCount > 1 ? "s)" : ")")
        );
    });
}

if (!isVercel) {
    startServer();
} else {
    connectDatabase();
}

export default app;