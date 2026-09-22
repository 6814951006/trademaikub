const express = require("express");
const authenticate = require("../middlewares/auth.middleware");
const {
  apply,
  getMine,
  getStore,
  listProducts,
  addReview,
  approve,
  addProduct,
} = require("../controllers/seller.controller");

const router = express.Router();
router.get("/store/:username", getStore);
router.get("/products", listProducts);
router.post("/apply", authenticate, apply);
router.get("/mine", authenticate, getMine);
router.post("/products", authenticate, addProduct);
router.post("/store/:username/reviews", authenticate, addReview);
router.patch("/applications/:id/approve", authenticate, (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  return approve(req, res, next);
});

module.exports = router;
