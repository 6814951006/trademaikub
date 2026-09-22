const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const Product = require("../models/product.model");
const Seller = require("../models/seller.model");

const canAccess = (conversation, userId) =>
  conversation.buyerId.toString() === userId ||
  conversation.sellerId.userId.toString() === userId;

const openConversation = async (req, res, next) => {
  try {
    const product = await Product.findById(req.body?.productId).populate(
      "sellerId",
    );
    if (!product || !product.sellerId || product.sellerId.status !== "approved")
      return res.status(404).json({ message: "Product is not available" });
    const conversation = await Conversation.findOneAndUpdate(
      {
        buyerId: req.user.sub,
        sellerId: product.sellerId._id,
        productId: product._id,
      },
      {
        buyerId: req.user.sub,
        sellerId: product.sellerId._id,
        productId: product._id,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).populate("productId", "name");
    return res.json(conversation);
  } catch (error) {
    return next(error);
  }
};

const listMine = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.sub });
    if (!seller) return res.json([]);
    return res.json(
      await Conversation.find({ sellerId: seller._id })
        .populate("buyerId", "username")
        .populate("productId", "name")
        .sort({ updatedAt: -1 }),
    );
  } catch (error) {
    return next(error);
  }
};

const listMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id).populate(
      "sellerId",
      "userId",
    );
    if (!conversation || !canAccess(conversation, req.user.sub))
      return res.status(403).json({ message: "Conversation access denied" });
    return res.json(
      await Message.find({ conversationId: conversation._id })
        .populate("senderId", "username")
        .sort({ createdAt: 1 }),
    );
  } catch (error) {
    return next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id).populate(
      "sellerId",
      "userId",
    );
    const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!conversation || !canAccess(conversation, req.user.sub))
      return res.status(403).json({ message: "Conversation access denied" });
    if (!body)
      return res.status(400).json({ message: "Message cannot be empty" });
    return res.status(201).json(
      await Message.create({
        conversationId: conversation._id,
        senderId: req.user.sub,
        body,
      }),
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = { openConversation, listMine, listMessages, sendMessage };
