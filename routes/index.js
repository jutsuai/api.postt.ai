const express = require("express");

const router = express.Router();

// const linkedin = require("./linkedin");
const linkedinOld = require("./older/linkedin");

router.use("/auth", require("./auth"));
router.use("/auth/linkedin", require("./auth/linkedin"));

router.use("/linkedinOld", linkedinOld);

router.use("/linkedin/organizations", require("./linkedin/organizations"));

router.use("/generators/carousel", require("./generators/carousel"));

module.exports = router;
