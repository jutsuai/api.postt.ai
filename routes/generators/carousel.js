const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const router = express.Router();

const data = {
  createdBy: {
    name: "John Doe",
    username: "john-doe",
    avatar:
      "https://plus.unsplash.com/premium_photo-1710799499285-06c416d1dd96?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },

  //   startSlide: {
  //     visible: true,
  //     title: "How to create a carousel post on LinkedIn",
  //     description: "Learn how to make engaging content.",
  //     image:
  //       "https://plus.unsplash.com/premium_photo-1671829480432-9b0f10d869ef?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  //   },

  slides: [
    {
      pageType: "start",
      visible: true,
      title: "How to create a carousel post on LinkedIn",
      description: "Learn how to make engaging content.",
      image: "https://i.ibb.co.com/1K7VDBQ/bg-light.webp",
    },
    {
      pageType: "slide",
      curIndex: 1,
      title: "Slide 1",
      description: "This is the first slide",
      image: "https://i.ibb.co.com/1K7VDBQ/bg-light.webp",
    },
    {
      pageType: "slide",
      curIndex: 2,
      title: "Slide 2",
      description: "This is the second slide",
      image: "https://i.ibb.co.com/1K7VDBQ/bg-light.webp",
    },
    {
      pageType: "slide",
      curIndex: 3,
      title: "Slide 3",
      description: "This is the third slide",
      image: "https://i.ibb.co.com/1K7VDBQ/bg-light.webp",
    },
    {
      pageType: "end",
      title: "Thank you for watching!",
      description: "Follow me for more content",
      image: "https://i.ibb.co.com/1K7VDBQ/bg-light.webp",
    },
  ],

  customizations: {
    backgroundColor: "#ffffff",
    fontColor: "#000000",
    title: {
      visible: true,
      horizontal: "center", // left | center | right
      vertical: "center", // top | center | bottom
    },
    description: {
      visible: true,
      horizontal: "center", // left | center | right
      vertical: "center", // top | center | bottom
    },
    createdBy: {
      visible: true,
      horizontal: "left", // left | center | right
      vertical: "center", // top | center | bottom
    },
  },
};

router.post("/", async (req, res, next) => {
  try {
    let urls = [];

    data?.slides?.map((slide) => {
      const params = new URLSearchParams({
        pageType: slide.pageType,
        createdBy: JSON.stringify(data.createdBy),
        customizations: JSON.stringify(data.customizations),
        curIndex: slide.curIndex,
        title: slide.title,
        description: slide.description,
        image: slide.image,
      });

      const url = `http://localhost:3000/restricted/linkedin/carousel?${params}`;

      console.log("=========> ", url);

      urls.push(`http://localhost:3000/restricted/linkedin/carousel?${url}`);
    });

    if (urls.some((url) => !url)) {
      return res.status(400).send("Please provide valid website URLs.");
    }

    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const screenshots = [];

    for (const websiteUrl of urls) {
      const page = await browser.newPage();

      // Set the viewport size
      await page.setViewport({ width: 512, height: 512 * 1.25 });

      // Navigate to the website
      await page.goto(websiteUrl, { waitUntil: "networkidle0" });

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
