const Order = require("../models/order.model");

const listMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user.sub }).sort({
      createdAt: -1,
    });
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const { symbol, side, type, price, amount } = req.body || {};
    if (
      !symbol ||
      !["buy", "sell"].includes(side) ||
      !["limit", "market"].includes(type)
    ) {
      return res.status(400).json({ message: "Invalid trade order" });
    }

    const parsedPrice = Number(price);
    const parsedAmount = Number(amount);
    if (
      !Number.isFinite(parsedPrice) ||
      parsedPrice <= 0 ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return res
        .status(400)
        .json({ message: "Price and amount must be greater than zero" });
    }

    const order = await Order.create({
      userId: req.user.sub,
      symbol: symbol.trim().slice(0, 120),
      side,
      type,
      price: parsedPrice,
      amount: parsedAmount,
    });
    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
};

module.exports = { listMyOrders, createOrder };
