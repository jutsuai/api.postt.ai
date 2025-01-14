// generatePDF.ts with playwright

import { Carousel } from "../models";
import { PDFDocument } from "pdf-lib";
import { webkit } from "playwright";
import { AWSPut } from "../utils/aws.util";

const baseUrl =
  process.env.NODE_ENV === "production"
    ? "https://app.postt.ai"
    : "http://localhost:3000";

const generatePDF = async ({
  carouselId,
  userId,
}: {
  carouselId: any;
  userId: string;
}) => {
  try {
    console.log(
      "Generating Normal Quality PDF for carousel with ID:",
      carouselId
    );
    console.log("User ID:", userId);

    const carousel = (await Carousel.findById(carouselId)) as any;

    if (!carousel) {
      throw new Error(`Carousel with ID ${carouselId} not found.`);
    }

    const { slides, customizations }: any = carousel;

    const urls = slides.map((slide: any, index: any) => {
      return `${baseUrl}/restricted/linkedin/carousel/${carouselId}/slide/${index}`;
    });
    console.log("URLs to generate PDF from:", urls);

    if (urls.some((url: string) => !url)) {
      return { data: null, error: "Invalid URL" };
    }

    const browser = await webkit.launch();
    const screenshotBuffers = [];

    for (const websiteUrl of urls) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(websiteUrl, { waitUntil: "networkidle" });

      // Wait for 2 seconds to ensure all resources are loaded
      await page.waitForTimeout(2000);

      console.log("Customizations:", customizations);

      // Capture the screenshot of the page as an image buffer
      const screenshotBuffer = await page.screenshot({
        type: "jpeg",
        quality: 100,
        clip: {
          x: 0,
          y: 0,
          width: customizations?.size?.width || 512,
          height: customizations?.size?.height || 640,
        },
      });

      screenshotBuffers.push(screenshotBuffer);
      await page.close();
      await context.close();
    }

    await browser.close();

    const finalPdfDoc = await PDFDocument.create();

    for (const imageBuffer of screenshotBuffers) {
      const pdfImage = await finalPdfDoc.embedJpg(imageBuffer as any);
      const page = finalPdfDoc.addPage([pdfImage.width, pdfImage.height]);
      page.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: pdfImage.width,
        height: pdfImage.height,
      });
    }

    const finalPdfBuffer = await finalPdfDoc.save();

    // Prepare the file for uploading to AWS S3
    const fileName = `slides_${carouselId}.pdf`;
    const fileType = "application/pdf"; // PDF MIME type

    const params = {
      Key: `${process?.env?.NODE_ENV}/linkedin/${userId}/posts/carousels/${fileName}`,
      ContentType: fileType,
      Body: finalPdfBuffer,
    };

    // Upload the PDF to S3 using your existing AWSPut function
    const mediaUrl = await AWSPut(params);
    return {
      data: {
        url: mediaUrl,
        fileType: fileType,
        name: fileName,
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return {
      data: null,
      error: error.message || "An unexpected error occurred.",
    };
  }
};

export default generatePDF;

/*
import { Carousel } from "../models";
import { PDFDocument } from "pdf-lib";
import puppeteer from "puppeteer";
import { AWSPut } from "../utils/aws.util";

const generatePDF = async ({
  carouselId,
  userId,
}: {
  carouselId: any;
  userId: string;
}) => {
  try {
    console.log("Generating PDF for carousel with ID:", carouselId);
    console.log("User ID:", userId);

    const carousel = await Carousel.findById(carouselId);

    if (!carousel) {
      throw new Error(`Carousel with ID ${carouselId} not found.`);
    }

    const { slides, customizations }: any = carousel;
    if (!carousel) {
      throw new Error(`Carousel with ID ${carouselId} not found.`);
    }

    const urls = slides.map((slide: any, index: any) => {
      return `http://localhost:3000/restricted/linkedin/carousel/${carouselId}/slide/${index}`;
    });
    console.log("URLs to generate PDF from:", urls);

    if (urls.some((url: string) => !url)) {
      return { data: null, error: "Invalid URL" };
    }

    const browser = await puppeteer.launch();
    const pdfBuffers = [];

    for (const websiteUrl of urls) {
      const page = await browser.newPage();
      await page.goto(websiteUrl, { waitUntil: "networkidle2" });
      // Wait for 5 seconds
      await page.waitForNetworkIdle({
        idleTime: 2000,
      });

      const pdfBuffer = await page.pdf({
        printBackground: true,
        width: customizations?.size?.width || 512,
        height: customizations?.size?.height || 640,
      });
      pdfBuffers.push(pdfBuffer);

      await page.close();
    }

    await browser.close();

    const finalPdfDoc = await PDFDocument.create();

    for (const pdfBuffer of pdfBuffers) {
      const pdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await finalPdfDoc.copyPages(
        pdf,
        pdf.getPageIndices()
      );
      copiedPages.forEach((page) => finalPdfDoc.addPage(page));
    }

    const finalPdfBuffer = await finalPdfDoc.save();

    // Prepare the file for uploading to AWS S3
    const fileName = `slides_${Date.now()}.pdf`;
    const fileType = "application/pdf"; // PDF MIME type

    const params = {
      Key: `linkedin/${userId}/pdfs/${fileName}`,
      ContentType: fileType,
      Body: finalPdfBuffer,
      ,
    };

    // Upload the PDF to S3 using your existing AWSPut function
    const mediaUrl = await AWSPut(params);
    return {
      data: {
        url: mediaUrl,
        fileType: fileType,
        name: fileName,
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return {
      data: null,
      error: error.message || "An unexpected error occurred.",
    };
  }
};

export default generatePDF;
*/
