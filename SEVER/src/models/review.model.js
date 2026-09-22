const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productRating: { type: Number, required: true, min: 1, max: 5 },
    shippingRating: { type: Number, required: true, min: 1, max: 5 },
    conditionRating: { type: Number, required: true, min: 1, max: 5 },
    communicationRating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);

reviewSchema.index({ sellerId: 1, reviewerId: 1 }, { unique: true });
module.exports = mongoose.model("Review", reviewSchema);
