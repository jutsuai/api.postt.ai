import { Hono } from "hono";
import { linkedinPostController } from "../../controllers";
import { protect } from "../../middlewares";

const profiles = new Hono();

// profiles.get("/posts/:linkedinPostId", protect, (c) =>
//   linkedinPostController.getPostById(c)
// );

// profiles.get("/carousel/:carouselId", (c) =>
//   linkedinPostController.getCarouselById(c)
// );

// // // Linkedin Post
// // profiles.get("/:linkedinId/post", protect, (c) =>
// //   linkedinPostController.getAllPost(c)
// // );

// ### LinkedIn Profiles (/linkedin/profiles)
// Get all LinkedIn profiles for the authenticated user
profiles.get("/", protect, (c) =>
  linkedinPostController.getLinkedinProfiles(c)
);

// Get details of a specific LinkedIn profile
profiles.get("/:profileId", protect, (c) =>
  linkedinPostController.getLinkedinProfile(c)
);

// Delete a specific LinkedIn profile
profiles.delete("/:profileId", protect, (c) =>
  linkedinPostController.deleteLinkedinProfile(c)
);

// Create a new LinkedIn profile
profiles.post("/", protect, (c) =>
  linkedinPostController.createLinkedinProfile(c)
);

// Update a specific LinkedIn profile
profiles.put("/:profileId", protect, (c) =>
  linkedinPostController.updateLinkedinProfile(c)
);

// Delete a specific LinkedIn profile
profiles.delete("/:profileId", protect, (c) =>
  linkedinPostController.deleteLinkedinProfile(c)
);

profiles.post("/:profileId/post/carousel", protect, (c) =>
  linkedinPostController.createCarouselPost(c)
);

// // ### LinkedIn Posts (/linkedin/profiles/:profileId/posts)
// // Get all posts for a LinkedIn profile
// profiles.get("/:profileId/posts", protect, (c) =>
//   linkedinPostController.getAllPosts(c)
// );

// // Get details of a specific post for a LinkedIn profile
// profiles.get("/:profileId/posts/:postId", protect, (c) =>
//   linkedinPostController.getPostById(c)
// );

// // Filter posts for a LinkedIn profile by type
// profiles.get("/:profileId/posts/:type", protect, (c) =>
//   linkedinPostController.getPostByType(c)
// );

/*
// Delete a specific LinkedIn profile
// text profiles
profiles.post("/:profileId/post/text", protect, (c) =>
  linkedinPostController.createTextPost(c)
);

// carousel post
profiles.post("/:profileId/post/carousel", protect, (c) =>
  linkedinPostController.createCarouselPost(c)
);

// carousel post
profiles.post("/:profileId/post/image", protect, (c) =>
  linkedinPostController.createImagePost(c)
);
*/
export default profiles;
