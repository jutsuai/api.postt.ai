const express = require("express");
const LinkedinCarousel = require("../../../models/linkedin/linkedinCarousel");

const router = express.Router();

// router.post("/", async (req, res, ) => {
router
  .get("/", async (req, res) => {
    try {
      const carousels = await LinkedinCarousel.find();

      res.status(200).json(carousels);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  })
  .get("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const carousel = await LinkedinCarousel.findById(id);

      res.status(200).json(carousel);
    } catch (error) {
      console.error("Error generating PDF:", error);

      res.status(500).send("Failed to find linkedin carousel");
    }
  })
  .post("/", async (req, res) => {
    try {
      const { prompt } = req.body;

      const carousel = new LinkedinCarousel({
        slides,
        customizations,
        createdBy,
      });

      await carousel.save();

      res.status(200).json(carousel);
    } catch (error) {
      console.error("Error generating PDF:", error);

      res.status(500).send("Failed to generate PDF");
    }
  })
  .put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { slides, customizations, createdBy } = req.body;

      const carousel = await LinkedinCarousel.findByIdAndUpdate(
        id,
        { slides, customizations, createdBy },
        { new: true }
      );

      res.status(200).json(carousel);
    } catch (error) {
      console.error("Error generating PDF:", error);

      res.status(500).send("Failed to update linkedin carousel");
    }
  })
  .delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await LinkedinCarousel.findByIdAndDelete(id);

      res.status(200).send("Linkedin carousel deleted successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);

      res.status(500).send("Failed to delete linkedin carousel");
    }
  });

module.exports = router;
