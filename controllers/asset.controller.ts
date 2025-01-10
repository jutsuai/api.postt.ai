import { Context } from "hono";
import { Post } from "../models";

/**
 * @api {get} /assets/carousels
 * @apiGroup assets
 * @access Private
 */
export const getAllCarousels = async (ctx: Context) => {
  const userId = await ctx.get("user")._id;

  try {
    const posts = await Post.find({ createdBy: userId });

    return ctx.json({
      success: true,
      data: posts,
      message: "All carousels fetched successfully",
    });
  } catch (error: any) {
    return ctx.json(
      {
        success: false,
        data: error,
        message: "Carousels not found",
      },
      error.status
    );
  }
};

/**
 * @api {get} /assets/carousels/:carouselId
 * @apiGroup assets
 * @access Private
 */
export const getCarouselById = async (ctx: Context) => {
  try {
    const { carouselId } = await ctx.req.param();

    if (!carouselId) {
      return ctx.json(
        {
          success: false,
          message: "Carousel ID is required",
        },
        400
      );
    }

    const post = await Post.findById(carouselId);

    return ctx.json(
      {
        success: true,
        data: post,
        message: "Carousel fetched successfully",
      },
      200
    );
  } catch (error: any) {
    return ctx.json(
      {
        success: false,
        data: error,
        message: "Carousel not found",
      },
      error.status
    );
  }
};

/**
 * @api {get} /assets/video
 * @apiGroup assets
 * @access Private
 */
export const getAllVideos = async (ctx: Context) => {
  const userId = await ctx.get("user")._id;

  try {
    const posts = await Post.find({ createdBy: userId });

    return ctx.json({
      success: true,
      data: posts,
      message: "All videos fetched successfully",
    });
  } catch (error: any) {
    return ctx.json(
      {
        success: false,
        data: error,
        message: "Videos not found",
      },
      error.status
    );
  }
};

/**
 * @api {get} /assets/video/:videoId
 * @apiGroup assets
 * @access Private
 */
export const getVideoById = async (ctx: Context) => {
  try {
    const { videoId } = await ctx.req.param();

    if (!videoId) {
      return ctx.json(
        {
          success: false,
          message: "Video ID is required",
        },
        400
      );
    }

    const post = await Post.findById(videoId);

    return ctx.json(
      {
        success: true,
        data: post,
        message: "Video fetched successfully",
      },
      200
    );
  } catch (error: any) {
    return ctx.json(
      {
        success: false,
        data: error,
        message: "Video not found",
      },
      error.status
    );
  }
};
