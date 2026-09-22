const express = require("express");
const authenticate = require("../middlewares/auth.middleware");
const {
  listMyOrders,
  createOrder,
} = require("../controllers/order.controller");

const router = express.Router();

router.use(authenticate);
router.get("/mine", listMyOrders);
router.post("/", createOrder);

module.exports = router;
