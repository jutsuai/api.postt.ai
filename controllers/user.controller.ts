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

  return c.json({ users });
};
