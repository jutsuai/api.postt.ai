import axios from "axios";
import { Post } from "../../models";
// import getBinaryFromUrl from "../getBinaryFromUrl";

// Function to convert text to Unicode bold
function toUnicodeBold(text: any) {
  return text
    .split("")
    .map((char: any) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        // Uppercase A-Z
        return String.fromCharCode(code + 0x1d3e0 - 65);
      } else if (code >= 97 && code <= 122) {
        // Lowercase a-z
        return String.fromCharCode(code + 0x1d3e0 - 97);
      } else if (code >= 48 && code <= 57) {
        // Numbers 0-9
        return String.fromCharCode(code + 0x1d7ce - 48);
      } else {
        return char; // Non-alphanumeric characters remain unchanged
      }
    })
    .join("");
}

// Function to process Markdown into Unicode styled text
function convertMarkdownToUnicode(text: any) {
  return text
    .replace(/\*(.*?)\*/g, (_: any, match: any) => toUnicodeBold(match)) // Bold
    .replace(/_(.*?)_/g, (_: any, match: any) => `\u1D608${match}\u1D608`) // Italic (approximate with enclosing)
    .replace(/~(.*?)~/g, (_: any, match: any) =>
      match
        .split("")
        .map((c: any) => `̶${c}`)
        .join("")
    ); // Strikethrough
}

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
      commentary: convertMarkdownToUnicode(post?.commentary),
      // "Hello, these are some bullet points:\n\n\\* Point 1\n\\* Point 2\n\\* Point 3 𝐒𝐚𝐢𝐝𝐮𝐥 𝐛𝐚𝐝𝐡𝐨𝐧",
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
    console.log("post.commentary", post);

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
