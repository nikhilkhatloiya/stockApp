import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Register new user
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword 
    });
    
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data (without password) and token
    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Error creating user" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data (without password) and token
    res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

// Get all users (testing only)
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude passwords
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Create demo user (for testing)
router.post("/create-demo", async (req, res) => {
  try {
    // Check if demo user already exists
    const existingDemo = await User.findOne({ email: "demo@example.com" });
    if (existingDemo) {
      return res.json({ message: "Demo user already exists", user: existingDemo });
    }

    // Create demo user
    const hashedPassword = await bcrypt.hash("demo123", 10);
    const demoUser = new User({
      name: "Demo User",
      email: "demo@example.com",
      password: hashedPassword
    });

    await demoUser.save();

    res.json({
      message: "Demo user created successfully",
      user: {
        _id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email
      }
    });
  } catch (error) {
    console.error("Demo user creation error:", error);
    res.status(500).json({ message: "Error creating demo user" });
  }
});

export default router;
