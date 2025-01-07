import { Hono } from "hono";
import { linkedinPostController } from "../../controllers";
import { protect } from "../../middlewares";

const post = new Hono();

// text post
post.post("/:orgId/post/text", protect, (c) =>
  linkedinPostController.linkedinTextPost(c)
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
