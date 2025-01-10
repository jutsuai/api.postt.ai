import { Context } from "hono";
import { User, UserProfile } from "../models";

/**
 * @api {get} /users Get All Users
 * @apiGroup Users
 * @access Private
 */
export const getUsers = async (c: Context) => {
  const users = await User.find();

  return c.json({
    success: true,
    data: users,
    message: "All users fetched successfully",
  });
};

/**
 * @api {get} /users/:id Get User By Id
 * @apiGroup Users
 * @access Private
 */

export const getUserById = async (c: Context | any) => {
  try {
    const { id } = await c.req.param();
    const user = await User.findById(id);

    return c.json({
      success: true,
      data: user,
      message: "User fetched successfully",
    });
  } catch (error: any) {
    return c.status(error.status).json({
      success: false,
      data: error,
      message: "User not found",
    });
  }
};

/**
 * @api {put} /users Update User
 * @apiGroup Users
 * @access Private
 */
export const updateUser = async (c: Context | any) => {
  const user = await User.findByIdAndUpdate(c.params.id, c.req.json(), {
    new: true,
    runValidators: true,
  });

  return c.json({
    success: true,
    data: user,
    message: "User updated successfully",
  });
};

/**
 * @api {get} /users/:id/profile Get User Profile By Id
 * @apiGroup Users
 * @access Public
 */
export const getUserProfileByUserId = async (ctx: Context | any) => {
  const userId = await ctx.get("user")._id;

  try {
    const userProfile = await UserProfile.findOne({ createdBy: userId });

    return ctx.json({
      success: true,
      data: userProfile,
      message: "User profile fetched successfully",
    });
  } catch (error: any) {
    return ctx.json(
      {
        success: false,
        data: error,
        message: "User profile not found",
      },
      error.status
    );
  }
};

/**
 * @api {put} /users/:id/profile Update User Profile
 * @apiGroup Users
 * @access Private
 */
export const updateUserProfile = async (ctx: Context | any) => {
  const userId = await ctx.get("user")._id;

  try {
    const update = await ctx.req.json();
    const config = {
      new: true,
      runValidators: true,
      upsert: true,
    };

    const userProfile = await UserProfile.findOneAndUpdate(
      { createdBy: userId },
      update,
      config
    );

    return ctx.json({
      success: true,
      data: userProfile,
      message: "User profile updated successfully",
    });
  } catch (error: any) {
    console.log("Update User Profile Error: ", error);

    return ctx.status(error.status).json({
      success: false,
      data: error,
      message: "User profile not updated",
    });
  }
};
