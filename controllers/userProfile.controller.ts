import { Context } from "hono";
import { UserProfile } from "../models";

/**
 * @api {get} /users/:id Get User By Id
 * @apiGroup Users
 * @access Private
 */

export const getUserById = async (c: Context | any) => {
  try {
    const user = await UserProfile.findOne({ createdBy: c.params.id });

    return c.json({
      success: true,
      data: user,
      message: "User profile fetched successfully",
    });
  } catch (error: any) {
    return c.status(error.status).json({
      success: false,
      data: error,
      message: "User profile not found",
    });
  }
};

/**
 * @api {put} /users Update User
 * @apiGroup Users
 * @access Private
 */

export const updateUser = async (c: Context | any) => {
  const { id } = c.req.param();

  try {
    const update = await c.req.json();
    const config = {
      new: true,
      runValidators: true,
      upsert: true,
    };

    const user = await UserProfile.findOneAndUpdate(
      { createdBy: id },
      update,
      config
    );

    return c.json({
      success: true,
      data: user,
      message: "User profile updated successfully",
    });
  } catch (error: any) {
    console.log("Update User Profile Error: ", error);

    return c.status(error.status).json({
      success: false,
      data: error,
      message: "User profile not updated",
    });
  }
};
