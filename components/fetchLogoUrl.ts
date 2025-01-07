const axios = require("axios");

const fetchLogoUrl = async (logoUrn: string, headers: any) => {
  if (!logoUrn) {
    console.error("No logo URN provided.");
    return null;
  }

  const assetId = logoUrn.split(":").pop();
  const assetUrl = `https://api.linkedin.com/rest/assets/${assetId}`;

  try {
    const assetResponse = await axios.get(assetUrl, { headers });
    const assetData = assetResponse.data;

    console.log("------ assetResponse:", assetData);

    // Check for playableStreams
    if (assetData.playableStreams && assetData.playableStreams.length > 0) {
      // Select the desired stream based on resolution or other criteria
      const stream = assetData.playableStreams[0];
      return stream.url;
    }

    // Check for downloadUrl
    if (assetData.downloadUrl) {
      return assetData.downloadUrl;
    }

    console.warn(
      `No playableStreams or downloadUrl found for asset ID ${assetId}.`
    );
    return null;
  } catch (error: any) {
    console.error(
      `Error fetching logo for asset ID ${assetId}:`,
      error.response ? error.response.data : error.message
    );
    return null;
  }
};

export default fetchLogoUrl;
