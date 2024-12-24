const express = require("express");
const fetchOrganizationUrns = require("./_components/fetchOrganizationUrns");
const fetchOrganizationDetails = require("./_components/fetchOrganizationDetails");
const fetchLogoUrl = require("./_components/fetchLogoUrl");
const router = express.Router();

router.get("/", async (req, res) => {
  const { accessToken } = req.query;

  if (!accessToken) {
    return res.status(400).send("Access token is required");
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
  };

  try {
    // Fetch organization URNs
    const organizationUrns = await fetchOrganizationUrns(accessToken);

    // Extract organization IDs from URNs
    const organizationIds = organizationUrns.map((urn) => urn.split(":").pop());

    // Fetch details and logos for each organization
    const organizations = await Promise.all(
      organizationIds.map(async (id) => {
        const orgDetails = await fetchOrganizationDetails(id, headers);

        const logoUrl = await fetchLogoUrl(
          orgDetails.logoV2 ? orgDetails.logoV2.original : null,
          headers
        );

        return {
          name: orgDetails.localizedName,
          logo: logoUrl,
          // Add other desired fields here
        };
      })
    );

    console.log("Organizations:", organizations);
    res.status(200).json(organizations);
  } catch (error) {
    console.error(
      "Error fetching organization details:",
      error.response ? error.response.data : error.message
    );
    res.status(500).send("Error fetching organization details");
  }
});

module.exports = router;
