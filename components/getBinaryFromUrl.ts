import axios from "axios";

const getBinaryFromUrl = async (url: string) => {
  try {
    // 2. Download the image
    console.log(`Downloading image from URL: ${url}`);
    const imageResponse = await axios.get(url, {
      responseType: "arraybuffer",
    });

    const imageBuffer = Buffer.from(imageResponse.data, "binary");
    const contentType = imageResponse.headers["content-type"]; // Extract the Content-Type header

    return {
      data: { buffer: imageBuffer, contentType },
      error: null,
    };
  } catch (error) {
    console.error("Error downloading image:", error);
    return {
      data: null,
      contentType: null,
      error: error,
    };
  }
};

export default getBinaryFromUrl;
