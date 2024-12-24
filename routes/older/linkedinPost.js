const express = require("express");
const User = require("../../models/user");
const { default: axios } = require("axios");
const router = express.Router();

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const post = `**Embracing Lifelong Learning: A Key to Professional Success**

In today's fast-paced and ever-changing professional environment, the concept of lifelong learning has become more crucial than ever. The rapid advancement of technology and the constant evolution of industry standards demand that professionals continually update their skills and knowledge to remain competitive.

**The Necessity of Continuous Learning**

Gone are the days when a single degree could sustain a lifelong career. According to a report by the World Economic Forum, over half of all employees will require significant reskilling and upskilling by 2025 to meet the demands of emerging technologies and changing job roles. This statistic underscores the importance of adopting a mindset of continuous learning to adapt to new challenges and opportunities.

**Benefits of Lifelong Learning**

1. **Career Advancement:** Engaging in continuous learning enhances your skill set, making you more valuable to current and potential employers. It opens doors to new career opportunities and positions you as a proactive and adaptable professional.

2. **Personal Growth:** Learning new concepts and skills fosters personal development, boosting confidence and satisfaction. It encourages curiosity and keeps the mind engaged.

3. **Adaptability:** In a world where industries are rapidly evolving, the ability to learn and adapt is a significant asset. Continuous learning equips you to navigate changes effectively and stay ahead of industry trends.

**Strategies for Embracing Lifelong Learning**

- **Set Learning Goals:** Identify areas where you want to grow and set specific, achievable learning objectives.

- **Leverage Online Resources:** Utilize platforms like LinkedIn Learning, Coursera, and Udemy to access courses that fit your schedule and interests.

- **Join Professional Networks:** Engage with professional groups and communities to learn from peers and industry leaders.

- **Seek Feedback:** Regularly ask for feedback to identify areas for improvement and to guide your learning journey.

**Conclusion**

Embracing lifelong learning is not just a professional necessity but a personal commitment to growth and excellence. By continually updating your skills and knowledge, you position yourself for sustained success in an ever-evolving professional landscape.
`;

router
  .post("/text", async (req, res, next) => {
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
  .post("/upload", upload.single("file"), async (req, res) => {
    const { accessToken, sub, postContent } = req.body;
    const file = req.file;

    console.log("--------------- req.body : ", req.body);
    console.log("--------------- file : ", file);

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      // Step 1: Register the upload
      // const registerResponse = await axios.post(
      //   "https://api.linkedin.com/rest/documents?action=initializeUpload",
      //   {
      //     initializeUploadRequest: {
      //       owner: `urn:li:person:${sub}`,
      //     },
      //   },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${accessToken}`,
      // "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
      //       "X-RestLi-Protocol-Version": "2.0.0",
      //       "Content-Type": "application/json",
      //     },
      //   }
      // );

      // const { uploadUrl, document } = registerResponse.data.value;

      // console.log(
      //   "-------------------------- registerResponse.data : ",
      //   registerResponse.data
      // );

      // // Step 2: Upload the document
      // await axios.put(uploadUrl, file.buffer, {
      //   headers: {
      //     "Content-Type": file.mimetype,
      //   },
      // });

      // Step 3: Create the post
      // const postData = {
      //   author: `urn:li:person:${sub}`,
      //   commentary: postContent,
      //   visibility: "PUBLIC",
      //   distribution: {
      //     feedDistribution: "MAIN_FEED",
      //     targetEntities: [],
      //     thirdPartyDistributionChannels: [],
      //   },
      //   content: {
      //     media: {
      //       title: file?.originalname,
      //       id: document,
      //     },
      //   },
      //   lifecycleState: "PUBLISHED",
      //   isReshareDisabledByAuthor: false,
      // };
      const postData = {
        author: `urn:li:person:${sub}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: post,
            },
            shareMediaCategory: "ARTICLE",
            media: [
              {
                status: "READY",
                description: {
                  text: post,
                },
                originalUrl: "https://dokan.gg",
                title: {
                  text: "This is a title for an Article post",
                },
              },
            ],
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      await axios
        .post("https://api.linkedin.com/v2/ugcPosts", postData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
        })
        .then((response) => {
          console.log(
            "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx response : ",
            response.data
          );
        })
        .catch((error) => {
          console.log(
            "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx error : ",
            error.response.data
          );
        });

      res.json({ message: "Post created successfully" });
    } catch (error) {
      console.error("Error uploading and posting document:", error);
      res.status(500).json({
        message: "Failed to upload and create the post",
        error: error.response ? error.response.data : error.message,
      });
    }
  });
module.exports = router;
