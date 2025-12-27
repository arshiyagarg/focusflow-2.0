import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { User } from "../models/User";
import {
  getUsersContainerRW,
  getUsersContainerR,
} from "../lib/db.config";

const router = Router();

/**
 * REGISTER
 */
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const usersR = getUsersContainerR();
  const usersRW = getUsersContainerRW();

  const query = {
    query: "SELECT * FROM c WHERE c.email = @email",
    parameters: [{ name: "@email", value: email }],
  };

  const { resources } = await usersR.items.query<User>(query).fetchAll();

  if (resources.length > 0) {
    return res.status(409).json({ error: "User already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  const user: User = {
    id: uuid(),
    email,
    name,
    passwordHash,
    authProvider: "local",
    previousContentList: [],
    createdAt: now,
    lastLogin: now,
  };

  await usersRW.items.create(user);

  res.status(201).json({ message: "User registered successfully" });
});

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const usersR = getUsersContainerR();
  const usersRW = getUsersContainerRW();

  const query = {
    query: "SELECT * FROM c WHERE c.email = @email",
    parameters: [{ name: "@email", value: email }],
  };

  const { resources } = await usersR.items.query<User>(query).fetchAll();

  if (resources.length === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = resources[0];

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Update last login
  await usersRW
    .item(user.id, user.id)
    .patch([
      {
        op: "replace",
        path: "/lastLogin",
        value: new Date().toISOString(),
      },
    ]);

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

export default router;
