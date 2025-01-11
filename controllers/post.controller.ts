import { Context } from "hono";
import { Carousel, Post } from "../models";
import axios from "axios";
import { CUSTOMIZATION_DETAILS, SLIDE_DETAILS } from "../default/carousel";
import generatePDF from "../components/generatePDF";
import Schedule from "../models/schedule.model";
import publishPostLinkedin from "../components/linkedinPublish/documentPublish";

/**
 * @api {get} /posts
 * @apiGroup posts
 * @access Private
 */
export const getAllPosts = async (c: Context) => {
  const userId = await c.get("user")._id;

  try {
    const posts = await Post.find({ createdBy: userId }).sort({
      createdAt: -1,
    });

    return c.json({
      success: true,
      data: posts,
      message: "All posts fetched successfully",
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        data: error,
        message: "Posts not found",
      },
      error.status
    );
  }
};

/**
 * @api {get} /posts/:postId
 * @apiGroup posts
 * @access Private
 */
export const getPostById = async (ctx: Context) => {
  try {
    const { postId } = await ctx.req.param();

    if (!postId) {
      return ctx.json(
        {
          success: false,
          message: "Post ID is required",
        },
        400
      );
    }

    const post = await Post.findById(postId);

    return ctx.json(
      {
        success: true,
        data: post,
        message: "Post fetched successfully",
      },
      200
    );
  } catch (error: any) {
    return ctx.json(
      {
        success: false,
        data: error,
        message: "Post not found",
      },
      error.status
    );
  }
};

/**
 * @api {post} /api/v1/linkedin/:orgId/post Linkedin Post
 * @apiGroup Management
 * @access private
 */
export const getPostByIdSync = async (ctx: Context) => {
  const user = await ctx.get("user");

  const linkedinPostId = await ctx.req.param("linkedinPostId");

  console.log("linkedinPostId: ", linkedinPostId);

  const accessToken =
    user?.tokens?.management?.access_token || user?.tokens?.auth?.access_token;

  console.log("AccessToken: ", accessToken);

  const url = `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(
    linkedinPostId
  )}`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
    "X-RestLi-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };

  try {
    const responce = await axios.get(url, { headers: headers });

    return ctx.json(
      {
        status: 200,
        success: true,
        data: responce.data,
        message: "Linkedin post",
      },
      200
    );
  } catch (err: any) {
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
 * @api {put} /posts/:postId
 * @apiGroup posts
 * @access Private
 */
export const updatePost = async (c: Context) => {
  try {
    const { postId } = await c.req.param();
    const updatedPost = await Post.findByIdAndUpdate(postId, c.req.json(), {
      new: true,
      runValidators: true,
    });

    return c.json({
      success: true,
      data: updatedPost,
      message: "Post updated successfully",
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        data: error,
        message: "Post not found",
      },
      error.status
    );
  }
};

/**
 * @api {delete} /posts/:postId
 * @apiGroup posts
 * @access Private
 */
export const deletePost = async (c: Context) => {
  try {
    const { postId } = await c.req.param();
    await Post.findByIdAndDelete(postId);

    return c.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        data: error,
        message: "Post not found",
      },
      error.status
    );
  }
};

/**
 * @api {post} /posts/text
 * @apiGroup posts
 * @access Private
 */
export const createTextPost = async (c: Context) => {
  const userId = await c.get("user")._id;

  try {
    const post = await Post.create({
      ...c.req.json(),
      type: "text",
      createdBy: userId,
    });

    return c.json({
      success: true,
      data: post,
      message: "Text post created successfully",
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        data: error,
        message: "Post not created",
      },
      error.status
    );
  }
};

/**
 * @api {post} /posts/image
 * @apiGroup posts
 * @access Private
 */
export const createImagePost = async (c: Context) => {
  const userId = await c.get("user")._id;

  try {
    const post = await Post.create({
      ...c.req.json(),
      type: "image",
      createdBy: userId,
    });

    return c.json({
      success: true,
      data: post,
      message: "Image post created successfully",
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        data: error,
        message: "Post not created",
      },
      error.status
    );
  }
};

/**
 * @api {post} /posts/video
 * @apiGroup posts
 * @access Private
 */
export const createVideoPost = async (c: Context) => {
  const userId = await c.get("user")._id;

  try {
    const post = await Post.create({
      ...c.req.json(),
      type: "video",
      createdBy: userId,
    });

    return c.json({
      success: true,
      data: post,
      message: "Video post created successfully",
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        data: error,
        message: "Post not created",
      },
      error.status
    );
  }
};

/**
 * @api {post} /posts/carousel
 * @apiGroup posts
 * @access Private
 */
export const createCarouselPost = async (c: Context) => {
  const userId = await c.get("user")._id;
  const body = await c.req.json();

  try {
    const createCarousel = await Carousel.create({
      customizations: CUSTOMIZATION_DETAILS,
      slides: SLIDE_DETAILS,
      createdBy: userId,
    });

    const post = await Post.create({
      ...body,

      type: "carousel",
      createdBy: userId,
      status: "draft",
      contentReference: createCarousel._id,
    });

    return c.json({
      success: true,
      data: {
        postId: post?._id,
        carouselId: createCarousel?._id,
      },
      message: "Carousel post created successfully",
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        data: error,
        message: "Post not created",
      },
      error.status
    );
  }
};

/**
 * @api {post} /posts/carousel/publish
 * @apiGroup posts
 * @access Private
 */
export const publishPost = async (ctx: Context) => {
  const postId = await ctx.req.param("postId");
  const userId = await ctx.get("user")._id;

  console.log("postId: ", postId);
  console.log("userId: ", userId);
  // commentary,  scheduledAt, author, authorType,
  const body = await ctx.req.json();

  try {
    const post = await Post.findById(postId);
    console.log("post: ", post);

    if (!post) {
      return ctx.json(
        {
          success: false,
          message: "Post not found",
        },
        404
      );
    }

    if (post.type === "carousel") {
      const { data: media, error: mediaError } = await generatePDF({
        carouselId: post.contentReference,
        userId,
      });

      if (mediaError) {
        return ctx.json({ success: false, message: mediaError }, 400);
      }

      if (body?.scheduledAt) {
        // Schedule the post
        console.log("This is a scheduled post");
        await Schedule.create({
          createdBy: userId,
          postId: postId,
          status: "scheduled",
          scheduledAt: body.scheduledAt,
        });

        const updatePost = await Post.findByIdAndUpdate(
          postId,
          {
            status: "scheduled",
            media,
          },
          { new: true }
        );

        return ctx.json(
          {
            success: true,
            data: updatePost,
            message: "Post scheduled",
          },
          200
        );
      } else {
        // Publish the post
        console.log("This is a published post");
        await Post.findByIdAndUpdate(postId, { media });

        const { data, error } = await publishPostLinkedin(postId);

        return ctx.json(
          { success: true, data, message: "Post published" },
          200
        );
      }
    }
  } catch (error: any) {
    return ctx.json(
      {
        success: false,
        data: error,
        message: "Post not found",
      },
      error.status
    );
  }
};
