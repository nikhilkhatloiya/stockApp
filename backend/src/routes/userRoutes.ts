import { Router } from "express";
import User from "../models/User";

const router = Router();

// Register new user
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = new User({ name, email, password });
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
});

// Get all users (testing only)
router.get("/", async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

export default router;
