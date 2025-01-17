import { Context } from "hono";
import axios from "axios";
import { LinkedinProfile, User } from "../../models";
import { AuthClient } from "linkedin-api-client";
import fetchOrganizationUrns from "../../components/fetchOrganizationUrns";
import fetchOrganizationDetails from "../../components/fetchOrganizationDetails";
import saveOrganizationDetails from "../../components/saveOrganizationDetails";

const authClient = new AuthClient({
  clientId: process.env.LINKEDIN_MANAGEMENT_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_MANAGEMENT_CLIENT_SECRET,
  redirectUrl: process.env.LINKEDIN_MANAGEMENT_REDIRECT_URI,
} as any);

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

  return c.json({
    status: 200,
    success: true,
    data: tokenDetails,
    message: "Linkedin refresh token",
  });
};

/**
 * @api {get} /api/v1/management/user Get User Details
 * @apiGroup Management
 * @access private
 */
export const getUserDetails = async (ctx: Context) => {
  const user = await ctx.get("user");

  const accessToken =
    user.tokens.management.access_token || user.tokens.auth.access_token;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
  };
  const url = "https://api.linkedin.com/v2/me";
  // const params = { q: "roleAssignee", state: "APPROVED" };

  try {
    const { data } = await axios.get(url, { headers });

    console.log("getUserDetails : ", data);

    const linkedinProfile = await LinkedinProfile.findOneAndUpdate(
      {
        linkedinId: data?.id,
      },
      {
        createdBy: user?._id,

        type: "person",
        linkedinId: data?.id,
        name: `${data?.localizedFirstName} ${data?.localizedLastName}`,

        slug: data?.vanityName,
        logo: user?.avatar || data?.profilePicture?.displayImage,

        description: data?.localizedHeadline,
        linkedinUrl: `https://www.linkedin.com/in/${data?.vanityName}`,
        // cover: data?.coverV2?.original,
        // websiteUrl: data?.websiteUrl,
        // tags: data?.tags,
        // industries: data?.industries,
      },
      {
        upsert: true,
        new: true,
      }
    );

    return ctx.json(
      {
        status: 200,
        success: true,
        data: linkedinProfile,
        message: "User details fetched successfully",
      },
      200
    );
  } catch (error: any) {
    console.error("Error in getUserDetails:", error.response?.data);

    return ctx.json(
      {
        status: 500,
        success: false,
        message: "Failed to fetch user details",
      },
      500
    );
  }
};

/**
 * @api {get} /api/v1/management/organizationList Get Organization List form DB
 * @apiGroup Management
 * @access private
 */
// export const getOrganizationListFormDB = async (ctx: Context) => {
//   try {
//     const userId = await ctx.get("user")?._id;

//     const organizations = await LinkedinProfile.find({ createdBy: userId });

//     return ctx.json({
//       status: 200,
//       success: true,
//       data: organizations,
//       message: "Organization list fetched successfully",
//     });
//   } catch (error) {
//     console.error("Error in getOrganizationList:", error);

//     return ctx.json(
//       {
//         status: 500,
//         success: false,
//         message: "Failed to fetch organization list",
//       },
//       500
//     );
//   }
// };

/**
 * @api {post} /api/v1/management/organizationList Get Organization List  form Linkedin
 * @apiGroup Management
 * @access private
 */
export const getOrganizationListFormLinkedin = async (ctx: Context) => {
  try {
    const user = await ctx.get("user");
    const accessToken =
      user.tokens.management.access_token || user.tokens.auth.access_token;

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    };

    // Step 1: Fetch organization URNs
    const { data: organizationUrns, error } = await fetchOrganizationUrns(
      accessToken
    );

    if (error) {
      console.error("Failed to fetch organization URNs:", error);

      return ctx.json(error, 500);
    }

    console.log("organizationUrns : ", organizationUrns);

    // Step 2: Extract organization IDs
    const organizationIds = organizationUrns.map((urn: any) =>
      urn.split(":").pop()
    );

    // Step 3: Fetch organization details
    const organizations = await Promise.allSettled(
      organizationIds.map(async (id: any) => {
        try {
          if (!id) {
            return null;
          }

          // check if organization already exists
          const existingOrganization = await LinkedinProfile.findOne({
            linkedinId: id,
          });

          if (existingOrganization) {
            return existingOrganization;
          }

          const { data: orgDetails, error } = await fetchOrganizationDetails(
            id,
            headers
          );

          if (error) {
            console.error(
              `Failed to fetch details for organization ID ${id}:`,
              error
            );

            return null;
          }

          return await saveOrganizationDetails(orgDetails, user._id);
        } catch (error) {
          console.error(`Failed to process organization ID ${id}:`, error);
          return null; // Skip if one organization fails
        }
      })
    );

    // Filter out failed results
    const successfulOrganizations = organizations
      .filter((result) => result.status === "fulfilled")
      .map((result: any) => result.value);

    return ctx.json({
      status: 200,
      success: true,
      data: successfulOrganizations,
      message: "Organization list fetched successfully",
    });
  } catch (error) {
    console.error("Error in getOrganizationList:", error);

    return ctx.json(
      {
        status: 500,
        success: false,
        message: "Failed to fetch organization list",
      },
      500
    );
  }
};

/**
 * @api {get} /api/v1/linkedin/:imageUrn Load Image from Linkedin
 * @apiGroup Management
 * @access private
 */

export const loadImage = async (ctx: Context) => {
  try {
    const user = await ctx.get("user");
    const accessToken =
      user.tokens.management.access_token || user.tokens.auth.access_token;

    console.log("accessToken: ", accessToken);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
    const imageUrn = await ctx.req.param("imageUrn");

    const url = `https://api.linkedin.com/v2/assets/${imageUrn}~`;

    console.log("============loadImage: ", url);

    const { data } = await axios.get(url, { headers });

    console.log("loadImage : ", data);

    return ctx.json({
      status: 200,
      success: true,
      data: data,
      message: "Image fetched successfully",
    });
  } catch (error: any) {
    console.error("Error in loadImage:", error?.response?.data);

    return ctx.json(
      {
        status: 500,
        success: false,
        message: "Failed to fetch image",
      },
      500
    );
  }
};
