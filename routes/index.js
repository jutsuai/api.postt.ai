const express = require("express");

const router = express.Router();

const auth = require("./auth");
const post = require("./linkedinPost");
const orgPost = require("./orgPost");

router.use("/auth", auth);
router.use("/linkedin/post", post);
router.use("/linkedin/org", orgPost);

module.exports = router;
