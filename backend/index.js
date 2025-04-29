require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const axios = require("axios");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password_hash: String,
  trial_used: { type: Boolean, default: false }
});
const User = mongoose.model("User", userSchema);

const requestSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  request_type: String,
  input: String,
  output: String,
  createdAt: { type: Date, default: Date.now }
});
const Request = mongoose.model("Request", requestSchema);

const leadSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  message: String,
  createdAt: { type: Date, default: Date.now }
});
const Lead = mongoose.model("Lead", leadSchema);

// OTP Store (in-memory)
const otpStore = new Map();

// JWT Middleware
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

// Signup with Email + Password
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required." });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return res.status(400).json({ message: "Invalid email format." });

  if (password.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters." });

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password_hash: hashed });

    const token = jwt.sign({ id: user._id, name, email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({ token, user: { id: user._id, name, email } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed. Try again later." });
  }
});

// Send OTP
app.post("/api/auth/send-otp", async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).send("Email already registered");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { otp, name, password, expires: Date.now() + 5 * 60 * 1000 });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
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
  if (!record || record.otp !== otp || Date.now() > record.expires)
    return res.status(400).send("Invalid or expired OTP");

  try {
    const hashedPassword = await bcrypt.hash(record.password, 10);
    const user = await User.create({ name: record.name, email, password_hash: hashedPassword });

    const token = jwt.sign({ id: user._id, name: record.name, email }, process.env.JWT_SECRET);
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
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required." });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No user found with this email." });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: "Incorrect password." });

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// ChatGPT Request
app.post("/api/ai/chat", authenticate, async (req, res) => {
  const { input } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (user.trial_used) return res.status(403).send("Trial already used");

    const openaiRes = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: input }]
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });

    const output = openaiRes.data.choices[0].message.content;

    await Request.create({ user_id: req.user.id, request_type: "text", input, output });
    await User.findByIdAndUpdate(req.user.id, { trial_used: true });

    res.json({ output });
  } catch (err) {
    console.error("OpenAI Error:", err.response?.data || err.message);
    res.status(500).send("AI request failed");
  }
});

// DALL·E Request
app.post("/api/ai/image", authenticate, async (req, res) => {
  const { input } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (user.trial_used) return res.status(403).send("Trial already used");

    const dalleRes = await axios.post("https://api.openai.com/v1/images/generations", {
      prompt: input,
      n: 1,
      size: "512x512"
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });

    const output = dalleRes.data.data[0].url;
    await Request.create({ user_id: req.user.id, request_type: "image", input, output });
    await User.findByIdAndUpdate(req.user.id, { trial_used: true });

    res.json({ output });
  } catch (err) {
    console.error("OpenAI Image Generation Error:", err.response?.data || err.message);
    res.status(500).send("Image generation failed");
  }
});

// Contact Sales
app.post("/api/sales/contact", authenticate, async (req, res) => {
  const { message } = req.body;
  try {
    await Lead.create({ user_id: req.user.id, message });
    res.send("Lead submitted");
  } catch (err) {
    res.status(500).send("Failed to save lead");
  }
});

// Fetch user requests
app.get("/api/user/requests", authenticate, async (req, res) => {
  try {
    const requests = await Request.find({ user_id: req.user.id }).sort({ _id: -1 }).limit(50);
    res.json(requests);
  } catch (err) {
    console.error("Error fetching requests:", err.message);
    res.status(500).send("Failed to fetch requests");
  }
});

app.get("/test", (req, res) => {
  console.log("GET /test called");
  res.send("Backend is working!");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
