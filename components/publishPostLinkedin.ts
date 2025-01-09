import axios from "axios";
import { Post } from "../models";

const publishPostLinkedin = async (postId: any) => {
  try {
    const post = (await Post.findById(postId).populate("createdBy")) as any;

    const createdBy = post?.createdBy;
    const accessToken = createdBy?.tokens?.management?.access_token;

    console.log("post", accessToken);

    if (!accessToken) {
      return {
        data: null,
        error: "User not authenticated",
      };
    }

    console.log("====================1");

    // 1. Register the Upload
    const registerResponse = await axios.post(
      "https://api.linkedin.com/rest/documents?action=initializeUpload",
      {
        initializeUploadRequest: {
          owner:
            post.authorType?.type === "organization"
              ? `urn:li:organization:${post.author}`
              : `urn:li:person:${post.author}`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
          "X-RestLi-Protocol-Version": "2.0.0",
          "Content-Type": "application/json",
        },
      }
    );

    console.log("====================2");
    const { uploadUrl, document } = registerResponse.data.value;

    // 2. convert url to base64
    const base64 = await axios.get(post.media.url, {
      responseType: "arraybuffer",
    });

    console.log("====================3");
    // 3. Upload the media
    const tryMedia = await axios.put(uploadUrl, base64.data, {
      headers: {
        "Content-Type": post.media.fileType,
      },
    });

    console.log("tryMedia", tryMedia);

    console.log("====================4");
    // 4. Create the linkedin post
    const postData = {
      author:
        post.authorType?.type === "organization"
          ? `urn:li:organization:${post.author}`
          : `urn:li:person:${post.author}`,
      commentary: post.commentary,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      content: {
        media: {
          title: post?.media?.name.split(".")[0] || "Postt Docs",
          id: document,
        },
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };

    console.log("postData", postData);

    await axios
      .post("https://api.linkedin.com/v2/posts", postData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
          //   "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
        },
      })
      .then((res) => {
        console.log("=========== > res", res.data);

        post.linkedinPostId = res.data.id;
        post.status = "published";
        post.publishedAt = new Date();
        post.save();
      })
      .catch((err) => {
        console.log("err", err.response.data);
      });
    console.log("====================5");

    return {
      data: post,
      error: null,
    };
  } catch (error: any) {
    console.error(
      "Error publishPostLinkedin :",
      error
      //   error.response.data || error.message
    );
    // throw new Error("Failed to save organization details");

    return {
      data: null,
      error: "Failed to save organization details",
    };
  }
};
export default publishPostLinkedin;
