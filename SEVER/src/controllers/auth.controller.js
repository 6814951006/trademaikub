const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const AUTHENTICATION_ERROR = "Invalid username/email or password";

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Authentication service is not configured");
  }

  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "2h" },
  );
};

const publicUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
});

const login = async (req, res, next) => {
  try {
    const identifier =
      typeof req.body?.identifier === "string"
        ? req.body.identifier.trim()
        : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (
      !identifier ||
      !password ||
      identifier.length > 254 ||
      password.length > 128
    ) {
      return res.status(401).json({ message: AUTHENTICATION_ERROR });
    }

    const query = identifier.includes("@")
      ? { email: identifier.toLowerCase() }
      : { username: identifier };
    const user = await User.findOne(query).select("+password");
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!passwordMatches) {
      return res.status(401).json({ message: AUTHENTICATION_ERROR });
    }

    const token = createToken(user);

    return res.json({
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const username =
      typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    const validUsername = /^[a-zA-Z0-9_]{3,30}$/.test(username);
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (
      !validUsername ||
      !validEmail ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res
        .status(400)
        .json({ message: "Username, email or password is invalid" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "Username";
      return res
        .status(409)
        .json({ message: `${field} is already registered` });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    return res
      .status(201)
      .json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Username or email is already registered" });
    }
    return next(error);
  }
};

module.exports = { login, register };
