const express = require("express");
const authenticate = require("../middlewares/auth.middleware");
const {
  apply,
  getMine,
  listApplications,
  getStore,
  listProducts,
  addReview,
  approve,
  addProduct,
  uploadProductImage,
} = require("../controllers/seller.controller");

const router = express.Router();
router.get("/store/:username", getStore);
router.get("/products", listProducts);
router.post("/apply", authenticate, apply);
router.get("/mine", authenticate, getMine);
router.get("/applications", authenticate, (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  return listApplications(req, res, next);
});
router.post(
  "/uploads/product-image",
  authenticate,
  express.raw({ type: ["image/jpeg", "image/png", "image/webp", "image/gif"], limit: "4mb" }),
  uploadProductImage,
);
router.post("/products", authenticate, addProduct);
router.post("/store/:username/reviews", authenticate, addReview);
router.patch("/applications/:id/approve", authenticate, (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin access required" });
  return approve(req, res, next);
});

module.exports = router;
