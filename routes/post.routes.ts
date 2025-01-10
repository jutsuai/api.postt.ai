import { Hono } from "hono";
import { postController } from "../controllers";
import { protect } from "../middlewares";

const posts = new Hono();

/* <!-- General Routes --> */
// Get all posts for the authenticated user
posts.get("/", protect, (c) => postController.getAllPosts(c));

// Get details of a specific post
posts.get("/:postId", protect, (c) => postController.getPostById(c));

// Get details of a specific post sync
posts.get("/:postId/sync", protect, (c) => postController.getPostById(c));

// Update a specific post
posts.put("/:postId", protect, (c) => postController.updatePost(c));

// Delete a specific post
posts.delete("/:postId", protect, (c) => postController.deletePost(c));

/* <!-- Specific Routes for Post Types --> */
// Create a text post
posts.post("/text", protect, (c) => postController.createTextPost(c));

// Create a image post
posts.post("/image", protect, (c) => postController.createImagePost(c));

// Create a video post
posts.post("/video", protect, (c) => postController.createVideoPost(c));

// Create a carousel post
posts.post("/carousel", protect, (c) => postController.createCarouselPost(c));

export default posts;
