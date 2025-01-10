import { Hono } from "hono";
import { linkedinApi } from "../../controllers";
import { protect } from "../../middlewares";

const management = new Hono();

management.get("/", protect, (c) => linkedinApi.linkedinLogin(c));

// Linkedin Callback
management.post("/callback", protect, (c) => linkedinApi.linkedinCallback(c));

// Linkedin Refresh Token
management.post("/refresh", protect, (c) =>
  linkedinApi.linkedinRefreshToken(c)
);

// Linkedin load Image
management.get("/image/:imageUrn", protect, (c) => linkedinApi.loadImage(c));

// Get User Details
management.get("/me", protect, (c) => linkedinApi.getUserDetails(c));

// Get Organization List for DB
management.get("/organizations", protect, (c) =>
  linkedinApi.getOrganizationListFormDB(c)
);

// Get Organization List for Linkedin
management.get("/organizations/sync", protect, (c) =>
  linkedinApi.getOrganizationListFormLinkedin(c)
);

export default management;
