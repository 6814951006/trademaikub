require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/user.model");

const username = process.env.ADMIN_USERNAME?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

const createAdmin = async () => {
  if (!username || !email || !password) {
    throw new Error(
      "Set ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD before running this command",
    );
  }
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    throw new Error(
      "ADMIN_USERNAME must contain 3-30 letters, numbers or underscores",
    );
  }
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD is invalid");
  }

  await connectDB();
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  const hashedPassword = await bcrypt.hash(password, 12);

  if (existingUser) {
    existingUser.role = "admin";
    existingUser.password = hashedPassword;
    await existingUser.save();
    console.log(`Admin role granted to ${existingUser.username}`);
  } else {
    await User.create({
      username,
      email,
      password: hashedPassword,
      role: "admin",
    });
    console.log(`Admin account created for ${username}`);
  }
};

createAdmin()
  .catch((error) => {
    console.error("Unable to create admin:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = require("mongoose");
    await mongoose.connection.close();
  });
