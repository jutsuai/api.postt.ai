import { Hono } from "hono";
import { assetController } from "../controllers";
import { protect } from "../middlewares";

const assets = new Hono();

/* <!-- Asset Management Routes (/assets) --> */

// Carousel Assets
// Get all carousel data for the authenticated user
assets.get("/carousels", protect, (c) => assetController.getAllCarousels(c));

// Get details of a specific carousel
assets.get("/carousels/:carouselId", protect, (c) =>
  assetController.getCarouselById(c)
);

// Video Assets
// Get all video assets for the authenticated user
assets.get("/video", protect, (c) => assetController.getAllVideos(c));

// Get details of a specific video
assets.get("/video/:videoId", protect, (c) => assetController.getVideoById(c));

// // General Media Asset Management
// // Upload a new media asset
// assets.post("/", protect, (c) => assetController.createTextPost(c));

// // Delete a specific asset
// assets.delete("/:assetId", protect, (c) => assetController.deletePost(c));

export default assets;
