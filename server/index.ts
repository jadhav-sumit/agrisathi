import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { apiRouter } from "./routes";
import { authMiddleware } from "./auth";
import { initDatabase } from "./db";

// Load environment variables from root .env if present
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database (MySQL if configured or local resilient store)
initDatabase().catch((err) => {
  console.warn("[AgriSathi] Database initialization notice:", err?.message);
});

export function createApp() {
  const app = express();

  // Security Headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Body and cookie parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  // CORS middleware supporting cookies and client headers
  app.use((req, res, next) => {
    const origin = req.headers.origin || "*";
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Attach authenticated user to request if session exists
  app.use(authMiddleware as any);

  // Mount API router
  app.use("/api", apiRouter);

  // Serve static files: check dist/public or adjacent public directory
  const publicDir = path.resolve(__dirname, "public");
  const fallbackDistDir = path.resolve(__dirname, "..", "dist", "public");
  const staticPath = publicDir;

  app.use(express.static(staticPath));

  // Client-side SPA routing fallback
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(staticPath, "index.html"), (err) => {
      if (err) {
        // Try fallback directory if adjacent public is not found
        res.sendFile(path.join(fallbackDistDir, "index.html"), (err2) => {
          if (err2) {
            res.status(404).send("AgriSathi: Build assets not found. Run 'pnpm build' first.");
          }
        });
      }
    });
  });

  return app;
}

export async function startServer() {
  const app = createApp();
  const server = createServer(app);

  const port = Number(process.env.PORT) || 3000;

  server.listen(port, () => {
    console.log(`[AgriSathi] Server running on http://localhost:${port}/ (NODE_ENV=${process.env.NODE_ENV || "production"})`);
  });

  return server;
}

// Auto-start when launched directly
if (
  process.env.NODE_ENV === "production" ||
  process.env.RUN_SERVER === "true" ||
  (process.argv[1] && (process.argv[1].endsWith("index.js") || process.argv[1].endsWith("index.ts")))
) {
  startServer().catch(console.error);
}
