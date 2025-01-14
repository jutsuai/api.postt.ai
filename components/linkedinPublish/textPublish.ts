import axios from "axios";
import { Post } from "../../models";
import getBinaryFromUrl from "../getBinaryFromUrl";

const textPublish = async (postId: any) => {
  const post = (await Post.findById(postId).populate("createdBy")) as any;

  try {
    const createdBy = post?.createdBy;
    const accessToken = createdBy?.tokens?.management?.access_token;

    console.log("post", post);

    if (!accessToken) {
      return {
        data: null,
        error: "User not authenticated",
      };
    }

    // Determine the author URN
    const authorUrn =
      post.authorType === "organization"
        ? `urn:li:organization:${post.author}`
        : `urn:li:person:${post.author}`;

    // 4. Create the linkedin post
    const postData = {
      author: authorUrn,
      commentary: post.commentary,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
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
        // Extract the post ID from the header
        const linkedinPostId =
          res.headers["x-linkedin-id"] ||
          res.headers["x-restli-id"] ||
          res.data.id;
        console.log("LinkedIn Post ID:", linkedinPostId);

        post.linkedinPostId = linkedinPostId;
        post.status = "published";
        post.publishedAt = new Date();
        post.save();
      })
      .catch((err) => {
        console.log("err", err.response.data);
      });

    return {
      data: post,
      error: null,
    };
  } catch (error: any) {
    console.error("Error publishPostLinkedin :", error);
    post.status = "failed";
    await post.save();

    return {
      data: null,
      error: "Failed to save organization details",
    };
  }
};

export default textPublish;
