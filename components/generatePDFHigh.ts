// generatePDFHigh.ts with playwright

import { Carousel } from "../models";
import { PDFDocument } from "pdf-lib";
import { chromium } from "playwright";
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
      return `${baseUrl}/restricted/linkedin/carousel/${carouselId}/slide/${index}`;
    });
    console.log("URLs to generate PDF from:", urls);

    if (urls.some((url: string) => !url)) {
      return { data: null, error: "Invalid URL" };
    }

    const browser = await chromium.launch();
    const pdfBuffers = [];

    for (const websiteUrl of urls) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(websiteUrl, { waitUntil: "networkidle" });

      // Wait for 2 seconds to ensure page is fully loaded
      await page.waitForTimeout(2000);

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        width: customizations?.size?.width || 512,
        height: customizations?.size?.height || 640,
      });
      pdfBuffers.push(pdfBuffer);

      await page.close();
      await context.close();
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
