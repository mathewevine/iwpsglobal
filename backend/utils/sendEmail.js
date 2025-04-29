const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "youremail@gmail.com",
    pass: "yourapppassword", // Use app password if Gmail
  },
});

const sendOtp = async (email, otp) => {
  await transporter.sendMail({
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP to sign up in wx_ai is ${otp}`,
  });
};

module.exports = sendOtp;
