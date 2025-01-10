import axios from "axios";
import { Post } from "../models";
import getBinaryFromUrl from "./getBinaryFromUrl";

const publishPostLinkedin = async (postId: any) => {
  try {
    console.log("Fetching post from database...");
    const post = (await Post.findById(postId).populate("createdBy")) as any;
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
      post.authorType?.type === "organization"
        ? `urn:li:organization:${post.author}`
        : `urn:li:person:${post.author}`;

    console.log(`Author URN determined: ${authorUrn}`);

    // 1. Register the Image Upload
    console.log("Registering image upload...");
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

    // 2. Upload the Image
    const { data: imageBuffer, error } = await getBinaryFromUrl(post.media.url);

    if (error) {
      console.error("Error downloading image:", error);
      return {
        data: null,
        error: "Failed to download image",
      };
    }

    await axios.post(uploadUrl, imageBuffer, {
      headers: {
        "Content-Type": post.media.fileType,
        "Content-Length": imageBuffer?.length,
      },
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

    console.log(
      "LinkedIn post created successfully. Response data:",
      postResponse.data
    );

    // Update the post status in your database
    post.linkedinPostId = postResponse.data.id;
    post.status = "published";
    post.publishedAt = new Date();
    await post.save();

    console.log("Post status updated in the database.");

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

export default publishPostLinkedin;

// import axios from "axios";
// import { Post } from "../models";

// const publishPostLinkedin = async (postId: any) => {
//   try {
//     const post = (await Post.findById(postId).populate("createdBy")) as any;

//     const createdBy = post?.createdBy;
//     const accessToken = createdBy?.tokens?.management?.access_token;

//     console.log("post", accessToken);

//     if (!accessToken) {
//       return {
//         data: null,
//         error: "User not authenticated",
//       };
//     }

//     console.log("====================1");

//     // 1. Register the Upload
//     const registerResponse = await axios.post(
//       "https://api.linkedin.com/rest/documents?action=initializeUpload",
//       {
//         initializeUploadRequest: {
//           owner:
//             post.authorType?.type === "organization"
//               ? `urn:li:organization:${post.author}`
//               : `urn:li:person:${post.author}`,
//         },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
//           "X-RestLi-Protocol-Version": "2.0.0",
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("====================2");
//     const { uploadUrl, document } = registerResponse.data.value;

//     // 2. convert url to base64
//     const response = await axios.get(post.media.url, {
//       responseType: "arraybuffer",
//     });

//     const imageBuffer = Buffer.from(response.data, "binary");

//     // const buffer = response.data;

//     // const base64String = Buffer.from(buffer).toString("base64");

//     // const mimeType = post.media.fileType;
//     // const base64StringWithMimeType = `data:${mimeType};base64,${base64String}`;

//     // console.log("post.media.url", post.media.url);
//     console.log("base64String", imageBuffer);

//     console.log("====================3");

//     // 3. Upload the media
//     await axios.put(uploadUrl, imageBuffer, {
//       headers: {
//         "Content-Type": post.media.fileType,
//       },
//     });

//     console.log("tryMedia", uploadUrl, document);

//     console.log("====================4");
//     // 4. Create the linkedin post
//     const postData = {
//       author:
//         post.authorType?.type === "organization"
//           ? `urn:li:organization:${post.author}`
//           : `urn:li:person:${post.author}`,
//       commentary: post.commentary,
//       visibility: "PUBLIC",
//       distribution: {
//         feedDistribution: "MAIN_FEED",
//         targetEntities: [],
//         thirdPartyDistributionChannels: [],
//       },
//       content: {
//         media: {
//           title: post?.media?.name.split(".")[0] || "Postt Docs",
//           id: document,
//         },
//       },
//       lifecycleState: "PUBLISHED",
//       isReshareDisabledByAuthor: false,
//     };

//     console.log("postData", postData);

//     await axios
//       .post("https://api.linkedin.com/v2/posts", postData, {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//           "X-Restli-Protocol-Version": "2.0.0",
//           //   "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
//         },
//       })
//       .then((res) => {
//         console.log("=========== > res", res.data);

//         post.linkedinPostId = res.data.id;
//         post.status = "published";
//         post.publishedAt = new Date();
//         post.save();
//       })
//       .catch((err) => {
//         console.log("err", err.response.data);
//       });
//     console.log("====================5");

//     return {
//       data: post,
//       error: null,
//     };
//   } catch (error: any) {
//     console.error(
//       "Error publishPostLinkedin :",
//       error
//       //   error.response.data || error.message
//     );
//     // throw new Error("Failed to save organization details");

//     return {
//       data: null,
//       error: "Failed to save organization details",
//     };
//   }
// };
// export default publishPostLinkedin;
