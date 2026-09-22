const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    currency: { type: String, required: true },
    balance: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
    frozenBalance: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Wallet", walletSchema);
