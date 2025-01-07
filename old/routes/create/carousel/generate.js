const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { slides, customizations, createdBy } = req.body;

    let urls = [];

    // Generate URLs for each slide
    slides?.forEach((slide) => {
      const params = new URLSearchParams({
        init: true,
        createdBy: JSON.stringify(createdBy),
        pageType: slide.pageType,
        customizations: JSON.stringify(customizations),
        curIndex: slide.curIndex,
        title: slide.title,
        description: slide.description,
        image: slide.image,
      });

      const url = `http://localhost:3000/restricted/linkedin/carousel?${params}`;
      urls.push(url);
    });

    if (urls.some((url) => !url)) {
      return res.status(400).send("Please provide valid website URLs.");
    }

    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const pdfBuffers = [];

    for (const websiteUrl of urls) {
      const page = await browser.newPage();

      // Set the viewport size
      // await page.setViewport({ width: 512, height: 512 * 1.25 });

      // Navigate to the website
      await page.goto(websiteUrl, { waitUntil: "networkidle0" });

      // Generate a PDF for this page
      const pdfBuffer = await page.pdf({
        printBackground: true,
        width: customizations.width || 512,
        height: customizations.height || 640,
      });
      pdfBuffers.push(pdfBuffer);

      await page.close();
    }

    // Close the browser
    await browser.close();

    // Create a new PDF document using pdf-lib
    const finalPdfDoc = await PDFDocument.create();

    for (const pdfBuffer of pdfBuffers) {
      const pdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await finalPdfDoc.copyPages(
        pdf,
        pdf.getPageIndices()
      );
      copiedPages.forEach((page) => finalPdfDoc.addPage(page));
    }

    // Save the combined PDF
    const finalPdfBuffer = await finalPdfDoc.save();

    // Save the PDF to the file system
    const outputDir = path.resolve(__dirname, "../output");
    const fileName = `slides_combined_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(filePath, finalPdfBuffer);
    console.log(`PDF saved at: ${filePath}`);

    // Send the PDF as a response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(finalPdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    next(error);
  }
});

module.exports = router;
