const router = require("express").Router();
const { getMessages } = require("../controllers/chatController");

router.get("/", getMessages);

module.exports = router;
