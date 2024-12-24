const axios = require("axios");

const fetchLogoUrl = async (logoUrn, headers) => {
  if (!logoUrn) {
    console.error("No logo URN provided.");
    return null;
  }

  console.log("------ logoUrn:", logoUrn);

  const assetId = logoUrn.split(":").pop();
  const assetUrl = `https://api.linkedin.com/rest/assets/${assetId}`;
  //   const assetUrl = `https://api.linkedin.com/v2/assets/D4D0BAQEQZP-78zihhA`;

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
  } catch (error) {
    console.error(
      `Error fetching logo for asset ID ${assetId}:`,
      error.response ? error.response.data : error.message
    );
    return null;
  }
};

module.exports = fetchLogoUrl;

// const { default: axios } = require("axios");

// const fetchLogoUrl = async (logoUrn, headers) => {
//   if (!logoUrn) return null;

//   console.log("------ logoUrn : ", logoUrn);

//   const assetId = logoUrn.split(":").pop();
//   const assetUrl = `https://api.linkedin.com/v2/assets/${assetId}`;

//   try {
//     const assetResponse = await axios.get(assetUrl, { headers });

//     console.log("------ assetResponse : ", assetResponse.data);

//     if (assetResponse.data && assetResponse.data.playableStreams) {
//       // Select the desired stream based on resolution or other criteria
//       const stream = assetResponse.data.playableStreams[0];

//       return stream.url;
//     }

//     return null;
//   } catch (error) {
//     console.error(
//       `Error fetching logo for asset ID ${assetId}:`,
//       error.response ? error.response.data : error.message
//     );
//     return null;
//   }
// };

// module.exports = fetchLogoUrl;
