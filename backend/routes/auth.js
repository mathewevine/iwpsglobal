const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendOtp = require("../utils/mailer");

// Temporary OTP store (for demo)
const otpStore = new Map();

// Endpoint: Send OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

  otpStore.set(otpId, { email, otp, expiresAt: Date.now() + 5 * 60 * 1000 });

  try {
    await sendOtp(email, otp);
    res.json({ message: "OTP sent", otpId });
  } catch (err) {
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Endpoint: Verify OTP and Signup
router.post("/verify-otp", async (req, res) => {
  const { name, email, password, otp, otpId } = req.body;
  const record = otpStore.get(otpId);

  if (!record || record.email !== email || record.otp !== otp || record.expiresAt < Date.now()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ userId: newUser._id }, "your_jwt_secret", { expiresIn: "7d" });

    otpStore.delete(otpId); // Remove used OTP
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

module.exports = router;
