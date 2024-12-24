const express = require("express");

const router = express.Router();

// const linkedin = require("./linkedin");
const linkedinOld = require("./older/linkedin");

router.use("/linkedinOld", linkedinOld);

router.use("/linkedin", require("./linkedin/index"));
router.use("/linkedin/organizations", require("./linkedin/organizations"));

module.exports = router;
