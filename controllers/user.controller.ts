import { Context } from "hono";
import { User } from "../models";
import { genToken } from "../utils";

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
