const Product = require("../models/product.model");
const Transaction = require("../models/transaction.model");

const createTransaction = async (req, res, next) => {
  try {
    const {
      productId,
      method,
      offeredAmount,
      offeredItem = "",
      note = "",
      quantity = 1,
    } = req.body || {};
    if (
      !productId ||
      !["money", "trade"].includes(method) ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1
    )
      return res
        .status(400)
        .json({ message: "Invalid purchase method or quantity" });
    const product = await Product.findById(productId).populate("sellerId");
    if (!product || !product.sellerId || product.sellerId.status !== "approved")
      return res.status(404).json({ message: "Product is not available" });
    if (product.stock < Number(quantity))
      return res.status(409).json({ message: "Not enough stock" });
    if (
      method === "money" &&
      (!Number.isFinite(Number(offeredAmount)) ||
        Number(offeredAmount) < product.price * Number(quantity))
    )
      return res
        .status(400)
        .json({ message: "Payment amount is below the product total" });
    if (method === "trade" && !offeredItem.trim())
      return res
        .status(400)
        .json({ message: "Describe the item you want to trade" });
    const transaction = await Transaction.create({
      buyerId: req.user.sub,
      sellerId: product.sellerId._id,
      productId,
      method,
      quantity: Number(quantity),
      offeredAmount: method === "money" ? Number(offeredAmount) : undefined,
      offeredItem: method === "trade" ? offeredItem.trim() : "",
      note: note.trim(),
    });
    return res.status(201).json(transaction);
  } catch (error) {
    return next(error);
  }
};

const listMine = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ buyerId: req.user.sub })
      .populate("productId", "name price")
      .sort({ createdAt: -1 });
    return res.json(transactions);
  } catch (error) {
    return next(error);
  }
};

module.exports = { createTransaction, listMine };
