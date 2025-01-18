import axios from "axios";
import { Post } from "../../models";
// import getBinaryFromUrl from "../getBinaryFromUrl";

// Function to convert text to Unicode bold
// function processMarkdown(markdownContent: string) {
//   // Process MentionElements
//   markdownContent = markdownContent.replace(
//     /@\[([^\]]+)\]\(([^)]+)\)/g,
//     (match, text, urn) => {
//       return `@${text}(${urn})`;
//     }
//   );

//   // Process HashtagElements
//   markdownContent = markdownContent.replace(/#(\w+)/g, (match, tag) => {
//     return `#${tag}`;
//   });

//   // Process HashtagTemplates
//   markdownContent = markdownContent.replace(
//     /\{hashtag\|(#|＃)\|([^}]+)\}/g,
//     (match, symbol, text) => {
//       return `${symbol}${text}`;
//     }
//   );

//   // Escape reserved characters
//   const reservedChars = "\\|{}@[]()<>#*_~";
//   markdownContent = markdownContent.replace(
//     new RegExp(`[${reservedChars}]`, "g"),
//     (match) => {
//       return `\\${match}`;
//     }
//   );

//   return markdownContent;
// }

function processMarkdown(markdownContent: any) {
  let output = markdownContent.replace(
    /[\(\)\[\]\{\}<>@|~_]/gm,
    (x: any) => `\\` + x
  );
  // let output = markdownContent.replace(
  //   /[\(*\)\[\]\{\}<>@|~_]/gm,
  //   (x: any) => `\\` + x
  // );

  console.log("output: ", JSON.stringify(output));

  output = output.replaceAll("*", "");

  return output;

  // 2
  // // Replace double asterisks (**) with //**
  // markdownContent = markdownContent.replace(/\*\*/g, "//**");

  // // Replace single asterisks (*) with //*
  // markdownContent = markdownContent.replace(/(?<!\/)\*(?!\*)/g, "//*");

  // console.log("output: ", JSON.stringify(markdownContent));

  // return markdownContent;

  // // 3
  // // Replace double asterisks first (**text**) with //**text//**
  // markdownContent = markdownContent.replace(/\*\*(.+?)\*\*/g, "//**$1//**");

  // // Replace single asterisks (*text*) with //**text//**
  // markdownContent = markdownContent.replace(/\*(.+?)\*/g, "//**$1//**");

  // console.log("output: ", JSON.stringify(markdownContent));

  // return markdownContent;
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
      commentary: processMarkdown(post?.commentary),
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
