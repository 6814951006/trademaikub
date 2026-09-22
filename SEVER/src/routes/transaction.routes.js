const express = require("express");
const authenticate = require("../middlewares/auth.middleware");
const {
  createTransaction,
  listMine,
} = require("../controllers/transaction.controller");

const router = express.Router();
router.use(authenticate);
router.get("/mine", listMine);
router.post("/", createTransaction);
module.exports = router;
