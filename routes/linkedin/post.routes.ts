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

// carousel post
post.post("/:linkedinId/post/carousel", protect, (c) =>
  linkedinPostController.createCarouselPost(c)
);

// carousel post
post.post("/:linkedinId/post/image", protect, (c) =>
  linkedinPostController.createImagePost(c)
);

export default post;
