import axios from "axios";
import { Context } from "hono";

import { LinkedinProfile, User } from "../../models";
import { AuthClient, RestliClient } from "linkedin-api-client";

/**
 * @api {post} /api/v1/linkedin/:orgId/post/text Linkedin Text Post
 * @apiGroup Management
 * @access private
 */
export const linkedinTextPost = async (ctx: Context) => {
  const { orgId, postContent } = await ctx.req.json();
  // const { postContent } = await ctx.req.json();
  const user = await ctx.get("user");
  const accessToken =
    user?.tokens?.management?.accessToken || user?.tokens?.auth?.accessToken;

  console.log("============= linkedinTextPost : ", orgId, postContent);

  const postData = {
    author: `urn:li:organization:${orgId}`,
    commentary: postContent,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  const url = "https://api.linkedin.com/v2/posts";
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
    "X-RestLi-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };

  try {
    const { data } = await axios.post(url, postData, { headers });

    console.log("linkedinTextPost : ", data);

    return ctx.json(
      {
        status: 200,
        success: true,
        data,
        message: "Linkedin text post",
      },
      200
    );
  } catch (err: any) {
    console.log("linkedinLogin : ", JSON.stringify(err?.response?.data));

    return ctx.json(
      {
        status: 400,
        success: false,
        data: err?.response?.data,
        message: "Failed to generate linkedin auth url",
      },
      400
    );
  }
};
