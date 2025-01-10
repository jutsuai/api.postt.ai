import axios from "axios";
import { Context } from "hono";
import { Carousel, LinkedinProfile } from "../../models";
import generatePDF from "../../components/generatePDF";
import { file } from "bun";
import { AWSPut } from "../../utils/aws.util";
import Post from "../../models/post/post.model";
import publishPostLinkedin from "../../components/publishPostLinkedin";
import getBinaryFromUrl from "../../components/getBinaryFromUrl";

/**
 * @api {get} /api/v1/linkedin/profiles get all linkedin profiles
 * @apiGroup Management
 * @access private
 */
export const getLinkedinProfiles = async (ctx: Context | any) => {
  const user = await ctx.get("user")?._id;

  try {
    const profiles = await LinkedinProfile.find({
      createdBy: user?._id,
    }).select("name slug logo description linkedinId type");

    return ctx.json({
      status: 200,
      success: true,
      data: profiles,
      message: "All linkedin profiles fetched successfully",
    });
  } catch (error: any) {
    return ctx.json(
      {
        status: 400,
        success: false,
        data: error,
        message: "Linkedin profiles not found",
      },
      400
    );
  }
};

/**
 * @api {get} /api/v1/linkedin/profiles/:profileId get linkedin profile
 * @apiGroup Management
 * @access private
 */
export const getLinkedinProfile = async (ctx: Context | any) => {
  const profileId = await ctx.req.param("profileId");

  try {
    const profile = await LinkedinProfile.findById(profileId);

    return ctx.json({
      status: 200,
      success: true,
      data: profile,
      message: "Linkedin profile fetched successfully",
    });
  } catch (error: any) {
    return ctx.json(
      {
        status: 400,
        success: false,
        data: error,
        message: "Linkedin profile not found",
      },
      400
    );
  }
};

/**
 * @api {post} /api/v1/linkedin/profiles Linkedin Post
 * @apiGroup Management
 * @access private
 */
export const createLinkedinProfile = async (ctx: Context | any) => {
  const user = await ctx.get("user")?._id;

  const body = await ctx.req.json();

  try {
    const profile = await LinkedinProfile.create({ ...body, createdBy: user });

    return ctx.json({
      status: 200,
      success: true,
      data: profile,
      message: "Linkedin profile created successfully",
    });
  } catch (error: any) {
    return ctx.json(
      {
        status: 400,
        success: false,
        data: error,
        message: "Failed to create linkedin profile",
      },
      400
    );
  }
};

/**
 * @api {put} /api/v1/linkedin/profiles/:profileId Linkedin Post
 * @apiGroup Management
 * @access private
 */
export const updateLinkedinProfile = async (ctx: Context | any) => {
  const profileId = await ctx.req.param("profileId");
  const body = await ctx.req.json();

  try {
    const profile = await LinkedinProfile.findByIdAndUpdate(profileId, body, {
      new: true,
      runValidators: true,
    });

    return ctx.json({
      status: 200,
      success: true,
      data: profile,
      message: "Linkedin profile updated successfully",
    });
  } catch (error: any) {
    return ctx.json(
      {
        status: 400,
        success: false,
        data: error,
        message: "Failed to update linkedin profile",
      },
      400
    );
  }
};

/**
 * @api {delete} /api/v1/linkedin/profiles/:profileId Linkedin Post
 * @apiGroup Management
 * @access private
 */
export const deleteLinkedinProfile = async (ctx: Context | any) => {
  const profileId = await ctx.req.param("profileId");

  try {
    await LinkedinProfile.findByIdAndDelete(profileId);

    return ctx.json({
      status: 200,
      success: true,
      message: "Linkedin profile deleted successfully",
    });
  } catch (error: any) {
    return ctx.json(
      {
        status: 400,
        success: false,
        data: error,
        message: "Failed to delete linkedin profile",
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

/**
 * @api {post} /api/v1/linkedin/:orgId/post/carousel Linkedin Carousel Post
 * @apiGroup Management
 * @access private
 */
export const createCarouselPost = async (ctx: Context | any) => {
  const user = await ctx.get("user");
  const profileId = await ctx.req.param("profileId");
  const linkedinProfile = await LinkedinProfile.findOne({
    linkedinId: profileId,
  }).select("type");
  const accessToken =
    user?.tokens?.management?.access_token || user?.tokens?.auth?.access_token;

  const {
    commentary,
    slides,
    customizations,

    carouselId,
  } = await ctx.req.json();

  // 0. Store the PDF Data in DB
  const carousel = carouselId
    ? ((await Carousel.findById(carouselId)) as any)
    : ((await Carousel.create({
        slides,
        customizations,
        createdBy: user?._id,
      })) as any);

  const { data: fileUrl, error: pdfGenerationError } = await generatePDF(
    carousel._id,
    user?._id
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

  console.log("filePath ================ : ", fileUrl);

  const { data: fileBufferData, error: fileBufferError } =
    await getBinaryFromUrl(fileUrl as any);

  if (fileBufferError) {
    console.error("Error in PDF Buffer: ", fileBufferError);

    return ctx.json({
      status: 400,
      success: false,
      data: null,
      message: "Failed to get PDF Buffer",
    });
  }

  const { buffer: fileBuffer, contentType: fileMimeType } =
    fileBufferData as any;

  console.log("fileBuffer : ", fileBuffer);
  console.log("fileMimeType : ", fileMimeType);
  console.log("profileId : ", profileId);

  // 4. Register the Upload
  const registerResponse = await axios.post(
    "https://api.linkedin.com/rest/documents?action=initializeUpload",
    {
      initializeUploadRequest: {
        owner:
          linkedinProfile?.type === "organization"
            ? `urn:li:organization:${profileId}`
            : `urn:li:person:${profileId}`,
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

  console.log("uploadUrl : ", uploadUrl);

  // 5.  Upload the Document
  await axios.put(uploadUrl, fileBuffer, {
    headers: {
      "Content-Type": fileMimeType,
    },
  });

  console.log("======== =555");
  // 6. Create the Post
  const postData = {
    author:
      linkedinProfile?.type === "organization"
        ? `urn:li:organization:${profileId}`
        : `urn:li:person:${profileId}`,
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
  console.log("======== =6666");

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
  console.log("======== =777");

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
  const linkedinId = await ctx.req.param("profileId");
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
