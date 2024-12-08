const express = require("express");
const User = require("../models/user");
const { default: axios } = require("axios");
const router = express.Router();

const getAccessToken = async (code) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  console.log("code : ", code);

  const tokenResponse = await axios.post(
    "https://www.linkedin.com/oauth/v2/accessToken",
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  console.log("tokenResponse : ", tokenResponse.data);

  return tokenResponse.data.access_token;
};

const getUserInfo = async (accessToken) => {
  const profileResponse = await axios.get(
    "https://api.linkedin.com/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return profileResponse.data;
};

router
  .get("/linkedin", async (req, res, next) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    // const redirectUri = encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI);
    const redirectUri = encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI);
    const scope = encodeURIComponent("openid profile w_member_social email");
    const state = "randomstring"; // Use a secure method for generating state

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope,
    });

    console.log(params.toString());
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;

    // const url = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;

    console.log(url);
    res.redirect(url);
  })
  .post("/linkedin/accessToken", async (req, res, next) => {
    const { code } = req.body;
    // Exchange authorization code for access token
    const accessToken = await getAccessToken(code);

    return res.json(accessToken);
  })
  .post("/linkedin/userinfo", async (req, res, next) => {
    const { accessToken } = req.body;
    // Exchange authorization code for access token
    const data = await getUserInfo(accessToken);

    return res.json(data);
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
          "LinkedIn-Version": "202401",
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
