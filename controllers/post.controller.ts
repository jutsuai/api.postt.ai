import { Context } from "hono";
import { Post } from "../models";

/**
 * @api {get} /posts
 * @apiGroup posts
 * @access Private
 */
export const getPosts = async (c: Context) => {
  const userId = await c.get("user")._id;
  const posts = await Post.find({ createdBy: userId });

  return c.json({
    success: true,
    data: posts,
    message: "All post of current user",
  });
};
