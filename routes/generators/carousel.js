const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const urls = [
      "http://localhost:3000/restricted/linkedin/carousel",
      "http://localhost:3000/",
      "http://localhost:3000/restricted/linkedin/carousel",
      "http://localhost:3000/restricted/linkedin/carousel",
      "http://localhost:3000/restricted/linkedin/carousel",
    ];

    if (urls.some((url) => !url)) {
      return res.status(400).send("Please provide valid website URLs.");
    }

    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const screenshots = [];

    for (const websiteUrl of urls) {
      const page = await browser.newPage();

      // Set the viewport size
      await page.setViewport({ width: 1024, height: 1280 });

      // Navigate to the website
      await page.goto(websiteUrl, { waitUntil: "networkidle2" });

      // Take a screenshot
      const screenshotBuffer = await page.screenshot({
        type: "png",
        fullPage: true,
      });
      screenshots.push(screenshotBuffer);

      await page.close();
    }

    // Close the browser
    await browser.close();

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    for (const screenshotBuffer of screenshots) {
      // Embed the screenshot in the PDF
      const image = await pdfDoc.embedPng(screenshotBuffer);

      // Get the dimensions of the image
      const { width, height } = image;

      // Add a new page to the PDF with the image's dimensions
      const page = pdfDoc.addPage([width, height]);

      // Draw the image onto the page
      page.drawImage(image, {
        x: 0,
        y: 0,
        width,
        height,
      });
    }

    // Save the PDF to a buffer
    const pdfBuffer = await pdfDoc.save();

    // Save the PDF to the file system
    const outputDir = path.resolve(__dirname, "../output");
    const fileName = `screenshots_combined_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(filePath, pdfBuffer);
    console.log(`PDF saved at: ${filePath}`);

    // Send the PDF as a response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    next(error);
  }
});

module.exports = router;
