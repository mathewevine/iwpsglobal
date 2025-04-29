// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
const axios = require("axios");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// In-memory storage for OTPs (for demo purposes)
const otpStore = new Map();

// DB Connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Middleware for JWT auth
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("No token provided");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).send("Invalid token");
  }
};

// Signup
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  try {
    // Check if email already exists
    const [existingUser] = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "Email already in use." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hashed]
    );

    const token = jwt.sign({ id: result.insertId, name, email }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.status(201).json({ token, user: { id: result.insertId, name, email } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed. Try again later." });
  }
});


// Send OTP
app.post("/api/auth/send-otp", async (req, res) => {
  const { name, email, password } = req.body;

  const [existing] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
  if (existing.length > 0) return res.status(400).send("Email already registered");

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in-memory (for 5 minutes)
  otpStore.set(email, { otp, name, password, expires: Date.now() + 5 * 60 * 1000 });

  // Send email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Hello ${name}, your OTP code is ${otp}. It will expire in 5 minutes.`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send("OTP sent successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to send OTP");
  }
});

// Verify OTP
app.post("/api/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore.get(email);
  if (!record) return res.status(400).send("OTP expired or not found");

  if (record.otp !== otp) return res.status(400).send("Invalid OTP");
  if (Date.now() > record.expires) return res.status(400).send("OTP has expired");

  try {
    const hashedPassword = await bcrypt.hash(record.password, 10);
    const [result] = await db.execute(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [record.name, email, hashedPassword]
    );

    const token = jwt.sign({ id: result.insertId, name: record.name, email }, process.env.JWT_SECRET);
    otpStore.delete(email);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Signup failed");
  }
});


// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "No user found with this email." });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});


// ChatGPT Request
app.post("/api/ai/chat", authenticate, async (req, res) => {
  const { input } = req.body;
  const [users] = await db.execute("SELECT trial_used FROM users WHERE id = ?", [req.user.id]);
  //const trialUsed = users[0].trial_used;

  // if (trialUsed) return res.status(403).send("Trial already used");

  try {
    const openaiRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: input }]
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );

    const output = openaiRes.data.choices[0].message.content;

    await db.execute(
       "INSERT INTO requests (user_id, request_type, input, output) VALUES (?, 'text', ?, ?)",
       [req.user.id, input, output]
    );

    await db.execute("UPDATE users SET trial_used = 1 WHERE id = ?", [req.user.id]);

    res.json({ output });
  } catch (err) {
    console.error("OpenAI Error:", err.response?.data || err.message);
    res.status(500).send("AI request failed");
  }
});

// DALL·E Request
app.post("/api/ai/image", authenticate, async (req, res) => {
  const { input } = req.body;
  const [users] = await db.execute("SELECT trial_used FROM users WHERE id = ?", [req.user.id]);
  const trialUsed = users[0].trial_used;

  // if (trialUsed) return res.status(403).send("Trial already used");

  try {
    const dalleRes = await axios.post(
      "https://api.openai.com/v1/images/generations",
      {
        prompt: input,
        n: 1,
        size: "512x512"
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
    );

    const output = dalleRes.data.data[0].url;
    

    await db.execute(
      "INSERT INTO requests (user_id, request_type, input, output) VALUES (?, 'image', ?, ?)",
      [req.user.id, input, output]
    );

    await db.execute("UPDATE users SET trial_used = 1 WHERE id = ?", [req.user.id]);

    res.json({ output });
  } catch (err) {
    console.error("OpenAI Image Generation Error:", err.response?.data || err.message || err);
    res.status(500).send("Image generation failed");
  }
});

// Contact Sales
app.post("/api/sales/contact", authenticate, async (req, res) => {
  const { message } = req.body;
  try {
    await db.execute(
      "INSERT INTO leads (user_id, message) VALUES (?, ?)",
      [req.user.id, message]
    );
    res.send("Lead submitted");
  } catch (err) {
    res.status(500).send("Failed to save lead");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// Fetch user requests history (text + image)
app.get("/api/user/requests", authenticate, async (req, res) => {
  try {
    const [requests] = await db.execute(
      "SELECT request_type, input, output FROM requests WHERE user_id = ? ORDER BY id DESC LIMIT 50",
      [req.user.id]
    );
    res.json(requests);
  } catch (err) {
    console.error("Error fetching user requests:", err.message);
    res.status(500).send("Failed to fetch requests");
  }
});

app.get('/test', (req, res) => {
  console.log("GET /test called");
  res.send('Backend is working!');
});