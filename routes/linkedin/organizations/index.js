const express = require("express");
const fetchOrganizationUrns = require("./_components/fetchOrganizationUrns");
const fetchOrganizationDetails = require("./_components/fetchOrganizationDetails");
const fetchLogoUrl = require("./_components/fetchLogoUrl");
const { default: axios } = require("axios");
const router = express.Router();

const LinkedinProfile = require("../../../models/linkedin");

router
  .get("/", async (req, res) => {
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
      const organizationIds = organizationUrns.map((urn) =>
        urn.split(":").pop()
      );

      console.log("========= Organization IDs:", organizationIds);

      // Fetch details and logos for each organization
      const organizations = await Promise.all(
        organizationIds.map(async (id) => {
          const orgDetails = await fetchOrganizationDetails(id, headers);
          console.log("=========== orgDetails : ", orgDetails);

          const logoUrl = await fetchLogoUrl(
            orgDetails.logoV2 ? orgDetails.logoV2.original : null,
            headers
          );

          return {
            id: id,
            name: orgDetails.localizedName,
            slug: orgDetails.vanityName,
            logo: logoUrl,

            // Add other desired fields here
          };

          // Save organization details to MongoDB
          const linkedinProfile = new LinkedinProfile({
            createdBy: "admin",
            profileId: id,
            type: "organization",
            name: orgDetails.localizedName,
            slug: orgDetails.vanityName,
            avatar: logoUrl,
            websiteUrl: orgDetails.websiteUrl,
            linkedinUrl: orgDetails.linkedinUrl,
            description: orgDetails.description,
            tags: orgDetails.tags,
            industries: orgDetails.industries,
          });
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
  })
  .post("/:orgId/post/text", async (req, res, next) => {
    try {
      const { orgId } = req.params;
      const { accessToken, content: postContent, sub } = req.body;

      const postData = {
        author: `urn:li:organization:${orgId}`,
        commentary: postContent,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      };

      const response = await axios.post(
        "https://api.linkedin.com/v2/posts",
        postData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
            "X-RestLi-Protocol-Version": "2.0.0",
            "Content-Type": "application/json",
          },
        }
      );

      console.log("response : ", response);

      return res.send({
        message: "Post created successfully",
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error during LinkedIn authentication");
    }
  });

module.exports = router;
