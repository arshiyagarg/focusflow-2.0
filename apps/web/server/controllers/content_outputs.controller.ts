import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { content_outputs } from "../models/content_outputs";
import { Content_outputsContainer, UserContainer } from "../lib/db.config";
import { User } from "../models/User";

export const createContentOutput = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { inputType, storageRef } = req.body;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!inputType || !storageRef) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const now = new Date().toISOString();
    const contentId = uuid();

    const newContent: content_outputs = {
      id: contentId,           // Cosmos id
      contentId,
      userId: user.id,
      inputType,
      storageRef,
      createdAt: now,
      type: "CONTENT_OUTPUT",
    };

    // Save content output
    await Content_outputsContainer.items.create(newContent);

    // 🔗 Update user's previousContentList
    const { resource: userDoc } = await UserContainer
      .item(user.id, user.id)
      .read<User>();

    if (userDoc) {
      userDoc.previousContentList.push(contentId);
      await UserContainer.item(user.id, user.id).replace(userDoc);
    }

    res.status(201).json(newContent);

  } catch (error) {
    console.error("[content_outputs] Error creating content:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyContentOutputs = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC",
      parameters: [{ name: "@userId", value: user.id }],
    };

    const { resources } =
      await Content_outputsContainer.items.query<content_outputs>(query).fetchAll();

    res.status(200).json(resources);

  } catch (error) {
    console.error("[content_outputs] Error fetching content list:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getContentOutputById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { contentId } = req.params;

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId AND c.contentId = @contentId",
      parameters: [
        { name: "@userId", value: user.id },
        { name: "@contentId", value: contentId },
      ],
    };

    const { resources } =
      await Content_outputsContainer.items.query<content_outputs>(query).fetchAll();

    if (resources.length === 0) {
      return res.status(404).json({ message: "Content not found" });
    }

    res.status(200).json(resources[0]);

  } catch (error) {
    console.error("[content_outputs] Error fetching content:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteContentOutput = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { contentId } = req.params;

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Find item first (needed to get Cosmos `id`)
    const query = {
      query: "SELECT * FROM c WHERE c.userId = @userId AND c.contentId = @contentId",
      parameters: [
        { name: "@userId", value: user.id },
        { name: "@contentId", value: contentId },
      ],
    };

    const { resources } =
      await Content_outputsContainer.items.query<content_outputs>(query).fetchAll();

    if (resources.length === 0) {
      return res.status(404).json({ message: "Content not found" });
    }

    const item = resources[0];

    // Delete from content_outputs
    await Content_outputsContainer.item(item.id, user.id).delete();

    // Remove from user's previousContentList
    const { resource: userDoc } = await UserContainer
      .item(user.id, user.id)
      .read<User>();

    if (userDoc) {
      userDoc.previousContentList =
        userDoc.previousContentList.filter(id => id !== contentId);

      await UserContainer.item(user.id, user.id).replace(userDoc);
    }

    res.status(200).json({ message: "Content deleted successfully" });

  } catch (error) {
    console.error("[content_outputs] Error deleting content:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
