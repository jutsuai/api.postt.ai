import axios from "axios";
import { Post } from "../../models";
import getBinaryFromUrl from "../getBinaryFromUrl";

const imagePublish = async (postId: any) => {
  try {
    console.log("Fetching post from database...");
    const post = (await Post.findById(postId).populate("createdBy")) as any;
    console.log("Post fetched successfully:", post);

    const createdBy = post?.createdBy;
    const accessToken = createdBy?.tokens?.management?.access_token;

    if (!accessToken) {
      console.error("Access token not found. User not authenticated.");
      return {
        data: null,
        error: "User not authenticated",
      };
    }

    console.log("Access token retrieved successfully.");

    // Determine the author URN
    const authorUrn =
      post.authorType === "organization"
        ? `urn:li:organization:${post.author}`
        : `urn:li:person:${post.author}`;

    console.log(`Author URN determined: ${authorUrn}`);

    // 1. Register the Image Upload
    const { data: registerResponse } = await registerImage({
      accessToken,
      authorUrn: authorUrn,
    });

    const { uploadUrl, asset } = registerResponse as any;

    // 2. Upload the Image
    const uploadResponse = await uploadImage({
      uploadUrl,
      media: post.media,
    });

    console.log("Image uploaded to LinkedIn successfully.");

    // 3. Create the LinkedIn Post
    const postData = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: post.commentary,
          },
          shareMediaCategory: "IMAGE",
          media: [
            {
              status: "READY",
              description: {
                text: post?.media?.name.split(".")[0] || "Post Image",
              },
              media: asset,
              title: {
                text: post?.media?.name.split(".")[0] || "Post Image",
              },
            },
          ],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    console.log("Creating LinkedIn post with the following data:", postData);

    const postResponse = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      postData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Update the post status in your database
    post.linkedinPostId = postResponse.data.id;
    post.status = "published";
    post.publishedAt = new Date();
    await post.save();

    return {
      data: post,
      error: null,
    };
  } catch (error: any) {
    console.error("Error in publishPostLinkedin:", error);
    return {
      data: null,
      error: "Failed to publish post on LinkedIn",
    };
  }
};

export default imagePublish;

const registerImage = async ({
  accessToken,
  authorUrn,
}: {
  accessToken: string;
  authorUrn: string;
}) => {
  try {
    // 1. Register the Image Upload
    const registerResponse = await axios.post(
      "https://api.linkedin.com/v2/assets?action=registerUpload",
      {
        registerUploadRequest: {
          owner: authorUrn,
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const uploadUrl =
      registerResponse?.data?.value?.uploadMechanism?.[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ]?.uploadUrl;
    const asset = registerResponse?.data?.value?.asset;

    return {
      data: {
        uploadUrl,
        asset,
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Error registering image:", error);
    return {
      data: null,
      error: "Failed to register image",
    };
  }
};

const uploadImage = async ({
  uploadUrl,
  media,
}: {
  uploadUrl: string;
  media: any;
}) => {
  try {
    // 2. Upload the Image
    const { data: imageBuffer, error } = (await getBinaryFromUrl(
      media.url
    )) as any;

    if (error) {
      console.error("Error downloading image:", error);
      return {
        data: null,
        error: "Failed to download image",
      };
    }

    await axios.post(uploadUrl, imageBuffer, {
      headers: {
        "Content-Type": media.fileType,
        "Content-Length": imageBuffer?.length,
      },
    });

    return {
      data: null,
      error: null,
    };
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return {
      data: null,
      error: "Failed to upload image",
    };
  }
};
