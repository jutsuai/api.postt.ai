const express = require("express");
const User = require("../models/user");
const { default: axios } = require("axios");
const router = express.Router();

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router
  .post("/get-posts", async (req, res, next) => {
    try {
      const { accessToken, sub } = req.body;

      console.log(accessToken);
      console.log("========== sub : ", sub);

      if (!accessToken) {
        return res.status(400).send("Access token is required");
      }

      // LinkedIn API endpoint to get user's posts

      const response = await axios.get("https://api.linkedin.com/v2/ugcPosts", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
          "X-Restli-Protocol-Version": "2.0.0",
        },
        params: {
          q: "authors",
          authors: `List(${sub})`,
        },
      });

      console.log("response : ", response.data);

      return res.status(200).json({
        data: response.data,
      });
    } catch (error) {
      console.error(
        "Error fetching LinkedIn posts:",
        error.response?.data || error.message
      );
      res.status(500).send("Error fetching LinkedIn posts");
    }
  })
  .post("/get-org", async (req, res, next) => {
    try {
      const { accessToken, sub } = req.body;

      console.log(accessToken);

      if (!accessToken) {
        return res.status(400).send("Authorization accessToken not found");
      }

      // Exchange authorization code for access token

      const tokenResponse = await axios.get(
        `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:${sub})`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
            "X-Restli-Protocol-Version": "2.0.0",
          },

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
  });
// router.post("/get-posts", async (req, res, next) => {
//   try {
//     const { accessToken, sub } = req.body;

//     console.log(accessToken);
//     console.log("========== sub : ", sub);

//     if (!accessToken) {
//       return res.status(400).send("Access token is required");
//     }

//     // LinkedIn API endpoint to get user's posts
//     const endpoint = "https://api.linkedin.com/v2/posts";

//     const { data } = await axios.get(endpoint, {
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//         "Content-Type": "application/json",
//       },
//       params: {
//         q: "authors",
//         authors: `urn:li:person:${sub}`, // Replace with the user's LinkedIn URN
//       },
//     });

//     // Transform or process the data if needed
//     const posts = data.elements.map((post) => ({
//       id: post.id,
//       text: post.specificContent?.["com.linkedin.ugc.ShareContent"]
//         ?.shareCommentary?.text,
//       createdAt: post.created?.time,
//       visibility: post.visibility?.["com.linkedin.ugc.MemberNetworkVisibility"],
//     }));

//     return res.status(200).json(posts);
//   } catch (error) {
//     console.error(
//       "Error fetching LinkedIn posts:",
//       error.response?.data || error.message
//     );
//     res.status(500).send("Error fetching LinkedIn posts");
//   }
// });

module.exports = router;
