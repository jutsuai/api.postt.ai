import axios from "axios";
import { Context } from "hono";
import { Carousel, LinkedinProfile } from "../../models";
import generatePDF from "../../components/generatePDF";
import { file } from "bun";

/**
 * @api {post} /api/v1/linkedin/:orgId/post Linkedin Post
 * @apiGroup Management
 * @access private
 */
export const getAllPost = async (ctx: Context) => {
  // console.log("============= linkedinPost : ", await ctx.req.json());
  // const { orgId } = await ctx.req.json();

  console.log("============= linkedinPost : ");

  const user = await ctx.get("user");
  const accessToken =
    user?.tokens?.management?.access_token || user?.tokens?.auth?.access_token;

  // const url = `https://api.linkedin.com/rest/posts?q=authors&authors=List(${organizationId})`;
  const url = `https://api.linkedin.com/v2/rest/posts`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
    "X-RestLi-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };
  console.log("============= linkedinPost headers : ", headers);

  try {
    const responce = await axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": process.env.LINKEDIN_API_VERSION,
          "Content-Type": "application/json",
        },

        params: {
          q: "authors",
          // authors: organizationId, // Use URN format
          authors: `List(urn:li:organization:91137041)`,
          start: 0,
          count: 10,
        },
      })
      .then((res) => {
        console.log("linkedinPost : ", res.data);
        return res.data;
      })
      .catch((err) => {
        console.log("linkedinPost error : ", err.response.data);
      });

    // const responce = await restliClient.get({
    //   resourcePath: "/posts",

    //   queryParams: {
    //     q: "authors",
    //     // vanityName: organizationId,
    //     authors: `List(${organizationId})`,
    //   },

    //   accessToken: accessToken,
    // });

    console.log("linkedinPost : ", responce);

    return ctx.json(
      {
        status: 200,
        success: true,
        data: responce,
        message: "Linkedin post",
      },
      200
    );
  } catch (err: any) {
    console.log("linkedinLogin  error  : ", err);

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
