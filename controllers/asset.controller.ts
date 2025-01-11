import { Context } from "hono";
import { Carousel, Post } from "../models";
import PostCarousel from "../models/post/carousel.model";
import generatePDF from "../components/generatePDF";

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
export const getCarouselById = async (ctx: Context | any) => {
  try {
    const carouselId = await ctx.req.param("carouselId");
    console.log("carouselId : ", carouselId);

    if (!carouselId) {
      return ctx.json(
        {
          success: false,
          message: "Carousel ID is required",
        },
        400
      );
    }

    const carousel = await Carousel.findById(carouselId).populate({
      path: "createdBy",
      select: "username firstName lastName email avatar",
    });
    const post = await Post.findOne({ contentReference: carouselId });

    return ctx.json(
      {
        success: true,
        data: {
          post,
          carousel,
        },
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
 * @api {get} /assets/carousels/:carouselId/download
 * @apiGroup assets
 * @access Private
 */
export const downloadCarousel = async (ctx: Context) => {
  const userId = await ctx.get("user")._id;
  const carouselId = await ctx.req.param("carouselId");
  try {
    const { data: media, error: mediaError } = await generatePDF({
      carouselId,
      userId,
    });

    console.log("media: ", media);

    return ctx.json(
      {
        success: true,
        data: media,
        message: "Carousel downloaded successfully",
      },
      200
    );
  } catch (error: any) {
    return ctx.json(
      {
        success: false,
        data: error,
        message: "Carousel not downloaded",
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

    if (commentary) {
      await Post.findOneAndUpdate(
        { contentReference: carouselId },
        { commentary }
      ).then((res) => {
        console.log(res);
      });
    }

    const post = await PostCarousel.findByIdAndUpdate(
      carouselId,
      { slides, customizations },
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
