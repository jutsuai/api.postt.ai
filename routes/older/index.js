const express = require("express");

const router = express.Router();

const auth = require(".");
const linkedin = require("./linkedin");
const linkedinPost = require("./linkedinPost");

const orgPost = require("./orgPost");

router.use("/auth", auth);
router.use("/linkedin", linkedin);
router.use("/linkedin/post", linkedinPost);
router.use("/linkedin/org", orgPost);

module.exports = router;
