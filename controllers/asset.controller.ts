import { Context } from "hono";
import { Carousel, Post } from "../models";
import PostCarousel from "../models/post/carousel.model";

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

    const post = await Carousel.findById(carouselId);

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
 * @api {get} /assets/images
 * @apiGroup assets
 * @access Private
 */
export const createCarousel = async (ctx: Context) => {
  const userId = await ctx.get("user")._id;

  try {
    const { commentary, slides, customizations } = await ctx.req.json();

    const post = await PostCarousel.create({
      commentary,
      slides,
      customizations,
      createdBy: userId,
    });

    console.log("post : ", post);

    return ctx.json(
      {
        success: true,
        data: post,
        message: "Carousel created successfully",
      },
      200
    );
  } catch (error: any) {
    return ctx.json(
      {
        success: false,
        data: error,
        message: "Carousel not created",
      },
      error.status
    );
  }
};

/**
 * @api {put} /assets/carousels/:carouselId
 * @apiGroup assets
 * @access Private
 */
export const updateCarousel = async (ctx: Context) => {
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

    const { commentary, slides, customizations } = await ctx.req.json();

    const post = await PostCarousel.findByIdAndUpdate(
      carouselId,
      { commentary, slides, customizations },
      { new: true }
    );

    return ctx.json(
      {
        success: true,
        data: post,
        message: "Carousel updated successfully",
      },
      200
    );
  } catch (error: any) {
    return ctx.json(
      {
        success: false,
        data: error,
        message: "Carousel not updated",
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
