import { Hono } from "hono";
import { postController } from "../controllers";
import { protect } from "../middlewares";

const posts = new Hono();

// Get All Posts of a user
posts.get("/", protect, (c) => postController.getPosts(c));

export default posts;
