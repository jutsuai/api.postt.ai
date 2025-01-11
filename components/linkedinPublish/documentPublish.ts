import axios from "axios";
import { Post } from "../../models";
import getBinaryFromUrl from "../getBinaryFromUrl";

const documentPublish = async (postId: any) => {
  try {
    const post = (await Post.findById(postId).populate("createdBy")) as any;

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
    });

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
          title:
            post?.media?.name.split(".")[0] ||
            "An document created and uploaded by postt.ai",
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

    return {
      data: post,
      error: null,
    };
  } catch (error: any) {
    console.error("Error publishPostLinkedin :", error);

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
}: {
  uploadUrl: string;
  media: any;
}) => {
  try {
    // 2. Upload the Document
    const { data, error } = await getBinaryFromUrl(media.url);
    console.log("data", data);
    console.log("error", error);
    console.log("media", media);

    await axios.put(uploadUrl, data?.buffer, {
      headers: {
        "Content-Type": media.fileType,
      },
    });

    return {
      data: null,
      error: null,
    };
  } catch (error: any) {
    console.error("Error uploading document:", error);
    return {
      data: null,
      error: "Failed to upload document",
    };
  }
};

export default documentPublish;
