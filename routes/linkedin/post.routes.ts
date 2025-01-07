import { Hono } from "hono";
import { linkedinPostController } from "../../controllers";
import { protect } from "../../middlewares";

const post = new Hono();

post.get("/carousel/:carouselId", (c) =>
  linkedinPostController.getCarouselById(c)
);

// Linkedin Post
post.get("/:linkedinId/post", protect, (c) =>
  linkedinPostController.getAllPost(c)
);

// text post
post.post("/:linkedinId/post/text", protect, (c) =>
  linkedinPostController.createTextPost(c)
);

// // image post
// post.post("/:linkedinId/post/image", protect, (c) =>
//   linkedinPostController.createImagePost(c)
// );

// carousel post
post.post("/:linkedinId/post/carousel", protect, (c) =>
  linkedinPostController.createCarouselPost(c)
);

// // Linkedin Callback
// post.post("/callback", protect, (c) =>
//   linkedinPostController.linkedinCallback(c)
// );

// // Linkedin Refresh Token
// post.post("/refresh", protect, (c) =>
//   linkedinPostController.linkedinRefreshToken(c)
// );

// // Get User Details
// post.get("/user", protect, (c) => linkedinPostController.getUserDetails(c));

// // Get Organization List for DB
// post.get("/organizationList", protect, (c) =>
//   linkedinPostController.getOrganizationListFormDB(c)
// );

// // Get Organization List for Linkedin
// post.post("/organizationList", protect, (c) =>
//   linkedinPostController.getOrganizationListFormLinkedin(c)
// );

export default post;
