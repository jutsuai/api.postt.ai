import axios from "axios";
import { Context } from "hono";
import { AuthClient, RestliClient } from "linkedin-api-client";

/**
 * @api {post} /api/v1/linkedin/:orgId/post Linkedin Post
 * @apiGroup Management
 * @access private
 */

const authClient = new AuthClient({
  clientId: process.env.LINKEDIN_AUTH_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_AUTH_CLIENT_SECRET,
  redirectUrl: process.env.LINKEDIN_AUTH_REDIRECT_URI,
} as any);
const restliClient = new RestliClient();

export const getAllPost = async (ctx: Context) => {
  // console.log("============= linkedinPost : ", await ctx.req.json());
  // const { orgId } = await ctx.req.json();

  console.log("============= linkedinPost : ");

  const user = await ctx.get("user");
  const accessToken =
    user?.tokens?.management?.access_token || user?.tokens?.auth?.access_token;

  const organizationId = `urn:li:organization:91137041`;

  // const url = `https://api.linkedin.com/rest/posts?q=authors&authors=List(${organizationId})`;
  const url = `https://api.linkedin.com/v2/rest/posts`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
    "X-RestLi-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };
  console.log("============= linkedinPost headers : ", headers);

  try {
    const responce = await axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },

        params: {
          q: "authors",
          authors: organizationId,
          start: 0,
          count: 10,
        },
      })
      .then((res) => {
        console.log("linkedinPost : ", res.data);
        return res.data;
      })
      .catch((err) => {
        console.log("linkedinPost error : ", err.response.data);
      });

    // const responce = await restliClient.get({
    //   resourcePath: "/posts",

    //   queryParams: {
    //     q: "authors",
    //     // vanityName: organizationId,
    //     authors: `List(${organizationId})`,
    //   },

    //   accessToken: accessToken,
    // });

    console.log("linkedinPost : ", responce);

    return ctx.json(
      {
        status: 200,
        success: true,
        data: responce,
        message: "Linkedin post",
      },
      200
    );
  } catch (err: any) {
    console.log("linkedinLogin  error  : ", err);

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

/**
 * @api {post} /api/v1/linkedin/:orgId/post/text Linkedin Text Post
 * @apiGroup Management
 * @access private
 */
export const createTextPost = async (ctx: Context) => {
  const { orgId, postContent } = await ctx.req.json();
  // const { postContent } = await ctx.req.json();
  const user = await ctx.get("user");
  const accessToken =
    user?.tokens?.management?.accessToken || user?.tokens?.auth?.accessToken;

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
  console.log("============= linkedinTextPost : ", headers);

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
