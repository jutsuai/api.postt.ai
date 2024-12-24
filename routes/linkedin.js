const express = require("express");
const { default: axios } = require("axios");
const router = express.Router();

router
  .get("/accessToken", async (req, res, next) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    // const redirectUri = encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI);
    const redirectUri = encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI);
    const scope = encodeURIComponent(
      "r_organization_followers r_organization_social rw_organization_admin r_organization_social_feed w_member_social w_organization_social r_basicprofile w_organization_social_feed w_member_social_feed r_1st_connections_size"
    );
    const state = "randomstring"; // Use a secure method for generating state

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope,
    });

    console.log("=========> ", params.toString());
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;

    res.redirect(url);
  })
  .post("/callback", async (req, res, next) => {
    try {
      const { code } = req.body;

      console.log(code);

      if (!code) {
        return res.status(400).send("Authorization code not found");
      }

      // Exchange authorization code for access token
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

      const data = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      });

      const tokenResponse = await axios.post(
        "https://www.linkedin.com/oauth/v2/accessToken",
        data,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          validateStatus: (status) => status < 500,
        }
      );

      const { access_token: accessToken } = tokenResponse.data;

      const { data: userInfo } = await axios.get(
        "https://api.linkedin.com/v2/me",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const response = {
        ...userInfo,
        tokens: tokenResponse.data,
      };

      return res.status(200).send(response);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error during LinkedIn authentication");
    }
  })
  .post("/linkedin/userinfo", async (req, res, next) => {
    const { accessToken } = req.body;
    // Exchange authorization code for access token
    const { data } = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return res.json(data);
  })
  .post("/linkedin/getOrg", async (req, res, next) => {
    try {
      const { accessToken } = req.body;

      console.log(accessToken);

      if (!accessToken) {
        return res.status(400).send("Authorization accessToken not found");
      }

      // Exchange authorization code for access token

      const tokenResponse = await axios.get(
        "https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:{personId})",
        {
          headers: { Authorization: `Bearer ${accessToken}` },

          // headers: {
          //   "Content-Type": "application/x-www-form-urlencoded",
          // },
        }
      );

      return res.status(200).send(tokenResponse?.data);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error during LinkedIn authentication");
    }
  })
  .post("/linkedin/post/text", async (req, res, next) => {
    const {
      accessToken,

      postContent,
      sub,
    } = req.body;

    const postData = {
      author: `urn:li:person:${sub}`,
      commentary: postContent,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
      },
      lifecycleState: "PUBLISHED",
    };

    const response = await axios.post(
      "https://api.linkedin.com/rest/posts",
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
  })
  .post("/linkedin/callback", async (req, res, next) => {
    const { code } = req.body;

    console.log(code);

    if (!code) {
      return res.status(400).send("Authorization code not found");
    }

    try {
      // Exchange authorization code for access token
      const accessToken = getAccessToken(code);
      console.log({ accessToken });

      const userInfo = getUserInfo(accessToken);

      console.log("userInfo  : ", JSON.stringify(userInfo, null, 2));

      return res.json(profileResponse.data);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error during LinkedIn authentication");
    }
  });

module.exports = router;
