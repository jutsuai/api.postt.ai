import axios from "axios";
import { Post } from "../../models";
import getBinaryFromUrl from "../getBinaryFromUrl";

const documentPublish = async (postId: any) => {
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

    const { data: registerResponse } = await registerDocument({
      accessToken,
      authorUrn,
    });
    const { uploadUrl, document } = registerResponse as any;

    const uploadResponse = await uploadDocument({
      uploadUrl,
      media: post.media,
      postId,
    });

    console.log("Upload Response: ", uploadResponse);

    console.log("====================4");
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
      content: {
        media: {
          // title should first 3-4 words of the post commentary or if the commentaryis empty then post.media.name
          title: getPostTitle(post),
          // post?.media?.name.split(".")[0] ||
          // "An document created and uploaded by postt.ai",
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
        console.log(
          "=========== > res.status: ",
          res.status,
          " ---- res.data --- ",
          res
        );

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

const registerDocument = async ({
  accessToken,
  authorUrn,
}: {
  accessToken: string;
  authorUrn: string;
}) => {
  try {
    console.log(
      "Hit registerDocument: ",
      accessToken,
      "  =================   ",
      authorUrn
    );

    // 1. Register the Upload
    const registerResponse = await axios.post(
      "https://api.linkedin.com/rest/documents?action=initializeUpload",
      {
        initializeUploadRequest: {
          owner: authorUrn,
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

    const { uploadUrl, document } = registerResponse.data.value;

    console.log("registerResponse: ", registerResponse.data);

    return {
      data: {
        uploadUrl,
        document,
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Error registering document:", error);
    return {
      data: null,
      error: "Failed to register document",
    };
  }
};

const uploadDocument = async ({
  uploadUrl,
  media,
  postId,
}: {
  uploadUrl: string;
  media: any;
  postId: any;
}) => {
  try {
    // 2. Upload the Document
    const { data, error } = await getBinaryFromUrl(media.url);
    console.log("data", data);
    console.log("error", error);
    console.log("media", media);

    const uploading = await axios.put(uploadUrl, data?.buffer, {
      headers: {
        "Content-Type": media.fileType,
      },
    });

    console.log("Uploading: ", uploading.data);

    return {
      data: uploading.data,
      error: null,
    };
  } catch (error: any) {
    console.error("Error uploading document:", error);
    await Post.findByIdAndUpdate(postId, { status: "failed-upload" });
    return {
      data: null,
      error: error.message || "Failed to upload document",
    };
  }
};

function getPostTitle(post: any) {
  if (post?.commentary && post?.commentary?.trim().length > 0) {
    // Use the first 3-4 words of the commentary as the title
    const words = post.commentary.trim().split(/\s+/).slice(0, 4);
    return words.join(" ");
  } else if (post?.media && post?.media?.name) {
    // Fallback to media name if commentary is empty
    return post?.media?.name?.split(".")[0];
  } else {
    // Provide a default title if neither commentary nor media name exists
    return "Untitled PDF";
  }
}

export default documentPublish;
