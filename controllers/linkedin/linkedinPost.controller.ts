import axios from "axios";
import { Context } from "hono";
import { Carousel, LinkedinProfile } from "../../models";
import generatePDF from "../../components/generatePDF";
import { file } from "bun";
import { AWSPut } from "../../utils/aws.util";
import Post from "../../models/post/post.model";
import publishPostLinkedin from "../../components/publishPostLinkedin";

/**
 * @api {post} /api/v1/linkedin/:orgId/post Linkedin Post
 * @apiGroup Management
 * @access private
 */
export const getPostById = async (ctx: Context) => {
  console.log("============= linkedinPost : ");
  const user = await ctx.get("user");

  const linkedinPostId = await ctx.req.param("linkedinPostId");

  console.log("linkedinPostId: ", linkedinPostId);

  const accessToken =
    user?.tokens?.management?.access_token || user?.tokens?.auth?.access_token;

  console.log("AccessToken: ", accessToken);

  // const url = `https://api.linkedin.com/rest/posts?q=authors&authors=List(${organizationId})`;
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
 * @api {post} /api/v1/linkedin/:orgId/post/text Linkedin Text Post
 * @apiGroup Management
 * @access private
 */
export const createTextPost = async (ctx: Context | any) => {
  const { commentary } = await ctx.req.json();

  const linkedinId = await ctx.req.param("linkedinId");
  const linkedinProfile = await LinkedinProfile.findOne({ linkedinId }).select(
    "type"
  );

  const user = await ctx.get("user");

  const accessToken =
    user?.tokens?.management?.access_token || user?.tokens?.auth?.access_token;

  const postData = {
    author:
      linkedinProfile?.type === "organization"
        ? `urn:li:organization:${linkedinId}`
        : `urn:li:person:${linkedinId}`,
    commentary: commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  const url = "https://api.linkedin.com/v2/posts";
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
    "X-RestLi-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };

  try {
    const responce = await axios.post(url, postData, { headers });

    console.log("linkedinTextPost : ", responce.data);

    return ctx.json(
      {
        status: 200,
        success: true,
        data: responce.data,
        message: "Linkedin text post",
      },
      200
    );
  } catch (err: any) {
    console.log("linkedinLogin : ", JSON.stringify(err?.response?.data));

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

export const getCarouselById = async (ctx: Context) => {
  try {
    const carouselId = await ctx.req.param("carouselId");

    const carousel = await Carousel.findById(carouselId).populate({
      path: "createdBy",
      select: "username firstName lastName email avatar",
    });

    return ctx.json({
      status: 200,
      success: true,
      data: carousel,
      message: "Carousel fetched successfully",
    });
  } catch (error: any) {
    console.log(error);
    return ctx.json(
      {
        status: error.status,
        success: false,
        data: error,
        message: "Carousel not found",
      },
      error.status
    );
  }
};

/**
 * @api {post} /api/v1/linkedin/:orgId/post/carousel Linkedin Carousel Post
 * @apiGroup Management
 * @access private
 */
export const createCarouselPost = async (ctx: Context | any) => {
  const { commentary, slides, customizations } = await ctx.req.json();

  const linkedinId = await ctx.req.param("linkedinId");
  const linkedinProfile = await LinkedinProfile.findOne({ linkedinId }).select(
    "type"
  );
  const user = await ctx.get("user");
  const accessToken =
    user?.tokens?.management?.access_token || user?.tokens?.auth?.access_token;

  // 0. Store the PDF Data in DB
  const carousel = (await Carousel.create({
    slides,
    customizations,
    createdBy: user?._id,
  })) as any;

  // 1. Get All the data from the request
  // 2. create PDF from the data
  // 3. Upload the PDF to the server / local storage
  const { data: filePath, error: pdfGenerationError } = await generatePDF(
    carousel._id
  );

  if (pdfGenerationError) {
    console.error("Error in PDF Generation: ", pdfGenerationError);

    return ctx.json({
      status: 400,
      success: false,
      data: null,
      message: "Failed to generate PDF",
    });
  }

  console.log("PDF URLS: ", filePath);

  // Read the file into a buffer
  const bunFile = file(filePath as any);
  const arrayBuffer = await bunFile.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  // Determine the file's MIME type
  const fileMimeType = bunFile.type;

  // 4. Register the Upload
  const registerResponse = await axios.post(
    "https://api.linkedin.com/rest/documents?action=initializeUpload",
    {
      initializeUploadRequest: {
        owner:
          linkedinProfile?.type === "organization"
            ? `urn:li:organization:${linkedinId}`
            : `urn:li:person:${linkedinId}`,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
        "X-RestLi-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
    }
  );

  const { uploadUrl, document } = registerResponse.data.value;

  // 5.  Upload the Document
  await axios.put(uploadUrl, fileBuffer, {
    headers: {
      "Content-Type": fileMimeType,
    },
  });

  // 6. Create the Post
  const postData = {
    author:
      linkedinProfile?.type === "organization"
        ? `urn:li:organization:${linkedinId}`
        : `urn:li:person:${linkedinId}`,
    commentary: commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    content: {
      media: {
        title: "Carousel PDF",
        id: document,
      },
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  await axios
    .post("https://api.linkedin.com/v2/posts", postData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    })
    .then((response) => {
      console.log(" response : ", response.data);
    })
    .catch((error) => {
      console.log(" error : ", error.response.data);
    });

  return ctx.json({
    status: 200,
    success: true,
    data: postData,
    message: "Carousel post created successfully",
  });
};

/**
 * @api {post} /api/v1/linkedin/:orgId/post/image Linkedin Image Post
 * @apiGroup Management
 * @access private
 */
export const createImagePost = async (ctx: Context | any) => {
  const userId = await ctx.get("user")._id;
  const linkedinId = await ctx.req.param("linkedinId");
  const linkedinProfile = await LinkedinProfile.findOne({ linkedinId }).select(
    "type"
  );

  const formData = await ctx.req.formData();
  const file = formData.get("file"); // Get the file
  const fileName = formData.get("fileName"); // Get the file
  const commentary = formData.get("commentary"); // Get other fields
  const scheduled = formData.get("scheduled"); // Get other fields
  const scheduledAt = formData.get("scheduledAt"); // Get other fields

  console.log("file : ", file);

  if (!file.type || !commentary) {
    return ctx.json(
      {
        status: 400,
        success: false,
        message: "Please provide an image and commentary",
      },
      400
    );
  }

  try {
    // Convert file to ArrayBuffer and then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const params = {
      Key: `linkedin/${userId}/images/${fileName}`,
      ContentType: file.type,
      Body: imageBuffer,
    };
    const mediaUrl = await AWSPut(params);

    console.log("mediaUrl : ", mediaUrl);

    // Create the post object
    const postData = {
      commentary,
      media: {
        name: fileName,
        fileType: file.type,
        url: mediaUrl,
      },
      type: "image",

      author: linkedinId,
      authorType: linkedinProfile?.type,
      createdBy: userId,

      status: "draft",
      scheduled: scheduled,
      published: false,
      scheduledAt: scheduledAt,
      // publishedAt: new Date(),
    };

    // Create the post
    const post = await Post.create(postData);

    if (!scheduled) {
      publishPostLinkedin(post?._id);
    }

    return ctx.json({
      status: 200,
      success: true,
      data: post,
      message: "Image post created successfully",
    });
  } catch (error: any) {
    console.error("Error in Image Post: ", error);
    return ctx.json({
      status: 400,
      success: false,
      data: error,
      message: "Failed to create image post",
    });
  }
};
