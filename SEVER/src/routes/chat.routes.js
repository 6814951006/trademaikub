const express = require("express");
const authenticate = require("../middlewares/auth.middleware");
const {
  openConversation,
  listMine,
  listMessages,
  sendMessage,
} = require("../controllers/chat.controller");

const router = express.Router();
router.use(authenticate);
router.post("/conversations", openConversation);
router.get("/conversations/mine", listMine);
router.get("/conversations/:id/messages", listMessages);
router.post("/conversations/:id/messages", sendMessage);
module.exports = router;
