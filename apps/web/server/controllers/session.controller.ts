import crypto from "crypto";
import { Request, Response } from "express";
import { SessionContainer } from "../lib/db.config.js";

export const createOrUpdateSession = async (req: Request, res: Response) => {
  try {
    console.log("[Session Controller] createOrUpdateSession Triggered");

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { contentId } = req.body;
    if (!contentId) {
      return res.status(400).json({ message: "contentId is required" });
    }

    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId AND c.endTime = null",
      parameters: [{ name: "@userId", value: userId }],
    };

    const { resources } = await SessionContainer.items
      .query(query)
      .fetchAll();

    if (resources.length > 0) {
      const session = resources[0];

      const updatedSession = {
        ...session,
        contentId,
        startTime: new Date().toISOString(),
      };

      await SessionContainer.item(session.id, userId).replace(updatedSession);

      return res.status(200).json(updatedSession);
    }

    const newSession = {
      id: crypto.randomUUID(),
      userId,
      contentId,
      startTime: new Date().toISOString(),
      endTime: null,
      focusScore: null,
    };

    await SessionContainer.items.create(newSession);

    return res.status(201).json(newSession);
  } catch (error) {
    console.error("[Session Controller] createOrUpdateSession Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const endSession = async (req: Request, res: Response) => {
  try {
    console.log("[Session Controller] endSession Triggered");

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { focusScore } = req.body;
    console.log("FocusScore:", focusScore);

    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId AND c.endTime = null",
      parameters: [{ name: "@userId", value: userId }],
    };

    const { resources } = await SessionContainer.items
      .query(query)
      .fetchAll();

    console.log("Resource:", resources);

    if (resources.length === 0) {
      return res.status(404).json({ message: "No active session found" });
    }

    const session = resources[0];

    const updatedSession = {
      ...session,
      endTime: new Date().toISOString(),
      focusScore,
    };

    await SessionContainer
      .item(session.id, session.userId)
      .replace(updatedSession);

    return res.status(200).json(updatedSession);
  } catch (error) {
    console.error("[Session Controller] endSession Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
