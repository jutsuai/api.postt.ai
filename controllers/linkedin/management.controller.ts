import { Context } from "hono";
import { User } from "../../models";

import { AuthClient, RestliClient } from "linkedin-api-client";

const authClient = new AuthClient({
  clientId: process.env.LINKEDIN_MANAGEMENT_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_MANAGEMENT_CLIENT_SECRET,
  redirectUrl: process.env.LINKEDIN_MANAGEMENT_REDIRECT_URI,
} as any);
const restliClient = new RestliClient();

export const linkedinLogin = async (c: Context) => {
  const scopes = [
    "r_organization_followers",
    "r_organization_social",
    "rw_organization_admin",
    "r_organization_social_feed",
    "w_member_social",
    "w_organization_social",
    "r_basicprofile",
    "w_organization_social_feed",
    "w_member_social_feed",
    "r_1st_connections_size",
  ];

  const state = process.env.NODE_ENV;

  try {
    const authUrl = authClient.generateMemberAuthorizationUrl(scopes, state);

    console.log("linkedinLogin : ", authUrl);

    return c.json({
      status: 200,
      success: true,
      data: authUrl,
      message: "Linkedin login",
    });
  } catch (e) {
    console.log("linkedinLogin : ", JSON.stringify(e));

    return c.json(
      {
        status: 400,
        success: false,
        message: "Failed to generate linkedin auth url",
      },
      400
    );
  }
};

export const linkedinCallback = async (c: Context) => {
  const { code } = await c.req.json();

  const userId = await c.get("user")._id;

  try {
    const tokenDetails = await authClient.exchangeAuthCodeForAccessToken(code);

    const updatedUser = await User.findByIdAndUpdate(userId, {
      $set: {
        "tokens.management": {
          access_token: tokenDetails.access_token,
          expires_in: tokenDetails.expires_in,
          refresh_token: tokenDetails.refresh_token,
          refresh_token_expires_in: tokenDetails.refresh_token_expires_in,
          scope: tokenDetails.scope,
        },
      },
    });

    return c.json({
      status: 200,
      success: true,
      data: updatedUser,
      message: "User logged in successfully",
    });
  } catch (err: any) {
    console.log("linkedinCallback error: ", err.message);

    return c.json(
      {
        status: err.status,
        success: false,
        message: "Linkedin callback failed",
        data: err,
      },
      err.status
    );
  }
};

export const linkedinRefreshToken = async (c: Context) => {
  const { refreshToken } = await c.req.json();

  const tokenDetails =
    authClient.exchangeRefreshTokenForAccessToken(refreshToken);

  console.log("linkedinRefreshToken : ", tokenDetails);

  return c.json({
    status: 200,
    success: true,
    data: tokenDetails,
    message: "Linkedin refresh token",
  });
};

/**
 * @api {post} /api/v1/management/organizationList Get Organization List
 * @apiGroup Management
 * @access private
 */
export const getOrganizationList = async (ctx: Context) => {
  const user = await ctx.get("user");
  console.log(
    "getOrganizationList : user : ",
    user.tokens.management.access_token
  );
  try {
    const { data: organizationList } = await restliClient.get({
      resourcePath: "/organizationAcls",
      accessToken: user.tokens.management.access_token,

      queryParams: {
        q: "roleAssignee",
        state: "APPROVED",
      },
    });

    console.log("organizationList : ", organizationList);
  } catch (e) {
    console.log("organizationList : error : ", e);
    console.log(
      "getOrganizationList : user : ",
      user.tokens.management.access_token
    );
    return ctx.json(
      {
        status: 400,
        success: false,
        message: "Failed to get organization list",
      },
      400
    );
  }
};
