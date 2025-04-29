import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  // Password strength meter
  const getPasswordStrength = (pwd) => {
    if (pwd.length < 6) return { label: "Weak", color: "bg-red-400" };
    if (/[A-Z]/.test(pwd) && /\d/.test(pwd) && /[!@#$%^&*]/.test(pwd))
      return { label: "Strong", color: "bg-green-500" };
    return { label: "Medium", color: "bg-yellow-400" };
  };

  const passwordStrength = getPasswordStrength(password);

  const validateStepOne = () => {
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format.");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateStepOne()) return;
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/send-otp", {
        name,
        email,
        password,
      });
      toast.success("OTP sent to your email.");
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      toast.error("Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error("Please enter the OTP.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp,
      });
      toast.success("Signup successful!");
      setTimeout(() => navigate("/chat"), 1500);
    } catch (err) {
      toast.error("Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/send-otp", {
        name,
        email,
        password,
      });
      toast.success("OTP resent.");
      setResendTimer(60);
    } catch (err) {
      toast.error("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Toaster position="top-center" />
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Signup</h2>

        <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
          key="step1"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.3 }}
        >
          <>
            <input
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {password && (
              <div className="mb-2">
                <div className={`h-2 rounded ${passwordStrength.color}`}></div>
                <p className="text-sm text-gray-600 mt-1">Strength: {passwordStrength.label}</p>
              </div>
            )}
            <input
              placeholder="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-black hover:bg-yellow-600 text-white font-semibold py-3 rounded transition duration-300"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </>
          </motion.div>
        ) : (
          <motion.div
      key="step2"
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3 }}
    >
          <>
            <p className="text-sm text-gray-600 mb-2">
              OTP sent to <span className="font-semibold">{email}</span>
            </p>
            <input
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full p-3 mb-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded transition duration-300"
            >
              {loading ? "Verifying..." : "Verify & Signup"}
            </button>

            <button
              onClick={handleResendOtp}
              disabled={resendTimer > 0 || loading}
              className="mt-3 w-full text-sm text-blue-600 hover:underline"
            >
              {resendTimer > 0
                ? `Resend OTP in ${resendTimer}s`
                : "Didn't receive? Resend OTP"}
            </button>
          </>
          </motion.div>
        )}
        </AnimatePresence>
        <p className="mt-4 text-center text-sm text-gray-700">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
