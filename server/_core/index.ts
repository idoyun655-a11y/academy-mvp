import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import express from "express";
import { createServer as createViteServer } from "vite";
import * as trpcExpress from "@trpc/server/adapters/express";

const projectRoot = process.cwd();

dotenv.config({ path: path.resolve(projectRoot, ".env.local") });
dotenv.config({ path: path.resolve(projectRoot, ".env") });

const port = Number(process.env.PORT ?? 3000);

async function createApp() {
  const [{ appRouter }, { createContext }] = await Promise.all([
    import("../routers"),
    import("./context"),
  ]);

  const app = express();

  app.use(express.json());

  app.use(
    "/api/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "production") {
    const distDir = path.resolve(projectRoot, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
    return app;
  }

  const vite = await createViteServer({
    root: projectRoot,
    server: { middlewareMode: true },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.get("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const templatePath = path.resolve(projectRoot, "index.html");
      const template = await fs.readFile(templatePath, "utf8");
      const html = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });

  return app;
}

createApp()
  .then(app => {
    app.listen(port, () => {
      console.log(`[academy] server listening on http://localhost:${port}`);
    });
  })
  .catch(error => {
    console.error("[academy] failed to start", error);
    process.exit(1);
  });
