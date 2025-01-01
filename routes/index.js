const express = require("express");

const router = express.Router();

// const linkedin = require("./linkedin");
const linkedinOld = require("./older/linkedin");

router.use("/auth", require("./auth"));
router.use("/auth/linkedin", require("./auth/linkedin"));

router.use("/linkedinOld", linkedinOld);

router.use("/linkedin/organizations", require("./linkedin/organizations"));

// carousel routes
router.use("/create/carousel", require("./create/carousel/index"));
router.use("/create/carousel/generate", require("./create/carousel/generate"));

module.exports = router;
