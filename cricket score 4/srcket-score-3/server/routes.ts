import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMatchDataSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  app.get("/api/match-data", async (_req, res) => {
    const data = await storage.getMatchData();
    res.json(data);
  });

  app.post("/api/match-data", async (req, res) => {
    const parsed = insertMatchDataSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid match data" });
      return;
    }
    const newData = await storage.insertMatchData(parsed.data);
    res.json(newData);
  });

  app.delete("/api/match-data", async (_req, res) => {
    await storage.clearMatchData();
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
