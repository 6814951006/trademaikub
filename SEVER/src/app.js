const express = require("express");
const cors = require("cors");
const trackRoutes = require("./routes/track.routes");
const authRoutes = require("./routes/auth.routes");
const orderRoutes = require("./routes/order.routes");
const sellerRoutes = require("./routes/seller.routes");
const transactionRoutes = require("./routes/transaction.routes");
const chatRoutes = require("./routes/chat.routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/tracks", trackRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/chat", chatRoutes);

app.use(notFound);
app.use(errorHandler);
module.exports = app;
