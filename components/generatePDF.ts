import { Carousel } from "../models";
import { PDFDocument } from "pdf-lib";
import puppeteer from "puppeteer";
import { AWSPut } from "../utils/aws.util";

const generatePDF = async (carouselId: string, userId: string) => {
  try {
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
    };

    // Upload the PDF to S3 using your existing AWSPut function
    const mediaUrl = await AWSPut(params);
    return { data: mediaUrl, error: null };

    // const outputDir = "./output";
    // const fileName = `slides_combined_${Date.now()}.pdf`;
    // const filePath = join(outputDir, fileName);

    // await write(filePath, finalPdfBuffer);
    // console.log(`PDF saved at: ${filePath}`);

    // return { data: filePath, error: null };
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return {
      data: null,
      error: error.message || "An unexpected error occurred.",
    };
  }
};

export default generatePDF;
