import { Context } from "hono";
import { Carousel, Post } from "../models";
import axios from "axios";
import { CUSTOMIZATION_DETAILS, SLIDE_DETAILS } from "../default/carousel";
import generatePDF from "../components/generatePDFHigh";
import Schedule from "../models/schedule.model";
import documentPublish from "../components/linkedinPublish/documentPublish";
import imagePublish from "../components/linkedinPublish/imagePublish";
import textPublish from "../components/linkedinPublish/textPublish";

/**
 * @api {get} /posts
 * @apiGroup posts
 * @access Private
 */
export const getAllPosts = async (ctx: Context) => {
  try {
    // Extract user ID from the request context/session
    const user = await ctx.get("user");
    if (!user || !user._id) {
      return ctx.json({ success: false, message: "Unauthorized" }, 401);
    }
    const userId = user._id;

    // Extract query parameters for filters and pagination
    const query = ctx.req.query();
    const { type, status, search, page = "1", limit = "10" } = query;

    const matchFilters: any = {
      createdBy: userId, // Always filter by the logged-in user
    };

    // Add type filter if provided
    if (type) {
      matchFilters.type = type;
    }

    // Add status filter if provided
    if (status) {
      matchFilters.status = status;
    }

    // Add search filter for commentary if provided
    if (search) {
      matchFilters["commentary"] = { $regex: search, $options: "i" }; // Case-insensitive regex for commentary
    }

    // Convert pagination parameters to numbers
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));

    // Calculate skip value for pagination
    const skip = (pageNumber - 1) * pageSize;

    // Use Mongoose or MongoDB aggregate to fetch posts with the given filters and pagination
    const posts = await Post.aggregate([
      { $match: matchFilters }, // Apply dynamic filters
      {
        $lookup: {
          from: "schedules", // Collection name for Schedule
          localField: "_id", // Field in the Post model that references the Schedule
          foreignField: "postId", // Field in the Schedule model that stores the Post ID
          as: "scheduleData", // Temporary array field to store schedule data
        },
      },
      { $unwind: { path: "$scheduleData", preserveNullAndEmptyArrays: true } }, // Flatten scheduleData
      {
        $addFields: {
          scheduledAt: {
            $cond: [
              { $eq: ["$status", "scheduled"] },
              "$scheduleData.scheduledAt",
              null,
            ],
          },
          publishedAt: {
            $cond: [
              { $eq: ["$status", "published"] },
              "$scheduleData.publishedAt",
              null,
            ],
          },
        },
      },
      {
        $project: {
          scheduleData: 0, // Remove scheduleData field to keep the result clean
        },
      },
      { $sort: { createdAt: -1 } }, // Sort posts by createdAt in descending order
      { $skip: skip }, // Skip documents for pagination
      { $limit: pageSize }, // Limit documents for pagination
    ]);

    // Get the total count of matching posts (without pagination)
    const totalCount = await Post.countDocuments(matchFilters);

    return ctx.json({
      success: true,
      data: posts,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: pageSize,
      },
      message: "All posts fetched successfully",
    });
  } catch (error: any) {
    return ctx.json(
      {
        success: false,
        message: "Failed to fetch posts",
        error: error.message || "An error occurred",
      },
      500
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

  const accessToken =
    user?.tokens?.management?.access_token || user?.tokens?.auth?.access_token;

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
  const postId = await c.req.param("postId");
  const body = await c.req.json();

  try {
    const updatedPost = await Post.findByIdAndUpdate(postId, body, {
      new: true,
      runValidators: true,
    });

    return c.json({
      success: true,
      data: updatedPost,
      message: "Post updated successfully",
    });
  } catch (error: any) {
    console.log("error: ", error);
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
export const createTextPost = async (ctx: Context) => {
  const userId = await ctx.get("user")._id;
  const body = await ctx.req.json();

  try {
    const post = await Post.create({
      ...body,
      type: "text",
      status: "draft",
      createdBy: userId,
    });

    return ctx.json({
      success: true,
      data: post,
      message: "Text post created successfully",
    });
  } catch (error: any) {
    return ctx.json(
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
export const createImagePost = async (ctx: Context) => {
  const userId = await ctx.get("user")._id;
  const body = await ctx.req.json();

  try {
    const post = await Post.create({
      ...body,
      type: "image",
      status: "draft",
      createdBy: userId,
    });

    return ctx.json({
      success: true,
      data: post,
      message: "Image post created successfully",
    });
  } catch (error: any) {
    return ctx.json(
      {
        success: false,
        data: error,
        message: "Post not created",
      },
      error.status
    );
  }

  // const userId = await ctx.get("user")._id;
  // const body = await ctx.req.json();

  // try {
  //   console.log("body: ", body);

  //   const post = await Post.create({
  //     ...body,
  //     type: "image",
  //     createdBy: userId,
  //   });

  //   if (body?.scheduledAt) {
  //     await Schedule.create({
  //       createdBy: userId,
  //       postId: post?._id,
  //       status: "scheduled",
  //       scheduledAt: body.scheduledAt,
  //     });

  //     post.status = "scheduled";
  //     await post.save();

  //     return ctx.json(
  //       {
  //         success: true,
  //         data: post,
  //         message: "Post scheduled",
  //       },
  //       200
  //     );
  //   } else {
  //     const { data, error } = await imagePublish(post._id);

  //     return ctx.json(
  //       {
  //         success: true,
  //         data,
  //         message: "Post published",
  //       },
  //       200
  //     );
  //   }
  // } catch (error: any) {
  //   return ctx.json(
  //     {
  //       success: false,
  //       data: error,
  //       message: "Post not created",
  //     },
  //     error.status
  //   );
  // }
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
      400
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

  // commentary, scheduledAt, author, authorType,
  const body = await ctx.req.json();

  try {
    // const post = (await Post.findById(postId)) as any;
    const post = await Post.findByIdAndUpdate(postId, body, {
      new: true,
      runValidators: true,
    });
    console.log("=========================post", post);

    if (!post) {
      return ctx.json({ success: false, message: "Post not found" }, 404);
    }

    if (post.type === "carousel") {
      return carouselController({
        ctx,
        post,
        postId,
        userId,
        body,
      });
    } else if (post.type === "image") {
      return imageController({
        ctx,
        post,
        postId,
        userId,
        body,
      });
    } else if (post.type === "text") {
      return textController({
        ctx,
        post,
        postId,
        userId,
        body,
      });
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

const textController = async ({
  ctx,
  post,
  postId,
  userId,
  body,
}: {
  ctx: Context;
  post: any;
  postId: string;
  userId: string;
  body: any;
}) => {
  if (body?.scheduledAt) {
    // Schedule the post
    console.log("This is a text scheduled post");
    const schedule = await Schedule.findOneAndUpdate(
      { postId: postId },
      {
        createdBy: userId,
        postId: postId,
        status: "scheduled",
        scheduledAt: body.scheduledAt,
      },
      { new: true, upsert: true }
    );

    console.log("schedule", schedule);

    post.status = "scheduled";
    await post.save();

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
    console.log("This is a text published post");
    await post.save();

    const { data, error } = await textPublish(postId);

    return ctx.json({ success: true, data, message: "Post published" }, 200);
  }
};

const imageController = async ({
  ctx,
  post,
  postId,
  userId,
  body,
}: {
  ctx: Context;
  post: any;
  postId: string;
  userId: string;
  body: any;
}) => {
  if (body?.scheduledAt) {
    // Schedule the post
    console.log("This is a image scheduled post");
    const schedule = await Schedule.findOneAndUpdate(
      { postId: postId },
      {
        createdBy: userId,
        postId: postId,
        status: "scheduled",
        scheduledAt: body.scheduledAt,
      },
      { new: true, upsert: true }
    );

    console.log("schedule", schedule);

    post.status = "scheduled";
    await post.save();

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
    console.log("This is a image published post");
    await post.save();

    const { data, error } = await imagePublish(postId);

    return ctx.json({ success: true, data, message: "Post published" }, 200);
  }
};

const carouselController = async ({
  ctx,
  post,
  postId,
  userId,
  body,
}: {
  ctx: Context;
  post: any;
  postId: string;
  userId: string;
  body: any;
}) => {
  const { data: media, error: mediaError } = await generatePDF({
    carouselId: post.contentReference,
    userId,
  });

  if (mediaError) {
    return ctx.json({ success: false, message: mediaError }, 400);
  }

  if (body?.scheduledAt) {
    // Schedule the post
    console.log("This is a carousel scheduled post");
    await Schedule.findOneAndUpdate(
      { postId: postId },
      {
        createdBy: userId,
        postId: postId,
        status: "scheduled",
        scheduledAt: body.scheduledAt,
      },
      { new: true, upsert: true }
    );

    post.status = "scheduled";
    post.media = media;
    await post.save();

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
    console.log("This is a carousel  published post");
    post.media = media;
    await post.save();

    const { data, error } = await documentPublish(postId);

    return ctx.json({ success: true, data, message: "Post published" }, 200);
  }
};
