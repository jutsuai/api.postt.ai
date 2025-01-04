import { Context } from "hono";
import { User, UserLinkedInCredentials } from "../models";
import { genToken } from "../utils";
// import { LinkedInApiClient } from "linkedin-api-client";

import { AuthClient, RestliClient } from "linkedin-api-client";

const authClient = new AuthClient({
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  redirectUrl: process.env.LINKEDIN_REDIRECT_URI,
});
const restliClient = new RestliClient();

/**
 * @api {post} /auth/signup Create User
 * @apiGroup Users
 * @access Public
 */
export const signupUser = async (c: Context) => {
  const {
    firstName,
    lastName,
    username,
    email,
    password,
    role = "user",
    isActive = true,
  } = await c.req.json();

  console.log("signupUser : ", {
    firstName,
    lastName,
    username,
    email,
    password,
    role,
    isActive,
  });

  if (!email || !password) {
    c.status(400);
    throw new Error("Please provide an email and password");
  }

  // Check for existing user
  const userExists = await User.findOne({ email });

  if (userExists) {
    c.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    firstName,
    lastName,
    username,
    email,
    password,
    role,
    isActive,
  });

  if (!user) {
    c.status(400);
    throw new Error("Invalid user data");
  }

  const token = await genToken(user._id.toString());

  return c.json({
    success: true,
    data: user,
    token,
    message: "User created successfully",
  });
};

/**
 * @api {post} /auth/login Login User
 * @apiGroup Users
 * @access Public
 */
export const loginUser = async (c: Context) => {
  const { email, password } = await c.req.json();

  // Check for existing user
  if (!email || !password) {
    c.status(400);
    throw new Error("Please provide an email and password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    c.status(401);
    throw new Error("No user found with this email");
  }

  if (!(await user.mathPassword(password))) {
    c.status(401);
    throw new Error("Invalid credentials");
  } else {
    const token = await genToken(user._id.toString());

    return c.json({
      success: true,
      data: {
        avatar: user?.avatar,
        firstName: user?.firstName,
        lastName: user?.lastName,
        username: user?.username,
        email: user?.email,
        role: user?.role,
        isActive: user?.isActive,
      },
      token,
      message: "User logged in successfully",
    });
  }
};

export const linkedinLogin = async (c: Context) => {
  const scopes = ["openid", "profile", "w_member_social", "email"];
  // const scopes = [
  //   "r_organization_followers",
  //   "r_organization_social",
  //   "rw_organization_admin",
  //   "r_organization_social_feed",
  //   "w_member_social",
  //   "w_organization_social",
  //   "r_basicprofile",
  //   "w_organization_social_feed",
  //   "w_member_social_feed",
  //   "r_1st_connections_size",
  // ];

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
    console.log("linkedinLogin : ", e);

    return c.json({
      status: 400,
      success: false,
      message: "Linkedin login failed",
    });
  }
};

export const linkedinCallback = async (c: Context) => {
  const { code } = await c.req.json();

  try {
    const tokenDetails = await authClient.exchangeAuthCodeForAccessToken(code);

    console.log("linkedinCallback : ", tokenDetails);

    // get user details
    const { data: liUser } = await restliClient.get({
      resourcePath: "/userinfo",
      accessToken: tokenDetails.access_token,
    });

    console.log("linkedinCallback : ", liUser);

    // Check for existing user
    const userExists = await User.findOne({ linkedinId: liUser?.id });

    if (userExists) {
      const token = await genToken(userExists._id.toString());

      // await UserLinkedInCredentials.updateOne(
      //   { userId: userExists._id },
      //   {
      //     $set: {
      //       tokens: {
      //         access_token: tokenDetails.access_token,
      //         expires_in: tokenDetails.expires_in,
      //         refresh_token: tokenDetails.refresh_token,
      //         refresh_token_expires_in: tokenDetails.refresh_token_expires_in,
      //         scope: tokenDetails.scope,
      //       },
      //     },
      //   }
      // );

      await User.updateOne(
        { linkedinId: liUser?.id },
        {
          $set: {
            tokens: {
              access_token: tokenDetails.access_token,
              expires_in: tokenDetails.expires_in,
              refresh_token: tokenDetails.refresh_token,
              refresh_token_expires_in: tokenDetails.refresh_token_expires_in,
              scope: tokenDetails.scope,
            },
          },
        }
      );

      return c.json({
        status: 200,
        success: true,
        data: tokenDetails,
        token,
        message: "User logged in successfully",
      });
    }

    const user = await User.create({
      linkedinId: liUser?.id,
      username: liUser?.vanityName,
      firstName: liUser?.localizedFirstName,
      lastName: liUser?.localizedLastName,
      role: "user",

      isActive: true,
      tokens: {
        access_token: tokenDetails.access_token,
        expires_in: tokenDetails.expires_in,
        refresh_token: tokenDetails.refresh_token,
        refresh_token_expires_in: tokenDetails.refresh_token_expires_in,
        scope: tokenDetails.scope,
      },
    });

    return c.json({
      status: 200,
      success: true,
      data: user,
      message: "Linkedin callback",
    });
  } catch (err: any) {
    console.log("linkedinCallback : ", err);

    return c.status(err.status).json({
      status: 400,
      success: false,
      message: "Linkedin callback failed",
      data: err,
    });
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
 * @api {get} /auth/logout Logout User
 * @apiGroup Users
 * @access Private
 */
export const logoutUser = async (c: Context) => {
  return c.json({ message: "User logged out successfully" });
};