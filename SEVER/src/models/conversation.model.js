const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true },
);

conversationSchema.index(
  { buyerId: 1, sellerId: 1, productId: 1 },
  { unique: true },
);
module.exports = mongoose.model("Conversation", conversationSchema);
