const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, trim: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 1 },
    image: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
