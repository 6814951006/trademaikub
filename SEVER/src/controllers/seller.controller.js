const Seller = require("../models/seller.model");
const Review = require("../models/review.model");
const Product = require("../models/product.model");

const numericRating = (value) =>
  Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 5;

const ratingSummary = (reviews) => {
  const fields = [
    "productRating",
    "shippingRating",
    "conditionRating",
    "communicationRating",
  ];
  const summary = Object.fromEntries(fields.map((field) => [field, 0]));
  reviews.forEach((review) =>
    fields.forEach((field) => {
      summary[field] += review[field];
    }),
  );
  fields.forEach((field) => {
    summary[field] = reviews.length
      ? Number((summary[field] / reviews.length).toFixed(1))
      : 0;
  });
  summary.overall = reviews.length
    ? Number(
        (
          fields.reduce((total, field) => total + summary[field], 0) /
          fields.length
        ).toFixed(1),
      )
    : 0;
  summary.totalReviews = reviews.length;
  return summary;
};

const apply = async (req, res, next) => {
  try {
    const {
      storeName,
      phone,
      identityNumber,
      identityDocument,
      description = "",
    } = req.body || {};
    if (
      !storeName?.trim() ||
      !phone?.trim() ||
      !identityNumber?.trim() ||
      !identityDocument?.trim()
    ) {
      return res.status(400).json({
        message:
          "Store name, phone and identity verification details are required",
      });
    }
    const seller = await Seller.findOneAndUpdate(
      { userId: req.user.sub },
      {
        storeName: storeName.trim(),
        phone: phone.trim(),
        identityNumber: identityNumber.trim(),
        identityDocument: identityDocument.trim(),
        description: description.trim(),
        status: "pending",
        rejectionReason: "",
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
    return res.status(201).json({
      seller,
      message: "Seller application submitted for verification",
    });
  } catch (error) {
    return next(error);
  }
};

const getMine = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.sub });
    return res.json(seller || null);
  } catch (error) {
    return next(error);
  }
};

const getStore = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ status: "approved" }).populate(
      "userId",
      "username email",
    );
    if (!seller || seller.userId.username !== req.params.username)
      return res.status(404).json({ message: "Store not found" });
    const reviews = await Review.find({ sellerId: seller._id })
      .populate("reviewerId", "username")
      .sort({ createdAt: -1 });
    const products = await Product.find({ sellerId: seller._id }).sort({
      createdAt: -1,
    });
    return res.json({
      seller,
      reviews,
      products,
      ratings: ratingSummary(reviews),
    });
  } catch (error) {
    return next(error);
  }
};

const listProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate({
        path: "sellerId",
        match: { status: "approved" },
        populate: { path: "userId", select: "username" },
      })
      .sort({ createdAt: -1 });
    return res.json(products.filter((product) => product.sellerId));
  } catch (error) {
    return next(error);
  }
};

const addReview = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({ status: "approved" }).populate(
      "userId",
      "username",
    );
    if (!seller || seller.userId.username !== req.params.username)
      return res.status(404).json({ message: "Store not found" });
    if (seller.userId._id.toString() === req.user.sub)
      return res
        .status(400)
        .json({ message: "You cannot review your own store" });
    const {
      productRating,
      shippingRating,
      conditionRating,
      communicationRating,
      comment = "",
    } = req.body || {};
    if (
      ![
        productRating,
        shippingRating,
        conditionRating,
        communicationRating,
      ].every(numericRating)
    )
      return res
        .status(400)
        .json({ message: "Each rating must be an integer from 1 to 5" });
    const review = await Review.create({
      sellerId: seller._id,
      reviewerId: req.user.sub,
      productRating,
      shippingRating,
      conditionRating,
      communicationRating,
      comment: comment.trim(),
    });
    return res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000)
      return res
        .status(409)
        .json({ message: "You have already reviewed this store" });
    return next(error);
  }
};

const approve = async (req, res, next) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      { status: "approved", rejectionReason: "" },
      { returnDocument: "after" },
    );
    if (!seller)
      return res.status(404).json({ message: "Seller application not found" });
    return res.json(seller);
  } catch (error) {
    return next(error);
  }
};

const addProduct = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({
      userId: req.user.sub,
      status: "approved",
    });
    if (!seller)
      return res
        .status(403)
        .json({ message: "An approved seller account is required" });
    const {
      name,
      category,
      description = "",
      price,
      stock = 1,
      image = "",
    } = req.body || {};
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    if (
      !name?.trim() ||
      !category?.trim() ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0 ||
      !Number.isInteger(parsedStock) ||
      parsedStock < 0
    )
      return res.status(400).json({ message: "Product details are invalid" });
    const product = await Product.create({
      sellerId: seller._id,
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      price: parsedPrice,
      stock: parsedStock,
      image: image.trim(),
    });
    return res.status(201).json(product);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  apply,
  getMine,
  getStore,
  listProducts,
  addReview,
  approve,
  addProduct,
};
